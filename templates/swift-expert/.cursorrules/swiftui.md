# SwiftUI

Declarative UI with composable views, state management, and the observation framework.

## View Fundamentals

```swift
struct UserProfileView: View {
    let user: User

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            AsyncImage(url: user.avatarURL) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(width: 80, height: 80)
            .clipShape(Circle())

            Text(user.name)
                .font(.title2)
                .fontWeight(.bold)

            Text(user.bio)
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}
```

## State Management

```swift
// @State — view-local mutable state (value types)
struct CounterView: View {
    @State private var count = 0

    var body: some View {
        Button("Count: \(count)") { count += 1 }
    }
}

// @Binding — two-way connection to parent's state
struct ToggleRow: View {
    let title: String
    @Binding var isOn: Bool

    var body: some View {
        Toggle(title, isOn: $isOn)
    }
}

// @StateObject — owned reference type (create once)
struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()

    var body: some View {
        List(viewModel.users) { user in
            UserRow(user: user)
        }
        .task { await viewModel.loadUsers() }
    }
}

// @ObservedObject — non-owned reference type (passed in)
struct UserDetailView: View {
    @ObservedObject var viewModel: UserDetailViewModel
    // ...
}

// @EnvironmentObject — shared dependency via environment
struct SettingsView: View {
    @EnvironmentObject var theme: ThemeManager
    // ...
}
```

## Observation Framework (iOS 17+)

```swift
// @Observable replaces ObservableObject
@Observable
class UserViewModel {
    var users: [User] = []
    var isLoading = false
    var error: AppError?

    func loadUsers() async {
        isLoading = true
        defer { isLoading = false }
        do {
            users = try await userService.fetchAll()
        } catch {
            self.error = AppError(error)
        }
    }
}

// No @Published needed. SwiftUI tracks property access automatically
struct UserListView: View {
    var viewModel = UserViewModel()

    var body: some View {
        List(viewModel.users) { user in
            Text(user.name)
        }
        .overlay { if viewModel.isLoading { ProgressView() } }
        .task { await viewModel.loadUsers() }
    }
}
```

## Navigation

```swift
// NavigationStack with type-safe routing
enum Route: Hashable {
    case userDetail(User)
    case settings
    case editProfile
}

struct ContentView: View {
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .userDetail(let user):
                        UserDetailView(user: user)
                    case .settings:
                        SettingsView()
                    case .editProfile:
                        EditProfileView()
                    }
                }
        }
    }
}
```

## Composition Patterns

```swift
// Small, composable views
struct AvatarView: View {
    let url: URL?
    var size: CGFloat = 40

    var body: some View {
        AsyncImage(url: url) { image in
            image.resizable().scaledToFill()
        } placeholder: {
            Image(systemName: "person.circle.fill")
                .foregroundStyle(.secondary)
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
}

// ViewModifier for reusable styling
struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.background)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(radius: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardModifier())
    }
}

// Usage: Text("Hello").cardStyle()
```

## Lists and Performance

```swift
// Lazy loading
struct UserListView: View {
    let users: [User]

    var body: some View {
        List {
            ForEach(users) { user in
                UserRow(user: user)
            }
        }
        .listStyle(.plain)
    }
}

// LazyVStack for custom layouts
ScrollView {
    LazyVStack(spacing: 8) {
        ForEach(items) { item in
            ItemView(item: item) // Only created when visible
        }
    }
}
```

## Previews

```swift
#Preview("User Profile") {
    UserProfileView(user: .preview)
        .padding()
}

#Preview("Loading State") {
    UserProfileView(user: .preview)
        .redacted(reason: .placeholder)
}

// Preview data
extension User {
    static var preview: User {
        User(id: UUID(), name: "Jane Doe", email: "jane@example.com")
    }
}
```

## Anti-Patterns

```swift
// Never: massive body properties
var body: some View {
    // 200 lines of nested views
}
// Use: extract subviews as separate structs or computed properties

// Never: business logic in views
var body: some View {
    Button("Submit") {
        let valid = email.contains("@") && password.count >= 8
        if valid { /* ... */ }
    }
}
// Use: view model with dedicated validation

// Never: @ObservedObject for view-created objects
@ObservedObject var vm = MyViewModel() // Recreated on every view update!
// Use: @StateObject for view-owned objects

// Never: ignoring .task lifecycle
.onAppear { Task { await load() } } // No automatic cancellation
// Use: .task { await load() } — cancelled when view disappears
```
