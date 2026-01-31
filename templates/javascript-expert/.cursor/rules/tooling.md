# JavaScript Tooling

Modern JavaScript tooling configuration and best practices.

## TypeScript Configuration

```jsonc
// tsconfig.json — strict everything
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2023"],
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Package Management

```jsonc
// package.json essentials
{
  "type": "module",
  "engines": { "node": ">=20" },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

### Dependency Hygiene

- Pin exact versions for applications (`"react": "19.0.0"`)
- Use ranges for libraries (`"react": "^19.0.0"`)
- Audit dependencies regularly (`npm audit`)
- Prefer packages with zero dependencies
- Check bundle size impact before adding (`bundlephobia.com`)
- Remove unused dependencies (`npx depcheck`)

## Linting

```javascript
// eslint.config.js (flat config)
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
```

## Build Tools

### Vite (Frontend)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

### tsup (Libraries)

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: true,
  treeshake: true,
});
```

## Git Hooks

```jsonc
// package.json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "npm run typecheck && npm run lint && npm run test"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

## Debugging

```typescript
// Node.js debugger
// node --inspect-brk app.js
// Then connect Chrome DevTools to chrome://inspect

// Conditional breakpoints in code
if (suspiciousValue > threshold) {
  debugger; // Only hits when condition is true
}

// Structured logging over console.log
import { createLogger } from './logger.js';
const log = createLogger('user-service');

log.info('User created', { userId: user.id, email: user.email });
log.error('Failed to create user', { error, input });
// Never log passwords, tokens, or PII
```

## Editor Configuration

```jsonc
// .vscode/settings.json (also works in Cursor)
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifierEnding": "js",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
