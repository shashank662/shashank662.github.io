---
order: 1
kicker: "Engati · Resilience"
title: "Auto-retry framework"
lede: "Meta can’t deliver every message the first time. This framework gives failed deliveries another chance, and *45% of them now get through on the first retry*."
meta:
  - { label: "Role", value: "Designed & built it" }
  - { label: "Stack", value: "Java · Spring Boot · RabbitMQ · MongoDB · Redis" }
  - { label: "Scale", value: "~2M triggers a day" }
  - { label: "Status", value: "in production", tone: "ok" }
stats:
  - { value: "45%", caption: "of failed deliveries recovered on the first retry" }
  - { value: "~2M", caption: "API triggers a day" }
  - { value: "~100K", caption: "failed deliveries a day before retries" }
  - { value: "~45K", caption: "of them delivered a day on the first retry" }
diagram: "retry"
steps:
  - "LeadSquared or MoEngage sends an API trigger."
  - "It enters through the API gateway and reaches trigger-mvc, the action trigger management service."
  - "trigger-mvc hands it to the messaging pipeline, which keeps its trackerId in Redis and sends it through Meta to the user."
  - "Meta sends a webhook back to the webhook receiver: delivered, or failed with a status code."
  - "The analytics pipeline records why it failed and passes the failure on to trigger-mvc."
  - "trigger-mvc checks the status code. Retryable failures wait in RabbitMQ, with fixed-interval or exponential back-off."
  - "When the wait is over, trigger-mvc reads the trackerId from Redis, fetches the original payload from MongoDB and sends it out through messaging again."
decisions:
  - title: "trackerId ties a retry to its original"
    body: "Each retry carries the original message’s trackerId, so trigger-mvc fetches that exact payload from MongoDB and sends the same message again instead of building a new one."
  - title: "Retry only on failure codes"
    body: "Only a few Meta failure codes schedule a retry, and Meta sends those only for messages it didn’t deliver. Permanent failures are never retried, so nothing hammers a message that can’t go through."
  - title: "Back off, don’t pile on"
    body: "Fixed-interval and exponential back-off spread retries out, so a burst of failure webhooks from Meta doesn’t turn into a retry storm."
tradeoff:
  title: "Simple over exactly-once"
  body: "A message is retried only when Meta reports one of a few failure codes, and Meta doesn’t send a failure for a message it delivered. So I didn’t add a separate “already delivered” check before re-sending: that kept the retry path simple. The cost is that nothing on our side would stop a duplicate if a failure and a delivery ever crossed. I accepted that edge case rather than put a lookup or a lock in front of every retry."
results:
  - "**~45K failed deliveries a day** now reach users on the first retry: about **45%** of the ~100K that used to stay failed."
  - "Across all **~2M daily triggers**, the failure rate falls from **~5% to ~2.75%** after one retry, and lower after the later ones."
  - "Absorbed peaks of **300K–400K retries a day** during Meta delivery failures."
cta: { label: "Try the interactive simulation of this flow in the playground", href: "/#play" }
row:
  description: "Retries failed Meta deliveries for LeadSquared & MoEngage triggers: webhook → analytics → trigger-mvc → RabbitMQ back-off → resend by trackerId"
  stack: "Java · Redis · RabbitMQ · MongoDB"
  metric: "45%"
  metricCaption: "failed deliveries recovered, first retry"
  cardTag: "Resilience"
  cardMetric: "~2M / day"
  cardLabel: "third-party API triggers handled"
ask:
  alt: ["tell me about the retry framework", "how do retries work", "what happens when meta fails a message", "auto retry"]
  keywords: ["retry", "retries", "back-off", "backoff", "webhook", "rabbitmq", "trackerid", "leadsquared", "moengage"]
---

Marketing and CRM platforms like LeadSquared and MoEngage trigger messages through Engati’s API: about 2 million a day. When Meta failed to deliver one, it stayed failed. Around **100K deliveries a day**, roughly 5%, were simply lost.

I designed and built the framework from scratch; rollout was with the DevOps team.
