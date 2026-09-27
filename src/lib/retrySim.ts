/**
 * A toy, honest model of the Engati auto-retry framework. It never touches the page, so it can be tested;
 * the playground draws whatever state it is in after each `step(dt)`.
 *
 * Triggers travel integrations → api-gateway → trigger-mvc → messaging → meta; messaging keeps each one's
 * trackerId in Redis. Meta fails some deliveries, and each failure comes back as a webhook: webhook-receiver →
 * analytics pipeline (which records the reason) → trigger-mvc. trigger-mvc checks the status code; a retryable
 * failure waits in RabbitMQ with exponential back-off, then trigger-mvc reads its trackerId from Redis, fetches
 * the original payload from MongoDB and sends it out through messaging again.
 */

export type NodeId = 'src' | 'gw' | 'ats' | 'msg' | 'meta' | 'wh' | 'an' | 'mongo' | 'rmq' | 'redis';
export type PacketKind = 'send' | 'you' | 'hook' | 'retry';
export type DropReason = 'non-retryable' | 'retries-off' | 'gave-up';

export const RULES = {
  /** New triggers a second. */
  triggerRate: 2.6,
  /** Travel speed, in px a second. */
  speed: 210,
  /** The chance Meta fails a delivery: on a first attempt, on a retry, and while it is sending error webhooks. */
  failFirst: 0.35,
  failRetry: 0.15,
  failErrorWebhooks: 0.9,
  /** The chance a failure's status code is worth retrying. */
  retryable: 0.7,
  maxAttempts: 3,
  /** Retry n waits backoff × 2^(n − 1) seconds in RabbitMQ: 1.5 s, then 3 s. */
  backoff: 1.5,
  /** How long a burst of error webhooks lasts. */
  errorWebhookSeconds: 5,
} as const;

export interface Packet {
  /** A short trackerId, e.g. "4f1c2a". */
  id: string;
  kind: PacketKind;
  path: NodeId[];
  /** The segment being travelled: path[seg] → path[seg + 1]. */
  seg: number;
  /** How far along that segment, from 0 to 1. */
  t: number;
  /** Counts route changes, so a renderer knows when to start a fresh trail. */
  leg: number;
  attempt: number;
  /** When a queued retry leaves RabbitMQ, in sim seconds; 0 when not queued. */
  until: number;
  /** How long it is queued for. */
  wait: number;
  delivered: boolean;
  dropped: boolean;
  /** A dropped packet fades from 1 to 0, then disappears. */
  fade: number;
}

export type SimEvent =
  | { type: 'arrived'; node: NodeId }
  | { type: 'delivered'; id: string; attempt: number }
  | { type: 'dropped'; id: string; attempt: number; reason: DropReason }
  | { type: 'retrying'; id: string }
  | { type: 'queued'; id: string; attempt: number; wait: number }
  /** A retry is back at trigger-mvc, which reads its trackerId from Redis and its payload from MongoDB. */
  | { type: 'fetched'; id: string }
  | { type: 'error-webhooks-over' };

export interface RetrySimOptions {
  /** Numbers in [0, 1); tests pass a seeded one. */
  random?: () => number;
  /** An edge's length in px, from the current layout. */
  distance?: (from: NodeId, to: NodeId) => number;
}

const MAIN_ROUTE: NodeId[] = ['src', 'gw', 'ats', 'msg', 'meta'];

export class RetrySim {
  /** Sim time, in seconds. */
  time = 0;
  retryOn = true;
  /** Triggers sent so far. */
  sent = 0;
  /** Deliveries that only succeeded because of a retry. */
  saved = 0;
  packets: Packet[] = [];

  private errorWebhooksUntil = -1;
  private due = 0;
  private visitorTimes: number[] = [];
  private readonly random: () => number;
  private readonly distance: (from: NodeId, to: NodeId) => number;

  constructor({ random = Math.random, distance = () => 200 }: RetrySimOptions = {}) {
    this.random = random;
    this.distance = distance;
  }

  /** Whether Meta is answering most deliveries with failure webhooks. It is still up: it just reports failures. */
  get errorWebhooks(): boolean {
    return this.time < this.errorWebhooksUntil;
  }

  /** Retries waiting in RabbitMQ. */
  get queued(): number {
    return this.packets.filter((p) => p.until > 0).length;
  }

  setRetry(on: boolean): void {
    this.retryOn = on;
  }

  /** Starts a burst of error webhooks from Meta. Returns false while one is already running. */
  startErrorWebhooks(seconds: number = RULES.errorWebhookSeconds): boolean {
    if (this.errorWebhooks) return false;
    this.errorWebhooksUntil = this.time + seconds;
    return true;
  }

  /** Sends `count` triggers for a visitor, `gap` seconds apart. */
  send(count = 5, gap = 0.12): void {
    for (let i = 0; i < count; i++) this.visitorTimes.push(this.time + i * gap);
  }

  /** Runs for `seconds` so the model opens in a steady state, then clears the counters. */
  warmUp(seconds: number, dt = 1 / 30): void {
    for (let t = 0; t < seconds; t += dt) this.step(dt);
    this.sent = 0;
    this.saved = 0;
  }

  step(dt: number): SimEvent[] {
    const events: SimEvent[] = [];
    const wasSending = this.errorWebhooks;
    this.time += dt;
    if (wasSending && !this.errorWebhooks) events.push({ type: 'error-webhooks-over' });

    this.due += dt * RULES.triggerRate;
    while (this.due >= 1) {
      this.due -= 1;
      this.launch('send');
    }
    while (this.visitorTimes.length > 0 && this.visitorTimes[0] <= this.time) {
      this.visitorTimes.shift();
      this.launch('you');
    }

    for (const p of this.packets) this.advance(p, dt, events);
    this.packets = this.packets.filter((p) => !p.delivered && !(p.dropped && p.fade <= 0));
    return events;
  }

  /** The share of `n` fresh messages that would fail under the rules as they stand now. */
  sampleFailureRate(n = 400): number {
    let failed = 0;
    for (let i = 0; i < n; i++) if (this.wouldFail()) failed += 1;
    return failed / n;
  }

  private failChance(attempt: number): number {
    if (this.errorWebhooks) return RULES.failErrorWebhooks;
    return attempt > 1 ? RULES.failRetry : RULES.failFirst;
  }

  private wouldFail(): boolean {
    for (let attempt = 1; ; attempt++) {
      if (this.random() >= this.failChance(attempt)) return false;
      if (this.random() >= RULES.retryable || !this.retryOn || attempt >= RULES.maxAttempts) return true;
    }
  }

  private launch(kind: 'send' | 'you'): void {
    this.sent += 1;
    const id = Math.floor(this.random() * 0xffffff).toString(16).padStart(6, '0');
    this.packets.push({
      id, kind, path: MAIN_ROUTE, seg: 0, t: 0, leg: 0, attempt: 1,
      until: 0, wait: 0, delivered: false, dropped: false, fade: 1,
    });
  }

  private route(p: Packet, kind: PacketKind, path: NodeId[]): void {
    p.kind = kind;
    p.path = path;
    p.seg = 0;
    p.t = 0;
    p.leg += 1;
  }

  private advance(p: Packet, dt: number, events: SimEvent[]): void {
    if (p.dropped) {
      p.fade -= dt * 1.6;
      return;
    }
    if (p.until > 0) {
      if (this.time < p.until) return;
      // Back-off over: back to trigger-mvc, which fetches the payload and sends it out through messaging.
      p.until = 0;
      this.route(p, 'retry', ['rmq', 'ats', 'msg', 'meta']);
    }
    const from = p.path[p.seg];
    const to = p.path[p.seg + 1];
    p.t += (RULES.speed * dt) / Math.max(1, this.distance(from, to));
    if (p.t < 1) return;
    p.seg += 1;
    p.t = 0;
    events.push({ type: 'arrived', node: to });
    if (p.kind === 'retry' && from === 'rmq') events.push({ type: 'fetched', id: p.id });
    if (p.seg === p.path.length - 1) this.reach(p, to, events);
  }

  private reach(p: Packet, node: NodeId, events: SimEvent[]): void {
    if (node === 'meta') {
      if (this.random() >= this.failChance(p.attempt)) {
        p.delivered = true;
        if (p.attempt > 1) this.saved += 1;
        events.push({ type: 'delivered', id: p.id, attempt: p.attempt });
      } else {
        this.route(p, 'hook', ['meta', 'wh', 'an', 'ats']);
      }
    } else if (node === 'ats') {
      // A failure reported back through the webhook receiver and the analytics pipeline.
      const reason: DropReason | null =
        this.random() >= RULES.retryable
          ? 'non-retryable'
          : !this.retryOn
            ? 'retries-off'
            : p.attempt >= RULES.maxAttempts
              ? 'gave-up'
              : null;
      if (reason) {
        p.dropped = true;
        events.push({ type: 'dropped', id: p.id, attempt: p.attempt, reason });
      } else {
        this.route(p, 'retry', ['ats', 'rmq']);
        events.push({ type: 'retrying', id: p.id });
      }
    } else if (node === 'rmq') {
      p.wait = RULES.backoff * 2 ** (p.attempt - 1);
      p.until = this.time + p.wait;
      p.attempt += 1;
      events.push({ type: 'queued', id: p.id, attempt: p.attempt, wait: p.wait });
    }
  }
}
