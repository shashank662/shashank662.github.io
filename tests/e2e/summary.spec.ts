import { expect, test } from '@playwright/test';

test('the 60-second view has everything a recruiter needs', async ({ page }) => {
  await page.goto('/summary');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shashank H R');
  await expect(page.getByText('Backend Engineer · Engati · Bangalore')).toBeVisible();
  await expect(page.getByText(/full-time at Engati .*6-month internship before that/)).toBeVisible();
  await expect(page.locator('.wins li')).toHaveCount(4);
  const main = page.getByRole('main');
  for (const name of ['Download résumé (PDF)', 'Email', 'LinkedIn', 'GitHub', 'Explore the full site →']) {
    await expect(main.getByRole('link', { name })).toBeVisible();
  }
});

test('the header links to it from every page', async ({ page }) => {
  await page.goto('/work/rcs-billing-pipeline');
  // On a phone it sits in the menu.
  const menu = page.getByRole('button', { name: 'Menu' });
  if (await menu.isVisible()) await menu.click();
  await page.locator('[data-header]').getByRole('link', { name: '60-sec view' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/summary$/);
});

test('it prints as ink on white, without the site chrome', async ({ page }) => {
  await page.goto('/summary');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-header]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ask about me' })).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  // On paper, say where it came from and spell out how to get in touch.
  await expect(page.getByText('shashank662.github.io/summary')).toBeVisible();
  const email = await page.getByRole('link', { name: 'Email' }).evaluate((el) => getComputedStyle(el, '::after').content);
  expect(email).toBe('" (shashankhr06@gmail.com)"');
  await expect(page.getByRole('link', { name: 'Download résumé (PDF)' })).toBeHidden();
});
