import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DIAGRAM_IDS } from './diagrams';

const text = z.string().min(1);

/** One Markdown file per case study; the body is "The problem". A missing or malformed field fails the build. */
const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: z.object({
    order: z.number().int().positive(),
    kicker: text,
    title: text,
    /** Supports *emphasis*. */
    lede: text,
    meta: z.array(z.object({ label: text, value: text, tone: z.literal('ok').optional() })).length(4),
    stats: z.array(z.object({ value: text, caption: text })).length(4),
    diagram: z.enum(DIAGRAM_IDS),
    steps: z.array(text).min(1),
    decisions: z.array(z.object({ title: text, body: text })).length(3),
    /** Each supports **strong** text. */
    results: z.array(text).min(1),
    quote: text.optional(),
    cta: z.object({ label: text, href: text }).optional(),
    /** The project's row in Selected work on the home page, so each project is written once. */
    row: z.object({
      description: text,
      stack: text,
      metric: text,
      metricCaption: text,
      cardTag: text,
      cardMetric: text,
      cardLabel: text,
    }),
  }),
});

export const collections = { work };
