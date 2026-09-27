import { expect, test, type Page } from '@playwright/test';
import { LANDING } from '../../src/lib/landing';

// This file uses @playwright/test directly: every test starts as a first visit, when the landing screen plays.

const ON = /(^|\s)landing(\s|$)/;
/** Long enough for the letters to open, hold and dive, with room for a slow machine. */
const WHOLE = LANDING.diveAt + LANDING.diveMs + 3000;
const DIVE = LANDING.diveMs + 1500;

const html = (page: Page) => page.locator('html');
const screen = (page: Page) => page.locator('[data-landing]');
/** Read straight after a navigation, before the landing screen could have ended by itself. */
const landingNow = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('landing'));

test('a first visit opens on SHR in light letters on a dark screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await expect(screen(page)).toBeVisible();
  await expect(page.locator('[data-fill]')).toHaveText('SHR');
  // Each letter opens out of the line.
  await expect
    .poll(() => page.$$eval('[data-band]', (bands) => bands.map((band) => Number(band.getAttribute('height')) > 0)))
    .toEqual([true, true, true]);
  await expect(page.locator('[data-screen]')).toHaveCSS('fill', 'rgb(20, 20, 20)');
  await expect(page.locator('[data-fill]')).toHaveCSS('fill', 'rgb(241, 237, 228)');
  expect(errors).toEqual([]);
});

test('the dive heads into the S where its stroke is as deep as the script assumes, so the S covers the screen', async ({
  page,
}) => {
  await page.goto('/');
  // Once the line has faded, all three letters are open and holding still.
  await expect
    .poll(() => page.locator('[data-line]').evaluate((line) => (line as SVGRectElement).style.opacity))
    .toBe('0');
  const [x, y, assumed] = ((await page.locator('[data-landing]').getAttribute('data-origin')) ?? '').split(' ').map(Number);
  const shot = await page.screenshot({ scale: 'css' });
  const depth = await page.evaluate(
    async ({ png, x, y }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, image.width, image.height);
      // Inside a letter is anything but the dark screen.
      const inside = (px: number, py: number) => {
        const i = (Math.round(py) * image.width + Math.round(px)) * 4;
        return data[i] > 60 || data[i + 1] > 60 || data[i + 2] > 60;
      };
      const angles = Array.from({ length: 72 }, (_, a) => (a * Math.PI) / 36);
      let r = 0;
      while (r < 1000 && angles.every((t) => inside(x + (r + 1) * Math.cos(t), y + (r + 1) * Math.sin(t)))) r += 1;
      return r;
    },
    { png: shot.toString('base64'), x, y },
  );
  expect(depth).toBeGreaterThanOrEqual(assumed * 0.9);
});

test('then it dives into the page by itself, and the name rises as it goes', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await expect(page.locator('[data-hero]')).not.toHaveClass(/\bgo\b/);

  await expect(html(page)).not.toHaveClass(ON, { timeout: WHOLE });
  await expect(screen(page)).toBeHidden();
  await expect(page.locator('[data-hero]')).toHaveClass(/\bgo\b/);
  await expect(page.getByRole('heading', { level: 1, name: 'Shashank' })).toBeVisible();
});

test('a scroll skips straight to the dive, without scrolling the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Phones have no mouse wheel; the tap test covers them.');
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 600);
  await expect(html(page)).not.toHaveClass(ON, { timeout: DIVE });
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('a key press skips it too', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await page.keyboard.press('ArrowDown');
  await expect(html(page)).not.toHaveClass(ON, { timeout: DIVE });
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('a tap skips it on a phone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch only.');
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await page.touchscreen.tap(195, 420);
  await expect(html(page)).not.toHaveClass(ON, { timeout: DIVE });
});

test('it plays once per visit, so a reload goes straight to the page', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await page.keyboard.press('Escape');
  await expect(html(page)).not.toHaveClass(ON, { timeout: DIVE });
  await page.reload();
  expect(await landingNow(page)).toBe(false);
});

test('it does not play when coming from another page of the site', async ({ page }) => {
  await page.goto('/summary');
  await page.locator('header a[href="/"]').click();
  await page.waitForURL((url) => url.pathname === '/');
  expect(await landingNow(page)).toBe(false);
});

test('a link to a section goes straight there', async ({ page }) => {
  await page.goto('/#work');
  expect(await landingNow(page)).toBe(false);
});

test('the page is there for screen readers from the start', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  await expect(screen(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('heading', { level: 1, name: 'Shashank' })).toBeAttached();
  await expect(page.locator('.lede')).toHaveText(/reliable backends/);
});

test('the page paints behind the screen, so its largest text is not held back', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).toHaveClass(ON);
  const lcp = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        new PerformanceObserver((list) => resolve(list.getEntries().at(-1)?.startTime ?? Infinity)).observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
      }),
  );
  expect(lcp).toBeLessThan(LANDING.diveAt);
});

test('nothing on the page moves when the screen clears', async ({ page }) => {
  await page.goto('/');
  await expect(html(page)).not.toHaveClass(ON, { timeout: WHOLE });
  const shift = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!entry.hadRecentInput) total += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 300);
      }),
  );
  expect(shift).toBeLessThan(0.01);
});

test.describe('in the dark theme', () => {
  test.use({ colorScheme: 'dark' });

  test('the screen stays dark and the letters stay light', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(html(page)).toHaveClass(ON);
    await expect(page.locator('[data-screen]')).toHaveCSS('fill', 'rgb(20, 20, 20)');
    await expect(page.locator('[data-fill]')).toHaveCSS('fill', 'rgb(241, 237, 228)');
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('there is no landing screen at all', async ({ page }) => {
    await page.goto('/');
    expect(await landingNow(page)).toBe(false);
    await expect(screen(page)).toBeHidden();
  });
});
