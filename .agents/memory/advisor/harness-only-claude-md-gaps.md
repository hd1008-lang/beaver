---
name: harness-only-claude-md-gaps
description: Why the harness-only generated CLAUDE.md looks sparse — it omits the Agent Routing table the full scaffolds emit
metadata:
  type: project
---

Bug explored 2026-06-21: users report the harness-only CLAUDE.md is sparse vs beaver's own / full-scaffold CLAUDE.md.

**Root cause:** `buildClaudeFileMap` (`src/scaffold/shared/claude-setup.ts`) ALWAYS writes 5 agents (dev, docs-writer, planner, advisor, scout) + plans/ + backlog/ READMEs for every project type, but the harness-only skeleton `claudeMdTemplate`s (`src/scaffold/harness-only/templates/generic-skeleton.ts:8-23`, `react-vite-skeleton.ts:8-30`) render only title + Project Overview + optional Quick start + Docs list. They never call `claudeHarnessTableTemplate()` (exported at `claude-setup.ts:85-89`) and have no `## Agent Routing` section or PARK RULE. The full react-vite/chrome-extension templates DO (`react-vite/templates/claude-setup.ts:201-210`). So the harness ships the agent machinery without the map that tells the main thread to use it.

**Why:** the Agent Routing table is project-agnostic (the shared helper's own comment at `claude-setup.ts:79-81` says so) and should be in EVERY harness CLAUDE.md.

**How to apply / recommendation:**
- Fix = port the `## Agent Routing` block (table header + `claudeHarnessTableTemplate()` + a dev row + PARK RULE paragraph + memory/delegate note) into both skeleton `claudeMdTemplate`s, mirroring `react-vite/templates/claude-setup.ts:201-210`. Small, single-pass → `dev`, not `planner`.
- Do NOT extract a new shared "routing section" helper yet — only ~4 call sites with small per-type diffs (dev row, testing row); the truly-identical part is already factored into `claudeHarnessTableTemplate()`. Premature abstraction per CLAUDE.md §2.
- Do NOT port beaver's Behavioral Guidelines / pinned-version table / "Adding New Project Types" sections — those are beaver-repo-specific and would re-introduce the "leaked context" failure the claude-harness spec warns about (`claude-harness.spec.en.md:21-23`). Skeleton minimalism is intended; the missing routing table is the only bug.
- Spec gap: neither `harness-only.spec.en.md` nor `claude-harness.spec.en.md` states that the skeleton CLAUDE.md must contain the routing table — full scaffolds do it by convention only. `docs-writer` should add that requirement so it can't regress.
