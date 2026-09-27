import { formatIST } from '../lib/clock';
import { RULES, RetrySim, type DropReason, type SimEvent } from '../lib/retrySim';
import { onFrame, prefersReducedMotion } from './motion';
import { createScene } from './playground-scene';
import { setSiteStatus } from './status';

type Level = 'INFO' | 'OK' | 'WARN' | 'ERR' | 'YOU';

const DROPPED: Record<DropReason, string> = {
  'non-retryable': 'non-retryable status · not retried',
  'retries-off': 'retryable, but the framework is OFF',
  'gave-up': `gave up after ${RULES.maxAttempts} attempts`,
};

function start(root: HTMLElement): void {
  const $ = <T extends Element>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`Playground markup is missing ${selector}`);
    return el;
  };
  const model = $<HTMLElement>('[data-model]');
  const stage = $<HTMLElement>('[data-stage]');
  const canvas = $<HTMLCanvasElement>('[data-canvas]');
  const logs = $<HTMLElement>('[data-logs]');
  const framework = $<HTMLButtonElement>('[data-retry-switch]');
  const frameworkLabel = $<HTMLElement>('[data-switch-label]');
  const outageButton = $<HTMLButtonElement>('[data-outage]');
  const sendButton = $<HTMLButtonElement>('[data-send]');
  const playButton = $<HTMLButtonElement>('[data-play]');
  const failRate = $<HTMLElement>('[data-metric="fail"]');
  const inQueue = $<HTMLElement>('[data-metric="queue"]');
  const savedCount = $<HTMLElement>('[data-metric="saved"]');
  const scene = createScene(stage, canvas);
  if (!scene) return;

  const sim = new RetrySim({ distance: scene.distance });
  // The model runs while its area is on screen; the canvas is only redrawn while it is itself on screen.
  let visible = false;
  let drawn = false;
  let booted = false;
  // With reduced motion the model waits behind a Play button.
  let paused = prefersReducedMotion();
  let rate = 0.12;
  let hudAt = 0;
  let lastLog = -Infinity;

  /** Adds a line to the six-line log. `gap` (in sim seconds) keeps frequent lines from flooding it. */
  const log = (level: Level, text: string, gap = 0) => {
    if (sim.time - lastLog < gap) return;
    lastLog = sim.time;
    const line = document.createElement('div');
    line.className = 'l';
    const tag = document.createElement('span');
    tag.className = `lv ${level}`;
    tag.textContent = level;
    line.append(`${formatIST(new Date()).slice(0, 8)} `, tag, ` ${text}`);
    logs.append(line);
    while (logs.children.length > 6) logs.firstElementChild?.remove();
  };

  const handle = (events: SimEvent[]) => {
    scene.effects(events);
    for (const event of events) {
      if (event.type === 'delivered' && event.attempt > 1) {
        log('OK', `tr_${event.id} delivered on attempt ${event.attempt}`, 0.8);
      } else if (event.type === 'dropped') {
        log('ERR', `tr_${event.id} ${DROPPED[event.reason]}`, 1.2);
      } else if (event.type === 'queued') {
        log('INFO', `tr_${event.id} queued · retry in ${event.wait.toFixed(1)}s (attempt ${event.attempt})`, 1.4);
      } else if (event.type === 'outage-over') {
        setSiteStatus('ok');
        outageButton.disabled = false;
        log('OK', 'meta recovered · retry queue draining');
      }
    }
  };

  /** The panel's numbers. The failure rate is a large sample of the same rules, eased so it moves smoothly. */
  const hud = () => {
    rate += (sim.sampleFailureRate(400) - rate) * 0.35;
    failRate.textContent = `${(rate * 100).toFixed(1)}%`;
    failRate.classList.remove('good', 'warn', 'bad');
    failRate.classList.add(rate > 0.5 ? 'bad' : rate >= 0.2 ? 'warn' : 'good');
    inQueue.textContent = String(sim.queued);
    savedCount.textContent = sim.saved.toLocaleString('en-IN');
  };

  // Using any control starts the model (warming it up first, so its warm-up can't swallow what the control does)
  // and unpauses it.
  const play = () => {
    if (!booted) boot();
    paused = false;
    playButton.hidden = true;
  };

  const boot = () => {
    booted = true;
    scene.resize();
    // Twenty simulated seconds, so it opens mid-flow instead of empty.
    sim.warmUp(20);
    log('INFO', 'retry framework running · ~2M triggers a day in production');
    log('YOU', 'try it: switch it off, or simulate a Meta outage');
    hud();
    scene.draw(sim);
    if (paused) playButton.hidden = false;
  };

  framework.addEventListener('click', () => {
    play();
    sim.setRetry(!sim.retryOn);
    framework.setAttribute('aria-checked', String(sim.retryOn));
    frameworkLabel.textContent = sim.retryOn ? 'ON' : 'OFF';
    if (sim.retryOn) log('OK', 'retry framework ON · retryable failures get re-sent');
    else log('WARN', 'retry framework OFF · failed deliveries are lost');
  });

  outageButton.addEventListener('click', () => {
    play();
    if (!sim.startOutage()) return;
    outageButton.disabled = true;
    setSiteStatus('degraded', 'meta outage · retrying');
    log('WARN', 'meta delivery failures spiking (simulated outage)');
  });

  const send = () => {
    play();
    sim.send(5);
    log('YOU', 'you sent 5 triggers through the integrations');
  };
  sendButton.addEventListener('click', send);
  canvas.addEventListener('click', send);
  playButton.addEventListener('click', play);

  canvas.addEventListener('mousemove', (event) => {
    const box = canvas.getBoundingClientRect();
    scene.hover(scene.nodeAt(event.clientX - box.left, event.clientY - box.top));
  });
  canvas.addEventListener('mouseleave', () => scene.hover(null));

  const relayout = () => {
    if (!booted) return;
    scene.resize();
    scene.draw(sim);
  };
  new ResizeObserver(relayout).observe(stage);
  document.fonts?.ready.then(relayout);
  document.addEventListener('site:theme', () => {
    scene.retheme();
    if (booted) scene.draw(sim);
  });

  // The whole area, not just the canvas: on phones the numbers and the switch sit below the canvas,
  // and flipping the switch there must still move them.
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !booted) boot();
    },
    { threshold: 0.15 },
  ).observe(model);
  new IntersectionObserver(([entry]) => {
    drawn = entry.isIntersecting;
  }).observe(stage);

  onFrame((now, dt) => {
    if (!booted || paused) return;
    // Off-screen the model rests, except that a running outage still has to end on time.
    if (!visible && !sim.outage) return;
    handle(sim.step(dt));
    scene.age(dt);
    if (drawn) scene.draw(sim);
    if (now >= hudAt) {
      hudAt = now + 300;
      hud();
    }
  });
}

const root = document.querySelector<HTMLElement>('[data-playground]');
if (root) start(root);
