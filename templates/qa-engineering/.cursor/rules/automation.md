# Test Automation

Best practices for building maintainable test automation.

## Automation Strategy

### What to Automate

| Automate | Why |
|----------|-----|
| Regression tests | Run frequently, catch regressions early |
| Smoke tests | Fast feedback on deployments |
| API tests | Fast, reliable, good ROI |
| Data-driven tests | Same logic, many inputs |
| Performance baselines | Consistent measurement |

### What to Keep Manual

| Manual | Why |
|--------|-----|
| Exploratory testing | Requires human creativity |
| Usability testing | Subjective human judgment |
| New/changing features | Not stable enough to automate |
| One-time tests | ROI doesn't justify automation |
| Visual/UX assessment | Requires human perception |

### Automation ROI

```text
ROI = (Manual Time × Frequency - Automation Time) / Automation Time

Example:
- Manual execution: 2 hours
- Run frequency: 50 times/year
- Automation creation: 8 hours
- Automation execution: 5 minutes
- Automation maintenance: 4 hours/year

Manual cost: 2h × 50 = 100 hours/year
Automation cost: 8h + (5min × 50) + 4h = 16 hours/year
Savings: 84 hours/year
ROI: (100 - 16) / 16 = 525%
```

## Test Structure

### Arrange-Act-Assert (AAA)

```javascript
describe('ShoppingCart', () => {
  it('calculates total with discount', () => {
    // Arrange
    const cart = new ShoppingCart();
    cart.addItem({ name: 'Widget', price: 100, quantity: 2 });
    cart.applyDiscount('SAVE10');

    // Act
    const total = cart.getTotal();

    // Assert
    expect(total).toBe(180); // 200 - 10%
  });
});
```

### Given-When-Then (BDD)

```javascript
describe('User Authentication', () => {
  describe('given a registered user', () => {
    const user = { email: 'test@example.com', password: 'ValidPass123!' };

    describe('when they login with valid credentials', () => {
      it('then they are redirected to dashboard', async () => {
        const result = await login(user.email, user.password);
        expect(result.redirect).toBe('/dashboard');
      });

      it('then a session token is created', async () => {
        const result = await login(user.email, user.password);
        expect(result.token).toBeDefined();
      });
    });

    describe('when they login with wrong password', () => {
      it('then an error is returned', async () => {
        const result = await login(user.email, 'wrong');
        expect(result.error).toBe('Invalid credentials');
      });
    });
  });
});
```

## Page Object Pattern

### Structure

```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Locators
    this.emailInput = page.locator('[data-testid="email"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
  }

  // Navigation
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  // Actions
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  // Assertions
  async expectErrorMessage(message) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

### Using Page Objects

```javascript
// tests/login.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Login', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await loginPage.login('valid@example.com', 'ValidPass123!');
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectToBeVisible();
  });

  test('invalid credentials shows error', async () => {
    await loginPage.login('invalid@example.com', 'wrong');
    await loginPage.expectErrorMessage('Invalid credentials');
  });
});
```

## Test Data Management

### Factories

```javascript
// factories/userFactory.js
export const createUser = (overrides = {}) => ({
  id: `user-${Date.now()}`,
  email: `test-${Date.now()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  createdAt: new Date().toISOString(),
  ...overrides
});

export const createAdminUser = (overrides = {}) => 
  createUser({ role: 'admin', ...overrides });

export const createPremiumUser = (overrides = {}) =>
  createUser({ role: 'premium', subscription: 'active', ...overrides });
```

### Fixtures

```javascript
// fixtures/products.js
export const products = {
  widget: {
    id: 'prod-001',
    name: 'Widget',
    price: 29.99,
    category: 'electronics',
    inStock: true
  },
  gadget: {
    id: 'prod-002',
    name: 'Gadget',
    price: 99.99,
    category: 'electronics',
    inStock: false
  }
};

// fixtures/orders.js
export const orders = {
  pending: {
    id: 'ord-001',
    status: 'pending',
    total: 129.98,
    items: [products.widget, products.gadget]
  }
};
```

### Database Seeding

```javascript
// setup/seedDatabase.js
import { createUser, createAdminUser } from '../factories/userFactory';
import { products } from '../fixtures/products';

export async function seedTestDatabase(db) {
  // Clear existing data
  await db.clear();

  // Seed users
  const testUser = createUser({ email: 'test@example.com' });
  const adminUser = createAdminUser({ email: 'admin@example.com' });
  await db.users.insertMany([testUser, adminUser]);

  // Seed products
  await db.products.insertMany(Object.values(products));

  return { testUser, adminUser, products };
}
```

## Handling Flaky Tests

### Common Causes

| Cause | Solution |
|-------|----------|
| Timing issues | Explicit waits, not arbitrary sleeps |
| Test order dependency | Isolate tests, clean state |
| Shared state | Each test manages own data |
| External services | Mock or stub dependencies |
| Race conditions | Proper synchronization |

### Explicit Waits

```javascript
// ❌ Bad: Arbitrary sleep
await page.click('#submit');
await page.waitForTimeout(5000);

// ✅ Good: Wait for specific condition
await page.click('#submit');
await page.waitForSelector('[data-testid="success-message"]');

// ✅ Better: Wait for network idle
await page.click('#submit');
await page.waitForLoadState('networkidle');

// ✅ Best: Wait for specific response
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/submit')),
  page.click('#submit')
]);
```

### Test Isolation

```javascript
// ❌ Bad: Tests share state
let user;

beforeAll(async () => {
  user = await createUser();
});

test('test 1', async () => {
  await user.update({ name: 'Changed' }); // Affects other tests!
});

test('test 2', async () => {
  expect(user.name).toBe('Original'); // Fails!
});

// ✅ Good: Each test has own state
test('test 1', async () => {
  const user = await createUser();
  await user.update({ name: 'Changed' });
  expect(user.name).toBe('Changed');
});

test('test 2', async () => {
  const user = await createUser();
  expect(user.name).toBe('Original');
});
```

### Retry Strategy

```javascript
// playwright.config.js
export default {
  retries: process.env.CI ? 2 : 0,
  
  // Report flaky tests
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
};

// For individual flaky tests (temporary!)
test('known flaky test', async ({ page }) => {
  test.info().annotations.push({ type: 'flaky', description: 'JIRA-123' });
  // ... test code
});
```

## CI/CD Integration

### Pipeline Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Parallel Execution

```javascript
// playwright.config.js
export default {
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,
  
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
};
```

## Reporting

### Test Report Structure

```markdown
## Test Execution Report

### Summary
| Metric | Value |
|--------|-------|
| Total Tests | 450 |
| Passed | 440 |
| Failed | 8 |
| Skipped | 2 |
| Duration | 12m 34s |
| Pass Rate | 97.8% |

### Failures
| Test | Error | Screenshot |
|------|-------|------------|
| login.spec.ts:15 | Timeout waiting for selector | [link] |
| checkout.spec.ts:42 | Expected 200, got 500 | [link] |

### Coverage
| Area | Coverage |
|------|----------|
| Statements | 84% |
| Branches | 76% |
| Functions | 89% |
| Lines | 84% |
```

### Screenshot on Failure

```javascript
// playwright.config.js
export default {
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
};
```
