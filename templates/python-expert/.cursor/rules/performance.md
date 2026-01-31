# Python Performance

Python is not the fastest language. It doesn't need to be. Know where the bottlenecks are, profile before optimizing, and reach for the right tool when raw speed matters.

## Profile First

```python
# cProfile for function-level profiling
import cProfile
cProfile.run("main()", sort="cumulative")

# line_profiler for line-by-line analysis
# @profile decorator (after pip install line-profiler)
# kernprof -l -v script.py

# memory_profiler for memory usage
# @profile decorator (after pip install memory-profiler)
# python -m memory_profiler script.py

# py-spy for production profiling without code changes
# py-spy record -o profile.svg -- python myapp.py

# timeit for micro-benchmarks
import timeit
timeit.timeit("sorted(data)", globals={"data": list(range(1000))}, number=10000)
```

## Data Structures

```python
# Choose the right data structure for the access pattern

# dict — O(1) lookup, insertion, deletion
# Use when: key-value mapping with frequent lookups
cache: dict[str, Result] = {}

# set — O(1) membership testing
# Use when: uniqueness checks, set operations
seen: set[str] = set()
if item_id not in seen:
    process(item)
    seen.add(item_id)

# deque — O(1) append/pop from both ends
# Use when: queue, sliding window, bounded history
from collections import deque
recent_events: deque[Event] = deque(maxlen=1000)

# heapq — O(log n) push/pop for priority queue
# Use when: top-N, scheduling, priority processing
import heapq
top_10 = heapq.nlargest(10, items, key=lambda x: x.score)

# bisect — O(log n) search in sorted lists
# Use when: maintaining sorted order with insertions
import bisect
bisect.insort(sorted_list, new_item)
```

## Avoiding Common Bottlenecks

```python
# String concatenation — use join, not +=
# Bad: O(n²) — creates new string each iteration
result = ""
for chunk in chunks:
    result += chunk

# Good: O(n)
result = "".join(chunks)

# List comprehensions over loops for simple transforms
# Good: Faster due to C-level optimization
squares = [x * x for x in range(1000)]

# Generator expressions when you don't need the full list
total = sum(x * x for x in range(1_000_000))  # No intermediate list

# dict.get() over try/except for missing keys (in tight loops)
value = mapping.get(key, default)

# Local variable lookup is faster than global/attribute
# In hot loops, alias frequently accessed attributes
append = result.append  # Local lookup in loop body
for item in items:
    append(transform(item))
```

## Concurrency Models

```python
# I/O-bound: asyncio or threading
# CPU-bound: multiprocessing or native extensions

# Threading for I/O parallelism (GIL is released during I/O)
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(fetch_url, urls))

# Multiprocessing for CPU parallelism (bypasses GIL)
from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor() as executor:
    results = list(executor.map(cpu_intensive_work, data_chunks))

# asyncio for high-concurrency I/O (thousands of connections)
# See async-python.md for patterns
```

## Caching

```python
from functools import lru_cache, cache

# lru_cache for expensive pure function calls
@lru_cache(maxsize=256)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# cache (3.9+) — unlimited cache, simpler API
@cache
def load_schema(name: str) -> Schema:
    return Schema.from_file(f"schemas/{name}.json")

# Manual caching with TTL
from time import monotonic

class TTLCache:
    def __init__(self, ttl: float) -> None:
        self._cache: dict[str, tuple[float, Any]] = {}
        self._ttl = ttl

    def get(self, key: str) -> Any | None:
        if key in self._cache:
            expiry, value = self._cache[key]
            if monotonic() < expiry:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        self._cache[key] = (monotonic() + self._ttl, value)
```

## Slots and Memory

```python
# __slots__ reduces memory per instance and speeds up attribute access
@dataclass(slots=True)
class Point:
    x: float
    y: float

# Without slots: ~200 bytes per instance (dict overhead)
# With slots: ~56 bytes per instance
# Matters when you have millions of instances

# sys.getsizeof for memory inspection
import sys
sys.getsizeof(my_object)

# tracemalloc for tracking allocations
import tracemalloc
tracemalloc.start()
# ... run code ...
snapshot = tracemalloc.take_snapshot()
for stat in snapshot.statistics("lineno")[:10]:
    print(stat)
```

## When Python Isn't Fast Enough

```python
# 1. NumPy/Pandas for vectorized numeric operations
import numpy as np
result = np.sum(array * weights)  # C-level loop, orders of magnitude faster

# 2. Polars for DataFrames (faster than Pandas, Rust backend)
import polars as pl
df.filter(pl.col("age") > 30).group_by("city").agg(pl.col("salary").mean())

# 3. Cython or mypyc for compiling Python to C
# 4. PyO3/maturin for writing critical paths in Rust
# 5. ctypes/cffi for calling existing C libraries
```

## Anti-Patterns

```python
# Never: Premature optimization
# Profile first. The bottleneck is almost never where you think.

# Never: Optimizing readability away
# A 10% speedup that makes code unmaintainable is a net loss.

# Never: Global imports of large modules in hot paths
def process():
    import pandas as pd  # Import overhead on every call
# Import at module level instead

# Never: Creating regex objects in loops
for line in lines:
    match = re.search(r"pattern", line)  # Recompiles every iteration
# Compile once: pattern = re.compile(r"pattern")
```
