---
id: "0007"
title: "Update claude-harness spec: agent memory path → .agents/memory/"
status: resolved
source: plans/memory-neutral-path/03-spec-handoff.md
severity: low
created: 2026-06-22
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

## Resolution
docs-writer replaced all 7 `.claude/agent-memory` references in `docs/features/claude-harness/claude-harness.spec.en.md` with `.agents/memory`; `build-docs-index.mjs` and `lint-docs-frontmatter.mjs` both pass.
