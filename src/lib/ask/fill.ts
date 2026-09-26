import { monthsBetween, parseYearMonth } from '../dates';

/** "2 years 2 months", "1 year", "6 months"; anything under a month is "1 month". */
export function spellDuration(months: number): string {
  const whole = Math.floor(months + 1e-9);
  const years = Math.floor(whole / 12);
  const rest = whole % 12;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (years === 0) return part(Math.max(1, rest), 'month');
  return rest === 0 ? part(years, 'year') : `${part(years, 'year')} ${part(rest, 'month')}`;
}

/** Replaces each {since:YYYY-MM} with the time from that month until today, so answers never go stale. */
export function fillDurations(text: string, today: Date = new Date()): string {
  return text.replace(/\{since:(\d{4}-\d{2})\}/g, (token, value: string) => {
    const start = parseYearMonth(value);
    return start ? spellDuration(monthsBetween(start, null, today)) : token;
  });
}
