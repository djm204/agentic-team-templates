# Pipeline Design

Patterns and practices for building reliable data pipelines.

## Core Principles

### 1. Idempotency

Every pipeline run must produce identical results for the same inputs.

```python
# Good: Delete-insert pattern ensures idempotency
def process_daily_orders(execution_date: date) -> None:
    partition = execution_date.strftime("%Y-%m-%d")
    
    # Clear target partition first
    spark.sql(f"DELETE FROM curated.orders WHERE order_date = '{partition}'")
    
    # Then insert
    orders_df.write.mode("append").saveAsTable("curated.orders")

# Bad: Append without clearing creates duplicates on re-run
orders_df.write.mode("append").saveAsTable("curated.orders")
```

### 2. Determinism

Same inputs must always produce same outputs. Avoid:
- `current_timestamp()` in transformations (use execution_date)
- Random sampling without seeds
- Order-dependent operations on unordered data

```python
# Good: Use execution_date for reproducibility
df.withColumn("processed_at", F.lit(execution_date))

# Bad: Non-deterministic timestamp
df.withColumn("processed_at", F.current_timestamp())
```

### 3. Atomicity

Pipeline outputs should be all-or-nothing. Partial writes corrupt data.

```python
# Good: Write to staging, then atomic swap
df.write.mode("overwrite").saveAsTable("staging.orders_temp")
spark.sql("ALTER TABLE curated.orders SWAP WITH staging.orders_temp")

# Good: Use Delta Lake transactions
df.write.format("delta").mode("overwrite").saveAsTable("curated.orders")
```

## Pipeline Patterns

### Batch Full Refresh

Use when: Source doesn't support incremental, data is small, or simplicity matters.

```python
def full_refresh_pipeline(source: str, target: str) -> None:
    df = spark.read.table(source)
    df = transform(df)
    df.write.mode("overwrite").saveAsTable(target)
```

### Batch Incremental

Use when: Data volume is large, source supports watermarks.

```python
def incremental_pipeline(source: str, target: str, watermark_col: str) -> None:
    # Get high watermark from previous run
    last_watermark = get_watermark(target, watermark_col)
    
    # Read only new/changed records
    df = spark.read.table(source).filter(F.col(watermark_col) > last_watermark)
    
    if df.isEmpty():
        return
    
    # Merge into target
    target_table = DeltaTable.forName(spark, target)
    (target_table.alias("t")
        .merge(df.alias("s"), "t.id = s.id")
        .whenMatchedUpdateAll()
        .whenNotMatchedInsertAll()
        .execute())
```

### Change Data Capture (CDC)

Use when: Need to track all changes, support point-in-time queries.

```python
def cdc_pipeline(cdc_events: DataFrame, target: str) -> None:
    """Process CDC events (insert, update, delete operations)."""
    
    target_table = DeltaTable.forName(spark, target)
    
    (target_table.alias("t")
        .merge(cdc_events.alias("s"), "t.id = s.id")
        .whenMatchedDelete(condition="s.operation = 'DELETE'")
        .whenMatchedUpdateAll(condition="s.operation = 'UPDATE'")
        .whenNotMatchedInsertAll(condition="s.operation = 'INSERT'")
        .execute())
```

### Streaming

Use when: Low latency required, source is event stream.

```python
def streaming_pipeline() -> None:
    events = (
        spark.readStream
        .format("kafka")
        .option("subscribe", "events")
        .load()
    )
    
    processed = events.transform(process_events)
    
    (processed
        .writeStream
        .format("delta")
        .option("checkpointLocation", CHECKPOINT_PATH)
        .outputMode("append")
        .trigger(processingTime="1 minute")
        .toTable("curated.events"))
```

## Handling Late Data

### Reprocessing Window

Reprocess recent partitions to catch late arrivals.

```python
def process_with_late_data_handling(execution_date: date) -> None:
    # Reprocess last 3 days to catch late arrivals
    start_date = execution_date - timedelta(days=3)
    
    for date in date_range(start_date, execution_date):
        process_partition(date)
```

### Watermarking (Streaming)

Define how long to wait for late data.

```python
events_with_watermark = (
    events
    .withWatermark("event_time", "1 hour")  # Wait up to 1 hour for late events
    .groupBy(F.window("event_time", "5 minutes"))
    .count()
)
```

## Orchestration Patterns

### DAG Design

```
[extract_orders] --> [validate_orders] --> [transform_orders] --> [load_orders]
                                                                      |
[extract_products] --> [validate_products] --> [transform_products] --+
                                                                      |
                                                                      v
                                                            [build_order_mart]
```

### Retry Strategy

```python
default_args = {
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(hours=1),
}
```

### Backfill Strategy

```python
# Support backfill via parameterized execution date
@task
def process_orders(execution_date: date = None):
    if execution_date is None:
        execution_date = date.today() - timedelta(days=1)
    
    # Use execution_date, not current date
    process_partition(execution_date)
```

## Error Handling

### Fail Fast

```python
def process_orders(df: DataFrame) -> DataFrame:
    # Validate critical assumptions early
    if df.filter("order_id IS NULL").count() > 0:
        raise DataQualityError("Found null order_ids")
    
    if df.count() == 0:
        raise EmptyDataError("No orders to process")
    
    return transform(df)
```

### Dead Letter Queue

```python
def process_with_dlq(df: DataFrame) -> DataFrame:
    # Separate valid and invalid records
    valid = df.filter(is_valid_record)
    invalid = df.filter(~is_valid_record)
    
    # Write invalid records to DLQ for investigation
    if invalid.count() > 0:
        invalid.write.mode("append").saveAsTable("dlq.orders")
        logger.warning(f"Sent {invalid.count()} records to DLQ")
    
    return valid
```

## Best Practices

### Explicit Dependencies

```python
# Good: Explicit data dependencies
orders = spark.read.table("raw.orders")
products = spark.read.table("raw.products")
result = orders.join(products, "product_id")

# Bad: Hidden dependencies via side effects
process_orders()  # Reads from orders table
process_products()  # Reads from products table
build_mart()  # What does this depend on?
```

### Parameterize Everything

```python
# Good: Parameterized and testable
def process_orders(
    source_table: str,
    target_table: str,
    execution_date: date,
) -> None:
    ...

# Bad: Hardcoded values
def process_orders():
    df = spark.read.table("prod.orders")  # Hardcoded!
    df.write.saveAsTable("prod.curated_orders")
```

### Logging and Metrics

```python
def process_orders(execution_date: date) -> None:
    logger.info(f"Starting order processing for {execution_date}")
    
    df = spark.read.table("raw.orders").filter(f"order_date = '{execution_date}'")
    logger.info(f"Read {df.count()} orders")
    
    result = transform(df)
    logger.info(f"Writing {result.count()} records")
    
    result.write.saveAsTable("curated.orders")
    
    # Emit metrics
    metrics.gauge("orders.processed", result.count())
    metrics.gauge("orders.processing_time_seconds", elapsed_time)
```
