import { describe, expect, it } from 'vitest';
import { formatIST, formatUptime } from '../../src/lib/clock';

describe('formatIST', () => {
  it('shows India time, which is UTC+5:30', () => {
    expect(formatIST(new Date('2026-09-26T08:35:09Z'))).toBe('14:05:09 IST');
  });

  it('shows midnight as 00, not 24', () => {
    expect(formatIST(new Date('2026-09-25T18:30:00Z'))).toBe('00:00:00 IST');
  });
});

describe('formatUptime', () => {
  it('pads hours, minutes and seconds', () => {
    expect(formatUptime(0)).toBe('00:00:00');
    expect(formatUptime(3725)).toBe('01:02:05');
  });

  it('keeps counting hours past a day', () => {
    expect(formatUptime(90061)).toBe('25:01:01');
  });

  it('drops fractions and never goes negative', () => {
    expect(formatUptime(59.9)).toBe('00:00:59');
    expect(formatUptime(-5)).toBe('00:00:00');
  });
});
