---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

## Red-Green-Refactor

### RED - Write Failing Test

Write one minimal test showing what should happen.

```
✅ Clear name, tests real behavior, one thing
❌ Vague name, tests mock not code
```

### Verify RED - Watch It Fail (MANDATORY)

```bash
npm test path/to/test.test.ts
```

Confirm:
- Test fails (not errors)
- Failure message is expected

### GREEN - Minimal Code

Write simplest code to pass the test.

```
✅ Just enough to pass
❌ Over-engineered, YAGNI
```

### Verify GREEN - Watch It Pass (MANDATORY)

```bash
npm test path/to/test.test.ts
```

Confirm:
- Test passes
- Other tests still pass

### REFACTOR - Clean Up

After green only:
- Remove duplication
- Improve names
- Don't add behavior

## Red Flags - STOP

- Code before test
- Test passes immediately
- Can't explain why test failed
- Rationalizing "just this once"

**All mean: Delete code. Start over with TDD.**