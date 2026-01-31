# Security & Governance

Patterns for securing data and maintaining compliance.

## Data Classification

### Classification Levels

| Level | Description | Examples | Requirements |
|-------|-------------|----------|--------------|
| **Public** | Can share externally | Product catalog, public stats | None |
| **Internal** | Business data, internal use | Sales reports, metrics | Authentication |
| **Confidential** | Sensitive business data | Financial data, contracts | Encryption, access control |
| **Restricted** | Regulated/PII data | SSN, health records, PCI | Encryption, masking, audit logging |

### Apply Classifications

```python
# Tag tables with classification
spark.sql("""
    ALTER TABLE curated.customers
    SET TBLPROPERTIES (
        'data_classification' = 'restricted',
        'contains_pii' = 'true',
        'data_owner' = 'customer-team',
        'retention_days' = '365'
    )
""")

# Query classification metadata
spark.sql("""
    SELECT table_name, properties['data_classification'] as classification
    FROM information_schema.tables
    WHERE properties['contains_pii'] = 'true'
""")
```

## PII Handling

### Identify PII Columns

```python
PII_COLUMNS = {
    # Direct identifiers
    "ssn": "restricted",
    "social_security_number": "restricted",
    "national_id": "restricted",
    "passport_number": "restricted",
    "driver_license": "restricted",
    
    # Contact information
    "email": "confidential",
    "phone": "confidential",
    "phone_number": "confidential",
    "address": "confidential",
    
    # Financial
    "credit_card": "restricted",
    "bank_account": "restricted",
    "salary": "confidential",
    
    # Health
    "medical_record": "restricted",
    "diagnosis": "restricted",
}
```

### PII Masking Strategies

```python
from pyspark.sql import functions as F
from cryptography.fernet import Fernet

def mask_pii(df: DataFrame, strategy: dict[str, str]) -> DataFrame:
    """
    Apply PII masking based on strategy.
    
    Strategies:
    - hash: One-way SHA-256 hash (for matching)
    - encrypt: Reversible encryption (for authorized access)
    - mask: Partial masking (for display)
    - redact: Complete removal
    """
    for column, method in strategy.items():
        if column not in df.columns:
            continue
            
        if method == "hash":
            df = df.withColumn(column, F.sha2(F.col(column), 256))
        
        elif method == "encrypt":
            df = df.withColumn(column, encrypt_udf(F.col(column)))
        
        elif method == "mask":
            # Keep first/last chars, mask middle
            df = df.withColumn(column, 
                F.concat(
                    F.substring(F.col(column), 1, 2),
                    F.lit("****"),
                    F.substring(F.col(column), -2, 2)
                )
            )
        
        elif method == "redact":
            df = df.withColumn(column, F.lit("[REDACTED]"))
    
    return df

# Usage
masked_df = mask_pii(customers_df, {
    "ssn": "hash",
    "email": "encrypt",
    "phone": "mask",
    "credit_card": "redact",
})
```

### Encryption at Rest

```python
from cryptography.fernet import Fernet

class DataEncryption:
    """Encrypt/decrypt sensitive data fields."""
    
    def __init__(self, key: str = None):
        self.key = key or os.environ["ENCRYPTION_KEY"]
        self.cipher = Fernet(self.key.encode())
    
    def encrypt(self, value: str) -> str:
        if value is None:
            return None
        return self.cipher.encrypt(value.encode()).decode()
    
    def decrypt(self, encrypted: str) -> str:
        if encrypted is None:
            return None
        return self.cipher.decrypt(encrypted.encode()).decode()

# Register as UDF
encryption = DataEncryption()
encrypt_udf = F.udf(encryption.encrypt, StringType())
decrypt_udf = F.udf(encryption.decrypt, StringType())
```

## Access Control

### Role-Based Access Control (RBAC)

```sql
-- Create roles
CREATE ROLE data_analyst;
CREATE ROLE data_engineer;
CREATE ROLE data_admin;

-- Grant permissions
GRANT SELECT ON DATABASE curated TO data_analyst;
GRANT SELECT, INSERT, UPDATE ON DATABASE curated TO data_engineer;
GRANT ALL PRIVILEGES ON DATABASE curated TO data_admin;

-- Restrict sensitive tables
REVOKE SELECT ON TABLE curated.pii_customers FROM data_analyst;
GRANT SELECT ON TABLE curated.masked_customers TO data_analyst;
```

### Column-Level Security

```sql
-- Create view with masked columns for analysts
CREATE VIEW curated.customers_masked AS
SELECT
    customer_id,
    -- Mask PII for non-privileged users
    CASE WHEN IS_ACCOUNT_GROUP_MEMBER('pii_access')
         THEN email
         ELSE CONCAT(LEFT(email, 2), '****@', SPLIT(email, '@')[1])
    END AS email,
    CASE WHEN IS_ACCOUNT_GROUP_MEMBER('pii_access')
         THEN phone
         ELSE CONCAT('***-***-', RIGHT(phone, 4))
    END AS phone,
    segment,
    region
FROM curated.customers;

-- Analysts use masked view
GRANT SELECT ON curated.customers_masked TO data_analyst;
```

### Row-Level Security

```sql
-- Filter rows based on user's region
CREATE VIEW curated.regional_orders AS
SELECT *
FROM curated.orders
WHERE 
    -- Admins see all
    IS_ACCOUNT_GROUP_MEMBER('data_admin')
    OR
    -- Regional managers see their region
    region = CURRENT_USER_ATTRIBUTE('region');
```

## Audit Logging

### Log Data Access

```python
def log_data_access(
    user: str,
    table: str,
    operation: str,
    row_count: int,
    query: str = None,
) -> None:
    """Log all data access for compliance."""
    audit_record = {
        "timestamp": datetime.utcnow().isoformat(),
        "user": user,
        "table": table,
        "operation": operation,
        "row_count": row_count,
        "query_hash": hashlib.sha256(query.encode()).hexdigest() if query else None,
        "client_ip": get_client_ip(),
        "session_id": get_session_id(),
    }
    
    # Write to audit log (append-only, immutable)
    spark.createDataFrame([audit_record]).write.mode("append").saveAsTable("audit.data_access_log")
```

### Log Schema Changes

```python
def log_schema_change(
    table: str,
    change_type: str,  # "column_added", "column_removed", "type_changed"
    before_schema: StructType,
    after_schema: StructType,
    user: str,
) -> None:
    """Log schema changes for tracking."""
    audit_record = {
        "timestamp": datetime.utcnow().isoformat(),
        "table": table,
        "change_type": change_type,
        "before_schema": before_schema.json(),
        "after_schema": after_schema.json(),
        "user": user,
    }
    
    spark.createDataFrame([audit_record]).write.mode("append").saveAsTable("audit.schema_changes")
```

### Query Audit Logs

```sql
-- Who accessed PII tables?
SELECT user, table, operation, row_count, timestamp
FROM audit.data_access_log
WHERE table IN ('curated.customers', 'curated.payments')
AND timestamp >= CURRENT_DATE - 30
ORDER BY timestamp DESC;

-- Detect unusual access patterns
SELECT 
    user,
    COUNT(*) as access_count,
    SUM(row_count) as total_rows
FROM audit.data_access_log
WHERE timestamp >= CURRENT_DATE - 1
GROUP BY user
HAVING access_count > 100 OR total_rows > 1000000
ORDER BY total_rows DESC;
```

## Data Retention

### Retention Policies

```python
RETENTION_POLICIES = {
    "raw": {"days": 90, "archive": True},
    "curated": {"days": 365 * 3, "archive": True},
    "marts": {"days": 365 * 7, "archive": False},
    "pii_tables": {"days": 365, "archive": False},  # Regulatory requirement
    "audit_logs": {"days": 365 * 7, "archive": True},  # Keep for compliance
}

def apply_retention_policy(table: str, policy: dict) -> None:
    """Delete data older than retention period."""
    cutoff_date = date.today() - timedelta(days=policy["days"])
    
    if policy.get("archive"):
        # Archive before delete
        spark.sql(f"""
            INSERT INTO archive.{table}
            SELECT * FROM {table}
            WHERE _loaded_at < '{cutoff_date}'
        """)
    
    # Delete old data
    spark.sql(f"""
        DELETE FROM {table}
        WHERE _loaded_at < '{cutoff_date}'
    """)
    
    # Log retention action
    logger.info(f"Applied retention policy to {table}: deleted records before {cutoff_date}")
```

### Right to Deletion (GDPR)

```python
def delete_customer_data(customer_id: str, tables: list[str]) -> None:
    """
    Delete all data for a customer (GDPR right to erasure).
    """
    deleted_records = {}
    
    for table in tables:
        # Count before delete
        count_before = spark.sql(f"""
            SELECT COUNT(*) FROM {table} WHERE customer_id = '{customer_id}'
        """).collect()[0][0]
        
        # Delete
        spark.sql(f"""
            DELETE FROM {table} WHERE customer_id = '{customer_id}'
        """)
        
        deleted_records[table] = count_before
    
    # Log deletion for compliance
    log_gdpr_deletion(customer_id, deleted_records)
    
    return deleted_records
```

## Secrets Management

### Never Hardcode Secrets

```python
# Bad: Hardcoded credentials
connection_string = "postgresql://user:password123@host:5432/db"

# Good: Environment variables
connection_string = f"postgresql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}@{os.environ['DB_HOST']}:5432/{os.environ['DB_NAME']}"

# Better: Secrets manager
from databricks.sdk.runtime import dbutils
connection_string = dbutils.secrets.get(scope="production", key="db_connection_string")
```

### Rotate Credentials

```python
def rotate_encryption_key(old_key: str, new_key: str, tables: list[str]) -> None:
    """
    Rotate encryption key for encrypted columns.
    Re-encrypt all data with new key.
    """
    old_cipher = Fernet(old_key.encode())
    new_cipher = Fernet(new_key.encode())
    
    @udf(returnType=StringType())
    def reencrypt(value: str) -> str:
        if value is None:
            return None
        decrypted = old_cipher.decrypt(value.encode()).decode()
        return new_cipher.encrypt(decrypted.encode()).decode()
    
    for table in tables:
        encrypted_cols = get_encrypted_columns(table)
        
        df = spark.table(table)
        for col in encrypted_cols:
            df = df.withColumn(col, reencrypt(F.col(col)))
        
        df.write.mode("overwrite").saveAsTable(table)
        
        logger.info(f"Rotated encryption key for {table}")
```

## Compliance Checklist

### General Data Protection

- [ ] Data classified by sensitivity
- [ ] PII identified and catalogued
- [ ] Encryption at rest for sensitive data
- [ ] Encryption in transit (TLS)
- [ ] Access controls implemented
- [ ] Audit logging enabled

### GDPR Compliance

- [ ] Data inventory documented
- [ ] Legal basis for processing defined
- [ ] Right to access implemented
- [ ] Right to deletion implemented
- [ ] Data portability supported
- [ ] Breach notification process defined

### SOC 2 / HIPAA / PCI

- [ ] Access reviews conducted regularly
- [ ] Logs retained per requirements
- [ ] Change management documented
- [ ] Incident response plan exists
- [ ] Vendor assessments completed
- [ ] Training completed by team

## Security Best Practices

### Principle of Least Privilege

```sql
-- Bad: Overly permissive
GRANT ALL PRIVILEGES ON DATABASE curated TO data_team;

-- Good: Minimal necessary permissions
GRANT SELECT ON curated.orders TO sales_analyst;
GRANT SELECT ON curated.products TO sales_analyst;
-- No access to customer PII
```

### Defense in Depth

```
┌─────────────────────────────────────────┐
│ Network: VPC, Firewall, Private Link    │
├─────────────────────────────────────────┤
│ Authentication: SSO, MFA                │
├─────────────────────────────────────────┤
│ Authorization: RBAC, Row/Column Security│
├─────────────────────────────────────────┤
│ Encryption: At rest, In transit         │
├─────────────────────────────────────────┤
│ Monitoring: Audit logs, Alerts          │
└─────────────────────────────────────────┘
```

### Secure Defaults

```python
# Default to restricted access
DEFAULT_TABLE_PROPERTIES = {
    "data_classification": "internal",
    "access_requires_approval": "true",
}

# Default to encryption
DEFAULT_WRITE_OPTIONS = {
    "encryption": "true",
    "compression": "zstd",
}
```
