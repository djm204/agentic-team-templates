# TypeScript Deep Dive

Advanced type system mastery. Conditional types, mapped types, type-level programming, and runtime boundary validation.

This builds on the type safety foundations in overview.md. That file covers discriminated unions, branded types, and const assertions. This file goes deeper.

## Generics — Beyond the Basics

```typescript
// Constrained generics
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic with defaults
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// Generic factory functions
function createStore<T>(initial: T) {
  let state = initial;
  return {
    get: (): T => state,
    set: (next: T): void => { state = next; },
    update: (fn: (current: T) => T): void => { state = fn(state); },
  };
}
// Type is inferred from usage — no annotation needed at call site
const counter = createStore(0); // Store<number>
const users = createStore<User[]>([]); // Explicit when needed
```

## Conditional Types

```typescript
// Basic conditional
type IsString<T> = T extends string ? true : false;

// Extract and Exclude (built-in, but understand how they work)
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

// Practical: extract function return types from a module
type ApiMethods = {
  getUser: (id: string) => Promise<User>;
  createUser: (data: CreateUserInput) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
};

type ApiReturnTypes = {
  [K in keyof ApiMethods]: ApiMethods[K] extends (...args: any[]) => infer R ? R : never;
};
// { getUser: Promise<User>; createUser: Promise<User>; deleteUser: Promise<void> }

// Unwrap Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type UserResult = Awaited<Promise<Promise<User>>>; // User

// Distributive conditional types — union members are distributed
type ToArray<T> = T extends unknown ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]

// Prevent distribution with tuple wrapping
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

## Mapped Types

```typescript
// Transform all properties
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Partial<T> = { [K in keyof T]?: T[K] };
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Key remapping (TypeScript 4.1+)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }

// Filter keys by value type
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

type StringFields = PickByType<User, string>;
// Only string-typed fields from User

// Deep mapped types
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};
```

## Template Literal Types

```typescript
// Type-safe string manipulation
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiPath = `/api/v1/${string}`;
type Route = `${HttpMethod} ${ApiPath}`;

// Extract route parameters
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Params = ExtractParams<'/users/:userId/posts/:postId'>;
// "userId" | "postId"

// Type-safe event emitter
type EventHandler<T extends string> = `on${Capitalize<T>}`;
type ClickHandler = EventHandler<'click'>; // "onClick"

// Dot-notation paths for nested objects
type DotPath<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | DotPath<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

type UserPaths = DotPath<{ name: string; address: { city: string; zip: string } }>;
// "name" | "address" | "address.city" | "address.zip"
```

## Type Predicates and Assertion Functions

```typescript
// Type predicates — custom narrowing functions
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Record<string, unknown>).id === 'string' &&
    'email' in value &&
    typeof (value as Record<string, unknown>).email === 'string'
  );
}

// Works in filter — TypeScript narrows the array type
const users: User[] = mixedArray.filter(isUser);

// Assertion functions — throw or narrow
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new TypeError('Expected User');
  }
}

// After calling assertUser, TypeScript knows value is User
assertUser(data);
data.email; // OK — narrowed to User

// Type predicate for discriminated unions
function isSuccess<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok;
}
```

## satisfies Operator

```typescript
// Validate a type without widening — the best of both worlds
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
  blue: [0, 0, 255],
} satisfies Record<string, string | readonly number[]>;

// palette.red is number[] (not string | number[])
// palette.green is string (not string | number[])
// But TypeScript verified it matches Record<string, string | number[]>

// Route config example
const routes = {
  home: { path: '/', component: HomePage },
  about: { path: '/about', component: AboutPage },
  user: { path: '/users/:id', component: UserPage },
} satisfies Record<string, { path: string; component: React.ComponentType }>;

// routes.home.path is the literal "/" — not widened to string
```

## Runtime Boundary Validation

```typescript
// Types disappear at runtime. Validate at every I/O boundary.
import { z } from 'zod';

// Schema is the single source of truth — infer the type from it
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'viewer']),
  createdAt: z.string().datetime(),
});

type User = z.infer<typeof UserSchema>;

// Validate at boundaries
async function handleCreateUser(req: Request): Promise<Response> {
  const body = await req.json();
  const parsed = UserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  // parsed.data is fully typed User
  const user = await db.users.create(parsed.data);
  return Response.json(user, { status: 201 });
}

// Validate environment variables at startup — fail fast
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive().default(3000),
});
export const env = EnvSchema.parse(process.env);

// Validate external API responses — don't trust the network
const ExternalUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
});

async function fetchGitHubUser(username: string) {
  const response = await fetch(`https://api.github.com/users/${username}`);
  const data = await response.json();
  return ExternalUserSchema.parse(data); // Throws if shape is wrong
}
```

## Declaration Files and Library Types

```typescript
// Augment third-party types
declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
    requestId: string;
  }
}

// Augment global types
declare global {
  interface Window {
    __APP_CONFIG__: AppConfig;
  }
}

// Type-only imports (tree-shakeable, explicit intent)
import type { User } from './types.js';

// For library authors: ensure .d.ts files are generated
// tsconfig.json: "declaration": true, "declarationMap": true
// package.json: "types": "./dist/index.d.ts"
```

## Utility Patterns

```typescript
// Make specific keys required
type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
type UserWithEmail = WithRequired<Partial<User>, 'email'>;

// Make specific keys optional
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type UpdateUser = WithOptional<User, 'id' | 'createdAt'>;

// Strict extract for exhaustive checking
type StrictExtract<T, U extends T> = Extract<T, U>;

// Non-empty array type
type NonEmptyArray<T> = [T, ...T[]];
function first<T>(arr: NonEmptyArray<T>): T {
  return arr[0]; // No undefined — guaranteed at least one element
}

// Exact types (prevent excess properties in specific contexts)
type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;
```

## Anti-Patterns

```typescript
// Never: any
function process(data: any) { } // Type checker disabled entirely
// Use: unknown, then narrow with type guards or Zod

// Never: as for silencing errors
const user = data as User; // What if data is garbage?
// Use: runtime validation, then the type follows

// Never: enums (they generate runtime code and have surprising behavior)
enum Status { Active, Inactive } // 0, 1 — not "Active", "Inactive"
// Use: string literal unions
type Status = 'active' | 'inactive';

// Never: non-null assertion (!) without proof
user!.email; // Runtime NPE waiting to happen
// Use: if (user) { user.email }

// Never: @ts-ignore without explanation
// @ts-ignore
brokenCode();
// Use: @ts-expect-error — explanation of why this is necessary
// At minimum, @ts-expect-error will fail if the error is fixed (unlike @ts-ignore)

// Never: interface for unions or mapped types (use type alias)
// Interfaces are for object shapes that may be extended/implemented
// Type aliases are for unions, intersections, mapped types, conditional types
```
