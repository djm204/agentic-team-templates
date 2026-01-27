# Data Engineering for ML

Guidelines for data pipelines, validation, feature engineering, and ensuring data quality throughout the ML lifecycle.

## Data Validation

### Schema Validation

Define explicit schemas for all data:

```python
import pandera as pa
from pandera.typing import Series, DataFrame

class TrainingDataSchema(pa.DataFrameModel):
    """Schema for training data validation."""
    
    user_id: Series[str] = pa.Field(nullable=False)
    timestamp: Series[pa.DateTime] = pa.Field(nullable=False)
    feature_numeric: Series[float] = pa.Field(ge=0, le=1)
    feature_categorical: Series[str] = pa.Field(isin=["A", "B", "C"])
    label: Series[int] = pa.Field(isin=[0, 1])
    
    class Config:
        strict = True  # Reject extra columns
        coerce = True  # Auto-convert types

@pa.check_types
def load_training_data(path: str) -> DataFrame[TrainingDataSchema]:
    """Load and validate training data."""
    df = pd.read_parquet(path)
    return df  # Automatically validated
```

### Data Quality Checks

Use Great Expectations for comprehensive quality checks:

```python
from great_expectations.core import ExpectationSuite

def create_quality_suite() -> ExpectationSuite:
    suite = ExpectationSuite("training_data_quality")
    
    # Completeness
    suite.add_expectation(
        expectation_type="expect_column_values_to_not_be_null",
        kwargs={"column": "user_id"}
    )
    
    # Uniqueness
    suite.add_expectation(
        expectation_type="expect_column_values_to_be_unique",
        kwargs={"column": "transaction_id"}
    )
    
    # Freshness
    suite.add_expectation(
        expectation_type="expect_column_max_to_be_between",
        kwargs={
            "column": "timestamp",
            "min_value": "{{ yesterday }}",
            "parse_strings_as_datetimes": True
        }
    )
    
    # Distribution stability
    suite.add_expectation(
        expectation_type="expect_column_mean_to_be_between",
        kwargs={"column": "amount", "min_value": 90, "max_value": 110}
    )
    
    # Referential integrity
    suite.add_expectation(
        expectation_type="expect_column_values_to_be_in_set",
        kwargs={"column": "country_code", "value_set": VALID_COUNTRIES}
    )
    
    return suite
```

### Validation Pipeline Integration

```python
from prefect import flow, task

@task
def validate_data(df: pd.DataFrame, suite_name: str) -> ValidationResult:
    """Validate data against expectations."""
    context = ge.get_context()
    suite = context.get_expectation_suite(suite_name)
    
    result = context.run_validation_operator(
        "action_list_operator",
        assets_to_validate=[df],
        expectation_suite=suite,
    )
    
    if not result.success:
        failed_expectations = [
            exp for exp in result.results if not exp.success
        ]
        raise DataQualityError(f"Validation failed: {failed_expectations}")
    
    return result

@flow
def data_ingestion_pipeline(source: str):
    raw_data = extract_data(source)
    validate_data(raw_data, "raw_data_quality")
    
    processed_data = transform_data(raw_data)
    validate_data(processed_data, "processed_data_quality")
    
    load_data(processed_data)
```

## Feature Engineering

### Feature Store Integration

```python
from feast import FeatureStore, Entity, FeatureView, Field
from feast.types import Float32, Int64, String

# Define entities
user = Entity(name="user", join_keys=["user_id"], description="User entity")

# Define feature view
user_behavior_features = FeatureView(
    name="user_behavior_features",
    entities=[user],
    schema=[
        Field(name="session_count_7d", dtype=Int64),
        Field(name="avg_session_duration_7d", dtype=Float32),
        Field(name="purchase_count_30d", dtype=Int64),
        Field(name="total_spend_30d", dtype=Float32),
    ],
    online=True,  # Enable online serving
    source=user_behavior_source,
    ttl=timedelta(days=1),
    tags={"team": "ml", "feature_group": "user_behavior"},
)

# Retrieve features for training
def get_training_features(entity_df: pd.DataFrame) -> pd.DataFrame:
    """Get historical features for training."""
    store = FeatureStore(repo_path="feature_repo/")
    
    training_df = store.get_historical_features(
        entity_df=entity_df,
        features=[
            "user_behavior_features:session_count_7d",
            "user_behavior_features:avg_session_duration_7d",
            "user_behavior_features:purchase_count_30d",
            "user_behavior_features:total_spend_30d",
        ],
    ).to_df()
    
    return training_df

# Retrieve features for online inference
def get_online_features(user_ids: list[str]) -> dict:
    """Get features for real-time inference."""
    store = FeatureStore(repo_path="feature_repo/")
    
    entity_rows = [{"user_id": uid} for uid in user_ids]
    
    features = store.get_online_features(
        features=[
            "user_behavior_features:session_count_7d",
            "user_behavior_features:avg_session_duration_7d",
        ],
        entity_rows=entity_rows,
    ).to_dict()
    
    return features
```

### Feature Transformations

Ensure identical transforms for training and serving:

```python
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
import joblib

class FeatureTransformer:
    """Serializable feature transformer for training/serving parity."""
    
    def __init__(self, config: FeatureConfig):
        self.config = config
        self.numeric_transformer = StandardScaler()
        self.categorical_encoders: dict[str, LabelEncoder] = {}
        self._fitted = False
    
    def fit(self, df: pd.DataFrame) -> "FeatureTransformer":
        """Fit transformer on training data."""
        # Fit numeric scaler
        if self.config.numeric_cols:
            self.numeric_transformer.fit(df[self.config.numeric_cols])
        
        # Fit categorical encoders
        for col in self.config.categorical_cols:
            encoder = LabelEncoder()
            encoder.fit(df[col].fillna("__MISSING__"))
            self.categorical_encoders[col] = encoder
        
        self._fitted = True
        return self
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform features using fitted parameters."""
        if not self._fitted:
            raise ValueError("Transformer not fitted")
        
        result = df.copy()
        
        # Transform numeric
        if self.config.numeric_cols:
            result[self.config.numeric_cols] = self.numeric_transformer.transform(
                result[self.config.numeric_cols]
            )
        
        # Transform categorical
        for col, encoder in self.categorical_encoders.items():
            # Handle unseen categories
            result[col] = result[col].fillna("__MISSING__")
            result[col] = result[col].apply(
                lambda x: x if x in encoder.classes_ else "__UNKNOWN__"
            )
            result[col] = encoder.transform(result[col])
        
        return result
    
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit and transform in one step."""
        return self.fit(df).transform(df)
    
    def save(self, path: str) -> None:
        """Serialize transformer."""
        joblib.dump({
            "config": self.config,
            "numeric_transformer": self.numeric_transformer,
            "categorical_encoders": self.categorical_encoders,
        }, path)
    
    @classmethod
    def load(cls, path: str) -> "FeatureTransformer":
        """Load serialized transformer."""
        data = joblib.load(path)
        transformer = cls(data["config"])
        transformer.numeric_transformer = data["numeric_transformer"]
        transformer.categorical_encoders = data["categorical_encoders"]
        transformer._fitted = True
        return transformer
```

## Data Versioning

### DVC for Data Version Control

```yaml
# dvc.yaml
stages:
  prepare_data:
    cmd: python src/data/prepare.py
    deps:
      - src/data/prepare.py
      - data/raw/
    outs:
      - data/processed/
    params:
      - prepare.split_ratio
      - prepare.random_seed

  extract_features:
    cmd: python src/features/extract.py
    deps:
      - src/features/extract.py
      - data/processed/
    outs:
      - data/features/
    params:
      - features.window_size
      - features.aggregations
```

```bash
# Track data versions
dvc add data/raw/dataset_v1.parquet
git add data/raw/dataset_v1.parquet.dvc
git commit -m "data: add dataset v1"

# Switch between versions
git checkout v1.0
dvc checkout
```

### Data Lineage Tracking

```python
from dataclasses import dataclass
from datetime import datetime
import hashlib

@dataclass
class DataLineage:
    """Track data provenance."""
    source: str
    version: str
    created_at: datetime
    row_count: int
    column_count: int
    checksum: str
    schema_version: str
    transformations: list[str]
    parent_lineage: Optional["DataLineage"] = None
    
    @classmethod
    def from_dataframe(
        cls,
        df: pd.DataFrame,
        source: str,
        version: str,
        transformations: list[str] = None,
        parent: "DataLineage" = None,
    ) -> "DataLineage":
        """Create lineage record from DataFrame."""
        checksum = hashlib.sha256(
            pd.util.hash_pandas_object(df).values
        ).hexdigest()
        
        return cls(
            source=source,
            version=version,
            created_at=datetime.utcnow(),
            row_count=len(df),
            column_count=len(df.columns),
            checksum=checksum,
            schema_version=get_schema_version(df),
            transformations=transformations or [],
            parent_lineage=parent,
        )
    
    def to_dict(self) -> dict:
        """Serialize for logging."""
        return {
            "source": self.source,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "row_count": self.row_count,
            "column_count": self.column_count,
            "checksum": self.checksum,
            "schema_version": self.schema_version,
            "transformations": self.transformations,
            "parent_checksum": self.parent_lineage.checksum if self.parent_lineage else None,
        }
```

## Training/Serving Skew Prevention

### Common Causes

| Skew Type | Cause | Prevention |
|-----------|-------|------------|
| Data Processing | Different preprocessing code | Serialize transformers |
| Feature Computation | Time-dependent features computed differently | Use feature store timestamps |
| Data Distribution | Training on old data, serving on new | Monitor drift continuously |
| Missing Values | Different imputation strategies | Document and version imputation |

### Prevention Strategies

```python
# 1. Single source of truth for transforms
class FeaturePipeline:
    """Unified pipeline for training and serving."""
    
    def __init__(self, config_path: str):
        self.config = load_config(config_path)
        self.transformer = None
    
    def fit(self, df: pd.DataFrame) -> None:
        """Fit on training data."""
        self.transformer = FeatureTransformer(self.config)
        self.transformer.fit(df)
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform for both training and serving."""
        return self.transformer.transform(df)
    
    def save(self, path: str) -> None:
        """Save entire pipeline."""
        joblib.dump({
            "config": self.config,
            "transformer": self.transformer,
        }, path)

# 2. Test for skew
def test_training_serving_parity():
    """Verify training and serving produce identical features."""
    training_pipeline = FeaturePipeline.load("training_pipeline.pkl")
    serving_pipeline = FeaturePipeline.load("serving_pipeline.pkl")
    
    test_data = load_test_data()
    
    training_features = training_pipeline.transform(test_data)
    serving_features = serving_pipeline.transform(test_data)
    
    pd.testing.assert_frame_equal(training_features, serving_features)
```

## Data Pipeline Patterns

### Idempotent Pipelines

```python
@task
def process_partition(date: str, force: bool = False) -> str:
    """Process a single date partition idempotently."""
    output_path = f"s3://processed/{date}/data.parquet"
    
    # Check if already processed
    if not force and file_exists(output_path):
        checksum = get_checksum(output_path)
        logger.info(f"Partition {date} already exists: {checksum}")
        return output_path
    
    # Process
    raw_data = load_raw_data(date)
    processed = transform(raw_data)
    
    # Write atomically (write to temp, then rename)
    temp_path = f"{output_path}.tmp"
    processed.to_parquet(temp_path)
    rename(temp_path, output_path)
    
    return output_path
```

### Backfill Strategy

```python
@flow
def backfill_features(start_date: str, end_date: str, parallelism: int = 4):
    """Backfill features for a date range."""
    dates = pd.date_range(start_date, end_date, freq="D")
    
    # Process in parallel batches
    for batch in chunked(dates, parallelism):
        futures = [
            process_partition.submit(date.strftime("%Y-%m-%d"))
            for date in batch
        ]
        
        # Wait for batch to complete
        results = [f.result() for f in futures]
        
        # Validate results
        for date, result in zip(batch, results):
            validate_partition(result)
```

## Best Practices

### Do

- Define explicit schemas for all data
- Validate data at pipeline boundaries
- Version datasets alongside code
- Serialize feature transformers
- Test for training/serving skew
- Monitor data distributions continuously

### Don't

- Trust external data without validation
- Hardcode feature engineering parameters
- Use different preprocessing in training vs serving
- Ignore data freshness requirements
- Skip data quality checks in production
- Assume data distributions are stable
