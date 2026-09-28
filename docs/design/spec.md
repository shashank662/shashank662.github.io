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
- **Live system** (concept A): technical touches — a live status line, the career on a slim timeline, incident write-ups, and a playground that simulates the real retry framework.

Motion is calm and purposeful. Hover effects are subtle (a soft row tint and a small card next to the cursor); there are no large cursor blobs or effects that cover content.

### 2.1 Design tokens

Nine colour themes, all first-class: Light and Dark (the table below), plus Midnight, Ocean, Forest, Sunset, Rose and Nord (dark) and Solarized (light), added on 2026-09-27 at the owner's request. A visitor picks one in the header's theme picker, or keeps **Auto**, which follows the system's light or dark setting (the default, and it follows the system live). An explicit choice is remembered in `localStorage` (`theme`) and applied before first paint, with `data-theme` (the theme) and `data-scheme` (light or dark) on `<html>`.

- The themes are listed in `src/lib/theme.ts`; their colours live in `src/styles/tokens.css`, as `[data-theme='…']` rules that work on any element, so the picker's swatches draw themselves in their own colours.
- Colours stay six-digit hex, because the playground's canvas reads them.
- `tests/unit/tokens.test.ts` reads every theme from the stylesheet and checks: text, accent text and text on the accent at 4.5:1 or more; the crossing bands at 4.5:1; muted text at 7:1 on dark themes and 5.5:1 on light ones (small grey labels were faint, so it gets more than the 4.5:1 minimum); the About words at 3:1 before they light up, at the theme's own faintest opacity (`--word-dim`, `--word-dim-hl`: 0.47 and 0.69, or 0.52 and 0.73 for Solarized, whose text is less dark); and a dark landing screen with light letters (`--intro-dark`, `--intro-light`, `--intro-line`; Light and Dark keep `#141414`, `#F1EDE4` and `#5A78FF`).
- The status colours and the grain follow the scheme, light or dark.

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

Adobe's Source family: a serif for headings and big numbers, a sans for text, a mono for technical labels. Chosen by the owner on 2026-09-27 for a formal, well-set look, after IBM Plex and, before that, Anton, Instrument Serif, Inter and JetBrains Mono, which read as playful. Self-hosted from the installed Fontsource files through Astro's Fonts API, Latin subset only, `font-display: swap`, with size-matched local backup fonts so text doesn't move when the real fonts arrive. The serif and the light and regular text weights are preloaded.

| Face | Role |
|---|---|
| Source Serif 4 (variable: weight and optical size) | the hero name, section titles (semibold), case study, work and incident titles, big numbers (bold); normal case. Big sizes get its display design automatically |
| Source Sans 3 (300–600) | ledes (light), body text and UI |
| Source Code Pro | technical labels, logs, diagram text, the career timeline's dates |
| Instrument Serif italic | only the two crossing bands on the home page, in normal case: the one slanted text on the site (the owner's pick, from the site's first design) |

Emphasis is never italic: accent words are semibold in the accent colour. The crossing bands are the one exception.

## 3. Stack

- **Astro 7** (7.3.x at the time of writing; Node 22.12+) with **TypeScript in strict mode**. No UI framework: every page is prerendered to static HTML.
- Interactive parts are small TypeScript modules loaded with Astro `<script>` tags, only on the pages that use them.
- **Page transitions** use native cross-document view transitions (`@view-transition { navigation: auto; }`). Each work row's title and its case-study title share a `view-transition-name` (`work-<slug>`), so the title glides between pages in Chromium and Safari. Other browsers navigate normally.
- **A theme change** uses a same-document view transition with a circular `clip-path` wipe that starts at the click point (or at the chosen swatch, from the keyboard). Without view-transition support, or with reduced motion, the theme simply switches.
- Packages: `astro`, `@astrojs/check`, `@astrojs/sitemap`, `@fontsource-variable/source-serif-4`, `@fontsource/source-serif-4` (static, for the preview images), `@fontsource/source-sans-3`, `@fontsource/source-code-pro`, `@fontsource/instrument-serif` (the crossing bands), `minisearch` (the chatbot's in-browser search), `satori` + `@resvg/resvg-js` (preview images), `vitest`, `@playwright/test`.

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

Every page shares the same header, footer, "Ask about me" button (section 9) and "Feedback" button (section 9b).

The favicon is the landing screen's mark: the S of Source Serif 4 Bold as an outline (never text, so it looks the same whatever fonts are installed), light on the dark `#141414` screen with the blue outline printed slightly off. `apple-touch-icon.png` is the same mark at 180px, filled edge to edge, for phone home screens.

## 5. Home page

**Landing screen.** A first visit opens on a short animation, then the home page.

- **Look:** a dark screen (`#141414`) with a single "S" in a light letter (`#f1ede4`), the same in every theme. The screen is as tall as a phone screen gets once its address bar hides (`100lvh`), so no strip of the page shows at the bottom.
  1. A thin blue line (`#5a78ff`) draws across the middle.
  2. The S opens out of it, with a blue outline slightly offset, like a misprinted poster. On mouse devices the S leans a little toward the pointer, the outline more.
  3. After about 2.6 s the view dives into the S, turning 12° as it goes, until the S fills the screen. The S empties to a thin light outline as the dive starts, so the page shows through it while it is still an S; the name "Shashank H R" rises inside it.
  4. The dark screen fades in the last fifth of the 1.25 s dive.
- **Skipping:** a scroll, click, tap or key press starts the dive at once. The page does not scroll underneath.
- **When it plays:** once per visit, for people arriving from outside the site at the top of the home page. It does not play on a reload, when coming from another page of the site, for links to a section (`/#work`), with reduced motion, or without JavaScript.
  - An inline script decides before first paint (`shouldPlayLanding()`, key `landing` in `sessionStorage`), so the page never flashes first.
  - Nobody is ever stuck behind it: if its script has not started within 4 s (it failed to load), the page shows anyway, and an error during the show ends it.
- **Build:**
  - The letters are Source Serif 4's display outlines (weight 700, optical size 60), stored as SVG paths in `src/lib/shr-glyphs.ts`. Chrome stops drawing text far below the size the dive reaches, and the outlines need no font to load, so the animation starts with the first frame.
  - The letters cut holes in the dark screen, so the page is there, inside the S, all along.
  - Behind the screen the page stays see-through until its fonts are in (or the dive starts), so no text reflows under it: a reflow there still counts as layout shift, and on Linux and Android, which lack the Mac and Windows fonts the stand-ins are tuned to, it would. See-through rather than hidden, so screen readers read the page throughout.
  - Screen readers read the page as normal: the screen is `aria-hidden`.

Sections, in order:

1. **Header** (fixed)
   - Left: "Shashank H R · Backend Engineer".
   - Centre: live status (`● all systems operational`) and India time (`HH:MM:SS IST`); hidden below 1000px.
   - Right: `Work`, `Playground`, `Contact` (hidden below 760px), `Résumé` (`/resume.pdf`) and `LinkedIn`, both opening in a new tab (text links; below 760px, a document icon and the LinkedIn logo, the text kept for screen readers), an accent pill `60-sec view` linking to `/summary`, and the colour theme picker: a pill with a palette icon and the current choice ("Auto", "Forest"…). It opens a native popover under it, "Colour theme", with Auto and the nine themes as radio buttons, each drawn as a small page in its own colours; the choice is ticked. Arrow keys move through the themes and choose as they go, Escape closes and returns focus to the button, and clicking outside closes it. Hidden without JavaScript, which it needs.
   - After 30px of scroll the header gets a blurred `--bg` background and a hairline. A 2px accent bar across the top shows scroll progress.
2. **Hero**
   - Top row: the label "Portfolio · 2026 edition" with a short intro paragraph and, under it, a bold accent link "Short on time? Read the 60-second summary →" to `/summary`, so the quick view is seen in the first screen (the header pill alone was easy to miss); on the right, a mono index `01 About … 07 Contact` linking to sections (hidden below 760px).
   - Under it, the proof row (added 2026-09-28 from a portfolio review: "bring your best evidence higher"): three flagship results as linked cards (`45%` of failed deliveries recovered on the first retry, `~8M / day` billing events counted once, `30–60 min` daily review time per developer, down from ~2 h), with "View work" (`#work`) and "Résumé" buttons. Three columns and stacked buttons on a laptop, a single column on a phone.
   - The full name "Shashank H R" in Source Serif 4 Bold, under 60% of a laptop screen wide (10.5vw, up to 165px), on one line. Letters slide up one after another on load. On mouse devices each letter leans up (up to 22px, `scaleY` up to 1.14) when the cursor is within 300px, and turns accent at once when very close: only the slide-up waits its turn.
   - Second row: a rotating circular badge ("Open to SDE-2 roles ✺ Bangalore ✺ 2026 ✺", accent core with "↓" linking to About) and the light lede "I build *reliable backends* for high-volume messaging."
   - A mono line types and erases four lines in turn, prompt `~/shashank $`. It types rightward from a prompt that stays put, in a block as wide as the longest line (right-aligned under the lede on wider screens).
3. **Skill strips.** Two slightly rotated marquee bands: one lists skills (Java, Spring Boot, Apache Kafka, RabbitMQ, Redis, MongoDB, Spark, AWS S3, Microservices), the other highlights (Open to SDE-2 roles, Employee of the Month ×2, MongoDB certified, CGPA 9.47, Bangalore). They drift at a base speed; scroll speed adds a boost and scroll direction sets the drift direction.
4. **(01) About.** A mono facts list (`based_in`, `engati` SDE and intern lines with computed durations, `education`, `awards`, `status`) beside a large paragraph whose words light up to full opacity as they pass the middle of the screen: the lit edge starts when the paragraph's top reaches 60% of the screen height and ends when its bottom passes 40% (`src/lib/reveal.ts`). Phrases marked in the data render in serif italic accent.
5. **(02) Stack — "Stack"** Added on 2026-09-28 from feedback issue #10 ("too text-heavy; show skills as rows with a heading").
   - The résumé's skills, grouped as on the résumé (Languages, Backend, Messaging & Caching, Data Engineering, Databases & Search, Cloud & Infrastructure, AI & LLM, Frontend): one row per group, its name on the left and its skills as chips on the right (stacked on a phone).
   - Each chip is a button. Hovering, focusing or tapping one shows, under the rows, where on this site it was used, as links to the case studies, the incidents or the prod sandbox; a skill with no work on the site says "On my résumé". A dot marks the chips that have work to show. Links name only work on this site, never side projects.
   - Without JavaScript the chips are plain labels.
6. **(03) Experience — "Experience"**
   - Replaced the request-trace table on 2026-09-28: its "GET /career · root span" row and "200 OK" label read like leftover debug output to visitors.
   - A slim timeline: one track with the degree (ink), the internship (soft accent) and the full-time role (accent) as bars placed by start and end month, years under it plus "now", and a key. Bars grow in the first time it enters the viewport.
   - Then each role, newest first and always open: its name, its dates and length (`Jul 2024 – now · 2y 2m`, `Jan – Jun 2024 · 6m`), one short line, "What I built" as links to the case studies, each led by its key number in large accent type with what it measures under it (`35% → 12%` failure rate, `~8M` billing events a day, `2 h → 30 min` per code review, `1–2 sprints` from design to production), and any award. The degree is the last entry. Names and dates sit left of the details on wide screens and stack on a phone.
7. **(04) Selected work.** Five rows: the four case studies (links) and "Prod sandbox" (a brief).
   - Columns: number, title, one-line description, stack, key metric with a small caption.
   - Hover: a soft `--line2` tint; the title shifts 10px right and turns accent; a 230px card follows the cursor, offset down and right (flipping left near the right edge), showing tag, "Case study ↗" or "Click to expand", a big accent metric and a short label.
   - No card on touch devices. The sandbox row expands its text in place (button semantics, `aria-expanded`).
8. **(05) Incidents — "Production incidents"** The section label reads "2 write-ups from production", not a live count, so it doesn't look like a current incident dashboard. Two postmortem cards (INC-01 MongoDB M20 memory, INC-02 FastAPI memory leak), each with Impact, Cause and Fix, a big accent delta, and before/after bars that grow in on first view.
9. **(06) Playground — "The retry flow, simulated"** The retry-flow simulation (section 8). Its label reads "interactive simulation · illustrative numbers", its text says the numbers are illustrative, not production data, and the failure-rate readout is "failure rate · simulated".
10. **(07) Contact.** A giant "Let's talk →" (mailto link) and links: Email, LinkedIn, GitHub, Résumé (PDF).
11. **Footer** (mono): "© <year> Shashank H R · built with Astro", real page-load time (from the Navigation Timing API), a session uptime counter, and the same live status as the header.

## 6. Case study pages

One template renders all four from content files (section 10). Layout, top to bottom:

1. **Top bar:** "← Back to work" (links to `/#work`) and "Case study NN / 04".
2. **Hero:** kicker, the title in Source Serif 4 (shares the row's `view-transition-name`), a light lede with accent emphasis, and a four-item meta row (for example Role / Stack / Scale / Status).
3. **Stats strip:** four accent values with captions; values never wrap.
4. **(01) The problem:** one to three paragraphs.
5. **(02) How it works:** an SVG diagram with numbered accent dots, then a matching numbered list of steps.
6. **(03) Key decisions:** three cards, each a heading and one short paragraph.
7. **(04) The hardest tradeoff** (optional): one decision that cost something, and why, set off with an accent rule. When a case study has one, Results becomes (05).
8. **(04 or 05) Results:** a list; an optional pull quote in serif italic; an optional call-to-action link (case study 01 links to `/#play`, as "the interactive simulation").
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

**Nodes** (wide positions as fractions of the stage; phones use a taller arrangement): integrations (.10,.20), api-gateway (.30,.20), trigger-mvc (.50,.20), messaging (.70,.20), meta (.90,.20), redis (.60,.50), mongodb (.14,.80), rabbitmq (.32,.80), analytics (.50,.80), webhook-receiver (.86,.80). Hovering a node shows a one-line description. The flow was confirmed by the owner on 2026-09-27.

**Rules**

| Rule | Value |
|---|---|
| New triggers | 2.6 per second, path integrations → api-gateway → trigger-mvc → messaging → meta, moving at 210 px/s; messaging keeps each trackerId in redis |
| Failure chance at meta | 0.35 on the first attempt; 0.15 on retries; 0.90 while it sends error webhooks |
| On success | green pop at meta; if attempt > 1, "saved by retries" +1 |
| On failure | a webhook packet travels meta → webhook-receiver → analytics (which records the reason) → trigger-mvc |
| At trigger-mvc | retryable with chance 0.70. Dropped (red, at trigger-mvc) if non-retryable, if retries are OFF, or if attempt ≥ 3. Otherwise it travels trigger-mvc → rabbitmq. |
| At rabbitmq | waits 1.5 s × 2^(attempt−1), shown as a queued dot with a countdown ring; the attempt number increases; then it travels rabbitmq → trigger-mvc (redis and mongodb flash: trackerId, then payload) → messaging → meta, labelled ↻n |
| Headline failure rate | every 300 ms, a Monte Carlo sample of 400 virtual messages under the same rules, smoothed by moving 35% toward the new value. Settles near 12% (ON), 35% (OFF) and 80% (error webhooks). |

**Controls**

- "Retry framework" switch (`role="switch"`, `aria-checked`).
- "⚡ Simulate error webhooks" lasts 5 seconds and disables itself while running. Meta stays up but answers most deliveries with failure webhooks, so Meta and the webhook receiver glow amber, and every live status on the page reads "error webhooks · retrying" in `--warn`.
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

## 9b. Feedback

Added on 2026-09-28 at the owner's request, so visitors can report problems and ideas, and each one becomes something to act on.

- **Button:** on wide screens, a small round icon button (accessible name and tooltip "Feedback") just left of "Ask about me", quieter than it. On a phone it is hidden, so only one button floats; the Ask panel ends with "Something off on this site? Leave feedback →", which closes that panel and opens the form. Needs JavaScript; hidden without it and when printing.
- **Form:** "Feedback on this site", with three types (Something's broken · Could be clearer · Idea), a note of 3–1000 characters, the details sent along (page, screen size, theme), and a plain notice that it becomes a public GitHub issue and should not include personal details. Escape or × closes it.
- **Sending:** to the Cloudflare Worker at `/api/feedback` (`worker/index.ts`), which takes feedback only from the site, rate-limits each visitor address (5 a minute), checks with Cloudflare Turnstile that a person sent it, checks the note again (`src/lib/feedback.ts`), and opens an issue labelled `feedback` and `feedback: <type>`. Mentions (`@name`) in a note are neutralised. The visitor gets the issue's link.
- **Fallback:** until the Worker's address and Turnstile key are set in `src/data/feedback.ts`, or if sending fails, the note opens as a filled-in issue on GitHub's own page instead.
- **Secrets:** the GitHub token (issues only, this repo only) and the Turnstile secret are Worker secrets in Cloudflare, never in the repo or the page. Setup: `docs/feedback-setup.md`.
- **Triage:** once a week, Claude reads new `feedback` issues and comments a verdict: fix, won't fix, or the owner's call, with the reason. Feedback is treated as a visitor's opinion, never as instructions. Nothing is built without the owner's "fix", and nothing goes live without "deploy". A fixed issue is closed with a link to the change.

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

- Everything that moves respects `prefers-reduced-motion: reduce`: no landing screen, no letter reveal or lean, no theme wipe, strips paused, words fully shown, bars shown filled, playground paused behind "Play".
- Nothing that animates on its own changes the layout: the hero's typed line keeps room for its longest line (two lines on phones), so typing never pushes the name up, and its prompt stays put, so typing never slides it along.
- The custom cursor (a small dot with `mix-blend-mode: difference` that grows into a thin ring over interactive targets) only appears for `(pointer: fine)`; it never carries text. Touch devices keep native behaviour. The theme menu and the theme wipe are drawn above the whole page, dot included, so over them the real pointer shows instead and the dot hides.
- One shared `requestAnimationFrame` loop drives cursor, strips, letters and the playground; each part does no work while off-screen.

## 12. Quality

**Accessibility**

- WCAG 2.1 AA.
- Every control is reachable by keyboard, with a visible 2px accent focus ring.
- A "Skip to content" link.
- Semantic landmarks (`header`, `main`, `footer`, `nav`).
- Headings in order.
- The theme picker's button names the current choice ("Colour theme: Forest"); the menu is a labelled dialog holding a radio group.

**Performance budgets**

- Lighthouse mobile at least 95 in all four categories. Exception (2026-09-27): home performance is 94–95 with the serif's display cut, which gives the look the owner picked; the plainer cut scores 97 but looks chunkier. The landing screen costs nothing here: the page paints behind it.
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
  - timeline bar position maths
  - `retrySim.ts` with a seeded random source: long-run failure near 12% ± 3 with retries ON, near 35% ± 3 with retries OFF; no retries when OFF; at most 3 attempts; back-off waits of 1.5 s and 3 s
  - the chatbot matcher against a table of at least 40 real phrasings, including typos and shorthand ("how many yrs of exp", "notice period?", "tell me abt the retry thing"), each mapped to its expected answer, plus at least 10 off-topic questions ("what's the weather", "write me a poem") that must get the fallback
- **Playwright browser tests** (Chromium, desktop and a 390px mobile viewport):
  - every route loads with no console errors
  - the theme picker (`theme.spec.ts`): it lists Auto and the nine themes with the current one ticked; choosing one recolours the page and survives a reload; Auto follows the system again, live, and forgets the stored choice; Enter, the arrow keys and Escape work, and focus returns to the button; the menu fits a phone screen
  - a work row opens its case study, and "Back to work" returns to `/#work`
  - the playground switch moves the failure rate above 25% within 5 seconds
  - the sandbox row expands
  - the chatbot opens, a suggestion chip returns an answer with a source link, a typed question gets an answer, and Escape closes the panel and returns focus
  - `/404` renders
  - a crawl of internal links finds no broken links
  - the landing screen: it plays on a first visit and dives into the page by itself; a scroll, key press or tap skips it without scrolling the page; it does not play again in the same visit, from another page of the site, for a section link or with reduced motion; it stays dark with light letters in the dark theme; the S matches the display face as the page draws it; it covers a phone even once the address bar hides; the S is as deep where the dive heads as the script assumes; the page's largest paint happens behind it; nothing shifts when it clears, even when fonts arrive late with no look-alike font installed. Other browser tests start past it (`tests/e2e/fixtures.ts`).
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
   - Cloudflare Workers also builds every push to `main` (Workers Builds, set up in the Cloudflare dashboard): `npm run check && npm test && npm run build`, then `npx wrangler deploy`, which publishes `dist/` as static assets per `wrangler.jsonc`, with `404.html` for unknown addresses. The Worker's name there must match `wrangler.jsonc`. No Astro adapter: without the config file, Cloudflare adds `@astrojs/cloudflare` by itself, and that build fails on resvg's native module.
7. **Git-ignored:** `node_modules/`, `dist/`, `.astro/`, test reports, `.superpowers/` (brainstorm files) and `docs/superpowers/` (implementation plans stay local). This spec and the approved mockup are tracked in `docs/design/`.
8. **Custom domain** (optional, later): add `public/CNAME` and DNS records; nothing else changes.

## 15. Content to confirm before launch

Building does not wait on these; placeholders use the best current values. On 2026-09-27 the owner approved launching with items 8 and 9 still open.

1. ~~Real start dates for the project spans on the timeline.~~ Dropped (2026-09-27): each project is drawn across the role it was built in, with no dates of its own.
2. ~~Full-time start month.~~ July 2024, per the résumé.
3. ~~Education dates.~~ August 2020 – July 2024, from the résumé's "2020 – 2024".
4. ~~Redis's exact role in the retry flow, and whether retries re-enter at the messaging layer or at trigger-svc.~~ Confirmed 2026-09-27: messaging keeps each trackerId in Redis; failures return webhook-receiver → analytics → trigger-mvc, which re-enters through messaging.
5. ~~Figures for the RCS billing pipeline.~~ ~4M conversations and ~8M billing events a day, all in working hours: ~250 RPS on average (8M ÷ 9 h), ~500 RPS at a 2× peak.
6. ~~Email, LinkedIn and GitHub.~~ shashankhr06@gmail.com, linkedin.com/in/shashank-hr-0606abc2002, github.com/shashank662; linked from every page's footer.
7. ~~The public résumé PDF.~~ Published as-is, phone number included (the owner's choice); the phone number is not shown on the pages themselves.
8. The owner's review of every "Key decisions" card and the case study 04 pull quote, since these are written in the owner's voice.
9. Answers for the chatbot's recruiter FAQ: relocation and preferred cities, work mode and role types. Notice period and joining date are answered (2026-09-27): an immediate joiner, no notice period.

## 16. Out of scope

An AI-model answerer for the chatbot (the `Answerer` interface leaves room for one later), a blog, a CMS, analytics, a contact-form backend, translations, and the owner's personal side projects are not part of this version.
