# Mobile Testing

Testing strategies for mobile applications.

## Testing Pyramid

```
    ╱╲         Device/E2E Tests (few, slow)
   ╱──╲        Integration Tests
  ╱────╲       Component Tests
 ╱──────╲      Unit Tests (many, fast)
```

## Unit Tests

Test pure functions and business logic.

```ts
// utils/formatters.test.ts
import { formatCurrency, formatDate } from './formatters';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
});

// hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCart } from './useCart';

describe('useCart', () => {
  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 10 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(10);
  });
});
```

## Component Tests

Test components in isolation.

```tsx
// components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders label correctly', () => {
    const { getByText } = render(<Button label="Submit" onPress={() => {}} />);
    expect(getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Submit" onPress={onPress} />);

    fireEvent.press(getByText('Submit'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button label="Submit" onPress={onPress} loading />
    );

    fireEvent.press(getByText('Submit'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Testing with Async Operations

```tsx
// screens/UserProfile.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import { UserProfile } from './UserProfile';

jest.mock('../services/api');

describe('UserProfile', () => {
  it('displays user data after loading', async () => {
    api.getUser.mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    });

    const { getByText, queryByTestId } = render(<UserProfile userId="1" />);

    // Loading state
    expect(queryByTestId('loading')).toBeTruthy();

    // Data loaded
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john@example.com')).toBeTruthy();
    });
  });

  it('shows error on failure', async () => {
    api.getUser.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(getByText(/error/i)).toBeTruthy();
    });
  });
});
```

## Integration Tests

Test navigation and screen interactions.

```tsx
// navigation/AuthFlow.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>{component}</NavigationContainer>
  );
};

describe('Auth Flow', () => {
  it('navigates from login to signup', () => {
    const { getByText } = renderWithNavigation(<AuthNavigator />);

    fireEvent.press(getByText("Don't have an account? Sign up"));

    expect(getByText('Create Account')).toBeTruthy();
  });

  it('logs in and navigates to home', async () => {
    api.login.mockResolvedValue({ token: 'abc', user: { id: '1' } });

    const { getByPlaceholderText, getByText } = renderWithNavigation(
      <AuthNavigator />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(getByText('Welcome')).toBeTruthy();  // Home screen
    });
  });
});
```

## E2E Tests (Detox)

Test full app on device/simulator.

```ts
// e2e/login.e2e.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();

    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

### Detox Best Practices

```ts
// Use testID for reliable selectors
<TouchableOpacity testID="submit-button" onPress={onSubmit}>
  <Text>Submit</Text>
</TouchableOpacity>

// Wait for elements properly
await waitFor(element(by.id('list-item-0')))
  .toBeVisible()
  .withTimeout(5000);

// Handle animations
await element(by.id('button')).tap();
await waitFor(element(by.id('modal'))).toBeVisible();

// Scroll to elements
await element(by.id('scroll-view')).scrollTo('bottom');
await element(by.id('scroll-view')).scroll(200, 'down');
```

## Mocking

### Mock Native Modules

```ts
// jest.setup.js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));
```

### Mock Navigation

```tsx
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));
```

## Snapshot Testing

```tsx
// Use for complex UI that shouldn't change unintentionally
describe('ProductCard', () => {
  it('matches snapshot', () => {
    const tree = render(
      <ProductCard
        product={{
          id: '1',
          name: 'Test Product',
          price: 29.99,
          image: 'https://example.com/image.jpg',
        }}
      />
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
```

## Test Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   └── ...
├── screens/
│   ├── Home/
│   │   ├── HomeScreen.tsx
│   │   └── HomeScreen.test.tsx
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
└── utils/
    ├── formatters.ts
    └── formatters.test.ts

e2e/
├── login.e2e.ts
├── checkout.e2e.ts
└── helpers/
    └── testUtils.ts
```

## CI/CD Testing

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --coverage

  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: detox build --configuration ios.sim.release
      - run: detox test --configuration ios.sim.release

  e2e-android:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: detox build --configuration android.emu.release
      - run: detox test --configuration android.emu.release
```
