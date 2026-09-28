import { describe, expect, it } from 'vitest';
import { REVEAL, revealProgress } from '../../src/lib/reveal';

const VH = 1000;
const HEIGHT = 500;

describe('revealProgress', () => {
  it('lights nothing until the paragraph reaches the middle of the screen', () => {
    expect(revealProgress(VH * 0.9, HEIGHT, VH)).toBe(0);
    expect(revealProgress(VH * 0.7, HEIGHT, VH)).toBe(0);
    expect(revealProgress(VH * REVEAL.start, HEIGHT, VH)).toBe(0);
  });

  it('is fully lit once the paragraph has passed the middle', () => {
    expect(revealProgress(VH * REVEAL.end - HEIGHT, HEIGHT, VH)).toBe(1);
    expect(revealProgress(-HEIGHT, HEIGHT, VH)).toBe(1);
  });

  it('keeps the lit edge in the middle band of the screen the whole way', () => {
    for (let top = VH * REVEAL.start; top >= VH * REVEAL.end - HEIGHT; top -= 25) {
      const p = revealProgress(top, HEIGHT, VH);
      const edge = top + p * HEIGHT;
      expect(edge).toBeLessThanOrEqual(VH * REVEAL.start + 0.001);
      expect(edge).toBeGreaterThanOrEqual(VH * REVEAL.end - 0.001);
    }
    expect(REVEAL.start).toBeLessThanOrEqual(0.6);
    expect(REVEAL.end).toBeGreaterThanOrEqual(0.4);
  });
});
