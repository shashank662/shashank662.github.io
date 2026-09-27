import { expect, test } from './fixtures';

test('home shows the hero and the live clock without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Shashank' })).toBeVisible();
  await expect(page.locator('[data-clock]').first()).toHaveText(/\d\d:\d\d:\d\d IST/);
  expect(errors).toEqual([]);
});

test('the system dark setting is used on a first visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});
