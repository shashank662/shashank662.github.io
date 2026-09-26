/** A calendar month: [year, month] with month 1–12. */
export type YearMonth = readonly [year: number, month: number];

const monthIndex = ([year, month]: YearMonth): number => year * 12 + (month - 1);

/** Today as a month index plus the fraction of the current month that has passed. */
function todayIndex(today: Date): number {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return today.getFullYear() * 12 + today.getMonth() + (today.getDate() - 1) / daysInMonth;
}

/** Months from the start of `start` to the end of `end` (both included), or up to `today` when `end` is null. */
export function monthsBetween(start: YearMonth, end: YearMonth | null, today: Date = new Date()): number {
  const to = end ? monthIndex(end) + 1 : todayIndex(today);
  return Math.max(0, to - monthIndex(start));
}

/** "2y 2m", "4y", "6m". Anything under a month shows as "1m". */
export function formatDuration(months: number): string {
  const whole = Math.floor(months + 1e-9);
  const years = Math.floor(whole / 12);
  const rest = whole % 12;
  if (years === 0) return `${Math.max(1, rest)}m`;
  return rest === 0 ? `${years}y` : `${years}y ${rest}m`;
}

/** Where a span sits on a timeline running from `axisStart` to today, as fractions of the timeline's width. */
export function spanPosition(
  start: YearMonth,
  end: YearMonth | null,
  axisStart: YearMonth,
  today: Date = new Date(),
): { left: number; width: number } {
  const total = todayIndex(today) - monthIndex(axisStart);
  return {
    left: (monthIndex(start) - monthIndex(axisStart)) / total,
    width: monthsBetween(start, end, today) / total,
  };
}

/** January of each year after the axis start, up to the current year, as fractions of the timeline's width. */
export function yearTicks(axisStart: YearMonth, today: Date = new Date()): { year: number; left: number }[] {
  const total = todayIndex(today) - monthIndex(axisStart);
  const ticks: { year: number; left: number }[] = [];
  for (let year = axisStart[0] + 1; year <= today.getFullYear(); year++) {
    ticks.push({ year, left: (monthIndex([year, 1]) - monthIndex(axisStart)) / total });
  }
  return ticks;
}

/** "2024-07" — the form used in data attributes. */
export function toAttr([year, month]: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseYearMonth(value: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? [Number(match[1]), Number(match[2])] : null;
}
