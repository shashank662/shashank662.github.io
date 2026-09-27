import { SHR_GLYPHS } from './shr-glyphs';

/** sessionStorage key, set once the home page has been shown in a tab. The inline script on the home page uses it too. */
export const LANDING_KEY = 'landing';

export interface Arrival {
  /** `document.referrer`: empty when the address was typed in or the link came from an app. */
  referrer: string;
  /** This page's origin. */
  origin: string;
  /** `location.hash`: set when the link points at a section. */
  hash: string;
  /** Whether the home page was already shown in this tab. */
  seen: boolean;
  reducedMotion: boolean;
}

/** The landing screen plays once per visit, for people who arrive from outside the site at the top of the home page. */
export function shouldPlayLanding({ referrer, origin, hash, seen, reducedMotion }: Arrival): boolean {
  if (seen || reducedMotion || hash) return false;
  return originOf(referrer) !== origin;
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** The landing screen's timings, in milliseconds (spec §5). */
export const LANDING = {
  /** The blue line draws across the screen. */
  lineMs: 550,
  /** The S starts to open out of the line. */
  openAt: 380,
  openMs: 900,
  /** The line fades once the S is open. */
  lineFadeAt: 1000,
  lineFadeMs: 500,
  /** Without a scroll, click, tap or key press, the dive starts by itself. */
  diveAt: 2600,
  diveMs: 1250,
  /** A skip opens the S this fast, if it is still closed. */
  skipMs: 350,
  /** Degrees the S turns through during the dive. */
  twist: -12,
} as const;

export interface LandingPose {
  /** How much of the line is drawn (0–1), and its opacity. */
  line: number;
  lineOpacity: number;
  /** How far the S has opened out of the line (0–1). */
  open: number;
  /** How far the dive has gone, eased (0–1). */
  zoom: number;
  /** How much the S has grown, and how far it has turned (degrees). */
  scale: number;
  turn: number;
  /** The blue outline runs a little ahead of the S. */
  echoScale: number;
  echoTurn: number;
  /** Opacity of the light S's fill (its thin outline stays), the blue outline and the dark screen. */
  fill: number;
  echo: number;
  screen: number;
  done: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
/** 1 until `p` reaches `from`, then straight down to 0 at `to`. */
const fadeOut = (p: number, from: number, to: number) => (p <= from ? 1 : p >= to ? 0 : 1 - (p - from) / (to - from));

/**
 * Where everything is `t` ms into the landing screen and `dive` ms into the dive (null before it starts),
 * for an S that must grow `cover` times before it fills the screen.
 */
export function landingPose(t: number, dive: number | null, cover: number): LandingPose {
  const skip = dive === null ? 0 : clamp01(dive / LANDING.skipMs);
  const p = dive === null ? 0 : clamp01(dive / LANDING.diveMs);
  const zoom = easeInOutCubic(p);
  return {
    line: easeOutExpo(clamp01(t / LANDING.lineMs)),
    lineOpacity: Math.min(fadeOut(t, LANDING.lineFadeAt, LANDING.lineFadeAt + LANDING.lineFadeMs), 1 - skip),
    open: Math.max(easeOutExpo(clamp01((t - LANDING.openAt) / LANDING.openMs)), skip),
    zoom,
    // Growth is exponential, so the dive feels like moving at an even speed rather than a sudden burst.
    scale: cover ** zoom,
    turn: dive === null ? 0 : LANDING.twist * zoom,
    echoScale: cover ** Math.min(1, zoom * 1.35),
    echoTurn: dive === null ? 0 : LANDING.twist * 1.5 * zoom,
    // Emptied quickly: over a dark page a half-faded fill reads as grey.
    fill: fadeOut(p, 0.02, 0.2),
    echo: fadeOut(p, 0, 0.45),
    screen: fadeOut(p, 0.8, 1),
    done: p >= 1,
  };
}

export interface Point {
  x: number;
  y: number;
}

/**
 * The S's point deepest inside its stroke (on the lower curve), where the dive heads, in ems from its pen position on
 * the baseline, with how deep the stroke is there. Measured once from the glyph as the browser draws it at 1000px;
 * the browser test re-measures it on screen.
 */
export const S_SHAPE = { deep: { x: 0.339, y: -0.277, r: 0.068 } } as const;

/**
 * The band the S opens through, in font units (y up): centred on the capitals, and tall enough for the S's
 * overshoot.
 */
export const BAND = { middle: SHR_GLYPHS.capHeight / 2, half: SHR_GLYPHS.capHeight / 2 + 60 } as const;

export interface SLayout {
  /** Font size in px, and px per font unit. */
  size: number;
  k: number;
  /** Where the S's pen starts, and the baseline, in px. */
  left: number;
  baseline: number;
  /** The point the dive heads into, and how deep the S's stroke is there, in px. */
  origin: Point;
  clearance: number;
}

/** The S sized to a `width` × `height` screen: its ink centred across, its capital height centred down. */
export function layoutS(width: number, height: number): SLayout {
  const size = Math.min(width * 0.4, height * 0.58);
  const k = size / SHR_GLYPHS.unitsPerEm;
  const [S] = SHR_GLYPHS.letters;
  const inkMiddle = (S.ink[0] + S.ink[2]) / 2;
  const left = width / 2 - inkMiddle * k;
  const baseline = height / 2 + (SHR_GLYPHS.capHeight * k) / 2;
  return {
    size,
    k,
    left,
    baseline,
    origin: { x: left + S_SHAPE.deep.x * size, y: baseline + S_SHAPE.deep.y * size },
    clearance: S_SHAPE.deep.r * size,
  };
}

/**
 * How many times the S must grow around `origin`, where the S's stroke is `clearance` pixels deep,
 * before the S covers a `width` × `height` screen. A little to spare, since the stroke is not a circle.
 */
export function coverScale(origin: Point, clearance: number, width: number, height: number): number {
  const corners: [number, number][] = [[0, 0], [width, 0], [0, height], [width, height]];
  const far = Math.max(...corners.map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)));
  return (far / clearance) * 1.15;
}
