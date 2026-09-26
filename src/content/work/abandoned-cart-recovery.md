---
order: 4
kicker: "Engati · Internship · full stack"
title: "Abandoned-cart recovery"
lede: "High-intent shoppers who leave a Shopify store get a personal nudge to come back: a branded link, and a discount if the store offers one. I designed and shipped it end to end as an intern, in *one to two sprints*."
meta:
  - { label: "Role", value: "Built it end to end (intern)" }
  - { label: "Stack", value: "Shopify Liquid · Spring Boot @Async · Shopify GraphQL · DuckDB · Kafka" }
  - { label: "Timeline", value: "1–2 sprints" }
  - { label: "Status", value: "shipped", tone: "ok" }
stats:
  - { value: "1–2 sprints", caption: "from design to production" }
  - { value: "3 lookups", caption: "our DB → Shopify GraphQL → DuckDB" }
  - { value: "2 services", caption: "product-discovery · shopify-consumer" }
  - { value: "Full stack", caption: "storefront popup to the shopper’s phone" }
diagram: "cart"
steps:
  - "The shopper enters their phone number in a CTA popup on the Shopify store, built with theme.liquid."
  - "The product-discovery-service runs validation checks and hands off to an @Async task."
  - "The async task checks the store’s Shopify integration and configuration, then looks the shopper up by email: our database first, then Shopify’s GraphQL API for that store."
  - "Last fallback: the archived-orders parquet in DuckDB, across every store. It pulls all matching records and extracts the phone number, even when it wasn’t in the shipping details."
  - "The result is pushed to Kafka, keyed by user_id."
  - "The shopify-consumer-service builds the payload, applies any discount configured on the portal, and turns the store link into an Engati-branded short URL with our in-house shortener."
  - "The message goes out through Engati’s existing messaging pipeline."
decisions:
  - title: "Three places to look"
    body: "Shopify can’t see across stores, so the lookup falls back from our database, to Shopify’s GraphQL API, to archived orders in DuckDB that span every store."
  - title: "Async at every hop"
    body: "Validation happens up front; store checks and lookups run in an @Async task, and the hand-off to messaging goes through Kafka."
  - title: "Keyed by user_id"
    body: "Kafka messages are keyed by user_id, so everything about one shopper lands on the same partition, in order."
results:
  - "Designed, built and tested end to end in **one to two sprints**, as an intern."
  - "Shoppers new to a store can still be reached, thanks to the **cross-store DuckDB lookup**."
  - "Learned design patterns like **adapter and factory** along the way."
quote: "I worked days and nights to test it end to end. It was a lot of fun, and I learned a lot."
row:
  description: "Shopify popup → async shopper lookups → Kafka → branded message, built as an intern"
  stack: "Liquid · Spring Boot · DuckDB · Kafka"
  metric: "1–2 sprints"
  metricCaption: "design to production"
  cardTag: "Internship · full stack"
  cardMetric: "1–2 sprints"
  cardLabel: "designed, built and tested end to end"
---

A store can only win back an abandoned cart if it can reach the shopper. Shopify doesn’t share a customer’s details across stores, so someone new to one store is often unknown there, even if they have ordered elsewhere.
