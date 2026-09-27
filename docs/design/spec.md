# Portfolio site — design spec

- **Date:** 2026-09-26
- **Owner:** Shashank H R (GitHub `shashank662`)
- **Status:** approved; built phase by phase (§14.5). Phases 1–3 are done: scaffold, home sections, case studies.
- **Visual source of truth:** `docs/design/mockup.html` (open it in a browser; it runs without a server). Its wording is an early draft: where it differs, the content files and `src/data/profile.ts` win.

---

## 1. Goal and audience

A personal portfolio for a backend engineer (Java / Spring Boot, ~2 years full-time plus a 6-month internship at Engati, Bangalore) that makes a visitor go "woah" **and** proves backend skill.

**Primary audience:** recruiters and hiring managers for SDE-2 backend roles in India.

**Success criteria**

1. A recruiter can find role, years of experience, top wins with numbers, and the résumé in under 60 seconds (the `/summary` page, linked from every page header).
2. A hiring manager can read four case studies and play with a live model of the auto-retry framework.
3. Lighthouse (mobile) scores 95 or more in Performance, Accessibility, Best Practices and SEO on `/` and on one case study.
4. The home page ships under 50 KB of JavaScript (gzipped) and all content is readable with JavaScript turned off.
5. A visitor can ask common questions (experience, stack, notice period, a project) in an "Ask about me" panel and get an answer with a source link, computed entirely in their browser.
6. The site is live at `https://shashank662.github.io`, deployed by GitHub Actions, with a commit history made of small, per-file commits.

## 2. Visual direction

The approved direction mixes two explored concepts:

- **Kinetic editorial** (concept C): huge condensed type, a serif italic for accents, magazine-style section labels like `(03) Selected work`, generous whitespace, thin rules.
- **Live system** (concept A): technical touches — a live status line, the career drawn as a request trace, incident write-ups, and a playground that simulates the real retry framework.

Motion is calm and purposeful. Hover effects are subtle (a soft row tint and a small card next to the cursor); there are no large cursor blobs or effects that cover content.

### 2.1 Design tokens

Both themes are first-class. The theme follows the visitor's system setting on the first visit and remembers an explicit choice in `localStorage`.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--bg` | `#F1EDE4` | `#0E0D0C` | page background (warm paper / warm black) |
| `--ink` | `#141414` | `#EFEAE0` | main text, rules, node outlines |
| `--muted` | `#6B675F` | `#8F8A81` | secondary text, labels |
| `--line` | `rgba(20,20,20,.20)` | `rgba(239,234,224,.17)` | hairlines, diagram edges |
| `--line2` | `rgba(20,20,20,.07)` | `rgba(239,234,224,.07)` | tints, empty bar tracks |
| `--accent` | `#1F3DFF` (Cobalt) | `#5A78FF` | brand accent: links, highlights, retry path |
| `--on-accent` | `#FFFFFF` | `#0E0D0C` | text on accent fills |
| `--ok` | `#15803D` | `#4ADE80` | healthy status, delivered |
| `--warn` | `#C2410C` | `#FBBF24` | degraded status, failed-delivery webhooks |
| `--bad` | `#DC2626` | `#F87171` | dropped messages, errors |

Skill strip 1: `--ink` background with `--bg` text. Skill strip 2: `--accent` background with `#F1EDE4` text (light) or `#0E0D0C` text (dark). Every text/background pair in the table meets 4.5:1 contrast.

A subtle grain texture (tiled SVG noise, dark specks in light mode, light specks in dark mode) sits over the page at low opacity, with `pointer-events: none`.

### 2.2 Typography

One family, IBM Plex, for a formal and technical voice (changed 2026-09-27 from Anton, Instrument Serif, Inter and JetBrains Mono, which read as playful). Self-hosted from the installed Fontsource files through Astro's Fonts API, Latin subset only, `font-display: swap`, with size-matched local backup fonts so text doesn't move when the real fonts arrive. The display face and the light and regular text weights are preloaded.

| Face | Role |
|---|---|
| IBM Plex Sans Condensed Bold | the hero name, case study titles, work and incident titles, big numbers; always uppercase |
| IBM Plex Sans (300–600) | section titles (semibold, sentence case), ledes (light), body text and UI |
| IBM Plex Mono | technical labels, logs, diagram text, the career trace |

Emphasis is never italic: accent words are semibold in the accent colour.

## 3. Stack

- **Astro 7** (7.3.x at the time of writing; Node 22.12+) with **TypeScript in strict mode**. No UI framework: every page is prerendered to static HTML.
- Interactive parts are small TypeScript modules loaded with Astro `<script>` tags, only on the pages that use them.
- **Page transitions** use native cross-document view transitions (`@view-transition { navigation: auto; }`). Each work row's title and its case-study title share a `view-transition-name` (`work-<slug>`), so the title glides between pages in Chromium and Safari. Other browsers navigate normally.
- **The theme switch** uses a same-document view transition with a circular `clip-path` wipe that starts at the click point. Without view-transition support, or with reduced motion, the theme simply switches.
- Packages: `astro`, `@astrojs/check`, `@astrojs/sitemap`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-sans-condensed`, `@fontsource/ibm-plex-mono`, `minisearch` (the chatbot's in-browser search), `satori` + `@resvg/resvg-js` (preview images), `vitest`, `@playwright/test`.

## 4. Pages and routes

| Route | Content |
|---|---|
| `/` | Home (section 5) |
| `/work/auto-retry-framework` | Case study 01 |
| `/work/rcs-billing-pipeline` | Case study 02 |
| `/work/ai-code-reviewer` | Case study 03 |
| `/work/abandoned-cart-recovery` | Case study 04 (internship) |
| `/summary` | The "60-sec view" for recruiters (section 7) |
| `/404` | Not-found page (section 7) |
| `/resume.pdf` | Static résumé file from `public/` |

Every page shares the same header, footer, and "Ask about me" button (section 9).

## 5. Home page

Sections, in order:

1. **Header** (fixed)
   - Left: "Shashank H R · Backend Engineer".
   - Centre: live status (`● all systems operational`) and India time (`HH:MM:SS IST`); hidden below 1000px.
   - Right: `Work`, `Playground`, `Contact` (hidden below 760px), an accent pill `60-sec view` linking to `/summary`, and the theme button (◐ plus "Light" or "Dark").
   - After 30px of scroll the header gets a blurred `--bg` background and a hairline. A 2px accent bar across the top shows scroll progress.
2. **Hero**
   - Top row: the label "Portfolio · 2026 edition" with a short intro paragraph; on the right, a mono index `01 About … 06 Contact` linking to sections (hidden below 760px).
   - The name "SHASHANK" in Plex Sans Condensed Bold, spread across the full width. Letters slide up one after another on load. On mouse devices each letter leans up (up to 22px, `scaleY` up to 1.14) when the cursor is within 300px, and turns accent when very close.
   - Second row: a rotating circular badge ("Open to SDE-2 roles ✺ Bangalore ✺ 2026 ✺", accent core with "↓" linking to About) and the light lede "I build *reliable backends* for high-volume messaging."
   - A mono line types and erases four lines in turn, prompt `~/shashank $`.
3. **Skill strips.** Two slightly rotated marquee bands: one lists skills (Java, Spring Boot, Apache Kafka, RabbitMQ, Redis, MongoDB, Spark, AWS S3, Microservices), the other highlights (Open to SDE-2 roles, Employee of the Month ×2, MongoDB certified, CGPA 9.47, Bangalore). They drift at a base speed; scroll speed adds a boost and scroll direction sets the drift direction.
4. **(01) About.** A mono facts list (`based_in`, `engati` SDE and intern lines with computed durations, `stack`, `education`, `awards`, `status`) beside a large paragraph whose words fade from 14% to full opacity as it scrolls through the viewport. Phrases marked in the data render in serif italic accent.
5. **(02) Experience — "Experience"**
   - Section label shows `GET /career · <N> spans · 200 OK`, where N is counted from the data.
   - A trace table: a year axis from 2021 to the current year plus "now"; one row per span with a label, a small tag, a bar positioned by start and end month, and the duration.
   - Nesting: projects sit under their role (level 2), and the root span is shown in mono.
   - Bars grow in the first time the table enters the viewport. Hovering (or tapping) a row expands a one-line detail.
6. **(03) Selected work.** Five rows: the four case studies (links) and "Prod sandbox" (a brief).
   - Columns: number, title, one-line description, stack, key metric with a small caption.
   - Hover: a soft `--line2` tint; the title shifts 10px right and turns accent; a 230px card follows the cursor, offset down and right (flipping left near the right edge), showing tag, "Case study ↗" or "Click to expand", a big accent metric and a short label.
   - No card on touch devices. The sandbox row expands its text in place (button semantics, `aria-expanded`).
7. **(04) Incidents — "Production incidents"** Two postmortem cards (INC-01 MongoDB M20 memory, INC-02 FastAPI memory leak), each with Impact, Cause and Fix, a big accent delta, and before/after bars that grow in on first view.
8. **(05) Playground — "The retry flow, live"** The retry-flow simulation (section 8).
9. **(06) Contact.** A giant "Let's talk →" (mailto link) and links: Email, LinkedIn, GitHub, Résumé (PDF).
10. **Footer** (mono): "© <year> Shashank H R · built with Astro", real page-load time (from the Navigation Timing API), a session uptime counter, and the same live status as the header.

## 6. Case study pages

One template renders all four from content files (section 10). Layout, top to bottom:

1. **Top bar:** "← Back to work" (links to `/#work`) and "Case study NN / 04".
2. **Hero:** kicker, the title in Plex Sans Condensed (shares the row's `view-transition-name`), a light lede with accent emphasis, and a four-item meta row (for example Role / Stack / Scale / Status).
3. **Stats strip:** four accent values with captions; values never wrap.
4. **(01) The problem:** one to three paragraphs.
5. **(02) How it works:** an SVG diagram with numbered accent dots, then a matching numbered list of steps.
6. **(03) Key decisions:** three cards, each a heading and one short paragraph.
7. **(04) Results:** a list; an optional pull quote in serif italic; an optional call-to-action link (case study 01 links to `/#play`).
8. **Next case study:** a big link to the next case, wrapping from 04 back to 01.

Below 860px the meta and stats become two columns, sections stack, and the diagram scrolls sideways (it keeps a 720px minimum width).

The four case studies, with the facts they must contain:

| Slug | Facts (sources: résumé of 25 Sep 2026 and the owner's own descriptions) |
|---|---|
| `auto-retry-framework` | Flow: LeadSquared or MoEngage send an API trigger → api-gateway → action trigger management service → messaging layer → Meta → user. Meta webhooks report delivered or failed. Status-code checks decide what is retryable. Retryable failures are pushed with a trackerId idempotency key, the original payload is fetched from MongoDB, and the retry goes through RabbitMQ with fixed-interval or exponential back-off. Stack includes Redis. ~2M API triggers a day; 50K–100K retries a day; 300K–400K a day at peak during Meta failures; failure rate 35% → 12%. |
| `rcs-billing-pipeline` | RCS webhooks → Apache Kafka → AWS S3 → idempotent, replay-safe Spark jobs aggregating by botRef, customerId and metric type → accurate customer billing. |
| `ai-code-reviewer` | Spring Boot agent; GitLab MR diffs; token-budget preprocessing; LLM-generated feedback; Slack-triggered; an aid to human review. ~20 developers; ~2 h → ~30 min per developer; became the team's default workflow; company award. |
| `abandoned-cart-recovery` | Internship, designed and shipped end to end in 1–2 sprints. CTA popup built with Shopify `theme.liquid` → product-discovery-service (validation) → `@Async` task (store integration and config checks) → shopper lookup by email: own DB, then Shopify GraphQL for that store, then the archived-orders parquet in DuckDB across stores (extracting the phone number even when it is missing from shipping details) → Kafka keyed by user_id → shopify-consumer-service (payload, discount configured on the portal, Engati-branded short URL from the in-house shortener) → existing messaging pipeline. Learned patterns such as adapter and factory. |

## 7. Other pages

**`/summary` — the 60-sec view.** One screen; no animation beyond the header.

- Name, "Backend Engineer · Engati · Bangalore", and the status "Open to SDE-2 roles".
- Experience: full-time duration computed from July 2024, plus "6-month internship before that".
- Top wins, each one line with its number:
  - failure rate 35% → 12% on ~2M API triggers a day
  - code review ~2 h → ~30 min for ~20 developers, with a company award
  - production MongoDB memory cut by over 60%
  - a full-stack abandoned-cart flow shipped in 1–2 sprints as an intern
- Core stack; education (B.E., Information Science, JSS Science and Technology University, CGPA 9.47/10); awards (Employee of the Month ×2, "Always at 110%"); certification (MongoDB Associate Developer).
- Buttons: "Download résumé (PDF)", Email, LinkedIn, GitHub, and "Explore the full site →".
- A print stylesheet: A4, ink on white, no header or animations, links shown as text.

**`/404`.** A trace-styled line `GET /<requested-path> → 404 · span not found`, a short message, and links to `/` and `/summary`.

## 8. Playground: the retry-flow simulation

**Purpose:** a toy, honest model of the auto-retry framework that a visitor can switch off or break.

**Structure**

- `src/lib/retrySim.ts`: a pure simulation with no DOM access. It takes an injectable random-number function and is driven by `step(dt)`.
- `src/scripts/playground.ts`: canvas renderer, controls, logs, visibility handling.

**Nodes** (positions as fractions of the stage): integrations (.10,.22), api-gateway (.30,.22), trigger-svc (.50,.22), messaging (.70,.22), meta (.90,.22), webhooks (.90,.62), mongodb (.70,.62), rabbitmq (.50,.62), redis (.90,.88). Hovering a node shows a one-line description.

**Rules**

| Rule | Value |
|---|---|
| New triggers | 2.6 per second, path integrations → api-gateway → trigger-svc → messaging → meta, moving at 210 px/s |
| Failure chance at meta | 0.35 on the first attempt; 0.15 on retries; 0.90 during an outage |
| On success | green pop at meta; if attempt > 1, "saved by retries" +1 |
| On failure | a webhook packet travels meta → webhooks |
| At webhooks | retryable with chance 0.70. Dropped (red) if non-retryable, if retries are OFF, or if attempt ≥ 3. Otherwise it travels webhooks → mongodb → rabbitmq, and redis flashes (trackerId correlation). |
| At rabbitmq | waits 1.5 s × 2^(attempt−1), shown as a queued dot with a countdown ring; the attempt number increases; then it travels rabbitmq → messaging → meta, labelled ↻n |
| Headline failure rate | every 300 ms, a Monte Carlo sample of 400 virtual messages under the same rules, smoothed by moving 35% toward the new value. Settles near 12% (ON), 35% (OFF) and 80% (outage). |

**Controls**

- "Retry framework" switch (`role="switch"`, `aria-checked`).
- "⚡ Simulate a Meta outage" lasts 5 seconds and disables itself while running. During the outage, every live status on the page reads "meta outage · retrying" in `--warn`.
- Clicking the canvas sends 5 visitor triggers.

**Panel:** failure rate (coloured ok below 20%, warn from 20% to 50%, bad above 50%), retries in queue, saved by retries, and a six-line log throttled so it stays readable.

**Lifecycle**

- On first view it warms up for 20 simulated seconds so it opens in a steady state.
- It pauses whenever the stage is off-screen.
- With reduced motion it starts paused behind a "Play" button.
- Edge labels are hidden when an edge is too short for its text.

**Accessibility:** the canvas has `role="img"` and an `aria-label` describing the flow; a visible sentence under the heading explains it in words; all controls are real buttons.

## 9. "Ask about me": the chatbot

**Purpose:** let a visitor ask a question in their own words and get a short answer taken only from the owner's own content, with a link to where it came from. There is no AI model: it matches the question against a prepared set of answers, so it cannot invent facts. Everything runs in the visitor's browser; nothing typed leaves their device.

**Interface**

- **Button:** a small floating pill fixed 16px from the bottom-right corner of every page: an accent dot and the mono label "Ask about me". It hides while the panel is open, and every page keeps a bottom gutter so the pill never covers a control.
- **Panel:** 380px wide on desktop, a bottom sheet on screens below 760px.
  - Header: "Ask about Shashank" with a close button.
  - An intro line: "I answer from this site's content. Try one of these:".
  - Four to six suggestion chips (for example "Years of experience?", "Tech stack?", "Notice period?", "The retry framework?", "How do I reach you?").
  - The message list, and an input with a send button.
  - Each answer shows its source as a link (for example "From: Auto-retry framework →"); following the link closes the panel.
- The panel uses the site's tokens, so it follows the light/dark theme.

**Knowledge base**

- **Generated at build time** from the same data the pages use (section 10): current role, experience durations, internship, stack, education, awards, certification, location, contact links, résumé, each case study (what it is, how it works, results), each incident, and the playground.
- **Hand-written recruiter FAQ** in `src/data/faq.ts`: notice period, open to relocation and preferred cities, work mode, role types, earliest joining, and compensation (answered as "happy to discuss on a call"; no numbers are ever published). The owner supplies these answers (section 15).
- **Small talk:** greetings get a short hello; "who are you" explains that this is a bot that answers from the site.
- Each entry is `{ id, question, alt: string[], keywords: string[], answer, source: { label, href } }`. The build writes them to a static `/ask-index.json`.

**Matching**

- Normalise the question: lower-case, strip punctuation, drop filler words, expand common shorthand through a synonym map (`yrs` → years, `exp` → experience, `np` → notice period, `wfh` → remote, `ctc` → compensation, `blr` → bangalore, `tech` → stack).
- Search with MiniSearch across `question`, `alt` and `keywords` (keywords boosted), with typo tolerance (fuzzy 0.2) and prefix matching.
- Answer with the top entry when its score clears a threshold tuned by the tests. If the next entry is close, also show it as a "Did you mean…" chip.
- If nothing clears the threshold, reply: "I don't have an answer for that yet. You can ask Shashank directly:" followed by Email and LinkedIn buttons.
- No questions are logged or sent anywhere.

**Structure and loading**

- `src/lib/ask/`: the normaliser, synonym map and an `Answerer` interface (`answer(question) → { entry, alternatives } | null`) with one implementation, `LocalAnswerer`. An AI-backed answerer could be added later behind the same interface without changing the panel.
- The button and empty panel ship with every page (under 3 KB). MiniSearch and `/ask-index.json` load the first time the panel opens (target under 30 KB gzipped together), so they do not count against the home page budget.

**Accessibility:** the panel is a labelled, non-modal `role="dialog"`. Opening it moves focus to the input, and Escape or the close button returns focus to the pill. Messages sit in a `role="log"` region with `aria-live="polite"`. Chips and send are real buttons, and everything works by keyboard.

## 10. Content model

Content is separated from layout so it can be edited without touching components.

**`src/data/profile.ts`** (typed) holds:

- identity: name, role, company, location, status line
- links: email, LinkedIn, GitHub, résumé path
- hero: intro, lede, the four typed lines
- skill-strip items
- About: the paragraph with `[accent]` markers, and the facts
- career spans: `{ name, tag, level, start: [year, month], end: [year, month] | null, tone: 'muted' | 'ink' | 'accent', detail }`
- incidents
- the sandbox brief
- the `/summary` wins list

**`src/content/work/<slug>.md`** is one file per case study, validated by a content-collection schema.

- Frontmatter:
  - `order` (the displayed number, such as "01", is derived from it), `kicker`, `title`
  - `lede` (supports `*emphasis*`)
  - `meta` (four label/value pairs), `stats` (four value/caption pairs)
  - `diagram` (one of `retry`, `rcs`, `ai`, `cart`)
  - `steps`, `decisions` (three title/body pairs), `results`
  - optional `quote` and `cta`
  - `row`: description, stack, metric, metric caption, card tag, card metric, card label — this feeds the home page list, so each project is written once
- The Markdown body is "The problem" text.
- A missing or malformed field fails the build.

**`src/diagrams/<id>.ts`** exports a `DiagramSpec`: `{ height, title, nodes[{ x, y, w, title, sub, accent? }], edges[{ d, kind: 'plain' | 'accent' | 'warn' }], labels[{ x, y, text, anchor? }], steps[{ x, y, n }] }`, in a 1000-wide coordinate space. `Diagram.astro` renders it as inline SVG with arrow markers per edge kind, coloured by CSS variables so it follows the theme. The four specs reuse the coordinates from the approved mockup.

**Durations** ("2y 2m", "6m", "1y") are computed from `[year, month]` dates; a `null` end means "now". Formatting lives in `src/lib/dates.ts` and is used at build time and in the browser.

**`src/data/faq.ts`** holds the hand-written recruiter answers and small-talk replies for the chatbot (section 9). The chatbot's other entries are generated from `profile.ts` and the case-study files, so no fact is written twice.

## 11. Interaction and motion rules

- Everything that moves respects `prefers-reduced-motion: reduce`: no letter reveal or lean, no theme wipe, strips paused, words fully shown, bars shown filled, playground paused behind "Play".
- The custom cursor (a small dot with `mix-blend-mode: difference` that grows into a thin ring over interactive targets) only appears for `(pointer: fine)`; it never carries text. Touch devices keep native behaviour.
- One shared `requestAnimationFrame` loop drives cursor, strips, letters and the playground; each part does no work while off-screen.

## 12. Quality

**Accessibility**

- WCAG 2.1 AA.
- Every control is reachable by keyboard, with a visible 2px accent focus ring.
- A "Skip to content" link.
- Semantic landmarks (`header`, `main`, `footer`, `nav`).
- Headings in order.
- The theme button announces the theme it switches to.

**Performance budgets**

- Lighthouse mobile at least 95 in all four categories.
- Home JS under 50 KB gzipped (the chatbot's search library and index load only when the panel is first opened, and are not counted).
- No layout shift above 0.05.
- No third-party requests.

**Privacy:** no cookies, no analytics, no trackers.

**SEO and sharing**

- A unique `<title>` and meta description per page.
- Canonical URLs.
- `@astrojs/sitemap` and `robots.txt`.
- A JSON-LD `Person` (name, jobTitle, worksFor Engati, sameAs LinkedIn and GitHub).
- A 1200×630 Open Graph image per page, generated at build time with Satori + resvg from the page title on the paper/ink design.

## 13. Testing

- **`astro check`:** types and content schemas, on every build.
- **Vitest unit tests:**
  - `dates.ts` formatting, including month boundaries and `null` end dates
  - trace bar position maths
  - `retrySim.ts` with a seeded random source: long-run failure near 12% ± 3 with retries ON, near 35% ± 3 with retries OFF; no retries when OFF; at most 3 attempts; back-off waits of 1.5 s and 3 s
  - the chatbot matcher against a table of at least 40 real phrasings, including typos and shorthand ("how many yrs of exp", "notice period?", "tell me abt the retry thing"), each mapped to its expected answer, plus at least 10 off-topic questions ("what's the weather", "write me a poem") that must get the fallback
- **Playwright browser tests** (Chromium, desktop and a 390px mobile viewport):
  - every route loads with no console errors
  - the theme toggles and persists after reload
  - a work row opens its case study, and "Back to work" returns to `/#work`
  - the playground switch moves the failure rate above 25% within 5 seconds
  - the sandbox row expands
  - the chatbot opens, a suggestion chip returns an answer with a source link, a typed question gets an answer, and Escape closes the panel and returns focus
  - `/404` renders
  - a crawl of internal links finds no broken links
- **Lighthouse:** run against the production build before launch; scores recorded in the README.

## 14. Repository, commits and deploy

1. `portfolio/` becomes a git repository with `origin` = `https://github.com/shashank662/shashank662.github.io.git` (the owner's personal account).
   - Commit identity (repo-local config): `Shashank H R <108358039+shashank662@users.noreply.github.com>`.
2. **Preserve the 2022 site first:** the current `origin/main` is pushed as branch `legacy-2022` before any other change. Like every push, this happens only after the owner says go.
3. **New work builds on top of `main`** (no force-push). The first commit on `feat/scaffold` removes the 2022 files ("Retire the 2022 site; kept on legacy-2022"); new files follow.
4. **Commit rules**
   - One file per commit, with a clear message. Only files that cannot work apart go together (for example `package.json` with `package-lock.json`).
   - Commit as each piece is built and verified, so history shows the real order of work.
   - Never backdate or rewrite commit times.
   - No Claude co-author or attribution lines.
5. **Branches and pull requests.** One branch and pull request per phase: `feat/scaffold`, `feat/home`, `feat/case-studies`, `feat/playground`, `feat/ask-me`, `feat/summary-404-seo`, `feat/deploy`. Pushing and opening pull requests happens only after the owner says so.
6. **Deploy.** `.github/workflows/deploy.yml` runs on pushes to `main` and on manual dispatch: install (npm ci) → `astro check` → Vitest → build → Playwright against the built site → upload and deploy to GitHub Pages. CI uses Node 24 LTS (Node 22 leaves long-term support in April 2027); the site still supports Node 22.12+. The build job gets a read-only token; only the deploy job may publish.
   - The repository's Pages source switches from "Deploy from a branch" to "GitHub Actions" once, after the owner approves.
7. **Git-ignored:** `node_modules/`, `dist/`, `.astro/`, test reports, `.superpowers/` (brainstorm files) and `docs/superpowers/` (implementation plans stay local). This spec and the approved mockup are tracked in `docs/design/`.
8. **Custom domain** (optional, later): add `public/CNAME` and DNS records; nothing else changes.

## 15. Content to confirm before launch

Building does not wait on these; placeholders use the best current values, and launch waits until each item is confirmed or removed.

1. Real start dates for the project spans on the timeline (retry framework, RCS billing, AI reviewer, abandoned-cart). Current values are estimates; the alternative is to drop the dates and show those spans without bars.
2. Full-time duration: July 2024 gives "2y 2m" as of this spec; the owner mentioned 2.4 years. Confirm the start month.
3. Education dates: shown as August 2020 – July 2024 from the résumé's "2020 – 2024".
4. Redis's exact role in the retry flow, and whether retries re-enter at the messaging layer or at trigger-svc.
5. Any figures for the RCS billing pipeline (events a day, customers billed).
6. Which email address, LinkedIn URL and GitHub URL to show.
7. The public résumé PDF: it currently includes a phone number. Keep it, or supply a copy without it.
8. The owner's review of every "Key decisions" card and the case study 04 pull quote, since these are written in the owner's voice.
9. Answers for the chatbot's recruiter FAQ: notice period, relocation and preferred cities, work mode, role types, and earliest joining date.

## 16. Out of scope

An AI-model answerer for the chatbot (the `Answerer` interface leaves room for one later), a blog, a CMS, analytics, a contact-form backend, translations, and the owner's personal side projects are not part of this version.
