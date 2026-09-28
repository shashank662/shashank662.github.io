import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES } from '../../src/lib/theme';

// Every theme's colours, read from the stylesheet itself, so a new or changed theme cannot slip below the site's rules.
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => ({
  selectors: selector.replace(/\/\*[\s\S]*?\*\//g, '').split(',').map((s) => s.trim()),
  tokens: Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])),
}));
const ruleFor = (selector: string) => rules.find((rule) => rule.selectors.includes(selector))?.tokens ?? {};
const defaults = ruleFor(':root');
/** A theme's tokens, falling back to the defaults on :root. */
const tokensOf = (id: string) => ({ ...defaults, ...ruleFor(`[data-theme='${id}']`) });

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[] | string, b: number[] | string) => {
  const [x, y] = [a, b].map((c) => luminance(typeof c === 'string' ? channels(c) : c)).sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** `fg` shown at `alpha` opacity over `bg`. */
const blend = (fg: string, bg: string, alpha: number) => channels(fg).map((c, i) => alpha * c + (1 - alpha) * channels(bg)[i]);

describe.each(THEMES)('the $name theme', ({ id }) => {
  const t = tokensOf(id);

  it('has its own colours, as six-digit hex, which the playground canvas can read', () => {
    expect(ruleFor(`[data-theme='${id}']`)['--bg']).toBeDefined();
    for (const name of ['--bg', '--ink', '--muted', '--accent', '--on-accent', '--strip1-bg', '--strip1-fg', '--strip2-fg']) {
      expect(t[name], name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('keeps text, muted text, accent text and text on the accent at 4.5:1 or more', () => {
    expect(contrast(t['--ink'], t['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['--muted'], t['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['--accent'], t['--bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['--on-accent'], t['--accent'])).toBeGreaterThanOrEqual(4.5);
  });

  // Small grey labels were faint, especially on dark backgrounds: muted text gets more than the minimum.
  it('keeps muted text clearly readable: 7:1 on dark themes, 5.5:1 on light ones', () => {
    const dark = luminance(channels(t['--bg'])) < 0.2;
    expect(contrast(t['--muted'], t['--bg'])).toBeGreaterThanOrEqual(dark ? 7 : 5.5);
  });

  it('keeps the crossing bands readable', () => {
    expect(contrast(t['--strip1-fg'], t['--strip1-bg'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['--strip2-fg'], t['--accent'])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the About words at 3:1 before they light up, at the theme\'s own faintest opacity', () => {
    expect(contrast(blend(t['--ink'], t['--bg'], Number(t['--word-dim'])), t['--bg'])).toBeGreaterThanOrEqual(3);
    expect(contrast(blend(t['--accent'], t['--bg'], Number(t['--word-dim-hl'])), t['--bg'])).toBeGreaterThanOrEqual(3);
  });

  it('opens on a dark landing screen with light letters', () => {
    expect(luminance(channels(t['--intro-dark']))).toBeLessThan(0.05);
    expect(contrast(t['--intro-light'], t['--intro-dark'])).toBeGreaterThanOrEqual(7);
  });
});
