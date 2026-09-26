import type { DiagramSpec } from './types';

export const ai: DiagramSpec = {
  height: 290,
  title: 'How the AI code reviewer works',
  nodes: [
    { x: 0, y: 40, w: 150, title: 'slack', sub: 'review requested' },
    { x: 200, y: 40, w: 170, title: 'review agent', sub: 'spring boot', accent: true },
    { x: 420, y: 40, w: 140, title: 'gitlab', sub: 'MR diff' },
    { x: 610, y: 40, w: 170, title: 'token budget', sub: 'fits the context', accent: true },
    { x: 830, y: 40, w: 170, title: 'llm', sub: 'writes feedback' },
    { x: 830, y: 210, w: 170, title: 'human reviewer', sub: 'makes the call' },
  ],
  edges: [
    { d: 'M150,68 H196', kind: 'plain' },
    { d: 'M370,68 H416', kind: 'plain' },
    { d: 'M560,68 H606', kind: 'plain' },
    { d: 'M780,68 H826', kind: 'plain' },
    { d: 'M915,96 V206', kind: 'plain' },
  ],
  labels: [{ x: 927, y: 156, text: 'feedback', anchor: 'start' }],
  steps: [
    { x: 175, y: 68, n: 1 },
    { x: 395, y: 68, n: 2 },
    { x: 585, y: 68, n: 3 },
    { x: 805, y: 68, n: 4 },
    { x: 915, y: 150, n: 5 },
  ],
};
