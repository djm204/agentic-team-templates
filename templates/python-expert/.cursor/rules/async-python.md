# Async Python

Python's `asyncio` enables concurrent I/O-bound operations on a single thread. Understanding the event loop, coroutines, and task lifecycle is essential for building high-performance async services.

## Fundamentals

### Coroutines and Tasks

```python
import asyncio

# A coroutine is defined with async def
async def fetch_data(url: str) -> bytes:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.read()

# Coroutines don't run until awaited or wrapped in a task
coro = fetch_data("https://example.com")  # Nothing happens yet
data = await coro  # Now it runs

# Tasks run concurrently on the event loop
async def fetch_all(urls: list[str]) -> list[bytes]:
    tasks = [asyncio.create_task(fetch_data(url)) for url in urls]
    return await asyncio.gather(*tasks)
```

### asyncio.gather vs TaskGroup

```python
# gather — returns results in order, continues on individual failures (by default)
results = await asyncio.gather(
    fetch_users(),
    fetch_posts(),
    fetch_comments(),
)
users, posts, comments = results

# TaskGroup (3.11+) — structured concurrency, cancels all on first failure
async with asyncio.TaskGroup() as tg:
    user_task = tg.create_task(fetch_users())
    post_task = tg.create_task(fetch_posts())

# All tasks complete or all cancelled if one fails
users = user_task.result()
posts = post_task.result()
```

### Timeouts

```python
# asyncio.timeout (3.11+)
async with asyncio.timeout(5.0):
    data = await fetch_data(url)

# asyncio.wait_for (older approach)
try:
    data = await asyncio.wait_for(fetch_data(url), timeout=5.0)
except asyncio.TimeoutError:
    logger.warning("fetch timed out", extra={"url": url})
    raise
```

### Bounded Concurrency

```python
# Semaphore for limiting concurrent operations
async def fetch_all(urls: list[str], max_concurrent: int = 10) -> list[Response]:
    semaphore = asyncio.Semaphore(max_concurrent)

    async def bounded_fetch(url: str) -> Response:
        async with semaphore:
            return await fetch(url)

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(bounded_fetch(url)) for url in urls]

    return [task.result() for task in tasks]
```

## Async Generators and Iteration

```python
from collections.abc import AsyncIterator

# Async generator
async def stream_records(query: str) -> AsyncIterator[Record]:
    async with db.execute(query) as cursor:
        async for row in cursor:
            yield Record.from_row(row)

# Async for loop
async for record in stream_records("SELECT * FROM events"):
    await process(record)

# Async comprehension
results = [item async for item in stream_records(query) if item.is_valid()]
```

## Async Context Managers

```python
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

@asynccontextmanager
async def managed_pool(url: str, size: int = 10) -> AsyncIterator[Pool]:
    pool = await create_pool(url, max_size=size)
    try:
        yield pool
    finally:
        await pool.close()

async def main() -> None:
    async with managed_pool("postgresql://localhost/db") as pool:
        async with pool.acquire() as conn:
            result = await conn.fetch("SELECT 1")
```

## Event Loop Patterns

```python
# Main entry point
async def main() -> None:
    ...

if __name__ == "__main__":
    asyncio.run(main())

# Running blocking code in async context
import functools

async def process_file(path: Path) -> Data:
    # Run CPU-bound or blocking I/O in a thread pool
    loop = asyncio.get_running_loop()
    data = await loop.run_in_executor(
        None,  # Default ThreadPoolExecutor
        functools.partial(parse_file, path),
    )
    return data
```

## Graceful Shutdown

```python
import signal

async def main() -> None:
    loop = asyncio.get_running_loop()

    shutdown_event = asyncio.Event()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, shutdown_event.set)

    server = await start_server()

    await shutdown_event.wait()

    logger.info("shutting down")
    await server.stop()
    # Clean up resources
```

## Async Testing

```python
import pytest

@pytest.mark.asyncio
async def test_fetch_user() -> None:
    service = UserService(fake_repo)
    user = await service.get_by_id("123")
    assert user.name == "Alice"

# Fixtures
@pytest.fixture
async def db_pool():
    pool = await create_pool(TEST_DATABASE_URL)
    yield pool
    await pool.close()

@pytest.fixture
async def service(db_pool):
    return UserService(UserRepo(db_pool))
```

## Anti-Patterns

```python
# Never: Blocking calls in async code
async def bad_handler(request: Request) -> Response:
    data = requests.get(url)  # Blocks the event loop!
    time.sleep(1)              # Blocks the event loop!
    # Use aiohttp and asyncio.sleep() instead

# Never: Creating event loops manually (unless you're a framework author)
loop = asyncio.new_event_loop()  # Use asyncio.run() instead

# Never: Fire-and-forget tasks without error handling
asyncio.create_task(background_work())  # Who catches the exception?
# Better:
task = asyncio.create_task(background_work())
task.add_done_callback(handle_task_exception)

# Never: Mixing sync and async without run_in_executor
async def handler():
    result = cpu_bound_work()  # Blocks event loop
    # Use: result = await loop.run_in_executor(None, cpu_bound_work)

# Never: Unbounded task spawning
for item in million_items:
    asyncio.create_task(process(item))  # OOM risk — use semaphore
```
