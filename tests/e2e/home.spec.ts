import { expect, test } from './fixtures';

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
  // A non-breaking hyphen keeps "high-volume" on one line.
  await expect(page.locator('.lede')).toHaveText('I build reliable backends for high\u2011volume messaging.');
});

test('the typed line has room for its longest line, so typing never pushes the hero around', async ({ page }) => {
  await page.goto('/');
  // Grows are measured synchronously, between the typing script's frames.
  const grows = await page.evaluate(() => {
    const typed = document.querySelector<HTMLElement>('[data-typed]');
    const line = typed?.closest('p');
    if (!typed || !line) return [Infinity];
    const lines: string[] = JSON.parse(typed.dataset.lines ?? '[]');
    typed.textContent = '';
    const empty = line.getBoundingClientRect().height;
    return lines.map((text) => {
      typed.textContent = text;
      return line.getBoundingClientRect().height - empty;
    });
  });
  expect(grows).toEqual(grows.map(() => 0));
});

test('the typed line grows from a prompt that stays put, so typing never slides it along', async ({ page }) => {
  await page.goto('/');
  // Measured synchronously, between the typing script's frames.
  const prompts = await page.evaluate(() => {
    const typed = document.querySelector<HTMLElement>('[data-typed]');
    const prompt = document.querySelector<HTMLElement>('.typed .pr');
    if (!typed || !prompt) return [Infinity];
    const lines: string[] = JSON.parse(typed.dataset.lines ?? '[]');
    return ['', ...lines].map((text) => {
      typed.textContent = text;
      return prompt.getBoundingClientRect().x;
    });
  });
  expect(new Set(prompts).size).toBe(1);
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
  await expect(page.getByRole('link', { name: 'Let\u2019s talk' })).toHaveAttribute('href', /^mailto:/);
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

test("hovering Let's talk never moves the arrow out from under the pointer, so it can't flicker", async ({ page }) => {
  await page.goto('/');
  const link = page.locator('#contact .big');
  await link.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  // The arrow's hovered pose, as the stylesheet sets it.
  await link.hover({ position: { x: 20, y: 40 } });
  await page.waitForTimeout(800);
  const hovered = await link.locator('span').evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  // A point flickers if it is over the link with the arrow at rest (hover starts) but not once the arrow has moved (hover ends).
  const flickering = await link.evaluate((el, pose) => {
    const arrow = el.querySelector('span')!;
    arrow.style.transition = 'none';
    const over = (x: number, y: number) => document.elementFromPoint(x, y)?.closest('#contact .big') === el;
    const box = arrow.getBoundingClientRect();
    const points: [number, number][] = [];
    for (let x = box.left - 20; x <= box.right + 60; x += 4) for (let y = box.top - 60; y <= box.bottom + 60; y += 4) points.push([x, y]);
    const atRest = points.map(([x, y]) => over(x, y));
    arrow.style.transform = pose;
    return points.filter((_, i) => atRest[i] && !over(...points[i])).length;
  }, hovered);
  expect(flickering).toBe(0);
});

test('the name at the top takes at most 60% of a laptop screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on phones the name is sized to the screen');
  await page.goto('/');
  const share = await page.locator('[data-hero] h1.name').evaluate((name) => {
    const letters = [...name.querySelectorAll('.ch')].map((c) => c.getBoundingClientRect());
    return (letters.at(-1)!.right - letters[0].left) / innerWidth;
  });
  expect(share).toBeLessThanOrEqual(0.6);
});

test('a letter of the name turns accent at once near the pointer, without waiting on its slide-in delay', async ({ page }) => {
  await page.goto('/');
  const timing = await page.locator('[data-hero] .ch > span').last().evaluate((span) => {
    const style = getComputedStyle(span);
    const props = style.transitionProperty.split(', ');
    const at = props.indexOf('color');
    // A shorter list repeats to cover every property, as CSS does.
    const pick = (list: string) => list.split(', ')[at % list.split(', ').length];
    return { delay: pick(style.transitionDelay), duration: parseFloat(pick(style.transitionDuration)) };
  });
  expect(timing.delay).toBe('0s');
  expect(timing.duration).toBeLessThanOrEqual(0.15);
});

test('the name reads "Shashank H R" in full, on one line and inside the screen', async ({ page }) => {
  await page.goto('/');
  const name = page.getByRole('heading', { level: 1, name: 'Shashank H R', exact: true });
  await expect(name).toBeVisible();
  // Wait for the letters to finish sliding up before measuring them.
  await expect(page.locator('[data-hero]')).toHaveClass(/\bgo\b/);
  await page.waitForTimeout(1800);
  const boxes = await page.locator('[data-hero] .ch').evaluateAll((letters) =>
    letters.map((letter) => letter.getBoundingClientRect()).map(({ left, right, top }) => ({ left, right, top })),
  );
  expect(boxes).toHaveLength('ShashankHR'.length);
  expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
  const width = page.viewportSize()?.width ?? 0;
  expect(Math.min(...boxes.map((box) => box.left))).toBeGreaterThanOrEqual(0);
  expect(Math.max(...boxes.map((box) => box.right))).toBeLessThanOrEqual(width);
  // The initials stand apart from "Shashank" as words, not run together.
  const [k, h, r] = [boxes[7], boxes[8], boxes[9]];
  expect(h.left - k.right).toBeGreaterThan(8);
  expect(r.left - h.right).toBeGreaterThan(8);
});

test('the first screen invites people short on time to the 60-second summary', async ({ page }) => {
  await page.goto('/');
  const invite = page.locator('[data-hero]').getByRole('link', { name: 'Short on time? Read the 60-second summary' });
  await expect(invite).toBeVisible();
  await expect(invite).toHaveAttribute('href', '/summary');
  // In the first screen, clear of the fixed header, with no scrolling.
  const box = await invite.boundingBox();
  const header = await page.locator('[data-header]').boundingBox();
  const viewport = page.viewportSize();
  expect(box && header && viewport).toBeTruthy();
  if (!box || !header || !viewport) return;
  expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  // Big enough to tap on a phone.
  expect(box.height).toBeGreaterThanOrEqual(24);
});
