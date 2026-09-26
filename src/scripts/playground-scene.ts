import { BOX_HEIGHT, NODES, layoutNodes } from '../lib/playgroundLayout';
import type { NodeId, RetrySim, SimEvent } from '../lib/retrySim';

/** What hovering a node says about it. */
const INFO: Record<NodeId, string> = {
  src: 'LeadSquared · MoEngage send API triggers',
  gw: 'entry point for every trigger',
  ats: 'action trigger management service',
  msg: 'platform messaging layer',
  meta: 'delivers to the user, then sends a webhook',
  wh: 'checks status codes: retryable or not',
  mongo: 'original payload, looked up by trackerId',
  rmq: 'retry queue · fixed & exponential back-off',
  redis: 'trackerId correlation',
};

type EdgeKind = 'send' | 'hook' | 'retry';
const EDGES: [NodeId, NodeId, string, EdgeKind][] = [
  ['src', 'gw', 'API trigger', 'send'],
  ['gw', 'ats', '', 'send'],
  ['ats', 'msg', '', 'send'],
  ['msg', 'meta', '', 'send'],
  ['meta', 'wh', 'webhook', 'hook'],
  ['wh', 'redis', '', 'retry'],
  ['wh', 'mongo', 'trackerId', 'retry'],
  ['mongo', 'rmq', '', 'retry'],
  ['rmq', 'msg', 'retry + back-off', 'retry'],
];

const FONT = '500 11px "JetBrains Mono", ui-monospace, monospace';
const SMALL = '400 10px "JetBrains Mono", ui-monospace, monospace';
const TAU = Math.PI * 2;
const IDS = Object.keys(NODES) as NodeId[];

interface Theme {
  bg: string;
  line: string;
  muted: string;
  /** Colours below are "r,g,b", so they can be drawn at any opacity. */
  ink: string;
  accent: string;
  ok: string;
  warn: string;
  bad: string;
}

const channels = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

function readTheme(): Theme {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    bg: token('--bg'),
    line: token('--line'),
    muted: token('--muted'),
    ink: channels(token('--ink')),
    accent: channels(token('--accent')),
    ok: channels(token('--ok')),
    warn: channels(token('--warn')),
    bad: channels(token('--bad')),
  };
}

/** Draws the model on a canvas that fills `stage`. Returns null when the browser has no 2D canvas. */
export function createScene(stage: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let W = 1;
  let H = 1;
  let boxes = layoutNodes(W, H, () => 0);
  let theme = readTheme();
  let hovered: NodeId | null = null;
  let pops: { node: NodeId; r: number; a: number; ok: boolean }[] = [];
  const flash = Object.fromEntries(IDS.map((id) => [id, 0])) as Record<NodeId, number>;
  const trails = new Map<string, { leg: number; points: number[] }>();

  const resize = () => {
    const box = stage.getBoundingClientRect();
    W = Math.max(1, box.width);
    H = Math.max(1, box.height);
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT;
    boxes = layoutNodes(W, H, (text) => ctx.measureText(text).width);
  };

  const distance = (from: NodeId, to: NodeId) => Math.hypot(boxes[to].x - boxes[from].x, boxes[to].y - boxes[from].y);

  /** Turns the latest events into short-lived effects: rings at Meta and webhooks, node flashes. */
  const effects = (events: SimEvent[]) => {
    for (const event of events) {
      if (event.type === 'arrived') flash[event.node] = 1;
      else if (event.type === 'retrying') flash.redis = 1;
      else if (event.type === 'delivered') pops.push({ node: 'meta', r: 6, a: 0.9, ok: true });
      else if (event.type === 'dropped') pops.push({ node: 'wh', r: 6, a: 0.9, ok: false });
    }
  };

  const age = (dt: number) => {
    for (const pop of pops) {
      pop.r += dt * 50;
      pop.a -= dt * 1.5;
    }
    pops = pops.filter((pop) => pop.a > 0);
    for (const id of IDS) flash[id] = Math.max(0, flash[id] - dt * 2.4);
  };

  const nodeAt = (x: number, y: number): NodeId | null =>
    IDS.find((id) => Math.abs(x - boxes[id].x) < boxes[id].w / 2 + 6 && Math.abs(y - boxes[id].y) < 22) ?? null;

  /** An edge label, drawn only when the visible part of the edge is long enough for it. */
  const drawLabel = (from: NodeId, to: NodeId, text: string, off: boolean) => {
    const a = boxes[from];
    const b = boxes[to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // How much of the edge (as a fraction of its length) is hidden under a box.
    const under = (w: number) =>
      Math.min(w / 2 / Math.max(Math.abs(dx), 1e-6), BOX_HEIGHT / 2 / Math.max(Math.abs(dy), 1e-6));
    const visible = Math.hypot(dx, dy) * (1 - under(a.w) - under(b.w));
    const flat = Math.abs(dy) < 4;
    if (visible < (flat ? ctx.measureText(text).width + 12 : 22)) return;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    ctx.fillStyle = off ? `rgba(${theme.ink},.2)` : theme.muted;
    ctx.textAlign = flat ? 'center' : 'right';
    ctx.fillText(text, flat ? mx : mx - 10, flat ? my - 11 : my);
  };

  const draw = (sim: RetrySim) => {
    const outage = sim.outage;
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'middle';

    // Edges: solid for sends, dashed amber for webhooks, dashed accent for retries (faded when retries are off).
    ctx.font = SMALL;
    ctx.lineWidth = 1.2;
    for (const [from, to, label, kind] of EDGES) {
      const a = boxes[from];
      const b = boxes[to];
      const off = kind === 'retry' && !sim.retryOn;
      ctx.strokeStyle = off
        ? `rgba(${theme.ink},.07)`
        : kind === 'send'
          ? theme.line
          : kind === 'hook'
            ? `rgba(${theme.warn},.55)`
            : `rgba(${theme.accent},.5)`;
      ctx.setLineDash(kind === 'send' ? [] : [4, 5]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (label) drawLabel(from, to, label, off);
    }
    ctx.setLineDash([]);

    // Rings: green where Meta delivered, red where a webhook was dropped.
    for (const pop of pops) {
      const n = boxes[pop.node];
      const colour = pop.ok ? theme.ok : theme.bad;
      ctx.strokeStyle = `rgba(${colour},${pop.a})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(n.x, n.y, pop.r, 0, TAU);
      ctx.stroke();
      if (pop.ok) {
        ctx.fillStyle = `rgba(${colour},${pop.a})`;
        ctx.font = FONT;
        ctx.textAlign = 'center';
        ctx.fillText('✓', n.x + 22, n.y - 20 - (pop.r - 6) * 0.5);
      }
    }

    // Packets in flight, each with a short fading trail.
    ctx.font = SMALL;
    const seen = new Set<string>();
    for (const p of sim.packets) {
      if (p.until > 0) continue;
      const a = boxes[p.path[p.seg]];
      const b = boxes[p.path[p.seg + 1] ?? p.path[p.seg]];
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      let trail = trails.get(p.id);
      if (!trail || trail.leg !== p.leg) {
        trail = { leg: p.leg, points: [] };
        trails.set(p.id, trail);
      }
      trail.points.push(x, y);
      if (trail.points.length > 16) trail.points.splice(0, 2);
      seen.add(p.id);

      const colour = p.dropped ? theme.bad : p.kind === 'hook' ? theme.warn : p.kind === 'send' ? theme.ink : theme.accent;
      const alpha = p.dropped ? Math.max(0, p.fade) : p.kind === 'send' ? 0.6 : 1;
      const radius = p.kind === 'you' ? 3.4 : 2.4;
      const pts = trail.points;
      for (let k = 2; k < pts.length; k += 2) {
        const f = k / pts.length;
        ctx.strokeStyle = `rgba(${colour},${f * 0.5 * alpha})`;
        ctx.lineWidth = 2.2 * f;
        ctx.beginPath();
        ctx.moveTo(pts[k - 2], pts[k - 1]);
        ctx.lineTo(pts[k], pts[k + 1]);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${colour},${0.16 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(${colour},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
      if (p.kind === 'retry' && !p.dropped) {
        ctx.textAlign = 'left';
        ctx.fillText(`↻${p.attempt}`, x + 7, y - 9);
      }
    }
    for (const id of trails.keys()) if (!seen.has(id)) trails.delete(id);

    // Retries waiting in RabbitMQ: a dot each, with a ring counting down the back-off.
    const rmq = boxes.rmq;
    sim.packets
      .filter((p) => p.until > 0)
      .forEach((p, i) => {
        const x = rmq.x - rmq.w / 2 + 6 + (i % 10) * 11;
        const y = rmq.y + 30 + Math.floor(i / 10) * 11;
        const left = Math.min(1, Math.max(0, (p.until - sim.time) / p.wait));
        ctx.fillStyle = `rgb(${theme.accent})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = `rgba(${theme.accent},.6)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 4.6, -Math.PI / 2, -Math.PI / 2 + TAU * left);
        ctx.stroke();
      });

    // Nodes on top. Meta shakes and turns red in an outage; the retry nodes fade when retries are off.
    ctx.font = FONT;
    for (const id of IDS) {
      const n = boxes[id];
      const down = id === 'meta' && outage;
      const off = !sim.retryOn && (id === 'rmq' || id === 'mongo' || id === 'redis');
      const x = n.x - n.w / 2 + (down ? (Math.random() - 0.5) * 2.4 : 0);
      const y = n.y - BOX_HEIGHT / 2;
      if (flash[id] > 0 && !down && !off) {
        const pad = (1 - flash[id]) * 10;
        ctx.strokeStyle = `rgba(${theme.accent},${flash[id] * 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - pad, y - pad, n.w + pad * 2, BOX_HEIGHT + pad * 2, 4 + pad);
        ctx.stroke();
      }
      ctx.globalAlpha = off ? 0.35 : 1;
      ctx.fillStyle = down ? `rgba(${theme.bad},.14)` : theme.bg;
      ctx.strokeStyle = down
        ? `rgb(${theme.bad})`
        : hovered === id
          ? `rgb(${theme.accent})`
          : `rgba(${theme.ink},${0.5 + flash[id] * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(x, y, n.w, BOX_HEIGHT, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = down ? `rgb(${theme.bad})` : `rgb(${theme.ok})`;
      ctx.beginPath();
      ctx.arc(x + 13, n.y, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = down ? `rgb(${theme.bad})` : `rgb(${theme.ink})`;
      ctx.textAlign = 'left';
      ctx.fillText(NODES[id].label, x + 23, n.y + 0.5);
      ctx.globalAlpha = 1;
    }

    if (!sim.retryOn) {
      ctx.fillStyle = `rgb(${theme.bad})`;
      ctx.font = SMALL;
      ctx.textAlign = 'center';
      ctx.fillText('retries OFF', rmq.x, rmq.y + 30);
    }

    // The hovered node's one-line description.
    if (hovered) {
      const n = boxes[hovered];
      const right = n.x > W * 0.6;
      const below = n.y < H * 0.6;
      ctx.font = SMALL;
      ctx.fillStyle = `rgb(${theme.accent})`;
      ctx.textAlign = right ? 'right' : 'left';
      const text = hovered === 'meta' && outage ? 'outage · most deliveries failing' : INFO[hovered];
      ctx.fillText(text, right ? n.x + n.w / 2 : n.x - n.w / 2, below ? n.y + 30 : n.y - 28);
    }
  };

  return {
    resize,
    distance,
    effects,
    age,
    draw,
    nodeAt,
    hover: (id: NodeId | null) => {
      hovered = id;
    },
    retheme: () => {
      theme = readTheme();
    },
  };
}
