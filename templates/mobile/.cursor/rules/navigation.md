# Mobile Navigation

Best practices for navigation in mobile applications.

## Navigation Patterns

### Stack Navigation
For hierarchical content flow.

```tsx
// React Native example
const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
```

### Tab Navigation
For top-level app sections.

```tsx
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
```

### Drawer Navigation
For app-wide menu access.

```tsx
const Drawer = createDrawerNavigator();

function AppDrawer() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Main" component={MainTabs} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Help" component={HelpScreen} />
    </Drawer.Navigator>
  );
}
```

## Deep Linking

### Configuration

```tsx
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: '',
      Details: 'details/:id',
      Profile: 'user/:userId',
      Settings: 'settings',
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking}>
      <AppNavigator />
    </NavigationContainer>
  );
}
```

### Handling Deep Links

```tsx
// Handle incoming links
useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const route = parseDeepLink(event.url);
    if (route) {
      navigation.navigate(route.screen, route.params);
    }
  };

  const subscription = Linking.addEventListener('url', handleDeepLink);
  return () => subscription.remove();
}, []);
```

## Type-Safe Navigation

```tsx
// Define route params
type RootStackParamList = {
  Home: undefined;
  Details: { id: string };
  Profile: { userId: string; initialTab?: string };
};

// Type-safe navigation
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

// Type-safe route params
const route = useRoute<RouteProp<RootStackParamList, 'Details'>>();
const { id } = route.params;

// Navigate with type checking
navigation.navigate('Details', { id: '123' });  // ✓
navigation.navigate('Details');                  // ✗ Error: id required
```

## Navigation State

### Persisting State

```tsx
function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      const savedState = await AsyncStorage.getItem('NAV_STATE');
      if (savedState) {
        setInitialState(JSON.parse(savedState));
      }
      setIsReady(true);
    };
    restoreState();
  }, []);

  if (!isReady) return <SplashScreen />;

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem('NAV_STATE', JSON.stringify(state));
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}
```

## Authentication Flow

```tsx
function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

## Best Practices

### Avoid Prop Drilling Navigation

```tsx
// Bad: Passing navigation through props
<ChildComponent navigation={navigation} />

// Good: Use hooks
function ChildComponent() {
  const navigation = useNavigation();
}
```

### Handle Android Back Button

```tsx
useEffect(() => {
  const onBackPress = () => {
    if (shouldPreventBack) {
      Alert.alert('Discard changes?', '...', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', onPress: () => navigation.goBack() },
      ]);
      return true;  // Prevent default
    }
    return false;  // Allow default
  };

  BackHandler.addEventListener('hardwareBackPress', onBackPress);
  return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
}, []);
```

### Use beforeRemove for Unsaved Changes

```tsx
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    if (!hasUnsavedChanges) return;

    e.preventDefault();

    Alert.alert('Discard changes?', 'You have unsaved changes.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.dispatch(e.data.action),
      },
    ]);
  });

  return unsubscribe;
}, [hasUnsavedChanges]);
```
