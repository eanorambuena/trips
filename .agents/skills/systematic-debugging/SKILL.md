---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

## The Four Phases

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
2. **Reproduce Consistently**
3. **Check Recent Changes** (git diff, recent commits)
4. **Gather Evidence in Multi-Component Systems**
5. **Trace Data Flow**

### Phase 2: Pattern Analysis

1. Find working examples in codebase
2. Compare against references
3. Identify differences
4. Understand dependencies

### Phase 3: Hypothesis and Testing

1. Form single hypothesis: "I think X is root cause because Y"
2. Test minimally (one variable at a time)
3. Verify before continuing
4. If doesn't work: form NEW hypothesis

### Phase 4: Implementation

1. Create failing test case first
2. Implement single fix (root cause, not symptom)
3. Verify fix works
4. If 3+ fixes failed: question architecture

## Red Flags - STOP

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- Proposing solutions before tracing data flow
- "One more fix attempt" (after 2+ failures)

**ALL mean: STOP. Return to Phase 1.**