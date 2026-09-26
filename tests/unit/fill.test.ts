import { describe, expect, it } from 'vitest';
import { fillDurations, spellDuration } from '../../src/lib/ask/fill';

describe('spellDuration', () => {
  it('writes years and months in words', () => {
    expect(spellDuration(26.8)).toBe('2 years 2 months');
    expect(spellDuration(25)).toBe('2 years 1 month');
    expect(spellDuration(12)).toBe('1 year');
    expect(spellDuration(6)).toBe('6 months');
    expect(spellDuration(0.4)).toBe('1 month');
  });
});

describe('fillDurations', () => {
  it('replaces {since:YYYY-MM} with the time since that month', () => {
    expect(fillDurations('{since:2024-07} full-time', new Date(2026, 8, 26))).toBe('2 years 2 months full-time');
  });

  it('leaves other text alone', () => {
    expect(fillDurations('No dates here.')).toBe('No dates here.');
  });
});
