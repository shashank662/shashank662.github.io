import { describe, expect, it } from 'vitest';
import { BOX_HEIGHT, layoutNodes, type NodeBox } from '../../src/lib/playgroundLayout';

// The canvas labels are 11px JetBrains Mono: 0.6em, about 6.6px, per character.
const measure = (text: string) => text.length * 6.6;

const overlap = (a: NodeBox, b: NodeBox) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 4 && Math.abs(a.y - b.y) < BOX_HEIGHT + 4;

describe.each([
  ['a desktop stage', 895, 440],
  ['a tablet stage', 700, 440],
  ['the narrowest wide stage', 640, 440],
  ['a phone stage', 362, 560],
])('on %s (%i × %i)', (_, W, H) => {
  const boxes = Object.values(layoutNodes(W, H, measure));

  it('keeps every node inside the stage', () => {
    for (const box of boxes) {
      expect(box.x - box.w / 2).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w / 2).toBeLessThanOrEqual(W);
      expect(box.y - BOX_HEIGHT / 2).toBeGreaterThanOrEqual(0);
      expect(box.y + BOX_HEIGHT / 2).toBeLessThanOrEqual(H);
    }
  });

  it('keeps nodes from touching each other', () => {
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => expect(overlap(a, b)).toBe(false)));
  });
});
