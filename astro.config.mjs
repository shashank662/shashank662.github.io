// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://shashank662.github.io',
  // Each page is one .html file, so /work/x is served as-is: no redirect to /work/x/,
  // and the canonical URL matches every link.
  trailingSlash: 'never',
  build: { format: 'file' },
});
