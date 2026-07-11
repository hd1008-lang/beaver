# harness-backlog-park-rule — Overview

## Goal

Propagate the two new harness features — the planner "Backlog integration" section and the `backlog/` park-rule folder — into all scaffold templates so every newly generated project ships the same harness this repo now dogfoods.

## Scope

- `src/scaffold/shared/claude-setup.ts` — add `backlogReadmeTemplate`, register it in `buildClaudeFileMap`, add "Backlog integration" section and blocked-phase wording to `plannerAgentTemplate`, and update `plansReadmeTemplate` to reference the blocked-phase → backlog link.
- `src/scaffold/react-vite/templates/claude-setup.ts` — add park-rule section to `devAgentTemplate`, add planner row and park-rule mention to `claudeMdTemplate`.
- `src/scaffold/chrome-extension/templates/claude-setup.ts` — same as react-vite.
- `src/scaffold/harness-only/templates/generic-skeleton.ts` — add park-rule section to `devAgentTemplate`.
- `src/scaffold/harness-only/templates/react-vite-skeleton.ts` — add park-rule section to `devAgentTemplate`.
- `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts` — add park-rule section to `devAgentTemplate`.

## Non-goals

- No new menu options, cart fields, or project types.
- No changes to `docs/` files (docs-writer scope).
- No spec writing (see Spec gap note below).

## Spec gap — FLAG for docs-writer

`docs/features/claude-harness/claude-harness.spec.en.md` does NOT cover the backlog folder, the park rule, or the planner "Backlog integration" addition. These features ARE documented in `docs/architecture/agent-workflow.en.md` (cross-cutting), but the claude-harness spec's "Related Files" section does not mention `backlog/README.md` and its "Solution / Pattern" section does not describe what the scaffold now emits.

The docs-writer agent should update `docs/features/claude-harness/claude-harness.spec.en.md` to reflect:
1. `buildClaudeFileMap` now emits `backlog/README.md` (project-agnostic, like `plans/README.md`).
2. The planner agent template includes the "Backlog integration" section.
3. The dev agent template (per project type) includes the "Park rule (anti-loop)" section.

This can proceed in parallel with or after Phase 01 — it does not block execution.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | shared-backlog | done | 5/5 | 2026-06-20 |
| 02 | per-type-park-rule | done | 7/7 | 2026-06-20 |

## Phase dependency

Phase 02 depends on Phase 01 (it calls `buildClaudeFileMap` which Phase 01 modifies; both must build cleanly together). However each phase leaves the repo in a working, passing-tsc state on its own.
