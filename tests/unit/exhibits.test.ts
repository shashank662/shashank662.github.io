import { describe, expect, it } from 'vitest';
import { billingTotal } from '../../src/lib/exhibits';
describe('illustrative invoice recomputation', () => {
  it('counts one message once despite duplicate events', () => expect(billingTotal(['a', 'b', 'a'])).toBe(2));
  it('has no charges for an empty window', () => expect(billingTotal([])).toBe(0));
  it('does not add charges when a window is replayed', () => {
    const events = ['a', 'b', 'a'];
    expect(billingTotal([...events, ...events])).toBe(2);
  });
});
