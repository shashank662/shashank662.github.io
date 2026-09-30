import { expect, test } from './fixtures';

test('the hero says plainly what Shashank builds', async ({ page }) => {
  await page.goto('/');
  // A non-breaking hyphen keeps "high-volume" on one line.
  await expect(page.locator('.lede')).toHaveText('I build reliable backends for high\u2011volume messaging.');
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
    await expect(page.locator('#about h2')).toBeVisible();
    await expect(page.locator('#incidents .bar i').first()).toHaveCSS('transform', 'none');
  });

  test('the roles and their projects all show', async ({ page }) => {
    await page.goto('/#exp');
    await expect(page.locator('#exp .projects a')).toHaveCount(4);
    await expect(page.locator('#exp .projects a').first()).toBeVisible();
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

// One main action: View work is the only solid button. The summary is a quiet text link, and the header's
// 60-sec view an outline, so neither outweighs the work itself.
test('View work is the one main action; the summary is a quiet link', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('[data-hero]');
  const style = (selector: string, prop: string) =>
    page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
  const accent = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--accent').trim());
  const toHex = (rgb: string) => '#' + (rgb.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');

  expect(await style('[data-hero] .quick', 'font-size')).toBe(await style('[data-hero] .intro', 'font-size'));
  expect(toHex(await style('[data-hero] .quick', 'color'))).not.toBe(accent);
  // View work is filled; Résumé is not.
  expect(await style('[data-hero] .cta.primary', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await hero.getByRole('link', { name: 'Résumé' }).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  // The header's 60-sec view, where it shows, is not a filled accent button.
  const summary = page.locator('[data-header] nav').getByRole('link', { name: '60-sec view' });
  if (await summary.isVisible()) {
    expect(await summary.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  }
});

test('the header links to the résumé and LinkedIn on wide screens; on a phone they are in the menu', async ({ page, isMobile }) => {
  await page.goto('/');
  const header = page.locator('[data-header]');
  const place = isMobile ? header.locator('[data-menu]') : header.locator('nav');
  if (isMobile) await header.getByRole('button', { name: 'Menu' }).click();
  const resume = place.getByRole('link', { name: 'Résumé' });
  const linkedin = place.getByRole('link', { name: 'LinkedIn' });
  await expect(resume).toHaveAttribute('href', '/resume.pdf');
  await expect(linkedin).toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/in\//);
  await expect(resume).toBeVisible();
  await expect(linkedin).toBeVisible();
  // The header still fits on one line, inside the screen.
  const width = page.viewportSize()?.width ?? 0;
  const boxes = await header.locator('nav > *').evaluateAll((items) =>
    items.map((el) => el.getBoundingClientRect()).filter((box) => box.width > 0).map((box) => box.toJSON()),
  );
  expect(Math.max(...boxes.map((b) => b.right))).toBeLessThanOrEqual(width);
  const middles = boxes.map((b) => b.top + b.height / 2);
  expect(Math.max(...middles) - Math.min(...middles)).toBeLessThanOrEqual(2);
});

test('on a phone the header is the name, the theme and one Menu with Work, About and Contact', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phones only.');
  await page.goto('/');
  const header = page.locator('[data-header]');
  const menu = header.getByRole('button', { name: 'Menu' });
  const visibleLinks = await header.locator('nav a').evaluateAll((all) => all.filter((a) => a.getBoundingClientRect().width > 0).length);
  expect(visibleLinks).toBe(0);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');

  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const drawer = header.locator('[data-menu]');
  for (const [name, href] of [['Work', '/#work'], ['Career', '/#about'], ['Contact', '/#contact'], ['60-sec view', '/summary']]) {
    await expect(drawer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();

  // A link closes the menu and goes to its section.
  await menu.click();
  await drawer.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/#work$/);
});

test('the favicon is the S outline, drawn without depending on any installed font', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  const svg = await (await request.get('/favicon.svg')).text();
  expect(svg).not.toContain('<text');
  expect(svg).toContain('<path');
  expect((await request.get('/apple-touch-icon.png')).headers()['content-type']).toBe('image/png');
});

test('the page names no side projects and shows no phone number', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/ZoomCart|Real-Time Data Integration Pipeline/i);
  expect(text).not.toMatch(/9035265512|\+91/);
});

test('the playground says it is a simulation, and incidents read as write-ups, not a live dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#play .sec-head')).toContainText('interactive simulation · illustrative numbers');
  await expect(page.locator('#play')).toContainText(/illustrative, not production data/i);
  await expect(page.locator('#incidents .sec-head')).toContainText('2 write-ups from production');
  await expect(page.locator('body')).not.toContainText(/running live|0 open/);
});

test('homepage leads from work to career and keeps legacy destinations useful', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  expect(await page.locator('main > section[id]').evaluateAll(all => all.map(el => el.id))).toEqual(['top', 'work', 'exp', 'incidents', 'play', 'contact']);
  for (const id of ['about', 'stack', 'incidents']) {
    await page.goto('/?destination=' + id + '#' + id);
    await expect(page.locator('#' + id)).toBeInViewport();
  }
  await expect(page.locator('#stack')).toContainText('Skills');
  await expect(page.locator('#about')).toContainText('Career');
  expect(errors).toEqual([]);
});
test('career dates stay visible while projects link to evidence', async ({ page }) => {
  await page.goto('/#exp');
  const exp = page.locator('#exp');
  await expect(exp.getByRole('heading', { level: 3 })).toHaveText(['B.E., Information Science', 'Engati · SDE intern', 'Engati · Software Engineer']);
  for (const dates of ['Jul 2024 – now', 'Jan – Jun 2024', 'Aug 2020 – Jul 2024']) await expect(exp.getByText(dates, { exact: false })).toBeVisible();
  await expect(exp.locator('.projects a')).toHaveCount(4);
  await expect(exp).toContainText('9.47');
  await page.clock.setFixedTime(new Date(2027, 0, 20));
  await page.reload();
  await expect(exp.locator('[data-duration]').last()).toHaveText('2y 6m');
});
