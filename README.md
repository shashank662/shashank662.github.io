# shashank662.github.io

The portfolio of **Shashank H R**, a backend engineer at Engati in Bangalore who builds Java and Spring Boot services for a high-volume messaging platform. Live at **https://shashank662.github.io**.

## What's on it

- **Home:** my experience drawn as a request trace, selected work, production incidents, and a live model of the auto-retry framework I built at Engati. Switch the framework off, or cause a Meta outage, and watch the failure rate move.
- **Case studies:** four write-ups of real Engati systems, each with a diagram, the key decisions and the results.
- **The 60-second view** (`/summary`): everything a recruiter needs on one page. It also prints cleanly on A4.
- **Ask about me:** a small chatbot that answers from this site's own content. It runs entirely in the browser (MiniSearch); there is no AI service behind it.

## Stack

Astro 7, with every page prerendered to static HTML · TypeScript in strict mode · small plain-TypeScript modules for the interactive parts · IBM Plex, self-hosted through Astro's Fonts API · Satori and resvg for the link-preview images · Vitest and Playwright for tests · GitHub Actions and GitHub Pages for deploys.

No UI framework, no cookies, no analytics and no third-party requests.

## Run it locally

Needs Node 22.12 or newer.

```bash
npm install
npm run dev
```

The site is then at http://localhost:4321.

## Tests

```bash
npm run check      # types and content schemas
npm test           # unit tests: the retry model, the chatbot's matching, dates, layouts, the deploy workflow
npm run test:e2e   # browser tests in Chromium, desktop and phone sizes, against a production build
```

## Deploys

Every push to `main` runs [`deploy.yml`](.github/workflows/deploy.yml): `npm ci` → `astro check` → unit tests → build → browser tests against that build → publish to GitHub Pages. Nothing is published unless every step passes. The build runs with a read-only token; only the publishing job may publish.

Cloudflare Workers also builds every push to `main`, with the build command `npm run check && npm test && npm run build` (the browser tests run on GitHub only). Then `npx wrangler deploy` publishes `dist/` as plain files, as set in [`wrangler.jsonc`](wrangler.jsonc). The site needs no Astro adapter, and adding one breaks the build.

## Lighthouse

Production build, 27 September 2026, Lighthouse 13.5 on mobile settings (a 412 × 823 screen, simulated slow 4G and a 4× slower CPU).

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 98 | 100 | 100 | 100 |
| Case study: auto-retry framework | 99 | 100 | 100 | 100 |
| The 60-second view | 98 | 100 | 100 | 100 |

Layout shift is 0 on the home page and 0.001 elsewhere. The home page loads 12.3 KB of JavaScript (gzipped); the chatbot's search library and answers load only when it is first opened.

## Where things live

| Path | What |
|---|---|
| `src/pages` | the routes, the preview images and the chatbot's answers file |
| `src/content/work` | the case studies, in Markdown |
| `src/data/profile.ts` | everything else the site says about me |
| `src/lib` | pure logic with unit tests: the retry model, the chatbot's matching, dates, layouts |
| `src/scripts` | the browser modules |
| `src/components`, `src/layouts` | Astro components |
| `tests/unit`, `tests/e2e` | Vitest and Playwright tests |
