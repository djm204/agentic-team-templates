# Python Patterns and Idioms

Idiomatic Python leverages the language's strengths — duck typing, protocols, generators, decorators, and the data model. Write Pythonic code, not Java-in-Python.

## Data Model (Dunder Methods)

```python
from functools import total_ordering

@total_ordering
@dataclass(frozen=True, slots=True)
class Money:
    amount: Decimal
    currency: str

    def __add__(self, other: Money) -> Money:
        if self.currency != other.currency:
            raise ValueError(f"Cannot add {self.currency} and {other.currency}")
        return Money(self.amount + other.amount, self.currency)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Money):
            return NotImplemented
        return self.amount == other.amount and self.currency == other.currency

    def __lt__(self, other: Money) -> bool:
        if self.currency != other.currency:
            raise ValueError(f"Cannot compare {self.currency} and {other.currency}")
        return self.amount < other.amount

    def __str__(self) -> str:
        return f"{self.currency} {self.amount:.2f}"

    def __repr__(self) -> str:
        return f"Money(amount={self.amount!r}, currency={self.currency!r})"

    def __bool__(self) -> bool:
        return self.amount != 0
```

## Generators and Iterators

```python
from collections.abc import Iterator, Generator

# Generators for lazy evaluation — process one item at a time
def read_large_file(path: Path) -> Iterator[str]:
    with open(path) as f:
        for line in f:
            yield line.strip()

# Generator expressions over list comprehensions when you iterate once
total = sum(order.total for order in orders)  # No intermediate list

# Generator pipelines
def pipeline(path: Path) -> Iterator[Record]:
    lines = read_large_file(path)
    parsed = (parse_record(line) for line in lines)
    valid = (record for record in parsed if record.is_valid())
    yield from valid

# itertools for complex iteration
from itertools import chain, islice, groupby, batched

# Process in batches (3.12+)
for batch in batched(items, 100):
    process_batch(batch)

# Chain multiple iterables
for item in chain(list_a, list_b, list_c):
    process(item)
```

## Decorators

```python
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

# Properly typed decorator that preserves signatures
def retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_error: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        time.sleep(delay * (2 ** attempt))
            raise last_error  # type: ignore[misc]
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def call_api(url: str) -> Response:
    ...

# Class-based decorator for complex state
class CachedProperty:
    """Descriptor that caches the result of a method call."""
    def __init__(self, func: Callable[..., Any]) -> None:
        self.func = func
        self.attrname: str | None = None

    def __set_name__(self, owner: type, name: str) -> None:
        self.attrname = name

    def __get__(self, obj: Any, objtype: type | None = None) -> Any:
        if obj is None:
            return self
        assert self.attrname is not None
        cache = obj.__dict__
        if self.attrname not in cache:
            cache[self.attrname] = self.func(obj)
        return cache[self.attrname]

# Or just use functools.cached_property — it's built in
```

## Context Managers

```python
from contextlib import contextmanager, asynccontextmanager

# Synchronous context manager
@contextmanager
def timed_operation(name: str) -> Iterator[None]:
    start = time.monotonic()
    try:
        yield
    finally:
        elapsed = time.monotonic() - start
        logger.info(f"{name} took {elapsed:.3f}s")

with timed_operation("database query"):
    results = db.execute(query)

# Async context manager
@asynccontextmanager
async def managed_connection(url: str) -> AsyncIterator[Connection]:
    conn = await connect(url)
    try:
        yield conn
    finally:
        await conn.close()

# contextlib.suppress for intentionally ignored exceptions
from contextlib import suppress

with suppress(FileNotFoundError):
    os.remove(temp_file)

# ExitStack for dynamic resource management
from contextlib import ExitStack

with ExitStack() as stack:
    files = [stack.enter_context(open(f)) for f in file_paths]
    process_all(files)
```

## Descriptors

```python
# Descriptors power properties, classmethods, staticmethods
class Validated:
    """Descriptor that validates on assignment."""
    def __init__(self, validator: Callable[[Any], bool], message: str) -> None:
        self.validator = validator
        self.message = message
        self.attr_name = ""

    def __set_name__(self, owner: type, name: str) -> None:
        self.attr_name = name

    def __set__(self, obj: Any, value: Any) -> None:
        if not self.validator(value):
            raise ValueError(f"{self.attr_name}: {self.message}")
        obj.__dict__[self.attr_name] = value

    def __get__(self, obj: Any, objtype: type | None = None) -> Any:
        if obj is None:
            return self
        return obj.__dict__.get(self.attr_name)

class User:
    name = Validated(lambda v: isinstance(v, str) and len(v) > 0, "must be non-empty string")
    age = Validated(lambda v: isinstance(v, int) and 0 <= v <= 150, "must be 0-150")
```

## collections Module

```python
from collections import defaultdict, Counter, deque, OrderedDict

# defaultdict — avoid KeyError boilerplate
word_counts: defaultdict[str, int] = defaultdict(int)
for word in words:
    word_counts[word] += 1

# Counter — counting and most common
counter = Counter(words)
top_10 = counter.most_common(10)

# deque — O(1) append/pop from both ends
recent: deque[Event] = deque(maxlen=100)
recent.append(event)  # Oldest auto-evicted when full

# Named tuples for lightweight immutable records (prefer dataclasses for new code)
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float
```

## Anti-Patterns

```python
# Never: Mutable default arguments
def append(item, target=[]):  # Shared across all calls!
    target.append(item)
    return target

# Never: Bare except
try:
    risky()
except:  # Catches KeyboardInterrupt, SystemExit — everything
    pass

# Never: String formatting with % or .format() for f-string-eligible code
name = "world"
greeting = f"hello, {name}"  # Not "hello, %s" % name

# Never: Using type() for type checks
if type(x) == int:  # Fails for subclasses
    ...
if isinstance(x, int):  # Correct
    ...

# Never: Global mutable state
_cache = {}  # Module-level mutable dict — test nightmare

# Never: Star imports
from os.path import *  # Pollutes namespace, hides origins
```
