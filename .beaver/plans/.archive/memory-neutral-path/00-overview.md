# memory-neutral-path — Overview

## Goal

Move agent memory storage from `.claude/agent-memory/` to `.agents/memory/` — a harness-neutral folder shared equally by Claude and Codex, without symlinks, without either harness "borrowing" the other's home directory.

## Scope

- Dogfood repo: move the 10 existing memory files, update 8 agent definition files (4 `.claude/agents/*.md` + 4 `.codex/agents/*.toml`), update the guard core (`scripts/agent-guard-core.mjs`) and its scaffold-generated counterpart inside the scaffold template.
- Scaffold templates: update the 6 `src/scaffold/` files that reference `.claude/agent-memory/` so newly scaffolded projects emit the new path.

## Non-goals

- Symlinks — the design decision is real files at `.agents/memory/`, not symlinks.
- Updating `docs/features/claude-harness/claude-harness.spec.en.md` directly — spec work is docs-writer's domain. A backlog entry (0007) must be filed to hand off the spec update.
- Changing the `memory: project` frontmatter field in agent MD files — that is a Claude harness feature unrelated to the folder name.
- Touching `.codex/scripts/agent-guard-codex.mjs` beyond what the shared core already handles — the Codex adapter delegates to `agent-guard-core.mjs`; updating the core is sufficient.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | dogfood-migrate | done | 9/9 | 2026-06-22 |
| 02 | scaffold-templates | done | 8/8 | 2026-06-22 |
| 03 | spec-handoff | done | 3/3 | 2026-06-22 |

---

### Spec gap — handoff to docs-writer (backlog/0007)

`docs/features/claude-harness/claude-harness.spec.en.md` currently describes the harness output layout with `.claude/agent-memory/` paths. After phase 02 lands, the spec needs updating to show `.agents/memory/<agent>/MEMORY.md`. Dev must file `backlog/0007-memory-neutral-path-spec-update.md` as part of phase 03.

Required backlog content:

```
---
id: "0007"
title: "Update claude-harness spec: agent memory path → .agents/memory/"
status: open
source: plans/memory-neutral-path/03-spec-handoff.md
---

## Context
The memory-neutral-path refactor (plans/memory-neutral-path/) moved agent memory
storage from .claude/agent-memory/<agent>/MEMORY.md to .agents/memory/<agent>/MEMORY.md.
The scaffold and dogfood harness now emit the new path.

docs/features/claude-harness/claude-harness.spec.en.md still shows the old path
in its "File layout" / "emitted files" tables and any instruction prose that names
the memory directory.

## Suggested direction
- Search the spec for `.claude/agent-memory` and replace with `.agents/memory`.
- Verify the emitted-file table in the spec reflects `.agents/memory/<agent>/MEMORY.md`
  for dev, docs-writer, planner, advisor (and test-writer when testing is enabled).
- Run `node scripts/lint-docs-frontmatter.mjs` after editing.

## Tried
Nothing yet — this is a fresh handoff.
```
