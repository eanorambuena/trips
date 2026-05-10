---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing - requires running verification commands before making any success claims
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Test original symptom: passes | Code changed |
| Regression test works | Red-green cycle verified | Test passes once |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- Committing/pushing without verification
- Trusting agent success reports without evidence

## Key Pattern

```
✅ [Run test command] [See: pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Run the command. Read the output. THEN claim the result.**