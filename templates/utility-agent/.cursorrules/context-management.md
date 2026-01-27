# Context Management

Rules for managing conversation context efficiently and preventing context window overflow.

## Context Window Monitoring

### Capacity Thresholds

- **< 50%**: Normal operation, no action needed
- **50-80%**: Monitor closely, prepare for summarization
- **80-90%**: **MUST summarize** - Compress old context immediately
- **> 90%**: **CRITICAL** - Summarize aggressively, drop non-essential context

### When to Summarize

Summarize context when utilization reaches **80%** or higher.

## Summarization Strategy

### What to Keep

**Always Preserve**:
- User's primary goal/request
- Current active task
- Recent messages (last 5-10 exchanges)
- Active file contents being edited
- Current error states
- Active todos
- Critical constraints/requirements

### What to Compress

**Summarize**:
- Completed tasks (keep outcome, drop process)
- Old conversation history (extract key decisions)
- Resolved errors (keep solution, drop details)
- Closed todos (mark complete, remove details)

### What to Remove

**Discard**:
- Redundant information
- Repeated explanations
- Failed attempts (keep lessons learned)
- Irrelevant file contents
- Completed work details

## Context Compression Techniques

### 1. Extract Key Decisions

**Before**:
```
User asked to implement authentication. We discussed OAuth2 vs JWT. 
User chose OAuth2. We decided on Google as provider. We discussed 
session management and chose HTTP-only cookies. We implemented 
the OAuth flow with state parameter for CSRF protection.
```

**After**:
```
Authentication: OAuth2 with Google provider, HTTP-only cookies, 
CSRF protection via state parameter.
```

### 2. Summarize Completed Work

**Before**:
```
Created login.ts component with button. Added onClick handler. 
Implemented OAuth redirect. Added error handling. Styled button 
with Tailwind. Added loading state. Tested in browser.
```

**After**:
```
Login component: OAuth2 flow with error handling and loading states.
```

### 3. Archive Old Context

**Before**:
```
[50 messages of back-and-forth about API design]
```

**After**:
```
API design decided: RESTful endpoints, JSON responses, 
authentication via Bearer token.
```

## Context Summary Format

When summarizing, use this format:

```markdown
## Context Summary

**User Goal**: [Primary objective]

**Completed**:
- [Outcome 1]
- [Outcome 2]

**Active**:
- [Current task 1]
- [Current task 2]

**Constraints**:
- [Constraint 1]
- [Constraint 2]

**Recent Files**:
- [file1.ts] (active)
- [file2.ts] (pending)

**Key Decisions**:
- [Decision 1]
- [Decision 2]
```

## Proactive Context Management

### Before Reading Large Files

Ask: "Do you need the entire file, or should I focus on specific sections?"

### Before Long Explanations

Ask: "Should I provide a detailed explanation, or a concise summary?"

### When Context is High

Notify: "Context usage is at 75%. I'll summarize old context if it reaches 80%."

## Context Preservation Rules

### Never Remove

- User's explicit requirements
- Active error messages
- Current file being edited
- Security constraints
- Breaking changes information

### Always Summarize Before Removing

- Don't drop context silently
- Always notify when summarizing
- Preserve essential information
- Document what was compressed

## Examples

### Good Context Management

```
[At 80% capacity]

I'm summarizing the conversation history to free up context space.

**Summary**:
- Goal: Implement user authentication
- Completed: OAuth2 setup, login component
- Active: Writing tests
- Constraints: TypeScript strict, security-first

Continuing with test implementation...
```

### Bad Context Management

```
[At 95% capacity, no action taken]

[Continues with full context, hits limit, fails]
```

## Enforcement

- Monitor context usage continuously
- Summarize proactively at 80%
- Notify user when summarizing
- Preserve essential information
- Document compression decisions
