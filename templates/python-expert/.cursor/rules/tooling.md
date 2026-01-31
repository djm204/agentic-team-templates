# Python Tooling

Modern Python tooling is fast, integrated, and opinionated. Use it all.

## Project Configuration

### pyproject.toml (Single Source of Truth)

```toml
[project]
name = "mypackage"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.110",
    "pydantic>=2.0",
    "sqlalchemy>=2.0",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5.0",
    "mypy>=1.10",
    "ruff>=0.4",
    "pre-commit>=3.7",
]

[project.scripts]
myapp = "mypackage.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

## uv (Package Manager)

```bash
# uv is the modern Python package manager — fast, reliable, replaces pip/pip-tools/venv
uv venv                     # Create virtual environment
uv pip install -e ".[dev]"  # Install with dev dependencies
uv pip compile pyproject.toml -o requirements.lock  # Lock dependencies
uv run pytest               # Run in the project's environment
uv tool install ruff        # Install CLI tools globally
```

## Ruff (Linter + Formatter)

```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
    "RUF",  # ruff-specific rules
    "S",    # flake8-bandit (security)
    "DTZ",  # flake8-datetimez
    "PT",   # flake8-pytest-style
    "ERA",  # eradicate (commented-out code)
    "ARG",  # flake8-unused-arguments
    "PTH",  # flake8-use-pathlib
    "PERF", # perflint
]
ignore = [
    "E501",   # line length handled by formatter
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101"]  # Allow assert in tests

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

```bash
ruff check .              # Lint
ruff check --fix .        # Lint with auto-fix
ruff format .             # Format
ruff format --check .     # Check formatting
```

## mypy

```toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
```

```bash
mypy .                    # Type check everything
mypy --strict .           # Strictest mode
```

## pytest

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = [
    "-ra",              # Show summary of all non-passing tests
    "--strict-markers",  # Undefined markers are errors
    "--strict-config",   # Warn about unknown config options
    "-x",               # Stop on first failure during development
]
markers = [
    "integration: marks integration tests",
    "slow: marks slow tests",
]
```

```bash
pytest                           # Run all tests
pytest tests/unit/               # Run subset
pytest -k "test_create"          # Run by name pattern
pytest --cov=mypackage --cov-report=html  # Coverage
pytest -m "not integration"      # Skip integration tests
```

## Coverage

```toml
[tool.coverage.run]
source = ["src/mypackage"]
branch = true

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.",
    "@overload",
    "raise NotImplementedError",
]
```

## Pre-commit

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]
```

## Makefile

```makefile
.PHONY: check test lint format typecheck

check: format lint typecheck test

format:
	ruff format .

lint:
	ruff check .

typecheck:
	mypy .

test:
	pytest --cov=src/mypackage --cov-report=term-missing

test-all:
	pytest -m "" --cov=src/mypackage

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .mypy_cache .ruff_cache dist build *.egg-info
```

## CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv venv && uv pip install -e ".[dev]"
      - run: ruff format --check .
      - run: ruff check .
      - run: mypy .
      - run: pytest --cov --cov-report=xml

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install pip-audit
      - run: pip-audit .
```

## Dependency Hygiene

- **Pin for applications**: exact versions in lock file
- **Range for libraries**: `>=1.0,<2.0` in pyproject.toml
- **Audit regularly**: `pip-audit` for security advisories
- **Minimize dependencies**: every dep is attack surface and maintenance burden
- **Prefer stdlib**: `pathlib` over `os.path`, `dataclasses` over attrs (for simple cases), `tomllib` over `toml`
