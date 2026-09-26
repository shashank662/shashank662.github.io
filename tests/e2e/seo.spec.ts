import { expect, test } from '@playwright/test';

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
