# Infrastructure as Code

Guidelines for writing maintainable, secure, and scalable infrastructure code.

## Core Principles

1. **Declarative Over Imperative** - Describe desired state, not steps
2. **Idempotent Operations** - Running twice produces same result
3. **Version Everything** - IaC, modules, providers, dependencies
4. **Test Infrastructure** - Validate before applying

## Terraform Best Practices

### File Organization

```hcl
# main.tf - Primary resources
# variables.tf - Input variables with descriptions
# outputs.tf - Output values
# versions.tf - Provider and Terraform version constraints
# locals.tf - Local values and computed expressions
# data.tf - Data sources
```

### Version Constraints

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0, < 2.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}
```

### Variable Definitions

```hcl
# variables.tf
variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "Must be a valid CIDR block."
  }
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}
```

### Local Values

```hcl
# locals.tf
locals {
  # Compute common values once
  name_prefix = "${var.project}-${var.environment}"
  
  # Merge default tags with provided tags
  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.project
      ManagedBy   = "terraform"
      Team        = var.team
    },
    var.tags
  )
  
  # Conditional logic
  is_production = var.environment == "production"
  
  # Complex transformations
  subnet_cidrs = {
    for idx, az in data.aws_availability_zones.available.names :
    az => cidrsubnet(var.vpc_cidr, 8, idx)
  }
}
```

### Resource Naming

```hcl
# Consistent, meaningful names
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_subnet" "private" {
  for_each = local.subnet_cidrs
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = each.key
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${each.key}"
    Type = "private"
  })
}
```

## Module Design

### Module Structure

```
modules/
└── eks-cluster/
    ├── main.tf           # Primary resources
    ├── variables.tf      # Input variables
    ├── outputs.tf        # Output values
    ├── versions.tf       # Version constraints
    ├── iam.tf            # IAM resources
    ├── security.tf       # Security groups
    ├── README.md         # Documentation
    └── examples/
        └── basic/
            └── main.tf   # Usage example
```

### Module Interface

```hcl
# modules/eks-cluster/variables.tf

# Required variables - no defaults
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where cluster will be created"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for EKS cluster"
  type        = list(string)
}

# Optional variables - sensible defaults
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "enable_private_endpoint" {
  description = "Enable private API endpoint"
  type        = bool
  default     = true
}

variable "node_groups" {
  description = "Node group configurations"
  type = map(object({
    instance_types = list(string)
    min_size       = number
    max_size       = number
    desired_size   = number
    disk_size      = optional(number, 50)
    labels         = optional(map(string), {})
    taints = optional(list(object({
      key    = string
      value  = string
      effect = string
    })), [])
  }))
  default = {}
}
```

### Module Outputs

```hcl
# modules/eks-cluster/outputs.tf

output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.main.id
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the cluster"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = aws_iam_openid_connect_provider.eks.arn
}
```

## State Management

### Remote Backend Configuration

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "infrastructure/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
    
    # Assume role for cross-account access
    role_arn = "arn:aws:iam::123456789012:role/TerraformStateAccess"
  }
}
```

### State Isolation Strategy

```
# One state file per environment per component
terraform-state/
├── networking/
│   ├── dev/terraform.tfstate
│   ├── staging/terraform.tfstate
│   └── production/terraform.tfstate
├── eks/
│   ├── dev/terraform.tfstate
│   ├── staging/terraform.tfstate
│   └── production/terraform.tfstate
└── databases/
    ├── dev/terraform.tfstate
    ├── staging/terraform.tfstate
    └── production/terraform.tfstate
```

### Cross-State References

```hcl
# Reference outputs from another state
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "company-terraform-state"
    key    = "networking/${var.environment}/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use the referenced values
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids = data.terraform_remote_state.networking.outputs.private_subnet_ids
  }
}
```

## Security Practices

### Sensitive Data Handling

```hcl
# Mark sensitive outputs
output "database_password" {
  description = "RDS master password"
  value       = aws_db_instance.main.password
  sensitive   = true
}

# Use secrets manager for credentials
data "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = "production/database/master"
}

locals {
  db_credentials = jsondecode(data.aws_secretsmanager_secret_version.db_credentials.secret_string)
}

resource "aws_db_instance" "main" {
  username = local.db_credentials.username
  password = local.db_credentials.password
  # ...
}
```

### Least Privilege IAM

```hcl
# Specific, minimal permissions
data "aws_iam_policy_document" "eks_cluster" {
  statement {
    sid    = "EKSClusterPolicy"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
      "eks:ListClusters",
    ]
    resources = [aws_eks_cluster.main.arn]
  }
  
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:log-group:/aws/eks/${var.cluster_name}/*"]
  }
}
```

## Testing Infrastructure

### Validation

```hcl
# terraform validate - syntax and consistency
# terraform plan - preview changes
# terraform fmt -check - formatting compliance

# Custom validation rules
variable "instance_type" {
  type = string
  
  validation {
    condition = can(regex("^(t3|m5|c5)\\.", var.instance_type))
    error_message = "Only t3, m5, or c5 instance families allowed."
  }
}
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
      - id: terraform_tflint
      - id: terraform_tfsec
      
  - repo: https://github.com/bridgecrewio/checkov
    rev: 2.4.0
    hooks:
      - id: checkov
        args: [--framework, terraform]
```

### Integration Tests (Terratest)

```go
// test/eks_test.go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestEksCluster(t *testing.T) {
    t.Parallel()
    
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/eks-cluster",
        Vars: map[string]interface{}{
            "cluster_name": "test-cluster",
            "environment":  "test",
        },
    })
    
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    clusterEndpoint := terraform.Output(t, terraformOptions, "cluster_endpoint")
    assert.Contains(t, clusterEndpoint, "eks.amazonaws.com")
}
```

## CI/CD Integration

### Plan and Apply Pipeline

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      
      - name: Terraform Format
        run: terraform fmt -check -recursive
        
      - name: Terraform Validate
        run: |
          terraform init -backend=false
          terraform validate
          
      - name: TFLint
        uses: terraform-linters/setup-tflint@v4
        
      - name: Run TFLint
        run: tflint --recursive

  plan:
    needs: validate
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, production]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      
      - name: Terraform Plan
        run: |
          cd environments/${{ matrix.environment }}
          terraform init
          terraform plan -out=plan.tfplan
          
      - name: Upload Plan
        uses: actions/upload-artifact@v3
        with:
          name: plan-${{ matrix.environment }}
          path: environments/${{ matrix.environment }}/plan.tfplan

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      
      - name: Download Plan
        uses: actions/download-artifact@v3
        with:
          name: plan-production
          
      - name: Terraform Apply
        run: |
          cd environments/production
          terraform init
          terraform apply -auto-approve plan.tfplan
```

## Common Pitfalls

### 1. Hardcoded Values

```hcl
# Bad
resource "aws_instance" "app" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"
  subnet_id     = "subnet-abcdef"
}

# Good
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  subnet_id     = var.subnet_id
}
```

### 2. Missing Dependencies

```hcl
# Bad - implicit dependency may cause race condition
resource "aws_instance" "app" {
  ami           = data.aws_ami.app.id
  instance_type = "t3.medium"
  
  user_data = "echo ${aws_s3_bucket.config.bucket}"
}

# Good - explicit dependency
resource "aws_instance" "app" {
  ami           = data.aws_ami.app.id
  instance_type = "t3.medium"
  
  user_data = "echo ${aws_s3_bucket.config.bucket}"
  
  depends_on = [aws_s3_bucket.config]
}
```

### 3. Ignoring Drift

```yaml
# Set up scheduled drift detection
name: Drift Detection
on:
  schedule:
    - cron: '0 */4 * * *'

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    steps:
      - name: Terraform Plan
        run: |
          terraform plan -detailed-exitcode
        continue-on-error: true
        id: plan
        
      - name: Alert on Drift
        if: steps.plan.outputs.exitcode == 2
        run: |
          # Send alert to Slack
          curl -X POST $SLACK_WEBHOOK -d '{"text":"Drift detected!"}'
```

### 4. Monolithic State

```hcl
# Bad - everything in one state
# All resources in a single terraform apply

# Good - logical separation
# networking/ - VPCs, subnets, routing
# compute/ - EKS clusters, node groups
# data/ - RDS, ElastiCache
# security/ - IAM, KMS
```
