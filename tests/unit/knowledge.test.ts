import { describe, expect, it } from 'vitest';
import { realKnowledge } from './support/knowledge';

describe('buildKnowledge', () => {
  const entries = realKnowledge();

  it('builds a full set of answers with unique ids', () => {
    expect(entries.length).toBeGreaterThanOrEqual(25);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it('gives every entry a question, an answer, keywords and a source', () => {
    for (const e of entries) {
      expect(e.question, e.id).not.toBe('');
      expect(e.answer, e.id).not.toBe('');
      expect(e.keywords.length, e.id).toBeGreaterThan(0);
      expect(e.source?.href, e.id).toMatch(/^\//);
    }
  });

  it('links each case study to its page', () => {
    for (const slug of ['auto-retry-framework', 'rcs-billing-pipeline', 'ai-code-reviewer', 'abandoned-cart-recovery']) {
      expect(entries.find((e) => e.id === `case-${slug}`)?.source?.href).toBe(`/work/${slug}`);
    }
  });

  it('keeps the experience answer current by filling it in when shown', () => {
    expect(entries.find((e) => e.id === 'experience')?.answer).toMatch(/\{since:2024-07\}/);
  });

  it('never publishes a phone number', () => {
    for (const e of entries) expect(e.answer, e.id).not.toMatch(/\+91|\d{10}/);
  });
});
