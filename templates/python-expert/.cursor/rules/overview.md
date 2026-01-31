# Python Expert

Guidelines for principal-level Python engineering. Idiomatic Python, production systems, and deep interpreter knowledge.

## Scope

This ruleset applies to:
- Web services and APIs (Django, FastAPI, Flask)
- CLI tools and automation scripts
- Data processing and ETL pipelines
- Libraries and packages published to PyPI
- Machine learning infrastructure
- System administration and DevOps tooling
- Async services and event-driven architectures

## Core Philosophy

Python's power is in its clarity. The best Python code reads like well-written prose.

- **Readability counts.** The Zen of Python isn't decoration — it's the engineering standard. `import this` and mean it.
- **Explicit is better than implicit.** Type hints, clear names, no magic. If you need a comment to explain what a variable holds, rename the variable.
- **Simple is better than complex.** A straightforward `for` loop that's obvious beats a clever one-liner that requires a decoder ring.
- **Errors should never pass silently.** Bare `except:` is a bug. Swallowing exceptions hides the failures that will wake you up at 3 AM.
- **The standard library is rich — use it.** `collections`, `itertools`, `pathlib`, `dataclasses`, `contextlib`, `functools` — know them deeply before reaching for PyPI.
- **If you don't know, say so.** Python's ecosystem is vast. Admitting uncertainty about a niche library or CPython internal is honest and professional.

## Key Principles

### 1. Type Hints Are Not Optional

```python
# Modern Python is typed Python. Type hints are documentation,
# tooling enablement, and bug prevention.

# Good: Fully typed function signatures
def fetch_users(
    db: Database,
    *,
    limit: int = 100,
    active_only: bool = True,
) -> list[User]:
    ...

# Good: Complex types with type aliases
type UserMap = dict[UserId, User]
type Handler = Callable[[Request], Awaitable[Response]]

# Bad: No type information
def fetch_users(db, limit=100, active_only=True):
    ...  # What does this return? What's db? Nobody knows.
```

### 2. Dataclasses and Pydantic Over Raw Dicts

```python
# Good: Structured data with validation
from dataclasses import dataclass, field
from datetime import datetime

@dataclass(frozen=True, slots=True)
class User:
    id: str
    email: str
    name: str
    created_at: datetime = field(default_factory=datetime.now)

# Good: Pydantic for external data validation
from pydantic import BaseModel, EmailStr

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=200)

# Bad: Dict soup
user = {"id": "123", "email": "a@b.com"}  # No validation, no autocomplete, no safety
```

### 3. EAFP Over LBYL

```python
# Easier to Ask Forgiveness than Permission — Pythonic
# Good: Try it and handle the exception
try:
    value = mapping[key]
except KeyError:
    value = default

# Also good: Use .get() when it's clearer
value = mapping.get(key, default)

# Bad: Look Before You Leap (extra lookup, race conditions)
if key in mapping:
    value = mapping[key]  # What if it was deleted between check and access?
```

### 4. Context Managers for Resource Management

```python
# Always use context managers for resources
# Good:
with open("data.json") as f:
    data = json.load(f)

async with aiohttp.ClientSession() as session:
    response = await session.get(url)

# Good: Custom context managers
from contextlib import contextmanager

@contextmanager
def temporary_directory():
    path = Path(tempfile.mkdtemp())
    try:
        yield path
    finally:
        shutil.rmtree(path)
```

## Project Structure

```
project/
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── py.typed            # PEP 561 marker
│       ├── config.py           # Configuration loading
│       ├── exceptions.py       # Custom exceptions
│       ├── models/             # Domain models
│       │   ├── __init__.py
│       │   └── user.py
│       ├── services/           # Business logic
│       │   ├── __init__.py
│       │   └── user_service.py
│       ├── repositories/       # Data access
│       │   ├── __init__.py
│       │   └── user_repo.py
│       └── api/                # HTTP/CLI entry points
│           ├── __init__.py
│           └── routes.py
├── tests/
│   ├── conftest.py             # Shared fixtures
│   ├── unit/
│   │   └── test_user_service.py
│   ├── integration/
│   │   └── test_user_repo.py
│   └── e2e/
│       └── test_api.py
├── pyproject.toml              # Single source of truth for project config
├── Makefile
└── .python-version             # Pin Python version
```

### Layout Rules

- Use `src/` layout — it prevents accidental imports of uninstalled code
- `pyproject.toml` is the single config file — no `setup.py`, no `setup.cfg`, no `requirements.txt` for deps
- Tests mirror source structure but live outside `src/`
- One concern per module — don't dump everything in `utils.py`
- `__init__.py` defines the public API for each package

## Definition of Done

A Python feature is complete when:
- [ ] `mypy --strict` passes with zero errors
- [ ] `ruff check` passes with zero warnings
- [ ] `ruff format --check` passes
- [ ] `pytest` passes with no failures
- [ ] Test coverage covers meaningful behavior (not just lines)
- [ ] Error cases are tested, not just happy paths
- [ ] Docstrings on all public functions and classes
- [ ] No bare `except:` or `except Exception:` without re-raise
- [ ] No mutable default arguments
- [ ] No `# type: ignore` without an inline explanation
