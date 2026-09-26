import type { NodeId } from './retrySim';

/**
 * Each node's label and where it sits, as fractions of the stage's width and height.
 * `wide` is the spec's landscape layout. `tall` is for phones, where the wide one would overlap:
 * the main path runs down the left and the retry loop comes back up the right.
 */
export const NODES: Record<NodeId, { label: string; wide: readonly [number, number]; tall: readonly [number, number] }> = {
  src: { label: 'integrations', wide: [0.1, 0.22], tall: [0.27, 0.07] },
  gw: { label: 'api-gateway', wide: [0.3, 0.22], tall: [0.27, 0.24] },
  ats: { label: 'trigger-svc', wide: [0.5, 0.22], tall: [0.27, 0.41] },
  msg: { label: 'messaging', wide: [0.7, 0.22], tall: [0.27, 0.58] },
  meta: { label: 'meta', wide: [0.9, 0.22], tall: [0.27, 0.78] },
  wh: { label: 'webhooks', wide: [0.9, 0.62], tall: [0.73, 0.78] },
  mongo: { label: 'mongodb', wide: [0.7, 0.62], tall: [0.73, 0.58] },
  rmq: { label: 'rabbitmq', wide: [0.5, 0.62], tall: [0.73, 0.41] },
  redis: { label: 'redis', wide: [0.9, 0.88], tall: [0.73, 0.94] },
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
