# Testing Strategy

## Coverage Target

**80% minimum coverage** for all code.

## Unit Tests (Vitest)

Test pure functions, utilities, and validation:

- **Test Pure Functions**: All utilities must have tests
- **Test Validation**: All Zod schemas must have tests
- **Test Transformations**: Data mappers, sanitizers, formatters

### Example

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

## Component Tests (React Testing Library)

- **User-Centric**: Test what users see and do
- **No Implementation Details**: Don't test state, test behavior
- **Accessibility**: Every component tested with axe

### Example

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

## E2E Tests (Playwright)

- **Critical Paths Only**: Auth flow, content editing, publishing
- **Visual Regression**: Snapshot testing for UI
- **Performance**: Lighthouse scores on every deploy

### Example

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

## Testing Checklist

Before marking code complete:

- [ ] Unit tests for all pure functions
- [ ] Validation schema tests
- [ ] Component tests with accessibility checks
- [ ] E2E tests for critical paths
- [ ] Tests cover both happy path and error cases
- [ ] Coverage maintained at 80%+
