import { describe, expect, it } from 'vitest';
import { otherTheme, resolveTheme, THEME_KEY } from '../../src/lib/theme';

describe('resolveTheme', () => {
  it('follows the system on a first visit', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('keeps an explicit earlier choice over the system setting', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('ignores unknown stored values', () => {
    expect(resolveTheme('sepia', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
  });
});

describe('otherTheme', () => {
  it('flips between light and dark', () => {
    expect(otherTheme('light')).toBe('dark');
    expect(otherTheme('dark')).toBe('light');
  });
});

it('stores the choice under the "theme" key', () => {
  expect(THEME_KEY).toBe('theme');
});
