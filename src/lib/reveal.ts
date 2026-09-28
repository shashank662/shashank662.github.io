// When the About paragraph's words light up (spec §5). The lit edge runs through the middle band of the screen, where
// people read: it starts as the paragraph's top reaches `start` of the screen height, and ends as its bottom passes `end`.
export const REVEAL = { start: 0.6, end: 0.4 } as const;

/** How far through the paragraph the light has reached, 0–1, for a paragraph `top` px from the screen's top. */
export function revealProgress(top: number, height: number, viewport: number): number {
  const p = (viewport * REVEAL.start - top) / (height + viewport * (REVEAL.start - REVEAL.end));
  return Math.min(1, Math.max(0, p));
}
