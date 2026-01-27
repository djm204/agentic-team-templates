# ML Testing

Guidelines for testing machine learning systems, including unit tests, model behavior tests, integration tests, and evaluation strategies.

## Testing Philosophy

### ML-Specific Testing Challenges

Traditional software testing verifies exact outputs. ML testing must handle:

| Challenge | Traditional Software | ML Systems |
|-----------|---------------------|------------|
| Correctness | Exact output match | Statistical properties |
| Determinism | Always reproducible | Random seeds, GPU non-determinism |
| Edge cases | Known boundary conditions | Distribution tails |
| Regression | Feature breaks | Performance degradation |

### Testing Pyramid for ML

```
                    ┌─────────────┐
                    │   E2E/A/B   │  Slow, expensive, high confidence
                    │    Tests    │
                   ┌┴─────────────┴┐
                   │  Integration  │  Pipeline tests, API tests
                   │    Tests      │
                  ┌┴───────────────┴┐
                  │   Model Tests    │  Behavior, fairness, robustness
                  │                  │
                 ┌┴──────────────────┴┐
                 │    Unit Tests       │  Fast, isolated, comprehensive
                 └────────────────────┘
```

## Unit Tests

### Data Validation Tests

```python
import pytest
import pandas as pd
import numpy as np
from src.data.validators import TrainingDataSchema
from src.data.transforms import FeatureTransformer

class TestDataValidation:
    """Test data validation schemas."""
    
    def test_valid_data_passes(self):
        """Valid data should pass validation."""
        df = pd.DataFrame({
            "user_id": ["u1", "u2", "u3"],
            "feature_1": [0.5, 0.7, 0.3],
            "feature_2": [1.0, 2.0, 3.0],
            "label": [0, 1, 0],
        })
        
        validated = TrainingDataSchema.validate(df)
        assert len(validated) == 3
    
    def test_missing_column_fails(self):
        """Missing required column should fail."""
        df = pd.DataFrame({
            "user_id": ["u1"],
            "feature_1": [0.5],
            # Missing feature_2 and label
        })
        
        with pytest.raises(pa.errors.SchemaError) as exc_info:
            TrainingDataSchema.validate(df)
        
        assert "feature_2" in str(exc_info.value) or "label" in str(exc_info.value)
    
    def test_invalid_range_fails(self):
        """Value out of range should fail."""
        df = pd.DataFrame({
            "user_id": ["u1"],
            "feature_1": [1.5],  # Out of range [0, 1]
            "feature_2": [1.0],
            "label": [0],
        })
        
        with pytest.raises(pa.errors.SchemaError):
            TrainingDataSchema.validate(df)
    
    def test_null_in_non_nullable_fails(self):
        """Null in non-nullable column should fail."""
        df = pd.DataFrame({
            "user_id": [None],  # Null not allowed
            "feature_1": [0.5],
            "feature_2": [1.0],
            "label": [0],
        })
        
        with pytest.raises(pa.errors.SchemaError):
            TrainingDataSchema.validate(df)

class TestFeatureTransformer:
    """Test feature transformation logic."""
    
    @pytest.fixture
    def sample_data(self):
        return pd.DataFrame({
            "numeric_1": [0, 10, 20, 30, 40],
            "numeric_2": [100, 200, 300, 400, 500],
            "categorical_1": ["A", "B", "A", "C", "B"],
        })
    
    @pytest.fixture
    def config(self):
        return FeatureConfig(
            numeric_cols=["numeric_1", "numeric_2"],
            categorical_cols=["categorical_1"],
        )
    
    def test_fit_transform_normalizes(self, sample_data, config):
        """Numeric features should be normalized."""
        transformer = FeatureTransformer(config)
        result = transformer.fit_transform(sample_data)
        
        # Mean should be ~0, std should be ~1
        assert abs(result["numeric_1"].mean()) < 1e-10
        assert abs(result["numeric_1"].std() - 1) < 0.1
    
    def test_transform_uses_fitted_params(self, sample_data, config):
        """Transform should use parameters from fit."""
        transformer = FeatureTransformer(config)
        transformer.fit(sample_data)
        
        # New data with different distribution
        new_data = pd.DataFrame({
            "numeric_1": [100, 200],
            "numeric_2": [1000, 2000],
            "categorical_1": ["A", "B"],
        })
        
        result = transformer.transform(new_data)
        
        # Should NOT be centered at 0 (uses training stats)
        assert result["numeric_1"].mean() != pytest.approx(0, abs=0.1)
    
    def test_handles_unseen_category(self, sample_data, config):
        """Should handle categories not seen during fit."""
        transformer = FeatureTransformer(config)
        transformer.fit(sample_data)
        
        new_data = pd.DataFrame({
            "numeric_1": [25],
            "numeric_2": [350],
            "categorical_1": ["D"],  # Unseen category
        })
        
        # Should not raise, should encode as unknown
        result = transformer.transform(new_data)
        assert len(result) == 1
    
    def test_save_load_roundtrip(self, sample_data, config, tmp_path):
        """Saved transformer should produce identical results."""
        transformer = FeatureTransformer(config)
        transformer.fit(sample_data)
        
        path = tmp_path / "transformer.pkl"
        transformer.save(str(path))
        
        loaded = FeatureTransformer.load(str(path))
        
        original_result = transformer.transform(sample_data)
        loaded_result = loaded.transform(sample_data)
        
        pd.testing.assert_frame_equal(original_result, loaded_result)
```

### Metric Calculation Tests

```python
class TestMetrics:
    """Test metric calculations."""
    
    def test_classification_metrics_perfect_predictions(self):
        """Perfect predictions should give perfect scores."""
        y_true = np.array([0, 0, 1, 1, 1])
        y_pred = np.array([0, 0, 1, 1, 1])
        y_prob = np.array([0.1, 0.2, 0.9, 0.8, 0.95])
        
        metrics = ClassificationMetrics.compute(y_true, y_pred, y_prob)
        
        assert metrics.accuracy == 1.0
        assert metrics.precision == 1.0
        assert metrics.recall == 1.0
        assert metrics.f1 == 1.0
    
    def test_classification_metrics_all_wrong(self):
        """All wrong predictions should give zero scores."""
        y_true = np.array([0, 0, 1, 1])
        y_pred = np.array([1, 1, 0, 0])
        y_prob = np.array([0.9, 0.8, 0.1, 0.2])
        
        metrics = ClassificationMetrics.compute(y_true, y_pred, y_prob)
        
        assert metrics.accuracy == 0.0
        assert metrics.precision == 0.0
        assert metrics.recall == 0.0
    
    def test_roc_auc_random_is_half(self):
        """Random predictions should have AUC ~0.5."""
        np.random.seed(42)
        y_true = np.random.randint(0, 2, 1000)
        y_prob = np.random.random(1000)
        y_pred = (y_prob >= 0.5).astype(int)
        
        metrics = ClassificationMetrics.compute(y_true, y_pred, y_prob)
        
        assert 0.45 <= metrics.roc_auc <= 0.55
```

## Model Behavior Tests

### Invariance Tests

```python
class TestModelInvariance:
    """Test model behaves consistently under expected variations."""
    
    @pytest.fixture
    def model(self):
        return mlflow.pyfunc.load_model("models:/fraud-detector/Production")
    
    def test_deterministic_predictions(self, model):
        """Same input should always give same output."""
        features = pd.DataFrame([{
            "amount": 100.0,
            "hour": 14,
            "merchant_category": "retail",
        }])
        
        predictions = [model.predict(features)[0] for _ in range(10)]
        
        assert all(p == predictions[0] for p in predictions)
    
    def test_invariant_to_irrelevant_features(self, model):
        """Predictions should not change based on irrelevant features."""
        base_features = {
            "amount": 100.0,
            "hour": 14,
            "merchant_category": "retail",
        }
        
        pred1 = model.predict(pd.DataFrame([{**base_features, "user_name": "Alice"}]))[0]
        pred2 = model.predict(pd.DataFrame([{**base_features, "user_name": "Bob"}]))[0]
        
        assert pred1 == pred2
    
    def test_scale_invariance_for_ratios(self, model):
        """Model should be scale-invariant for ratio features."""
        # If using normalized features, doubling all values should give same result
        features1 = pd.DataFrame([{"feature_1": 0.5, "feature_2": 0.5}])
        features2 = pd.DataFrame([{"feature_1": 1.0, "feature_2": 1.0}])
        
        pred1 = model.predict(features1)[0]
        pred2 = model.predict(features2)[0]
        
        # Predictions should be similar (not necessarily identical)
        assert abs(pred1 - pred2) < 0.1
```

### Directional Expectation Tests

```python
class TestDirectionalExpectations:
    """Test that model responds correctly to feature changes."""
    
    @pytest.fixture
    def model(self):
        return mlflow.pyfunc.load_model("models:/fraud-detector/Production")
    
    def test_higher_amount_increases_fraud_risk(self, model):
        """Higher transaction amounts should increase fraud probability."""
        low_amount = pd.DataFrame([{"amount": 10, "hour": 12}])
        high_amount = pd.DataFrame([{"amount": 10000, "hour": 12}])
        
        low_pred = model.predict_proba(low_amount)[0, 1]
        high_pred = model.predict_proba(high_amount)[0, 1]
        
        assert high_pred > low_pred
    
    def test_unusual_hour_increases_fraud_risk(self, model):
        """Transactions at unusual hours should have higher fraud probability."""
        normal_hour = pd.DataFrame([{"amount": 100, "hour": 14}])
        unusual_hour = pd.DataFrame([{"amount": 100, "hour": 3}])
        
        normal_pred = model.predict_proba(normal_hour)[0, 1]
        unusual_pred = model.predict_proba(unusual_hour)[0, 1]
        
        assert unusual_pred > normal_pred
    
    def test_monotonic_relationship(self, model):
        """Test monotonic relationship between feature and prediction."""
        amounts = [10, 50, 100, 500, 1000, 5000]
        
        predictions = []
        for amount in amounts:
            features = pd.DataFrame([{"amount": amount, "hour": 12}])
            pred = model.predict_proba(features)[0, 1]
            predictions.append(pred)
        
        # Should be monotonically increasing
        for i in range(1, len(predictions)):
            assert predictions[i] >= predictions[i-1]
```

### Boundary Tests

```python
class TestBoundaryBehavior:
    """Test model behavior at boundaries."""
    
    @pytest.fixture
    def model(self):
        return mlflow.pyfunc.load_model("models:/classifier/Production")
    
    def test_predictions_in_valid_range(self, model):
        """All predictions should be valid probabilities."""
        test_data = pd.DataFrame([
            {"feature_1": 0.0, "feature_2": 0.0},  # Minimum
            {"feature_1": 1.0, "feature_2": 1.0},  # Maximum
            {"feature_1": 0.5, "feature_2": 0.5},  # Middle
            {"feature_1": 0.001, "feature_2": 0.999},  # Near boundaries
        ])
        
        predictions = model.predict_proba(test_data)
        
        assert np.all(predictions >= 0)
        assert np.all(predictions <= 1)
        assert np.allclose(predictions.sum(axis=1), 1.0)
    
    def test_extreme_values(self, model):
        """Model should handle extreme but valid inputs."""
        extreme_data = pd.DataFrame([
            {"feature_1": 1e-10, "feature_2": 1e10},
            {"feature_1": -1e10, "feature_2": 1e-10},
        ])
        
        # Should not raise
        predictions = model.predict(extreme_data)
        
        assert len(predictions) == 2
        assert not np.any(np.isnan(predictions))
        assert not np.any(np.isinf(predictions))
```

### Fairness Tests

```python
class TestModelFairness:
    """Test model fairness across protected groups."""
    
    @pytest.fixture
    def model(self):
        return mlflow.pyfunc.load_model("models:/loan-approval/Production")
    
    @pytest.fixture
    def test_data(self):
        return pd.read_parquet("test_data/fairness_test_set.parquet")
    
    def test_statistical_parity(self, model, test_data):
        """Positive prediction rates should be similar across groups."""
        predictions = model.predict(test_data)
        
        for protected_attr in ["gender", "race", "age_group"]:
            rates = {}
            
            for group in test_data[protected_attr].unique():
                mask = test_data[protected_attr] == group
                rates[group] = predictions[mask].mean()
            
            max_rate = max(rates.values())
            min_rate = min(rates.values())
            
            # Disparate impact ratio should be >= 0.8
            assert min_rate / max_rate >= 0.8, f"Unfair for {protected_attr}: {rates}"
    
    def test_equal_opportunity(self, model, test_data):
        """True positive rates should be similar across groups."""
        predictions = model.predict(test_data)
        labels = test_data["label"]
        
        for protected_attr in ["gender", "race"]:
            tpr = {}
            
            for group in test_data[protected_attr].unique():
                mask = (test_data[protected_attr] == group) & (labels == 1)
                if mask.sum() == 0:
                    continue
                
                tpr[group] = predictions[mask].mean()
            
            max_tpr = max(tpr.values())
            min_tpr = min(tpr.values())
            
            # Difference should be < 0.1
            assert max_tpr - min_tpr < 0.1, f"Unequal opportunity for {protected_attr}: {tpr}"
```

## Integration Tests

### Inference Pipeline Tests

```python
class TestInferencePipeline:
    """Test end-to-end inference pipeline."""
    
    @pytest.fixture
    def inference_client(self):
        """Create client for inference service."""
        return InferenceClient("http://localhost:8080")
    
    def test_health_check(self, inference_client):
        """Service should be healthy."""
        response = inference_client.health()
        
        assert response["status"] == "healthy"
        assert response["model_loaded"] == True
    
    def test_single_prediction(self, inference_client):
        """Single prediction should succeed."""
        request = {
            "features": {
                "amount": 100.0,
                "hour": 14,
                "merchant_category": "retail",
            }
        }
        
        response = inference_client.predict(request)
        
        assert "prediction" in response
        assert response["prediction"] in [0, 1]
        assert "probability" in response
        assert 0 <= response["probability"] <= 1
        assert "latency_ms" in response
    
    def test_batch_prediction(self, inference_client):
        """Batch prediction should succeed."""
        requests = [
            {"amount": 100.0, "hour": 14},
            {"amount": 500.0, "hour": 3},
            {"amount": 50.0, "hour": 10},
        ]
        
        response = inference_client.predict_batch(requests)
        
        assert len(response["predictions"]) == 3
    
    def test_invalid_request_rejected(self, inference_client):
        """Invalid request should return error."""
        request = {
            "features": {
                "amount": "not_a_number",  # Invalid type
            }
        }
        
        with pytest.raises(ValidationError):
            inference_client.predict(request)
    
    def test_latency_within_sla(self, inference_client):
        """Latency should be within SLA."""
        request = {"features": {"amount": 100.0, "hour": 14}}
        
        latencies = []
        for _ in range(100):
            response = inference_client.predict(request)
            latencies.append(response["latency_ms"])
        
        p99_latency = np.percentile(latencies, 99)
        
        assert p99_latency < 100, f"P99 latency {p99_latency}ms exceeds SLA"
```

### Training Pipeline Tests

```python
class TestTrainingPipeline:
    """Test training pipeline components."""
    
    def test_data_loading(self):
        """Data loading should produce valid dataset."""
        dataset = load_training_data("test_data/sample.parquet")
        
        assert len(dataset) > 0
        assert "features" in dataset.column_names
        assert "label" in dataset.column_names
    
    def test_training_reduces_loss(self):
        """Training should reduce loss."""
        model = create_model(test_config)
        train_data = load_test_training_data()
        
        initial_loss = evaluate_loss(model, train_data)
        
        train_for_epochs(model, train_data, epochs=5)
        
        final_loss = evaluate_loss(model, train_data)
        
        assert final_loss < initial_loss
    
    def test_model_can_be_saved_and_loaded(self, tmp_path):
        """Model should be serializable."""
        model = create_model(test_config)
        train_for_epochs(model, load_test_training_data(), epochs=1)
        
        # Save
        model_path = tmp_path / "model"
        mlflow.pytorch.save_model(model, str(model_path))
        
        # Load
        loaded_model = mlflow.pytorch.load_model(str(model_path))
        
        # Predictions should match
        test_input = torch.randn(1, INPUT_DIM)
        
        model.eval()
        loaded_model.eval()
        
        with torch.no_grad():
            original_pred = model(test_input)
            loaded_pred = loaded_model(test_input)
        
        torch.testing.assert_close(original_pred, loaded_pred)
```

## Performance Tests

### Load Testing

```python
import locust
from locust import HttpUser, task, between

class InferenceLoadTest(HttpUser):
    """Load test for inference service."""
    
    wait_time = between(0.1, 0.5)
    
    @task(10)
    def single_prediction(self):
        """Test single prediction endpoint."""
        self.client.post(
            "/predict",
            json={
                "features": {
                    "amount": 100.0,
                    "hour": 14,
                }
            },
        )
    
    @task(1)
    def batch_prediction(self):
        """Test batch prediction endpoint."""
        self.client.post(
            "/predict/batch",
            json={
                "instances": [
                    {"amount": 100.0, "hour": 14},
                    {"amount": 200.0, "hour": 15},
                    {"amount": 300.0, "hour": 16},
                ]
            },
        )

# Run: locust -f test_load.py --host=http://localhost:8080
```

### Benchmark Tests

```python
import pytest
import time

class TestPerformanceBenchmarks:
    """Performance benchmark tests."""
    
    @pytest.fixture
    def model(self):
        return mlflow.pyfunc.load_model("models:/fraud-detector/Production")
    
    @pytest.mark.benchmark
    def test_single_inference_latency(self, model, benchmark):
        """Benchmark single inference latency."""
        features = pd.DataFrame([{"amount": 100.0, "hour": 14}])
        
        result = benchmark(model.predict, features)
        
        # Assert latency is acceptable
        assert benchmark.stats["mean"] < 0.01  # 10ms
    
    @pytest.mark.benchmark
    def test_batch_inference_throughput(self, model, benchmark):
        """Benchmark batch inference throughput."""
        batch_size = 1000
        features = pd.DataFrame([
            {"amount": i * 10, "hour": i % 24}
            for i in range(batch_size)
        ])
        
        result = benchmark(model.predict, features)
        
        # Calculate throughput
        throughput = batch_size / benchmark.stats["mean"]
        
        assert throughput > 10000  # At least 10k predictions/second
```

## Test Configuration

### pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

markers =
    unit: Unit tests (fast, isolated)
    integration: Integration tests (slower, require services)
    model: Model behavior tests
    fairness: Fairness tests
    benchmark: Performance benchmarks

addopts = -v --tb=short

filterwarnings =
    ignore::DeprecationWarning
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test types
pytest -m unit
pytest -m "model and not benchmark"
pytest -m fairness

# Run with coverage
pytest --cov=src --cov-report=html

# Run benchmarks
pytest -m benchmark --benchmark-autosave
```

## Best Practices

### Test Checklist

- [ ] Unit tests for all data transforms
- [ ] Unit tests for all metric calculations
- [ ] Model invariance tests
- [ ] Directional expectation tests
- [ ] Boundary behavior tests
- [ ] Fairness tests for protected groups
- [ ] Integration tests for inference pipeline
- [ ] Load tests for production capacity
- [ ] Regression tests comparing to baseline

### Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Testing on training data | Overly optimistic results | Use held-out test set |
| Ignoring random seeds | Non-reproducible tests | Set seeds explicitly |
| Testing exact values | Brittle tests | Test properties and ranges |
| Missing edge cases | Failures in production | Test boundaries systematically |
| No fairness tests | Discrimination in production | Test across protected groups |
