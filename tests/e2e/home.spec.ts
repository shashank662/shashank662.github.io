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
  for (const name of ['Experience', 'Selected work', 'Production incidents', 'The retry flow, simulated']) {
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

test('Experience lists the roles newest first, open, with their dates and what each built', async ({ page }) => {
  await page.goto('/#exp');
  const exp = page.locator('#exp');
  // Nothing that reads like leftover debug output.
  await expect(exp.getByText(/GET \/career|200 OK|root span/)).toHaveCount(0);

  await expect(exp.getByRole('heading', { level: 3 })).toHaveText([
    'Engati · Software Engineer',
    'Engati · SDE intern',
    'B.E., Information Science',
  ]);
  await expect(exp.getByText('Jul 2024 – now')).toBeVisible();
  await expect(exp.getByText('Jan – Jun 2024')).toBeVisible();
  await expect(exp.getByText('Aug 2020 – Jul 2024')).toBeVisible();
  const durations = exp.locator('.roles [data-duration]');
  await expect(durations).toHaveCount(3);
  for (const text of await durations.allTextContents()) expect(text.trim()).toMatch(DURATION);

  // Every project links to its case study, with its number showing, no hover or tap needed.
  const links = exp.locator('.projects a');
  await expect(links).toHaveCount(4);
  expect(await links.evaluateAll((all) => all.map((a) => a.getAttribute('href')))).toEqual([
    '/work/auto-retry-framework',
    '/work/rcs-billing-pipeline',
    '/work/ai-code-reviewer',
    '/work/abandoned-cart-recovery',
  ]);
  // Each project leads with its number, big, and what it measures; each role has one short line.
  await expect(exp.locator('.figure')).toHaveText(['45%', '~8M', '2 h → 30–60 min', '1–2 sprints']);
  await expect(exp.locator('.caption')).toHaveText([
    'failed deliveries recovered on the first retry',
    'billing events a day',
    'review time per developer per day',
    'from design to production',
  ]);
  await expect(exp.getByText(/hardened order validation/)).toHaveCount(0);
  await expect(exp.getByText(/Employee of the Month ×2/)).toBeVisible();
  // A timeline key names each bar.
  await expect(exp.locator('.key li')).toHaveText(['B.E.', 'Intern', 'Software Engineer']);
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

test('on a phone the hero reads like a case study: name, what I build, intro, the two ways in, then the results', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phones only.');
  await page.goto('/');
  await expect(page.locator('[data-hero]')).toHaveClass(/\bgo\b/);
  const order = await page.locator('[data-hero]').evaluate((hero) =>
    ['h1.name', '.lede', '.intro', '.ctas', '.wins'].map((sel) => hero.querySelector(sel)!.getBoundingClientRect().top),
  );
  expect(order).toEqual([...order].sort((a, b) => a - b));
  // The name is in the first screen, clear of the header.
  const header = (await page.locator('[data-header]').boundingBox())!;
  expect(order[0]).toBeGreaterThanOrEqual(header.y + header.height);
  expect(order[1]).toBeLessThan(page.viewportSize()!.height / 2);
});

test.describe('on a tablet held upright', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('the name leads, as on a phone, and the lines under it start at the left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero]')).toHaveClass(/\bgo\b/);
    await page.waitForTimeout(1800);
    const box = (selector: string) => page.locator(`[data-hero] ${selector}`).boundingBox();
    const [name, lede, typed, intro] = await Promise.all(['h1.name', '.lede', '.typed', '.intro'].map(box));
    expect(name && lede && typed && intro).toBeTruthy();
    if (!name || !lede || !typed || !intro) return;
    expect(name.y).toBeLessThan(intro.y);
    expect(Math.abs(lede.x - name.x)).toBeLessThan(12);
    expect(Math.abs(typed.x - name.x)).toBeLessThan(12);
  });
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
  for (const [name, href] of [['Work', '/#work'], ['About', '/#about'], ['Contact', '/#contact'], ['60-sec view', '/summary']]) {
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

test('fewer things move at once: no header clock, a still status dot, a still badge, and a typed line that stops', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-header] [data-clock]')).toHaveCount(0);
  await expect(page.locator('[data-header] .status i')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('[data-hero] .badge svg')).toHaveCSS('animation-name', 'none');
  // The typed line types each line once and rests on the last, with no caret left blinking.
  const lines: string[] = JSON.parse((await page.locator('[data-typed]').getAttribute('data-lines')) ?? '[]');
  await expect(page.locator('[data-typed]')).toHaveText(lines[lines.length - 1], { timeout: 30_000 });
  await expect(page.locator('[data-hero] .typed')).toHaveClass(/\bdone\b/);
  await expect(page.locator('[data-hero] .caret')).toBeHidden();
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

test('the About words light up as they reach the middle of the screen, not before', async ({ page }) => {
  await page.goto('/');
  const paragraph = page.locator('[data-word-reveal]');
  /** Scrolls so the paragraph's top sits at `share` of the screen height, then reads the first word's light. */
  const litAt = async (share: number) =>
    paragraph.evaluate(async (el, s) => {
      const top = el.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top - innerHeight * s, behavior: 'instant' });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Number((el.querySelector('.w') as HTMLElement).style.getPropertyValue('--lit') || 0);
    }, share);

  // In the lower part of the screen the words wait, still dim.
  expect(await litAt(0.8)).toBe(0);
  expect(await litAt(0.65)).toBe(0);
  // Once the paragraph reaches the middle, its first words light up.
  expect(await litAt(0.45)).toBeGreaterThan(0.5);
});

const RESUME_SKILLS = {
  Languages: ['Java', 'Python', 'SQL'],
  Backend: ['Spring Boot', 'REST APIs', 'Microservices Architecture'],
  'Messaging & Caching': ['Apache Kafka', 'RabbitMQ', 'Redis'],
  'Data Engineering': ['Apache Spark', 'Apache Iceberg', 'Maxwell', 'Change Data Capture (CDC)'],
  'Databases & Search': ['MongoDB', 'MySQL', 'Elasticsearch'],
  'Cloud & Infrastructure': ['AWS S3', 'Docker', 'Nginx', 'Jenkins', 'Git', 'CI/CD'],
  'AI & LLM': ['LLM-based Applications', 'AI Agents', 'Runtime Python Tool Calls'],
  Frontend: ['React'],
};

test("Stack comes after About and shows the résumé's skills, one row per group", async ({ page }) => {
  await page.goto('/#stack');
  const stack = page.locator('#stack');
  await expect(stack.getByRole('heading', { level: 2, name: 'Stack' })).toBeVisible();
  const order = await page.locator('main > section[id]').evaluateAll((all) => all.map((s) => s.id));
  expect(order.indexOf('stack')).toBe(order.indexOf('about') + 1);
  await expect(stack.getByRole('heading', { level: 3 })).toHaveText(Object.keys(RESUME_SKILLS));
  for (const [group, skills] of Object.entries(RESUME_SKILLS)) {
    const row = stack.locator('.row', { has: page.getByRole('heading', { level: 3, name: group, exact: true }) });
    await expect(row.getByRole('button')).toHaveText(skills);
  }
});

test('choosing a skill says where on the site it was used, or that it is on the résumé', async ({ page }) => {
  await page.goto('/#stack');
  const stack = page.locator('#stack');
  const used = stack.locator('[data-stack-used]');
  const kafka = stack.getByRole('button', { name: 'Apache Kafka' });
  await kafka.click();
  await expect(kafka).toHaveAttribute('aria-pressed', 'true');
  await expect(used).toContainText('Apache Kafka');
  await expect(used.getByRole('link')).toHaveText(['RCS billing pipeline', 'Abandoned-cart recovery']);
  await expect(used.getByRole('link').first()).toHaveAttribute('href', '/work/rcs-billing-pipeline');

  const react = stack.getByRole('button', { name: 'React' });
  await react.click();
  await expect(kafka).toHaveAttribute('aria-pressed', 'false');
  await expect(used).toContainText('On my résumé');
  await expect(used.getByRole('link')).toHaveCount(0);
});

test('the sections are numbered in page order, with Stack as 02', async ({ page }) => {
  await page.goto('/');
  // Each section's own number: the first "(NN)" label inside it.
  const numbers = await page.locator('main > section[id]').evaluateAll((sections) =>
    sections
      .map((section) => [...section.querySelectorAll('.label')].map((l) => l.textContent?.trim().match(/^\((\d\d)\)/)?.[1]).find(Boolean))
      .filter(Boolean),
  );
  expect(numbers).toEqual(['01', '02', '03', '04', '05', '06', '07']);
  await expect(page.locator('#stack .sec-head')).toContainText('(02) Stack');
});

test('the page names no side projects and shows no phone number', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/ZoomCart|Real-Time Data Integration Pipeline/i);
  expect(text).not.toMatch(/9035265512|\+91/);
});

test('the first screen leads with three flagship results and clear ways to view work and the résumé', async ({ page }) => {
  await page.goto('/');
  const wins = page.locator('[data-hero]').getByRole('list', { name: 'Flagship results' }).getByRole('link');
  await expect(wins).toHaveCount(3);
  expect(await wins.evaluateAll((all) => all.map((a) => a.getAttribute('href')))).toEqual([
    '/work/auto-retry-framework',
    '/work/rcs-billing-pipeline',
    '/work/ai-code-reviewer',
  ]);
  await expect(page.locator('[data-hero]').getByRole('link', { name: 'View work' })).toHaveAttribute('href', '#work');
  await expect(page.locator('[data-hero]').getByRole('link', { name: 'Résumé' })).toHaveAttribute('href', '/resume.pdf');
  // On a laptop, all of it is in the first screen, clear of the fixed header.
  const viewport = page.viewportSize()!;
  if (viewport.width > 1000) {
    const box = (await page.locator('[data-hero] .proof').boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('the playground says it is a simulation, and incidents read as write-ups, not a live dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#play .sec-head')).toContainText('interactive simulation · illustrative numbers');
  await expect(page.locator('#play')).toContainText(/illustrative, not production data/);
  await expect(page.locator('#incidents .sec-head')).toContainText('2 write-ups from production');
  await expect(page.locator('body')).not.toContainText(/running live|0 open/);
});
