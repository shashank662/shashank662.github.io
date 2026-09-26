import { prefersReducedMotion } from './motion';

/** Adds `.in` to every `[data-in-view]` element the first time a quarter of it is on screen. */
const targets = document.querySelectorAll<HTMLElement>('[data-in-view]');

if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('in'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.25 },
  );
  targets.forEach((el) => observer.observe(el));
}
