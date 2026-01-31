# Offline-First Development

Building mobile apps that work reliably without network connectivity.

## Principles

### 1. Assume Unreliable Network
Mobile networks are inconsistent. Design for it.

### 2. Local-First
Read from local storage, sync in background.

### 3. Optimistic Updates
Update UI immediately, reconcile later.

### 4. Graceful Degradation
Show what's available, queue what isn't.

## Data Storage

### Choosing Storage

| Storage Type | Use Case | Persistence |
|--------------|----------|-------------|
| AsyncStorage | Simple key-value, settings | Persistent |
| SQLite/Realm | Structured data, queries | Persistent |
| MMKV | Fast key-value | Persistent |
| In-memory | Temporary, session data | Session only |

### Local Database

```ts
// Example with SQLite/TypeORM
@Entity()
class Task {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  syncedToServer: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastModified: Date;
}
```

## Sync Strategies

### Pull Strategy (Server → Device)

```ts
async function pullChanges() {
  const lastSync = await getLastSyncTimestamp();

  const changes = await api.getChanges({ since: lastSync });

  await db.transaction(async (tx) => {
    for (const item of changes.items) {
      await tx.upsert('tasks', item);
    }
    await tx.update('metadata', { lastSync: changes.timestamp });
  });
}
```

### Push Strategy (Device → Server)

```ts
async function pushChanges() {
  const pendingChanges = await db.query(
    'SELECT * FROM tasks WHERE syncedToServer = false'
  );

  for (const change of pendingChanges) {
    try {
      await api.syncTask(change);
      await db.update('tasks', change.id, { syncedToServer: true });
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;  // Server rejected, need conflict resolution
      }
      // Network error, will retry later
    }
  }
}
```

### Conflict Resolution

```ts
type ConflictResolution = 'server-wins' | 'client-wins' | 'manual';

async function resolveConflict(
  local: Task,
  server: Task,
  strategy: ConflictResolution
): Promise<Task> {
  switch (strategy) {
    case 'server-wins':
      return server;

    case 'client-wins':
      await api.updateTask(local);
      return local;

    case 'manual':
      // Store conflict for user resolution
      await storeConflict({ local, server });
      throw new ConflictError('Manual resolution required');
  }
}
```

## Network State Management

### Detecting Connectivity

```ts
import NetInfo from '@react-native-community/netinfo';

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    return unsubscribe;
  }, []);

  return { isOnline, connectionType };
}
```

### Queueing Operations

```ts
class OperationQueue {
  private queue: Operation[] = [];

  async enqueue(operation: Operation) {
    await this.persistQueue([...this.queue, operation]);
    this.queue.push(operation);
    this.processIfOnline();
  }

  private async processIfOnline() {
    if (!await isOnline()) return;

    while (this.queue.length > 0) {
      const op = this.queue[0];
      try {
        await this.execute(op);
        this.queue.shift();
        await this.persistQueue(this.queue);
      } catch (error) {
        if (isNetworkError(error)) {
          break;  // Stop, will retry when online
        }
        throw error;
      }
    }
  }
}
```

## Optimistic Updates

```tsx
function useOptimisticTask() {
  const queryClient = useQueryClient();

  const updateTask = useMutation({
    mutationFn: api.updateTask,

    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot current value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old.map((t) => (t.id === newTask.id ? newTask : t))
      );

      return { previousTasks };
    },

    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previousTasks);
    },

    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return updateTask;
}
```

## Caching

### Cache Headers

```ts
const cacheConfig = {
  images: { maxAge: 7 * 24 * 60 * 60 },      // 1 week
  apiResponses: { maxAge: 5 * 60 },          // 5 minutes
  staticAssets: { maxAge: 30 * 24 * 60 * 60 }, // 30 days
};
```

### Stale-While-Revalidate

```ts
async function fetchWithSWR<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // Return cached data immediately
  const cached = await cache.get(key);
  if (cached) {
    // Revalidate in background
    fetcher()
      .then((fresh) => cache.set(key, fresh))
      .catch(console.error);
    return cached;
  }

  // No cache, wait for network
  const data = await fetcher();
  await cache.set(key, data);
  return data;
}
```

## UI Patterns

### Show Sync Status

```tsx
function TaskItem({ task }: { task: Task }) {
  return (
    <View style={styles.item}>
      <Text>{task.title}</Text>
      {!task.syncedToServer && (
        <View style={styles.syncIndicator}>
          <CloudOffIcon />
          <Text>Pending sync</Text>
        </View>
      )}
    </View>
  );
}
```

### Offline Banner

```tsx
function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text>You're offline. Changes will sync when connected.</Text>
    </View>
  );
}
```

### Queue Indicator

```tsx
function SyncStatus() {
  const { pendingCount, isSyncing } = useSyncStatus();

  if (pendingCount === 0) return null;

  return (
    <View style={styles.syncStatus}>
      {isSyncing ? (
        <ActivityIndicator />
      ) : (
        <Text>{pendingCount} changes pending</Text>
      )}
    </View>
  );
}
```
