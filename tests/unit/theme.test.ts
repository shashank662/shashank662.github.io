import { describe, expect, it } from 'vitest';
import { resolveTheme, schemeOf, THEME_KEY, THEMES } from '../../src/lib/theme';

describe('THEMES', () => {
  it('offers the owner’s nine themes, each with its own id and name', () => {
    expect(THEMES.map((theme) => theme.name)).toEqual([
      'Light',
      'Dark',
      'Midnight',
      'Ocean',
      'Forest',
      'Sunset',
      'Rose',
      'Nord',
      'Solarized',
    ]);
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
  });

  it('marks Light and Solarized as light, the rest as dark', () => {
    expect(THEMES.filter((theme) => theme.scheme === 'light').map((theme) => theme.id)).toEqual(['light', 'solarized']);
    expect(schemeOf('midnight')).toBe('dark');
    expect(schemeOf('solarized')).toBe('light');
  });
});

describe('resolveTheme', () => {
  it('follows the system on a first visit', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('keeps an explicit earlier choice over the system setting', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('forest', false)).toBe('forest');
    expect(resolveTheme('solarized', true)).toBe('solarized');
  });

  it('follows the system for Auto', () => {
    expect(resolveTheme('auto', true)).toBe('dark');
    expect(resolveTheme('auto', false)).toBe('light');
  });

  it('ignores unknown stored values, including ones that only look like object keys', () => {
    expect(resolveTheme('sepia', true)).toBe('dark');
    expect(resolveTheme('', false)).toBe('light');
    expect(resolveTheme('constructor', false)).toBe('light');
  });
});

it('stores the choice under the "theme" key', () => {
  expect(THEME_KEY).toBe('theme');
});
