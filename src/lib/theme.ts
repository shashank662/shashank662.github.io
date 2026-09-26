export type Theme = 'light' | 'dark';

/** localStorage key. The inline script in Base.astro reads the same key. */
export const THEME_KEY = 'theme';

/** A stored explicit choice wins; otherwise follow the system setting. */
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
