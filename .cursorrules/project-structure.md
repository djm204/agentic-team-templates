# Project Structure

```
portfolio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public routes (no auth)
│   │   │   ├── career/
│   │   │   ├── case-studies/
│   │   │   └── about/
│   │   ├── (admin)/           # Admin routes (auth required)
│   │   │   └── edit/
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   └── content/
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI primitives
│   │   ├── features/         # Feature-specific components
│   │   └── layouts/          # Layout components
│   ├── lib/                  # Business logic
│   │   ├── auth/            # Authentication utilities
│   │   ├── content/         # Content management
│   │   ├── kv/              # KV operations
│   │   └── validation/      # Zod schemas
│   ├── types/               # TypeScript definitions
│   └── utils/               # Pure utility functions
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
└── docs/
    └── adr/                 # Architecture Decision Records
```

## Key Conventions

- **App Router Only**: No Pages Router (`pages/` directory)
- **Route Groups**: Use `(public)` and `(admin)` for route organization
- **Component Organization**: Group by purpose (ui, features, layouts)
- **Business Logic**: All business logic in `lib/`, not in components
- **Pure Utilities**: Utility functions in `utils/` must be pure (no side effects)
