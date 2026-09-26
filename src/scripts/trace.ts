import { parseYearMonth, spanPosition, yearTicks } from '../lib/dates';

const trace = document.querySelector<HTMLElement>('[data-trace]');

if (trace) {
  // The page may be older than today: recompute bar positions and year labels with today's date.
  const axis = parseYearMonth(trace.dataset.axis ?? '');
  if (axis) {
    trace.querySelectorAll<HTMLElement>('[data-bar]').forEach((bar) => {
      const start = parseYearMonth(bar.dataset.start ?? '');
      if (!start) return;
      const pos = spanPosition(start, parseYearMonth(bar.dataset.end ?? ''), axis);
      bar.style.setProperty('--l', String(pos.left));
      bar.style.setProperty('--w', String(pos.width));
    });

    const ticks = trace.querySelector<HTMLElement>('[data-ticks]');
    const now = ticks?.querySelector<HTMLElement>('[data-now]');
    if (ticks && now) {
      ticks.querySelectorAll('[data-year]').forEach((label) => label.remove());
      for (const { year, left } of yearTicks(axis)) {
        const label = document.createElement('span');
        label.dataset.year = '';
        label.textContent = String(year);
        label.style.left = `${(left * 100).toFixed(3)}%`;
        now.before(label);
      }

      // Early in a year, the new year's label sits almost on top of "now": hide any label that would touch it.
      const fit = () => {
        const limit = now.getBoundingClientRect().left - 6;
        ticks.querySelectorAll<HTMLElement>('[data-year]').forEach((label) => {
          label.hidden = false;
          label.hidden = label.getBoundingClientRect().right > limit;
        });
      };
      fit();
      addEventListener('resize', fit);
      document.fonts?.ready.then(fit);
    }
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
