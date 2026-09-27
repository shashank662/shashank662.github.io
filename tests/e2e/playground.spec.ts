import { expect, test } from '@playwright/test';

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

test('a Meta outage turns every live status amber for about five seconds', async ({ page }) => {
  await page.goto('/#play');
  const outage = page.getByRole('button', { name: /Simulate a Meta outage/ });
  await outage.click();
  await expect(outage).toBeDisabled();
  for (const pill of await page.locator('[data-status]').all()) {
    await expect(pill).toHaveAttribute('data-state', 'degraded');
    await expect(pill).toContainText('meta outage · retrying');
  }
  await expect(outage).toBeEnabled({ timeout: 8000 });
  await expect(page.locator('[data-status]').first()).toHaveAttribute('data-state', 'ok');
});

test('visitors can send their own triggers', async ({ page }) => {
  await page.goto('/#play');
  await page.getByRole('button', { name: /send 5 of your own triggers/ }).click();
  await expect(page.locator('[data-logs]')).toContainText('you sent 5 triggers');
});

test('the model is described in words', async ({ page }) => {
  await page.goto('/#play');
  await expect(page.getByRole('img', { name: /Live model of the auto-retry framework/ })).toBeVisible();
  await expect(page.getByText(/My Engati auto-retry framework, running live/)).toBeVisible();
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
