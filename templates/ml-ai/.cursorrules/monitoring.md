# ML Monitoring & Observability

Guidelines for monitoring machine learning systems in production, including drift detection, performance tracking, and alerting strategies.

## Core Monitoring Concepts

### ML-Specific Challenges

Traditional monitoring (CPU, memory, latency) is necessary but insufficient for ML systems. Models can silently degrade while infrastructure metrics stay green.

| Monitoring Type | What It Catches | What It Misses |
|-----------------|-----------------|----------------|
| Infrastructure | Server crashes, OOM | Silent model degradation |
| Application | API errors, latency spikes | Prediction quality decline |
| **ML-Specific** | Data drift, concept drift | Nothing (when done right) |

### Key Metrics to Track

| Category | Metrics | Purpose |
|----------|---------|---------|
| Data Quality | Missing values, schema violations, outliers | Input health |
| Data Drift | Feature distributions, statistical tests | Distribution shift |
| Model Performance | Accuracy, precision, recall, business KPIs | Output quality |
| Concept Drift | Prediction distribution, label correlation | Relationship changes |
| Operational | Latency, throughput, error rates | System health |

## Drift Detection

### Data Drift

Detect when input distributions change:

```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset
from evidently.metrics import DataDriftTable

def detect_data_drift(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    column_mapping: ColumnMapping,
    threshold: float = 0.05,
) -> dict:
    """Detect drift in feature distributions."""
    
    report = Report(metrics=[
        DataDriftPreset(stattest_threshold=threshold),
    ])
    
    report.run(
        reference_data=reference_data,
        current_data=current_data,
        column_mapping=column_mapping,
    )
    
    result = report.as_dict()
    drift_info = result["metrics"][0]["result"]
    
    return {
        "dataset_drift": drift_info["dataset_drift"],
        "drift_share": drift_info["drift_share"],
        "drifted_columns": [
            col for col, info in drift_info["drift_by_columns"].items()
            if info["drift_detected"]
        ],
        "column_details": {
            col: {
                "drift_detected": info["drift_detected"],
                "stattest": info["stattest_name"],
                "p_value": info.get("p_value"),
            }
            for col, info in drift_info["drift_by_columns"].items()
        },
    }
```

### Concept Drift

Detect when the relationship between features and target changes:

```python
def detect_concept_drift(
    reference_predictions: pd.DataFrame,
    current_predictions: pd.DataFrame,
    window_size: int = 1000,
) -> dict:
    """Detect changes in prediction patterns."""
    
    # Compare prediction distributions
    from scipy import stats
    
    ref_preds = reference_predictions["probability"]
    curr_preds = current_predictions["probability"]
    
    # Kolmogorov-Smirnov test
    ks_stat, ks_pvalue = stats.ks_2samp(ref_preds, curr_preds)
    
    # Population Stability Index
    psi = calculate_psi(ref_preds, curr_preds, buckets=10)
    
    # Jensen-Shannon divergence
    js_divergence = calculate_js_divergence(ref_preds, curr_preds)
    
    return {
        "ks_statistic": ks_stat,
        "ks_pvalue": ks_pvalue,
        "psi": psi,
        "js_divergence": js_divergence,
        "drift_detected": psi > 0.1 or ks_pvalue < 0.05,
    }

def calculate_psi(reference: pd.Series, current: pd.Series, buckets: int = 10) -> float:
    """Calculate Population Stability Index."""
    
    # Create bins from reference
    _, bins = pd.cut(reference, buckets, retbins=True)
    bins[0] = -np.inf
    bins[-1] = np.inf
    
    # Calculate proportions
    ref_counts = pd.cut(reference, bins).value_counts(normalize=True)
    curr_counts = pd.cut(current, bins).value_counts(normalize=True)
    
    # Align indices
    ref_counts = ref_counts.reindex(curr_counts.index, fill_value=0.0001)
    curr_counts = curr_counts.replace(0, 0.0001)
    
    # PSI formula
    psi = np.sum((curr_counts - ref_counts) * np.log(curr_counts / ref_counts))
    
    return psi
```

### Continuous Drift Monitoring

```python
from prefect import flow, task
from datetime import datetime, timedelta

@task
def fetch_reference_data(model_version: str) -> pd.DataFrame:
    """Fetch reference data for the model version."""
    return pd.read_parquet(f"s3://reference-data/{model_version}/")

@task
def fetch_current_data(date: str) -> pd.DataFrame:
    """Fetch current production data."""
    return pd.read_parquet(f"s3://production-data/{date}/")

@task
def run_drift_detection(
    reference: pd.DataFrame,
    current: pd.DataFrame,
) -> dict:
    """Run all drift detection checks."""
    
    column_mapping = ColumnMapping(
        target="label",
        prediction="prediction",
        numerical_features=NUMERIC_FEATURES,
        categorical_features=CATEGORICAL_FEATURES,
    )
    
    data_drift = detect_data_drift(reference, current, column_mapping)
    concept_drift = detect_concept_drift(reference, current)
    
    return {
        "data_drift": data_drift,
        "concept_drift": concept_drift,
        "timestamp": datetime.utcnow().isoformat(),
    }

@task
def send_alerts(drift_results: dict) -> None:
    """Send alerts if drift detected."""
    
    if drift_results["data_drift"]["dataset_drift"]:
        send_alert(
            channel="ml-alerts",
            severity="warning",
            message=f"Data drift detected: {drift_results['data_drift']['drift_share']:.1%} of features drifted",
            details=drift_results["data_drift"]["drifted_columns"],
        )
    
    if drift_results["concept_drift"]["drift_detected"]:
        send_alert(
            channel="ml-alerts",
            severity="critical",
            message=f"Concept drift detected: PSI={drift_results['concept_drift']['psi']:.3f}",
            details=drift_results["concept_drift"],
        )

@flow(name="drift-monitoring")
def drift_monitoring_pipeline(date: str, model_version: str):
    """Daily drift monitoring pipeline."""
    
    reference = fetch_reference_data(model_version)
    current = fetch_current_data(date)
    
    drift_results = run_drift_detection(reference, current)
    
    # Log to MLflow
    log_drift_metrics(drift_results)
    
    # Alert if needed
    send_alerts(drift_results)
    
    return drift_results
```

## Performance Monitoring

### Real-Time Metrics

```python
from prometheus_client import Counter, Histogram, Gauge, Summary

# Prediction metrics
PREDICTION_LATENCY = Histogram(
    "model_prediction_latency_seconds",
    "Time to generate prediction",
    ["model_name", "model_version"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

PREDICTION_COUNT = Counter(
    "model_predictions_total",
    "Total predictions made",
    ["model_name", "model_version", "outcome"],
)

PREDICTION_VALUE = Summary(
    "model_prediction_value",
    "Distribution of prediction values",
    ["model_name", "model_version"],
)

FEATURE_VALUE = Gauge(
    "model_feature_value",
    "Feature value statistics",
    ["model_name", "feature_name", "statistic"],
)

# Instrumented prediction function
def predict_with_metrics(model, features: dict) -> dict:
    """Make prediction with full metric instrumentation."""
    
    start_time = time.time()
    
    try:
        prediction = model.predict(features)
        
        # Record metrics
        latency = time.time() - start_time
        PREDICTION_LATENCY.labels(
            model_name=model.name,
            model_version=model.version,
        ).observe(latency)
        
        PREDICTION_COUNT.labels(
            model_name=model.name,
            model_version=model.version,
            outcome="success",
        ).inc()
        
        PREDICTION_VALUE.labels(
            model_name=model.name,
            model_version=model.version,
        ).observe(prediction)
        
        return {"prediction": prediction, "latency_ms": latency * 1000}
        
    except Exception as e:
        PREDICTION_COUNT.labels(
            model_name=model.name,
            model_version=model.version,
            outcome="error",
        ).inc()
        raise
```

### Delayed Labels Monitoring

When ground truth arrives later than predictions:

```python
class DelayedLabelMonitor:
    """Monitor model performance with delayed ground truth."""
    
    def __init__(self, model_name: str, lookback_days: int = 30):
        self.model_name = model_name
        self.lookback_days = lookback_days
    
    def compute_metrics(self, date: str) -> dict:
        """Compute metrics for predictions that now have labels."""
        
        # Load predictions from N days ago
        prediction_date = (
            datetime.strptime(date, "%Y-%m-%d") - timedelta(days=self.lookback_days)
        ).strftime("%Y-%m-%d")
        
        predictions = load_predictions(self.model_name, prediction_date)
        labels = load_labels(prediction_date)
        
        # Join and compute metrics
        joined = predictions.merge(labels, on="id")
        
        metrics = ClassificationMetrics.compute(
            joined["label"],
            joined["prediction"],
            joined["probability"],
        )
        
        # Compare to baseline
        baseline_metrics = load_baseline_metrics(self.model_name)
        
        degradation = {
            metric: (baseline - current) / baseline
            for metric, baseline, current in [
                ("accuracy", baseline_metrics["accuracy"], metrics.accuracy),
                ("precision", baseline_metrics["precision"], metrics.precision),
                ("recall", baseline_metrics["recall"], metrics.recall),
                ("f1", baseline_metrics["f1"], metrics.f1),
            ]
        }
        
        return {
            "date": prediction_date,
            "metrics": metrics.to_dict(),
            "baseline_metrics": baseline_metrics,
            "degradation": degradation,
            "sample_size": len(joined),
        }
```

## Logging & Structured Observability

### Structured Logging

```python
import structlog

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

logger = structlog.get_logger()

def predict_with_logging(model, request: PredictionRequest) -> PredictionResponse:
    """Make prediction with comprehensive logging."""
    
    # Bind request context
    log = logger.bind(
        request_id=request.request_id,
        model_name=model.name,
        model_version=model.version,
    )
    
    log.info("prediction_started", feature_count=len(request.features))
    
    start_time = time.time()
    
    try:
        # Preprocessing
        features = transformer.transform(request.features)
        log.debug("preprocessing_complete", transformed_shape=features.shape)
        
        # Prediction
        prediction = model.predict(features)
        probability = float(prediction[0])
        
        latency_ms = (time.time() - start_time) * 1000
        
        log.info(
            "prediction_complete",
            prediction=int(probability >= THRESHOLD),
            probability=probability,
            latency_ms=latency_ms,
        )
        
        return PredictionResponse(
            prediction=int(probability >= THRESHOLD),
            probability=probability,
            latency_ms=latency_ms,
        )
        
    except Exception as e:
        log.error(
            "prediction_failed",
            error=str(e),
            error_type=type(e).__name__,
        )
        raise
```

### Prediction Logging for Analysis

```python
@dataclass
class PredictionLog:
    """Structured prediction log for analysis."""
    
    request_id: str
    timestamp: datetime
    model_name: str
    model_version: str
    features: dict[str, float]
    prediction: int
    probability: float
    latency_ms: float
    label: Optional[int] = None  # Added when ground truth arrives
    
    def to_dict(self) -> dict:
        return asdict(self)

class PredictionLogger:
    """Log predictions for monitoring and retraining."""
    
    def __init__(self, output_path: str):
        self.output_path = output_path
        self.buffer: list[PredictionLog] = []
        self.buffer_size = 1000
    
    def log(self, prediction_log: PredictionLog) -> None:
        """Buffer and write prediction logs."""
        self.buffer.append(prediction_log)
        
        if len(self.buffer) >= self.buffer_size:
            self._flush()
    
    def _flush(self) -> None:
        """Write buffer to storage."""
        if not self.buffer:
            return
        
        df = pd.DataFrame([log.to_dict() for log in self.buffer])
        
        # Partition by date
        date = datetime.utcnow().strftime("%Y-%m-%d")
        hour = datetime.utcnow().strftime("%H")
        
        path = f"{self.output_path}/date={date}/hour={hour}/predictions.parquet"
        df.to_parquet(path, index=False, append=True)
        
        self.buffer.clear()
```

## Alerting

### Alert Configuration

```python
from dataclasses import dataclass
from enum import Enum

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class AlertRule:
    """Define an alerting rule."""
    
    name: str
    metric: str
    condition: str  # e.g., "> 0.1", "< 0.8"
    severity: AlertSeverity
    window_minutes: int = 15
    cooldown_minutes: int = 60
    channels: list[str] = None
    
    def evaluate(self, value: float) -> bool:
        """Evaluate if alert should fire."""
        operator = self.condition[0]
        threshold = float(self.condition[1:].strip())
        
        if operator == ">":
            return value > threshold
        elif operator == "<":
            return value < threshold
        elif operator == "=":
            return value == threshold
        else:
            raise ValueError(f"Unknown operator: {operator}")

# Define alert rules
ALERT_RULES = [
    AlertRule(
        name="high_drift",
        metric="data_drift_share",
        condition="> 0.3",
        severity=AlertSeverity.CRITICAL,
        window_minutes=60,
        channels=["slack", "pagerduty"],
    ),
    AlertRule(
        name="latency_spike",
        metric="p99_latency_ms",
        condition="> 500",
        severity=AlertSeverity.WARNING,
        window_minutes=15,
        channels=["slack"],
    ),
    AlertRule(
        name="accuracy_drop",
        metric="accuracy",
        condition="< 0.85",
        severity=AlertSeverity.CRITICAL,
        window_minutes=60,
        channels=["slack", "pagerduty", "email"],
    ),
    AlertRule(
        name="error_rate_high",
        metric="error_rate",
        condition="> 0.01",
        severity=AlertSeverity.WARNING,
        window_minutes=5,
        channels=["slack"],
    ),
]
```

### Alert Manager

```python
class AlertManager:
    """Manage alert evaluation and notification."""
    
    def __init__(self, rules: list[AlertRule]):
        self.rules = rules
        self.last_fired: dict[str, datetime] = {}
    
    def evaluate_all(self, metrics: dict[str, float]) -> list[dict]:
        """Evaluate all rules against current metrics."""
        fired_alerts = []
        
        for rule in self.rules:
            if rule.metric not in metrics:
                continue
            
            value = metrics[rule.metric]
            
            if rule.evaluate(value):
                # Check cooldown
                if self._in_cooldown(rule):
                    continue
                
                alert = {
                    "rule_name": rule.name,
                    "metric": rule.metric,
                    "value": value,
                    "condition": rule.condition,
                    "severity": rule.severity.value,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                
                fired_alerts.append(alert)
                self._notify(rule, alert)
                self.last_fired[rule.name] = datetime.utcnow()
        
        return fired_alerts
    
    def _in_cooldown(self, rule: AlertRule) -> bool:
        """Check if rule is in cooldown period."""
        if rule.name not in self.last_fired:
            return False
        
        elapsed = datetime.utcnow() - self.last_fired[rule.name]
        return elapsed < timedelta(minutes=rule.cooldown_minutes)
    
    def _notify(self, rule: AlertRule, alert: dict) -> None:
        """Send alert notifications."""
        for channel in rule.channels or []:
            if channel == "slack":
                send_slack_alert(alert)
            elif channel == "pagerduty":
                send_pagerduty_alert(alert)
            elif channel == "email":
                send_email_alert(alert)
```

## Dashboards

### Key Dashboard Panels

```yaml
# Grafana dashboard configuration (conceptual)
panels:
  - title: "Model Predictions (Live)"
    type: timeseries
    metrics:
      - predictions_per_second
      - success_rate
    
  - title: "Prediction Latency"
    type: histogram
    metrics:
      - p50_latency_ms
      - p95_latency_ms
      - p99_latency_ms
    
  - title: "Data Drift Score"
    type: gauge
    metrics:
      - drift_share
    thresholds:
      - value: 0.1
        color: green
      - value: 0.3
        color: yellow
      - value: 0.5
        color: red
    
  - title: "Model Accuracy (Rolling 7d)"
    type: timeseries
    metrics:
      - accuracy
      - precision
      - recall
      - f1
    
  - title: "Feature Distribution Comparison"
    type: comparison
    metrics:
      - reference_distribution
      - current_distribution
```

## Best Practices

### Monitoring Checklist

- [ ] Data drift detection configured
- [ ] Prediction distribution tracked
- [ ] Latency metrics instrumented
- [ ] Error rates monitored
- [ ] Business KPIs tracked
- [ ] Alerts configured with appropriate thresholds
- [ ] Dashboards created for each model
- [ ] Runbooks documented for common alerts

### Response Procedures

| Alert | Severity | Immediate Action | Follow-up |
|-------|----------|------------------|-----------|
| High drift | Critical | Investigate data source | Consider retraining |
| Latency spike | Warning | Check infrastructure | Scale if needed |
| Accuracy drop | Critical | Enable shadow model | Rollback if severe |
| Error rate high | Warning | Check logs | Fix bug or input issue |
