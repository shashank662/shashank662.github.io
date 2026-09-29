import { formatUptime } from '../lib/clock';

const header = document.querySelector<HTMLElement>('[data-header]');
const progress = document.querySelector<HTMLElement>('[data-progress]');

function onScroll(): void {
  header?.classList.toggle('scrolled', scrollY > 30);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress?.style.setProperty('transform', `scaleX(${max > 0 ? scrollY / max : 0})`);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const started = performance.now();
function everySecond(): void {
  const up = formatUptime((performance.now() - started) / 1000);
  document.querySelectorAll('[data-uptime]').forEach((el) => {
    el.textContent = up;
  });
}
everySecond();
setInterval(everySecond, 1000);

addEventListener('load', () => {
  // loadEventEnd is filled in only after load handlers finish, so read it on the next task.
  setTimeout(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const ms = Math.round(nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now());
    document.querySelectorAll('[data-load-ms]').forEach((el) => {
      el.textContent = `${ms} ms`;
    });
  }, 0);
});
