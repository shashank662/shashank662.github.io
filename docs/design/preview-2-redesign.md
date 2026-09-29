# Recruiter-first portfolio redesign
Date: 2026-09-30
Branch: preview-2, based on previews
Status: Design for review

## Purpose
Help recruiters understand Shashank's role, strongest results and career quickly, while giving interested visitors a few memorable interactions. Preserve the editorial typography, theme system and existing retry playground. Reduce repeated descriptions rather than hiding essential qualifications behind controls.

## Homepage
Order: introduction → workbench → career → production incidents → playground → contact.
Keep the résumé and 60-second summary directly reachable. Introduction contains a short role statement, location and availability, plus View work and Résumé. Remove duplicated project metric lists and the repeated technology ticker from this flow. Update navigation to match; retain useful old fragment destinations for existing case-study, summary and chatbot links.

## 1. Workbench
Four project exhibits in a two-column desktop grid, stacked on phones. Each has a recognizable illustrated artifact, title, one documented result, a short ownership sentence, a compact technology list, a case-study link and a Why this worked disclosure.
- Retry framework: delivery receipt progresses from failure through a waiting state to recovery when activated.
- RCS billing: event slips feed an invoice. Replay repeats illustrative events without increasing the final total; explain that the real implementation recomputes and replaces daily totals, not that the browser runs the production pipeline.
- AI reviewer: an explicitly illustrative code diff with a concise review annotation; show the documented daily review-time comparison.
- Cart recovery: an illustrative basket-to-message journey. Do not invent a recovery percentage; use the documented 1–2 sprint delivery result.
Keep the production sandbox as a small supporting item with its documented ownership and scale.
Use lightweight inline SVG/HTML/CSS assets, not stock images or a 3D engine.

## 2. Before and after
Integrate outcome comparisons into exhibits rather than adding another repetitive metric section.
- AI review: labeled blocks comparing approximately 2 hours with 30–60 minutes per developer per day.
- Memory incident: directly labeled 2.5 GB and approximately 1 GB footprints.
- Retries: a schematic delivery journey, with the recorded 45% first-retry recovery result separate from the illustrative animation.
Results are visible at rest. No autoplay count-up numbers or fabricated monitoring traces.

## 3. Career with artifacts
Merge the useful personal context from About with a compact chronological education/internship/software-engineer timeline.
Dates, role titles and institution/company are always visible. Attach compact project artifacts to their documented roles, linking to exhibits or case studies. Use brief disclosures for ownership details and awards; avoid repeating the full workbench descriptions.
Do not invent project dates. Preserve existing dates pending a separate employment-status update: the user's departure must not silently change historical claims or dates without confirmation.

## 4. Why this worked
Each project has a keyboard-accessible native disclosure containing one plain-English engineering decision grounded in its existing case study. Include a material tradeoff when useful, such as daily batch billing having delayed reporting.
Use an expanding explanation rather than a literal rotating card, so essential content remains easy to read on phones and with reduced motion.

## 5. Playground
Retain the tested retry model and diagram. Replace the long opening paragraph with “A delivery failed. Can the system recover?” and a short instruction.
Relabel existing actions in accessible plain language: Send messages and Cause a failure. Preserve their actual behavior (sending five triggers and simulating error webhooks).
Place the detailed architecture explanation in How it works. Add short contextual guidance near the simulation controls; keep a visible illustrative-data label.
Do not create a second competing retry simulation.

## Incidents
Keep the two production incidents as compact visual evidence. Show the existing measured outcomes immediately, with Cause and Fix available in short disclosures.
Use schematic before-and-after illustrations, not invented telemetry. Preserve the incidents anchor for incoming links.

## Interaction and accessibility
One purposeful action per artifact; optional details remain separate from the case-study link.
All actions work on tap and keyboard, never hover alone. Visible focus, adequate contrast, touch targets at least 44px, no nested interactive elements.
Reduced-motion mode changes states immediately. Essential content and native disclosures work without JavaScript. No scroll hijacking or required introductory animation.
Motion runs only on interaction and remains limited to the relevant exhibit.

## Structure
Keep source facts in profile.ts and case-study content. Reuse existing layout, themes, section headings and playground scripts.
Introduce a work-exhibit component and a small interaction module for deterministic illustrative state changes. Update Work, Experience, Incidents, Hero, Playground, homepage composition and navigation as needed.
Remove unused homepage imports; keep summary, case studies, feedback and Ask functional. Update tests that intentionally assert the old layout rather than maintaining obsolete wording.

## Verification
Run Astro checks, unit tests, production build and relevant Playwright tests.
Add behavioral checks for replay leaving invoice totals unchanged, keyboard/touch exhibit controls, disclosures, navigation, narrow layout and reduced motion. Keep existing playground behavior covered.
Inspect rendered desktop and 390px mobile pages for clipping, hierarchy, contrast and excess text. Verify Cloudflare builds and deploys preview-2, and inspect the deployed page.
Work stays on preview-2; main and previews are not modified.

## Acceptance
A recruiter can find role, location, availability, résumé and strongest outcomes without interacting.
All five approved ideas appear in the design without introducing five extra sections.
Project descriptions are not duplicated across Hero, About, Career and Work.
Every substantive metric and implementation claim remains sourced from current site content.
The preview is usable with keyboard, touch, reduced motion and narrow screens.
