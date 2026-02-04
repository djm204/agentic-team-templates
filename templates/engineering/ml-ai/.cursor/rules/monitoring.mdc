---
description: ML monitoring—data and concept drift, performance tracking, latency and throughput. Evidently/WhyLabs-style checks; alerts on degradation.
alwaysApply: false
---

# ML Monitoring & Observability

Guidelines for monitoring ML systems in production.

## Principles

- **Beyond infra** - CPU/memory/latency are necessary; also monitor data and model quality.
- **Drift and performance** - Data drift, concept drift, and performance degradation can occur while infra is green.
- **Actionable** - Every metric/alert ties to a response (retrain, rollback, investigate).

## What to Monitor

- **Data quality**: Missing values, schema violations, outliers at input. Alert on critical violations.
- **Data drift**: Feature distribution vs reference (e.g. training or last good window). Use Evidently/WhyLabs or similar; threshold on drift share or per-feature.
- **Concept drift**: Relationship between features and target (or prediction distribution) changes. Monitor performance over time and by segment.
- **Model performance**: Accuracy, precision, recall, or business KPI on ground truth (when available). Baseline vs current; alert on degradation beyond threshold.
- **Operational**: Prediction latency, throughput, error rate; same as any service.

## Drift Detection

- **Reference**: Training or a recent “good” window. Update reference when you retrain or accept a new baseline.
- **Current**: Rolling window of production inputs (and optionally labels). Run statistical tests (e.g. per-feature); aggregate to “dataset drift” and list drifted columns.
- **Frequency**: Batch hourly/daily or real-time on sample; balance cost and speed of detection.

## Alerts and Dashboards

- **Alerts**: Drift detected, performance drop, latency/error rate. Link to runbook (e.g. retrain, rollback, check data pipeline).
- **Dashboards**: Input distribution, prediction distribution, performance over time, segment breakdown. Use for debugging and trend analysis.

## Definition of Done (ML Monitoring)

- [ ] Data quality and drift checks in place; alerts configured.
- [ ] Performance tracking (and baseline) defined; degradation alert set.
- [ ] Dashboards and runbooks linked; on-call knows response.

## Common Pitfalls

- **No drift monitoring** - Deploy and forget; add drift and performance checks from day one.
- **Only infra** - Model can degrade silently; add ML-specific metrics.
- **Ignoring segments** - Monitor by segment (e.g. region, cohort) to catch localized degradation or fairness regressions.
