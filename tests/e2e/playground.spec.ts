import { expect, test } from './fixtures';

const percent = async (text: Promise<string | null>) => parseFloat((await text) ?? '0');

test('switching the framework off pushes the failure rate above 25% within five seconds', async ({ page }) => {
  await page.goto('/#play');
  const rate = page.locator('[data-metric="fail"]');
  const framework = page.getByRole('switch', { name: 'Retry framework' });
  await expect(framework).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => percent(rate.textContent())).toBeLessThan(20);

  await framework.click();
  await expect(framework).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => percent(rate.textContent()), { timeout: 5000 }).toBeGreaterThan(25);
});

test('the numbers keep moving while the controls are on screen, even with the canvas scrolled away', async ({ page }) => {
  await page.goto('/');
  // On a phone the controls sit under the canvas, so centring the log scrolls the canvas off the screen.
  await page.locator('[data-logs]').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const framework = page.getByRole('switch', { name: 'Retry framework' });
  await framework.click();
  await expect(framework).toHaveAttribute('aria-checked', 'false');
  const rate = page.locator('[data-metric="fail"]');
  await expect.poll(() => percent(rate.textContent()), { timeout: 5000 }).toBeGreaterThan(25);
});

test('a burst of error webhooks turns every live status amber for about five seconds', async ({ page }) => {
  await page.goto('/#play');
  const burst = page.getByRole('button', { name: /Simulate error webhooks/ });
  await burst.click();
  await expect(burst).toBeDisabled();
  for (const pill of await page.locator('[data-status]').all()) {
    await expect(pill).toHaveAttribute('data-state', 'degraded');
    await expect(pill).toContainText('error webhooks · retrying');
  }
  await expect(burst).toBeEnabled({ timeout: 8000 });
  await expect(page.locator('[data-status]').first()).toHaveAttribute('data-state', 'ok');
});

test('a burst of error webhooks started before the model is on screen still ends, and the site goes back to normal', async ({ page }) => {
  await page.goto('/');
  // Clicked where it sits, off-screen, so the model hasn't started yet.
  const burst = page.locator('[data-error-webhooks]');
  await burst.evaluate((button: HTMLButtonElement) => button.click());
  await expect(burst).toBeDisabled();
  await expect(burst).toBeEnabled({ timeout: 8000 });
  await expect(page.locator('[data-status]').first()).toHaveAttribute('data-state', 'ok');
});

test('visitors can send their own triggers', async ({ page }) => {
  await page.goto('/#play');
  await page.getByRole('button', { name: /send 5 of your own triggers/ }).click();
  await expect(page.locator('[data-logs]')).toContainText('you sent 5 triggers');
});

test('the simulation is described in words, and says its numbers are illustrative', async ({ page }) => {
  await page.goto('/#play');
  await expect(page.getByRole('img', { name: /Interactive simulation of the auto-retry framework/ })).toBeVisible();
  await expect(page.getByText(/An interactive simulation of my Engati auto-retry framework/)).toBeVisible();
});

test('with reduced motion it waits behind a Play button', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#play');
  const play = page.getByRole('button', { name: /Play the simulation/ });
  await expect(play).toBeVisible();
  await play.click();
  await expect(play).toBeHidden();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('it points to the case study instead of showing dead controls', async ({ page }) => {
    await page.goto('/#play');
    await expect(page.getByRole('link', { name: /Read how the framework works/ })).toBeVisible();
    await expect(page.getByRole('switch')).toBeHidden();
  });
});
