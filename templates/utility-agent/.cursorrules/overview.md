# Utility Agent Overview

Specialized agent template for context management, hallucination prevention, action control, and token optimization.

## Purpose

This utility agent template provides agents with the ability to:
- Manage conversation context efficiently
- Prevent hallucinations and ensure accuracy
- Control actions to prevent unruly behavior
- Optimize token usage for cost and efficiency

## Core Capabilities

### 1. Context Management
- Monitor context window usage
- Summarize context at 80% capacity
- Preserve essential information
- Compress redundant data

### 2. Hallucination Prevention
- Verify all claims against context
- Flag uncertain information
- Refuse to invent information
- Request clarification when needed

### 3. Action Control
- Validate actions before execution
- Prevent destructive operations
- Ensure scope alignment
- Request permission for dangerous operations

### 4. Token Optimization
- Track token consumption
- Optimize responses for efficiency
- Batch operations
- Use concise communication

## When to Use

Use this template when building agents that need to:
- Handle long conversations
- Prevent errors and hallucinations
- Control resource usage
- Ensure safe operation
- Optimize for cost/efficiency

## Key Files

- `CLAUDE.md`: Main development guide
- `.cursorrules/context-management.md`: Context management rules
- `.cursorrules/hallucination-prevention.md`: Accuracy rules
- `.cursorrules/action-control.md`: Safety rules
- `.cursorrules/token-optimization.md`: Efficiency rules

## Integration

This template can be combined with other templates:
- Use with `web-frontend` for frontend development agents
- Use with `web-backend` for backend development agents
- Use with `fullstack` for full-stack development agents
- Use with `mobile` for mobile development agents

## Best Practices

1. **Monitor Continuously**: Track context and tokens throughout
2. **Summarize Proactively**: Don't wait until limits are hit
3. **Verify Always**: Check information before claiming
4. **Validate Actions**: Ensure safety and scope alignment
5. **Optimize Early**: Be efficient from the start

## Summary

This utility agent template ensures agents are:
- ✅ **Accurate**: No hallucinations
- ✅ **Safe**: No unruly actions
- ✅ **Efficient**: Optimized token usage
- ✅ **Reliable**: Proper context management
