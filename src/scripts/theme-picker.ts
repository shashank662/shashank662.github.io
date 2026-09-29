import { isThemeId, resolveTheme, schemeOf, THEME_KEY, THEMES, type ThemeId } from '../lib/theme';
import { prefersReducedMotion } from './motion';

// The colour theme picker in the header (spec §5): Auto, which follows the system, or one of the themes. The inline
// script in Base.astro has already applied the stored choice before first paint; this keeps it in step.

type Choice = ThemeId | 'auto';

const root = document.documentElement;
const system = matchMedia('(prefers-color-scheme: dark)');
const button = document.querySelector<HTMLButtonElement>('[data-theme-button]');
const menu = document.querySelector<HTMLElement>('[data-theme-menu]');

function storedChoice(): Choice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemeId(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

let choice: Choice = storedChoice();

const nameOf = (c: Choice) => THEMES.find((theme) => theme.id === c)?.name ?? 'Auto';

/** The button names the current choice; in the menu, only the chosen theme is ticked and reachable by Tab. */
function sync(): void {
  button?.setAttribute('aria-label', `Colour theme: ${nameOf(choice)}`);
  const label = button?.querySelector('[data-theme-label]');
  if (label) label.textContent = nameOf(choice);
  menu?.querySelectorAll<HTMLElement>('[data-choice]').forEach((option) => {
    const chosen = option.dataset.choice === choice;
    option.setAttribute('aria-checked', String(chosen));
    option.tabIndex = chosen ? 0 : -1;
  });
}

function apply(next: Choice): void {
  choice = next;
  const theme = next === 'auto' ? resolveTheme(null, system.matches) : next;
  root.dataset.theme = theme;
  root.dataset.scheme = schemeOf(theme);
  try {
    if (next === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage can be blocked (private mode); the theme still changes, it just isn't remembered.
  }
  sync();
  document.dispatchEvent(new CustomEvent<ThemeId>('site:theme', { detail: theme }));
}

/** Changes theme with a circle that grows from (x, y); at once where that isn't possible or wanted. */
function choose(next: Choice, x: number, y: number): void {
  if (next === choice) return;
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

const centreOf = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return [rect.left + rect.width / 2, rect.top + rect.height / 2] as const;
};

if (button && menu) {
  sync();

  menu.addEventListener('click', (event) => {
    const option = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-choice]') : null;
    if (!option) return;
    // A key press reports 0,0: start the circle from the swatch instead.
    const [x, y] = event.clientX || event.clientY ? [event.clientX, event.clientY] : centreOf(option);
    choose(option.dataset.choice as Choice, x, y);
  });

  // Arrow keys move through the themes and choose as they go, as in any group of radio buttons.
  menu.addEventListener('keydown', (event) => {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key];
    const options = [...menu.querySelectorAll<HTMLElement>('[data-choice]')];
    const at = options.indexOf(document.activeElement as HTMLElement);
    if (!step || at < 0) return;
    event.preventDefault();
    const next = options[(at + step + options.length) % options.length];
    next.focus();
    choose(next.dataset.choice as Choice, ...centreOf(next));
  });

  // The menu opens just under the button, and focus goes to the chosen theme.
  menu.addEventListener('beforetoggle', (event) => {
    if ((event as ToggleEvent).newState !== 'open') return;
    const rect = button.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 8}px`;
    // Lined up with the button's right edge, but never past the left edge of a narrow screen (on a phone the button
    // sits beside the Menu button, not at the corner).
    const width = Math.min(460, innerWidth - 16);
    menu.style.right = `${Math.max(8, Math.min(innerWidth - rect.right, innerWidth - width - 8))}px`;
  });
  menu.addEventListener('toggle', (event) => {
    if ((event as ToggleEvent).newState === 'open') menu.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  });

  // On Auto, follow the system as it changes, day to night.
  system.addEventListener('change', () => {
    if (choice === 'auto') apply('auto');
  });
}
