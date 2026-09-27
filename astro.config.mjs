// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://shashank662.github.io',
  // Each page is one .html file, so /work/x is served as-is: no redirect to /work/x/,
  // and the canonical URL matches every link.
  trailingSlash: 'never',
  build: { format: 'file' },
  // Self-hosted from the installed @fontsource files (Latin only). Text first paints in a local backup font that Astro
  // sizes to match (the last fallback picks its kind), so nothing moves when the real font arrives.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Sans Condensed',
      cssVariable: '--font-display',
      fallbacks: ['Arial Narrow', 'sans-serif'],
      options: {
        variants: [
          { src: ['@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-600-normal.woff2'], weight: 600, style: 'normal' },
          { src: ['@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-700-normal.woff2'], weight: 700, style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Serif',
      cssVariable: '--font-serif',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          { src: ['@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'], weight: 400, style: 'normal' },
          { src: ['@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'], weight: 400, style: 'italic' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-sans',
      fallbacks: ['-apple-system', 'system-ui'],
      options: {
        variants: [
          { src: ['@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-300-normal.woff2'], weight: 300, style: 'normal' },
          { src: ['@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2'], weight: 400, style: 'normal' },
          { src: ['@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2'], weight: 500, style: 'normal' },
          { src: ['@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2'], weight: 600, style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      fallbacks: ['ui-monospace', 'Menlo', 'monospace'],
      options: {
        variants: [
          { src: ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'], weight: 400, style: 'normal' },
          { src: ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'], weight: 500, style: 'normal' },
        ],
      },
    },
  ],
  // Pages only: not the 404, the chatbot's data or the preview images.
  integrations: [sitemap({ filter: (page) => !/\/404$|ask-index|\/og\//.test(page) })],
  vite: {
    // Dev server only. The chatbot's search library sits behind a lazy import, so Vite finds it by scanning at
    // startup; a restart mid-scan loses it, and the first question then fails to load. Listing it bundles it up front.
    optimizeDeps: { include: ['minisearch'] },
  },
});
