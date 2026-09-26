import { parseYearMonth, spanPosition } from '../lib/dates';

const trace = document.querySelector<HTMLElement>('[data-trace]');

if (trace) {
  // Recompute bar positions with today's date; the page may be older than today.
  const axis = parseYearMonth(trace.dataset.axis ?? '');
  if (axis) {
    trace.querySelectorAll<HTMLElement>('[data-bar]').forEach((bar) => {
      const start = parseYearMonth(bar.dataset.start ?? '');
      if (!start) return;
      const pos = spanPosition(start, parseYearMonth(bar.dataset.end ?? ''), axis);
      bar.style.setProperty('--l', String(pos.left));
      bar.style.setProperty('--w', String(pos.width));
    });
  }

  // Rows open on click or tap (hover also opens them, in CSS).
  trace.querySelectorAll<HTMLButtonElement>('[data-row-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.closest('li')?.classList.toggle('open', open);
    });
  });
}
