import type { DiagramSpec } from './types';

export const retry: DiagramSpec = {
  height: 400,
  title: 'How the auto-retry framework works',
  nodes: [
    { x: 0, y: 40, w: 190, title: 'integrations', sub: 'LeadSquared · MoEngage' },
    { x: 250, y: 40, w: 140, title: 'api-gateway', sub: 'entry point' },
    { x: 450, y: 40, w: 170, title: 'trigger-svc', sub: 'action trigger mgmt' },
    { x: 680, y: 40, w: 140, title: 'messaging', sub: 'messaging layer' },
    { x: 860, y: 40, w: 140, title: 'meta', sub: '→ the user' },
    { x: 820, y: 230, w: 180, title: 'webhooks', sub: 'status-code checks', accent: true },
    { x: 560, y: 230, w: 190, title: 'mongodb', sub: 'payload by trackerId', accent: true },
    { x: 310, y: 230, w: 190, title: 'rabbitmq', sub: 'retry + back-off', accent: true },
    { x: 820, y: 330, w: 180, title: 'redis', sub: 'trackerId correlation' },
  ],
  edges: [
    { d: 'M190,68 H246', kind: 'plain' },
    { d: 'M390,68 H446', kind: 'plain' },
    { d: 'M620,68 H676', kind: 'plain' },
    { d: 'M820,68 H856', kind: 'plain' },
    { d: 'M930,96 V226', kind: 'warn' },
    { d: 'M820,258 H754', kind: 'accent' },
    { d: 'M560,258 H504', kind: 'accent' },
    { d: 'M405,230 C405,160 750,170 750,100', kind: 'accent' },
    { d: 'M910,286 V326', kind: 'plain' },
  ],
  labels: [
    { x: 218, y: 28, text: 'API trigger' },
    { x: 942, y: 165, text: 'webhook', anchor: 'start' },
    { x: 600, y: 204, text: 'retry with back-off', anchor: 'start' },
  ],
  steps: [
    { x: 218, y: 68, n: 1 },
    { x: 418, y: 68, n: 2 },
    { x: 648, y: 68, n: 3 },
    { x: 930, y: 160, n: 4 },
    { x: 820, y: 230, n: 5 },
    { x: 787, y: 258, n: 6 },
    { x: 578, y: 165, n: 7 },
  ],
};
