import { expect, test } from '@playwright/test';

test('the panel opens, answers a chip and a typed question, and Escape closes it', async ({ page }) => {
  await page.goto('/');
  const pill = page.getByRole('button', { name: 'Ask about me' });
  await pill.click();
  const panel = page.getByRole('dialog', { name: 'Ask about Shashank' });
  await expect(panel).toBeVisible();
  const input = panel.getByRole('textbox', { name: 'Your question' });
  await expect(input).toBeFocused();

  await panel.getByRole('button', { name: 'Years of experience?' }).click();
  const log = panel.getByRole('log');
  await expect(log).toContainText(/years? .*full-time at Engati/);
  await expect(log.getByRole('link', { name: /^From: About/ })).toBeVisible();

  await input.fill('tell me abt the retry thing');
  await input.press('Enter');
  await expect(log.getByRole('link', { name: /^From: Auto-retry framework/ })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(pill).toBeFocused();
});

test('an off-topic question gets the fallback with ways to reach Shashank', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about me' }).click();
  const panel = page.getByRole('dialog', { name: 'Ask about Shashank' });
  await panel.getByRole('textbox', { name: 'Your question' }).fill("what's the weather");
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.getByRole('log')).toContainText("I don't have an answer for that yet");
  await expect(panel.getByRole('log').getByRole('link', { name: 'Email' })).toHaveAttribute('href', /^mailto:/);
});

test("if its answers can't load, it says so and tries again on the next question", async ({ page }) => {
  let online = false;
  await page.route('**/ask-index.json', (route) => (online ? route.continue() : route.abort()));
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about me' }).click();
  const panel = page.getByRole('dialog', { name: 'Ask about Shashank' });
  const log = panel.getByRole('log');
  const chip = panel.getByRole('button', { name: 'Tech stack?', exact: true });

  await chip.click();
  await expect(log).toContainText("I couldn't load my answers just now");
  await expect(log.getByRole('link', { name: 'Email' })).toHaveAttribute('href', /^mailto:/);

  online = true;
  await chip.click();
  await expect(log).toContainText('Spring Boot');
});

test("if its code can't load, it says so instead of going quiet", async ({ page }) => {
  await page.route('**/_astro/ask-bot.*.js', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about me' }).click();
  const panel = page.getByRole('dialog', { name: 'Ask about Shashank' });
  await panel.getByRole('button', { name: 'Tech stack?', exact: true }).click();
  await expect(panel.getByRole('log')).toContainText("I couldn't load my answers just now");
});

test('following a source link closes the panel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask about me' }).click();
  const panel = page.getByRole('dialog', { name: 'Ask about Shashank' });
  await panel.getByRole('textbox', { name: 'Your question' }).fill('what is the playground');
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter');
  await panel.getByRole('link', { name: /^From: Playground/ }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#play')).toBeInViewport();
});

test('the search and the answers load only when the panel first opens', async ({ page }) => {
  const fetched: string[] = [];
  page.on('request', (request) => fetched.push(new URL(request.url()).pathname));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(fetched).not.toContain('/ask-index.json');
  await page.getByRole('button', { name: 'Ask about me' }).click();
  await expect.poll(() => fetched.includes('/ask-index.json')).toBe(true);
});

test('the panel works on a case study page too', async ({ page }) => {
  await page.goto('/work/ai-code-reviewer');
  await page.getByRole('button', { name: 'Ask about me' }).click();
  const panel = page.getByRole('dialog', { name: 'Ask about Shashank' });
  await panel.getByRole('button', { name: 'Tech stack?' }).click();
  await expect(panel.getByRole('log')).toContainText('Spring Boot');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the pill is not shown, since it could not open', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Ask about me' })).toBeHidden();
  });
});
