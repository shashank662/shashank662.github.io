import { ai } from './ai';
import { cart } from './cart';
import { rcs } from './rcs';
import { retry } from './retry';
import type { DiagramSpec } from './types';

/** The diagrams a case study can name in its `diagram` field. */
export const DIAGRAM_IDS = ['retry', 'rcs', 'ai', 'cart'] as const;
export type DiagramId = (typeof DIAGRAM_IDS)[number];

export const diagrams: Record<DiagramId, DiagramSpec> = { retry, rcs, ai, cart };
