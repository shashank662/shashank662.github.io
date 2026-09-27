import { expect, test, type Page } from './fixtures';

const NAMES = ['Auto', 'Light', 'Dark', 'Midnight', 'Ocean', 'Forest', 'Sunset', 'Rose', 'Nord', 'Solarized'];

const html = (page: Page) => page.locator('html');
const button = (page: Page) => page.getByRole('button', { name: /^Colour theme/ });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Colour theme' });

test.beforeEach(async ({ page }) => {
  // Instant switches: the circular wipe is a view transition, which reduced motion skips.
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
});

test('the picker lists Auto and the nine themes, with the current one ticked', async ({ page }) => {
  await page.goto('/');
  await expect(button(page)).toHaveAccessibleName('Colour theme: Auto');
  await button(page).click();
  await expect(menu(page)).toBeVisible();
  const radios = menu(page).getByRole('radio');
  await expect(radios).toHaveText(NAMES);
  await expect(menu(page).getByRole('radio', { name: 'Auto' })).toBeChecked();
});

test('choosing a theme recolours the page and is remembered after a reload', async ({ page }) => {
  await page.goto('/');
  await button(page).click();
  await menu(page).getByRole('radio', { name: 'Forest' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'forest');
  await expect(html(page)).toHaveAttribute('data-scheme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 24, 16)');
  await expect(button(page)).toHaveAccessibleName('Colour theme: Forest');

  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'forest');
  await button(page).click();
  await expect(menu(page).getByRole('radio', { name: 'Forest' })).toBeChecked();
});

test('Auto follows the system again, and forgets the stored choice', async ({ page }) => {
  await page.goto('/');
  await button(page).click();
  await menu(page).getByRole('radio', { name: 'Solarized' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'solarized');
  await menu(page).getByRole('radio', { name: 'Auto' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  // On Auto, a change of system setting carries straight through.
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
});

test('works from the keyboard: Enter opens, arrows choose, Escape closes and returns focus', async ({ page }) => {
  await page.goto('/');
  await button(page).focus();
  await page.keyboard.press('Enter');
  await expect(menu(page)).toBeVisible();
  await expect(menu(page).getByRole('radio', { name: 'Auto' })).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(menu(page).getByRole('radio', { name: 'Light' })).toBeFocused();
  await expect(menu(page).getByRole('radio', { name: 'Light' })).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('ArrowLeft');
  await expect(html(page)).toHaveAttribute('data-theme', 'light');

  await page.keyboard.press('Escape');
  await expect(menu(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
});

test('the picker fits on the screen', async ({ page }) => {
  await page.goto('/');
  await button(page).click();
  const box = await menu(page).boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport).toBeTruthy();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
});
