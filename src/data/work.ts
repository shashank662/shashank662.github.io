import { getCollection, type CollectionEntry } from 'astro:content';

export type Case = CollectionEntry<'work'>;

/** The case studies, in their numbered order. */
export async function getCases(): Promise<Case[]> {
  return (await getCollection('work')).sort((a, b) => a.data.order - b.data.order);
}

/** 1 → "01". */
export const caseNumber = (n: number): string => String(n).padStart(2, '0');
