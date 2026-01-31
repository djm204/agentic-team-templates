# Data Quality

Patterns for validating, monitoring, and ensuring data quality.

## Quality Dimensions

| Dimension | Definition | Example Check |
|-----------|------------|---------------|
| **Completeness** | Required data is present | No null values in required fields |
| **Accuracy** | Data reflects reality | Prices within expected range |
| **Consistency** | Data agrees across systems | Order totals match line items |
| **Timeliness** | Data is fresh enough | Table updated within SLA |
| **Uniqueness** | No unwanted duplicates | Primary keys are unique |
| **Validity** | Data conforms to rules | Email matches regex pattern |

## Validation Patterns

### Schema Validation

Enforce expected schema before processing.

```python
from pyspark.sql.types import StructType, StructField, StringType, DecimalType, DateType

expected_schema = StructType([
    StructField("order_id", StringType(), nullable=False),
    StructField("customer_id", StringType(), nullable=False),
    StructField("order_date", DateType(), nullable=False),
    StructField("total_amount", DecimalType(12, 2), nullable=False),
])

def validate_schema(df: DataFrame) -> DataFrame:
    """Validate DataFrame matches expected schema."""
    actual_fields = {f.name: f for f in df.schema.fields}
    
    for expected_field in expected_schema.fields:
        if expected_field.name not in actual_fields:
            raise SchemaError(f"Missing column: {expected_field.name}")
        
        actual = actual_fields[expected_field.name]
        if actual.dataType != expected_field.dataType:
            raise SchemaError(
                f"Type mismatch for {expected_field.name}: "
                f"expected {expected_field.dataType}, got {actual.dataType}"
            )
    
    return df
```

### Null Checks

```python
def check_required_columns(df: DataFrame, required: list[str]) -> DataFrame:
    """Ensure required columns have no nulls."""
    for column in required:
        null_count = df.filter(F.col(column).isNull()).count()
        if null_count > 0:
            raise DataQualityError(f"Found {null_count} nulls in required column: {column}")
    return df

# Usage
df = check_required_columns(df, ["order_id", "customer_id", "order_date"])
```

### Uniqueness Checks

```python
def check_uniqueness(df: DataFrame, key_columns: list[str]) -> DataFrame:
    """Ensure no duplicates on key columns."""
    duplicate_count = (
        df.groupBy(key_columns)
        .count()
        .filter("count > 1")
        .count()
    )
    
    if duplicate_count > 0:
        raise DataQualityError(f"Found {duplicate_count} duplicate keys on {key_columns}")
    
    return df
```

### Range Checks

```python
def check_ranges(df: DataFrame, ranges: dict[str, tuple]) -> DataFrame:
    """Validate numeric columns are within expected ranges."""
    for column, (min_val, max_val) in ranges.items():
        out_of_range = df.filter(
            (F.col(column) < min_val) | (F.col(column) > max_val)
        ).count()
        
        if out_of_range > 0:
            raise DataQualityError(
                f"Found {out_of_range} values out of range [{min_val}, {max_val}] in {column}"
            )
    
    return df

# Usage
df = check_ranges(df, {
    "quantity": (1, 10000),
    "unit_price": (0.01, 100000),
    "discount_pct": (0, 100),
})
```

### Referential Integrity

```python
def check_referential_integrity(
    df: DataFrame,
    foreign_key: str,
    reference_table: str,
    reference_key: str,
) -> DataFrame:
    """Ensure foreign keys exist in reference table."""
    reference_df = spark.table(reference_table).select(reference_key).distinct()
    
    orphans = (
        df.select(foreign_key)
        .distinct()
        .join(reference_df, df[foreign_key] == reference_df[reference_key], "left_anti")
    )
    
    orphan_count = orphans.count()
    if orphan_count > 0:
        raise DataQualityError(
            f"Found {orphan_count} orphan keys in {foreign_key} not in {reference_table}"
        )
    
    return df
```

## Great Expectations Integration

```python
from great_expectations.dataset import SparkDFDataset

def validate_orders(df: DataFrame) -> DataFrame:
    """Apply comprehensive data quality checks."""
    ge_df = SparkDFDataset(df)
    
    results = ge_df.validate(expectation_suite={
        "expectations": [
            # Completeness
            {"expectation_type": "expect_column_values_to_not_be_null", "kwargs": {"column": "order_id"}},
            {"expectation_type": "expect_column_values_to_not_be_null", "kwargs": {"column": "customer_id"}},
            
            # Uniqueness
            {"expectation_type": "expect_column_values_to_be_unique", "kwargs": {"column": "order_id"}},
            
            # Validity
            {"expectation_type": "expect_column_values_to_match_regex", 
             "kwargs": {"column": "email", "regex": r"^[\w.-]+@[\w.-]+\.\w+$"}},
            
            # Range
            {"expectation_type": "expect_column_values_to_be_between",
             "kwargs": {"column": "total_amount", "min_value": 0, "max_value": 1000000}},
            
            # Set membership
            {"expectation_type": "expect_column_values_to_be_in_set",
             "kwargs": {"column": "status", "value_set": ["pending", "confirmed", "shipped", "delivered"]}},
        ]
    })
    
    if not results.success:
        failed = [r for r in results.results if not r.success]
        raise DataQualityError(f"Validation failed: {failed}")
    
    return df
```

## DBT Tests

### Built-in Tests

```yaml
# models/schema.yml
version: 2

models:
  - name: orders
    columns:
      - name: order_id
        tests:
          - not_null
          - unique
      
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('customers')
              field: customer_id
      
      - name: status
        tests:
          - accepted_values:
              values: ['pending', 'confirmed', 'shipped', 'delivered']
      
      - name: total_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000000
```

### Custom Tests

```sql
-- tests/assert_order_totals_match_line_items.sql
-- Ensure order totals equal sum of line items

SELECT o.order_id
FROM {{ ref('orders') }} o
LEFT JOIN (
    SELECT order_id, SUM(quantity * unit_price) as calculated_total
    FROM {{ ref('order_items') }}
    GROUP BY order_id
) li ON o.order_id = li.order_id
WHERE ABS(o.total_amount - li.calculated_total) > 0.01
```

## Data Freshness Monitoring

### Freshness Checks

```python
@dataclass
class FreshnessConfig:
    table: str
    timestamp_column: str
    max_delay_hours: int
    severity: str  # "critical" | "warning"

FRESHNESS_CHECKS = [
    FreshnessConfig("curated.orders", "order_date", 2, "critical"),
    FreshnessConfig("curated.inventory", "updated_at", 1, "critical"),
    FreshnessConfig("marts.daily_sales", "report_date", 24, "warning"),
]

def check_freshness() -> list[Alert]:
    """Monitor data freshness and alert on SLA breaches."""
    alerts = []
    
    for config in FRESHNESS_CHECKS:
        result = spark.sql(f"""
            SELECT 
                MAX({config.timestamp_column}) as max_ts,
                TIMESTAMPDIFF(HOUR, MAX({config.timestamp_column}), CURRENT_TIMESTAMP) as delay_hours
            FROM {config.table}
        """).collect()[0]
        
        if result["delay_hours"] > config.max_delay_hours:
            alerts.append(Alert(
                severity=config.severity,
                table=config.table,
                message=f"Data is {result['delay_hours']}h stale (SLA: {config.max_delay_hours}h)",
            ))
    
    return alerts
```

### DBT Source Freshness

```yaml
# models/sources.yml
version: 2

sources:
  - name: raw
    database: raw_db
    tables:
      - name: orders
        freshness:
          warn_after: {count: 2, period: hour}
          error_after: {count: 6, period: hour}
        loaded_at_field: _loaded_at
```

## Anomaly Detection

### Volume Anomalies

```python
def detect_volume_anomaly(
    table: str,
    partition_column: str,
    lookback_days: int = 30,
    threshold_std: float = 3.0,
) -> Optional[Alert]:
    """Detect unusual record counts."""
    stats = spark.sql(f"""
        WITH daily_counts AS (
            SELECT {partition_column}, COUNT(*) as cnt
            FROM {table}
            WHERE {partition_column} >= CURRENT_DATE - INTERVAL {lookback_days} DAYS
            GROUP BY {partition_column}
        )
        SELECT
            AVG(cnt) as mean_count,
            STDDEV(cnt) as std_count,
            (SELECT cnt FROM daily_counts WHERE {partition_column} = CURRENT_DATE) as today_count
        FROM daily_counts
        WHERE {partition_column} < CURRENT_DATE
    """).collect()[0]
    
    z_score = abs(stats["today_count"] - stats["mean_count"]) / stats["std_count"]
    
    if z_score > threshold_std:
        return Alert(
            severity="warning",
            message=f"Volume anomaly: {stats['today_count']} records "
                    f"(expected {stats['mean_count']:.0f} ± {stats['std_count']:.0f})"
        )
    return None
```

### Distribution Drift

```python
def detect_distribution_drift(
    table: str,
    column: str,
    baseline_table: str,
    threshold: float = 0.1,
) -> Optional[Alert]:
    """Detect changes in value distribution using KL divergence."""
    current_dist = spark.sql(f"""
        SELECT {column}, COUNT(*) / SUM(COUNT(*)) OVER() as pct
        FROM {table}
        WHERE _loaded_at >= CURRENT_DATE
        GROUP BY {column}
    """).toPandas().set_index(column)["pct"]
    
    baseline_dist = spark.sql(f"""
        SELECT {column}, COUNT(*) / SUM(COUNT(*)) OVER() as pct
        FROM {baseline_table}
        GROUP BY {column}
    """).toPandas().set_index(column)["pct"]
    
    # Calculate KL divergence
    kl_divergence = sum(
        current_dist.get(k, 0.001) * np.log(current_dist.get(k, 0.001) / baseline_dist.get(k, 0.001))
        for k in baseline_dist.index
    )
    
    if kl_divergence > threshold:
        return Alert(
            severity="warning",
            message=f"Distribution drift detected in {column}: KL={kl_divergence:.3f}"
        )
    return None
```

## Data Quality Metrics

### Track Quality Over Time

```python
def record_quality_metrics(
    table: str,
    df: DataFrame,
    checks: dict[str, int],  # check_name -> failure_count
) -> None:
    """Record quality metrics for trending."""
    total_rows = df.count()
    
    metrics_df = spark.createDataFrame([{
        "table": table,
        "check_timestamp": datetime.utcnow(),
        "total_rows": total_rows,
        **{f"{name}_failures": count for name, count in checks.items()},
        **{f"{name}_pct": count / total_rows * 100 for name, count in checks.items()},
    }])
    
    metrics_df.write.mode("append").saveAsTable("metrics.data_quality")
```

### Quality Dashboard Query

```sql
-- Quality trends over time
SELECT
    table,
    DATE(check_timestamp) as check_date,
    AVG(null_failures_pct) as avg_null_pct,
    AVG(duplicate_failures_pct) as avg_dup_pct,
    AVG(range_failures_pct) as avg_range_pct
FROM metrics.data_quality
WHERE check_timestamp >= CURRENT_DATE - 30
GROUP BY table, DATE(check_timestamp)
ORDER BY check_date DESC;
```

## Best Practices

### Fail Fast on Critical Issues

```python
def validate_with_severity(df: DataFrame) -> DataFrame:
    """Apply checks with different severity levels."""
    
    # Critical: Pipeline must fail
    critical_checks = [
        ("order_id not null", df.filter("order_id IS NULL").count() == 0),
        ("no duplicates", df.groupBy("order_id").count().filter("count > 1").count() == 0),
    ]
    
    for name, passed in critical_checks:
        if not passed:
            raise DataQualityError(f"Critical check failed: {name}")
    
    # Warning: Log but continue
    warning_checks = [
        ("email valid", df.filter("email NOT RLIKE '^[\\w.-]+@[\\w.-]+\\.\\w+$'").count()),
        ("future dates", df.filter("order_date > CURRENT_DATE").count()),
    ]
    
    for name, failure_count in warning_checks:
        if failure_count > 0:
            logger.warning(f"Quality warning - {name}: {failure_count} failures")
            metrics.increment(f"quality.warnings.{name}", failure_count)
    
    return df
```

### Quarantine Bad Records

```python
def process_with_quarantine(df: DataFrame) -> DataFrame:
    """Separate good and bad records."""
    
    good_records = df.filter("""
        order_id IS NOT NULL
        AND customer_id IS NOT NULL
        AND total_amount >= 0
    """)
    
    bad_records = df.subtract(good_records)
    
    if bad_records.count() > 0:
        # Write to quarantine for investigation
        (bad_records
            .withColumn("_quarantine_reason", F.lit("validation_failed"))
            .withColumn("_quarantine_timestamp", F.current_timestamp())
            .write.mode("append")
            .saveAsTable("quarantine.orders"))
        
        logger.warning(f"Quarantined {bad_records.count()} records")
    
    return good_records
```
