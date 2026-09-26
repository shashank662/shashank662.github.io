import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  monthsBetween,
  parseYearMonth,
  spanPosition,
  toAttr,
  yearTicks,
} from '../../src/lib/dates';

// Local-time constructor: 26 September 2026, whatever the machine's time zone.
const TODAY = new Date(2026, 8, 26);

describe('monthsBetween', () => {
  it('counts both the first and the last month of a finished span', () => {
    expect(monthsBetween([2024, 1], [2024, 6], TODAY)).toBe(6);
    expect(monthsBetween([2020, 8], [2024, 7], TODAY)).toBe(48);
    expect(monthsBetween([2024, 3], [2024, 3], TODAY)).toBe(1);
  });

  it('runs an open span up to today, including the part of this month that has passed', () => {
    const months = monthsBetween([2024, 7], null, TODAY);
    expect(months).toBeGreaterThan(26.8);
    expect(months).toBeLessThan(26.9);
  });

  it('never goes below zero', () => {
    expect(monthsBetween([2027, 1], null, TODAY)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('shows years and months', () => {
    expect(formatDuration(26.83)).toBe('2y 2m');
    expect(formatDuration(73.8)).toBe('6y 1m');
  });

  it('drops a zero part', () => {
    expect(formatDuration(48)).toBe('4y');
    expect(formatDuration(6)).toBe('6m');
    expect(formatDuration(12)).toBe('1y');
  });

  it('shows anything under a month as 1m', () => {
    expect(formatDuration(0.4)).toBe('1m');
    expect(formatDuration(0)).toBe('1m');
  });
});

describe('spanPosition', () => {
  it('places a span on an axis that ends today', () => {
    const pos = spanPosition([2024, 7], null, [2020, 7], TODAY);
    expect(pos.left).toBeCloseTo(48 / 74.833, 3);
    expect(pos.left + pos.width).toBeCloseTo(1, 6);
  });

  it('places a finished span inside the axis', () => {
    const pos = spanPosition([2024, 1], [2024, 6], [2020, 7], TODAY);
    expect(pos.left).toBeCloseTo(42 / 74.833, 3);
    expect(pos.width).toBeCloseTo(6 / 74.833, 3);
  });
});

describe('yearTicks', () => {
  it('marks January of each year after the axis start, up to this year', () => {
    const ticks = yearTicks([2020, 7], TODAY);
    expect(ticks.map((t) => t.year)).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
    expect(ticks[0].left).toBeCloseTo(6 / 74.833, 3);
  });
});

describe('toAttr and parseYearMonth', () => {
  it('round-trips a year and month through a data attribute', () => {
    expect(toAttr([2024, 7])).toBe('2024-07');
    expect(parseYearMonth('2024-07')).toEqual([2024, 7]);
  });

  it('rejects anything that is not YYYY-MM', () => {
    expect(parseYearMonth('')).toBeNull();
    expect(parseYearMonth('2024-7')).toBeNull();
    expect(parseYearMonth('now')).toBeNull();
  });
});
