import { describe, expect, it } from 'vitest';
import { DIAGRAM_IDS, diagrams } from '../../src/diagrams';
import { NODE_HEIGHT } from '../../src/diagrams/types';

it('has one diagram for every id a case study can name', () => {
  expect(Object.keys(diagrams)).toEqual([...DIAGRAM_IDS]);
});

describe.each(DIAGRAM_IDS)('the %s diagram', (id) => {
  const spec = diagrams[id];

  it('keeps every node, label and step inside its canvas', () => {
    for (const node of spec.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w).toBeLessThanOrEqual(1000);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y + NODE_HEIGHT).toBeLessThanOrEqual(spec.height);
    }
    for (const point of [...spec.labels, ...spec.steps]) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1000);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(spec.height);
    }
  });

  it('numbers its steps 1, 2, 3 … in order', () => {
    expect(spec.steps.map((s) => s.n)).toEqual(spec.steps.map((_, i) => i + 1));
  });

  it('starts every edge with a move to a point', () => {
    for (const edge of spec.edges) expect(edge.d).toMatch(/^M\d+,\d+ /);
  });

  it('has a title for screen readers', () => {
    expect(spec.title).toMatch(/^How the .+ works$/);
  });
});

it('draws the retry framework with the real services', () => {
  const titles = diagrams.retry.nodes.map((node) => node.title);
  expect(titles).toEqual(expect.arrayContaining(['trigger-mvc', 'messaging', 'redis', 'webhook-receiver', 'analytics', 'rabbitmq', 'mongodb']));
  expect(titles).not.toContain('trigger-svc');
});
