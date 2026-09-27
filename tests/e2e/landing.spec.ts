import { expect, test, type Page } from '@playwright/test';
import { LANDING, layoutSHR } from '../../src/lib/landing';

// This file uses @playwright/test directly: every test starts as a first visit, when the landing screen plays.
//
// Most tests stop the page's clock once it has loaded and move it on by hand, so each check sees exactly the moment it
// asks for however slow the machine. The largest-paint and layout-shift checks need real frames, so they run in real time.

const ON = /(^|\s)landing(\s|$)/;
/** Long enough, in real time, for the letters to open, hold and dive, with plenty of room for a slow CI machine. */
const WHOLE = 15_000;
/** Enough clock time for the dive to finish once it starts. */
const DIVE = LANDING.diveMs + 300;

const html = (page: Page) => page.locator('html');
const screen = (page: Page) => page.locator('[data-landing]');
/** Read straight after a navigation, before the landing screen could have ended by itself. */
const landingNow = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('landing'));

/** Opens the home page, then stops its clock. */
async function openPaused(page: Page): Promise<void> {
  await page.clock.install();
  await page.goto('/');
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
}

/** Moves the stopped clock on until the line has faded: all three letters are then open and holding still. */
async function toHold(page: Page): Promise<void> {
  const lineOpacity = () => page.locator('[data-line]').evaluate((line) => (line as SVGRectElement).style.opacity);
  for (let step = 0; step < 40 && (await lineOpacity()) !== '0'; step += 1) await page.clock.runFor(100);
  expect(await lineOpacity()).toBe('0');
}

/** Where the landing screen puts SHR on this page's screen: the same layout the page's script uses. */
const layoutOf = (page: Page) => {
  const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
  return layoutSHR(width, height);
};

/** Takes a screenshot and keeps its pixels in the page as window[name], for the checks below to read. */
async function keepShot(page: Page, name: string): Promise<void> {
  const png = (await page.screenshot({ scale: 'css' })).toString('base64');
  await page.evaluate(
    async ({ png, name }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      ctx.drawImage(image, 0, 0);
      Object.assign(window, { [name]: ctx.getImageData(0, 0, image.width, image.height) });
    },
    { png, name },
  );
}

test('a first visit opens on SHR in light letters on a dark screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await openPaused(page);
  await expect(html(page)).toHaveClass(ON);
  await expect(screen(page)).toBeVisible();
  expect(await page.$$eval('[data-fill] use', (letters) => letters.map((letter) => letter.getAttribute('href')))).toEqual([
    '#landing-S',
    '#landing-H',
    '#landing-R',
  ]);
  // Each letter opens out of the line.
  await toHold(page);
  expect(await page.$$eval('[data-band]', (bands) => bands.map((band) => Number(band.getAttribute('height')) > 0))).toEqual([
    true,
    true,
    true,
  ]);
  await expect(page.locator('[data-screen]')).toHaveCSS('fill', 'rgb(20, 20, 20)');
  await expect(page.locator('[data-fill]')).toHaveCSS('fill', 'rgb(241, 237, 228)');
  expect(errors).toEqual([]);
});

test('SHR is drawn just as the display face draws it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Measured on the big desktop letters: the outlines and layout are the same at every size.');
  await openPaused(page);
  await toHold(page);
  // Compare the letters alone: the blue outline crosses them on purpose.
  await page.locator('[data-echo]').evaluate((echo) => {
    (echo as SVGGElement).style.display = 'none';
  });
  await keepShot(page, 'drawn');
  // The same word as text in the page's display face, set in the same place over everything.
  await page.evaluate(({ left, baseline, size }) => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute(
      'style',
      `position:fixed;inset:0;width:100%;height:100%;z-index:1000;background:#141414;font-family:var(--font-display);font-weight:700;font-size:${size}px;letter-spacing:-0.025em`,
    );
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', String(left));
    text.setAttribute('y', String(baseline));
    // Styled like the landing letters: a light fill with a hairline of the same colour.
    text.setAttribute('fill', '#f1ede4');
    text.setAttribute('stroke', '#f1ede4');
    text.setAttribute('stroke-width', '1.5');
    text.textContent = 'SHR';
    svg.append(text);
    document.body.append(svg);
  }, layoutOf(page));
  await keepShot(page, 'typeset');
  const overlap = await page.evaluate(() => {
    const { drawn, typeset } = window as unknown as Record<string, ImageData>;
    const light = (image: ImageData, i: number) => image.data[i] > 150 && image.data[i + 1] > 150 && image.data[i + 2] > 150;
    let both = 0;
    let either = 0;
    for (let i = 0; i < drawn.data.length; i += 4) {
      const a = light(drawn, i);
      const b = light(typeset, i);
      if (a && b) both += 1;
      if (a || b) either += 1;
    }
    return both / either;
  });
  expect(overlap).toBeGreaterThan(0.97);
});

test('the dive heads into the S where its stroke is as deep as the script assumes, so the S covers the screen', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Measured on the big desktop letters: the outlines and layout are the same at every size.');
  await openPaused(page);
  await toHold(page);
  await keepShot(page, 'held');
  const { origin, clearance } = layoutOf(page);
  const depth = await page.evaluate(({ x, y }) => {
    const { held } = window as unknown as Record<string, ImageData>;
    // Inside a letter is anything but the dark screen.
    const inside = (px: number, py: number) => {
      const i = (Math.round(py) * held.width + Math.round(px)) * 4;
      return held.data[i] > 60 || held.data[i + 1] > 60 || held.data[i + 2] > 60;
    };
    const angles = Array.from({ length: 72 }, (_, a) => (a * Math.PI) / 36);
    let r = 0;
    while (r < 1000 && angles.every((t) => inside(x + (r + 1) * Math.cos(t), y + (r + 1) * Math.sin(t)))) r += 1;
    return r;
  }, origin);
  // The dive grows the letters 15% more than the assumed depth needs, so the S still covers the screen when the real
  // stroke is as little as 1 / 1.15 of it.
  expect(depth).toBeGreaterThanOrEqual(clearance / 1.15);
});

test('then it dives into the page by itself, and the name rises as it goes', async ({ page }) => {
  await openPaused(page);
  await expect(html(page)).toHaveClass(ON);
  await expect(page.locator('[data-hero]')).not.toHaveClass(/\bgo\b/);

  await page.clock.runFor(LANDING.diveAt + DIVE);
  await expect(html(page)).not.toHaveClass(ON);
  await expect(screen(page)).toBeHidden();
  await expect(page.locator('[data-hero]')).toHaveClass(/\bgo\b/);
  await expect(page.getByRole('heading', { level: 1, name: 'Shashank' })).toBeVisible();
});

test('a scroll skips straight to the dive, without scrolling the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Phones have no mouse wheel; the tap test covers them.');
  await openPaused(page);
  await expect(html(page)).toHaveClass(ON);
  await page.mouse.move(400, 300);
  await page.mouse.wheel(0, 600);
  await page.clock.runFor(DIVE);
  await expect(html(page)).not.toHaveClass(ON);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('a key press skips it too', async ({ page }) => {
  await openPaused(page);
  await expect(html(page)).toHaveClass(ON);
  await page.keyboard.press('ArrowDown');
  await page.clock.runFor(DIVE);
  await expect(html(page)).not.toHaveClass(ON);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('a tap skips it on a phone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch only.');
  await openPaused(page);
  await expect(html(page)).toHaveClass(ON);
  await page.touchscreen.tap(195, 420);
  await page.clock.runFor(DIVE);
  await expect(html(page)).not.toHaveClass(ON);
});

test('if its script never arrives, the page still shows within a few seconds', async ({ page }) => {
  await page.route(/\.js$/, (route) => route.abort());
  await page.goto('/');
  expect(await landingNow(page)).toBe(true);
  await expect(html(page)).not.toHaveClass(ON, { timeout: 6000 });
  await expect(screen(page)).toBeHidden();
});

test('it plays once per visit, so a reload goes straight to the page', async ({ page }) => {
  await openPaused(page);
  await expect(html(page)).toHaveClass(ON);
  await page.keyboard.press('Escape');
  await page.clock.runFor(DIVE);
  await expect(html(page)).not.toHaveClass(ON);
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
  await openPaused(page);
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
    await openPaused(page);
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
