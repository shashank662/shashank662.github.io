---
order: 3
kicker: "Engati · AI tooling · company award"
title: "AI code reviewer"
lede: "A reviewer that reads the diff first. Code review went from about *2 hours to 30 minutes* per developer, and the team made it their default."
meta:
  - { label: "Role", value: "Engineered it" }
  - { label: "Stack", value: "Spring Boot · GitLab API · LLM · Slack" }
  - { label: "Users", value: "~20 developers" }
  - { label: "Status", value: "team default", tone: "ok" }
stats:
  - { value: "2 h → 30 min", caption: "review effort per developer" }
  - { value: "~20", caption: "developers use it" }
  - { value: "Default", caption: "the team’s review workflow" }
  - { value: "Award", caption: "company award for the project" }
diagram: "ai"
steps:
  - "A developer asks for a review from Slack."
  - "The Spring Boot agent pulls the merge request’s diff from GitLab."
  - "Token-budget preprocessing shapes the diff to fit the model’s context window."
  - "An LLM writes review feedback."
  - "The feedback goes to a human reviewer, who makes the final call."
decisions:
  - title: "Start in Slack"
    body: "Reviews begin where the team already talks, so there was nothing new to learn."
  - title: "Mind the token budget"
    body: "Large diffs are shaped before they reach the model, so big merge requests still fit in its context."
  - title: "An aid, not an autopilot"
    body: "The AI suggests; a person decides. Its output is always checked by a human."
results:
  - "Review effort per developer: **~2 hours → ~30 minutes**."
  - "Adopted by **~20 developers** and became **the team’s default** review workflow."
  - "Won a **company award**."
row:
  description: "Spring Boot agent that reviews GitLab MRs with an LLM, triggered from Slack"
  stack: "Spring Boot · LLMs · GitLab · Slack"
  metric: "2 h → 30 min"
  metricCaption: "per review · company award"
  cardTag: "AI tooling · award"
  cardMetric: "4× faster"
  cardLabel: "reviews: ~2 h → ~30 min · ~20 devs"
---

Reviewing a merge request took each developer around two hours. The idea: let an assistant do the first pass on the diff, while a person still makes the final call.
