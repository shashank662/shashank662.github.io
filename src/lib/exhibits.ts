export type ExhibitKind = 'retry' | 'billing' | 'review' | 'cart';
/** An illustrative daily window, recomputed rather than added to yesterday's result. */
export const billingTotal = (ids: readonly string[]): number => new Set(ids).size;
