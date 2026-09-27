import { coverScale, LANDING, landingPose, S_SHAPE, type LandingPose, type Point } from '../lib/landing';
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

interface Layout {
  /** The letters' font size, px. */
  size: number;
  /** Where the line runs, through the middle of the capitals, and half the height a letter opens to. */
  middle: number;
  half: number;
  /** The point deepest inside the S's stroke, which the dive heads into, and how deep the stroke is there. */
  origin: Point;
  clearance: number;
}

const n = (v: number) => v.toFixed(2);

if (svg && !revealed) play(svg);

function play(svg: SVGSVGElement): void {
  const pick = <T extends Element>(selector: string) => svg.querySelector<T>(selector) as T;
  const bands = [...svg.querySelectorAll<SVGRectElement>('[data-band]')];
  const holes = pick<SVGGElement>('[data-holes]');
  const fill = pick<SVGGElement>('[data-fill]');
  const echo = pick<SVGGElement>('[data-echo]');
  const line = pick<SVGRectElement>('[data-line]');
  const measure = pick<SVGTextElement>('[data-measure]');
  const font = `700 200px ${getComputedStyle(root).getPropertyValue('--font-display').trim()}`;

  let layout: Layout | null = null;
  let cover = 1;
  let t = 0;
  let dive: number | null = null;
  let stop = () => {};
  const pointer = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };

  // If the display face has not arrived in time, skip the show rather than draw SHR in a stand-in font.
  const giveUp = setTimeout(finish, 2500);
  document.fonts.load(font).then(() => {
    clearTimeout(giveUp);
    if (!root.classList.contains('landing')) return;
    layout = place();
    stop = onFrame(frame);
  }, finish);

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
  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('touchmove', onTouchMove, { passive: false });
  addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('pointerdown', begin);
  addEventListener('keydown', begin);

  /** Starts the dive: by itself after a moment, or at once on a scroll, click, tap or key press. */
  function begin(): void {
    if (dive !== null) return;
    // Nothing drawn yet (the font is still on its way): just show the page.
    if (!layout) return finish();
    dive = 0;
    cover = coverScale(layout.origin, layout.clearance, innerWidth, innerHeight);
    reveal();
  }

  function finish(): void {
    clearTimeout(giveUp);
    stop();
    removeEventListener('wheel', onWheel);
    removeEventListener('touchmove', onTouchMove);
    removeEventListener('pointermove', onPointerMove);
    removeEventListener('pointerdown', begin);
    removeEventListener('keydown', begin);
    root.classList.remove('landing');
    reveal();
  }

  /** Sizes SHR to the screen and centres it, once the font is in. */
  function place(): Layout {
    const size = Math.min(innerWidth * 0.4, innerHeight * 0.58);
    svg.style.fontSize = `${size}px`;
    const capital = S_SHAPE.capHeight * size;
    const baseline = innerHeight / 2 + capital / 2;
    const left = (innerWidth - measure.getComputedTextLength()) / 2;
    const xs = [0, 1, 2].map((i) => left + measure.getStartPositionOfChar(i).x);
    for (const group of [holes, fill, echo]) {
      group.querySelectorAll('text').forEach((letter, i) => {
        letter.setAttribute('x', n(xs[i]));
        letter.setAttribute('y', n(baseline));
      });
    }
    const middle = baseline - capital / 2;
    line.setAttribute('y', n(middle - 0.75));
    const origin = { x: xs[0] + S_SHAPE.deep.x * size, y: baseline + S_SHAPE.deep.y * size };
    const clearance = S_SHAPE.deep.r * size;
    // Where the dive heads and how deep it takes the stroke to be there, for the browser tests.
    svg.dataset.origin = `${n(origin.x)} ${n(origin.y)} ${n(clearance)}`;
    return { size, middle, half: capital / 2 + size * 0.06, origin, clearance };
  }

  function frame(_now: number, dt: number): void {
    if (!layout) return;
    t += dt * 1000;
    if (dive === null && t >= LANDING.diveAt) begin();
    if (dive !== null) dive += dt * 1000;
    const pose = landingPose(t, dive, cover);
    draw(layout, pose);
    if (pose.done) finish();
  }

  function draw({ size, middle, half, origin }: Layout, pose: LandingPose): void {
    const width = innerWidth * 1.1 * pose.line;
    line.setAttribute('x', n((innerWidth - width) / 2));
    line.setAttribute('width', n(width));
    line.style.opacity = String(pose.lineOpacity);
    bands.forEach((band, i) => {
      const h = half * pose.open[i];
      band.setAttribute('y', n(middle - h));
      band.setAttribute('height', n(2 * h));
    });

    // The letters lean a little toward the pointer, and their blue outline, which sits in front, leans more.
    const calm = 1 - pose.zoom;
    lean.x += (pointer.x - lean.x) * 0.07;
    lean.y += (pointer.y - lean.y) * 0.07;
    const into = (scale: number, turn: number) =>
      `translate(${n(origin.x)} ${n(origin.y)}) rotate(${n(turn)}) scale(${scale.toFixed(4)}) translate(${n(-origin.x)} ${n(-origin.y)})`;
    const letters = `translate(${n(lean.x * 0.012 * size * calm)} ${n(lean.y * 0.009 * size * calm)}) ${into(pose.scale, pose.turn)}`;
    holes.setAttribute('transform', letters);
    fill.setAttribute('transform', letters);
    const ahead = `translate(${n((0.03 + lean.x * 0.05 * calm) * size)} ${n((0.026 + lean.y * 0.035 * calm) * size)})`;
    echo.setAttribute('transform', `${ahead} ${into(pose.echoScale, pose.echoTurn)}`);

    fill.style.fillOpacity = String(pose.fill);
    echo.style.opacity = String(pose.echo);
    svg.style.opacity = String(pose.screen);
  }
}
