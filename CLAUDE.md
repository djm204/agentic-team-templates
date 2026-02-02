# CLAUDE.md - Development Guide

## Development Principles

### 1. Honesty Over Output

- If something doesn't work, say it doesn't work
- If you don't know, say you don't know
- Never hide errors or suppress warnings
- Admit mistakes early

### 2. Security First

- Zero trust: Every input is hostile until proven otherwise
- Validate and sanitize all inputs
- No secrets in code or logs
- Least privilege principle

### 3. Tests Are Required

- No feature is complete without tests
- Green CI or it didn't happen
- Test behavior, not implementation

### 4. Code Quality

- SOLID principles
- DRY (Don't Repeat Yourself)
- Functional programming bias
- Explicit over implicit

---

## Quick Reference

### Installed Templates

- **Shared** (always included): Core principles, code quality, security, git workflow, communication
- **documentation**: Technical documentation standards (READMEs, API docs, ADRs, code comments)

### Rule Files

All rules are in `.cursorrules/`. The AI assistant automatically reads these when working on your project.

#### Shared Rules (Apply to All Code)

| Rule | Purpose |
|------|---------|
| `core-principles.md` | Honesty, simplicity, testing requirements |
| `code-quality.md` | SOLID, DRY, clean code patterns |
| `security-fundamentals.md` | Zero trust, input validation, secrets |
| `git-workflow.md` | Commits, branches, PRs, safety |
| `communication.md` | Direct, objective, professional |

#### Documentation Rules

| Rule | Purpose |
|------|---------|
| `documentation-adr.md` | adr guidelines |
| `documentation-api-documentation.md` | api documentation guidelines |
| `documentation-code-comments.md` | code comments guidelines |
| `documentation-maintenance.md` | maintenance guidelines |
| `documentation-overview.md` | overview guidelines |
| `documentation-readme-standards.md` | readme standards guidelines |

---

## Project Overview

Portfolio site for David Josef Mendez - Staff/Senior Software Engineer with SRE experience.

**Critical Requirement**: Only `me@davidmendez.dev` can access admin features. Period. No exceptions, no edge cases, no "maybe later" users.

## Core Principles

### 1. Honesty Over Output

- If something doesn't work, say it doesn't work
- If you don't know, say you don't know
- If a pattern is wrong, refactor it immediately
- Tests must pass. Green CI or it didn't happen

### 2. Security First

- **Zero Trust**: Every input is hostile until proven otherwise
- **Email Verification**: Hardcoded allowlist for `me@davidmendez.dev` only
- **Rate Limiting**: Cloudflare Workers built-in rate limiting on all mutations
- **CSRF Protection**: State parameter validation on OAuth flows
- **XSS Prevention**: Sanitize all MDX before storage and rendering
- **Content Security Policy**: Strict CSP headers via Cloudflare Pages
- **No Client-Side Secrets**: All auth validation server-side only

### 3. Functional Programming Bias

```typescript
// Prefer this
const processProjects = pipe(validateProjects, filterActive, sortByDate);

// Over this
function processProjects(projects) {
  let valid = [];
  for (let p of projects) {
    if (isValid(p)) valid.push(p);
  }
  // ... mutation hell
}
```

### 4. SOLID Principles

- **Single Responsibility**: One function, one job
- **Open/Closed**: Extend via composition, not modification
- **Liskov Substitution**: Type safety via TypeScript strict mode
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Inject dependencies, never import concrete implementations

### 5. DRY (Don't Repeat Yourself)

- Abstract repeated patterns into utilities
- Create reusable components
- Share types across client/server boundaries
- One source of truth for validation schemas

## Tech Stack

### Core

- **Next.js 16** (App Router only, no Pages Router)
- **React 19.2+** (latest stable, required for Next.js 16)
- **TypeScript 5.1.0+** (strict mode enabled, minimum 5.1.0 for Next.js 16)
- **Tailwind CSS 4** (latest stable)

### Infrastructure

- **Cloudflare Pages** (deployment target)
- **Cloudflare KV** (content storage)
- **Google OAuth** (authentication)
- **MDX** (content format)

### Testing

- **Vitest** (unit tests)
- **React Testing Library** (component tests)
- **Playwright** (e2e tests)
- **MSW** (API mocking)

### Code Quality

- **ESLint** (with TypeScript rules)
- **Prettier** (opinionated formatting)
- **Husky** (pre-commit hooks)
- **Commitizen** (conventional commits)

## Project Structure

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

## Security Requirements

### Authentication Flow

1. User clicks "Sign In with Google"
2. OAuth flow initiated with `state` parameter (CSRF protection)
3. Google redirects to `/api/auth/callback`
4. Server validates:
   - `state` parameter matches session
   - Email is EXACTLY `me@davidmendez.dev`
   - Token signature is valid
5. Set HTTP-only, Secure, SameSite=Strict cookie
6. Redirect to admin dashboard

### Input Sanitization

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// All inputs validated with Zod
const ProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  tags: z.array(z.string().max(50)).max(20),
  metrics: z.record(z.string(), z.union([z.string(), z.number()])),
});

// All MDX content sanitized before storage
const sanitizeMDX = (content: string): string =>
  DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p',
      'h1',
      'h2',
      'h3',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'a',
      'strong',
      'em',
    ],
    ALLOWED_ATTR: ['href', 'class'],
  });
```

### Rate Limiting

- **Read Operations**: 100 requests/minute per IP
- **Write Operations**: 10 requests/minute per authenticated user
- **Auth Attempts**: 5 attempts/hour per IP

### Content Security Policy

```typescript
// Set via middleware
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next.js requires unsafe-inline
  "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
  "img-src 'self' data: https:",
  "connect-src 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
```

## Data Architecture

### KV Storage Schema

```typescript
// Namespace: portfolio-content

// Key Pattern: {contentType}:{id}
// Examples:
// - "career:hero"
// - "career:projects:uuid-1"
// - "case-studies:adr-1"
// - "about:main"
// - "tags:all"

interface KVContent {
  id: string;
  type: 'career-hero' | 'project' | 'case-study' | 'about' | 'tags';
  content: string; // MDX content
  metadata: {
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
    author: string; // Always me@davidmendez.dev
    version: number; // Optimistic locking
  };
}

interface Project extends KVContent {
  type: 'project';
  title: string;
  tags: string[];
  metrics: Record<string, string | number>;
  featured: boolean;
}

interface CaseStudy extends KVContent {
  type: 'case-study';
  title: string;
  tldr: string;
  specs: Array<{ label: string; value: string }>;
  order: number; // For "next ADR" feature
}
```

### Type Safety

- All KV operations return `Result<T, Error>` types
- No throwing exceptions - explicit error handling
- Zod schemas for runtime validation
- TypeScript strict mode for compile-time safety

## Component Architecture

### Composition Over Inheritance

```typescript
// Good: Composition
const ProjectCard = ({ project }: { project: Project }) => (
  <Card>
    <CardHeader>
      <ProjectTitle title={project.title} />
      <ProjectTags tags={project.tags} />
    </CardHeader>
    <CardContent>
      <ProjectMetrics metrics={project.metrics} />
    </CardContent>
  </Card>
);

// Bad: Inheritance
class ProjectCard extends BaseCard {
  // ... nope
}
```

### Pure Components

- No side effects in render
- Props in, JSX out
- Side effects in `useEffect` only
- Data fetching in Server Components or React Query

### Error Boundaries

Every route wrapped in error boundary:

```typescript
// app/(public)/career/error.tsx
'use client';

export default function CareerError({ error, reset }: ErrorProps) {
  return (
    <div role="alert">
      <h2>Something went wrong loading the career page</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests (Vitest)

- **Coverage Target**: 80% minimum
- **Test Pure Functions**: All utilities must have tests
- **Test Validation**: All Zod schemas must have tests
- **Test Transformations**: Data mappers, sanitizers, formatters

```typescript
// lib/validation/project.test.ts
import { describe, it, expect } from 'vitest';
import { ProjectSchema } from './project';

describe('ProjectSchema', () => {
  it('accepts valid project data', () => {
    const result = ProjectSchema.safeParse({
      title: 'Test Project',
      description: 'A test',
      tags: ['typescript', 'react'],
      metrics: { saved: '10 hours' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid project data', () => {
    const result = ProjectSchema.safeParse({
      title: '', // Empty title
      description: 'A test',
      tags: [],
      metrics: {},
    });

    expect(result.success).toBe(false);
  });

  it('rejects XSS attempts in title', () => {
    const result = ProjectSchema.safeParse({
      title: '<script>alert("xss")</script>',
      description: 'A test',
      tags: [],
      metrics: {},
    });

    // Should be caught by max length or sanitization
    expect(result.success).toBe(false);
  });
});
```

### Component Tests (React Testing Library)

- **User-Centric**: Test what users see and do
- **No Implementation Details**: Don't test state, test behavior
- **Accessibility**: Every component tested with axe

```typescript
// components/features/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ProjectCard } from './ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    title: 'Test Project',
    tags: ['typescript'],
    metrics: { saved: '10 hours' },
    content: '# Test',
    featured: true,
    type: 'project' as const,
    metadata: {
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      author: 'me@davidmendez.dev',
      version: 1
    }
  };

  it('renders project title', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ProjectCard project={mockProject} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### E2E Tests (Playwright)

- **Critical Paths Only**: Auth flow, content editing, publishing
- **Visual Regression**: Snapshot testing for UI
- **Performance**: Lighthouse scores on every deploy

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('allows authorized user to sign in', async ({ page }) => {
    await page.goto('/');

    // Click sign in
    await page.click('text=Sign In');

    // Mock Google OAuth (use test account)
    // ... OAuth flow ...

    // Should redirect to admin
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('text=Edit Content')).toBeVisible();
  });

  test('rejects unauthorized email', async ({ page }) => {
    // Attempt sign in with wrong email
    // Should show error and not set auth cookie
    await page.goto('/admin');
    await expect(page).toHaveURL('/'); // Redirected
  });
});
```

## Development Workflow

### 1. Small, Meaningful Commits

**Commits should be atomic and focused:**

- One logical change per commit
- Each commit should compile and pass tests
- Separate refactoring from feature changes
- Separate tests from implementation

**Good commit examples:**

- `feat(auth): add login button component`
- `test(auth): add login button tests`
- `fix(api): handle rate limit errors`
- `refactor(utils): extract date formatting`

**Bad commit examples:**

- `WIP` or `fix stuff`
- `add feature and fix bugs and update tests`
- Giant commits with 50+ file changes

### 2. Feature Branch Strategy

```bash
# Create feature branch
git checkout -b feat/project-cards

# Work in small commits
git add src/components/features/ProjectCard.tsx
git commit -m "feat: add ProjectCard component"

git add src/components/features/ProjectCard.test.tsx
git commit -m "test: add ProjectCard tests"

# Push and create PR
git push origin feat/project-cards
```

### 2. Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `chore`: Build process or auxiliary tool changes

Example:

```
feat(auth): add Google OAuth integration

- Implement OAuth callback handler
- Add email allowlist validation
- Set secure HTTP-only cookies

Closes #123
```

### 3. PR Requirements

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Coverage maintained or improved
- [ ] E2E tests pass for affected flows
- [ ] Documentation updated

### 4. Code Review Checklist

- [ ] Security: All inputs validated and sanitized?
- [ ] Tests: Meaningful tests that actually verify behavior?
- [ ] Types: Proper TypeScript usage with no `any`?
- [ ] Accessibility: Semantic HTML and ARIA labels?
- [ ] Performance: No unnecessary re-renders or expensive operations?
- [ ] DRY: No repeated code that could be abstracted?
- [ ] SOLID: Each function/component has single responsibility?

## Deployment

### Cloudflare Pages Configuration

```toml
# wrangler.toml (for KV namespace binding only)
name = "portfolio"
compatibility_date = "2025-01-21"

[[kv_namespaces]]
binding = "PORTFOLIO_CONTENT"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### Environment Variables

```bash
# .env.local (never commit)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
ALLOWED_EMAIL=me@davidmendez.dev
NEXTAUTH_SECRET=generate-random-secret
NEXTAUTH_URL=https://davidmendez.dev

# Set in Cloudflare Pages dashboard
```

### Build Configuration

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "prepare": "husky install"
  }
}
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run test:e2e

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: portfolio
          directory: .next
```

## Performance Requirements

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Optimization Strategies

- Image optimization via Next.js `<Image>`
- Route prefetching on hover
- Dynamic imports for admin components
- Edge caching for public pages
- Incremental Static Regeneration (ISR) for content pages

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

- [ ] Semantic HTML5 elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus indicators visible
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] Skip to main content link
- [ ] Form labels and error messages

### Testing

```bash
# Automated accessibility testing
npm run test:a11y

# Manual testing
# 1. Navigate entire site with keyboard only
# 2. Test with screen reader
# 3. Check color contrast with browser DevTools
```

## Monitoring & Observability

### Error Tracking

- Client-side errors captured and logged
- Server-side errors logged with context
- User actions tracked (with consent)

### Performance Monitoring

- Real User Monitoring (RUM) via Cloudflare Analytics
- Core Web Vitals tracking
- API response time monitoring

### Logging Structure

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context: {
    userId?: string;
    action?: string;
    route?: string;
    error?: Error;
  };
}
```

## Common Pitfalls to Avoid

### 1. Trusting Client-Side Validation

❌ **Wrong**:

```typescript
// Client validates email is me@davidmendez.dev
// Server assumes it's fine
```

✅ **Right**:

```typescript
// Client validates for UX
// Server validates again and rejects if wrong
const isAuthorized = (email: string): boolean => email === 'me@davidmendez.dev';
```

### 2. Mutating State

❌ **Wrong**:

```typescript
const addTag = (project: Project, tag: string) => {
  project.tags.push(tag); // Mutation!
  return project;
};
```

✅ **Right**:

```typescript
const addTag = (project: Project, tag: string): Project => ({
  ...project,
  tags: [...project.tags, tag],
});
```

### 3. Not Handling Errors

❌ **Wrong**:

```typescript
const data = await fetchProject(id); // Throws on error
```

✅ **Right**:

```typescript
const result = await fetchProject(id);
if (!result.ok) {
  return <ErrorMessage error={result.error} />;
}
const data = result.value;
```

### 4. Skipping Tests

❌ **Wrong**:

```typescript
// TODO: Add tests later
```

✅ **Right**:

```typescript
// Write test first (TDD) or immediately after
describe('addTag', () => {
  it('adds tag without mutating original', () => {
    const original = { tags: ['a'] };
    const result = addTag(original, 'b');
    expect(original.tags).toEqual(['a']);
    expect(result.tags).toEqual(['a', 'b']);
  });
});
```

### 5. Using `any` Type

❌ **Wrong**:

```typescript
const processData = (data: any) => { ... }
```

✅ **Right**:

```typescript
const processData = (data: unknown) => {
  if (!isProject(data)) {
    throw new Error('Invalid data');
  }
  // TypeScript now knows data is Project
};
```

## Definition of Done

A task is complete when:

- [ ] Code written and reviewed
- [ ] Tests written and passing (80%+ coverage)
- [ ] TypeScript strict mode compliant
- [ ] ESLint and Prettier passing
- [ ] Accessibility tested (keyboard + screen reader)
- [ ] Security reviewed (input validation, auth checks)
- [ ] Performance benchmarked (no regressions)
- [ ] Documentation updated
- [ ] Committed with conventional commit message
- [ ] PR approved and merged
- [ ] Deployed to production
- [ ] Verified working in production

## Resources

- [Cursor Documentation](https://cursor.sh/docs)

## Customization

### Adding Project-Specific Rules

1. Create new `.md` files in `.cursorrules/`
2. Follow the existing naming convention
3. Include clear examples and anti-patterns

### Modifying Existing Rules

Edit files directly in `.cursorrules/`. Changes take effect immediately.

### Updating Templates

Re-run the installer to update (will overwrite existing rules):

```bash
npx cursor-templates documentation
```

---

## Questions? Stuck?

### Debugging Steps

1. **Read the error message** - Actually read it, don't skim
2. **Check the types** - TypeScript is usually right
3. **Add logging** - `console.log` is your friend
4. **Write a test** - Reproduce the issue in isolation
5. **Simplify** - Remove complexity until it works
6. **Ask for help** - But show what you've tried first

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Final Notes

### Brutal Honesty Checklist

Before saying you're done:

- [ ] Did you actually run the tests?
- [ ] Did they actually pass?
- [ ] Did you test the happy path AND error cases?
- [ ] Did you check for XSS vulnerabilities?
- [ ] Did you verify auth checks are server-side?
- [ ] Would you ship this code to production?
- [ ] Would you be proud to show this in a code review?

### Remember

- **Security is not optional** - It's the foundation
- **Tests are not optional** - They're the safety net
- **Types are not optional** - They're the guardrails
- **Accessibility is not optional** - It's basic human decency
- **Clean code is not optional** - It's professional respect

Build it right, or don't build it at all.
