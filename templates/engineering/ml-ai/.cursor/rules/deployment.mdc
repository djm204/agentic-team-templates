---
description: ML deployment—real-time vs batch, KServe/Triton, scaling, versioning, rollback. Package model and deps; same preprocessing as training.
alwaysApply: false
---

# Model Deployment

Guidelines for deploying ML models.

## Principles

- **One artifact** - Model + preprocessing (transformer) packaged together; same code path as training.
- **Version everything** - Model version, config, and data schema; traceability for rollback and audit.
- **Scale to load** - Right-size replicas and resources; use latency/throughput targets and load tests.

## Patterns

- **Real-time**: Low-latency sync API (e.g. KServe, Triton, custom Flask/FastAPI). Use for interactive flows. Set min/max replicas, scale on concurrency or RPS; GPU if needed.
- **Batch**: Async over large datasets (e.g. Prefect/Dagster, Spark). Run on schedule or trigger; write predictions to store; monitor duration and failure rate.
- **Streaming**: Per-event or micro-batch inference (e.g. Kafka + model service). Latency and throughput SLAs; backpressure and error handling.

## Serving Config

- **Resources**: CPU/memory (and GPU) requests/limits; size from profiling. Always set limits.
- **Replicas**: minReplicas for baseline capacity; maxReplicas and scale metric (concurrency, RPS) for spikes.
- **Health**: Liveness/readiness probes; model loaded before ready. Timeout and retry for downstream.

## Versioning and Rollback

- **Model registry**: Store by version (e.g. MLflow, S3 path); deploy by version tag. No “latest” in production without pin.
- **Rollback**: One-command revert to previous version; test rollback path. Keep previous artifact available.

## Definition of Done (Deploy)

- [ ] Model and preprocessing packaged; signature and deps documented.
- [ ] Serving config (resources, replicas, scaling) set; health checks in place.
- [ ] Rollback tested; monitoring and alerts on latency and errors.

## Common Pitfalls

- **Different preprocessing in serving** - Use same serialized transformer; no duplicate logic.
- **Under-provisioned** - Profile and set resources; avoid OOM and latency spikes.
- **No rollback** - Always have a tested rollback; avoid “restart and hope.”
