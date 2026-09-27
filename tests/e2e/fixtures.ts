import { test as base } from '@playwright/test';
import { LANDING_KEY } from '../../src/lib/landing';

/**
 * Tests that are not about the landing screen start as someone who has already seen it in this tab,
 * so it never covers the page they check. landing.spec.ts uses @playwright/test directly.
 */
export const test = base.extend<{ skipLanding: void }>({
  skipLanding: [
    async ({ page }, use) => {
      await page.addInitScript((key) => {
        try {
          sessionStorage.setItem(key, '1');
        } catch {
          // about:blank has no storage; the landing screen only matters on the home page.
        }
      }, LANDING_KEY);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
