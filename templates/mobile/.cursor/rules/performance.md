# Mobile Performance

Optimizing mobile app performance for smooth user experience.

## Performance Goals

- **60 FPS**: Smooth animations and scrolling
- **< 3s**: Cold start time
- **Responsive**: Touch feedback < 100ms
- **Efficient**: Minimal battery drain

## List Performance

### Virtualization

Only render visible items.

```tsx
// React Native FlatList
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Optimized List Items

```tsx
// Memoize list items
const ItemComponent = memo(({ item }: { item: Item }) => (
  <View style={styles.item}>
    <Text>{item.title}</Text>
  </View>
));

// Memoize callbacks
const renderItem = useCallback(
  ({ item }: { item: Item }) => <ItemComponent item={item} />,
  []
);

const keyExtractor = useCallback((item: Item) => item.id, []);
```

## Rendering Optimization

### Avoid Unnecessary Re-renders

```tsx
// Bad: Inline objects cause re-renders
<View style={{ padding: 10 }}>

// Good: Define styles outside
const styles = StyleSheet.create({
  container: { padding: 10 },
});
<View style={styles.container}>

// Bad: Inline functions cause re-renders
<Button onPress={() => handlePress(id)} />

// Good: Memoize callbacks
const handlePressCallback = useCallback(() => handlePress(id), [id]);
<Button onPress={handlePressCallback} />
```

### Memoization

```tsx
// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  // Heavy rendering
});

// Memoize computed values
const sortedData = useMemo(
  () => data.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [data]
);

// Memoize callbacks
const handleSubmit = useCallback((values) => {
  api.submit(values);
}, []);
```

### Debounce Expensive Operations

```tsx
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);

<TextInput
  onChangeText={(text) => {
    setQuery(text);
    debouncedSearch(text);
  }}
/>
```

## Image Optimization

### Proper Sizing

```tsx
// Specify dimensions
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
/>

// Use appropriate image sizes from server
const getImageUrl = (id: string, size: 'thumb' | 'medium' | 'full') => {
  const dimensions = { thumb: 100, medium: 300, full: 1000 };
  return `${API_URL}/images/${id}?w=${dimensions[size]}`;
};
```

### Caching

```tsx
// Use FastImage for better caching
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  style={styles.image}
/>
```

### Lazy Loading

```tsx
// Load images as they come into view
<FlatList
  data={images}
  renderItem={({ item }) => (
    <FastImage
      source={{ uri: item.url }}
      style={styles.image}
    />
  )}
  // Images outside window won't load
  windowSize={3}
/>
```

## Animations

### Use Native Driver

```tsx
// Animate on native thread
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,  // Key for performance
}).start();

// Native driver supports: transform, opacity
// Does NOT support: width, height, margin, padding, colors
```

### Use Reanimated for Complex Animations

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function AnimatedCard() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Content */}
      </Animated.View>
    </Pressable>
  );
}
```

## Startup Performance

### Defer Non-Critical Work

```tsx
function App() {
  useEffect(() => {
    // Defer analytics, crash reporting setup
    InteractionManager.runAfterInteractions(() => {
      initializeAnalytics();
      initializeCrashReporting();
    });
  }, []);
}
```

### Lazy Load Screens

```tsx
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

function AppNavigator() {
  return (
    <Suspense fallback={<ScreenLoader />}>
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Suspense>
  );
}
```

## Memory Management

### Avoid Memory Leaks

```tsx
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler);

  // Always cleanup
  return () => subscription.remove();
}, []);

useEffect(() => {
  let isMounted = true;

  fetchData().then((data) => {
    if (isMounted) {  // Check before setting state
      setData(data);
    }
  });

  return () => {
    isMounted = false;
  };
}, []);
```

### Monitor Memory

```ts
// React Native Hermes memory usage
if (global.HermesInternal) {
  const heapInfo = global.HermesInternal.getRuntimeProperties();
  console.log('Heap size:', heapInfo['Heap size']);
}
```

## Profiling

### React DevTools Profiler

1. Enable profiler in React DevTools
2. Record interaction
3. Analyze component render times
4. Identify unnecessary re-renders

### Performance Monitor

```ts
// Enable performance monitor in dev
import { PerformanceMonitor } from 'react-native';

// Shows JS/UI frame rates
PerformanceMonitor.enable();
```

### Systrace (Android)

```bash
# Capture trace
npx react-native profile-hermes

# Analyze in Chrome DevTools
```

## Common Issues

### JS Thread Blocking

```tsx
// Bad: Heavy computation on JS thread
const processedData = heavyComputation(data);

// Good: Move to background/worker
useEffect(() => {
  InteractionManager.runAfterInteractions(async () => {
    const result = await heavyComputation(data);
    setProcessedData(result);
  });
}, [data]);
```

### Too Many Bridge Calls

```tsx
// Bad: Multiple small updates
items.forEach((item, i) => {
  Animated.timing(positions[i], { toValue: i * 10 }).start();
});

// Good: Batch updates
Animated.parallel(
  items.map((item, i) =>
    Animated.timing(positions[i], { toValue: i * 10 })
  )
).start();
```
