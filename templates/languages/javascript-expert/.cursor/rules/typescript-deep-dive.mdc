---
description: TypeScript Deep Dive
alwaysApply: false
---

# TypeScript Deep Dive

Advanced type system mastery. Builds on `overview.mdc` (discriminated unions, branded types, const assertions).

## Generics

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
function merge<T extends object, U extends object>(a: T, b: U): T & U { return { ...a, ...b }; }
```

## Conditional Types

```typescript
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type ToArray<T> = T extends unknown ? T[] : never; // Distributive
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never; // Non-distributive
```

## Mapped Types

```typescript
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type PickByType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? T[K] extends Function ? T[K] : DeepReadonly<T[K]> : T[K];
};
```

## Template Literal Types

```typescript
type ExtractParams<T extends string> =
  T extends `${string}:${infer P}/${infer Rest}` ? P | ExtractParams<`/${Rest}`>
  : T extends `${string}:${infer P}` ? P : never;
type Params = ExtractParams<'/users/:userId/posts/:postId'>; // "userId" | "postId"
```

## `satisfies` Operator

```typescript
const routes = {
  home: { path: '/', component: HomePage },
} satisfies Record<string, { path: string; component: React.ComponentType }>;
// routes.home.path is literal "/" — not widened to string
```

## Runtime Boundary Validation

```typescript
import { z } from 'zod';
const UserSchema = z.object({ id: z.string().uuid(), email: z.string().email(), role: z.enum(['admin', 'user']) });
type User = z.infer<typeof UserSchema>; // Single source of truth

// Validate at every I/O boundary — types disappear at runtime
const parsed = UserSchema.safeParse(body);
if (!parsed.success) return Response.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
```

## Type Predicates

```typescript
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && 'email' in value;
}
```

## Anti-Patterns

- Never `any` — use `unknown` then narrow with type guards or Zod
- Never `as` to silence errors — use runtime validation
- Never `enum` — use string literal unions (`type Status = 'active' | 'inactive'`)
