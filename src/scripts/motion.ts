const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = matchMedia('(pointer: fine)');

export const prefersReducedMotion = (): boolean => reducedMotion.matches;
export const finePointer = (): boolean => finePointerQuery.matches;

export type FrameFn = (now: number, dt: number) => void;

const subscribers = new Set<FrameFn>();
let last = 0;
let running = false;

function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  subscribers.forEach((fn) => fn(now, dt));
  if (subscribers.size > 0) requestAnimationFrame(tick);
  else running = false;
}

/** One animation loop for the whole page. `dt` is in seconds, capped at 50 ms. Returns an unsubscribe function. */
export function onFrame(fn: FrameFn): () => void {
  subscribers.add(fn);
  if (!running) {
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }
  return () => {
    subscribers.delete(fn);
  };
}
