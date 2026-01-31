# Component Architecture

## Composition Over Inheritance

Always prefer composition:

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

## Pure Components

- No side effects in render
- Props in, JSX out
- Side effects in `useEffect` only
- Data fetching in Server Components or React Query

## Error Boundaries

Every route must have an error boundary:

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

## Component Guidelines

- Use Server Components by default
- Only use Client Components (`'use client'`) when necessary (interactivity, hooks)
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for all props (no `any`)
