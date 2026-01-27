# API Contracts

Defining and maintaining contracts between frontend and backend.

## Why API Contracts Matter

- **Type Safety**: Catch mismatches at compile time
- **Documentation**: Self-documenting API surface
- **Consistency**: Single source of truth
- **Parallel Development**: Frontend and backend can work independently

## Schema-Driven Development

### Define Schemas First

```ts
// shared/schemas/user.ts
import { z } from 'zod';

// Request schemas
export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

export const UpdateUserRequestSchema = CreateUserRequestSchema.partial();

// Response schemas
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string().datetime(),
});

export const UsersListResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

// Infer types from schemas
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
```

### Use on Backend

```ts
// api/routes/users.ts
import { CreateUserRequestSchema, UserResponseSchema } from '@shared/schemas/user';

app.post('/users', async (req, res) => {
  // Validate input
  const parsed = CreateUserRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error });
  }

  const user = await createUser(parsed.data);

  // Validate output (optional but good for catching bugs)
  const response = UserResponseSchema.parse(user);
  res.status(201).json({ data: response });
});
```

### Use on Frontend

```ts
// lib/api/users.ts
import {
  CreateUserRequest,
  UserResponse,
  UsersListResponse,
  CreateUserRequestSchema,
} from '@shared/schemas/user';

export const usersApi = {
  async create(data: CreateUserRequest): Promise<UserResponse> {
    // Validate before sending (catches client-side errors early)
    const validated = CreateUserRequestSchema.parse(data);

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      throw new ApiError(response);
    }

    const json = await response.json();
    return json.data;
  },

  async list(page = 1, limit = 20): Promise<UsersListResponse> {
    const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
    if (!response.ok) throw new ApiError(response);
    return response.json();
  },
};
```

## OpenAPI / Swagger

### Generate from Code

```ts
// Using Zod to OpenAPI
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/users',
  summary: 'Create a new user',
  request: {
    body: {
      content: { 'application/json': { schema: CreateUserRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    422: { description: 'Validation error' },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
export const openApiDoc = generator.generateDocument({
  info: { title: 'Users API', version: '1.0.0' },
});
```

### Manual OpenAPI Spec

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: Users API
  version: 1.0.0

paths:
  /users:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'

components:
  schemas:
    CreateUserRequest:
      type: object
      required: [email, name]
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
          maxLength: 100
```

## Type-Safe API Clients

### Using tRPC

```ts
// server/trpc.ts
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  user: t.router({
    list: t.procedure
      .input(z.object({ page: z.number().default(1) }))
      .query(async ({ input }) => {
        return db.user.findMany({ skip: (input.page - 1) * 20, take: 20 });
      }),

    create: t.procedure
      .input(CreateUserRequestSchema)
      .mutation(async ({ input }) => {
        return db.user.create({ data: input });
      }),
  }),
});

export type AppRouter = typeof appRouter;

// client/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/trpc';

export const trpc = createTRPCReact<AppRouter>();

// Usage in component
const users = trpc.user.list.useQuery({ page: 1 });
const createUser = trpc.user.create.useMutation();
```

### Type-Safe Fetch Wrapper

```ts
// lib/api/client.ts
type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await response.json();

  if ('error' in json) {
    throw new ApiError(json.error.code, json.error.message);
  }

  return json.data;
}

// Typed endpoints
export const api = {
  users: {
    list: () => apiRequest<UsersListResponse>('/users'),
    get: (id: string) => apiRequest<UserResponse>(`/users/${id}`),
    create: (data: CreateUserRequest) =>
      apiRequest<UserResponse>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
```

## Versioning

### URL Versioning

```
/api/v1/users
/api/v2/users
```

### Backwards Compatibility

When evolving APIs:

```ts
// v1 response
interface UserV1 {
  id: string;
  name: string;  // Full name
}

// v2 response (split name)
interface UserV2 {
  id: string;
  firstName: string;
  lastName: string;
  name: string;  // Keep for backwards compatibility
}

// Transformer for v1 clients
const toV1Response = (user: UserV2): UserV1 => ({
  id: user.id,
  name: user.name,
});
```

## Contract Testing

```ts
// Verify backend implements contract correctly
describe('Users API Contract', () => {
  it('POST /users returns valid UserResponse', async () => {
    const response = await request(app)
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test' });

    expect(response.status).toBe(201);

    // Validate against schema
    const result = UserResponseSchema.safeParse(response.body.data);
    expect(result.success).toBe(true);
  });

  it('GET /users returns valid UsersListResponse', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(200);

    const result = UsersListResponseSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });
});
```
