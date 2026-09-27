import type { DiagramSpec } from './types';

export const retry: DiagramSpec = {
  height: 420,
  title: 'How the auto-retry framework works',
  nodes: [
    { x: 0, y: 40, w: 180, title: 'integrations', sub: 'LeadSquared · MoEngage' },
    { x: 215, y: 40, w: 140, title: 'api-gateway', sub: 'entry point' },
    { x: 400, y: 40, w: 170, title: 'trigger-mvc', sub: 'action trigger mgmt', accent: true },
    { x: 615, y: 40, w: 170, title: 'messaging', sub: 'messaging pipeline' },
    { x: 860, y: 40, w: 140, title: 'meta', sub: '→ the user' },
    { x: 560, y: 190, w: 160, title: 'redis', sub: 'trackerId per message', accent: true },
    { x: 790, y: 340, w: 210, title: 'webhook-receiver', sub: 'Meta webhooks' },
    { x: 430, y: 340, w: 170, title: 'analytics', sub: 'records the reason' },
    { x: 225, y: 340, w: 170, title: 'rabbitmq', sub: 'retry + back-off', accent: true },
    { x: 0, y: 340, w: 190, title: 'mongodb', sub: 'payload by trackerId', accent: true },
  ],
  edges: [
    // The send path.
    { d: 'M180,68 H211', kind: 'plain' },
    { d: 'M355,68 H396', kind: 'plain' },
    { d: 'M570,68 H611', kind: 'plain' },
    { d: 'M785,68 H856', kind: 'plain' },
    // Messaging keeps each message's trackerId in Redis.
    { d: 'M670,96 V186', kind: 'accent' },
    // A failure comes back: webhook → webhook-receiver → analytics → trigger-mvc.
    { d: 'M930,96 V336', kind: 'warn' },
    { d: 'M790,368 H604', kind: 'warn' },
    { d: 'M470,340 V100', kind: 'warn' },
    // trigger-mvc holds a retry in RabbitMQ, then reads its trackerId and payload.
    { d: 'M440,100 V290 H310 V336', kind: 'accent', both: true },
    { d: 'M530,96 V218 H556', kind: 'accent' },
    { d: 'M410,96 V250 H95 V336', kind: 'accent' },
  ],
  labels: [
    { x: 196, y: 30, text: 'API trigger' },
    { x: 682, y: 150, text: 'trackerId', anchor: 'start' },
    { x: 944, y: 250, text: 'webhook', anchor: 'start' },
    { x: 650, y: 356, text: 'failure reason' },
    { x: 375, y: 282, text: 'back-off' },
    { x: 250, y: 242, text: 'payload' },
  ],
  steps: [
    { x: 196, y: 68, n: 1 },
    { x: 377, y: 68, n: 2 },
    { x: 592, y: 68, n: 3 },
    { x: 930, y: 190, n: 4 },
    { x: 755, y: 368, n: 5 },
    { x: 440, y: 180, n: 6 },
    { x: 160, y: 250, n: 7 },
  ],
};
