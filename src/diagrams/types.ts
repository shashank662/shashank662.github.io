/**
 * A case study diagram, drawn in a space 1000 units wide and `height` units tall.
 * Diagram.astro turns it into inline SVG; colours come from CSS, so it follows the theme.
 */
export interface DiagramSpec {
  height: number;
  /** Read out by screen readers, e.g. "How the auto-retry framework works". */
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  labels: DiagramLabel[];
  /** Numbered accent dots; each matches a numbered step listed under the diagram. */
  steps: DiagramStep[];
}

export interface DiagramNode {
  x: number;
  y: number;
  w: number;
  title: string;
  sub: string;
  accent?: boolean;
}

export type EdgeKind = 'plain' | 'accent' | 'warn';

export interface DiagramEdge {
  /** SVG path data, e.g. "M190,68 H246". */
  d: string;
  kind: EdgeKind;
  /** An arrowhead at the start too, for a round trip (a queue that hands the message back). */
  both?: boolean;
}

export interface DiagramLabel {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
}

export interface DiagramStep {
  x: number;
  y: number;
  n: number;
}

/** Every node box is this tall. */
export const NODE_HEIGHT = 56;
