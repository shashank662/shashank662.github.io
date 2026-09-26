import { formatDuration, monthsBetween, parseYearMonth } from '../lib/dates';

// The page may have been built days ago; recompute every duration with today's date.
document.querySelectorAll<HTMLElement>('[data-duration]').forEach((el) => {
  const start = parseYearMonth(el.dataset.start ?? '');
  if (!start) return;
  el.textContent = formatDuration(monthsBetween(start, parseYearMonth(el.dataset.end ?? '')));
});
