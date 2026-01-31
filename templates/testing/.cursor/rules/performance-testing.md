# Performance Testing

Guidelines for load testing, stress testing, and performance validation.

## Performance Test Types

| Type | Purpose | Duration | Load Pattern |
|------|---------|----------|--------------|
| Smoke | Verify system works | 1-2 min | Minimal load |
| Load | Normal traffic | 10-30 min | Expected users |
| Stress | Beyond capacity | 30-60 min | Increasing load |
| Spike | Sudden surge | 10-20 min | Sharp increase |
| Soak | Extended period | 4-24 hours | Steady load |
| Breakpoint | Find limits | Until failure | Increasing until break |

## k6 Performance Testing

k6 is a modern, developer-friendly load testing tool.

### Basic Load Test

```js
// load-tests/smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get('http://api.example.com/health');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### Staged Load Test

```js
// load-tests/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const baseUrl = 'http://api.example.com';

  // Simulate user journey
  const productsRes = http.get(`${baseUrl}/products`);
  check(productsRes, { 'products 200': (r) => r.status === 200 });

  const products = JSON.parse(productsRes.body);
  if (products.length > 0) {
    const productId = products[0].id;
    const productRes = http.get(`${baseUrl}/products/${productId}`);
    check(productRes, { 'product 200': (r) => r.status === 200 });
  }

  sleep(Math.random() * 3 + 1); // Random think time 1-4s
}
```

### Stress Test

```js
// load-tests/stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Below normal
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },  // Normal load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },  // Around breaking point
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 },  // Beyond breaking point
    { duration: '5m', target: 400 },
    { duration: '10m', target: 0 },   // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'],
    http_req_failed: ['rate<0.05'], // Allow 5% failure under stress
  },
};

export default function () {
  const response = http.post(
    'http://api.example.com/orders',
    JSON.stringify({
      items: [{ productId: '1', quantity: 1 }],
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(response, {
    'order created': (r) => r.status === 201 || r.status === 429, // Accept rate limiting
  });

  sleep(1);
}
```

### Spike Test

```js
// load-tests/spike.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Warm up
    { duration: '10s', target: 500 }, // Spike!
    { duration: '3m', target: 500 },  // Stay at spike
    { duration: '10s', target: 50 },  // Scale down
    { duration: '3m', target: 50 },   // Recovery
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.10'], // Allow 10% during spike
  },
};

export default function () {
  const response = http.get('http://api.example.com/products');
  check(response, { 'status 200': (r) => r.status === 200 });
  sleep(0.5);
}
```

## Real User Scenarios

### Authenticated User Flow

```js
// load-tests/authenticated-flow.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = 'http://api.example.com';

export const options = {
  vus: 50,
  duration: '10m',
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<1000'],
    'http_req_duration{name:dashboard}': ['p(95)<500'],
    'http_req_duration{name:order}': ['p(95)<2000'],
  },
};

export default function () {
  let authToken;

  group('Login', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: `user${__VU}@test.com`,
        password: 'testpassword',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
      }
    );

    check(loginRes, { 'login successful': (r) => r.status === 200 });
    authToken = JSON.parse(loginRes.body).token;
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  sleep(2);

  group('Browse Dashboard', () => {
    const dashRes = http.get(`${BASE_URL}/dashboard`, {
      headers: authHeaders,
      tags: { name: 'dashboard' },
    });
    check(dashRes, { 'dashboard loaded': (r) => r.status === 200 });
  });

  sleep(3);

  group('Create Order', () => {
    const orderRes = http.post(
      `${BASE_URL}/orders`,
      JSON.stringify({
        items: [
          { productId: '1', quantity: 2 },
          { productId: '2', quantity: 1 },
        ],
      }),
      {
        headers: authHeaders,
        tags: { name: 'order' },
      }
    );
    check(orderRes, { 'order created': (r) => r.status === 201 });
  });

  sleep(1);
}
```

### Mixed Workload

```js
// load-tests/mixed-workload.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const scenarios = {
  browsers: {
    executor: 'constant-vus',
    vus: 30,
    duration: '10m',
    exec: 'browseProducts',
  },
  buyers: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 10 },
      { duration: '6m', target: 10 },
      { duration: '2m', target: 0 },
    ],
    exec: 'purchaseProduct',
  },
  api_users: {
    executor: 'constant-arrival-rate',
    rate: 100,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 50,
    exec: 'apiCalls',
  },
};

export const options = { scenarios };

export function browseProducts() {
  const res = http.get('http://api.example.com/products');
  check(res, { 'browse ok': (r) => r.status === 200 });
  sleep(Math.random() * 5 + 2);
}

export function purchaseProduct() {
  // Login
  const login = http.post('http://api.example.com/auth/login', {
    email: `buyer${__VU}@test.com`,
    password: 'test',
  });

  if (login.status !== 200) return;

  const token = JSON.parse(login.body).token;
  const headers = { Authorization: `Bearer ${token}` };

  // Purchase
  const order = http.post(
    'http://api.example.com/orders',
    JSON.stringify({ items: [{ productId: '1', quantity: 1 }] }),
    { headers }
  );

  check(order, { 'purchase ok': (r) => r.status === 201 });
  sleep(1);
}

export function apiCalls() {
  const endpoints = ['/products', '/categories', '/featured'];
  const endpoint = randomItem(endpoints);
  const res = http.get(`http://api.example.com${endpoint}`);
  check(res, { 'api ok': (r) => r.status === 200 });
}
```

## Performance Thresholds

### Defining SLOs

```js
export const options = {
  thresholds: {
    // Response time
    http_req_duration: [
      'p(50)<200',  // 50% under 200ms
      'p(90)<500',  // 90% under 500ms
      'p(95)<800',  // 95% under 800ms
      'p(99)<1500', // 99% under 1500ms
    ],

    // Error rate
    http_req_failed: ['rate<0.01'], // Less than 1%

    // Throughput
    http_reqs: ['rate>100'], // At least 100 RPS

    // Custom metrics
    'http_req_duration{name:checkout}': ['p(95)<2000'],
    'http_req_duration{name:search}': ['p(95)<300'],

    // Check pass rate
    checks: ['rate>0.99'],
  },
};
```

### Custom Metrics

```js
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';

const orderDuration = new Trend('order_duration');
const orderSuccess = new Rate('order_success');
const ordersCreated = new Counter('orders_created');
const activeUsers = new Gauge('active_users');

export default function () {
  activeUsers.add(__VU);

  const start = Date.now();
  const response = http.post('http://api.example.com/orders', orderData);
  const duration = Date.now() - start;

  orderDuration.add(duration);
  orderSuccess.add(response.status === 201);

  if (response.status === 201) {
    ordersCreated.add(1);
  }
}
```

## CI Integration

### Performance Regression Testing

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Nightly

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start Application
        run: docker-compose up -d

      - name: Wait for healthy
        run: |
          for i in {1..30}; do
            if curl -s http://localhost:3000/health | grep -q "ok"; then
              exit 0
            fi
            sleep 2
          done
          exit 1

      - name: Run Smoke Test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/smoke.js
          flags: --out json=results.json

      - name: Check Results
        run: |
          if jq -e '.metrics.http_req_failed.values.rate > 0.01' results.json; then
            echo "Error rate too high"
            exit 1
          fi

  load-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: smoke-test
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: ./deploy-staging.sh

      - name: Run Load Test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/load.js
          cloud: true
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}

      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: results/
```

### Baseline Comparison

```js
// load-tests/baseline.js
import http from 'k6/http';
import { check } from 'k6';

const BASELINE = {
  p95_latency: 500,
  error_rate: 0.01,
  rps: 100,
};

export const options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    http_req_duration: [`p(95)<${BASELINE.p95_latency * 1.1}`], // 10% tolerance
    http_req_failed: [`rate<${BASELINE.error_rate * 1.5}`],
    http_reqs: [`rate>${BASELINE.rps * 0.9}`],
  },
};

export default function () {
  const res = http.get('http://api.example.com/products');
  check(res, { 'ok': (r) => r.status === 200 });
}

export function handleSummary(data) {
  const current = {
    p95_latency: data.metrics.http_req_duration.values['p(95)'],
    error_rate: data.metrics.http_req_failed.values.rate,
    rps: data.metrics.http_reqs.values.rate,
  };

  console.log('Baseline Comparison:');
  console.log(`  p95 Latency: ${current.p95_latency}ms (baseline: ${BASELINE.p95_latency}ms)`);
  console.log(`  Error Rate: ${(current.error_rate * 100).toFixed(2)}% (baseline: ${BASELINE.error_rate * 100}%)`);
  console.log(`  RPS: ${current.rps.toFixed(0)} (baseline: ${BASELINE.rps})`);

  return {
    'results.json': JSON.stringify({ baseline: BASELINE, current }),
  };
}
```

## Best Practices

### 1. Test in Production-like Environment

- Same infrastructure
- Similar data volume
- Realistic network conditions

### 2. Use Realistic Data

```js
// Use varied test data
const users = JSON.parse(open('./testdata/users.json'));
const products = JSON.parse(open('./testdata/products.json'));

export default function () {
  const user = users[__VU % users.length];
  const product = products[Math.floor(Math.random() * products.length)];
  // ...
}
```

### 3. Include Think Time

```js
// Realistic user behavior includes pauses
sleep(Math.random() * 3 + 1); // 1-4 seconds
```

### 4. Warm Up Before Testing

```js
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Warm up
    { duration: '5m', target: 100 }, // Actual test
    // ...
  ],
};
```

### 5. Monitor Server Metrics

Track alongside load tests:
- CPU usage
- Memory usage
- Database connections
- Queue depths
- Error logs
