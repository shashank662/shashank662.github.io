import { otherTheme, THEME_KEY, type Theme } from '../lib/theme';
import { prefersReducedMotion } from './motion';

const root = document.documentElement;
const current = (): Theme => (root.dataset.theme === 'dark' ? 'dark' : 'light');

function syncButtons(theme: Theme): void {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', `Switch to ${otherTheme(theme)} theme`);
    const label = btn.querySelector('[data-theme-label]');
    if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
  });
}

function apply(theme: Theme): void {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the theme still switches, it just isn't remembered.
  }
  syncButtons(theme);
  document.dispatchEvent(new CustomEvent<Theme>('site:theme', { detail: theme }));
}

/** Switches theme with a circle that grows from (x, y); falls back to an instant switch. */
function switchTheme(x: number, y: number): void {
  const next = otherTheme(current());
  if (!document.startViewTransition || prefersReducedMotion() || document.visibilityState !== 'visible') {
    apply(next);
    return;
  }
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add('theme-wipe');
  const transition = document.startViewTransition(() => apply(next));
  const done = () => root.classList.remove('theme-wipe');
  transition.finished.then(done, done);
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 800, easing: 'cubic-bezier(.7,0,.25,1)', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => {
      // The transition was skipped; apply() still ran.
    });
}

syncButtons(current());

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const btn = target?.closest('[data-theme-toggle]');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  // Keyboard presses report 0,0 — start the circle from the button instead.
  const x = event.clientX || rect.left + rect.width / 2;
  const y = event.clientY || rect.top + rect.height / 2;
  switchTheme(x, y);
});
