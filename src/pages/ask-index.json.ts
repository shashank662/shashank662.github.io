import type { APIRoute } from 'astro';
import { faq } from '../data/faq';
import { profile } from '../data/profile';
import { getCases } from '../data/work';
import { buildKnowledge } from '../lib/ask/knowledge';

/** The chatbot's answers, built from the site's own content. The panel fetches this the first time it opens. */
export const GET: APIRoute = async () => {
  const cases = (await getCases()).map(({ id, data }) => ({ slug: id, data }));
  return new Response(JSON.stringify(buildKnowledge({ profile, cases, faq })), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
