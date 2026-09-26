import { expect, test } from '@playwright/test';

const CASES = [
  { slug: 'auto-retry-framework', title: 'Auto-retry framework' },
  { slug: 'rcs-billing-pipeline', title: 'RCS billing pipeline' },
  { slug: 'ai-code-reviewer', title: 'AI code reviewer' },
  { slug: 'abandoned-cart-recovery', title: 'Abandoned-cart recovery' },
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
    for (const name of ['(01) The problem', '(02) How it works', '(03) Key decisions', '(04) Results']) {
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

test('case study 01 links to the playground', async ({ page }) => {
  await page.goto('/work/auto-retry-framework');
  await expect(page.getByRole('link', { name: /See it running/ })).toHaveAttribute('href', '/#play');
});
