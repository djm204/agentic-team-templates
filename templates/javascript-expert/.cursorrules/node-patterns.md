# Node.js Patterns

Expert-level Node.js patterns for building production services, CLIs, and tooling.

## Runtime Essentials

### Process Lifecycle

```typescript
// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close();
  await db.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejection = crash (don't swallow errors)
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
```

### Streams

```typescript
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { Transform } from 'node:stream';

// Always use pipeline for proper error handling and cleanup
await pipeline(
  createReadStream('input.log'),
  new Transform({
    transform(chunk, _encoding, callback) {
      const filtered = chunk
        .toString()
        .split('\n')
        .filter((line: string) => line.includes('ERROR'))
        .join('\n');
      callback(null, filtered);
    },
  }),
  createGzip(),
  createWriteStream('errors.log.gz'),
);

// Web-standard streams in Node.js
const response = await fetch(url);
const reader = response.body!.getReader();
```

### Worker Threads

```typescript
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

if (isMainThread) {
  const runWorker = <T>(data: unknown): Promise<T> =>
    new Promise((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url), { workerData: data });
      worker.on('message', resolve);
      worker.on('error', reject);
    });

  const result = await runWorker({ task: 'hash', input: largeBuffer });
} else {
  // Worker thread — CPU-intensive work here
  const result = performExpensiveComputation(workerData);
  parentPort!.postMessage(result);
}
```

### File System

```typescript
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';

// Always use fs/promises, never sync variants in async code
const data = await readFile('config.json', 'utf-8');

// Check existence without TOCTOU race
const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

// Atomic writes to prevent corruption
import { writeFile as atomicWrite } from 'atomically';
await atomicWrite('important.json', JSON.stringify(data));

// Use node:path for all path manipulation
import { join, resolve, extname, basename } from 'node:path';
```

## Module System

```typescript
// Use node: protocol for builtins (explicit, no ambiguity)
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// ESM by default — set "type": "module" in package.json
// Use .js extensions in imports (required for ESM)
import { validate } from './validators.js';
```

## Error Handling in Node.js

```typescript
// Custom error classes with cause chaining
class DatabaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

// Wrap external errors with context
try {
  await db.query(sql);
} catch (err) {
  throw new DatabaseError(`Query failed: ${sql}`, { cause: err });
}

// AbortController for cancellation
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    // Handle timeout specifically
  }
  throw err;
}
```

## Configuration

```typescript
// Validate environment at startup, fail fast
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});

// Parse once at startup — crash if invalid
export const env = EnvSchema.parse(process.env);
```

## Anti-Patterns

```typescript
// Never: require() in ESM (use import or createRequire)
// Never: sync fs operations in request handlers
// Never: unbounded concurrency
// Bad:
await Promise.all(thousandItems.map(item => processItem(item)));
// Good: Use p-limit or manual batching
import pLimit from 'p-limit';
const limit = pLimit(10);
await Promise.all(thousandItems.map(item => limit(() => processItem(item))));

// Never: string concatenation for SQL (injection risk)
// Never: eval() or new Function() with user input
// Never: process.exit() without cleanup
```
