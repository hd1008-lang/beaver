# codex-memory-seed — Overview

## Goal
Fix the scaffold bug where `.agents/memory/<agent>/MEMORY.md` seed files are only emitted inside the `claudeOnly` block in `buildClaudeFileMap`, causing Codex-only harness mode (`harness: 'codex'`) to produce broken Codex agent TOMLs that reference memory files that were never written to disk.

## Scope
- Move the four core-agent memory seeds (dev, docs-writer, planner, advisor) from the `claudeOnly` block to a new harness-neutral block in `buildClaudeFileMap`.
- Keep `test-writer` memory seed gated under `wantClaude` (no `.codex/agents/test-writer.toml` exists, so codex-only has no need for it).
- Guard against duplicate entries in `harness: 'both'` mode (a path must not appear twice in the returned `FileMap`).
- File spec backlog entry for docs-writer to update `docs/features/claude-harness/claude-harness.spec.en.md` (currently lists `.agents/memory/` under Claude-only output; needs to move to Shared Harness Output).

## Non-goals
- Changing any `.codex/agents/*.toml` content.
- Changing the `test-writer` logic other than keeping it Claude-only.
- Updating the spec doc directly (that is docs-writer's job — see backlog/0008).
- Dogfood sync: the beaver repo itself already has its own `.agents/memory/` directory (manually maintained); no template change triggers a dogfood copy here. No dogfood phase needed.

## Key file
`src/scaffold/shared/claude-setup.ts` — specifically `buildClaudeFileMap()`, lines ~1873–1970.

## Spec reference
`docs/features/claude-harness/claude-harness.spec.en.md` — "Harness Choice Option" section (lines ~94–100) and Agent Registry section (memory field description).

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | fix-template | done | 5/5 | 2026-06-22 |
