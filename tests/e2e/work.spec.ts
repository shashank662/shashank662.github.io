import { expect, test } from '@playwright/test';

const CASES = [
  { slug: 'auto-retry-framework', title: 'Auto-retry framework', tradeoff: true },
  { slug: 'rcs-billing-pipeline', title: 'RCS billing pipeline', tradeoff: true },
  { slug: 'ai-code-reviewer', title: 'AI code reviewer', tradeoff: true },
  { slug: 'abandoned-cart-recovery', title: 'Abandoned-cart recovery', tradeoff: false },
];

test('every case study renders all its sections without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  for (const [i, c] of CASES.entries()) {
    await page.goto(`/work/${c.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(c.title);
    await expect(page.getByText(`Case study 0${i + 1} / 04`)).toBeVisible();
    await expect(page.locator('.stats b')).toHaveCount(4);
    // A case study with a hardest tradeoff gets its own section before Results, and the numbers run on.
    const sections = c.tradeoff
      ? ['(01) The problem', '(02) How it works', '(03) Key decisions', '(04) The hardest tradeoff', '(05) Results']
      : ['(01) The problem', '(02) How it works', '(03) Key decisions', '(04) Results'];
    for (const name of sections) {
      await expect(page.getByRole('heading', { name })).toBeVisible();
    }
    // Every numbered dot in the diagram has its numbered step underneath.
    await expect(page.locator('.steps li')).toHaveCount(await page.locator('svg .step').count());
    // The last case study wraps round to the first.
    const next = CASES[(i + 1) % CASES.length];
    await expect(page.getByRole('link', { name: /Next case study/ })).toHaveAttribute('href', `/work/${next.slug}`);
  }
  expect(errors).toEqual([]);
});

test('stat values stay on one line inside their cells', async ({ page }) => {
  for (const c of CASES) {
    await page.goto(`/work/${c.slug}`);
    const stats = page.locator('.stats b');
    await expect(stats).toHaveCount(4);
    const overflowing = await stats.evaluateAll((els) =>
      els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent),
    );
    expect(overflowing, c.slug).toEqual([]);
  }
});

test('case studies fit the screen, with the stats in tidy columns', async ({ page, isMobile }) => {
  for (const c of CASES) {
    await page.goto(`/work/${c.slug}`);
    // Only the diagram may scroll sideways, inside its own box; the page itself never does.
    const width = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      screen: document.documentElement.clientWidth,
    }));
    expect(width.content, c.slug).toBeLessThanOrEqual(width.screen);
    await expect(page.getByRole('button', { name: /^Colour theme/ })).toBeInViewport();

    // On a phone the stats sit in two columns, so the first and third values line up on the left.
    const lefts = await page.locator('.stats b').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
    if (isMobile) expect(lefts[2], c.slug).toBeCloseTo(lefts[0], 0);
  }
});

test('case study 01 links to the playground, as a simulation', async ({ page }) => {
  await page.goto('/work/auto-retry-framework');
  await expect(page.getByRole('link', { name: /interactive simulation/ })).toHaveAttribute('href', '/#play');
});

test('Selected work lists the four case studies and the sandbox brief', async ({ page }) => {
  await page.goto('/#work');
  await expect(page.getByText('5 systems · 4 case studies')).toBeVisible();
  const hrefs = await page
    .locator('#work a[href^="/work/"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs).toEqual(CASES.map((c) => `/work/${c.slug}`));
  await expect(page.getByRole('button', { name: /Prod sandbox/ })).toBeVisible();
});

test('a work row opens its case study, and "Back to work" returns to the list', async ({ page }) => {
  await page.goto('/#work');
  await page.locator('#work a[href="/work/auto-retry-framework"]').click();
  await expect(page).toHaveURL(/\/work\/auto-retry-framework$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Auto-retry framework');

  await page.getByRole('link', { name: 'Back to work' }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator('#work')).toBeInViewport();
});

test('the sandbox row expands in place', async ({ page }) => {
  await page.goto('/#work');
  const brief = page.getByRole('button', { name: /Prod sandbox/ });
  const more = page.locator('#brief-more');
  await expect(brief).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toBeHidden();

  await brief.click();
  await expect(brief).toHaveAttribute('aria-expanded', 'true');
  await expect(more).toBeVisible();
  await expect(more).toContainText('zero impact on production');
});

test('a small card follows the mouse over a work row', async ({ page, isMobile }) => {
  test.skip(isMobile, 'touch screens get no hover card');
  await page.goto('/#work');
  const card = page.locator('[data-work-card]');
  await page.locator('#work a[href="/work/ai-code-reviewer"]').hover();
  await expect(card).toHaveClass(/\bon\b/);
  await expect(card).toContainText('4× faster');

  await page.mouse.move(2, 2);
  await expect(card).not.toHaveClass(/\bon\b/);
});

test('touch screens get no hover card', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'only for touch screens');
  await page.goto('/#work');
  await page.getByRole('button', { name: /Prod sandbox/ }).tap();
  await expect(page.locator('[data-work-card]')).not.toHaveClass(/\bon\b/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the sandbox brief is open and case studies still load', async ({ page }) => {
    await page.goto('/#work');
    await expect(page.locator('#brief-more')).toBeVisible();
    await page.goto('/work/auto-retry-framework');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Auto-retry framework');
  });
});

test('the retry case study states numbers that add up, and who did what', async ({ page }) => {
  await page.goto('/work/auto-retry-framework');
  await expect(page.locator('.stats')).toContainText('45%');
  await expect(page.locator('.stats')).toContainText('~100K');
  await expect(page.locator('.stats')).toContainText('~45K');
  await expect(page.getByText(/rollout was with the DevOps team/i).first()).toBeVisible();
  // No claim that the trackerId alone stops duplicate sends.
  await expect(page.getByText(/isn’t sent twice|idempotency key/)).toHaveCount(0);
});

test('the billing case study explains how a re-run counts each message once', async ({ page }) => {
  await page.goto('/work/rcs-billing-pipeline');
  for (const phrase of [/one billing ID/i, /deleted, then/i, /re-run/i]) {
    await expect(page.locator('main')).toContainText(phrase);
  }
});

test('the AI reviewer states its unit and how it was estimated', async ({ page }) => {
  await page.goto('/work/ai-code-reviewer');
  await expect(page.locator('.stats')).toContainText('30–60 min');
  await expect(page.locator('.stats')).toContainText(/per developer per day, down from ~2 h/);
  await expect(page.locator('main')).toContainText(/estimate/i);
});

test('no page repeats the old 35% → 12% figure', async ({ page }) => {
  for (const path of ['/', '/summary', ...CASES.map((c) => `/work/${c.slug}`)]) {
    await page.goto(path);
    expect(await page.locator('body').innerText(), path).not.toMatch(/35\s?%/);
  }
});
