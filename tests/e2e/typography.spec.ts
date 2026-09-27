import { expect, test } from '@playwright/test';

// The site's only faces. The Fonts API adds a hash to each name, e.g. "IBM Plex Sans-89b5f5e0".
const PLEX = /^"?IBM Plex (Sans|Sans Condensed|Mono)[-"]/;

for (const path of ['/', '/work/auto-retry-framework', '/summary', '/no-such-page']) {
  test(`every piece of text on ${path} is set in IBM Plex, upright`, async ({ page }) => {
    await page.goto(path);
    const text = await page.evaluate(() => {
      const found: { family: string; italic: boolean; text: string }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const element = node.parentElement;
        if (!element || !node.textContent?.trim() || element.closest('script, style, noscript')) continue;
        const style = getComputedStyle(element);
        found.push({
          family: style.fontFamily.split(',')[0].trim(),
          italic: style.fontStyle !== 'normal',
          text: node.textContent.trim().slice(0, 40),
        });
      }
      return found;
    });
    expect(text.length).toBeGreaterThan(10);
    expect(text.filter((t) => !PLEX.test(t.family))).toEqual([]);
    expect(text.filter((t) => t.italic)).toEqual([]);
  });
}
