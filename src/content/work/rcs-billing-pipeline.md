---
order: 2
kicker: "Engati · Event-driven data"
title: "RCS billing pipeline"
lede: "Every RCS message event ends up on a customer’s bill. This pipeline counts each one once, *even when a job runs again*."
meta:
  - { label: "Role", value: "Architected it" }
  - { label: "Stack", value: "Apache Kafka · AWS S3 · Apache Spark" }
  - { label: "Scope", value: "Customer billing for RCS" }
  - { label: "Status", value: "in production", tone: "ok" }
stats:
  - { value: "Kafka", caption: "takes in every webhook" }
  - { value: "S3", caption: "keeps the raw events" }
  - { value: "Spark", caption: "idempotent, replay-safe jobs" }
  - { value: "3 keys", caption: "botRef · customerId · metric type" }
diagram: "rcs"
steps:
  - "Every RCS message event arrives as a webhook and is published to Apache Kafka."
  - "Events are persisted to AWS S3, so the raw data is always kept."
  - "Spark jobs aggregate them by botRef, customerId and metric type."
  - "The totals feed customer billing."
  - "The jobs are idempotent and replay-safe: re-running any period gives the same totals."
decisions:
  - title: "Kafka in front"
    body: "Publishing webhooks to Kafka separates receiving events from processing them, so a burst of traffic doesn’t hold billing up."
  - title: "Keep the raw events"
    body: "Everything lands in S3 first, so any period can be recomputed from the source if something goes wrong."
  - title: "Idempotent by design"
    body: "Running a job twice gives the same totals as running it once, so a replay can never double-bill a customer."
results:
  - "Accurate customer billing for RCS, **aggregated per bot, customer and metric**."
  - "Failed or repeated jobs are **safe to re-run**: the totals stay the same."
row:
  description: "Webhooks → Kafka → S3 → idempotent Spark aggregation per bot, customer and metric"
  stack: "Kafka · AWS S3 · Spark"
  metric: "replay-safe"
  metricCaption: "idempotent by design"
  cardTag: "Event-driven"
  cardMetric: "Replay-safe"
  cardLabel: "idempotent Spark jobs · accurate customer billing"
ask:
  alt: ["rcs billing", "billing pipeline", "how is rcs usage billed", "spark jobs"]
  keywords: ["rcs", "billing", "bill", "spark", "s3", "kafka", "replay", "idempotent", "pipeline", "aggregation"]
---

RCS usage is billed from webhook events, so the numbers have to be exact. Events arrive all day, and a billing job that fails halfway, or runs twice, must never change what a customer pays.
