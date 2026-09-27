export type Scheme = 'light' | 'dark';

/** The site's colour themes, in the order the picker shows them. Their colours live in src/styles/tokens.css. */
export const THEMES = [
  { id: 'light', name: 'Light', scheme: 'light' },
  { id: 'dark', name: 'Dark', scheme: 'dark' },
  { id: 'midnight', name: 'Midnight', scheme: 'dark' },
  { id: 'ocean', name: 'Ocean', scheme: 'dark' },
  { id: 'forest', name: 'Forest', scheme: 'dark' },
  { id: 'sunset', name: 'Sunset', scheme: 'dark' },
  { id: 'rose', name: 'Rose', scheme: 'dark' },
  { id: 'nord', name: 'Nord', scheme: 'dark' },
  { id: 'solarized', name: 'Solarized', scheme: 'light' },
] as const satisfies readonly { id: string; name: string; scheme: Scheme }[];

export type ThemeId = (typeof THEMES)[number]['id'];
export type Theme = 'light' | 'dark';

/** localStorage key. The inline script in Base.astro reads the same key. */
export const THEME_KEY = 'theme';

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

/** A stored theme wins; otherwise (nothing stored, "auto", or anything unknown) follow the system's light or dark. */
export function resolveTheme(stored: string | null, prefersDark: boolean): ThemeId {
  if (isThemeId(stored)) return stored;
  return prefersDark ? 'dark' : 'light';
}

export function schemeOf(id: ThemeId): Scheme {
  return THEMES.find((theme) => theme.id === id)?.scheme ?? 'light';
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
