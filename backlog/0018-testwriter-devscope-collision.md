---
id: "0018"
title: "validate-structure.mjs fails on itself when testing:true — test-writer and dev share 'src/' as primary writeScope dir"
status: resolved
source: plans/assets-and-tests/07-filemap-and-validator-tests.md
severity: medium
created: 2026-07-05
resolution: >
  Reordered TEST_WRITER_DEF.writeScope (src/scaffold/shared/harness-setup.ts)
  to ['test/', 'tests/', 'e2e/', 'playwright/', 'src/'] so its primary dir
  (writeScope[0]) is uniquely 'test/' — no other agent's writeScope starts
  with 'test/'. Verified agent-guard-core.mjs's checkWritePermission() does a
  full array membership check (`.some(...)`), not an index-0 check, so
  reordering does not change actual write-permission semantics. Added a
  regression test in test/validator-selftest.test.ts ("harness: both +
  testing enabled, backlog/0018 regression") asserting the emitted
  scripts/validate-structure.mjs exits 0 against its own render with
  testing enabled — the exact combination the phase 07 self-test previously
  avoided. All 7 tests in that file pass; tsc --noEmit clean.
---

## Symptom

`buildClaudeFileMap({ ..., testing: { testWriterAgent, testAuthorSkill } })` bakes a
`WRITE_SCOPES` object into the emitted `scripts/validate-structure.mjs` that includes
both `dev` (`writeScope: ['src/', 'test/', ...]`) and `test-writer`
(`TEST_WRITER_DEF.writeScope: ['src/', 'test/', 'tests/', 'e2e/', 'playwright/']`,
`src/scaffold/shared/claude-setup.ts` ~line 136). The emitted validator's own
"primary owned directory uniqueness" check (its step 3) compares each agent's
`writeScope[0]` — both are `'src/'` — so any project scaffolded with `testing`
enabled together with a Claude-inclusive harness (`claude` or `both`) gets a
`scripts/validate-structure.mjs` that fails against its own emitted output with:

```
agents "dev" and "test-writer" share the same primary owned directory "src/"
```

## Tried

Discovered while writing `test/validator-selftest.test.ts` (plans/assets-and-tests
phase 07): rendering `buildClaudeFileMap({ ...beaverParams, harness: 'both', testing: {...} })`
and running the emitted `scripts/validate-structure.mjs` against the render reproduces
the failure every time (confirmed via a throwaway `npx tsx` script, then removed).
Rendering the same combo WITHOUT `testing` does not trip the check — validate-structure.mjs
passes. Worked around it in phase 07 by deliberately rendering the validator self-test
without `testing` (see comment in `test/validator-selftest.test.ts`), so this backlog
entry is the only place tracking the underlying bug.

## Why parked

Out of scope for plans/assets-and-tests phase 07 (that phase is about adding tests for
the FileMap/validators, not fixing claude-setup.ts's agent-scope model). Fixing it
requires a real design decision: either test-writer's primary dir becomes `test/`
(reorder its `writeScope` array — the "primary dir" is defined as `writeScope[0]`),
or the uniqueness check needs to tolerate agents that legitimately share a directory
(dev and test-writer both write under `src/` by design — dev owns application code,
test-writer owns tests, and CLAUDE.md's own "Adding New Options" checklist assumes
dev can touch `test/` too). Whichever fix is chosen affects the real agent-guard
scope-checking logic (`scripts/agent-guard-core.mjs`), not just the validator, so it
needs its own scoped phase.

## Suggested direction

- Simplest: reorder `TEST_WRITER_DEF.writeScope` to `['test/', 'tests/', 'e2e/', 'playwright/', 'src/']`
  so its primary dir is `test/` (already uniquely owned — no other agent's writeScope
  starts with `test/`). Verify this doesn't change `agent-guard-core.mjs`'s actual
  write-permission semantics (a full array membership check, not just index 0) — only
  the validator's derived "primary dir" heuristic cares about ordering.
- Add a regression test asserting `buildClaudeFileMap({ harness: 'both', testing: {...} })`'s
  emitted `scripts/validate-structure.mjs`, when run against its own render, exits 0 —
  this is the scenario the current phase 07 self-test deliberately avoids.
