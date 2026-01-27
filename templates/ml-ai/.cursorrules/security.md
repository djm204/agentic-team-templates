# ML Security & Responsible AI

Guidelines for securing machine learning systems, adversarial robustness, fairness assessment, and responsible AI practices.

## Security Threats

### ML-Specific Attack Vectors

| Attack Type | Description | Impact |
|-------------|-------------|--------|
| Data Poisoning | Corrupting training data | Model learns wrong patterns |
| Model Extraction | Querying to steal model | Intellectual property theft |
| Adversarial Examples | Crafted inputs to fool model | Incorrect predictions |
| Membership Inference | Detecting if data was in training set | Privacy breach |
| Model Inversion | Reconstructing training data | Data leakage |
| Backdoor Attacks | Hidden triggers in model | Targeted misclassification |

### NIST AI Risk Framework Categories

1. **Evasion Attacks** - Manipulating inputs to cause misclassification
2. **Poisoning Attacks** - Corrupting training data or process
3. **Privacy Attacks** - Extracting sensitive information
4. **Abuse Attacks** - Using model for unintended harmful purposes

## Input Validation

### Schema Validation

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
import math

class PredictionRequest(BaseModel):
    """Validated and sanitized prediction request."""
    
    features: dict[str, float] = Field(..., min_items=1)
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    @validator("features")
    def validate_features(cls, v):
        """Validate feature completeness and types."""
        required = {"feature_1", "feature_2", "feature_3"}
        missing = required - set(v.keys())
        if missing:
            raise ValueError(f"Missing required features: {missing}")
        
        for name, value in v.items():
            if not isinstance(value, (int, float)):
                raise ValueError(f"Feature {name} must be numeric")
            if math.isnan(value) or math.isinf(value):
                raise ValueError(f"Feature {name} contains invalid value (NaN/Inf)")
        
        return v
    
    @validator("features")
    def validate_ranges(cls, v):
        """Validate feature values are within expected ranges."""
        ranges = {
            "feature_1": (0.0, 1.0),
            "feature_2": (-100.0, 100.0),
            "feature_3": (0.0, 10000.0),
        }
        
        for name, (min_val, max_val) in ranges.items():
            if name in v:
                if not (min_val <= v[name] <= max_val):
                    raise ValueError(
                        f"Feature {name} value {v[name]} out of range [{min_val}, {max_val}]"
                    )
        
        return v
    
    @validator("features")
    def sanitize_features(cls, v):
        """Sanitize feature values."""
        sanitized = {}
        for name, value in v.items():
            # Clip to reasonable ranges
            sanitized[name] = float(np.clip(value, -1e6, 1e6))
        return sanitized
```

### Rate Limiting

```python
from fastapi import FastAPI, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()

@app.post("/predict")
@limiter.limit("100/minute")
async def predict(request: Request, payload: PredictionRequest):
    """Rate-limited prediction endpoint."""
    # ... prediction logic
```

### Anomaly Detection on Inputs

```python
from sklearn.ensemble import IsolationForest

class InputAnomalyDetector:
    """Detect anomalous inputs before prediction."""
    
    def __init__(self, contamination: float = 0.01):
        self.detector = IsolationForest(
            contamination=contamination,
            random_state=42,
        )
        self._fitted = False
    
    def fit(self, reference_data: pd.DataFrame) -> None:
        """Fit on reference (training) data."""
        self.detector.fit(reference_data)
        self._fitted = True
    
    def check(self, features: pd.DataFrame) -> dict:
        """Check if input is anomalous."""
        if not self._fitted:
            raise ValueError("Detector not fitted")
        
        scores = self.detector.decision_function(features)
        predictions = self.detector.predict(features)
        
        is_anomaly = predictions[0] == -1
        
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": float(scores[0]),
            "action": "reject" if is_anomaly else "accept",
        }
```

## Adversarial Robustness

### Adversarial Testing

```python
import foolbox as fb

def test_adversarial_robustness(
    model,
    test_data: np.ndarray,
    test_labels: np.ndarray,
    epsilon: float = 0.1,
) -> dict:
    """Test model robustness against adversarial examples."""
    
    # Wrap model for Foolbox
    fmodel = fb.PyTorchModel(model, bounds=(0, 1))
    
    # Test multiple attack types
    attacks = [
        fb.attacks.FGSM(),
        fb.attacks.PGD(),
        fb.attacks.DeepFoolAttack(),
    ]
    
    results = {}
    
    for attack in attacks:
        attack_name = type(attack).__name__
        
        # Generate adversarial examples
        _, advs, success = attack(
            fmodel,
            test_data,
            test_labels,
            epsilons=[epsilon],
        )
        
        # Compute success rate
        success_rate = success.float().mean().item()
        
        # Compute perturbation magnitude
        perturbations = advs[0] - test_data
        avg_perturbation = np.abs(perturbations).mean()
        
        results[attack_name] = {
            "success_rate": success_rate,
            "avg_perturbation": float(avg_perturbation),
            "robust_accuracy": 1 - success_rate,
        }
    
    return results
```

### Adversarial Training

```python
def adversarial_training_step(
    model,
    optimizer,
    inputs: torch.Tensor,
    labels: torch.Tensor,
    epsilon: float = 0.1,
    alpha: float = 0.5,
) -> float:
    """Training step with adversarial examples."""
    
    model.train()
    
    # Generate adversarial examples using FGSM
    inputs.requires_grad = True
    outputs = model(inputs)
    loss = F.cross_entropy(outputs, labels)
    loss.backward()
    
    # Perturb inputs
    perturbation = epsilon * inputs.grad.sign()
    adv_inputs = inputs + perturbation
    adv_inputs = torch.clamp(adv_inputs, 0, 1)
    
    # Train on both clean and adversarial
    optimizer.zero_grad()
    
    clean_outputs = model(inputs.detach())
    clean_loss = F.cross_entropy(clean_outputs, labels)
    
    adv_outputs = model(adv_inputs.detach())
    adv_loss = F.cross_entropy(adv_outputs, labels)
    
    # Combined loss
    total_loss = (1 - alpha) * clean_loss + alpha * adv_loss
    total_loss.backward()
    optimizer.step()
    
    return total_loss.item()
```

## Fairness Assessment

### Fairness Metrics

```python
from aif360.datasets import BinaryLabelDataset
from aif360.metrics import ClassificationMetric

def assess_fairness(
    data: pd.DataFrame,
    predictions: np.ndarray,
    protected_attribute: str,
    label_column: str = "label",
) -> dict:
    """Comprehensive fairness assessment."""
    
    # Define groups
    privileged_groups = [{protected_attribute: 1}]
    unprivileged_groups = [{protected_attribute: 0}]
    
    # Create AIF360 datasets
    dataset = BinaryLabelDataset(
        df=data,
        label_names=[label_column],
        protected_attribute_names=[protected_attribute],
    )
    
    classified_dataset = dataset.copy()
    classified_dataset.labels = predictions.reshape(-1, 1)
    
    # Compute metrics
    metric = ClassificationMetric(
        dataset,
        classified_dataset,
        unprivileged_groups=unprivileged_groups,
        privileged_groups=privileged_groups,
    )
    
    return {
        # Group fairness metrics
        "statistical_parity_difference": metric.statistical_parity_difference(),
        "disparate_impact": metric.disparate_impact(),
        
        # Equality of opportunity
        "equal_opportunity_difference": metric.equal_opportunity_difference(),
        "average_odds_difference": metric.average_odds_difference(),
        
        # Calibration
        "calibration_difference": compute_calibration_difference(
            data, predictions, protected_attribute
        ),
        
        # Individual fairness (computed separately)
        "consistency": compute_consistency(data, predictions),
    }

def check_fairness_thresholds(metrics: dict) -> list[str]:
    """Check if fairness metrics meet acceptable thresholds."""
    
    thresholds = {
        "statistical_parity_difference": (-0.1, 0.1),
        "disparate_impact": (0.8, 1.25),  # 80% rule
        "equal_opportunity_difference": (-0.1, 0.1),
        "average_odds_difference": (-0.1, 0.1),
    }
    
    violations = []
    
    for metric, (lower, upper) in thresholds.items():
        if metric not in metrics:
            continue
        
        value = metrics[metric]
        
        if not (lower <= value <= upper):
            violations.append({
                "metric": metric,
                "value": value,
                "threshold": f"[{lower}, {upper}]",
                "severity": "high" if abs(value) > 0.2 else "medium",
            })
    
    return violations
```

### Bias Mitigation

```python
from aif360.algorithms.preprocessing import Reweighing
from aif360.algorithms.inprocessing import AdversarialDebiasing

def mitigate_bias_preprocessing(
    train_data: pd.DataFrame,
    protected_attribute: str,
) -> tuple[pd.DataFrame, np.ndarray]:
    """Apply preprocessing bias mitigation."""
    
    dataset = BinaryLabelDataset(
        df=train_data,
        label_names=["label"],
        protected_attribute_names=[protected_attribute],
    )
    
    # Reweighing
    reweigher = Reweighing(
        unprivileged_groups=[{protected_attribute: 0}],
        privileged_groups=[{protected_attribute: 1}],
    )
    
    reweighed_dataset = reweigher.fit_transform(dataset)
    
    return reweighed_dataset.convert_to_dataframe()[0], reweighed_dataset.instance_weights

def mitigate_bias_postprocessing(
    predictions: np.ndarray,
    probabilities: np.ndarray,
    data: pd.DataFrame,
    protected_attribute: str,
    target_metric: str = "statistical_parity",
) -> np.ndarray:
    """Apply threshold adjustment for fairness."""
    
    # Find optimal thresholds per group
    thresholds = {}
    
    for group in data[protected_attribute].unique():
        mask = data[protected_attribute] == group
        group_probs = probabilities[mask]
        
        # Binary search for threshold that achieves target rate
        thresholds[group] = find_fair_threshold(
            group_probs,
            target_rate=0.5,  # Example: equal positive rate
        )
    
    # Apply group-specific thresholds
    adjusted_predictions = np.zeros_like(predictions)
    
    for group, threshold in thresholds.items():
        mask = data[protected_attribute] == group
        adjusted_predictions[mask] = (probabilities[mask] >= threshold).astype(int)
    
    return adjusted_predictions
```

## Model Explainability

### SHAP Explanations

```python
import shap

def explain_prediction(
    model,
    instance: pd.DataFrame,
    background_data: pd.DataFrame,
    max_display: int = 10,
) -> dict:
    """Generate SHAP explanation for a single prediction."""
    
    # Create explainer
    explainer = shap.TreeExplainer(model)
    
    # Compute SHAP values
    shap_values = explainer.shap_values(instance)
    
    # Build explanation
    feature_contributions = pd.DataFrame({
        "feature": instance.columns,
        "value": instance.values[0],
        "shap_value": shap_values[0] if len(shap_values.shape) == 2 else shap_values[1][0],
    })
    
    feature_contributions["abs_contribution"] = feature_contributions["shap_value"].abs()
    feature_contributions = feature_contributions.sort_values(
        "abs_contribution", ascending=False
    )
    
    return {
        "base_value": float(explainer.expected_value),
        "prediction": float(model.predict(instance)[0]),
        "top_features": feature_contributions.head(max_display).to_dict(orient="records"),
        "feature_contributions": feature_contributions.to_dict(orient="records"),
    }

def generate_global_explanations(
    model,
    data: pd.DataFrame,
    sample_size: int = 1000,
) -> dict:
    """Generate global model explanations."""
    
    # Sample data for efficiency
    sample = data.sample(min(sample_size, len(data)), random_state=42)
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(sample)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        "feature": sample.columns,
        "importance": np.abs(shap_values).mean(axis=0),
    }).sort_values("importance", ascending=False)
    
    return {
        "feature_importance": feature_importance.to_dict(orient="records"),
        "shap_values": shap_values,
        "base_value": float(explainer.expected_value),
    }
```

### Decision Audit Trail

```python
@dataclass
class PredictionAuditLog:
    """Complete audit trail for a prediction."""
    
    request_id: str
    timestamp: datetime
    model_name: str
    model_version: str
    
    # Input
    raw_input: dict
    validated_input: dict
    
    # Processing
    feature_values: dict
    preprocessing_steps: list[str]
    
    # Output
    prediction: int
    probability: float
    confidence: float
    
    # Explanation
    top_contributing_features: list[dict]
    shap_base_value: float
    
    # Metadata
    latency_ms: float
    anomaly_score: Optional[float] = None
    
    def to_dict(self) -> dict:
        return asdict(self)

class AuditLogger:
    """Log predictions for compliance and debugging."""
    
    def __init__(self, storage_path: str):
        self.storage_path = storage_path
    
    def log(self, audit: PredictionAuditLog) -> None:
        """Write audit log."""
        
        # Partition by date for efficient querying
        date = audit.timestamp.strftime("%Y-%m-%d")
        path = f"{self.storage_path}/date={date}/audit.jsonl"
        
        with open(path, "a") as f:
            f.write(json.dumps(audit.to_dict()) + "\n")
    
    def query(
        self,
        start_date: str,
        end_date: str,
        filters: dict = None,
    ) -> list[dict]:
        """Query audit logs for analysis."""
        
        logs = []
        
        for date in pd.date_range(start_date, end_date):
            path = f"{self.storage_path}/date={date.strftime('%Y-%m-%d')}/audit.jsonl"
            
            if not os.path.exists(path):
                continue
            
            with open(path) as f:
                for line in f:
                    log = json.loads(line)
                    
                    if filters and not self._matches_filters(log, filters):
                        continue
                    
                    logs.append(log)
        
        return logs
```

## Privacy Protection

### Differential Privacy

```python
from opacus import PrivacyEngine

def train_with_differential_privacy(
    model: nn.Module,
    train_loader: DataLoader,
    epochs: int,
    target_epsilon: float = 1.0,
    target_delta: float = 1e-5,
    max_grad_norm: float = 1.0,
) -> tuple[nn.Module, float]:
    """Train model with differential privacy guarantees."""
    
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
    
    # Attach privacy engine
    privacy_engine = PrivacyEngine()
    
    model, optimizer, train_loader = privacy_engine.make_private_with_epsilon(
        module=model,
        optimizer=optimizer,
        data_loader=train_loader,
        epochs=epochs,
        target_epsilon=target_epsilon,
        target_delta=target_delta,
        max_grad_norm=max_grad_norm,
    )
    
    # Training loop
    for epoch in range(epochs):
        for batch in train_loader:
            optimizer.zero_grad()
            loss = compute_loss(model, batch)
            loss.backward()
            optimizer.step()
    
    # Get actual epsilon spent
    epsilon = privacy_engine.get_epsilon(target_delta)
    
    return model, epsilon
```

### Data Anonymization

```python
def anonymize_training_data(
    data: pd.DataFrame,
    quasi_identifiers: list[str],
    sensitive_columns: list[str],
    k: int = 5,
) -> pd.DataFrame:
    """Apply k-anonymity to training data."""
    
    anonymized = data.copy()
    
    # Generalize quasi-identifiers
    for col in quasi_identifiers:
        if anonymized[col].dtype in ["int64", "float64"]:
            # Bin numeric values
            anonymized[col] = pd.cut(anonymized[col], bins=10, labels=False)
        else:
            # Generalize categorical (keep top N, replace rest with "Other")
            top_values = anonymized[col].value_counts().head(10).index
            anonymized[col] = anonymized[col].apply(
                lambda x: x if x in top_values else "Other"
            )
    
    # Remove sensitive columns from training
    anonymized = anonymized.drop(columns=sensitive_columns, errors="ignore")
    
    # Verify k-anonymity
    group_sizes = anonymized.groupby(quasi_identifiers).size()
    if group_sizes.min() < k:
        raise ValueError(f"k-anonymity not achieved: min group size = {group_sizes.min()}")
    
    return anonymized
```

## Security Checklist

### Before Deployment

- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Adversarial robustness tested
- [ ] Fairness assessed across protected groups
- [ ] Model explainability available
- [ ] Audit logging enabled
- [ ] Access controls in place
- [ ] Secrets not in code or logs

### Ongoing Monitoring

- [ ] Monitor for unusual query patterns (model extraction)
- [ ] Track fairness metrics over time
- [ ] Alert on prediction distribution shifts
- [ ] Regular adversarial testing
- [ ] Periodic fairness audits
- [ ] Review access logs

### Incident Response

| Incident | Immediate Action | Follow-up |
|----------|------------------|-----------|
| Data breach | Rotate credentials, notify stakeholders | Audit access, review controls |
| Adversarial attack | Rate limit, add input filters | Adversarial training |
| Fairness violation | Review decisions, consider rollback | Bias mitigation |
| Model extraction | Rate limit, monitor queries | Add watermarking |
