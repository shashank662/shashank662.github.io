---
order: 1
kicker: "Engati · Resilience"
title: "Auto-retry framework"
lede: "Meta can’t deliver every message the first time. This framework gives failed deliveries another chance, for about *2 million API triggers a day*."
meta:
  - { label: "Role", value: "Designed it" }
  - { label: "Stack", value: "Java · Spring Boot · RabbitMQ · MongoDB · Redis" }
  - { label: "Scale", value: "~2M triggers a day" }
  - { label: "Status", value: "in production", tone: "ok" }
stats:
  - { value: "35% → 12%", caption: "failure rate" }
  - { value: "~2M", caption: "API triggers a day" }
  - { value: "50K–100K", caption: "retries a day" }
  - { value: "300K–400K", caption: "retries a day at peak, during Meta failures" }
diagram: "retry"
steps:
  - "LeadSquared or MoEngage sends an API trigger."
  - "It enters through the API gateway and reaches the action trigger management service."
  - "The message goes out through our messaging layer and Meta to the user."
  - "Meta sends a webhook back: delivered, or failed with a status code."
  - "Status-code checks decide whether the failure is worth retrying."
  - "Retryable failures are pushed with a trackerId, the idempotency key, which fetches the original payload from MongoDB."
  - "RabbitMQ triggers the retry, with fixed-interval or exponential back-off."
decisions:
  - title: "trackerId as the idempotency key"
    body: "Every retry carries the trackerId of the original message, so it finds the right payload and the same message isn’t sent twice."
  - title: "Retry only what can succeed"
    body: "Status codes separate temporary failures from permanent ones, so the system doesn’t keep hammering messages that will never go through."
  - title: "Back off, don’t pile on"
    body: "Fixed-interval and exponential back-off spread retries out, so a Meta outage doesn’t turn into a retry storm."
results:
  - "Failure rate cut from **35% to 12%**."
  - "Handles **~2M API triggers** and **50K–100K retries** a day."
  - "Absorbed peaks of **300K–400K retries a day** during Meta delivery failures."
cta: { label: "See it running: the playground is a live model of this flow", href: "/#play" }
row:
  description: "Retries failed Meta deliveries for LeadSquared & MoEngage triggers: webhook → MongoDB → RabbitMQ, with back-off"
  stack: "Java · Redis · RabbitMQ · MongoDB"
  metric: "35% → 12%"
  metricCaption: "failure rate"
  cardTag: "Resilience"
  cardMetric: "~2M / day"
  cardLabel: "third-party API triggers handled"
---

Marketing and CRM platforms like LeadSquared and MoEngage trigger messages through Engati’s API. When Meta failed to deliver one, it stayed failed: **35% of triggers were failing** before this framework.
