---
id: "0001"
title: Update claude-harness spec — backlog folder, park rule, agent-guard rename
status: resolved
source: plans/harness-backlog-park-rule/00-overview.md
severity: low
created: 2026-06-20
---

## Symptom

`docs/features/claude-harness/claude-harness.spec.en.md` has two categories of stale/missing content discovered after the `harness-backlog-park-rule` and `agent-registry` plans completed:

1. **`planner-guard.mjs` references** — lines 33, 48, and 77 still name `planner-guard.mjs`. The guard was renamed to `agent-guard.mjs` during `plans/agent-registry/03-registry-guard.md` (done 2026-06-20). The spec was explicitly a non-goal of that plan.

2. **Missing backlog/park-rule coverage** — the spec's "Harness Architecture" section does not mention `backlog/README.md` as an emitted file. The "Related Files" list at the bottom omits both `backlog/README.md` and `plans/README.md`. The "Agent Workflow & Backlog Integration" subsection already documents the park rule correctly, but the implementation detail (that `buildClaudeFileMap` now emits `backlog/README.md`) is absent.

## Tried

Nothing attempted — this was deliberately deferred as a non-goal in `plans/harness-backlog-park-rule/00-overview.md` (§ "Spec gap — FLAG for docs-writer"). The original flag noted: "This can proceed in parallel with or after Phase 01 — it does not block execution."

## Why parked

docs/ is docs-writer's exclusive scope. The planner flagged it during propagation work but cannot execute the update. No blocking dependency — execution can start immediately once docs-writer picks it up.

## Suggested direction

docs-writer should open `docs/features/claude-harness/claude-harness.spec.en.md` and make two targeted edits:

1. Replace every occurrence of `planner-guard.mjs` with `agent-guard.mjs` (3 occurrences: lines 33, 48, 77 as of 2026-06-20).

2. In the "Related Files" section at the bottom, add:
   - `backlog/README.md` (or `backlog/` if listed by directory)
   - `plans/README.md`

After edits, run:
```
node .claude/scripts/build-docs-index.mjs
node .claude/scripts/lint-docs-frontmatter.mjs
```
Both must exit 0. Then set this entry `status: resolved`.

## Resolution (2026-06-20)

docs-writer updated `claude-harness.spec.en.md`: replaced all 3 `planner-guard.mjs` → `agent-guard.mjs`, added `backlog/README.md` + `plans/README.md` to Related Files. Docs index + lint both exit 0.
