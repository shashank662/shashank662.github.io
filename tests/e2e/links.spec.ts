import { expect, test } from '@playwright/test';

/** Linked on purpose, added just before launch (spec §15, item 7). */
const PENDING = new Set(['/resume.pdf']);

test('every internal link works and every page loads without errors', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`${page.url()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`${page.url()}: ${err.message}`));

  const seen = new Set<string>();
  const queue = ['/'];
  const broken: string[] = [];
  while (queue.length > 0) {
    const path = queue.shift()!;
    if (seen.has(path) || PENDING.has(path)) continue;
    seen.add(path);
    const response = await request.get(path);
    if (response.status() !== 200) {
      broken.push(`${path} → ${response.status()}`);
      continue;
    }
    if (!(response.headers()['content-type'] ?? '').includes('text/html')) continue;
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? '/'));
    for (const href of hrefs) queue.push(new URL(href, 'http://site').pathname);
  }
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
  // Reached by following links from the home page alone.
  expect([...seen]).toEqual(
    expect.arrayContaining([
      '/',
      '/summary',
      '/work/auto-retry-framework',
      '/work/rcs-billing-pipeline',
      '/work/ai-code-reviewer',
      '/work/abandoned-cart-recovery',
    ]),
  );
});
