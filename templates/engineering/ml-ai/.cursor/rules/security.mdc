---
description: ML security and responsible AI—input validation, adversarial robustness, fairness, explainability. Data poisoning, extraction, abuse; NIST-aligned.
alwaysApply: false
---

# ML Security & Responsible AI

Guidelines for securing ML systems and responsible AI.

## Principles

- **Validate all inputs** - Schema, types, ranges; reject invalid and log; no raw pass-through to model.
- **Assess fairness** - Measure and constrain disparity across protected groups; block deploy if thresholds violated.
- **Explainability** - Where required, support interpretability (e.g. SHAP, feature importance) for debugging and compliance.

## ML-Specific Threats

- **Data poisoning**: Corrupt training data → wrong patterns. Mitigate: data validation, provenance, and monitoring.
- **Model extraction**: Query to steal model. Mitigate: rate limit, monitor abnormal query patterns, legal/ToS.
- **Adversarial examples**: Crafted inputs to fool model. Mitigate: input validation, robustness training, monitoring outliers.
- **Membership inference / model inversion**: Privacy leakage. Mitigate: access control, differential privacy or aggregation where applicable.
- **Abuse**: Using model for harmful purpose. Mitigate: use-case controls, monitoring, and policy.

## Input Validation

- **Schema**: Required features, types (e.g. numeric), no NaN/Inf. Reject with 400 and clear message.
- **Ranges**: Per-feature min/max; reject out-of-range. Log for drift analysis.
- **Rate and size**: Limit request rate and payload size to mitigate abuse and DoS.

## Fairness

- **Metrics**: Statistical parity, equal opportunity, disparate impact (e.g. 80% rule). Use aif360 or equivalent.
- **Thresholds**: Define acceptable bounds per metric; fail CI or deploy gate if violated.
- **Segments**: Evaluate and monitor by protected attribute; alert on disparity increase.

## Explainability

- **Per-request**: SHAP or similar for high-stakes decisions; return top-K features with attribution (if needed for compliance).
- **Model-level**: Feature importance, partial dependence; document and version with model.

## Definition of Done (ML Security)

- [ ] Input validation and sanitization in place; invalid requests rejected and logged.
- [ ] Fairness assessed and thresholds enforced; monitored in production.
- [ ] Explainability path available where required; docs updated.

## Common Pitfalls

- **No input validation** - Trusting client input leads to errors and abuse; validate and bound.
- **Deploy without fairness check** - Optimize only for accuracy; add fairness constraints and tests.
- **Ignoring adversarial risk** - For sensitive applications, consider robustness and monitoring.
