---
id: 0005
title: claude-harness spec missing Codex scaffold output section
status: resolved
source: plans/codex-harness-port/07-scaffold-codex-phase-b.md
severity: low
created: 2026-06-22
resolved: 2026-06-22
resolution: docs-writer extended docs/features/claude-harness/claude-harness.spec.en.md with Harness Choice Option + Claude/Codex/Shared output sections; docs/INDEX.md regenerated, frontmatter linter passed.
---

## Symptom

`docs/features/claude-harness/claude-harness.spec.en.md` describes only `.claude/` output. The Codex additions to `buildClaudeFileMap` — `.codex/agents/*.toml`, `.codex/hooks.json`, `.agents/skills/`, `.claude/scripts/codex-*.mjs`, `agent-guard-core.mjs`, `AGENTS.md` — are undocumented in the spec.

## Tried

Not attempted — this is a docs gap, not a code blocker. Phase 07 code changes were completed without a spec update because the spec is docs-writer's domain.

## Why parked

The spec lives under `docs/` which only docs-writer may edit. Updating it is a docs-writer task, not a dev task.

## Suggested direction

docs-writer adds a `## Codex Harness Output` section to `docs/features/claude-harness/claude-harness.spec.en.md` listing the new FileMap keys emitted by `buildClaudeFileMap` when the Codex harness is scaffolded:
- `.codex/hooks.json`
- `.codex/agents/{dev,docs-writer,planner,advisor,scout}.toml`
- `.agents/skills/<slug>-{conventions,docs}/SKILL.md` (real files, not symlinks)
- `.claude/scripts/agent-guard-core.mjs` (shared ACL core)
- `.claude/scripts/agent-guard-codex.mjs`
- `.claude/scripts/codex-subagent-start.mjs`
- `.claude/scripts/codex-subagent-stop.mjs`
- `.claude/scripts/codex-permission-guard.mjs`
- `AGENTS.md` (Codex entry-point pointer to CLAUDE.md)
