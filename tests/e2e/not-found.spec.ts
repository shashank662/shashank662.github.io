import { expect, test } from '@playwright/test';

test('a missing page answers 404 with a trace line and ways back', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('GET /no-such-page → 404 · span not found')).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: '← Home' })).toHaveAttribute('href', '/');
  await expect(main.getByRole('link', { name: '60-sec view' })).toHaveAttribute('href', '/summary');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
