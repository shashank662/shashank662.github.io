---
order: 2
kicker: "Engati · Event-driven data"
title: "RCS billing pipeline"
lede: "Every RCS message event ends up on a customer’s bill. This pipeline counts each one once, *even when a job runs again*."
meta:
  - { label: "Role", value: "Designed & built it" }
  - { label: "Stack", value: "Apache Kafka · AWS S3 · Apache Spark" }
  - { label: "Scale", value: "~8M billing events a day" }
  - { label: "Status", value: "in production", tone: "ok" }
stats:
  - { value: "~4M", caption: "conversations a day" }
  - { value: "~8M", caption: "billing events a day, all in working hours" }
  - { value: "~500 RPS", caption: "at peak; about 250 RPS on average" }
  - { value: "3 keys", caption: "botRef · customerId · metric type" }
diagram: "rcs"
steps:
  - "Every RCS message event arrives as a webhook and is published to Apache Kafka."
  - "Events are persisted to AWS S3, so the raw data is always kept."
  - "Spark jobs aggregate them by botRef, customerId and metric type."
  - "The totals feed customer billing."
  - "Each run re-reads a window that overlaps the previous day and replaces that range’s totals, so a re-run gives the same result."
decisions:
  - title: "Kafka in front"
    body: "Publishing webhooks to Kafka separates receiving events from processing them, so a burst of traffic doesn’t hold billing up."
  - title: "Keep the raw events"
    body: "Everything lands in S3 first, so any period can be recomputed from the source if something goes wrong."
  - title: "One billing ID per message"
    body: "Every event for a message (the first send, its updates, repeated packets, a refund) folds into one billing ID. Refunded or superseded messages drop out, and each ID is counted once."
tradeoff:
  title: "A daily batch, not real time"
  body: "With a tight deadline, I chose an async ingestion pipeline and a daily Spark job over real-time counting. Usage appears a day late, but the job is simple to run and to recompute. With more time, I would have built real-time ingestion and reporting."
results:
  - "Takes in **~8M billing events a day** from **~4M conversations**, all inside working hours: about **250 requests a second** on average and **~500 at peak**."
  - "Accurate customer billing for RCS, **counted per bot, customer, day and billing unit**."
  - "Safe to **re-run**: the day’s totals are deleted, then rewritten with an upsert, so a repeated run gives the same numbers."
  - "The delete and rewrite aren’t one transaction, so a job that fails midway is **simply run again**. Each run records its status, and a failure **raises a Slack alert**."
row:
  description: "Webhooks → Kafka → S3 → a daily Spark job that counts each message once, per bot, customer and metric"
  stack: "Kafka · AWS S3 · Spark"
  metric: "~8M / day"
  metricCaption: "billing events · ~500 RPS peak"
  cardTag: "Event-driven"
  cardMetric: "~8M / day"
  cardLabel: "billing events · re-runs give the same totals"
ask:
  alt: ["rcs billing", "billing pipeline", "how is rcs usage billed", "spark jobs"]
  keywords: ["rcs", "billing", "bill", "spark", "s3", "kafka", "replay", "idempotent", "pipeline", "aggregation", "throughput", "rps", "volume"]
---

RCS usage is billed from webhook events, so the numbers have to be exact. About 8 million of them arrive across the working day, and a billing job that fails halfway, or runs twice, must never change what a customer pays.

I designed and built the pipeline from scratch; rollout was with the DevOps team.
