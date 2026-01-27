# Fullstack Development Guide

Comprehensive guidelines for building cohesive full-stack web applications.

---

## Overview

This guide applies to:
- Monolithic full-stack applications
- Full-stack frameworks (Next.js, Nuxt, SvelteKit, Remix)
- Separate frontend/backend codebases sharing types
- JAMstack with serverless backends

### Key Principles

1. **Unified Type System** - Share types between frontend and backend
2. **Clear Boundaries** - Maintain separation between client and server
3. **API-First Thinking** - Design the contract first
4. **End-to-End Testing** - Test the full user journey

### Project Structure

**Monorepo:**
```
packages/
├── shared/           # Shared types, validation, utilities
├── web/              # Frontend application
├── api/              # Backend API
└── e2e/              # End-to-end tests
```

**Full-Stack Framework:**
```
src/
├── app/              # Pages and routing
├── components/       # React components
├── lib/
│   ├── client/       # Client-only code
│   ├── server/       # Server-only code
│   └── shared/       # Isomorphic code
└── types/            # TypeScript definitions
```

---

## Architecture

### Architectural Layers

```
Presentation → Application → Domain ← Infrastructure
```

- **Presentation**: Components, pages, UI
- **Application**: Route handlers, request validation
- **Domain**: Business rules, pure functions
- **Infrastructure**: Database, external APIs

### Server vs Client Components

**Server Components** (default):
```tsx
// Direct database access, no interactivity
export default async function UsersPage() {
  const users = await db.user.findMany();
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**Client Components**:
```tsx
'use client';
// Interactivity, hooks, browser APIs
export function UserForm({ onSubmit }) {
  const [name, setName] = useState('');
  return <form onSubmit={...}>...</form>;
}
```

### Data Flow

```
User Action → Component → API Request → Server Handler
     ↓                                         ↓
  UI Update ← State ← API Response ← Database
```

---

## API Contracts

### Schema-Driven Development

```ts
// shared/schemas/user.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
```

### Use on Backend

```ts
app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ error: result.error });
  }
  const user = await createUser(result.data);
  res.status(201).json({ data: user });
});
```

### Use on Frontend

```ts
export const usersApi = {
  async create(data: CreateUserRequest): Promise<UserResponse> {
    const validated = CreateUserSchema.parse(data);
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
    return (await response.json()).data;
  },
};
```

---

## Shared Types

### Monorepo Setup

```ts
// packages/shared/src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt'>;
```

### Using Shared Types

```ts
// In API
import { User, CreateUserInput } from '@myapp/shared';

// In Web
import { User, CreateUserInput } from '@myapp/shared';
```

### Validation Schemas

```ts
// shared/validation/user.ts
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### Error Types

```ts
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
```

---

## State Synchronization

### Optimistic Updates

```tsx
'use client';
import { useOptimistic } from 'react';

export function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  );

  async function handleAdd(formData) {
    addOptimisticTodo({ id: 'temp', title: formData.get('title') });
    await addTodo(formData);
  }
}
```

### Cache Invalidation

```ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateUser(id: string, data) {
  await db.user.update({ where: { id }, data });
  revalidatePath(`/users/${id}`);
}
```

---

## Testing

### Testing Pyramid

1. **E2E Tests**: Critical user flows
2. **Integration Tests**: API + DB, components + API
3. **Unit Tests**: Pure functions, isolated logic

### E2E Tests

```ts
test('user can sign up and access dashboard', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

### Integration Tests

```ts
describe('User Management', () => {
  it('creates user and returns in list', async () => {
    const createRes = await request(app)
      .post('/api/users')
      .send({ email: 'new@example.com', name: 'New User' });

    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/api/users');
    expect(listRes.body.data).toContainEqual(
      expect.objectContaining({ email: 'new@example.com' })
    );
  });
});
```

### Contract Tests

```ts
describe('User API Contract', () => {
  it('returns valid UserResponse', async () => {
    const response = await request(app).get('/api/users');

    for (const user of response.body.data) {
      const result = UserResponseSchema.safeParse(user);
      expect(result.success).toBe(true);
    }
  });
});
```

### Test Data Factories

```ts
import { faker } from '@faker-js/faker';

export const createUserInput = (overrides?) => ({
  email: faker.internet.email(),
  name: faker.person.fullName(),
  ...overrides,
});
```

---

## Error Handling

### Server-Side

```ts
export async function GET(request, { params }) {
  const user = await db.user.findUnique({ where: { id: params.id } });

  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: user });
}
```

### Client-Side

```tsx
export function UserProfile({ userId }) {
  const { data, error, isLoading } = useQuery(['user', userId], () =>
    fetch(`/api/users/${userId}`).then(res => res.json())
  );

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  return <UserCard user={data.data} />;
}
```

---

## Definition of Done

A fullstack feature is complete when:

- [ ] Types shared between frontend and backend
- [ ] API contract documented
- [ ] Frontend renders correctly
- [ ] Backend handles all edge cases
- [ ] Validation consistent on both sides
- [ ] Loading and error states handled
- [ ] E2E tests cover critical paths
- [ ] No TypeScript errors
- [ ] Performance acceptable
- [ ] Code reviewed and approved
