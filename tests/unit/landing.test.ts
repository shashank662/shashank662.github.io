import { describe, expect, it } from 'vitest';
import { coverScale, deepestPoint, LANDING, LANDING_KEY, landingPose, shouldPlayLanding } from '../../src/lib/landing';

const SITE = 'https://shashank662.github.io';
const firstVisit = { referrer: '', origin: SITE, hash: '', seen: false, reducedMotion: false };

describe('shouldPlayLanding', () => {
  it('plays for someone arriving from outside the site', () => {
    expect(shouldPlayLanding(firstVisit)).toBe(true);
    expect(shouldPlayLanding({ ...firstVisit, referrer: 'https://www.linkedin.com/' })).toBe(true);
  });

  it('plays only once per visit', () => {
    expect(shouldPlayLanding({ ...firstVisit, seen: true })).toBe(false);
  });

  it('does not play when coming from another page of the site', () => {
    expect(shouldPlayLanding({ ...firstVisit, referrer: `${SITE}/work/auto-retry-framework` })).toBe(false);
  });

  it('does not play for a link to a section', () => {
    expect(shouldPlayLanding({ ...firstVisit, hash: '#work' })).toBe(false);
  });

  it('does not play for people who ask for less motion', () => {
    expect(shouldPlayLanding({ ...firstVisit, reducedMotion: true })).toBe(false);
  });

  it('treats a referrer it cannot read as coming from outside', () => {
    expect(shouldPlayLanding({ ...firstVisit, referrer: 'not a url' })).toBe(true);
  });

  it('keeps its session key stable, since the inline script on the home page uses it too', () => {
    expect(LANDING_KEY).toBe('landing');
  });
});

describe('landingPose', () => {
  const COVER = 40;
  const at = (t: number, dive: number | null = null) => landingPose(t, dive, COVER);

  it('starts on a plain dark screen', () => {
    const pose = at(0);
    expect(pose.line).toBe(0);
    expect(pose.open).toEqual([0, 0, 0]);
    expect(pose.scale).toBe(1);
    expect(pose.screen).toBe(1);
    expect(pose.fill).toBe(1);
    expect(pose.done).toBe(false);
  });

  it('draws the line across in about half a second', () => {
    expect(at(LANDING.lineMs).line).toBe(1);
  });

  it('opens S, then H, then R out of the line', () => {
    const [s, h, r] = at(600).open;
    expect(s).toBeGreaterThan(h);
    expect(h).toBeGreaterThan(r);
    expect(r).toBe(0);
  });

  it('has every letter open well before it dives by itself', () => {
    expect(at(1800).open).toEqual([1, 1, 1]);
    expect(LANDING.diveAt).toBeGreaterThan(1800);
  });

  it('holds still until the dive', () => {
    const pose = at(LANDING.diveAt - 1);
    expect(pose.scale).toBe(1);
    expect(pose.turn).toBe(0);
    expect(pose.screen).toBe(1);
  });

  it('grows the letters until they cover the screen, twisting as they go, then clears the screen', () => {
    const end = at(4000, LANDING.diveMs);
    expect(end.scale).toBeCloseTo(COVER);
    expect(end.turn).toBe(LANDING.twist);
    expect(end.screen).toBe(0);
    expect(end.done).toBe(true);
  });

  it('dives smoothly: halfway through, the letters have grown by the square root of the full amount', () => {
    expect(at(4000, LANDING.diveMs / 2).scale).toBeCloseTo(Math.sqrt(COVER));
  });

  it('empties the light letters as the dive starts, so the page shows through the S while it is still an S', () => {
    expect(at(4000, 0).fill).toBe(1);
    expect(at(4000, LANDING.diveMs * 0.2).fill).toBe(0);
  });

  it('keeps the dark screen until the last fifth of the dive', () => {
    expect(at(4000, LANDING.diveMs * 0.8).screen).toBe(1);
    expect(at(4000, LANDING.diveMs * 0.9).screen).toBeCloseTo(0.5);
  });

  it('opens any letter still closed at once when someone skips ahead', () => {
    const pose = at(100, LANDING.skipMs);
    expect(pose.open).toEqual([1, 1, 1]);
    expect(pose.lineOpacity).toBe(0);
  });
});

describe('coverScale', () => {
  it('grows a hole until it reaches the farthest corner, with some to spare', () => {
    const far = Math.hypot(500, 300);
    expect(coverScale({ x: 500, y: 300 }, 10, 1000, 600)).toBeCloseTo((far / 10) * 1.15);
  });

  it('measures to the corner farthest from the hole', () => {
    expect(coverScale({ x: 0, y: 0 }, 10, 300, 400)).toBeCloseTo((500 / 10) * 1.15);
  });
});

describe('deepestPoint', () => {
  const disk = (cx: number, cy: number, r: number) => (x: number, y: number) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

  it('finds the centre of a round shape and how far it is from the edge', () => {
    const deep = deepestPoint(disk(50, 40, 20), { x0: 0, y0: 0, x1: 100, y1: 100 });
    expect(deep).not.toBeNull();
    expect(Math.hypot(deep!.x - 50, deep!.y - 40)).toBeLessThanOrEqual(2);
    expect(deep!.r).toBeGreaterThanOrEqual(18);
    expect(deep!.r).toBeLessThanOrEqual(21);
  });

  it('finds the middle of a thick stroke', () => {
    const band = (x: number, y: number) => x >= 0 && x <= 200 && y >= 30 && y <= 50;
    const deep = deepestPoint(band, { x0: 0, y0: 0, x1: 200, y1: 80 });
    expect(deep!.y).toBeCloseTo(40, 0);
    expect(deep!.r).toBeGreaterThanOrEqual(9);
    expect(deep!.r).toBeLessThanOrEqual(11);
  });

  it('prefers the widest part of a shape', () => {
    const small = disk(20, 20, 5);
    const big = disk(70, 60, 15);
    const deep = deepestPoint((x, y) => small(x, y) || big(x, y), { x0: 0, y0: 0, x1: 100, y1: 100 });
    expect(Math.hypot(deep!.x - 70, deep!.y - 60)).toBeLessThanOrEqual(2);
  });

  it('returns nothing when the shape is empty', () => {
    expect(deepestPoint(() => false, { x0: 0, y0: 0, x1: 50, y1: 50 })).toBeNull();
  });
});
