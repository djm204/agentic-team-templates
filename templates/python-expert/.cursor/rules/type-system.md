# Python Type System

Modern Python is typed Python. Type hints enable tooling, prevent bugs, and serve as living documentation. `mypy --strict` is the baseline.

## Core Typing

### Function Signatures

```python
from collections.abc import Sequence, Mapping, Callable, Awaitable, Iterator
from typing import Any, TypeVar, overload

# All parameters and return types annotated
def process_items(
    items: Sequence[Item],
    *,
    transform: Callable[[Item], Result],
    max_retries: int = 3,
) -> list[Result]:
    ...

# Use None return type explicitly
def log_event(event: Event) -> None:
    logger.info("event", extra={"event": event})

# Async functions
async def fetch_user(user_id: str) -> User | None:
    ...
```

### Modern Syntax (3.10+)

```python
# Union types with |
def parse(value: str | int) -> Data:
    ...

# Optional is just T | None
def find_user(email: str) -> User | None:
    ...

# Built-in generics — no need to import List, Dict, etc.
names: list[str] = []
config: dict[str, Any] = {}
coordinates: tuple[float, float] = (0.0, 0.0)
```

### TypeVar and Generics

```python
from typing import TypeVar, Generic

T = TypeVar("T")

# Generic container
class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

# Bounded TypeVar
from typing import SupportsFloat
N = TypeVar("N", bound=SupportsFloat)

def average(values: Sequence[N]) -> float:
    return sum(float(v) for v in values) / len(values)

# Python 3.12+ syntax
def first[T](items: Sequence[T]) -> T:
    return items[0]

class Stack[T]:
    ...
```

### Protocol (Structural Subtyping)

```python
from typing import Protocol, runtime_checkable

# Define what you need, not what you depend on
class Renderable(Protocol):
    def render(self) -> str: ...

class HTMLWidget:
    def render(self) -> str:
        return "<div>widget</div>"

# HTMLWidget satisfies Renderable without inheriting from it
def display(item: Renderable) -> None:
    print(item.render())

display(HTMLWidget())  # Works — structural match

# runtime_checkable for isinstance() checks
@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None: ...

if isinstance(resource, Closeable):
    resource.close()
```

### TypedDict

```python
from typing import TypedDict, Required, NotRequired

class UserDict(TypedDict):
    id: str
    email: str
    name: Required[str]
    bio: NotRequired[str]

# Useful for JSON responses, config dicts, and legacy code
# Prefer dataclasses/Pydantic for new code
```

### Literal and Final

```python
from typing import Literal, Final

# Restrict to specific values
def set_log_level(level: Literal["debug", "info", "warn", "error"]) -> None:
    ...

# Constants that shouldn't be reassigned
MAX_RETRIES: Final = 3
API_VERSION: Final[str] = "v2"
```

### Overloads

```python
from typing import overload

@overload
def get(key: str, default: None = None) -> str | None: ...
@overload
def get(key: str, default: str) -> str: ...

def get(key: str, default: str | None = None) -> str | None:
    value = store.get(key)
    return value if value is not None else default
```

## mypy Configuration

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true

# Per-module overrides for third-party libs without stubs
[[tool.mypy.overrides]]
module = "some_untyped_lib.*"
ignore_missing_imports = true
```

## Anti-Patterns

```python
# Never: Any as a crutch
def process(data: Any) -> Any:  # This is just untyped Python with extra steps
    ...

# Never: type: ignore without explanation
result = sketchy_call()  # type: ignore
# Better:
result = sketchy_call()  # type: ignore[no-untyped-call]  # library lacks stubs

# Never: Mutable default in typed signatures
def append_to(item: str, target: list[str] = []) -> list[str]:  # BUG
    ...
# Fix:
def append_to(item: str, target: list[str] | None = None) -> list[str]:
    if target is None:
        target = []
    target.append(item)
    return target

# Never: cast() to lie to the type checker
from typing import cast
user = cast(User, random_dict)  # This doesn't validate anything at runtime
# Use Pydantic or manual validation instead
```
