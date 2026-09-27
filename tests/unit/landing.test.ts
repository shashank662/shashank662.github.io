import { describe, expect, it } from 'vitest';
import {
  BAND,
  coverScale,
  LANDING,
  LANDING_KEY,
  landingPose,
  layoutSHR,
  S_SHAPE,
  shouldPlayLanding,
} from '../../src/lib/landing';
import { SHR_GLYPHS } from '../../src/lib/shr-glyphs';

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

describe('layoutSHR', () => {
  const [S, , R] = SHR_GLYPHS.letters;

  it('sizes the letters to 40% of the screen width, or 58% of its height on a wide, short screen', () => {
    expect(layoutSHR(1000, 2000).size).toBe(400);
    expect(layoutSHR(2000, 1000).size).toBe(580);
  });

  it('centres the ink of SHR across the screen and its capitals down it', () => {
    const at = layoutSHR(1440, 900);
    const inkLeft = at.left + S.ink[0] * at.k;
    const inkRight = at.left + (R.x + R.ink[2]) * at.k;
    expect((inkLeft + inkRight) / 2).toBeCloseTo(720);
    expect(at.baseline - (SHR_GLYPHS.capHeight * at.k) / 2).toBeCloseTo(450);
  });

  it('aims the dive inside the S, as deep as the stroke is there', () => {
    const at = layoutSHR(1440, 900);
    expect(at.origin.x).toBeGreaterThan(at.left + S.ink[0] * at.k);
    expect(at.origin.x).toBeLessThan(at.left + S.ink[2] * at.k);
    expect(at.origin.y).toBeLessThan(at.baseline);
    expect(at.origin.y).toBeGreaterThan(at.baseline - S.ink[3] * at.k);
    expect(at.clearance).toBeCloseTo(S_SHAPE.deep.r * at.size);
  });
});

describe('BAND', () => {
  it('opens each letter to its full height, overshoot and all', () => {
    const bottoms = SHR_GLYPHS.letters.map((letter) => letter.ink[1]);
    const tops = SHR_GLYPHS.letters.map((letter) => letter.ink[3]);
    expect(BAND.middle - BAND.half).toBeLessThan(Math.min(...bottoms));
    expect(BAND.middle + BAND.half).toBeGreaterThan(Math.max(...tops));
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
