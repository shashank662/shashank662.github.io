import type { DiagramSpec } from './types';

export const rcs: DiagramSpec = {
  height: 215,
  title: 'How the RCS billing pipeline works',
  nodes: [
    { x: 0, y: 40, w: 160, title: 'rcs webhooks', sub: 'every message event' },
    { x: 210, y: 40, w: 130, title: 'kafka', sub: 'event stream' },
    { x: 390, y: 40, w: 130, title: 'aws s3', sub: 'raw events' },
    { x: 570, y: 40, w: 200, title: 'spark jobs', sub: 'idempotent · replay-safe', accent: true },
    { x: 820, y: 40, w: 180, title: 'billing', sub: 'per bot & customer' },
  ],
  edges: [
    { d: 'M160,68 H206', kind: 'plain' },
    { d: 'M340,68 H386', kind: 'plain' },
    { d: 'M520,68 H566', kind: 'plain' },
    { d: 'M770,68 H816', kind: 'plain' },
    { d: 'M455,96 C455,170 670,170 670,100', kind: 'accent' },
  ],
  labels: [{ x: 562, y: 202, text: 'replay any period ↺' }],
  steps: [
    { x: 185, y: 68, n: 1 },
    { x: 365, y: 68, n: 2 },
    { x: 545, y: 68, n: 3 },
    { x: 795, y: 68, n: 4 },
    { x: 562, y: 152, n: 5 },
  ],
};
