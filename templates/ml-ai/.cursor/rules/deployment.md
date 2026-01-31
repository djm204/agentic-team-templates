# Model Deployment

Guidelines for deploying machine learning models to production, including serving patterns, scaling strategies, and infrastructure configuration.

## Deployment Patterns

### Real-Time Inference

For low-latency, synchronous predictions:

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
          nvidia.com/gpu: "1"
        requests:
          cpu: "1"
          memory: 2Gi
    minReplicas: 2
    maxReplicas: 10
    scaleTarget: 100
    scaleMetric: concurrency
```

### Batch Inference

For high-throughput, asynchronous predictions:

```python
from prefect import flow, task
from prefect.tasks import task_input_hash

@task(
    cache_key_fn=task_input_hash,
    cache_expiration=timedelta(hours=1),
    retries=3,
    retry_delay_seconds=60,
)
def run_batch_inference(
    data_path: str,
    model_uri: str,
    output_path: str,
    batch_size: int = 10000,
) -> str:
    """Run batch inference on a dataset."""
    
    model = mlflow.pyfunc.load_model(model_uri)
    
    # Process in chunks to manage memory
    chunks = pd.read_parquet(data_path, chunksize=batch_size)
    
    results = []
    for chunk in chunks:
        predictions = model.predict(chunk)
        chunk["prediction"] = predictions
        chunk["model_version"] = model_uri.split("/")[-1]
        chunk["inference_timestamp"] = datetime.utcnow()
        results.append(chunk)
    
    # Write results
    output_df = pd.concat(results)
    output_df.to_parquet(output_path, index=False)
    
    return output_path

@flow(name="daily-batch-inference")
def batch_inference_pipeline(date: str):
    """Daily batch inference pipeline."""
    data_path = f"s3://data/features/{date}/"
    model_uri = "models:/fraud-detector/Production"
    output_path = f"s3://predictions/{date}/predictions.parquet"
    
    run_batch_inference(data_path, model_uri, output_path)
```

### Streaming Inference

For real-time event processing:

```python
from kafka import KafkaConsumer, KafkaProducer
import json

class StreamingPredictor:
    """Process predictions from a Kafka stream."""
    
    def __init__(self, model_uri: str, input_topic: str, output_topic: str):
        self.model = mlflow.pyfunc.load_model(model_uri)
        self.consumer = KafkaConsumer(
            input_topic,
            bootstrap_servers=["kafka:9092"],
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            group_id="inference-group",
            auto_offset_reset="latest",
        )
        self.producer = KafkaProducer(
            bootstrap_servers=["kafka:9092"],
            value_serializer=lambda m: json.dumps(m).encode("utf-8"),
        )
        self.output_topic = output_topic
    
    def run(self):
        """Process messages continuously."""
        for message in self.consumer:
            try:
                features = message.value
                prediction = self.model.predict(pd.DataFrame([features]))[0]
                
                result = {
                    "input": features,
                    "prediction": float(prediction),
                    "timestamp": datetime.utcnow().isoformat(),
                    "model_version": self.model_version,
                }
                
                self.producer.send(self.output_topic, result)
                
            except Exception as e:
                logger.error(f"Prediction failed: {e}", extra={"input": features})
```

## Custom Predictors

### KServe Custom Predictor

```python
from kserve import Model, ModelServer
from kserve.errors import ModelMissingError
import torch

class CustomPredictor(Model):
    """Custom KServe predictor with preprocessing."""
    
    def __init__(self, name: str):
        super().__init__(name)
        self.model = None
        self.transformer = None
        self.ready = False
    
    def load(self) -> bool:
        """Load model and artifacts."""
        model_path = os.environ.get("MODEL_PATH", "/mnt/models")
        
        # Load model
        self.model = torch.jit.load(f"{model_path}/model.pt")
        self.model.eval()
        
        # Load preprocessing
        self.transformer = FeatureTransformer.load(f"{model_path}/transformer.pkl")
        
        # Load config
        with open(f"{model_path}/config.yaml") as f:
            self.config = yaml.safe_load(f)
        
        self.ready = True
        return self.ready
    
    def preprocess(self, inputs: dict, headers: dict = None) -> torch.Tensor:
        """Preprocess input data."""
        df = pd.DataFrame(inputs["instances"])
        
        # Validate
        validated = self.validate_input(df)
        
        # Transform
        features = self.transformer.transform(validated)
        
        return torch.tensor(features.values, dtype=torch.float32)
    
    def predict(self, inputs: torch.Tensor, headers: dict = None) -> dict:
        """Run inference."""
        if not self.ready:
            raise ModelMissingError(self.name)
        
        with torch.no_grad():
            logits = self.model(inputs)
            probabilities = torch.sigmoid(logits).numpy()
        
        return probabilities
    
    def postprocess(self, outputs: np.ndarray, headers: dict = None) -> dict:
        """Postprocess predictions."""
        return {
            "predictions": outputs.tolist(),
            "model_version": os.environ.get("MODEL_VERSION", "unknown"),
            "threshold": self.config.get("threshold", 0.5),
        }
    
    def validate_input(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate input against schema."""
        required_cols = self.config["required_features"]
        missing = set(required_cols) - set(df.columns)
        if missing:
            raise ValueError(f"Missing required features: {missing}")
        
        return df[required_cols]

if __name__ == "__main__":
    model = CustomPredictor("fraud-detector")
    ModelServer().start([model])
```

### FastAPI Serving

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn

app = FastAPI(title="ML Model API", version="1.0.0")

class PredictionRequest(BaseModel):
    features: dict[str, float]
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class PredictionResponse(BaseModel):
    prediction: float
    probability: float
    model_version: str
    request_id: str
    latency_ms: float

# Load model at startup
@app.on_event("startup")
async def load_model():
    global model, transformer
    model = mlflow.pyfunc.load_model("models:/fraud-detector/Production")
    transformer = FeatureTransformer.load("transformer.pkl")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    start_time = time.time()
    
    try:
        # Transform
        df = pd.DataFrame([request.features])
        features = transformer.transform(df)
        
        # Predict
        probability = model.predict(features)[0]
        prediction = int(probability >= THRESHOLD)
        
        latency_ms = (time.time() - start_time) * 1000
        
        return PredictionResponse(
            prediction=prediction,
            probability=float(probability),
            model_version=MODEL_VERSION,
            request_id=request.request_id,
            latency_ms=latency_ms,
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

## Containerization

### Dockerfile

```dockerfile
# Multi-stage build for smaller image
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

# Production image
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy application code
COPY src/ ./src/
COPY configs/ ./configs/

# Non-root user for security
RUN useradd -m -u 1000 appuser
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["python", "-m", "src.serve"]
```

### GPU Support

```dockerfile
FROM nvidia/cuda:12.1-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y python3.11 python3-pip

# Install PyTorch with CUDA
RUN pip install torch==2.1.0+cu121 -f https://download.pytorch.org/whl/torch_stable.html

# ... rest of Dockerfile
```

## Scaling Strategies

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: model-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-server
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: requests_per_second
        target:
          type: AverageValue
          averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

### GPU Scheduling

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-inference
spec:
  containers:
    - name: model-server
      image: model-server:latest
      resources:
        limits:
          nvidia.com/gpu: 1
          memory: "16Gi"
        requests:
          nvidia.com/gpu: 1
          memory: "8Gi"
  nodeSelector:
    accelerator: nvidia-tesla-t4
  tolerations:
    - key: nvidia.com/gpu
      operator: Exists
      effect: NoSchedule
```

## Model Loading Patterns

### Lazy Loading

```python
class LazyModel:
    """Load model on first request."""
    
    def __init__(self, model_uri: str):
        self.model_uri = model_uri
        self._model = None
    
    @property
    def model(self):
        if self._model is None:
            self._model = mlflow.pyfunc.load_model(self.model_uri)
        return self._model
    
    def predict(self, features):
        return self.model.predict(features)
```

### Model Caching

```python
from functools import lru_cache

@lru_cache(maxsize=3)
def load_model(model_uri: str):
    """Cache loaded models."""
    return mlflow.pyfunc.load_model(model_uri)

class ModelManager:
    """Manage multiple model versions."""
    
    def __init__(self):
        self.models: dict[str, Any] = {}
        self.default_version = "production"
    
    def load_version(self, version: str) -> None:
        """Load a specific model version."""
        model_uri = f"models:/fraud-detector/{version}"
        self.models[version] = mlflow.pyfunc.load_model(model_uri)
    
    def predict(self, features, version: str = None) -> np.ndarray:
        """Predict using specified or default version."""
        version = version or self.default_version
        
        if version not in self.models:
            self.load_version(version)
        
        return self.models[version].predict(features)
```

## A/B Testing

### Traffic Splitting

```yaml
# Istio VirtualService for traffic splitting
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: model-routing
spec:
  hosts:
    - model-service
  http:
    - match:
        - headers:
            x-model-version:
              exact: "v2"
      route:
        - destination:
            host: model-service-v2
    - route:
        - destination:
            host: model-service-v1
          weight: 90
        - destination:
            host: model-service-v2
          weight: 10
```

### Shadow Deployment

```python
class ShadowPredictor:
    """Run predictions against shadow model for comparison."""
    
    def __init__(self, primary_model, shadow_model):
        self.primary = primary_model
        self.shadow = shadow_model
    
    async def predict(self, features):
        # Run primary prediction (blocking)
        primary_result = self.primary.predict(features)
        
        # Run shadow prediction (non-blocking)
        asyncio.create_task(self._shadow_predict(features, primary_result))
        
        return primary_result
    
    async def _shadow_predict(self, features, primary_result):
        """Compare shadow predictions asynchronously."""
        try:
            shadow_result = self.shadow.predict(features)
            
            # Log comparison
            logger.info(
                "shadow_comparison",
                primary=primary_result,
                shadow=shadow_result,
                match=np.allclose(primary_result, shadow_result, rtol=0.01),
            )
        except Exception as e:
            logger.error(f"Shadow prediction failed: {e}")
```

## Rollback Procedures

```python
class ModelDeployer:
    """Manage model deployments with rollback capability."""
    
    def __init__(self, client: MlflowClient):
        self.client = client
    
    def deploy(self, model_name: str, version: str) -> None:
        """Deploy a model version to production."""
        # Record current production version for rollback
        current_prod = self.client.get_latest_versions(model_name, stages=["Production"])
        if current_prod:
            self._record_rollback_version(model_name, current_prod[0].version)
        
        # Transition to production
        self.client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage="Production",
        )
    
    def rollback(self, model_name: str) -> str:
        """Rollback to previous production version."""
        previous_version = self._get_rollback_version(model_name)
        
        if not previous_version:
            raise ValueError("No rollback version available")
        
        # Archive current
        current_prod = self.client.get_latest_versions(model_name, stages=["Production"])
        for v in current_prod:
            self.client.transition_model_version_stage(
                name=model_name,
                version=v.version,
                stage="Archived",
            )
        
        # Restore previous
        self.client.transition_model_version_stage(
            name=model_name,
            version=previous_version,
            stage="Production",
        )
        
        return previous_version
```

## Best Practices

### Pre-Deployment Checklist

- [ ] Model validated on holdout test set
- [ ] Inference latency meets SLA
- [ ] Memory footprint acceptable
- [ ] Load testing completed
- [ ] Rollback procedure documented
- [ ] Monitoring configured
- [ ] Feature transformer included

### Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Predictions flowing to monitoring
- [ ] Alerts configured
- [ ] A/B test metrics tracking
- [ ] Shadow comparison (if applicable)
- [ ] Documentation updated
