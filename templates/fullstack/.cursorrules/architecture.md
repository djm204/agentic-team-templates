# Fullstack Architecture

Architectural patterns for full-stack applications.

## Architectural Layers

### Presentation Layer (Frontend)
- Components and pages
- State management
- User interactions
- Client-side routing

### Application Layer (API)
- Route handlers
- Request validation
- Authentication/authorization
- Response formatting

### Domain Layer (Business Logic)
- Business rules
- Domain models
- Use cases/services
- Pure functions

### Infrastructure Layer
- Database access
- External API clients
- File storage
- Caching

## Layer Boundaries

### Dependency Direction

Dependencies should point inward (toward domain):

```
Presentation → Application → Domain ← Infrastructure
```

### Example

```ts
// Domain layer (no dependencies on outer layers)
// domain/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
}

export const createUser = async (
  repo: UserRepository,
  input: CreateUserInput
): Promise<User> => {
  // Business logic here
  const validated = validateUserInput(input);
  return repo.create(validated);
};

// Infrastructure layer (implements domain interfaces)
// infrastructure/userRepository.ts
import { db } from './db';
import { UserRepository } from '../domain/user';

export const prismaUserRepository: UserRepository = {
  findById: (id) => db.user.findUnique({ where: { id } }),
  create: (data) => db.user.create({ data }),
};

// Application layer (coordinates domain and infrastructure)
// api/users.ts
import { createUser } from '../domain/user';
import { prismaUserRepository } from '../infrastructure/userRepository';

export const handleCreateUser = async (req, res) => {
  const result = await createUser(prismaUserRepository, req.body);
  res.json({ data: result });
};
```

## Server Components vs Client Components

### Server Components (Default)
- Render on server
- Can access database directly
- No interactivity
- No client-side state

```tsx
// app/users/page.tsx (Server Component)
import { db } from '@/lib/server/db';

export default async function UsersPage() {
  const users = await db.user.findMany();  // Direct DB access

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Client Components
- Run in browser
- Handle interactivity
- Manage client state
- Use hooks

```tsx
// components/UserForm.tsx
'use client';

import { useState } from 'react';

export function UserForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [name, setName] = useState('');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ name });
    }}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Composition Pattern

```tsx
// Server component fetches data
// app/users/[id]/page.tsx
import { db } from '@/lib/server/db';
import { UserEditor } from '@/components/UserEditor';

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await db.user.findUnique({ where: { id: params.id } });

  if (!user) return <NotFound />;

  return (
    <div>
      <h1>Edit User</h1>
      <UserEditor user={user} />  {/* Client component for interactivity */}
    </div>
  );
}
```

## API Patterns

### Server Actions (Full-Stack Frameworks)

```tsx
// app/actions/users.ts
'use server';

import { db } from '@/lib/server/db';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  await db.user.create({ data: { name, email } });

  revalidatePath('/users');
}

// Usage in component
<form action={createUser}>
  <input name="name" />
  <input name="email" type="email" />
  <button type="submit">Create</button>
</form>
```

### API Routes

```ts
// app/api/users/route.ts
import { db } from '@/lib/server/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await db.user.findMany();
  return NextResponse.json({ data: users });
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json({ data: user }, { status: 201 });
}
```

## State Synchronization

### Optimistic Updates

```tsx
'use client';

import { useOptimistic } from 'react';

export function TodoList({ todos, addTodo }: TodoListProps) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  async function handleAdd(formData: FormData) {
    const title = formData.get('title') as string;

    // Optimistically add to UI
    addOptimisticTodo({ id: 'temp', title, completed: false });

    // Then persist to server
    await addTodo(formData);
  }

  return (
    <form action={handleAdd}>
      <input name="title" />
      <button type="submit">Add</button>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </form>
  );
}
```

### Cache Invalidation

```ts
// After mutation, invalidate relevant caches
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateUser(id: string, data: UpdateUserInput) {
  await db.user.update({ where: { id }, data });

  // Invalidate specific path
  revalidatePath(`/users/${id}`);

  // Or invalidate by tag
  revalidateTag('users');
}
```

## Error Handling Across Stack

```tsx
// Server-side error
// app/api/users/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await db.user.findUnique({ where: { id: params.id } });

  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: user });
}

// Client-side handling
// components/UserProfile.tsx
'use client';

export function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useQuery(['user', userId], () =>
    fetch(`/api/users/${userId}`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    })
  );

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  return <UserCard user={data.data} />;
}
```
