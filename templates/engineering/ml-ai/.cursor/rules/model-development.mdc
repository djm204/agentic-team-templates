---
description: Model development—experiment tracking, metrics, evaluation by segment, hyperparameter tuning. Reproducibility; version data, code, config.
alwaysApply: false
---

# Model Development

Guidelines for training, experimentation, and evaluation.

## Principles

- **Reproducibility** - Version data, code, and config; fix seeds; log environment. One run = one reproducible experiment.
- **Track everything** - Params, metrics, artifacts, and model in MLflow (or equivalent). Compare runs; register best.
- **Evaluate broadly** - Not just accuracy; precision, recall, F1, AUC; by segment for fairness; business KPIs where possible.

## Experiment Tracking

- **Per run**: Log params (model type, LR, batch size, etc.), metrics (train/val loss, accuracy, etc.), and artifacts (config, plots). Log model with signature (input/output schema).
- **Organization**: Experiments by project or goal; run names meaningful; tags for search.
- **Comparison**: Use UI or API to compare runs; select by metric; register production candidate.

## Evaluation

- **Metrics**: Classification (accuracy, precision, recall, F1, ROC-AUC, PR-AUC); regression (MSE, MAE, R²). Don’t optimize one metric in isolation.
- **By segment**: Evaluate per cohort (e.g. region, protected attribute); report and enforce fairness thresholds.
- **Baseline**: Compare to simple baseline (e.g. majority class, mean); ensure model adds value.

## Hyperparameter Tuning

- **Tool**: Optuna, Ray Tune, or similar; integrate with experiment tracker. Define search space and objective (e.g. val AUC).
- **Validation**: Use held-out validation set; avoid tuning on test. Report test metrics once at the end.
- **Reproducibility**: Log all tried params and final choice; seed and resource constraints for reproducibility.

## Definition of Done (Model Work)

- [ ] Experiment tracked with params, metrics, and model artifact.
- [ ] Evaluation on validation (and test) with multiple metrics; segment analysis if applicable.
- [ ] Best model registered; signature and dependencies documented.

## Common Pitfalls

- **Only accuracy** - Optimize for business metric and fairness; not just accuracy.
- **Data leakage** - Ensure validation/test are not used for training or tuning; time-split or holdout.
- **No versioning** - Pin data and code version for each run so you can reproduce.
