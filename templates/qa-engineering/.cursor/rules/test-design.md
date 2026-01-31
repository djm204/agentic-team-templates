# Test Design

Best practices for designing effective test cases.

## Test Case Structure

### Standard Template

```markdown
## Test Case: [TC-XXX]

**Title**: [Clear, action-oriented description]

**Priority**: P0 | P1 | P2 | P3

**Type**: Smoke | Regression | Functional | Integration | E2E

**Requirement**: [Linked user story or requirement ID]

### Preconditions
- [Required system state]
- [Required test data]
- [Required user permissions]

### Test Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [Specific action] | [Observable outcome] |
| 2 | [Specific action] | [Observable outcome] |
| 3 | [Specific action] | [Observable outcome] |

### Postconditions
- [Expected system state after test]
- [Cleanup actions if needed]

### Test Data
| Input | Value | Notes |
|-------|-------|-------|
| [Field] | [Value] | [Any special notes] |

### Notes
- [Any additional context]
- [Known issues or workarounds]
```

### Good vs. Bad Test Cases

**Good Test Case:**
```markdown
## TC-001: User successfully logs in with valid credentials

**Priority**: P0
**Type**: Smoke

### Preconditions
- User account exists with email: test@example.com
- Account is active and not locked

### Test Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /login | Login form displayed |
| 2 | Enter email: test@example.com | Email field populated |
| 3 | Enter password: ValidPass123! | Password field shows masked input |
| 4 | Click "Sign In" button | Loading indicator appears |
| 5 | Wait for response | Redirected to /dashboard |

### Postconditions
- User session created
- Last login timestamp updated
```

**Bad Test Case:**
```markdown
## TC-001: Login test

### Steps
1. Login
2. Check if it works
```
(Vague, no preconditions, no expected results)

## Test Design Techniques

### Equivalence Partitioning

Divide inputs into groups that should behave identically:

```markdown
## Input: Email Address

### Valid Partitions
- Standard email: user@domain.com
- With subdomain: user@mail.domain.com
- With plus: user+tag@domain.com

### Invalid Partitions
- Missing @: userdomain.com
- Missing domain: user@
- Missing local part: @domain.com
- Empty string: ""
- Invalid characters: user@domain..com

### Test Cases
| ID | Input | Expected | Partition |
|----|-------|----------|-----------|
| EP-01 | user@example.com | Valid | Standard |
| EP-02 | user@mail.example.com | Valid | Subdomain |
| EP-03 | user+test@example.com | Valid | Plus addressing |
| EP-04 | userexample.com | Invalid | Missing @ |
| EP-05 | "" | Invalid | Empty |
```

### Boundary Value Analysis

Test at the edges of valid ranges:

```markdown
## Input: Age (Valid Range: 18-120)

### Boundary Values
| Value | Type | Expected |
|-------|------|----------|
| 17 | Below minimum | Invalid |
| 18 | Minimum | Valid |
| 19 | Just above minimum | Valid |
| 119 | Just below maximum | Valid |
| 120 | Maximum | Valid |
| 121 | Above maximum | Invalid |
| 0 | Zero | Invalid |
| -1 | Negative | Invalid |
```

### State Transition Testing

For features with distinct states:

```markdown
## Order State Machine

### States
- Created
- Submitted
- Approved
- Rejected
- Shipped
- Delivered
- Cancelled

### Transitions
| From | To | Trigger | Guard |
|------|-----|---------|-------|
| Created | Submitted | Submit | Has items |
| Created | Cancelled | Cancel | - |
| Submitted | Approved | Approve | Auth user |
| Submitted | Rejected | Reject | Auth user |
| Approved | Shipped | Ship | In stock |
| Approved | Cancelled | Cancel | Not shipped |
| Shipped | Delivered | Deliver | - |

### Test Cases
| ID | Scenario | Expected |
|----|----------|----------|
| ST-01 | Created → Submitted | Success |
| ST-02 | Created → Approved | Fail (invalid transition) |
| ST-03 | Shipped → Cancelled | Fail (too late) |
| ST-04 | Submitted → Rejected → Resubmit | Fail (no path back) |
```

### Decision Table Testing

For complex business rules:

```markdown
## Shipping Cost Calculation

### Conditions
| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 | Rule 5 |
|-----------|--------|--------|--------|--------|--------|
| Order > $100 | Y | Y | N | N | N |
| Prime Member | Y | N | Y | N | N |
| Heavy Item | - | - | - | Y | N |

### Actions
| Action | Rule 1 | Rule 2 | Rule 3 | Rule 4 | Rule 5 |
|--------|--------|--------|--------|--------|--------|
| Free Shipping | X | X | - | - | - |
| $5.99 Shipping | - | - | X | - | - |
| $9.99 Shipping | - | - | - | - | X |
| $14.99 Shipping | - | - | - | X | - |

### Test Cases
| ID | Order | Prime | Heavy | Expected Cost |
|----|-------|-------|-------|---------------|
| DT-01 | $150 | Yes | No | Free |
| DT-02 | $150 | No | No | Free |
| DT-03 | $50 | Yes | No | $5.99 |
| DT-04 | $50 | No | Yes | $14.99 |
| DT-05 | $50 | No | No | $9.99 |
```

### Pairwise Testing

For features with many input combinations:

```markdown
## Search Filter Combinations

### Parameters
- Category: Electronics, Clothing, Books
- Price Range: Under $25, $25-$100, Over $100
- Sort: Price, Rating, Newest
- Availability: In Stock, All

### Pairwise Test Cases (reduced from 36 to ~12)
| ID | Category | Price | Sort | Availability |
|----|----------|-------|------|--------------|
| PW-01 | Electronics | Under $25 | Price | In Stock |
| PW-02 | Electronics | $25-$100 | Rating | All |
| PW-03 | Electronics | Over $100 | Newest | In Stock |
| PW-04 | Clothing | Under $25 | Rating | In Stock |
| PW-05 | Clothing | $25-$100 | Newest | In Stock |
| PW-06 | Clothing | Over $100 | Price | All |
| ... | ... | ... | ... | ... |
```

## Edge Cases & Error Handling

### Common Edge Cases

| Category | Examples |
|----------|----------|
| Empty/Null | Empty string, null, undefined, whitespace only |
| Boundaries | Zero, negative, max int, min int |
| Format | Wrong type, wrong encoding, special characters |
| Timing | Concurrent requests, timeouts, race conditions |
| State | Already exists, doesn't exist, locked, expired |
| Permissions | Unauthorized, wrong role, expired token |

### Error Scenario Template

```markdown
## Error Scenario: [Description]

### Trigger
[How to cause this error]

### Expected Behavior
- User message: [What user should see]
- System action: [What system should do]
- Logging: [What should be logged]
- Recovery: [How to recover]

### Test Cases
| ID | Scenario | Expected Response |
|----|----------|-------------------|
| ERR-01 | Network timeout | Retry with backoff |
| ERR-02 | Invalid input | Validation message |
| ERR-03 | Permission denied | 403 with clear message |
```

## Traceability

### Requirements Mapping

```markdown
## Traceability Matrix

| Requirement | Test Cases | Coverage |
|-------------|------------|----------|
| REQ-001: User login | TC-001, TC-002, TC-003 | Full |
| REQ-002: Password reset | TC-010, TC-011 | Full |
| REQ-003: User profile | TC-020 | Partial |
| REQ-004: Notifications | - | None |
```

### Coverage Analysis

- **Full Coverage**: All acceptance criteria have test cases
- **Partial Coverage**: Some criteria tested, gaps identified
- **No Coverage**: Tests needed - flag for prioritization

## Test Data Design

### Data Categories

| Category | Description | Example |
|----------|-------------|---------|
| Valid | Normal, expected values | "John", 25, "user@test.com" |
| Boundary | At limits of valid range | 0, 100, max length |
| Invalid | Outside valid range | -1, 101, empty |
| Special | Characters that may cause issues | <script>, ', ", NULL |
| Realistic | Production-like data | Actual names, addresses |

### Test Data Best Practices

- **Externalize**: Store data outside tests
- **Version control**: Track data changes
- **Isolation**: Each test manages its own data
- **Cleanup**: Tests clean up after themselves
- **Seeding**: Consistent starting state
