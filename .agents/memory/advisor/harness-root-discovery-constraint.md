---
name: harness-root-discovery-constraint
description: Why .claude/.codex/.agents/AGENTS.md/CLAUDE.md cannot move to a subdir like .beaver/ — tool auto-discovery is hardcoded to repo root
metadata:
  type: project
---

The 0017 ".beaver/ folder" idea can only move the *knowledge base* (plans/, docs/, backlog/, scripts/), never the harness config folders.

**Why:** Claude Code and Codex auto-discover their config at the REPO ROOT — `.claude/`, `.codex/`, `.agents/skills/`, `AGENTS.md` (Codex entry), `CLAUDE.md` (Claude entry). The ai-harness spec even pins it: `.codex/hooks.json` discovery is `<repo>/.codex/hooks.json`, hooks use `$(git rev-parse --show-toplevel)` (spec ~line 196). Moving these into `.beaver/` makes the agents undiscoverable. The correct split is a hard technical constraint (tool discovery), NOT the "pattern vs project-state" story — that story leaks (`.agents/memory/` is project state yet stranded at root because it shares `.agents/` with skills; AGENTS.md is heavily project-specific yet pinned to root).

**How to apply:** If anyone proposes relocating harness folders, the line is: anything a TOOL auto-discovers stays at root; anything referenced only by prose/scripts/ACLs (plans, docs, backlog, scripts) may move IF every reference + the agent-guard writeScope ACL is updated. `buildHarnessFileMap` currently destructures `baseDir` (harness-setup.ts:155) but never applies it — the plumbing is inert. Promote this constraint into the ai-harness spec via docs-writer if 0017 proceeds.
