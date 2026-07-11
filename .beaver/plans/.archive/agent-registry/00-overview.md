# Plan: Data-Driven Agent Registry

## Goal

Make all agent definitions in the harness template derive from a single declarative `AGENTS` table (4 fields: `name`, `model`, `writeScope`, `memory`) so that agent `.md` files, the CLAUDE.md harness table, and the path-guard stop being hand-maintained copies that can drift. Ship a validator that mechanically enforces the derived invariants.

## Spec

`docs/features/claude-harness/claude-harness.spec.en.md` — "Agent Registry (Data-Driven Agent Definition)" subsection.

## Scope

- `src/scaffold/shared/claude-setup.ts` — introduce `AGENTS` table; derive all agent output from it.
- `.claude/scripts/planner-guard.mjs` (template string inside `claude-setup.ts`) — generalize to a registry-driven guard.
- New `.claude/scripts/validate-structure.mjs` template (emitted into generated projects) — checks derived invariants.
- **Harness-only** skeleton templates `src/scaffold/harness-only/templates/*.ts` — must pick up the same guard.
- **Beaver repo's own `.claude/`** — sync to match the new template output (dogfood).

## Non-Goals

- No new agents — the five existing agents (dev, docs-writer, planner, advisor, scout) plus optional test-writer are the full set for now.
- No changes to `docs/` specs or CLAUDE.md template prose beyond what the registry drives.
- No CI pipeline changes — the validator is a standalone `node` script, not wired into npm scripts yet (that is a separate story).
- No changes to the docs tooling (`build-docs-index.mjs`, `lint-docs-frontmatter.mjs`, `_docs-shared.mjs`).
- No change to the harness-only skeleton CLAUDE.md stubs (they stay minimal per planner MEMORY).

## Ordered Phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | agents-table | done | 6/6 | 2026-06-20 |
| 02 | derive-agent-files | done | 8/8 | 2026-06-20 |
| 03 | registry-guard | done | 6/6 | 2026-06-20 |
| 04 | validator | done | 7/7 | 2026-06-20 |
| 05 | dogfood-and-beaver-sync | done | 6/6 | 2026-06-20 |
