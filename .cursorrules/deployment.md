# Deployment

## Cloudflare Pages Configuration

```toml
# wrangler.toml (for KV namespace binding only)
name = "portfolio"
compatibility_date = "2025-01-21"

[[kv_namespaces]]
binding = "PORTFOLIO_CONTENT"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

## Environment Variables

```bash
# .env.local (never commit)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
ALLOWED_EMAIL=me@davidmendez.dev
NEXTAUTH_SECRET=generate-random-secret
NEXTAUTH_URL=https://davidmendez.dev

# Set in Cloudflare Pages dashboard
```

## Build Configuration

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

## CI/CD Pipeline (GitHub Actions)

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
