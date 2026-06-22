# codex-harness-port — Overview

## Goal

Port the beaver repo's Claude Code harness to OpenAI Codex, so this repo dogfoods **both** Claude Code and Codex simultaneously. Claude and Codex share a single source of truth for everything that can be shared (skills, agent-memory, validators, guard core); only the two things that cannot be shared (agent definition files and hook config) get their own native files.

Phase B (scaffold Codex config for end-user projects) is appended as the final optional phase and must not block phases A-1 through A-5.

## Scope (Phase A — this repo's harness)

- `.codex/` — hooks.json, agents/*.toml (5 subagents)
- `.agents/skills/` — symlinks pointing at `.claude/skills/<name>/SKILL.md`
- `.claude/agent-memory/` — stays canonical; `.codex/agent-memory/` symlinks to it if Codex reads that path (TBD in phase 01)
- `.claude/scripts/agent-guard.mjs` split into: shared `agent-guard-core.mjs` + thin Claude adapter (inline in existing `agent-guard.mjs`) + thin Codex adapter (`agent-guard-codex.mjs`)
- `AGENTS.md` — canonical pointer to `CLAUDE.md`; or vice versa
- Validators `.mjs` — already shared via absolute paths; no change needed

## Non-goals (Phase A)

- Changes to `src/scaffold/` or any TypeScript code
- Creating a `docs/features/codex-harness/` spec (logged in backlog; docs-writer owns that)
- CI / GitHub Actions integration with Codex
- Codex cloud-agent / schedule setup

## Scope (Phase B — optional scaffold feature)

- `src/scaffold/shared/claude-setup.ts` extended to emit `.codex/` and `.agents/` alongside `.claude/` for end-user projects
- Blocked on Phase A being fully verified first

## Key risk: Codex PreToolUse payload schema

The Codex docs do **not** name the exact JSON fields for (a) which subagent is active and (b) the file path being written. The Claude guard relies on `payload.agent_type` and `payload.tool_input.file_path`. If Codex uses different field names the adapter will fail-open silently. **Phase 01 must verify these fields before phase 04 writes the adapter.**

## Non-goals (always)

- Editing any file under `docs/` (docs-writer's job)
- Running or modifying the build
- Writing code in `src/`

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | verify-codex-hook-payload | done | 6/6 | 2026-06-22 |
| 02 | shared-guard-core | done | 7/7 | 2026-06-22 |
| 03 | skills-and-memory-symlinks | done | 6/6 | 2026-06-22 |
| 04 | codex-subagent-tomls | done | 6/6 | 2026-06-22 |
| 05 | codex-hooks-and-permissions | done | 8/8 | 2026-06-22 |
| 06 | agents-md-canonical-pointer | done | 4/4 | 2026-06-22 |
| 07 | scaffold-codex-phase-b | done | 5/5 | 2026-06-22 |

> **Phases 01–06 complete.** Resolved via two-hook approach (SubagentStart/PreToolUse/SubagentStop). Phase 07 (scaffold) is the remaining optional phase — cleanly workable now, no blockers. Backlog/0004 closed.
