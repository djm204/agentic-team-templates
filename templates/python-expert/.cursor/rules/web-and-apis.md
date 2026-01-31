# Python Web and APIs

Patterns for building production-grade web services and APIs in Python.

## FastAPI

### Application Structure

```python
from fastapi import FastAPI, Depends, HTTPException, status
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.db = await create_pool(settings.database_url)
    yield
    # Shutdown
    await app.state.db.close()

app = FastAPI(
    title="My Service",
    version="1.0.0",
    lifespan=lifespan,
)
```

### Dependency Injection

```python
from fastapi import Depends
from typing import Annotated

async def get_db(request: Request) -> AsyncGenerator[Database, None]:
    async with request.app.state.db.acquire() as conn:
        yield Database(conn)

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Database, Depends(get_db)],
) -> User:
    user = await db.get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

# Type alias for common dependencies
CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Database, Depends(get_db)]

@app.get("/users/me")
async def get_me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)
```

### Request/Response Models

```python
from pydantic import BaseModel, Field, EmailStr, ConfigDict

class CreateUserRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    role: Literal["admin", "user"] = "user"

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    created_at: datetime

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
```

### Error Handling

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code

class NotFoundError(AppError):
    def __init__(self, entity: str, id: str) -> None:
        super().__init__(f"{entity} not found: {id}", status_code=404)

class ValidationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=400)

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )
```

### Middleware

```python
from starlette.middleware.base import BaseHTTPMiddleware
import time

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration = time.monotonic() - start
        response.headers["X-Process-Time"] = f"{duration:.4f}"
        return response

app.add_middleware(TimingMiddleware)
```

## Django Patterns

### Fat Models, Thin Views

```python
# Business logic lives in models and services, not views
class Order(models.Model):
    status = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def can_cancel(self) -> bool:
        return self.status in ("pending", "confirmed")

    def cancel(self) -> None:
        if not self.can_cancel():
            raise ValueError(f"Cannot cancel order in {self.status} state")
        self.status = "cancelled"
        self.save()

# Views are thin — delegate to models/services
class OrderCancelView(View):
    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        try:
            order.cancel()
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)
        return JsonResponse({"status": "cancelled"})
```

### QuerySet Optimization

```python
# Select only needed fields
users = User.objects.only("id", "name", "email")

# Prefetch related objects to avoid N+1 queries
orders = Order.objects.select_related("user").prefetch_related("items")

# Use exists() instead of count() for boolean checks
if Order.objects.filter(user=user, status="pending").exists():
    ...

# Use iterator() for large querysets
for user in User.objects.all().iterator(chunk_size=1000):
    process(user)
```

## Configuration

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    redis_url: str = "redis://localhost:6379"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    allowed_origins: list[str] = ["http://localhost:3000"]

# Validate at import time — fail fast
settings = Settings()
```

## Observability

```python
import structlog

# Structured logging
logger = structlog.get_logger()

logger.info(
    "request_completed",
    method=request.method,
    path=request.url.path,
    status=response.status_code,
    duration_ms=round(duration * 1000, 2),
    request_id=request.state.request_id,
)

# Never log sensitive data (passwords, tokens, PII)
# Never log at ERROR for expected conditions (404, validation failures)
```

## Anti-Patterns

```python
# Never: Business logic in views/routes
@app.post("/orders")
async def create_order(data: OrderInput, db: DB) -> OrderResponse:
    # Don't put 50 lines of business logic here
    # Delegate to a service
    return await order_service.create(data)

# Never: Raw SQL without parameterization
cursor.execute(f"SELECT * FROM users WHERE id = '{user_id}'")  # SQL INJECTION
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))  # Safe

# Never: Synchronous HTTP calls in async handlers
response = requests.get(url)  # Blocks the event loop
response = await httpx_client.get(url)  # Non-blocking
```
