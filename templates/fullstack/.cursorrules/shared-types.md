# Shared Types

Strategies for sharing types between frontend and backend.

## Why Share Types?

- **Single Source of Truth**: Define once, use everywhere
- **Compile-Time Safety**: Catch mismatches before runtime
- **Refactoring Confidence**: Changes propagate automatically
- **Documentation**: Types serve as documentation

## Monorepo Setup

### Package Structure

```
packages/
├── shared/                 # Shared types and utilities
│   ├── package.json
│   ├── src/
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── post.ts
│   │   │   └── index.ts
│   │   ├── validation/
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── tsconfig.json
├── web/
│   └── package.json        # depends on @myapp/shared
└── api/
    └── package.json        # depends on @myapp/shared
```

### Shared Package

```json
// packages/shared/package.json
{
  "name": "@myapp/shared",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

```ts
// packages/shared/src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserInput {
  name?: string;
  role?: 'user' | 'admin';
}

// packages/shared/src/index.ts
export * from './types/user';
export * from './validation/user';
```

### Using Shared Types

```ts
// In API (packages/api/src/services/userService.ts)
import { User, CreateUserInput } from '@myapp/shared';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  // Implementation
};

// In Web (packages/web/src/components/UserForm.tsx)
import { CreateUserInput } from '@myapp/shared';

interface UserFormProps {
  onSubmit: (data: CreateUserInput) => void;
}
```

## Shared Validation

### Zod Schemas

```ts
// packages/shared/src/validation/user.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ email: true });

// Infer types from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

### Usage on Backend

```ts
// packages/api/src/routes/users.ts
import { CreateUserSchema } from '@myapp/shared';

app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        details: result.error.errors,
      },
    });
  }

  const user = await createUser(result.data);
  res.status(201).json({ data: user });
});
```

### Usage on Frontend

```tsx
// packages/web/src/components/UserForm.tsx
import { CreateUserSchema, CreateUserInput } from '@myapp/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function UserForm({ onSubmit }: { onSubmit: (data: CreateUserInput) => void }) {
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
      {/* ... */}
    </form>
  );
}
```

## Type Transformations

### API Response Types

```ts
// packages/shared/src/types/api.ts

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Specific response types
export type UserResponse = ApiResponse<User>;
export type UsersResponse = PaginatedResponse<User>;
```

### Date Handling

Dates serialize to strings in JSON. Handle the transformation:

```ts
// packages/shared/src/types/user.ts

// Internal type (used in backend with Date objects)
export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

// API type (serialized dates)
export interface UserDTO {
  id: string;
  name: string;
  createdAt: string;  // ISO 8601 string
}

// Transformer
export const toUserDTO = (user: User): UserDTO => ({
  ...user,
  createdAt: user.createdAt.toISOString(),
});

export const fromUserDTO = (dto: UserDTO): User => ({
  ...dto,
  createdAt: new Date(dto.createdAt),
});
```

## Enums and Constants

```ts
// packages/shared/src/constants/user.ts

export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// Usage
import { UserRole, UserStatus } from '@myapp/shared';

if (user.role === UserRole.ADMIN) {
  // ...
}
```

## Error Types

```ts
// packages/shared/src/types/errors.ts

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

// Usage in frontend for type-safe error handling
const handleError = (error: AppError) => {
  switch (error.code) {
    case ErrorCode.VALIDATION_ERROR:
      showValidationErrors(error.details);
      break;
    case ErrorCode.UNAUTHORIZED:
      redirectToLogin();
      break;
    default:
      showGenericError(error.message);
  }
};
```

## Utility Types

```ts
// packages/shared/src/types/utils.ts

// Make specific fields optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific fields required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Omit common auto-generated fields
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// Usage
type CreateUserInput = CreateInput<User>;
// { email: string; name: string; role: 'user' | 'admin' }
```

## Best Practices

### 1. Keep Shared Package Minimal

Only share what's truly shared. Don't pull in frontend or backend dependencies.

### 2. Version Carefully

Changes to shared types affect both frontend and backend. Make changes carefully.

### 3. Use Strict Mode

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### 4. Export Explicitly

```ts
// packages/shared/src/index.ts
// Explicitly export what should be public
export { User, CreateUserInput, UpdateUserInput } from './types/user';
export { CreateUserSchema, UpdateUserSchema } from './validation/user';
// Don't export internal helpers
```
