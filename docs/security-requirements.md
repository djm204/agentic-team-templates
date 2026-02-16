# Security Requirements

Reference for security in agentic-team-templates. Read when handling user input or external data.

## Principles

- **Zero Trust**: Every input is hostile until proven otherwise
- **No secrets in code or logs**: API keys, tokens, passwords
- **Least privilege**: Minimum permissions for the task

## For This CLI

- Validate template names against known TEMPLATES
- Validate IDE flags against SUPPORTED_IDES
- Sanitize file paths to prevent traversal
- Never log or expose sensitive user data

## General Patterns

```javascript
// Good: Validate before use
if (!TEMPLATES[template]) {
  console.error(`Unknown template: ${template}`);
  process.exit(1);
}

// Good: No secrets in code
const apiKey = process.env.API_KEY; // from env, not hardcoded
```
