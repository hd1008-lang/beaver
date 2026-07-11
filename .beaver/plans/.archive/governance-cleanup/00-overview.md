# governance-cleanup — Overview

## Goal

Patch four governance gaps in the beaver harness so that knowledge doesn't leak into prose, done plans don't litter `plans/`, plan/backlog health is mechanically checkable, and the planner agent's own convention is consistent with `backlog/README.md`.

## Scope

- `backlog/` — create `backlog/0001-harness-spec-gap-park-rule.md` to anchor the floating spec-update work from `plans/harness-backlog-park-rule/00-overview.md`.
- `plans/.archive/` — move both fully-done plans (`harness-backlog-park-rule/` and `agent-registry/`) to `.archive/`.
- `.claude/scripts/validate-plans.mjs` — new standalone Node script that checks plan/backlog consistency.
- `.claude/agents/planner.md` — add one rule: non-blocking follow-ups must be filed as backlog entries, not left in prose.
- `docs/features/claude-harness/claude-harness.spec.en.md` — FLAG for docs-writer (stale `planner-guard.mjs` references and missing backlog/park-rule coverage); not executed here.

## Non-goals

- No changes to `src/` or scaffold templates.
- No changes to `docs/` files (docs-writer scope — flagged, not executed).
- No wiring of the new script into `npm` scripts or CI (separate story).
- No changes to `backlog/README.md` itself.

## Owner map (cross-agent work)

| Phase | Owner | Why |
|---|---|---|
| 01 | dev | creates `backlog/0001-*.md`; planner can't write to `backlog/` |
| 02 | dev | moves plan dirs into `.archive/`; planner can't move files outside `plans/` |
| 03 | dev | writes `.claude/scripts/validate-plans.mjs`; planner can't write to `.claude/scripts/` |
| 04 | dev | edits `.claude/agents/planner.md`; planner can't write to `.claude/agents/` |

Each phase file spells out the exact content dev should produce so it can be copy-executed.

## Spec gap — FLAG for docs-writer

`docs/features/claude-harness/claude-harness.spec.en.md` has two categories of stale content:

1. **`planner-guard.mjs` references** (lines 33, 48, 77) — the guard was renamed to `agent-guard.mjs` during the agent-registry plan but the spec was not updated (non-goal of that plan). Needs: s/`planner-guard.mjs`/`agent-guard.mjs`/ in three places; update the "Path guarding" sentence to say the guard is now the general `agent-guard.mjs` emitted from `AGENTS`.

2. **Missing backlog/park-rule coverage** — the spec's "Harness Architecture" paragraph doesn't mention `backlog/README.md` as an emitted file, and the "Agent Workflow & Backlog Integration" table already exists in the spec but the "Related Files" list at the bottom doesn't include `backlog/README.md` or `plans/README.md`. The park-rule wording in `docs/architecture/agent-workflow.en.md` is the authoritative source.

docs-writer should update `docs/features/claude-harness/claude-harness.spec.en.md` then run `node .claude/scripts/build-docs-index.mjs` and `node .claude/scripts/lint-docs-frontmatter.mjs`.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | anchor-backlog-entry | done | 3/3 | 2026-06-20 |
| 02 | archive-done-plans | done | 4/4 | 2026-06-20 |
| 03 | validate-plans-script | done | 5/5 | 2026-06-20 |
| 04 | planner-convention-cleanup | done | 2/2 | 2026-06-20 |

## Phase dependencies

- Phase 02 depends on Phase 01 (the backlog entry must exist before archiving the plan that flagged the gap).
- Phases 03 and 04 are independent of each other and of Phases 01–02.
