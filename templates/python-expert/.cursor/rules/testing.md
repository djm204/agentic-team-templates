# Python Testing

pytest is the standard. Tests are not optional. Every behavior has a test. Every bug fix starts with a failing test.

## Fundamentals

### Test Structure

```python
# Arrange-Act-Assert
def test_user_creation() -> None:
    # Arrange
    repo = FakeUserRepo()
    service = UserService(repo)
    input_data = CreateUserInput(name="Alice", email="alice@example.com")

    # Act
    user = service.create(input_data)

    # Assert
    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    assert user.id is not None
```

### Naming

```python
# Test names describe the scenario and expected outcome
def test_create_user_with_valid_input_returns_user() -> None: ...
def test_create_user_with_duplicate_email_raises_conflict() -> None: ...
def test_create_user_with_empty_name_raises_validation_error() -> None: ...

# Not:
def test_create() -> None: ...  # Create what? What scenario?
def test_1() -> None: ...       # Meaningless
```

## Fixtures

```python
import pytest

@pytest.fixture
def user_repo() -> FakeUserRepo:
    return FakeUserRepo()

@pytest.fixture
def user_service(user_repo: FakeUserRepo) -> UserService:
    return UserService(user_repo)

@pytest.fixture
def sample_user() -> User:
    return User(id="123", name="Alice", email="alice@example.com")

# Fixtures with cleanup
@pytest.fixture
def temp_db():
    db = create_test_database()
    yield db
    db.drop()

# Session-scoped fixtures for expensive setup
@pytest.fixture(scope="session")
def docker_postgres():
    container = start_postgres_container()
    yield container.connection_string
    container.stop()
```

## Parametrize

```python
@pytest.mark.parametrize(
    "input_str, expected",
    [
        ("hello world", "hello-world"),
        ("  spaces  ", "spaces"),
        ("UPPER CASE", "upper-case"),
        ("special!@#chars", "specialchars"),
        ("already-slugified", "already-slugified"),
        ("", ""),
    ],
)
def test_slugify(input_str: str, expected: str) -> None:
    assert slugify(input_str) == expected

# Parametrize with IDs for clear test output
@pytest.mark.parametrize(
    "status_code, expected_error",
    [
        pytest.param(400, ValidationError, id="bad-request"),
        pytest.param(404, NotFoundError, id="not-found"),
        pytest.param(500, ServerError, id="server-error"),
    ],
)
def test_error_mapping(status_code: int, expected_error: type[Exception]) -> None:
    with pytest.raises(expected_error):
        handle_response(MockResponse(status_code))
```

## Testing Exceptions

```python
def test_division_by_zero_raises_value_error() -> None:
    with pytest.raises(ValueError, match="divisor must be non-zero"):
        divide(10, 0)

def test_missing_config_key_raises_key_error() -> None:
    config = Config({})
    with pytest.raises(KeyError) as exc_info:
        config.get_required("missing_key")
    assert "missing_key" in str(exc_info.value)
```

## Mocking

```python
from unittest.mock import Mock, AsyncMock, patch, MagicMock

# Prefer dependency injection over patching
# Good: Inject the dependency
class UserService:
    def __init__(self, repo: UserRepository, notifier: Notifier) -> None:
        self.repo = repo
        self.notifier = notifier

def test_create_user_sends_notification() -> None:
    repo = FakeUserRepo()
    notifier = Mock(spec=Notifier)

    service = UserService(repo, notifier)
    service.create(CreateUserInput(name="Alice", email="a@b.com"))

    notifier.send_welcome.assert_called_once_with("a@b.com")

# When you must patch (third-party code, module-level functions)
@patch("mypackage.services.user_service.send_email")
def test_sends_email_on_signup(mock_send: Mock) -> None:
    service = UserService(FakeUserRepo())
    service.signup(email="test@example.com")
    mock_send.assert_called_once_with(to="test@example.com", template="welcome")

# Async mocking
async def test_async_fetch() -> None:
    client = AsyncMock(spec=HttpClient)
    client.get.return_value = Response(status=200, body=b'{"ok": true}')

    result = await fetch_data(client, "/api/data")
    assert result == {"ok": True}
```

## Integration Testing

```python
import pytest
from httpx import AsyncClient

@pytest.fixture
async def app():
    """Create test application with test database."""
    test_app = create_app(testing=True)
    async with test_app.lifespan():
        yield test_app

@pytest.fixture
async def client(app) -> AsyncClient:
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_and_retrieve_user(client: AsyncClient) -> None:
    # Create
    response = await client.post("/users", json={"name": "Alice", "email": "a@b.com"})
    assert response.status_code == 201
    user_id = response.json()["id"]

    # Retrieve
    response = await client.get(f"/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Alice"
```

## Snapshot Testing

```python
# Using syrupy or inline-snapshot
def test_api_response_format(snapshot) -> None:
    response = generate_api_response(sample_data)
    assert response == snapshot
```

## conftest.py Patterns

```python
# tests/conftest.py — shared across all tests
import pytest

@pytest.fixture(autouse=True)
def _reset_singletons():
    """Reset module-level singletons between tests."""
    yield
    SingletonClass._instance = None

@pytest.fixture
def freeze_time():
    """Fixture that freezes time for deterministic tests."""
    from freezegun import freeze_time
    with freeze_time("2025-01-01T12:00:00Z") as frozen:
        yield frozen
```

## Anti-Patterns

```python
# Never: Tests that depend on execution order
# Each test must be independently runnable

# Never: Assertions without messages in complex tests
assert result  # What is result? What did we expect?
# Better:
assert result.status == "active", f"Expected active, got {result.status}"

# Never: Testing implementation details
assert service._internal_cache == {"key": "value"}  # Private API!
# Test through the public interface

# Never: Excessive mocking
# If you're mocking 5+ dependencies, the unit is too large — refactor

# Never: time.sleep() for synchronization in tests
time.sleep(1)  # Slow AND flaky
# Use polling, events, or mock the clock

# Never: Tests without assertions
def test_user_creation() -> None:
    service.create_user(data)  # What are we verifying? Nothing.
```
