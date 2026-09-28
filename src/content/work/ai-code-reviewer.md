---
order: 3
kicker: "Engati · AI tooling · company award"
title: "AI code reviewer"
lede: "A reviewer that reads the diff first. Code review went from about *2 hours to 30–60 minutes* a day per developer, and the team made it their default."
meta:
  - { label: "Role", value: "Designed & built it" }
  - { label: "Stack", value: "Spring Boot · GitLab API · LLM · Slack" }
  - { label: "Users", value: "~20 developers" }
  - { label: "Status", value: "team default", tone: "ok" }
stats:
  - { value: "30–60 min", caption: "review time per developer per day, down from ~2 h" }
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
tradeoff:
  title: "LLM calls, not an agent"
  body: "It started at a hackathon, so I used direct LLM calls on the diff instead of an agent with review skills. That was quick to build and easy to plug into Slack and the CI/CD pipeline, which is how it spread across the company. An agent could reason across more of the codebase, at the cost of a much bigger build."
results:
  - "Review time per developer per day: **~2 hours → 30–60 minutes**. That’s an estimate, based on a senior developer spending about 2 of their 8 hours on reviews."
  - "Adopted by **~20 developers** and became **the team’s default** review workflow, then spread across the company through Slack and CI/CD."
  - "Won a **company award**."
row:
  description: "Spring Boot agent that reviews GitLab MRs with an LLM, triggered from Slack"
  stack: "Spring Boot · LLMs · GitLab · Slack"
  metric: "2 h → 30–60 min"
  metricCaption: "review time per dev per day · award"
  cardTag: "AI tooling · award"
  cardMetric: "2–4× faster"
  cardLabel: "reviews: ~2 h → 30–60 min a day · ~20 devs"
ask:
  alt: ["ai code reviewer", "code review bot", "llm project", "ai project", "code review tool"]
  keywords: ["ai", "llm", "review", "reviewer", "gitlab", "slack", "merge", "diff", "token"]
---

Reviewing merge requests took each developer around two hours a day. The idea: let an assistant do the first pass on the diff, while a person still makes the final call.

I designed and built it from scratch, starting at a hackathon; rollout was with the DevOps team.
