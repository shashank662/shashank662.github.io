// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://shashank662.github.io',
  // Each page is one .html file, so /work/x is served as-is: no redirect to /work/x/,
  // and the canonical URL matches every link.
  trailingSlash: 'never',
  build: { format: 'file' },
  // Pages only: not the 404, the chatbot's data or the preview images.
  integrations: [sitemap({ filter: (page) => !/\/404$|ask-index|\/og\//.test(page) })],
  vite: {
    // Dev server only. The chatbot's search library sits behind a lazy import, so Vite finds it by scanning at
    // startup; a restart mid-scan loses it, and the first question then fails to load. Listing it bundles it up front.
    optimizeDeps: { include: ['minisearch'] },
  },
});
