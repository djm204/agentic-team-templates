# Performance Optimization

Patterns for building efficient, cost-effective data pipelines.

## Partitioning

### Choose Partition Columns Wisely

Partition by columns used in most query filters (usually date/time).

```python
# Good: Partition by date - most queries filter by date
(orders_df
    .write
    .partitionBy("order_date")
    .saveAsTable("curated.orders"))

# Query with partition pruning
spark.sql("SELECT * FROM curated.orders WHERE order_date = '2024-01-15'")

# Bad: Over-partitioning creates too many small files
(orders_df
    .write
    .partitionBy("order_date", "customer_id", "product_id")  # Millions of partitions!
    .saveAsTable("curated.orders"))
```

### Partition Size Guidelines

| Records per Partition | Assessment |
|-----------------------|------------|
| < 100,000 | Too small - consider fewer partitions |
| 100K - 10M | Optimal range |
| > 10M | Consider sub-partitioning |

### Optimize File Sizes

```python
# Set target file size (Delta Lake)
spark.conf.set("spark.databricks.delta.optimizeWrite.fileSize", "128mb")

# Compact small files
spark.sql("OPTIMIZE curated.orders")

# Set max records per file
(df.write
    .option("maxRecordsPerFile", 1_000_000)
    .saveAsTable("curated.orders"))
```

## Query Optimization

### Predicate Pushdown

Ensure filters are pushed to storage layer.

```python
# Good: Predicate pushdown works
orders = spark.read.table("curated.orders").filter("order_date = '2024-01-15'")

# Bad: UDF blocks pushdown - full table scan!
@udf(returnType=BooleanType())
def is_recent(d):
    return d > datetime.now() - timedelta(days=7)

orders = spark.read.table("curated.orders").filter(is_recent(F.col("order_date")))

# Good: Use native Spark functions
orders = spark.read.table("curated.orders").filter(
    F.col("order_date") > F.date_sub(F.current_date(), 7)
)
```

### Column Pruning

Select only needed columns early.

```python
# Good: Select needed columns early
(spark.read.table("curated.orders")
    .select("order_id", "customer_id", "total_amount")  # Prune early
    .filter("total_amount > 100")
    .groupBy("customer_id")
    .agg(F.sum("total_amount")))

# Bad: Select all, filter later
(spark.read.table("curated.orders")  # Reads all 50 columns
    .filter("total_amount > 100")
    .select("order_id", "customer_id", "total_amount")  # Too late!
    .groupBy("customer_id")
    .agg(F.sum("total_amount")))
```

### Broadcast Joins

Broadcast small tables to avoid shuffle.

```python
# Good: Broadcast small dimension table
from pyspark.sql.functions import broadcast

orders = spark.table("curated.orders")  # 1B rows
products = spark.table("dims.products")  # 10K rows

joined = orders.join(broadcast(products), "product_id")

# Configure broadcast threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "100mb")
```

### Avoid Expensive Operations

```python
# Bad: Distinct before join (expensive shuffle)
orders.select("customer_id").distinct().join(customers, "customer_id")

# Good: Filter on indexed column, let database handle uniqueness
customers.filter("is_active = true")

# Bad: Order by on large dataset
spark.table("curated.orders").orderBy("order_date")

# Good: Only sort when necessary, limit first if possible
(spark.table("curated.orders")
    .filter("customer_id = 'C123'")
    .orderBy(F.desc("order_date"))
    .limit(10))
```

## Caching

### When to Cache

Cache intermediate results that are:
1. Used multiple times
2. Expensive to compute
3. Small enough to fit in memory

```python
def process_with_caching():
    # Read and filter once
    base_orders = (
        spark.read.table("curated.orders")
        .filter("order_date >= '2024-01-01'")
        .cache()  # Cache in memory
    )
    
    try:
        # Multiple aggregations on same filtered data
        daily_totals = base_orders.groupBy("order_date").agg(F.sum("total"))
        customer_totals = base_orders.groupBy("customer_id").agg(F.sum("total"))
        product_totals = base_orders.groupBy("product_id").agg(F.sum("total"))
        
        # Write all
        daily_totals.write.saveAsTable("marts.daily_totals")
        customer_totals.write.saveAsTable("marts.customer_totals")
        product_totals.write.saveAsTable("marts.product_totals")
    finally:
        base_orders.unpersist()  # Always clean up
```

### Cache Levels

```python
from pyspark import StorageLevel

# Memory only (default) - fastest, may spill
df.cache()  # Same as persist(StorageLevel.MEMORY_ONLY)

# Memory and disk - won't recompute if evicted
df.persist(StorageLevel.MEMORY_AND_DISK)

# Disk only - for very large datasets
df.persist(StorageLevel.DISK_ONLY)

# Serialized - more compact, slower access
df.persist(StorageLevel.MEMORY_ONLY_SER)
```

## Shuffle Optimization

### Reduce Shuffle Size

```python
# Good: Aggregate before join
customer_totals = orders.groupBy("customer_id").agg(F.sum("amount").alias("total"))
result = customer_totals.join(customers, "customer_id")

# Bad: Join then aggregate (shuffles full orders table)
result = orders.join(customers, "customer_id").groupBy("customer_id").agg(F.sum("amount"))
```

### Partition Count

```python
# Check partition count
print(df.rdd.getNumPartitions())

# Reduce partitions before write (coalesce doesn't shuffle)
df.coalesce(100).write.saveAsTable("output")

# Increase partitions for parallelism (repartition shuffles)
df.repartition(200).write.saveAsTable("output")

# Repartition by key for co-located data
df.repartition("customer_id").write.partitionBy("customer_id").saveAsTable("output")
```

### Configure Shuffle Partitions

```python
# Default is 200 - tune based on data size
spark.conf.set("spark.sql.shuffle.partitions", "auto")  # Spark 3.0+
# Or set explicitly
spark.conf.set("spark.sql.shuffle.partitions", "400")
```

## Z-Ordering (Delta Lake)

Co-locate related data for faster queries on multiple columns.

```sql
-- Z-order by commonly filtered/joined columns
OPTIMIZE curated.orders
ZORDER BY (customer_id, product_id)

-- Queries on these columns will be faster
SELECT * FROM curated.orders WHERE customer_id = 'C123'
SELECT * FROM curated.orders WHERE product_id = 'P456'
SELECT * FROM curated.orders WHERE customer_id = 'C123' AND product_id = 'P456'
```

## Incremental Processing

Process only what changed.

```python
def incremental_pipeline(source: str, target: str, watermark_col: str):
    # Get last processed watermark
    last_watermark = spark.sql(f"""
        SELECT MAX({watermark_col}) FROM {target}
    """).collect()[0][0]
    
    # Read only new data
    new_data = (
        spark.read.table(source)
        .filter(F.col(watermark_col) > last_watermark)
    )
    
    if new_data.isEmpty():
        logger.info("No new data to process")
        return
    
    # Process and write
    processed = transform(new_data)
    processed.write.mode("append").saveAsTable(target)
```

## Cost Management

### Monitor Compute Costs

```sql
-- Track pipeline costs over time
SELECT 
    pipeline_name,
    DATE(run_date) as run_date,
    SUM(total_dbu) as daily_dbu,
    SUM(bytes_scanned) / 1e12 as tb_scanned,
    AVG(duration_seconds) as avg_duration
FROM pipeline_metrics
WHERE run_date >= CURRENT_DATE - 30
GROUP BY pipeline_name, DATE(run_date)
ORDER BY daily_dbu DESC;
```

### Identify Expensive Queries

```sql
-- Find most expensive queries
SELECT 
    query_id,
    user,
    LEFT(query_text, 100) as query_preview,
    bytes_scanned / 1e9 as gb_scanned,
    duration_ms / 1000 as duration_seconds
FROM query_history
WHERE timestamp >= CURRENT_DATE - 7
ORDER BY bytes_scanned DESC
LIMIT 20;
```

### Optimize Storage Costs

```python
# Remove old partitions
spark.sql("""
    DELETE FROM curated.orders
    WHERE order_date < DATE_SUB(CURRENT_DATE, 365)
""")

# Vacuum deleted files (Delta Lake)
spark.sql("VACUUM curated.orders RETAIN 168 HOURS")

# Convert to more efficient format
(spark.read.table("legacy.orders")
    .write
    .format("delta")
    .option("compression", "zstd")  # Better compression
    .saveAsTable("curated.orders"))
```

## Performance Checklist

Before deploying a pipeline, verify:

### Query Optimization
- [ ] Filters use partition columns
- [ ] Only needed columns are selected
- [ ] Small tables are broadcast in joins
- [ ] No unnecessary shuffles

### File Optimization
- [ ] Partition column is appropriate
- [ ] Files are right-sized (100MB-1GB)
- [ ] Z-ordering on common filter columns
- [ ] No excessive small files

### Resource Optimization
- [ ] Cluster size matches workload
- [ ] Shuffle partitions configured
- [ ] Caching used for reused DataFrames
- [ ] Memory settings appropriate

### Cost Optimization
- [ ] Incremental processing where possible
- [ ] Data retention policy applied
- [ ] Query costs monitored
- [ ] Unused tables/data removed
