import { test, expect } from './fixtures';
test('project outcomes and decisions remain available alongside keyboard actions', async ({ page }) => {
  await page.goto('/#work');
  const exhibits = page.locator('[data-exhibit]');
  await expect(exhibits).toHaveCount(4);
  for (const exhibit of await exhibits.all()) {
    await expect(exhibit.locator('[data-outcome]')).toBeVisible();
    await expect(exhibit.getByRole('link', { name: /Case study/ })).toBeVisible();
    await exhibit.locator('summary').click();
    await expect(exhibit.locator('details')).toHaveAttribute('open', '');
  }
  const review = page.locator('[data-exhibit="review"]');
  await review.getByRole('button').focus();
  await page.keyboard.press('Enter');
  await expect(review.locator('[data-exhibit-status]')).toContainText('check the response');
});
test('rapid invoice replay replaces a window without accumulating charges', async ({ page }) => {
  await page.goto('/#work');
  const invoice = page.locator('[data-exhibit="billing"]');
  const button = invoice.getByRole('button', { name: 'Replay events' });
  await button.click(); await button.click(); await button.click();
  await expect(invoice).toHaveAttribute('data-state', 'complete');
  await expect(invoice.locator('[data-billing-total]')).toHaveText('3');
  await expect(button).toBeEnabled();
});
test('reduced motion completes each action immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  await expect(page.locator('[data-exhibit]')).toHaveCount(4);
  for (const exhibit of await page.locator('[data-exhibit]').all()) {
    await exhibit.getByRole('button').click();
    expect(await exhibit.getAttribute('data-state')).toBe('complete');
  }
});
test.describe('without scripts', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  test('outcomes, links and engineering decisions need no JavaScript', async ({ page }) => {
    await page.goto('/#work');
    await expect(page.locator('[data-exhibit]')).toHaveCount(4);
    for (const exhibit of await page.locator('[data-exhibit]').all()) {
      await expect(exhibit.locator('[data-outcome]')).toBeVisible();
      await expect(exhibit.getByRole('link', { name: /Case study/ })).toBeVisible();
      await exhibit.locator('summary').click();
      await expect(exhibit.locator('details p')).toBeVisible();
    }
  });
});

test('exhibits and résumé fit narrow and enlarged text in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('body *').evaluateAll(els => {
      const sizes = els.map(el => parseFloat(getComputedStyle(el).fontSize));
      els.forEach((el, i) => (el as HTMLElement).style.fontSize = `${sizes[i] * 2}px`);
    });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const clipped = await page.locator('[data-hero] .ch, #contact .big, [data-exhibit] button, [data-exhibit] code').evaluateAll(els => els.filter(el => el.getBoundingClientRect().right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
    expect(clipped).toEqual([]);
    const resume = page.locator('[data-hero]').getByRole('link', { name: 'Résumé' });
    await expect(resume).toBeVisible();
    for (const exhibit of await page.locator('[data-exhibit]').all()) {
      const clippedText = await exhibit.evaluate(article => {
        const box = article.getBoundingClientRect();
        const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
        const clipped: string[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          const details = node.parentElement?.closest('details');
          if (details && !details.open && !node.parentElement?.closest('summary')) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width && (rect.left < box.left - 1 || rect.right > box.right + 1)) clipped.push(node.textContent.trim());
          }
        }
        return clipped;
      });
      expect(clippedText).toEqual([]);
      const bounds = await exhibit.boundingBox();
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
      await exhibit.getByRole('button').click();
      await expect(exhibit).toHaveAttribute('data-state', 'complete');
    }
  }
});
