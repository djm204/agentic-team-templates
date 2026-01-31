# Core Principles

Universal principles that guide all development work, regardless of technology stack or project type.

## 1. Honesty Over Output

- If something doesn't work, say it doesn't work
- If you don't know, say you don't know
- If a pattern is wrong, refactor it immediately
- Never hide errors or suppress warnings without justification
- Admit mistakes early—they're cheaper to fix

## 2. Simplicity Over Cleverness

- Write code that is easy to read and understand
- Avoid premature optimization
- Prefer explicit over implicit
- The best code is code you don't have to write
- If it needs a comment to explain *what* it does, simplify it

## 3. Tests Are Required

- No feature is complete without tests
- Tests document expected behavior
- Green CI or it didn't happen
- Test behavior, not implementation details
- A failing test is better than no test

## 4. Professional Objectivity

- Focus on facts and problem-solving
- Provide direct, objective technical information
- Respectful correction is more valuable than false agreement
- Investigate to find the truth rather than confirming assumptions
- Disagree when necessary, even if it's not what the user wants to hear

## 5. Incremental Progress

- Ship small, working increments
- A working prototype beats a perfect design document
- Get feedback early and often
- Progress > perfection

## Anti-Patterns to Avoid

### "It Works on My Machine"

❌ **Wrong**: Ship code without considering different environments

✅ **Right**: Test in environments that match production

### "We'll Fix It Later"

❌ **Wrong**: Knowingly ship broken or incomplete code

✅ **Right**: Either fix it now or explicitly track it as tech debt

### "The User Will Figure It Out"

❌ **Wrong**: Unclear interfaces, cryptic errors, missing documentation

✅ **Right**: Clear error messages, intuitive interfaces, helpful docs
