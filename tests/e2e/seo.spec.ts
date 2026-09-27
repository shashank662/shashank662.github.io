import { expect, test } from './fixtures';

const SITE = 'https://shashank662.github.io';
const PAGES = [
  '/',
  '/summary',
  '/work/auto-retry-framework',
  '/work/rcs-billing-pipeline',
  '/work/ai-code-reviewer',
  '/work/abandoned-cart-recovery',
];
const CASES = PAGES.filter((path) => path.startsWith('/work/'));

test('each case study lives at the same address its links use', async ({ page }) => {
  for (const path of CASES) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${path}`);
  }
});

test('search engines get a sitemap and robots.txt', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  expect(await (await request.get('/sitemap-index.xml')).text()).toContain('sitemap-0.xml');
  const urls = await (await request.get('/sitemap-0.xml')).text();
  for (const path of PAGES) expect(urls).toContain(`<loc>${SITE}${path}</loc>`);
  expect(urls).not.toMatch(/404|ask-index|\/og\//);
});

test('every page has its own title, description and preview image', async ({ page, request }) => {
  const titles = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    const title = await page.title();
    expect(titles.has(title), `${path} repeats "${title}"`).toBe(false);
    titles.add(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const image = (await page.locator('meta[property="og:image"]').getAttribute('content')) ?? '';
    expect(image).toMatch(new RegExp(`^${SITE}/og/.+\\.png$`));
    const response = await request.get(new URL(image).pathname);
    expect(response.status(), image).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  }
});

test('pages describe Shashank as a Person for search engines', async ({ page }) => {
  await page.goto('/');
  const person = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(person['@type']).toBe('Person');
  expect(person.name).toBe('Shashank H R');
  expect(person.jobTitle).toBe('Backend Engineer');
  expect(person.worksFor.name).toBe('Engati');
  expect(person.sameAs).toEqual(
    expect.arrayContaining([expect.stringContaining('linkedin.com'), expect.stringContaining('github.com')]),
  );
});
