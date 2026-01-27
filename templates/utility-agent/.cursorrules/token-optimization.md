# Token Optimization

Rules for efficient token usage and resource management.

## Core Principle

**Maximize value per token: Be concise, clear, and efficient.**

## Token Tracking

### Monitor Usage

Track token consumption throughout conversation:
- Input tokens (user messages + context)
- Output tokens (agent responses)
- Total tokens (cumulative)
- Estimated cost (if applicable)

### Capacity Awareness

- **< 50%**: Normal operation
- **50-80%**: Monitor closely
- **80-90%**: Optimize aggressively
- **> 90%**: Critical - summarize context

## Optimization Strategies

### 1. Use Toon Format for Prompt Optimization

**Use toon format instead of JSON for data passing in prompts/responses to reduce token usage.**

**❌ Inefficient (JSON in prompts)**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**✅ Efficient (Toon format in prompts)**:
```
status:success
data.user.id:123
data.user.name:John Doe
data.user.email:john@example.com
```

**⚠️ CRITICAL: Data Storage Rules**

- **Prompt/Response Optimization**: Use toon format to reduce tokens
- **Data Storage**: **NEVER use toon** - Always use JSON, YAML, or other standard formats
- **File Storage**: Always use standard formats (JSON, YAML, TOML, etc.)
- **API Responses**: Use JSON (standard format)
- **Configuration Files**: Use standard formats (JSON, YAML, TOML)

**When to use toon**:
- ✅ Internal prompt data passing
- ✅ Temporary data in conversation context
- ✅ Token-optimized intermediate representations

**When NOT to use toon**:
- ❌ File storage (use JSON/YAML/TOML)
- ❌ Database storage (use standard formats)
- ❌ API responses (use JSON)
- ❌ Configuration files (use standard formats)
- ❌ Any persistent data storage

### 2. Concise Communication

**❌ Verbose (High Token Usage)**:
```
I understand that you want me to implement a user authentication system 
for your application. This is an important feature that will allow users 
to securely log in and access their accounts. Let me start by reading 
the existing codebase to understand the current structure and then I'll 
implement the authentication functionality step by step.
```

**✅ Concise (Low Token Usage)**:
```
Implementing user authentication. Reading codebase structure, then 
implementing OAuth2 flow.
```

### 3. Batch Operations

**❌ Inefficient (Multiple Round Trips)**:
```
[Round 1] Reading file1.ts...
[Round 2] Reading file2.ts...
[Round 3] Reading file3.ts...
```

**✅ Efficient (Single Round Trip)**:
```
[Single round] Reading file1.ts, file2.ts, file3.ts...
```

### 4. Selective Context

**❌ Inefficient (Reading Entire Files)**:
```
Reading 5000-line file when only need 50 lines...
```

**✅ Efficient (Reading Specific Sections)**:
```
Reading lines 100-150 of file.ts (relevant section only)...
```

### 5. Remove Redundancy

**❌ Redundant**:
```
The function calculates the total. It takes items as input. It returns 
the total. The total is the sum of all item prices.
```

**✅ Concise**:
```
Function calculates sum of item prices.
```

## Response Optimization

### Structure Responses Efficiently

**Format**:
- Use bullet points for lists
- Use code blocks for code
- Use tables for structured data
- Skip unnecessary explanations

### Example: Optimized Response

**❌ Verbose**:
```
I've successfully implemented the user authentication feature. The 
implementation includes a login component that allows users to sign in 
with their Google account using OAuth2. The component handles the OAuth 
flow, manages the session with secure HTTP-only cookies, and includes 
proper error handling for various edge cases. I've also added loading 
states to provide user feedback during the authentication process.
```

**✅ Concise**:
```
✅ Authentication implemented:
- OAuth2 login with Google
- Session management (HTTP-only cookies)
- Error handling + loading states
```

## Tool Call Optimization

### Batch Related Operations

**❌ Inefficient**:
```typescript
// Multiple separate calls
read_file('src/auth/login.ts');
// wait
read_file('src/auth/session.ts');
// wait
read_file('tests/auth/login.test.ts');
```

**✅ Efficient**:
```typescript
// Single batched call
read_file('src/auth/login.ts');
read_file('src/auth/session.ts');
read_file('tests/auth/login.test.ts');
```

### Use Specific Searches

**❌ Inefficient**:
```
Reading entire codebase to find function...
```

**✅ Efficient**:
```
Searching for "calculateTotal" function...
[uses grep or codebase_search]
```

### Cache Frequently Accessed Info

**❌ Inefficient**:
```
[Re-reading same file multiple times]
```

**✅ Efficient**:
```
[Reading once, referencing in memory]
```

## Context Management

### Include Only Relevant Context

**❌ Inefficient**:
- Including entire conversation history
- Including completed work details
- Including irrelevant file contents
- Including redundant information

**✅ Efficient**:
- Summarizing old context
- Including only active files
- Focusing on current task
- Removing completed work

### Proactive Summarization

At 80% capacity:
1. Identify what's essential
2. Summarize old context
3. Remove redundant information
4. Preserve active context

## Communication Patterns

### Use Abbreviations (When Clear)

- ✅ "API" instead of "Application Programming Interface"
- ✅ "OAuth" instead of "Open Authorization"
- ✅ "DB" instead of "Database" (in technical context)
- ❌ Don't abbreviate if it reduces clarity

### Use Symbols and Formatting

- ✅ "✅" instead of "Successfully completed"
- ✅ "❌" instead of "This is incorrect"
- ✅ "⚠️" instead of "Warning"
- ✅ Bullet points instead of paragraphs

### Skip Unnecessary Words

**Remove**:
- "I think that..."
- "It seems like..."
- "I believe..."
- "In my opinion..."
- "Let me tell you that..."

**Keep**:
- Direct statements
- Action items
- Results
- Errors

## Examples

### Example 1: Code Explanation

**❌ Verbose**:
```
This function takes an array of items and calculates the total price 
by iterating through each item and adding up their prices. It uses 
the reduce method which is a functional programming approach that 
accumulates values. The function returns a number representing the 
total sum.
```

**✅ Concise**:
```
Function sums item prices using reduce, returns total.
```

### Example 2: Status Update

**❌ Verbose**:
```
I've successfully completed the implementation of the user authentication 
feature. All the tests are passing, the code has been formatted, and 
I've updated the documentation. The feature is now ready for review.
```

**✅ Concise**:
```
✅ Auth feature complete:
- Tests passing
- Code formatted
- Docs updated
Ready for review.
```

### Example 3: Error Report

**❌ Verbose**:
```
I encountered an error while trying to execute the command. The error 
message indicates that there's a problem with the file path. It seems 
like the file doesn't exist at the specified location. I need you to 
verify the file path and make sure the file actually exists before I 
can proceed.
```

**✅ Concise**:
```
❌ Error: File not found at specified path.
Please verify file exists and path is correct.
```

## Token Budget Allocation

### Prioritize

1. **User Intent** (High priority)
2. **Active Code** (High priority)
3. **Error Messages** (High priority)
4. **Completed Work** (Low priority - summarize)
5. **Old Context** (Low priority - compress)

### Allocate Wisely

- **80%** for current task
- **15%** for recent context
- **5%** for old context (summarized)

## Monitoring and Alerts

### Token Usage Alerts

At thresholds:
- **50%**: "Context at 50%, monitoring usage"
- **75%**: "Context at 75%, will summarize at 80%"
- **80%**: "Summarizing context to optimize usage"
- **90%**: "⚠️ Context critical, aggressive optimization"

### Optimization Actions

When usage is high:
1. Summarize old context
2. Remove redundant information
3. Batch operations
4. Use concise communication
5. Focus on essential only

## Enforcement

- Monitor token usage continuously
- Optimize proactively (not reactively)
- Use concise communication
- Batch operations when possible
- Summarize context at 80%
- Remove redundancy immediately

## Summary

- ✅ Use toon format for prompt optimization (token reduction)
- ✅ **NEVER use toon for data storage** (use JSON/YAML/standard formats)
- ✅ Be concise and clear
- ✅ Batch related operations
- ✅ Use specific searches
- ✅ Summarize context proactively
- ✅ Remove redundancy
- ✅ Monitor usage continuously
- ✅ Optimize before hitting limits
