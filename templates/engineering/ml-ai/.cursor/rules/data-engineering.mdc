---
description: Data Engineering for ML
alwaysApply: false
---

# Data Engineering for ML

Data pipelines, validation, feature engineering, and training/serving parity.

## Data Validation

Define explicit schemas for all data and validate at every pipeline boundary:

```python
import pandera as pa
from pandera.typing import Series, DataFrame

class TrainingDataSchema(pa.DataFrameModel):
    user_id: Series[str] = pa.Field(nullable=False)
    feature_numeric: Series[float] = pa.Field(ge=0, le=1)
    feature_categorical: Series[str] = pa.Field(isin=["A", "B", "C"])
    label: Series[int] = pa.Field(isin=[0, 1])
    class Config:
        strict = True
        coerce = True

@pa.check_types
def load_training_data(path: str) -> DataFrame[TrainingDataSchema]:
    return pd.read_parquet(path)  # Automatically validated
```

Use Great Expectations for completeness, freshness, distribution stability, and referential integrity checks. Integrate validation as pipeline tasks that fail loudly on violations.

## Feature Engineering

- Use a **feature store** (Feast, Tecton) for consistent feature retrieval in training and serving
- Define feature views with schemas, TTLs, and online/offline sources
- Retrieve historical features for training; online features for real-time inference

## Training/Serving Skew Prevention

The #1 cause of silent model degradation. Prevent by:

- **Serializing transformers** — fit on training data, `save()`, then `load()` in serving
- **Single transform class** — one `FeatureTransformer` with `fit`, `transform`, `save`, `load`
- **Testing parity** — assert training and serving pipelines produce identical output

```python
# Bad: different preprocessing per environment
df["feat"] = (df["feat"] - df["feat"].mean()) / df["feat"].std()  # training
df["feat"] = (df["feat"] - 0.5) / 0.2  # serving — hardcoded!

# Good: serialize the transformer
transformer = FeatureTransformer(config)
transformer.fit(train_df)
transformer.save("transformer.pkl")  # Use everywhere
```

## Data Versioning

- Use DVC or LakeFS to version datasets alongside code
- Track data lineage: source, version, row/column count, checksum, transformations
- Make pipelines **idempotent** — check if output exists before reprocessing; write atomically (temp file then rename)

## Best Practices

- Validate data at every pipeline boundary — never trust upstream
- Version datasets, schemas, and transformers together
- Serialize all feature transformations — never hardcode parameters
- Monitor data distributions continuously for drift
- Make pipelines idempotent and retryable
