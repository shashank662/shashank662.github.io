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
  { name: 'Anton', data: font('anton/files/anton-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  {
    name: 'Instrument Serif',
    data: font('instrument-serif/files/instrument-serif-latin-400-italic.woff'),
    weight: 400 as const,
    style: 'italic' as const,
  },
  {
    name: 'JetBrains Mono',
    data: font('jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff'),
    weight: 500 as const,
    style: 'normal' as const,
  },
];

/** A Satori element: plain objects instead of JSX. */
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({ type, props: { style, children } });
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** A 1200 × 630 PNG for link previews: kicker, big title, serif subtitle, owner line. */
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
        { display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 22, color: MUTED, letterSpacing: 2, textTransform: 'uppercase' },
        [el('span', {}, kicker), el('span', {}, 'shashank662.github.io')],
      ),
      el('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        el('div', { fontFamily: 'Anton', fontSize: title.length > 18 ? 104 : 132, lineHeight: 0.92, textTransform: 'uppercase' }, title),
        el(
          'div',
          { fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 40, lineHeight: 1.15, color: ACCENT, maxWidth: 1000 },
          clip(subtitle, 130),
        ),
      ]),
      el('div', { display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'JetBrains Mono', fontSize: 22 }, [
        el('div', { width: 14, height: 14, borderRadius: 7, background: ACCENT }),
        el('span', {}, footer),
      ]),
    ],
  );
  const svg = await satori(card as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: FONTS });
  // A plain copy of resvg's Node Buffer, so it can be a Response body.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
