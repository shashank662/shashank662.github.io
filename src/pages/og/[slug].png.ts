import type { APIRoute, GetStaticPaths } from 'astro';
import { profile } from '../../data/profile';
import { getCases } from '../../data/work';
import { renderOgImage, type OgCard } from '../../lib/og';
import { plainText } from '../../lib/text';

const footer = `${profile.name} · ${profile.role} · ${profile.location}`;

/** One preview image per page: the home page, the 60-second view and each case study. */
export const getStaticPaths = (async () => {
  const cases = await getCases();
  const cards: { slug: string; card: OgCard }[] = [
    { slug: 'home', card: { kicker: profile.hero.label, title: profile.name, subtitle: plainText(profile.hero.lede), footer } },
    {
      slug: 'summary',
      card: {
        kicker: 'The 60-second view',
        title: profile.name,
        subtitle: `${profile.role} at ${profile.company}. ${profile.status}.`,
        footer,
      },
    },
    ...cases.map(({ id, data }) => ({
      slug: id,
      card: { kicker: data.kicker, title: data.title, subtitle: plainText(data.lede), footer },
    })),
  ];
  return cards.map(({ slug, card }) => ({ params: { slug }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderOgImage((props as { card: OgCard }).card), { headers: { 'Content-Type': 'image/png' } });
