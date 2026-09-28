import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const pill = (page: Page) => page.getByRole('button', { name: 'Feedback' });
const panel = (page: Page) => page.getByRole('dialog', { name: 'Feedback on this site' });
const ENDPOINT = 'https://feedback.test/api/feedback';

test.beforeEach(async ({ context }) => {
  // Never reach GitHub, Turnstile or the real Worker from a test: a popup to GitHub is only read, not loaded, and the
  // tests that send stand in for Turnstile and the Worker (page routes win over these).
  await context.route('https://github.com/**', (route) => route.abort());
  await context.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await context.route('https://*.workers.dev/**', (route) => route.abort());
});

/** Serves the home page with the form's two settings replaced, so a test decides where it sends. */
async function withSettings(page: Page, endpoint: string, siteKey: string): Promise<void> {
  await page.route('**/', async (route) => {
    const res = await route.fetch();
    const html = (await res.text())
      .replace(/data-endpoint(="[^"]*")?/, endpoint ? `data-endpoint="${endpoint}"` : 'data-endpoint')
      .replace(/data-sitekey(="[^"]*")?/, siteKey ? `data-sitekey="${siteKey}"` : 'data-sitekey');
    await route.fulfill({ response: res, body: html });
  });
}

/** Serves the page with the Worker set up, Turnstile and the Worker stood in for; never the real ones. */
async function asIfSetUp(page: Page, reply: { status: number; body: Record<string, unknown> }): Promise<string[]> {
  const sent: string[] = [];
  await withSettings(page, ENDPOINT, 'test-key');
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: 'window.turnstile = { render: (el, o) => { setTimeout(() => o.callback("person-token")); return "w1"; }, reset() {} };',
    }),
  );
  await page.route(ENDPOINT, async (route) => {
    sent.push(route.request().postData() ?? '');
    await route.fulfill({ status: reply.status, contentType: 'application/json', body: JSON.stringify(reply.body) });
  });
  return sent;
}

test('the Feedback button sits at the bottom, clear of "Ask about me", on every page', async ({ page }) => {
  for (const path of ['/', '/work/auto-retry-framework']) {
    await page.goto(path);
    await expect(pill(page)).toBeVisible();
    const box = (await pill(page).boundingBox())!;
    const ask = (await page.getByRole('button', { name: 'Ask about me' }).boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.y).toBeGreaterThan(viewport.height - 80);
    const apart = box.x + box.width <= ask.x || ask.x + ask.width <= box.x;
    expect(apart).toBe(true);
  }
});

test('the form asks what it is about, says it becomes public, and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await pill(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('radio')).toHaveCount(3);
  await expect(panel(page).getByRole('radio', { name: "Something's broken" })).toBeChecked();
  await expect(panel(page).getByRole('textbox', { name: 'Your feedback' })).toBeFocused();
  await expect(panel(page).getByText(/becomes a public issue on the site's GitHub repo/)).toBeVisible();
  await expect(panel(page).getByText(/Sent along: page \//)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(pill(page)).toBeFocused();
});

test('the site sends to the Worker, with its Turnstile key', async ({ page }) => {
  await page.goto('/');
  const panelEl = page.locator('[data-feedback-panel]');
  await expect(panelEl).toHaveAttribute('data-endpoint', 'https://shashank662-portfolio.shashankhr06.workers.dev/api/feedback');
  await expect(panelEl).toHaveAttribute('data-sitekey', /^0x4/);
});

test('without the Worker set up, Send opens a filled-in GitHub issue', async ({ page, context }) => {
  await withSettings(page, '', '');
  await page.goto('/');
  await pill(page).click();
  const send = panel(page).getByRole('button', { name: 'Continue on GitHub' });
  await send.click();
  await expect(panel(page).getByRole('alert')).toHaveText('Write a few words first.');

  await panel(page).getByRole('radio', { name: 'Could be clearer' }).check({ force: true });
  await panel(page).getByRole('textbox').fill('The Experience dates are hard to read.');
  const opened = context.waitForEvent('request', (request) => request.url().startsWith('https://github.com/'));
  await send.click();
  const url = new URL((await opened).url());
  expect(url.pathname).toBe('/shashank662/shashank662.github.io/issues/new');
  expect(url.searchParams.get('title')).toBe('Feedback (could be clearer): The Experience dates are hard to read.');
  // Nothing is sent until the visitor presses Create on GitHub, and the form says so rather than claiming it's logged.
  await expect(panel(page).getByText('One more step, on GitHub.')).toBeVisible();
  await expect(panel(page).getByText("Thanks, it's logged.")).toHaveCount(0);
});

test('once set up, a note goes to the Worker with the Turnstile token, and the visitor gets the issue link', async ({ page }) => {
  const sent = await asIfSetUp(page, { status: 201, body: { number: 12, url: 'https://github.com/shashank662/shashank662.github.io/issues/12' } });
  await page.goto('/');
  await pill(page).click();
  await panel(page).getByRole('textbox').fill('Love the playground.');
  await panel(page).getByRole('radio', { name: 'Idea' }).check({ force: true });
  await expect.poll(() => page.evaluate(() => Boolean(window.turnstile))).toBe(true);
  await panel(page).getByRole('button', { name: 'Send' }).click();

  await expect(panel(page).getByText("Thanks, it's logged.")).toBeVisible();
  await expect(panel(page).getByRole('link', { name: /The issue on GitHub/ })).toHaveAttribute('href', /issues\/12$/);
  const body = JSON.parse(sent[0]);
  expect(body).toMatchObject({ type: 'idea', message: 'Love the playground.', page: '/', token: 'person-token' });
});

test('if the Worker turns a note away, the form says why and offers GitHub instead', async ({ page }) => {
  await asIfSetUp(page, { status: 403, body: { error: "Couldn't confirm you're a person. Try again." } });
  await page.goto('/');
  await pill(page).click();
  await panel(page).getByRole('textbox').fill('The menu overlaps on my tablet.');
  await expect.poll(() => page.evaluate(() => Boolean(window.turnstile))).toBe(true);
  await panel(page).getByRole('button', { name: 'Send' }).click();

  const alert = panel(page).getByRole('alert');
  await expect(alert).toContainText("Couldn't confirm you're a person.");
  await expect(alert.getByRole('link', { name: 'Send it on GitHub instead' })).toHaveAttribute('href', /issues\/new\?/);
  await expect(panel(page).getByRole('button', { name: 'Send' })).toBeEnabled();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the button is hidden, since it needs JavaScript', async ({ page }) => {
    await page.goto('/');
    await expect(pill(page)).toBeHidden();
  });
});
