---
name: scaffolded-basedir-decision
description: Scaffolded projects now default to baseDir='.beaver' (knowledge-base under .beaver/), not root
metadata:
  type: project
---

**Scaffolded projects now emit knowledge-base under `.beaver/` by default** (2026-07-12 decision)

Effective when dev implements the baseDir default in HarnessParams.

The default `baseDir` value for scaffolded projects changed from `''` (empty, emit at root) to `'.beaver'` (emit knowledge-base under `.beaver/`). This makes scaffolded projects **consistent with beaver itself** — both now:
- Place docs/, plans/, backlog/, scripts/ under `.beaver/`
- Keep tool-discovery paths (AGENTS.md, CLAUDE.md, .claude/, .codex/, .agents/) at root
- Maintain a clean root with product code at the top level

**Updated docs:** `.beaver/docs/features/ai-harness/ai-harness.spec.en.md` (lines 20, 41-48, 54-57, 240-254, 309-320).

No menu option or toggle — this is the default behavior for all scaffolded projects with AI harness enabled.

**Why:** familiar convention (like `.next/`, `.vite/`, `.cache/`); cleaner root; consistency across the beaver ecosystem; single harness rendering engine with no conditional branching.
