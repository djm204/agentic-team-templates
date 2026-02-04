---
description: ML testing - data validation, transform parity, model behavior, integration. Statistical correctness; train/serve consistency.
alwaysApply: false
---

# ML Testing

Guidelines for testing ML systems.

## Principles

- **Statistical, not exact** - Correctness is distributional; use thresholds and seeds.
- **Train/serve parity** - Same preprocessing and schema in training and serving; test both paths.
- **Pyramid** - Unit (data, transforms) then model behavior then integration then E2E/A-B.

## Data and Transform Tests

- **Schema**: Validate columns, types, ranges (e.g. Pandera, Great Expectations). Test valid passes, missing column fails, invalid range fails.
- **Transforms**: fit_transform vs transform; transform must use fitted params only. Test save/load roundtrip so serving uses identical artifact.
- **No train/serve skew**: One transformer (or pipeline) fit on train, serialized, loaded in serving; never re-fit in serving.

## Model Behavior Tests

- **Determinism**: Same input gives same output (fix seeds; account for GPU non-determinism where needed).
- **Valid range**: Probabilities in [0,1]; logits or scores as designed.
- **Invariants**: Monotonicity, bounds; segment-wise fairness (e.g. similar metrics across protected groups). Fail deploy if fairness thresholds violated.
- **Regression**: Compare metrics to baseline on held-out set; alert on degradation.

## Integration Tests

- **Inference API**: Health check, single and batch predict, invalid input returns 4xx and clear error. Use test client against real or test server.
- **Pipeline**: Load data, transform, predict, write; run on small fixture; assert shape and sanity of output.

## Definition of Done (ML Tests)

- [ ] Data schema and transform tests; save/load tested.
- [ ] Model behavior tests (determinism, range, fairness if applicable).
- [ ] Integration test for inference path; invalid input tested.

## Common Pitfalls

- **Trusting data** - Always validate at pipeline boundaries; fail fast on schema or range violations.
- **Different preprocessing in serve** - Serialize and load one transformer; no hardcoded stats in serving.
- **Only accuracy** - Add fairness, robustness, and regression checks; do not deploy on offline metric alone.
