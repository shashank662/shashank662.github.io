import { expect, test } from '@playwright/test';

const DURATION = /^(\d+y( \d+m)?|\d+m)$/;

test('every home section renders and scrolling through raises no errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  for (const id of ['about', 'exp', 'work', 'incidents', 'play', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  for (const name of ['Experience', 'Selected work', 'Production incidents', 'The retry flow, live']) {
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('the hero says plainly what Shashank builds', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.lede')).toHaveText('I build reliable backends for high-volume messaging.');
});

test('the career trace dates the degree and roles, not the projects, and opens rows on click', async ({ page }) => {
  await page.goto('/#exp');
  await expect(page.getByText('GET /career · 8 spans · 200 OK')).toBeVisible();

  // The root span, the degree and the two roles show how long they took; the projects built in them carry no dates.
  const durations = page.locator('#exp [data-duration]');
  await expect(durations).toHaveCount(4);
  for (const text of await durations.allTextContents()) expect(text.trim()).toMatch(DURATION);
  await expect(page.locator('#exp li.lvl2')).toHaveCount(4);
  await expect(page.locator('#exp li.lvl2 [data-duration]')).toHaveCount(0);

  const first = page.locator('#exp [data-row-toggle]').first();
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
});

test('a trace row hides its detail until opened, shows all of it, and closes again', async ({ page, isMobile }) => {
  await page.goto('/#exp');
  // The auto-retry row has one of the longest details.
  const row = page.locator('#exp [data-row-toggle]').nth(5);
  const detail = page.locator('#span-5');
  const press = () => (isMobile ? row.tap() : row.click());
  // How far the text runs past the bottom of its box; above 0 means the last line is cut off.
  const overflow = () =>
    detail.evaluate((el) => {
      const text = document.createRange();
      text.selectNodeContents(el);
      return text.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom;
    });

  await expect(detail).toBeHidden();
  await press();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  await expect(detail).toBeVisible();
  await expect.poll(overflow).toBeLessThanOrEqual(0.5);

  await press();
  // A mouse resting on a row opens it on purpose, so move it away; a finger leaves nothing behind.
  if (!isMobile) await page.mouse.move(0, 0);
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await expect(detail).toBeHidden();
});

test('the timeline follows the visitor’s date, and no year label runs into "now"', async ({ page }) => {
  // A visit long after the build, just after New Year: 2027's label lands almost on top of "now".
  await page.clock.setFixedTime(new Date(2027, 0, 20));
  await page.goto('/#exp');
  await expect(page.locator('#about [data-duration]').first()).toHaveText('2y 6m');
  await expect(page.locator('#exp [data-year]', { hasText: '2027' })).toHaveCount(1);

  const now = (await page.locator('#exp [data-now]').boundingBox())!;
  for (const label of await page.locator('#exp [data-year]:visible').all()) {
    const box = (await label.boundingBox())!;
    expect(box.x + box.width).toBeLessThan(now.x);
  }
});

test('About shows the full-time and internship durations', async ({ page }) => {
  await page.goto('/#about');
  const facts = page.locator('#about [data-duration]');
  await expect(facts).toHaveCount(2);
  await expect(facts.nth(1)).toHaveText('6m');
  expect((await facts.nth(0).textContent())?.trim()).toMatch(DURATION);
});

test('every About fact sits under a named term', async ({ page }) => {
  await page.goto('/#about');
  const terms = (await page.locator('#about dt').allTextContents()).map((t) => t.trim());
  expect(terms).not.toContain('');
  // The internship shares the "engati" term with the full-time role.
  await expect(page.locator('#about dd', { hasText: 'intern' })).toBeVisible();
});

test('with reduced motion, the About words are fully visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#about');
  const opacity = await page.locator('#about .w').first().evaluate((el) => getComputedStyle(el).opacity);
  expect(opacity).toBe('1');
});

test('before they light up, the About words still meet 3:1 contrast in both themes', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    // Unscrolled, the paragraph is below the hero, so every word is at its faintest.
    const faintest = await page.locator('[data-word-reveal]').evaluate((paragraph) => {
      const rgb = (css: string) => css.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const channel = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
      const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      const bg = rgb(getComputedStyle(document.body).backgroundColor);
      const ratios = [...paragraph.querySelectorAll<HTMLElement>('.w')].map((word) => {
        const style = getComputedStyle(word);
        const alpha = Number(style.opacity);
        const shown = rgb(style.color).map((c, i) => alpha * c + (1 - alpha) * bg[i]);
        const [light, dark] = [luminance(shown), luminance(bg)].sort((a, b) => b - a);
        return (light + 0.05) / (dark + 0.05);
      });
      return Math.min(...ratios);
    });
    expect(faintest, `faintest About word in ${colorScheme} mode`).toBeGreaterThanOrEqual(3);
  }
});

test('incidents show their results and contact opens an email', async ({ page }) => {
  await page.goto('/#incidents');
  await expect(page.locator('#incidents article')).toHaveCount(2);
  await expect(page.getByText('−60%')).toBeVisible();
  await expect(page.getByText('2.5 → 1 GB')).toBeVisible();
  await expect(page.getByRole('link', { name: "Let's talk" })).toHaveAttribute('href', /^mailto:/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('everything that animates in is already showing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero .ch > span').first()).toHaveCSS('transform', 'none');
    await expect(page.locator('.hero .row2')).toHaveCSS('opacity', '1');
    await expect(page.locator('#about .w').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('#exp .bar').first()).toHaveCSS('transform', 'none');
    await expect(page.locator('#incidents .bar i').first()).toHaveCSS('transform', 'none');
  });

  test('the career trace details are open', async ({ page }) => {
    await page.goto('/#exp');
    await expect(page.locator('#span-5')).toBeVisible();
  });
});
