# ML/AI Development Guide

Staff-level guidelines for machine learning and artificial intelligence systems. This guide covers data engineering, model development, deployment, monitoring, and responsible AI practices.

---

## Overview

This guide applies to:

- Machine learning pipelines (training, evaluation, deployment)
- Deep learning systems (computer vision, NLP, recommendation systems)
- MLOps infrastructure (experiment tracking, feature stores, model registries)
- LLM/GenAI applications (fine-tuning, RAG, prompt engineering)
- Real-time and batch inference systems

### Key Principles

1. **Data-Centric Development** - Data quality beats algorithm complexity
2. **Reproducibility Is Non-Negotiable** - Version everything: data, code, configs, models
3. **Observability Over Uptime** - Monitor drift, not just infrastructure health
4. **Responsible AI** - Fairness, bias detection, and explainability by default

### Technology Stack

| Layer | Technology |
|-------|------------|
| Training | PyTorch, TensorFlow, scikit-learn, XGBoost |
| Experiment Tracking | MLflow, Weights & Biases, Neptune |
| Feature Store | Feast, Tecton, Hopsworks |
| Data Validation | TensorFlow Data Validation, Great Expectations |
| Model Serving | KServe, TorchServe, Triton, vLLM |
| Orchestration | Kubeflow, Airflow, Prefect, Dagster |
| Monitoring | Evidently, WhyLabs, Arize |

---

## Project Structure

```
ml-project/
├── data/
│   ├── raw/                    # Immutable raw data
│   ├── processed/              # Cleaned, transformed data
│   └── features/               # Feature store exports
├── src/
│   ├── data/                   # Data loading and validation
│   │   ├── loaders.py
│   │   ├── validators.py
│   │   └── transforms.py
│   ├── features/               # Feature engineering
│   │   ├── engineering.py
│   │   └── store.py
│   ├── models/                 # Model definitions
│   │   ├── architectures.py
│   │   └── losses.py
│   ├── training/               # Training logic
│   │   ├── trainer.py
│   │   ├── callbacks.py
│   │   └── optimizers.py
│   ├── evaluation/             # Evaluation and metrics
│   │   ├── metrics.py
│   │   └── analysis.py
│   ├── inference/              # Serving code
│   │   ├── predictor.py
│   │   └── preprocessing.py
│   └── utils/                  # Shared utilities
├── configs/                    # Experiment configurations
│   ├── model/
│   ├── training/
│   └── serving/
├── notebooks/                  # Exploration (not production)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── model/                  # Model-specific tests
├── pipelines/                  # ML pipeline definitions
│   ├── training_pipeline.py
│   └── inference_pipeline.py
└── deployments/                # Kubernetes/serving configs
    ├── kserve/
    └── docker/
```

---

## Data Engineering

### Data Validation

Validate all data at pipeline boundaries:

```python
import pandera as pa
from pandera.typing import Series, DataFrame

class TrainingDataSchema(pa.DataFrameModel):
    """Schema for training data validation."""
    
    user_id: Series[str] = pa.Field(nullable=False)
    feature_1: Series[float] = pa.Field(ge=0, le=1)
    feature_2: Series[float] = pa.Field(nullable=False)
    label: Series[int] = pa.Field(isin=[0, 1])
    
    class Config:
        strict = True
        coerce = True

@pa.check_types
def load_training_data(path: str) -> DataFrame[TrainingDataSchema]:
    """Load and validate training data."""
    df = pd.read_parquet(path)
    return df  # Automatically validated against schema
```

### Data Quality Checks

```python
from great_expectations.core import ExpectationSuite

def create_data_quality_suite() -> ExpectationSuite:
    """Define data quality expectations."""
    suite = ExpectationSuite(expectation_suite_name="training_data")
    
    # Completeness
    suite.add_expectation(
        expectation_type="expect_column_values_to_not_be_null",
        kwargs={"column": "user_id"}
    )
    
    # Freshness
    suite.add_expectation(
        expectation_type="expect_column_max_to_be_between",
        kwargs={"column": "timestamp", "min_value": "2024-01-01"}
    )
    
    # Distribution
    suite.add_expectation(
        expectation_type="expect_column_mean_to_be_between",
        kwargs={"column": "feature_1", "min_value": 0.4, "max_value": 0.6}
    )
    
    return suite
```

### Feature Engineering

```python
from feast import FeatureStore, Entity, FeatureView, Field
from feast.types import Float32, Int64

# Define entities
user = Entity(name="user", join_keys=["user_id"])

# Define feature view
user_features = FeatureView(
    name="user_features",
    entities=[user],
    schema=[
        Field(name="avg_session_duration", dtype=Float32),
        Field(name="total_purchases", dtype=Int64),
        Field(name="days_since_last_activity", dtype=Int64),
    ],
    source=user_features_source,
    ttl=timedelta(days=1),
)

# Retrieve features for training
def get_training_features(entity_df: pd.DataFrame) -> pd.DataFrame:
    """Get historical features for training."""
    store = FeatureStore(repo_path="feature_repo/")
    
    training_df = store.get_historical_features(
        entity_df=entity_df,
        features=[
            "user_features:avg_session_duration",
            "user_features:total_purchases",
            "user_features:days_since_last_activity",
        ],
    ).to_df()
    
    return training_df
```

### Training/Serving Skew Prevention

```python
class FeatureTransformer:
    """Ensure identical transforms for training and serving."""
    
    def __init__(self):
        self.scalers: dict[str, StandardScaler] = {}
        self.encoders: dict[str, LabelEncoder] = {}
    
    def fit_transform(self, df: pd.DataFrame, config: TransformConfig) -> pd.DataFrame:
        """Fit and transform for training."""
        result = df.copy()
        
        for col in config.numeric_cols:
            self.scalers[col] = StandardScaler()
            result[col] = self.scalers[col].fit_transform(result[[col]])
        
        for col in config.categorical_cols:
            self.encoders[col] = LabelEncoder()
            result[col] = self.encoders[col].fit_transform(result[col])
        
        return result
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform for serving (uses fitted params)."""
        result = df.copy()
        
        for col, scaler in self.scalers.items():
            result[col] = scaler.transform(result[[col]])
        
        for col, encoder in self.encoders.items():
            result[col] = encoder.transform(result[col])
        
        return result
    
    def save(self, path: str) -> None:
        """Serialize transformer for serving."""
        joblib.dump({"scalers": self.scalers, "encoders": self.encoders}, path)
    
    @classmethod
    def load(cls, path: str) -> "FeatureTransformer":
        """Load transformer for serving."""
        data = joblib.load(path)
        transformer = cls()
        transformer.scalers = data["scalers"]
        transformer.encoders = data["encoders"]
        return transformer
```

---

## Model Development

### Experiment Tracking

```python
import mlflow
from mlflow.tracking import MlflowClient

def train_with_tracking(config: TrainingConfig) -> str:
    """Train model with full experiment tracking."""
    
    mlflow.set_experiment(config.experiment_name)
    
    with mlflow.start_run(run_name=config.run_name) as run:
        # Log parameters
        mlflow.log_params({
            "model_type": config.model_type,
            "learning_rate": config.learning_rate,
            "batch_size": config.batch_size,
            "epochs": config.epochs,
        })
        
        # Log data info
        mlflow.log_params({
            "train_samples": len(train_data),
            "val_samples": len(val_data),
            "feature_count": train_data.shape[1],
        })
        
        # Train
        model = train_model(config, train_data, val_data)
        
        # Log metrics
        metrics = evaluate_model(model, val_data)
        mlflow.log_metrics(metrics)
        
        # Log model with signature
        signature = mlflow.models.infer_signature(
            train_data.drop("label", axis=1),
            model.predict(train_data.drop("label", axis=1))
        )
        mlflow.sklearn.log_model(model, "model", signature=signature)
        
        # Log artifacts
        mlflow.log_artifact("configs/training_config.yaml")
        mlflow.log_artifact("data/feature_importance.png")
        
        return run.info.run_id
```

### Evaluation Metrics

```python
from dataclasses import dataclass
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    roc_auc_score, average_precision_score,
    mean_squared_error, mean_absolute_error, r2_score
)

@dataclass
class ClassificationMetrics:
    """Comprehensive classification metrics."""
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float
    
    @classmethod
    def compute(cls, y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> "ClassificationMetrics":
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average="binary"
        )
        return cls(
            accuracy=accuracy_score(y_true, y_pred),
            precision=precision,
            recall=recall,
            f1=f1,
            roc_auc=roc_auc_score(y_true, y_prob),
            pr_auc=average_precision_score(y_true, y_prob),
        )
    
    def to_dict(self) -> dict[str, float]:
        return {
            "accuracy": self.accuracy,
            "precision": self.precision,
            "recall": self.recall,
            "f1": self.f1,
            "roc_auc": self.roc_auc,
            "pr_auc": self.pr_auc,
        }

def evaluate_by_segment(
    model,
    X: pd.DataFrame,
    y: pd.Series,
    segment_col: str
) -> dict[str, ClassificationMetrics]:
    """Evaluate model performance across segments for fairness analysis."""
    results = {}
    
    for segment in X[segment_col].unique():
        mask = X[segment_col] == segment
        X_seg, y_seg = X[mask], y[mask]
        
        y_pred = model.predict(X_seg)
        y_prob = model.predict_proba(X_seg)[:, 1]
        
        results[segment] = ClassificationMetrics.compute(y_seg, y_pred, y_prob)
    
    return results
```

### Hyperparameter Optimization

```python
import optuna
from optuna.integration import MLflowCallback

def optimize_hyperparameters(
    train_data: pd.DataFrame,
    val_data: pd.DataFrame,
    n_trials: int = 100
) -> dict:
    """Optimize hyperparameters with Optuna."""
    
    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "learning_rate": trial.suggest_float("learning_rate", 1e-4, 1e-1, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
        }
        
        model = XGBClassifier(**params, early_stopping_rounds=50)
        model.fit(
            train_data.drop("label", axis=1),
            train_data["label"],
            eval_set=[(val_data.drop("label", axis=1), val_data["label"])],
            verbose=False,
        )
        
        y_pred = model.predict_proba(val_data.drop("label", axis=1))[:, 1]
        return roc_auc_score(val_data["label"], y_pred)
    
    study = optuna.create_study(direction="maximize")
    study.optimize(
        objective,
        n_trials=n_trials,
        callbacks=[MLflowCallback(metric_name="val_roc_auc")],
    )
    
    return study.best_params
```

---

## Model Deployment

### Model Serving with KServe

```yaml
# kserve/inference-service.yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: fraud-detector
  annotations:
    serving.kserve.io/deploymentMode: Serverless
spec:
  predictor:
    model:
      modelFormat:
        name: mlflow
      storageUri: s3://models/fraud-detector/v1
      resources:
        limits:
          cpu: "2"
          memory: 4Gi
        requests:
          cpu: "1"
          memory: 2Gi
    minReplicas: 1
    maxReplicas: 10
    scaleTarget: 100
    scaleMetric: concurrency
```

### Custom Predictor

```python
from kserve import Model, ModelServer
from kserve.errors import ModelMissingError
import torch

class FraudPredictor(Model):
    """Custom KServe predictor for fraud detection."""
    
    def __init__(self, name: str):
        super().__init__(name)
        self.model = None
        self.transformer = None
        self.ready = False
    
    def load(self) -> bool:
        """Load model and preprocessing artifacts."""
        model_path = os.environ.get("MODEL_PATH", "/mnt/models")
        
        self.model = torch.jit.load(f"{model_path}/model.pt")
        self.model.eval()
        
        self.transformer = FeatureTransformer.load(f"{model_path}/transformer.pkl")
        
        self.ready = True
        return self.ready
    
    def predict(self, payload: dict, headers: dict = None) -> dict:
        """Run inference."""
        if not self.ready:
            raise ModelMissingError(self.name)
        
        # Preprocess
        df = pd.DataFrame(payload["instances"])
        features = self.transformer.transform(df)
        tensor = torch.tensor(features.values, dtype=torch.float32)
        
        # Inference
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.sigmoid(logits).numpy()
        
        return {
            "predictions": probs.tolist(),
            "model_version": os.environ.get("MODEL_VERSION", "unknown"),
        }

if __name__ == "__main__":
    model = FraudPredictor("fraud-detector")
    ModelServer().start([model])
```

### Batch Inference Pipeline

```python
from prefect import flow, task
from prefect.tasks import task_input_hash
from datetime import timedelta

@task(cache_key_fn=task_input_hash, cache_expiration=timedelta(hours=1))
def load_batch_data(date: str) -> pd.DataFrame:
    """Load data for batch inference."""
    return pd.read_parquet(f"s3://data/features/{date}/")

@task
def run_batch_inference(data: pd.DataFrame, model_uri: str) -> pd.DataFrame:
    """Run batch inference on data."""
    model = mlflow.pyfunc.load_model(model_uri)
    
    predictions = model.predict(data)
    
    data["prediction"] = predictions
    data["model_version"] = model_uri.split("/")[-1]
    data["inference_timestamp"] = datetime.utcnow()
    
    return data

@task
def write_predictions(predictions: pd.DataFrame, date: str) -> None:
    """Write predictions to storage."""
    predictions.to_parquet(
        f"s3://predictions/{date}/predictions.parquet",
        index=False
    )

@flow(name="batch-inference")
def batch_inference_pipeline(date: str, model_uri: str) -> None:
    """Daily batch inference pipeline."""
    data = load_batch_data(date)
    predictions = run_batch_inference(data, model_uri)
    write_predictions(predictions, date)
```

---

## Monitoring & Observability

### Drift Detection

```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset

def detect_drift(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    column_mapping: ColumnMapping
) -> dict:
    """Detect data and prediction drift."""
    
    report = Report(metrics=[
        DataDriftPreset(),
        TargetDriftPreset(),
    ])
    
    report.run(
        reference_data=reference_data,
        current_data=current_data,
        column_mapping=column_mapping,
    )
    
    result = report.as_dict()
    
    drift_detected = result["metrics"][0]["result"]["dataset_drift"]
    drift_share = result["metrics"][0]["result"]["drift_share"]
    
    return {
        "drift_detected": drift_detected,
        "drift_share": drift_share,
        "drifted_columns": [
            col for col, info in result["metrics"][0]["result"]["drift_by_columns"].items()
            if info["drift_detected"]
        ],
    }

def monitor_model_performance(
    predictions: pd.DataFrame,
    actuals: pd.DataFrame,
    threshold: float = 0.05
) -> dict:
    """Monitor model performance degradation."""
    
    merged = predictions.merge(actuals, on="id")
    
    current_metrics = ClassificationMetrics.compute(
        merged["actual"],
        merged["prediction"],
        merged["probability"]
    )
    
    baseline_metrics = load_baseline_metrics()
    
    degradation = {
        metric: (baseline_metrics[metric] - current_metrics[metric]) / baseline_metrics[metric]
        for metric in ["accuracy", "precision", "recall", "f1", "roc_auc"]
    }
    
    alerts = [
        metric for metric, deg in degradation.items()
        if deg > threshold
    ]
    
    return {
        "current_metrics": current_metrics.to_dict(),
        "degradation": degradation,
        "alerts": alerts,
    }
```

### Logging & Metrics

```python
import structlog
from prometheus_client import Counter, Histogram, Gauge

# Structured logging
logger = structlog.get_logger()

# Prometheus metrics
PREDICTION_LATENCY = Histogram(
    "model_prediction_latency_seconds",
    "Time spent processing prediction",
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

PREDICTION_COUNT = Counter(
    "model_predictions_total",
    "Total number of predictions",
    ["model_name", "model_version", "outcome"]
)

FEATURE_VALUE = Gauge(
    "model_feature_value",
    "Feature value distribution",
    ["feature_name", "quantile"]
)

def predict_with_observability(model, features: dict) -> dict:
    """Make prediction with full observability."""
    
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    logger.info(
        "prediction_started",
        request_id=request_id,
        feature_count=len(features),
    )
    
    try:
        with PREDICTION_LATENCY.time():
            prediction = model.predict(features)
        
        PREDICTION_COUNT.labels(
            model_name=model.name,
            model_version=model.version,
            outcome="success"
        ).inc()
        
        logger.info(
            "prediction_completed",
            request_id=request_id,
            prediction=prediction,
            latency_ms=(time.time() - start_time) * 1000,
        )
        
        return {"prediction": prediction, "request_id": request_id}
        
    except Exception as e:
        PREDICTION_COUNT.labels(
            model_name=model.name,
            model_version=model.version,
            outcome="error"
        ).inc()
        
        logger.error(
            "prediction_failed",
            request_id=request_id,
            error=str(e),
        )
        raise
```

---

## Security & Responsible AI

### Input Validation

```python
from pydantic import BaseModel, Field, validator
from typing import List

class PredictionRequest(BaseModel):
    """Validated prediction request."""
    
    features: dict[str, float] = Field(..., min_items=1)
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    @validator("features")
    def validate_features(cls, v):
        required = {"feature_1", "feature_2", "feature_3"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"Missing required features: {missing}")
        
        for name, value in v.items():
            if not isinstance(value, (int, float)):
                raise ValueError(f"Feature {name} must be numeric")
            if math.isnan(value) or math.isinf(value):
                raise ValueError(f"Feature {name} contains invalid value")
        
        return v
    
    @validator("features")
    def validate_ranges(cls, v):
        ranges = {
            "feature_1": (0, 1),
            "feature_2": (-100, 100),
        }
        for name, (min_val, max_val) in ranges.items():
            if name in v and not (min_val <= v[name] <= max_val):
                raise ValueError(f"Feature {name} out of range [{min_val}, {max_val}]")
        return v
```

### Fairness Assessment

```python
from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric, ClassificationMetric

def assess_fairness(
    data: pd.DataFrame,
    predictions: np.ndarray,
    protected_attribute: str,
    privileged_groups: list[dict],
    unprivileged_groups: list[dict],
) -> dict:
    """Assess model fairness across protected groups."""
    
    dataset = BinaryLabelDataset(
        df=data,
        label_names=["label"],
        protected_attribute_names=[protected_attribute],
    )
    
    classified_dataset = dataset.copy()
    classified_dataset.labels = predictions.reshape(-1, 1)
    
    metric = ClassificationMetric(
        dataset,
        classified_dataset,
        unprivileged_groups=unprivileged_groups,
        privileged_groups=privileged_groups,
    )
    
    return {
        "statistical_parity_difference": metric.statistical_parity_difference(),
        "equal_opportunity_difference": metric.equal_opportunity_difference(),
        "average_odds_difference": metric.average_odds_difference(),
        "disparate_impact": metric.disparate_impact(),
        "theil_index": metric.theil_index(),
    }

def check_fairness_thresholds(fairness_metrics: dict) -> list[str]:
    """Check if fairness metrics exceed acceptable thresholds."""
    thresholds = {
        "statistical_parity_difference": 0.1,
        "equal_opportunity_difference": 0.1,
        "average_odds_difference": 0.1,
        "disparate_impact": (0.8, 1.25),  # 80% rule
    }
    
    violations = []
    
    for metric, threshold in thresholds.items():
        value = fairness_metrics[metric]
        if isinstance(threshold, tuple):
            if not (threshold[0] <= value <= threshold[1]):
                violations.append(f"{metric}: {value:.3f} not in {threshold}")
        else:
            if abs(value) > threshold:
                violations.append(f"{metric}: {value:.3f} exceeds {threshold}")
    
    return violations
```

### Model Explainability

```python
import shap

def explain_prediction(
    model,
    instance: pd.DataFrame,
    background_data: pd.DataFrame,
    top_k: int = 10
) -> dict:
    """Generate SHAP explanation for a prediction."""
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(instance)
    
    feature_importance = pd.DataFrame({
        "feature": instance.columns,
        "shap_value": shap_values[0],
        "feature_value": instance.values[0],
    })
    
    feature_importance["abs_shap"] = feature_importance["shap_value"].abs()
    feature_importance = feature_importance.sort_values("abs_shap", ascending=False)
    
    return {
        "base_value": explainer.expected_value,
        "prediction": model.predict(instance)[0],
        "top_features": feature_importance.head(top_k).to_dict(orient="records"),
    }
```

---

## Testing

### Unit Tests

```python
import pytest
from unittest.mock import Mock, patch

class TestFeatureTransformer:
    """Test feature transformation logic."""
    
    def test_fit_transform_numeric(self):
        df = pd.DataFrame({"feature_1": [0, 10, 20]})
        config = TransformConfig(numeric_cols=["feature_1"])
        
        transformer = FeatureTransformer()
        result = transformer.fit_transform(df, config)
        
        assert result["feature_1"].mean() == pytest.approx(0, abs=1e-10)
        assert result["feature_1"].std() == pytest.approx(1, abs=1e-10)
    
    def test_transform_uses_fitted_params(self):
        train_df = pd.DataFrame({"feature_1": [0, 10, 20]})
        test_df = pd.DataFrame({"feature_1": [5, 15]})
        config = TransformConfig(numeric_cols=["feature_1"])
        
        transformer = FeatureTransformer()
        transformer.fit_transform(train_df, config)
        result = transformer.transform(test_df)
        
        # Should use training mean/std, not test data
        assert result["feature_1"].iloc[0] == pytest.approx(-0.5, abs=0.1)
    
    def test_save_load_roundtrip(self, tmp_path):
        df = pd.DataFrame({"feature_1": [0, 10, 20]})
        config = TransformConfig(numeric_cols=["feature_1"])
        
        transformer = FeatureTransformer()
        transformer.fit_transform(df, config)
        
        path = tmp_path / "transformer.pkl"
        transformer.save(str(path))
        
        loaded = FeatureTransformer.load(str(path))
        
        assert loaded.scalers.keys() == transformer.scalers.keys()

class TestDataValidation:
    """Test data validation schemas."""
    
    def test_valid_data_passes(self):
        df = pd.DataFrame({
            "user_id": ["u1", "u2"],
            "feature_1": [0.5, 0.7],
            "feature_2": [1.0, 2.0],
            "label": [0, 1],
        })
        
        # Should not raise
        validated = TrainingDataSchema.validate(df)
        assert len(validated) == 2
    
    def test_invalid_range_fails(self):
        df = pd.DataFrame({
            "user_id": ["u1"],
            "feature_1": [1.5],  # Out of range [0, 1]
            "feature_2": [1.0],
            "label": [0],
        })
        
        with pytest.raises(pa.errors.SchemaError):
            TrainingDataSchema.validate(df)
    
    def test_missing_column_fails(self):
        df = pd.DataFrame({
            "user_id": ["u1"],
            "feature_1": [0.5],
            # Missing feature_2
            "label": [0],
        })
        
        with pytest.raises(pa.errors.SchemaError):
            TrainingDataSchema.validate(df)
```

### Model Tests

```python
class TestModelBehavior:
    """Test model behavior and invariants."""
    
    @pytest.fixture
    def trained_model(self):
        """Load a trained model for testing."""
        return mlflow.pyfunc.load_model("models:/fraud-detector/production")
    
    def test_prediction_deterministic(self, trained_model):
        """Same input should give same output."""
        features = pd.DataFrame([{"feature_1": 0.5, "feature_2": 1.0}])
        
        pred1 = trained_model.predict(features)
        pred2 = trained_model.predict(features)
        
        np.testing.assert_array_equal(pred1, pred2)
    
    def test_prediction_in_valid_range(self, trained_model):
        """Predictions should be valid probabilities."""
        features = pd.DataFrame([
            {"feature_1": 0.0, "feature_2": 0.0},
            {"feature_1": 1.0, "feature_2": 100.0},
            {"feature_1": 0.5, "feature_2": 50.0},
        ])
        
        predictions = trained_model.predict(features)
        
        assert all(0 <= p <= 1 for p in predictions)
    
    def test_monotonic_relationship(self, trained_model):
        """Higher risk features should increase fraud probability."""
        low_risk = pd.DataFrame([{"feature_1": 0.1, "feature_2": 10}])
        high_risk = pd.DataFrame([{"feature_1": 0.9, "feature_2": 90}])
        
        low_pred = trained_model.predict(low_risk)[0]
        high_pred = trained_model.predict(high_risk)[0]
        
        assert high_pred > low_pred
    
    def test_no_discrimination_by_protected_attribute(self, trained_model):
        """Model should not discriminate based on protected attributes."""
        base_features = {"feature_1": 0.5, "feature_2": 50}
        
        pred_group_a = trained_model.predict(pd.DataFrame([{**base_features, "group": "A"}]))[0]
        pred_group_b = trained_model.predict(pd.DataFrame([{**base_features, "group": "B"}]))[0]
        
        # Predictions should be very close if group shouldn't matter
        assert abs(pred_group_a - pred_group_b) < 0.01
```

### Integration Tests

```python
class TestInferencePipeline:
    """Test end-to-end inference pipeline."""
    
    @pytest.fixture
    def inference_service(self):
        """Start inference service for testing."""
        # Start service in test mode
        return InferenceServiceClient("http://localhost:8080")
    
    def test_health_check(self, inference_service):
        """Service should be healthy."""
        response = inference_service.health()
        assert response.status == "healthy"
        assert response.model_loaded == True
    
    def test_single_prediction(self, inference_service):
        """Single prediction should succeed."""
        request = PredictionRequest(
            features={"feature_1": 0.5, "feature_2": 1.0}
        )
        
        response = inference_service.predict(request)
        
        assert "prediction" in response
        assert 0 <= response["prediction"] <= 1
        assert "request_id" in response
    
    def test_batch_prediction(self, inference_service):
        """Batch prediction should succeed."""
        requests = [
            {"feature_1": 0.1, "feature_2": 1.0},
            {"feature_1": 0.5, "feature_2": 2.0},
            {"feature_1": 0.9, "feature_2": 3.0},
        ]
        
        response = inference_service.predict_batch(requests)
        
        assert len(response["predictions"]) == 3
    
    def test_invalid_request_rejected(self, inference_service):
        """Invalid requests should be rejected with clear error."""
        request = PredictionRequest(
            features={"feature_1": "invalid"}  # Should be numeric
        )
        
        with pytest.raises(ValidationError) as exc_info:
            inference_service.predict(request)
        
        assert "must be numeric" in str(exc_info.value)
```

---

## Definition of Done

### Data Pipeline

- [ ] Data validation schema defined and enforced
- [ ] Data quality checks automated
- [ ] Feature engineering code tested
- [ ] No training/serving skew (transformers serialized)
- [ ] Data versioning in place

### Model Development

- [ ] Experiment tracked with all parameters and metrics
- [ ] Multiple metrics evaluated (not just accuracy)
- [ ] Fairness assessed across protected groups
- [ ] Hyperparameters optimized
- [ ] Model registered with signature

### Deployment

- [ ] Model packaged with dependencies
- [ ] Inference endpoint tested
- [ ] Latency meets SLA
- [ ] Scaling configuration defined
- [ ] Rollback procedure documented

### Monitoring

- [ ] Drift detection configured
- [ ] Performance alerts set up
- [ ] Logging in place
- [ ] Dashboards created
- [ ] Incident response plan documented

### Testing

- [ ] Unit tests for all transforms
- [ ] Model behavior tests passing
- [ ] Integration tests for inference
- [ ] Fairness tests passing
- [ ] Load testing completed

---

## Common Pitfalls

### 1. Ignoring Data Quality

```python
# Bad: Trust the data
df = pd.read_csv("data.csv")
model.fit(df)

# Good: Validate everything
df = pd.read_csv("data.csv")
validated_df = DataSchema.validate(df)
quality_report = run_quality_checks(validated_df)
if quality_report.has_critical_issues:
    raise DataQualityError(quality_report.issues)
model.fit(validated_df)
```

### 2. Training/Serving Skew

```python
# Bad: Different preprocessing in training vs serving
# training.py
df["feature"] = (df["feature"] - df["feature"].mean()) / df["feature"].std()

# serving.py
df["feature"] = (df["feature"] - 0.5) / 0.2  # Hardcoded values!

# Good: Serialize the transformer
transformer = FeatureTransformer()
transformer.fit(train_df)
transformer.save("transformer.pkl")  # Use same transformer everywhere
```

### 3. Overfitting to Offline Metrics

```python
# Bad: Deploy based on validation metrics alone
if val_accuracy > 0.95:
    deploy_model(model)

# Good: Use A/B testing in production
if val_accuracy > 0.95:
    deploy_to_shadow(model)
    
    # After collecting production data
    if ab_test_significant and production_lift > 0.01:
        promote_to_production(model)
```

### 4. Ignoring Fairness

```python
# Bad: Only optimize for accuracy
best_model = max(models, key=lambda m: m.accuracy)

# Good: Consider fairness constraints
valid_models = [m for m in models if passes_fairness_checks(m)]
if not valid_models:
    raise FairnessViolation("No model meets fairness criteria")
best_model = max(valid_models, key=lambda m: m.accuracy)
```

### 5. No Drift Monitoring

```python
# Bad: Deploy and forget
deploy_model(model)

# Good: Continuous monitoring
deploy_model(model)
schedule_drift_detection(model, frequency="hourly")
schedule_performance_monitoring(model, frequency="daily")
setup_alerts(model, thresholds=ALERT_THRESHOLDS)
```

---

## Resources

- [Google ML Engineering Best Practices](https://developers.google.com/machine-learning/guides/rules-of-ml)
- [MLOps Principles](https://ml-ops.org/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Evidently AI - ML Monitoring](https://docs.evidentlyai.com/)
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [KServe Documentation](https://kserve.github.io/website/)
- [Feast Feature Store](https://docs.feast.dev/)
