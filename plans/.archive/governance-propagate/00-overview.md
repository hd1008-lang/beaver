# governance-propagate — Overview

## Goal

Push three governance improvements that currently exist only in beaver's dogfood `.claude/` directory into the scaffold templates (`src/scaffold/shared/claude-setup.ts`, `src/scaffold/react-vite/templates/claude-setup.ts`, `src/scaffold/chrome-extension/templates/claude-setup.ts`), so that every new project cloned from beaver receives the same governance tooling.

## Context

`plans/governance-cleanup/` added:
1. `.claude/scripts/validate-plans.mjs` — plan/backlog consistency checker (4 checks: A table↔frontmatter, B all-done-not-archived, C backlog ID validity, D blocked↔backlog two-way links).
2. A `validate-plans.mjs` mention in beaver's own `CLAUDE.md` "Docs commands" line.
3. A hard-rule bullet in `.claude/agents/planner.md` — non-blocking follow-ups must become backlog entries, not prose in plans.

None of these reached `src/scaffold/shared/claude-setup.ts`, so scaffolded projects still lack them.

## Scope

- `src/scaffold/shared/claude-setup.ts` — add `validatePlansMjsTemplate()` function and register it in `buildClaudeFileMap`; add `validate-plans.mjs` mention to the shared "Docs commands" block; add the backlog-entry hard-rule bullet to `plannerAgentTemplate`.
- `src/scaffold/react-vite/templates/claude-setup.ts` — add `validate-plans.mjs` to the commands list emitted into CLAUDE.md.
- `src/scaffold/chrome-extension/templates/claude-setup.ts` — same as react-vite.
- Phase 04: sync beaver's own dogfood output (`.claude/scripts/validate-plans.mjs`) against the template to confirm parity.

## Non-goals

- No changes to `docs/` (docs-writer scope — see spec-gap backlog entry `backlog/0002`).
- No changes to harness-only skeleton templates (intentionally minimal per MEMORY.md).
- No wiring of `validate-plans.mjs` into `npm` scripts or CI (separate story).
- No changes to `plans/README.md` template lifecycle/archive gap (backlog/0002 covers that too).

## Spec gap — FLAG for docs-writer (backlog entry needed)

`docs/features/claude-harness/claude-harness.spec.en.md` does not mention `validate-plans.mjs` as a scaffolded script. It also does not mention the plans/README.md archival lifecycle section missing from the template.

**Dev must create `backlog/0002-harness-spec-gap-validate-plans.md`** (planner cannot write to `backlog/`). The entry should record:
- `validate-plans.mjs` is missing from the spec's "Related Files" and "Validator" descriptions.
- `plansReadmeTemplate()` in `src/scaffold/shared/claude-setup.ts` (~line 763) is missing the "Plan lifecycle and archival" section present in the real `plans/README.md` (lines 68–73).
- Suggested direction: docs-writer updates `docs/features/claude-harness/claude-harness.spec.en.md`; a separate dev task adds the archival section to `plansReadmeTemplate`.

This backlog entry should be created as part of phase 04 (sync-dogfood) or immediately after phase 01.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | validate-plans-template | done    | 5/5 | 2026-06-20 |
| 02 | claude-md-command | done    | 4/4 | 2026-06-20 |
| 03 | planner-hard-rule | done    | 3/3 | 2026-06-20 |
| 04 | sync-dogfood | done    | 5/5 | 2026-06-20 |

## Phase dependencies

- Phase 02 and 03 depend on Phase 01 being done (build must stay clean after each phase).
- Phase 04 depends on Phases 01–03 all being done (it verifies parity and archives the plan).
