import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

export interface OgCard {
  kicker: string;
  title: string;
  subtitle: string;
  footer: string;
}

// The light theme's colours (spec §2.1): the card is the site's paper and ink.
const PAPER = '#f1ede4';
const INK = '#141414';
const MUTED = '#6b675f';
const ACCENT = '#1f3dff';

// Satori reads .woff (not .woff2), which the Fontsource packages also ship.
const require = createRequire(import.meta.url);
const font = (file: string) => readFileSync(require.resolve(`@fontsource/${file}`));
const FONTS = [
  { name: 'Source Serif 4', data: font('source-serif-4/files/source-serif-4-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Source Sans 3', data: font('source-sans-3/files/source-sans-3-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Source Code Pro', data: font('source-code-pro/files/source-code-pro-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

/** A Satori element: plain objects instead of JSX. */
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });
/** Shortens text to at most `max` characters, ending on a whole word, with an ellipsis. */
const clip = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:·]+$/, '')}…`;
};

/**
 * Satori has no fallback for a character its fonts lack, and the Source fonts have no non-breaking hyphen
 * (browsers quietly swap in a plain one), so the card does the same.
 */
const plainHyphens = (text: string) => text.replace(/\u2011/g, '-');

/** A 1200 × 630 PNG for link previews: kicker, big title, subtitle, owner line. */
export async function renderOgImage(content: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  const [kicker, title, subtitle, footer] = [content.kicker, content.title, content.subtitle, content.footer].map(plainHyphens);
  const card = el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      background: PAPER,
      color: INK,
      borderBottom: `14px solid ${ACCENT}`,
    },
    [
      el(
        'div',
        { display: 'flex', justifyContent: 'space-between', fontFamily: 'Source Code Pro', fontSize: 22, color: MUTED, letterSpacing: 2, textTransform: 'uppercase' },
        [el('span', {}, kicker), el('span', {}, 'shashank662.github.io')],
      ),
      el('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        el('div', { fontFamily: 'Source Serif 4', fontWeight: 700, fontSize: title.length > 18 ? 96 : 120, lineHeight: 1, letterSpacing: -2 }, title),
        el(
          'div',
          { fontFamily: 'Source Sans 3', fontSize: 38, lineHeight: 1.3, color: INK, maxWidth: 1000 },
          clip(subtitle, 130),
        ),
      ]),
      el('div', { display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Source Code Pro', fontSize: 22 }, [
        el('div', { width: 14, height: 14, borderRadius: 7, background: ACCENT }),
        el('span', {}, footer),
      ]),
    ],
  );
  const svg = await satori(card as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: FONTS });
  // A plain copy of resvg's Node Buffer, so it can be a Response body.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
