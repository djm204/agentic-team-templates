# Data Engineering

Guidelines for building robust, scalable data platforms and pipelines.

## Scope

This ruleset applies to:

- Batch data pipelines (ETL/ELT)
- Stream processing applications
- Data warehouses and lakehouses
- Data platform infrastructure
- Analytics engineering (DBT, SQL models)
- Data quality and observability systems

## Core Technologies

Data engineering typically involves:

- **Orchestration**: Airflow, Dagster, Prefect, Temporal
- **Batch Processing**: Spark, DBT, Pandas, Polars, SQL
- **Stream Processing**: Kafka, Flink, Spark Streaming
- **Storage**: Delta Lake, Iceberg, Parquet, cloud object storage
- **Warehouses**: Snowflake, BigQuery, Redshift, Databricks
- **Quality**: Great Expectations, Soda, DBT Tests

## Key Principles

### 1. Idempotency Is Non-Negotiable

Every pipeline must produce identical results when re-run with the same inputs. This enables safe retries, backfills, and debugging.

### 2. Data Quality Is a Feature

Data quality isn't an afterthought—it's a core feature. Validate early, monitor continuously, and alert proactively.

### 3. Schema Is a Contract

Schema changes can break downstream consumers. Treat schemas as versioned contracts that require coordination.

### 4. Observability Over Debugging

Instrument everything in production. If you can't observe it, you can't operate it. Never debug production data issues by running ad-hoc queries.

### 5. Cost-Aware Engineering

Compute and storage have real costs. Understand cost implications of design decisions. Optimize deliberately, not prematurely.

## Project Structure

```
data-platform/
├── pipelines/              # Pipeline definitions
│   ├── ingestion/          # Source → Raw layer
│   ├── transformation/     # Raw → Curated layer
│   └── serving/            # Curated → Consumption layer
├── models/                 # DBT or SQL models
│   ├── staging/            # 1:1 source mappings
│   ├── intermediate/       # Business logic transforms
│   └── marts/              # Consumption-ready tables
├── schemas/                # Schema definitions
├── quality/                # Data quality checks
├── tests/                  # Pipeline tests
└── docs/                   # Documentation
```

## Data Architecture Layers

| Layer | Also Known As | Purpose | Freshness |
|-------|---------------|---------|-----------|
| **Raw/Bronze** | Landing, Staging | Exact copy of source | Minutes-Hours |
| **Curated/Silver** | Cleaned, Conformed | Validated, typed, deduplicated | Hours |
| **Marts/Gold** | Aggregates, Features | Business-ready datasets | Hours-Daily |

## Definition of Done

A data pipeline is complete when:

- [ ] Produces correct output for all test cases
- [ ] Idempotency verified (re-run produces same result)
- [ ] Data quality checks implemented
- [ ] Schema documented and versioned
- [ ] Monitoring and alerting configured
- [ ] Runbook/playbook documented
- [ ] Cost estimate understood
