# Mobile Development

Guidelines for building mobile applications.

## Scope

This ruleset applies to:
- React Native applications
- Flutter applications
- Native iOS/Android development
- Cross-platform mobile frameworks

## Key Principles

### 1. Mobile-First UX
Design for touch, small screens, and variable connectivity.

### 2. Performance Matters
60fps animations, fast startup, efficient battery usage.

### 3. Offline-First
Apps should work without network when possible.

### 4. Platform Conventions
Respect each platform's design language and conventions.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/          # Screen/page components
├── navigation/       # Navigation configuration
├── hooks/            # Custom hooks
├── services/         # API and native service wrappers
├── store/            # State management
├── utils/            # Utility functions
├── types/            # TypeScript definitions
└── assets/           # Images, fonts, etc.
```

## Core Concerns

### Navigation
- Use standard navigation patterns (stack, tab, drawer)
- Handle deep linking
- Manage navigation state
- Support gestures

### Native Features
- Camera, location, notifications
- File system, storage
- Biometric authentication
- Background tasks

### Performance
- Optimize list rendering (virtualization)
- Minimize re-renders
- Lazy load images
- Profile and optimize startup time

## Definition of Done

A mobile feature is complete when:
- [ ] Works on both platforms (if cross-platform)
- [ ] Handles offline gracefully
- [ ] Animations run at 60fps
- [ ] Accessible (screen readers, dynamic type)
- [ ] Tests pass on device/simulator
- [ ] No memory leaks
- [ ] Handles permissions correctly
