import { describe, expect, it } from 'vitest';
import { renderOgImage } from '../../src/lib/og';

describe('renderOgImage', () => {
  it('draws a 1200 × 630 PNG', { timeout: 20_000 }, async () => {
    const png = await renderOgImage({
      kicker: 'Engati · Resilience',
      title: 'Auto-retry framework',
      subtitle: 'Meta can’t deliver every message the first time.',
      footer: 'Shashank H R · Backend Engineer · Bangalore',
    });
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  });
});
