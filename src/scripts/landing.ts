import { BAND, coverScale, LANDING, landingPose, layoutSHR, type LandingPose, type SHRLayout } from '../lib/landing';
import { SHR_GLYPHS } from '../lib/shr-glyphs';
import { onFrame } from './motion';

// The home page's landing screen (spec §5): "SHR" opens out of a blue line on a dark screen, then the view dives
// through the S into the page. The inline script in index.astro decides before first paint whether it plays and
// adds html.landing; without that class this module only answers onReveal().

const root = document.documentElement;
const svg = document.querySelector<SVGSVGElement>('[data-landing]');
if (!svg) root.classList.remove('landing');

const waiting: (() => void)[] = [];
let revealed = !root.classList.contains('landing');

/** Runs `fn` once the page starts to show: straight away, or when the landing screen begins its dive. */
export function onReveal(fn: () => void): void {
  if (revealed) fn();
  else waiting.push(fn);
}

function reveal(): void {
  if (revealed) return;
  revealed = true;
  for (const fn of waiting.splice(0)) fn();
}

const n = (v: number) => v.toFixed(2);

if (svg && !revealed) {
  // Tells the inline script's safety net that the show has started.
  root.classList.add('landing-live');
  try {
    play(svg);
  } catch (error) {
    root.classList.remove('landing', 'landing-live');
    reveal();
    reportError(error);
  }
}

function play(svg: SVGSVGElement): void {
  const pick = <T extends Element>(selector: string) => svg.querySelector<T>(selector) as T;
  const bands = [...svg.querySelectorAll<SVGRectElement>('[data-band]')];
  const holes = pick<SVGGElement>('[data-holes]');
  const fill = pick<SVGGElement>('[data-fill]');
  const echo = pick<SVGGElement>('[data-echo]');
  const line = pick<SVGRectElement>('[data-line]');

  // The letters are outlines, not text, so there is no font to wait for: the show starts with the first frame.
  let layout: SHRLayout = layoutSHR(innerWidth, innerHeight);
  let cover = 1;
  let t = 0;
  let dive: number | null = null;
  const pointer = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };

  const onResize = () => {
    if (dive === null) layout = layoutSHR(innerWidth, innerHeight);
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    begin();
  };
  const onTouchMove = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent) => {
    pointer.x = (event.clientX / innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / innerHeight - 0.5) * 2;
  };
  addEventListener('resize', onResize);
  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('touchmove', onTouchMove, { passive: false });
  addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('pointerdown', begin);
  addEventListener('keydown', begin);
  const stop = onFrame(frame);

  /** Starts the dive: by itself after a moment, or at once on a scroll, click, tap or key press. */
  function begin(): void {
    if (dive !== null) return;
    dive = 0;
    cover = coverScale(layout.origin, layout.clearance, innerWidth, innerHeight);
    reveal();
  }

  function finish(): void {
    stop();
    removeEventListener('resize', onResize);
    removeEventListener('wheel', onWheel);
    removeEventListener('touchmove', onTouchMove);
    removeEventListener('pointermove', onPointerMove);
    removeEventListener('pointerdown', begin);
    removeEventListener('keydown', begin);
    root.classList.remove('landing', 'landing-live');
    reveal();
  }

  function frame(_now: number, dt: number): void {
    try {
      t += dt * 1000;
      if (dive === null && t >= LANDING.diveAt) begin();
      if (dive !== null) dive += dt * 1000;
      const pose = landingPose(t, dive, cover);
      draw(layout, pose);
      if (pose.done) finish();
    } catch (error) {
      // Never leave anyone stuck behind the screen; report without stopping the page's shared animation loop.
      finish();
      reportError(error);
    }
  }

  function draw({ size, k, left, baseline, origin }: SHRLayout, pose: LandingPose): void {
    const width = innerWidth * 1.1 * pose.line;
    line.setAttribute('x', n((innerWidth - width) / 2));
    line.setAttribute('y', n(baseline - (SHR_GLYPHS.capHeight * k) / 2 - 0.75));
    line.setAttribute('width', n(width));
    line.style.opacity = String(pose.lineOpacity);
    // Bands are in the letters' own units, so they stay put whatever the screen size.
    bands.forEach((band, i) => {
      const h = BAND.half * pose.open[i];
      band.setAttribute('y', n(BAND.middle - h));
      band.setAttribute('height', n(2 * h));
    });

    // The outlines are in font units with y up: scale and flip them onto the screen.
    const place = `translate(${n(left)} ${n(baseline)}) scale(${k.toFixed(5)} ${(-k).toFixed(5)})`;
    const into = (scale: number, turn: number) =>
      `translate(${n(origin.x)} ${n(origin.y)}) rotate(${n(turn)}) scale(${scale.toFixed(4)}) translate(${n(-origin.x)} ${n(-origin.y)})`;
    // The letters lean a little toward the pointer, and their blue outline, which sits in front, leans more.
    const calm = 1 - pose.zoom;
    lean.x += (pointer.x - lean.x) * 0.07;
    lean.y += (pointer.y - lean.y) * 0.07;
    const letters = `translate(${n(lean.x * 0.012 * size * calm)} ${n(lean.y * 0.009 * size * calm)}) ${into(pose.scale, pose.turn)} ${place}`;
    holes.setAttribute('transform', letters);
    fill.setAttribute('transform', letters);
    const ahead = `translate(${n((0.03 + lean.x * 0.05 * calm) * size)} ${n((0.026 + lean.y * 0.035 * calm) * size)})`;
    echo.setAttribute('transform', `${ahead} ${into(pose.echoScale, pose.echoTurn)} ${place}`);

    fill.style.fillOpacity = String(pose.fill);
    echo.style.opacity = String(pose.echo);
    svg.style.opacity = String(pose.screen);
  }
}
