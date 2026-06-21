---
id: "0002"
title: claude-harness spec missing validate-plans.mjs and plans/README.md archival section
status: resolved
source: plans/governance-propagate/00-overview.md
severity: low
created: 2026-06-20
---

## Symptom

Two gaps between the current `docs/features/claude-harness/claude-harness.spec.en.md` and the actual scaffold output after `plans/governance-propagate`:

1. `validate-plans.mjs` is absent from the spec's "Related Files" section and is not described in any "Validator" coverage block. After governance-propagate phase 01, the script IS emitted by `buildClaudeFileMap` — but the spec has not been updated to reflect this.

2. `plansReadmeTemplate()` in `src/scaffold/shared/claude-setup.ts` (~line 763) is missing the "Plan lifecycle and archival" section present in the real `plans/README.md` (lines 66–73). The dogfood `plans/README.md` explains when to archive vs keep vs delete a completed plan — the scaffolded version does not.

## Tried

Not applicable — this is a spec-gap flag, not a failed implementation step. The gaps were identified during the parity check in governance-propagate phase 04.

## Why parked

Spec updates are docs-writer scope; dev does not write to `docs/`. The `plansReadmeTemplate` gap is a separate dev task that requires its own plan phase to add the archival section without breaking existing tests/output.

## Suggested direction

- **docs-writer**: update `docs/features/claude-harness/claude-harness.spec.en.md` — add `validate-plans.mjs` to "Related Files" and describe its four checks (A: table↔frontmatter, B: all-done-not-archived, C: backlog ID validity, D: blocked↔backlog two-way links).
- **dev (separate task)**: extend `plansReadmeTemplate()` in `src/scaffold/shared/claude-setup.ts` to include the "Plan lifecycle and archival" section matching `plans/README.md` lines 66–73.

## Resolution (2026-06-20)

Both parts done. docs-writer added `validate-plans.mjs` to Related Files and described its 4 checks (A–D) in the spec's validator coverage. dev added the "Plan lifecycle and archival" section to `plansReadmeTemplate()`, verified verbatim-matching the dogfood `plans/README.md` (build clean).
