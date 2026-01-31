# Data Pipeline Testing

Strategies for testing data pipelines effectively.

## Testing Pyramid

| Level | Scope | Speed | Purpose |
|-------|-------|-------|---------|
| **Unit** | Single transformation | Fast | Test logic in isolation |
| **Integration** | Pipeline end-to-end | Medium | Test data flow |
| **Contract** | Schema/interface | Fast | Prevent breaking changes |
| **Data Quality** | Production data | Slow | Validate real data |

## Unit Tests

Test individual transformations with small, controlled datasets.

### Setup

```python
import pytest
from pyspark.sql import SparkSession
from chispa import assert_df_equality
from decimal import Decimal

@pytest.fixture(scope="session")
def spark():
    """Create a Spark session for testing."""
    return (
        SparkSession.builder
        .master("local[*]")
        .appName("unit-tests")
        .config("spark.sql.shuffle.partitions", "1")  # Faster for small data
        .getOrCreate()
    )
```

### Testing Transformations

```python
class TestOrderTransformations:
    
    def test_calculate_order_total(self, spark):
        """Test order total calculation."""
        input_df = spark.createDataFrame([
            {"order_id": "1", "quantity": 2, "unit_price": Decimal("10.00")},
            {"order_id": "2", "quantity": 3, "unit_price": Decimal("5.50")},
        ])
        
        expected_df = spark.createDataFrame([
            {"order_id": "1", "quantity": 2, "unit_price": Decimal("10.00"), "total": Decimal("20.00")},
            {"order_id": "2", "quantity": 3, "unit_price": Decimal("5.50"), "total": Decimal("16.50")},
        ])
        
        result = calculate_order_total(input_df)
        
        assert_df_equality(result, expected_df, ignore_row_order=True)
    
    def test_filter_valid_orders(self, spark):
        """Test filtering of invalid orders."""
        input_df = spark.createDataFrame([
            {"order_id": "1", "quantity": 2, "status": "confirmed"},
            {"order_id": "2", "quantity": 0, "status": "confirmed"},  # Invalid
            {"order_id": "3", "quantity": 1, "status": "cancelled"},  # Invalid
        ])
        
        result = filter_valid_orders(input_df)
        
        assert result.count() == 1
        assert result.collect()[0]["order_id"] == "1"
    
    def test_handles_null_values(self, spark):
        """Test graceful null handling."""
        input_df = spark.createDataFrame([
            {"order_id": "1", "email": None},
            {"order_id": "2", "email": "test@example.com"},
        ])
        
        result = extract_email_domain(input_df)
        
        row1 = result.filter("order_id = '1'").collect()[0]
        row2 = result.filter("order_id = '2'").collect()[0]
        
        assert row1["email_domain"] is None
        assert row2["email_domain"] == "example.com"
    
    def test_handles_empty_dataframe(self, spark):
        """Test behavior with empty input."""
        empty_df = spark.createDataFrame([], schema="order_id STRING, quantity INT")
        
        result = process_orders(empty_df)
        
        assert result.count() == 0
```

### Testing Aggregations

```python
def test_daily_aggregation(spark):
    """Test daily aggregation logic."""
    input_df = spark.createDataFrame([
        {"order_date": "2024-01-15", "amount": Decimal("100.00")},
        {"order_date": "2024-01-15", "amount": Decimal("50.00")},
        {"order_date": "2024-01-16", "amount": Decimal("200.00")},
    ])
    
    result = aggregate_daily_totals(input_df)
    
    jan15 = result.filter("order_date = '2024-01-15'").collect()[0]
    jan16 = result.filter("order_date = '2024-01-16'").collect()[0]
    
    assert jan15["total_amount"] == Decimal("150.00")
    assert jan15["order_count"] == 2
    assert jan16["total_amount"] == Decimal("200.00")
    assert jan16["order_count"] == 1
```

### Testing Edge Cases

```python
class TestEdgeCases:
    
    def test_duplicate_handling(self, spark):
        """Test deduplication logic."""
        input_df = spark.createDataFrame([
            {"order_id": "1", "amount": Decimal("100.00"), "updated_at": "2024-01-15 10:00:00"},
            {"order_id": "1", "amount": Decimal("150.00"), "updated_at": "2024-01-15 11:00:00"},  # Newer
        ])
        
        result = deduplicate_orders(input_df)
        
        assert result.count() == 1
        assert result.collect()[0]["amount"] == Decimal("150.00")
    
    def test_large_values(self, spark):
        """Test handling of large numeric values."""
        input_df = spark.createDataFrame([
            {"order_id": "1", "quantity": 999999, "unit_price": Decimal("99999.99")},
        ])
        
        result = calculate_order_total(input_df)
        
        # Should not overflow
        assert result.collect()[0]["total"] == Decimal("99999890000.01")
    
    def test_special_characters(self, spark):
        """Test handling of special characters in strings."""
        input_df = spark.createDataFrame([
            {"customer_name": "O'Brien"},
            {"customer_name": "Müller"},
            {"customer_name": "日本語"},
        ])
        
        result = normalize_names(input_df)
        
        assert result.count() == 3  # Should not fail
```

## Integration Tests

Test complete pipeline flows with realistic data.

### Test Database Setup

```python
@pytest.fixture(scope="class")
def test_database(spark):
    """Create isolated test database."""
    db_name = f"test_db_{uuid.uuid4().hex[:8]}"
    spark.sql(f"CREATE DATABASE {db_name}")
    yield db_name
    spark.sql(f"DROP DATABASE {db_name} CASCADE")
```

### End-to-End Pipeline Test

```python
class TestOrdersPipeline:
    
    def test_end_to_end_flow(self, spark, test_database):
        """Test complete pipeline from raw to mart."""
        # Arrange: Create test data
        raw_orders = spark.createDataFrame([
            {"id": "1", "customer_id": "C1", "amount": 100.0, "order_date": "2024-01-15"},
            {"id": "2", "customer_id": "C1", "amount": 50.0, "order_date": "2024-01-15"},
            {"id": "3", "customer_id": "C2", "amount": 200.0, "order_date": "2024-01-15"},
        ])
        raw_orders.write.mode("overwrite").saveAsTable(f"{test_database}.raw_orders")
        
        # Act: Run pipeline
        run_orders_pipeline(
            source_table=f"{test_database}.raw_orders",
            target_table=f"{test_database}.curated_orders",
            execution_date=date(2024, 1, 15),
        )
        
        # Assert
        result = spark.table(f"{test_database}.curated_orders")
        
        assert result.count() == 3
        assert "_loaded_at" in result.columns  # Metadata added
    
    def test_idempotency(self, spark, test_database):
        """Pipeline produces same result on re-run."""
        # Run twice
        for _ in range(2):
            run_orders_pipeline(
                source_table=f"{test_database}.raw_orders",
                target_table=f"{test_database}.curated_orders",
                execution_date=date(2024, 1, 15),
            )
        
        result = spark.table(f"{test_database}.curated_orders")
        assert result.count() == 3  # Not doubled
    
    def test_incremental_processing(self, spark, test_database):
        """Incremental loads only process new data."""
        # Initial load
        run_orders_pipeline(execution_date=date(2024, 1, 15))
        
        # Add new data
        new_orders = spark.createDataFrame([
            {"id": "4", "customer_id": "C3", "amount": 300.0, "order_date": "2024-01-16"},
        ])
        new_orders.write.mode("append").saveAsTable(f"{test_database}.raw_orders")
        
        # Incremental load
        run_orders_pipeline(execution_date=date(2024, 1, 16))
        
        result = spark.table(f"{test_database}.curated_orders")
        assert result.count() == 4  # 3 original + 1 new
```

### Testing Error Conditions

```python
def test_handles_missing_source_gracefully(spark, test_database):
    """Pipeline fails gracefully when source is missing."""
    with pytest.raises(SourceNotFoundError):
        run_orders_pipeline(
            source_table=f"{test_database}.nonexistent_table",
            target_table=f"{test_database}.curated_orders",
        )

def test_handles_schema_mismatch(spark, test_database):
    """Pipeline fails on unexpected schema."""
    bad_schema_data = spark.createDataFrame([
        {"wrong_column": "value"},
    ])
    bad_schema_data.write.mode("overwrite").saveAsTable(f"{test_database}.raw_orders")
    
    with pytest.raises(SchemaValidationError):
        run_orders_pipeline(
            source_table=f"{test_database}.raw_orders",
            target_table=f"{test_database}.curated_orders",
        )
```

## Contract Tests

Ensure schema compatibility between producers and consumers.

```python
def test_schema_backward_compatible():
    """Ensure current schema is backward compatible."""
    current_schema = spark.table("curated.orders").schema
    
    # Required columns that consumers depend on
    required_contract = {
        "order_id": StringType(),
        "customer_id": StringType(),
        "order_date": DateType(),
        "total_amount": DecimalType(12, 2),
    }
    
    for col_name, expected_type in required_contract.items():
        # Column must exist
        assert col_name in [f.name for f in current_schema.fields], \
            f"Breaking change: Required column '{col_name}' missing"
        
        # Type must match
        actual_type = current_schema[col_name].dataType
        assert actual_type == expected_type, \
            f"Breaking change: Column '{col_name}' type changed from {expected_type} to {actual_type}"

def test_no_accidental_column_removal():
    """Ensure no columns were accidentally removed."""
    previous_columns = load_previous_schema("curated.orders")
    current_columns = {f.name for f in spark.table("curated.orders").schema.fields}
    
    removed = previous_columns - current_columns
    assert len(removed) == 0, f"Columns removed: {removed}"
```

## DBT Tests

### Model Tests

```yaml
# models/orders/schema.yml
version: 2

models:
  - name: orders
    description: Curated orders table
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
      - name: total_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
```

### Custom Tests

```sql
-- tests/orders_total_matches_line_items.sql
SELECT order_id
FROM {{ ref('orders') }} o
JOIN (
    SELECT order_id, SUM(quantity * unit_price) as calc_total
    FROM {{ ref('order_items') }}
    GROUP BY order_id
) li USING (order_id)
WHERE ABS(o.total_amount - li.calc_total) > 0.01
```

## Test Utilities

### Test Data Factories

```python
from dataclasses import dataclass
from faker import Faker

fake = Faker()

@dataclass
class OrderFactory:
    """Generate test order data."""
    
    @staticmethod
    def create(spark: SparkSession, count: int = 10, **overrides) -> DataFrame:
        data = [
            {
                "order_id": overrides.get("order_id", f"ORD-{i}"),
                "customer_id": overrides.get("customer_id", f"CUST-{fake.random_int(1, 100)}"),
                "order_date": overrides.get("order_date", fake.date_between("-30d", "today").isoformat()),
                "total_amount": overrides.get("total_amount", float(fake.pydecimal(min_value=10, max_value=1000))),
                "status": overrides.get("status", fake.random_element(["pending", "confirmed", "shipped"])),
            }
            for i in range(count)
        ]
        return spark.createDataFrame(data)

# Usage
orders = OrderFactory.create(spark, count=100, status="confirmed")
```

### Assertion Helpers

```python
def assert_row_count(df: DataFrame, expected: int, message: str = ""):
    """Assert DataFrame has expected row count."""
    actual = df.count()
    assert actual == expected, f"{message}: Expected {expected} rows, got {actual}"

def assert_no_nulls(df: DataFrame, columns: list[str]):
    """Assert no null values in specified columns."""
    for col in columns:
        null_count = df.filter(F.col(col).isNull()).count()
        assert null_count == 0, f"Found {null_count} nulls in column '{col}'"

def assert_no_duplicates(df: DataFrame, key_columns: list[str]):
    """Assert no duplicate keys."""
    dup_count = df.groupBy(key_columns).count().filter("count > 1").count()
    assert dup_count == 0, f"Found {dup_count} duplicate keys on {key_columns}"
```

## Best Practices

### Test Behavior, Not Implementation

```python
# Bad: Testing implementation details
def test_uses_left_join():
    # Don't test HOW it's done
    assert "LEFT JOIN" in get_query_plan()

# Good: Testing behavior
def test_preserves_all_orders():
    # Test WHAT it does
    result = join_orders_with_customers(orders, customers)
    assert result.count() == orders.count()
```

### One Assertion Per Concept

```python
# Good: Focused tests
def test_filters_cancelled_orders():
    result = filter_orders(orders_with_cancelled)
    assert result.filter("status = 'cancelled'").count() == 0

def test_preserves_confirmed_orders():
    result = filter_orders(orders_with_confirmed)
    assert result.filter("status = 'confirmed'").count() == confirmed_count
```

### Use Descriptive Names

```python
# Good: Clear what's being tested
def test_calculate_total_handles_zero_quantity(): ...
def test_calculate_total_handles_negative_discount(): ...
def test_calculate_total_rounds_to_two_decimals(): ...

# Bad: Vague names
def test_calculate_total(): ...
def test_calculate_total_2(): ...
```

### Isolate Tests

```python
# Good: Each test sets up its own data
def test_aggregation(spark):
    test_data = spark.createDataFrame([...])  # Local data
    result = aggregate(test_data)
    assert ...

# Bad: Tests depend on shared state
shared_df = None

def test_step_1():
    global shared_df
    shared_df = process_step_1(data)

def test_step_2():
    # Depends on test_step_1 running first!
    result = process_step_2(shared_df)
```
