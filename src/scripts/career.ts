import { parseYearMonth, spanPosition, yearTicks } from '../lib/dates';

// The Experience timeline. The page may be older than today: recompute its bars and year labels with today's date.
const timeline = document.querySelector<HTMLElement>('[data-career]');

if (timeline) {
  const axis = parseYearMonth(timeline.dataset.axis ?? '');
  if (axis) {
    timeline.querySelectorAll<HTMLElement>('[data-bar]').forEach((bar) => {
      const start = parseYearMonth(bar.dataset.start ?? '');
      if (!start) return;
      const pos = spanPosition(start, parseYearMonth(bar.dataset.end ?? ''), axis);
      bar.style.setProperty('--l', String(pos.left));
      bar.style.setProperty('--w', String(pos.width));
    });

    const ticks = timeline.querySelector<HTMLElement>('[data-ticks]');
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
}
