---
description: ML/AI Development Overview
alwaysApply: false
---

# ML/AI Development Overview

Guidelines for machine learning and AI systems across the full ML lifecycle.

## Scope

- ML pipelines (training, evaluation, deployment)
- Deep learning systems (CV, NLP, recommendation)
- MLOps infrastructure (experiment tracking, feature stores, model registries)
- LLM/GenAI applications (fine-tuning, RAG, prompt engineering)
- Real-time and batch inference systems

## Core Principles

- **Data-Centric Development** — Data quality beats algorithm complexity. Validate at every boundary, version datasets alongside code, invest in labeling quality, monitor for drift.
- **Reproducibility** — Version everything: data, code, configs, models, environments. Pin dependencies, log seeds and hyperparameters, use deterministic ops, track data lineage.
- **Observability Over Uptime** — Models silently degrade while infrastructure stays green. Monitor prediction distributions, detect data/concept drift, track business metrics, alert on performance degradation.
- **Responsible AI** — Fairness, bias detection, and explainability are requirements, not afterthoughts. Assess across protected groups, document limitations, provide prediction explanations.

## Key Decisions

| Decision | Options |
|----------|---------|
| Experiment tracking | MLflow, W&B, Neptune |
| Feature store | Feast, Tecton, Hopsworks |
| Data validation | Pandera, Great Expectations, TFDV |
| Model serving | KServe, TorchServe, Triton, vLLM |
| Orchestration | Kubeflow, Airflow, Prefect, Dagster |
| Drift monitoring | Evidently, WhyLabs, Arize |

## Definition of Done

- [ ] Data validation schemas defined and enforced
- [ ] Experiment tracked with all params, metrics, and artifacts
- [ ] Fairness assessed across protected groups
- [ ] Drift detection and monitoring configured
- [ ] All tests passing (unit, model behavior, integration)
