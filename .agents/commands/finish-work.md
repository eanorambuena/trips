---
description: Pre-commit gate covering code quality, docs, API, DB, cross-layer impact, and manual checks
---

Before marking work complete, run through this checklist:

**Code Quality**
- [ ] Tests pass (run test suite)
- [ ] Linter passes
- [ ] No new warnings or errors
- [ ] Code follows project conventions

**Documentation**
- [ ] README updated if needed
- [ ] API docs updated if changed
- [ ] Comments added for complex logic

**Cross-Layer Impact**
- [ ] Check if other layers/components affected
- [ ] Verify no breaking changes in APIs
- [ ] Check database migrations if applicable

**Manual Checks**
- [ ] Build succeeds
- [ ] Manual testing of critical paths

After verification, summarize: what passed, what failed, what's pending.