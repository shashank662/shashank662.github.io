import { describe, expect, it } from 'vitest';
import { RetrySim, RULES, type SimEvent } from '../../src/lib/retrySim';

/** mulberry32: a tiny seeded random-number generator, so every run sees the same numbers. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs the model for `seconds` and returns everything that happened. */
function run(sim: RetrySim, seconds: number, dt = 1 / 30): SimEvent[] {
  const events: SimEvent[] = [];
  for (let t = 0; t < seconds; t += dt) events.push(...sim.step(dt));
  return events;
}

type Of<T extends SimEvent['type']> = Extract<SimEvent, { type: T }>;
const only = <T extends SimEvent['type']>(events: SimEvent[], type: T) =>
  events.filter((e): e is Of<T> => e.type === type);

/** The share of finished messages that were dropped rather than delivered. */
function failureRate(events: SimEvent[]): number {
  const delivered = only(events, 'delivered').length;
  const dropped = only(events, 'dropped').length;
  return dropped / (delivered + dropped);
}

describe('RetrySim', () => {
  it('sends about 2.6 triggers a second', () => {
    const sim = new RetrySim({ random: seeded(1) });
    run(sim, 10);
    expect(sim.sent).toBeGreaterThanOrEqual(25);
    expect(sim.sent).toBeLessThanOrEqual(26);
  });

  it('settles near a 12% failure rate with retries on', () => {
    const rate = failureRate(run(new RetrySim({ random: seeded(2) }), 2000));
    expect(Math.abs(rate - 0.12)).toBeLessThan(0.03);
  });

  it('settles near 35% with retries off, and never retries', () => {
    const sim = new RetrySim({ random: seeded(3) });
    sim.setRetry(false);
    const events = run(sim, 2000);
    expect(Math.abs(failureRate(events) - 0.35)).toBeLessThan(0.03);
    expect(only(events, 'queued')).toHaveLength(0);
    expect(only(events, 'retrying')).toHaveLength(0);
  });

  it('makes at most three attempts', () => {
    const events = run(new RetrySim({ random: seeded(4) }), 2000);
    const attempts = [...only(events, 'delivered'), ...only(events, 'dropped')].map((e) => e.attempt);
    expect(Math.max(...attempts)).toBe(RULES.maxAttempts);
    const gaveUp = only(events, 'dropped').filter((e) => e.reason === 'gave-up');
    expect(gaveUp.length).toBeGreaterThan(0);
    expect(gaveUp.every((e) => e.attempt === 3)).toBe(true);
  });

  it('backs off 1.5 s before the second attempt and 3 s before the third', () => {
    const queued = only(run(new RetrySim({ random: seeded(5) }), 600), 'queued');
    expect(new Set(queued.filter((e) => e.attempt === 2).map((e) => e.wait))).toEqual(new Set([1.5]));
    expect(new Set(queued.filter((e) => e.attempt === 3).map((e) => e.wait))).toEqual(new Set([3]));
  });

  it('counts a delivery as saved only when a retry made it', () => {
    const sim = new RetrySim({ random: seeded(6) });
    const events = run(sim, 600);
    expect(sim.saved).toBeGreaterThan(0);
    expect(sim.saved).toBe(only(events, 'delivered').filter((e) => e.attempt > 1).length);
  });

  it('has Meta send error webhooks for five seconds, one burst at a time', () => {
    const sim = new RetrySim({ random: seeded(7) });
    expect(sim.startErrorWebhooks()).toBe(true);
    expect(sim.errorWebhooks).toBe(true);
    expect(sim.startErrorWebhooks()).toBe(false);
    expect(only(run(sim, 5.2), 'error-webhooks-over')).toHaveLength(1);
    expect(sim.errorWebhooks).toBe(false);
  });

  it('estimates the headline rate from the same rules: ~12% on, ~35% off, ~80% while Meta sends error webhooks', () => {
    const sim = new RetrySim({ random: seeded(8) });
    expect(Math.abs(sim.sampleFailureRate(8000) - 0.12)).toBeLessThan(0.03);
    sim.setRetry(false);
    expect(Math.abs(sim.sampleFailureRate(8000) - 0.35)).toBeLessThan(0.03);
    sim.setRetry(true);
    sim.startErrorWebhooks();
    expect(Math.abs(sim.sampleFailureRate(8000) - 0.8)).toBeLessThan(0.03);
  });

  it('reports a failed delivery back through the webhook receiver and the analytics pipeline to trigger-mvc', () => {
    const sim = new RetrySim({ random: seeded(11) });
    const routes = new Set<string>();
    for (let t = 0; t < 30; t += 1 / 30) {
      sim.step(1 / 30);
      for (const p of sim.packets) if (p.kind === 'hook') routes.add(p.path.join(' → '));
    }
    expect([...routes]).toEqual(['meta → wh → an → ats']);
  });

  it('holds a retry in RabbitMQ, then trigger-mvc fetches its payload and sends it out through messaging again', () => {
    const sim = new RetrySim({ random: seeded(12) });
    const routes = new Set<string>();
    const events: SimEvent[] = [];
    for (let t = 0; t < 60; t += 1 / 30) {
      events.push(...sim.step(1 / 30));
      for (const p of sim.packets) if (p.kind === 'retry') routes.add(p.path.join(' → '));
    }
    expect([...routes].sort()).toEqual(['ats → rmq', 'rmq → ats → msg → meta']);
    const fetched = only(events, 'fetched').length;
    expect(fetched).toBeGreaterThan(0);
    expect(fetched).toBeLessThanOrEqual(only(events, 'queued').length);
  });

  it("sends a visitor's triggers a little apart", () => {
    const sim = new RetrySim({ random: seeded(9) });
    sim.send(5);
    run(sim, 0.05);
    expect(sim.packets.filter((p) => p.kind === 'you')).toHaveLength(1);
    run(sim, 0.5);
    expect(sim.packets.filter((p) => p.kind === 'you')).toHaveLength(5);
  });

  it('warms up into a steady state with fresh counters', () => {
    const sim = new RetrySim({ random: seeded(10) });
    sim.warmUp(20);
    expect(sim.time).toBeCloseTo(20, 0);
    expect(sim.packets.length).toBeGreaterThan(5);
    expect(sim.sent).toBe(0);
    expect(sim.saved).toBe(0);
  });
});
