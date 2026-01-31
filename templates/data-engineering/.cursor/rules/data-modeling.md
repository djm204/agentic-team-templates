# Data Modeling

Patterns for designing scalable, maintainable data models.

## Layered Architecture

### Medallion Architecture

| Layer | Purpose | Characteristics |
|-------|---------|-----------------|
| **Bronze/Raw** | Ingest and preserve | Exact source copy, append-only, no transformations |
| **Silver/Curated** | Clean and conform | Validated, typed, deduplicated, business keys |
| **Gold/Marts** | Aggregate and serve | Business-ready, optimized for consumption |

```sql
-- Bronze: Raw ingestion
CREATE TABLE bronze.orders_raw (
    _raw_data STRING,           -- Original JSON/CSV
    _source_file STRING,
    _ingested_at TIMESTAMP
);

-- Silver: Cleaned and typed
CREATE TABLE silver.orders (
    order_id STRING NOT NULL,
    customer_id STRING NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(12,2),
    _loaded_at TIMESTAMP
);

-- Gold: Business aggregates
CREATE TABLE gold.daily_order_summary (
    order_date DATE,
    total_orders INT,
    total_revenue DECIMAL(15,2),
    avg_order_value DECIMAL(12,2)
);
```

## Dimensional Modeling

### Star Schema

```
                    +----------------+
                    |  dim_customer  |
                    +----------------+
                           |
+------------+      +------+-------+      +-------------+
| dim_product|------| fact_orders  |------| dim_date    |
+------------+      +--------------+      +-------------+
                           |
                    +------+-------+
                    | dim_location |
                    +----------------+
```

### Fact Tables

Store measurable events with foreign keys to dimensions.

```sql
CREATE TABLE facts.orders (
    -- Degenerate dimension (no separate table needed)
    order_id STRING NOT NULL,
    
    -- Foreign keys to dimensions
    customer_key BIGINT NOT NULL,
    product_key BIGINT NOT NULL,
    date_key INT NOT NULL,
    
    -- Measures
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Metadata
    _loaded_at TIMESTAMP NOT NULL
)
PARTITIONED BY (date_key);
```

### Dimension Tables

Store descriptive attributes for analysis.

```sql
CREATE TABLE dims.customers (
    -- Surrogate key (for SCD)
    customer_key BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Natural key (from source)
    customer_id STRING NOT NULL,
    
    -- Attributes
    name STRING NOT NULL,
    email STRING,
    segment STRING,
    region STRING,
    
    -- SCD Type 2 tracking
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL,
    
    -- Metadata
    _loaded_at TIMESTAMP NOT NULL
);
```

## Slowly Changing Dimensions

### Type 1: Overwrite

Simply update the record. No history preserved.

```sql
-- Type 1: Overwrite existing value
UPDATE dims.customers
SET email = 'new@email.com', _loaded_at = CURRENT_TIMESTAMP
WHERE customer_id = 'C123';
```

### Type 2: Add New Row

Preserve history with effective dates.

```python
def apply_scd_type_2(source_df: DataFrame, target_table: str) -> None:
    target = DeltaTable.forName(spark, target_table)
    
    # Close existing current records for changed rows
    (target.alias("t")
        .merge(
            source_df.alias("s"),
            "t.customer_id = s.customer_id AND t.is_current = true"
        )
        .whenMatchedUpdate(
            condition="t.name != s.name OR t.email != s.email",  # Tracked columns
            set={
                "effective_to": "current_date()",
                "is_current": "false"
            }
        )
        .execute())
    
    # Insert new records for changes and new customers
    new_records = (
        source_df
        .withColumn("effective_from", F.current_date())
        .withColumn("effective_to", F.lit(None))
        .withColumn("is_current", F.lit(True))
    )
    new_records.write.mode("append").saveAsTable(target_table)
```

### Type 3: Add New Column

Track limited history with previous value column.

```sql
ALTER TABLE dims.customers ADD COLUMN previous_segment STRING;

UPDATE dims.customers
SET previous_segment = segment, segment = 'Enterprise'
WHERE customer_id = 'C123';
```

## Date Dimension

Pre-populated calendar table for time-based analysis.

```sql
CREATE TABLE dims.date (
    date_key INT PRIMARY KEY,           -- YYYYMMDD format
    full_date DATE NOT NULL,
    
    -- Calendar attributes
    day_of_week INT,
    day_name STRING,
    day_of_month INT,
    day_of_year INT,
    week_of_year INT,
    month_number INT,
    month_name STRING,
    quarter INT,
    year INT,
    
    -- Business attributes
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    holiday_name STRING,
    fiscal_year INT,
    fiscal_quarter INT,
    
    -- Relative flags (update daily)
    is_current_day BOOLEAN,
    is_current_week BOOLEAN,
    is_current_month BOOLEAN
);
```

## Schema Design Best Practices

### Use Appropriate Data Types

```sql
-- Good: Appropriate types
order_id STRING,                    -- IDs as strings (UUIDs, alphanumeric)
quantity INT,                       -- Whole numbers
unit_price DECIMAL(10,2),          -- Money with fixed precision
order_date DATE,                   -- Date without time
created_at TIMESTAMP,              -- Date with time
is_active BOOLEAN,                 -- True/false flags

-- Bad: Wrong types
order_id INT,                      -- May overflow, can't handle UUIDs
unit_price FLOAT,                  -- Floating point precision issues
order_date STRING,                 -- Can't do date math, inconsistent formats
```

### Naming Conventions

```sql
-- Tables: plural, snake_case
orders, order_items, customer_addresses

-- Columns: singular, snake_case
order_id, customer_name, created_at

-- Foreign keys: referenced_table_key
customer_key, product_key

-- Boolean columns: is_* or has_*
is_active, is_deleted, has_discount

-- Timestamps: *_at
created_at, updated_at, deleted_at

-- Dates: *_date
order_date, ship_date, due_date
```

### Avoid Wide Tables

```sql
-- Bad: Wide table with sparse columns
CREATE TABLE orders (
    order_id STRING,
    customer_name STRING,
    customer_email STRING,
    customer_phone STRING,
    shipping_address_line1 STRING,
    shipping_address_line2 STRING,
    shipping_city STRING,
    -- ... 50 more columns
);

-- Good: Normalized with joins
CREATE TABLE orders (order_id STRING, customer_key BIGINT, ...);
CREATE TABLE customers (customer_key BIGINT, name STRING, email STRING, ...);
CREATE TABLE addresses (address_key BIGINT, customer_key BIGINT, ...);
```

## Partitioning Strategies

### Time-Based Partitioning

Most common. Partition by date/time for time-series data.

```sql
CREATE TABLE curated.orders (...)
PARTITIONED BY (order_date);

-- Query with partition filter
SELECT * FROM curated.orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31';
```

### Categorical Partitioning

Partition by high-cardinality categorical column.

```sql
CREATE TABLE curated.events (...)
PARTITIONED BY (event_type);

-- Query specific event types
SELECT * FROM curated.events
WHERE event_type = 'purchase';
```

### Avoid Over-Partitioning

```sql
-- Bad: Too many partitions, small files
PARTITIONED BY (order_date, customer_id, product_id)

-- Good: Partition by date, cluster/sort by other columns
PARTITIONED BY (order_date)
CLUSTERED BY (customer_id) INTO 100 BUCKETS
```

## Data Vault (Brief Overview)

Alternative modeling approach for enterprise data warehouses.

| Component | Purpose |
|-----------|---------|
| **Hub** | Business keys (customer_id, product_id) |
| **Link** | Relationships between hubs |
| **Satellite** | Descriptive attributes with history |

```sql
-- Hub: Business key
CREATE TABLE hub_customer (
    customer_hk STRING,  -- Hash of business key
    customer_id STRING,  -- Business key
    load_date TIMESTAMP,
    record_source STRING
);

-- Satellite: Attributes
CREATE TABLE sat_customer (
    customer_hk STRING,
    name STRING,
    email STRING,
    load_date TIMESTAMP,
    load_end_date TIMESTAMP,
    record_source STRING
);
```

## One Big Table (OBT)

Denormalized approach for analytics/BI tools.

```sql
-- Pre-joined, denormalized for fast queries
CREATE TABLE marts.orders_obt AS
SELECT
    o.order_id,
    o.order_date,
    o.total_amount,
    c.customer_name,
    c.customer_segment,
    c.customer_region,
    p.product_name,
    p.product_category,
    d.month_name,
    d.quarter,
    d.fiscal_year
FROM facts.orders o
JOIN dims.customers c ON o.customer_key = c.customer_key
JOIN dims.products p ON o.product_key = p.product_key
JOIN dims.date d ON o.date_key = d.date_key
WHERE c.is_current = true;
```

**Trade-offs:**
- ✅ Fast queries (no joins)
- ✅ Simple for BI tools
- ❌ Data duplication
- ❌ Harder to update
- ❌ Wider rows
