import type { DiagramSpec } from './types';

export const cart: DiagramSpec = {
  height: 500,
  title: 'How the abandoned-cart flow works',
  nodes: [
    { x: 0, y: 40, w: 170, title: 'shopify popup', sub: 'theme.liquid CTA' },
    { x: 230, y: 40, w: 190, title: 'product-discovery', sub: 'validation checks' },
    { x: 480, y: 40, w: 160, title: '@Async task', sub: 'store config checks', accent: true },
    { x: 700, y: 40, w: 300, title: '1 · our database', sub: 'shopper by email' },
    { x: 700, y: 130, w: 300, title: '2 · shopify graphql', sub: 'customer in this store' },
    { x: 700, y: 220, w: 300, title: '3 · duckdb parquet', sub: 'archived orders, any store: email → phone', accent: true },
    { x: 700, y: 330, w: 300, title: 'kafka', sub: 'keyed by user_id' },
    { x: 330, y: 330, w: 310, title: 'shopify-consumer-svc', sub: 'payload · discount · short link', accent: true },
    { x: 380, y: 430, w: 210, title: 'url shortener', sub: 'engati-branded link' },
    { x: 0, y: 330, w: 270, title: 'messaging pipeline', sub: '→ the shopper' },
  ],
  edges: [
    { d: 'M170,68 H226', kind: 'plain' },
    { d: 'M420,68 H476', kind: 'plain' },
    { d: 'M640,68 H696', kind: 'plain' },
    { d: 'M850,96 V126', kind: 'plain' },
    { d: 'M850,186 V216', kind: 'plain' },
    { d: 'M850,276 V326', kind: 'accent' },
    { d: 'M700,358 H644', kind: 'accent' },
    { d: 'M485,386 V426', kind: 'plain' },
    { d: 'M330,358 H274', kind: 'accent' },
  ],
  labels: [
    { x: 862, y: 115, text: 'not found', anchor: 'start' },
    { x: 862, y: 205, text: 'not found', anchor: 'start' },
    { x: 497, y: 412, text: 'shorten', anchor: 'start' },
  ],
  steps: [
    { x: 198, y: 68, n: 1 },
    { x: 448, y: 68, n: 2 },
    { x: 668, y: 68, n: 3 },
    { x: 700, y: 248, n: 4 },
    { x: 850, y: 303, n: 5 },
    { x: 672, y: 358, n: 6 },
    { x: 302, y: 358, n: 7 },
  ],
};
