import type { NodeId } from './retrySim';

/**
 * Each node's label and where it sits, as fractions of the stage's width and height.
 * `wide` is the spec's landscape layout: the send path along the top, trigger-mvc's stores and the webhook path
 * below it. `tall` is for phones, where the wide one would overlap: the send path runs down the middle-left,
 * Redis sits to its left, and the stores and the webhook path run down the right.
 */
export const NODES: Record<NodeId, { label: string; wide: readonly [number, number]; tall: readonly [number, number] }> = {
  src: { label: 'integrations', wide: [0.1, 0.2], tall: [0.35, 0.06] },
  gw: { label: 'api-gateway', wide: [0.3, 0.2], tall: [0.35, 0.2] },
  ats: { label: 'trigger-mvc', wide: [0.5, 0.2], tall: [0.35, 0.36] },
  msg: { label: 'messaging', wide: [0.7, 0.2], tall: [0.35, 0.56] },
  meta: { label: 'meta', wide: [0.9, 0.2], tall: [0.35, 0.8] },
  redis: { label: 'redis', wide: [0.6, 0.5], tall: [0.11, 0.46] },
  mongo: { label: 'mongodb', wide: [0.14, 0.8], tall: [0.76, 0.2] },
  rmq: { label: 'rabbitmq', wide: [0.32, 0.8], tall: [0.76, 0.36] },
  an: { label: 'analytics', wide: [0.5, 0.8], tall: [0.76, 0.6] },
  wh: { label: 'webhook-receiver', wide: [0.86, 0.8], tall: [0.76, 0.8] },
};

/** Every node box is this tall, in px. */
export const BOX_HEIGHT = 30;

/** Below this stage width the wide layout's boxes collide, so the tall one is used. */
export const TALL_BELOW = 640;

export interface NodeBox {
  /** The box's centre. */
  x: number;
  y: number;
  w: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Places every node on a W × H stage. `measure` returns a label's width in px. */
export function layoutNodes(W: number, H: number, measure: (text: string) => number): Record<NodeId, NodeBox> {
  const tall = W < TALL_BELOW || W < H;
  const boxes = {} as Record<NodeId, NodeBox>;
  for (const id of Object.keys(NODES) as NodeId[]) {
    const node = NODES[id];
    const [fx, fy] = tall ? node.tall : node.wide;
    const w = measure(node.label) + 34;
    boxes[id] = { x: clamp(fx * W, w / 2 + 8, W - w / 2 - 8), y: clamp(fy * H, 24, H - 24), w };
  }
  return boxes;
}
