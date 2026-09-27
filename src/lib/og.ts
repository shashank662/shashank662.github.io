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
  {
    name: 'IBM Plex Sans Condensed',
    data: font('ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-700-normal.woff'),
    weight: 700 as const,
    style: 'normal' as const,
  },
  { name: 'IBM Plex Sans', data: font('ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'IBM Plex Mono', data: font('ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

/** A Satori element: plain objects instead of JSX. */
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });
/** Shortens text to at most `max` characters, ending on a whole word, with an ellipsis. */
const clip = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:·]+$/, '')}…`;
};

/** A 1200 × 630 PNG for link previews: kicker, big title, subtitle, owner line. */
export async function renderOgImage({ kicker, title, subtitle, footer }: OgCard): Promise<Uint8Array<ArrayBuffer>> {
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
        { display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono', fontSize: 22, color: MUTED, letterSpacing: 2, textTransform: 'uppercase' },
        [el('span', {}, kicker), el('span', {}, 'shashank662.github.io')],
      ),
      el('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        el('div', { fontFamily: 'IBM Plex Sans Condensed', fontWeight: 700, fontSize: title.length > 18 ? 92 : 116, lineHeight: 0.95, textTransform: 'uppercase' }, title),
        el(
          'div',
          { fontFamily: 'IBM Plex Sans', fontSize: 36, lineHeight: 1.3, color: INK, maxWidth: 1000 },
          clip(subtitle, 130),
        ),
      ]),
      el('div', { display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'IBM Plex Mono', fontSize: 22 }, [
        el('div', { width: 14, height: 14, borderRadius: 7, background: ACCENT }),
        el('span', {}, footer),
      ]),
    ],
  );
  const svg = await satori(card as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: FONTS });
  // A plain copy of resvg's Node Buffer, so it can be a Response body.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
