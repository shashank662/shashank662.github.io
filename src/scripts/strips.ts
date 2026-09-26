import { onFrame, prefersReducedMotion } from './motion';

const wrap = document.querySelector<HTMLElement>('[data-strips]');

if (wrap && !prefersReducedMotion()) {
  const rows = [...wrap.querySelectorAll<HTMLElement>('[data-strip]')];
  const offsets = rows.map(() => 0);
  // Each row holds its items twice, so shifting by half its width loops seamlessly.
  let half = rows.map((row) => row.scrollWidth / 2);
  const measure = () => {
    half = rows.map((row) => row.scrollWidth / 2);
  };
  let velocity = 0;
  let direction = 1;
  let lastY = scrollY;
  let visible = false;

  addEventListener(
    'scroll',
    () => {
      const delta = scrollY - lastY;
      lastY = scrollY;
      if (delta === 0) return;
      direction = delta > 0 ? 1 : -1;
      velocity = Math.min(60, velocity + Math.abs(delta) * 0.6);
    },
    { passive: true },
  );
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(wrap);

  onFrame((_, dt) => {
    velocity *= Math.pow(0.92, dt * 60);
    if (!visible) return;
    const step = (60 + velocity * 14) * dt * direction;
    rows.forEach((row, i) => {
      offsets[i] += i === 0 ? -step : step;
      if (offsets[i] <= -half[i]) offsets[i] += half[i];
      if (offsets[i] > 0) offsets[i] -= half[i];
      row.style.transform = `translate3d(${offsets[i]}px, 0, 0)`;
    });
  });
}
