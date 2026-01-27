# Fullstack Development

Guidelines for building cohesive full-stack web applications.

## Scope

This ruleset applies to:
- Monolithic full-stack applications
- Full-stack frameworks (Next.js, Nuxt, SvelteKit, Remix, etc.)
- Separate frontend/backend codebases sharing types
- JAMstack applications with serverless backends

## Key Principles

### 1. Unified Type System
Share types between frontend and backend to catch errors at compile time.

### 2. Clear Boundaries
Maintain separation between client and server concerns, even in unified frameworks.

### 3. API-First Thinking
Design the API contract first, then implement both sides.

### 4. End-to-End Testing
Test the full user journey, not just isolated components.

## Project Structures

### Monorepo Structure

```
packages/
├── shared/           # Shared types, validation, utilities
│   ├── types/
│   ├── validation/
│   └── utils/
├── web/              # Frontend application
│   ├── components/
│   ├── pages/
│   └── hooks/
├── api/              # Backend API
│   ├── routes/
│   ├── services/
│   └── repositories/
└── e2e/              # End-to-end tests
```

### Full-Stack Framework Structure

```
src/
├── app/              # Pages and routing
│   ├── (public)/     # Public routes
│   ├── (auth)/       # Authenticated routes
│   └── api/          # API routes
├── components/       # React components
├── lib/              # Shared logic
│   ├── client/       # Client-only code
│   ├── server/       # Server-only code
│   └── shared/       # Isomorphic code
├── types/            # TypeScript definitions
└── validation/       # Shared validation schemas
```

## Core Concepts

### Server vs Client Boundaries

```ts
// Server-only code (never sent to client)
// lib/server/db.ts
import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();

// Client-only code
// lib/client/analytics.ts
export const trackEvent = (event: string) => {
  window.analytics?.track(event);
};

// Shared code (works both sides)
// lib/shared/validation.ts
export const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
```

### Data Flow

```
User Action → Frontend Component → API Request → Server Handler
     ↓                                                   ↓
  UI Update ← Frontend State ← API Response ← Database Query
```

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
