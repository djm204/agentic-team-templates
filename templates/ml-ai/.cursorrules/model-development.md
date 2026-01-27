# Model Development

Guidelines for training, experimentation, evaluation, and hyperparameter optimization in machine learning projects.

## Experiment Tracking

### MLflow Integration

```python
import mlflow
from mlflow.tracking import MlflowClient

def train_with_tracking(config: TrainingConfig, train_data, val_data) -> str:
    """Train model with comprehensive experiment tracking."""
    
    mlflow.set_experiment(config.experiment_name)
    
    with mlflow.start_run(run_name=config.run_name) as run:
        # Log configuration
        mlflow.log_params({
            "model_type": config.model_type,
            "learning_rate": config.learning_rate,
            "batch_size": config.batch_size,
            "epochs": config.epochs,
            "optimizer": config.optimizer,
            "loss_function": config.loss_function,
        })
        
        # Log data information
        mlflow.log_params({
            "train_samples": len(train_data),
            "val_samples": len(val_data),
            "feature_count": train_data.shape[1],
            "label_distribution": dict(train_data["label"].value_counts()),
        })
        
        # Log environment
        mlflow.log_params({
            "python_version": sys.version,
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
        })
        
        # Train with metric logging
        model = create_model(config)
        for epoch in range(config.epochs):
            train_loss = train_epoch(model, train_data)
            val_metrics = evaluate(model, val_data)
            
            mlflow.log_metrics({
                "train_loss": train_loss,
                "val_loss": val_metrics["loss"],
                "val_accuracy": val_metrics["accuracy"],
                "val_f1": val_metrics["f1"],
            }, step=epoch)
        
        # Log final model with signature
        signature = mlflow.models.infer_signature(
            train_data.drop("label", axis=1).head(),
            model.predict(train_data.drop("label", axis=1).head())
        )
        mlflow.pytorch.log_model(model, "model", signature=signature)
        
        # Log artifacts
        mlflow.log_artifact("configs/training_config.yaml")
        
        # Log custom artifacts
        fig = plot_confusion_matrix(model, val_data)
        mlflow.log_figure(fig, "confusion_matrix.png")
        
        return run.info.run_id
```

### Experiment Organization

```python
# Hierarchical experiment structure
mlflow.set_experiment("fraud-detection/v2/feature-experiments")

# Tagging for filtering
with mlflow.start_run() as run:
    mlflow.set_tags({
        "team": "ml-platform",
        "model_family": "gradient_boosting",
        "data_version": "2024-01-15",
        "experiment_type": "hyperparameter_search",
    })

# Query experiments
client = MlflowClient()
runs = client.search_runs(
    experiment_ids=["1"],
    filter_string="metrics.val_f1 > 0.85 AND params.model_type = 'xgboost'",
    order_by=["metrics.val_f1 DESC"],
    max_results=10,
)
```

## Evaluation Metrics

### Classification Metrics

```python
from dataclasses import dataclass
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    roc_auc_score, average_precision_score,
    confusion_matrix, classification_report
)

@dataclass
class ClassificationMetrics:
    """Comprehensive classification evaluation."""
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float
    confusion_matrix: np.ndarray
    
    @classmethod
    def compute(
        cls,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prob: np.ndarray
    ) -> "ClassificationMetrics":
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
            confusion_matrix=confusion_matrix(y_true, y_pred),
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
    
    def summary(self) -> str:
        return f"""
        Accuracy:  {self.accuracy:.4f}
        Precision: {self.precision:.4f}
        Recall:    {self.recall:.4f}
        F1 Score:  {self.f1:.4f}
        ROC AUC:   {self.roc_auc:.4f}
        PR AUC:    {self.pr_auc:.4f}
        """
```

### Regression Metrics

```python
@dataclass
class RegressionMetrics:
    """Comprehensive regression evaluation."""
    mse: float
    rmse: float
    mae: float
    mape: float
    r2: float
    explained_variance: float
    
    @classmethod
    def compute(cls, y_true: np.ndarray, y_pred: np.ndarray) -> "RegressionMetrics":
        mse = mean_squared_error(y_true, y_pred)
        return cls(
            mse=mse,
            rmse=np.sqrt(mse),
            mae=mean_absolute_error(y_true, y_pred),
            mape=mean_absolute_percentage_error(y_true, y_pred),
            r2=r2_score(y_true, y_pred),
            explained_variance=explained_variance_score(y_true, y_pred),
        )
```

### Business Metrics

```python
def compute_business_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    amounts: np.ndarray,
    cost_matrix: dict
) -> dict:
    """Compute business-relevant metrics."""
    
    # Cost-sensitive evaluation
    tp_mask = (y_true == 1) & (y_pred == 1)
    fp_mask = (y_true == 0) & (y_pred == 1)
    fn_mask = (y_true == 1) & (y_pred == 0)
    tn_mask = (y_true == 0) & (y_pred == 0)
    
    # Fraud detection example
    fraud_caught = amounts[tp_mask].sum()
    fraud_missed = amounts[fn_mask].sum()
    false_alarm_cost = len(amounts[fp_mask]) * cost_matrix["investigation_cost"]
    
    return {
        "fraud_caught_amount": fraud_caught,
        "fraud_missed_amount": fraud_missed,
        "false_alarm_cost": false_alarm_cost,
        "net_savings": fraud_caught - false_alarm_cost,
        "precision_at_k": precision_at_k(y_true, y_pred, k=100),
        "lift_at_k": lift_at_k(y_true, y_pred, k=100),
    }
```

### Threshold Optimization

```python
def optimize_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    metric: str = "f1",
    constraints: dict = None
) -> float:
    """Find optimal classification threshold."""
    
    thresholds = np.linspace(0.01, 0.99, 99)
    best_threshold = 0.5
    best_score = 0
    
    for threshold in thresholds:
        y_pred = (y_prob >= threshold).astype(int)
        
        # Check constraints
        if constraints:
            precision = precision_score(y_true, y_pred)
            recall = recall_score(y_true, y_pred)
            
            if "min_precision" in constraints and precision < constraints["min_precision"]:
                continue
            if "min_recall" in constraints and recall < constraints["min_recall"]:
                continue
        
        # Compute target metric
        if metric == "f1":
            score = f1_score(y_true, y_pred)
        elif metric == "precision":
            score = precision_score(y_true, y_pred)
        elif metric == "recall":
            score = recall_score(y_true, y_pred)
        
        if score > best_score:
            best_score = score
            best_threshold = threshold
    
    return best_threshold
```

## Hyperparameter Optimization

### Optuna Integration

```python
import optuna
from optuna.integration import MLflowCallback

def optimize_hyperparameters(
    train_data: pd.DataFrame,
    val_data: pd.DataFrame,
    n_trials: int = 100,
    timeout: int = 3600,
) -> dict:
    """Optimize hyperparameters with Optuna."""
    
    def objective(trial: optuna.Trial) -> float:
        # Define search space
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 1000, step=100),
            "max_depth": trial.suggest_int("max_depth", 3, 12),
            "learning_rate": trial.suggest_float("learning_rate", 1e-4, 1e-1, log=True),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            "reg_alpha": trial.suggest_float("reg_alpha", 1e-8, 1.0, log=True),
            "reg_lambda": trial.suggest_float("reg_lambda", 1e-8, 1.0, log=True),
        }
        
        # Train with early stopping
        model = XGBClassifier(**params, early_stopping_rounds=50, n_jobs=-1)
        model.fit(
            train_data.drop("label", axis=1),
            train_data["label"],
            eval_set=[(val_data.drop("label", axis=1), val_data["label"])],
            verbose=False,
        )
        
        # Evaluate
        y_prob = model.predict_proba(val_data.drop("label", axis=1))[:, 1]
        return roc_auc_score(val_data["label"], y_prob)
    
    # Create study with pruning
    study = optuna.create_study(
        direction="maximize",
        pruner=optuna.pruners.MedianPruner(n_warmup_steps=10),
        sampler=optuna.samplers.TPESampler(seed=42),
    )
    
    # Optimize with MLflow logging
    study.optimize(
        objective,
        n_trials=n_trials,
        timeout=timeout,
        callbacks=[MLflowCallback(metric_name="val_roc_auc")],
        show_progress_bar=True,
    )
    
    return study.best_params
```

### Neural Network Hyperparameters

```python
def objective_nn(trial: optuna.Trial) -> float:
    """Optimize neural network architecture and training."""
    
    # Architecture search
    n_layers = trial.suggest_int("n_layers", 2, 5)
    layers = []
    in_features = INPUT_DIM
    
    for i in range(n_layers):
        out_features = trial.suggest_int(f"n_units_l{i}", 32, 512, log=True)
        layers.append(nn.Linear(in_features, out_features))
        layers.append(nn.ReLU())
        
        dropout = trial.suggest_float(f"dropout_l{i}", 0.1, 0.5)
        layers.append(nn.Dropout(dropout))
        
        in_features = out_features
    
    layers.append(nn.Linear(in_features, NUM_CLASSES))
    model = nn.Sequential(*layers)
    
    # Optimizer selection
    optimizer_name = trial.suggest_categorical("optimizer", ["Adam", "AdamW", "SGD"])
    lr = trial.suggest_float("lr", 1e-5, 1e-2, log=True)
    weight_decay = trial.suggest_float("weight_decay", 1e-6, 1e-3, log=True)
    
    if optimizer_name == "Adam":
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
    elif optimizer_name == "AdamW":
        optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    else:
        momentum = trial.suggest_float("momentum", 0.8, 0.99)
        optimizer = torch.optim.SGD(model.parameters(), lr=lr, momentum=momentum)
    
    # Training
    batch_size = trial.suggest_categorical("batch_size", [32, 64, 128, 256])
    
    for epoch in range(MAX_EPOCHS):
        train_loss = train_epoch(model, optimizer, train_loader, batch_size)
        val_acc = evaluate(model, val_loader)
        
        # Pruning
        trial.report(val_acc, epoch)
        if trial.should_prune():
            raise optuna.TrialPruned()
    
    return val_acc
```

## Model Selection

### Cross-Validation

```python
from sklearn.model_selection import StratifiedKFold, cross_val_score

def evaluate_with_cv(
    model,
    X: pd.DataFrame,
    y: pd.Series,
    n_splits: int = 5,
    scoring: str = "roc_auc"
) -> dict:
    """Evaluate model with stratified cross-validation."""
    
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    scores = cross_val_score(model, X, y, cv=cv, scoring=scoring, n_jobs=-1)
    
    return {
        "mean": scores.mean(),
        "std": scores.std(),
        "min": scores.min(),
        "max": scores.max(),
        "scores": scores.tolist(),
    }
```

### Model Comparison

```python
def compare_models(
    models: dict[str, Any],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> pd.DataFrame:
    """Compare multiple models on the same data."""
    
    results = []
    
    for name, model in models.items():
        start_time = time.time()
        
        # Train
        model.fit(X_train, y_train)
        train_time = time.time() - start_time
        
        # Predict
        start_time = time.time()
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
        inference_time = time.time() - start_time
        
        # Evaluate
        metrics = ClassificationMetrics.compute(y_test, y_pred, y_prob)
        
        results.append({
            "model": name,
            "accuracy": metrics.accuracy,
            "precision": metrics.precision,
            "recall": metrics.recall,
            "f1": metrics.f1,
            "roc_auc": metrics.roc_auc if y_prob is not None else None,
            "train_time_s": train_time,
            "inference_time_s": inference_time,
        })
    
    return pd.DataFrame(results).sort_values("f1", ascending=False)
```

## Model Registry

### MLflow Model Registry

```python
from mlflow.tracking import MlflowClient

def register_model(run_id: str, model_name: str, stage: str = "Staging") -> str:
    """Register model in MLflow Model Registry."""
    
    client = MlflowClient()
    
    # Register model version
    model_uri = f"runs:/{run_id}/model"
    result = mlflow.register_model(model_uri, model_name)
    
    # Add metadata
    client.update_model_version(
        name=model_name,
        version=result.version,
        description=f"Model trained on {datetime.now().isoformat()}",
    )
    
    # Set tags
    client.set_model_version_tag(
        name=model_name,
        version=result.version,
        key="validation_status",
        value="pending",
    )
    
    # Transition to stage
    client.transition_model_version_stage(
        name=model_name,
        version=result.version,
        stage=stage,
    )
    
    return result.version

def promote_model(model_name: str, version: str) -> None:
    """Promote model from Staging to Production."""
    
    client = MlflowClient()
    
    # Archive current production model
    prod_versions = client.get_latest_versions(model_name, stages=["Production"])
    for v in prod_versions:
        client.transition_model_version_stage(
            name=model_name,
            version=v.version,
            stage="Archived",
        )
    
    # Promote new version
    client.transition_model_version_stage(
        name=model_name,
        version=version,
        stage="Production",
    )
```

## Best Practices

### Reproducibility Checklist

- [ ] Set random seeds for all sources of randomness
- [ ] Pin all dependency versions
- [ ] Log all hyperparameters and configurations
- [ ] Version training data
- [ ] Use deterministic algorithms where possible
- [ ] Log environment information (GPU, CUDA version)

### Evaluation Checklist

- [ ] Evaluate on held-out test set (not used for validation)
- [ ] Report multiple metrics, not just accuracy
- [ ] Include confidence intervals or standard deviations
- [ ] Evaluate across relevant segments/slices
- [ ] Compare against meaningful baselines
- [ ] Check for overfitting (train vs val vs test gaps)

### Model Selection Checklist

- [ ] Consider inference latency requirements
- [ ] Evaluate model size and memory footprint
- [ ] Test with realistic input distributions
- [ ] Validate on out-of-distribution samples
- [ ] Document model limitations
