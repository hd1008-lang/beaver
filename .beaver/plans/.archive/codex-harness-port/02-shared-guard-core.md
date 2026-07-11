---
phase: 02
title: shared-guard-core
status: done
depends_on: [01]
---

## Goal

Refactor `.claude/scripts/agent-guard.mjs` into a shared core module plus two thin adapters — one for Claude (replaces the current file in-place) and one for Codex — so both harnesses enforce the same write-scope ACL from a single source of truth.

## Steps

- [x] Read `.claude/scripts/agent-guard.mjs` in full (already done in planning session; re-read to confirm current state before editing).
- [x] Create `.claude/scripts/agent-guard-core.mjs` — extract the WRITE_SCOPES table and the ACL decision logic (everything from `const agentType = ...` through `process.stdout.write(...)`) into a single exported function `checkWritePermission(agentType, filePath, cwd)` that returns `{ decision: 'allow' | 'deny', reason?: string }`. The function must NOT call `process.exit()` — that belongs to the adapter.
- [x] Rewrite `.claude/scripts/agent-guard.mjs` as the **Claude adapter**: reads stdin, parses JSON, extracts `payload.agent_type` and `payload.tool_input?.file_path` and `payload.cwd`, calls `checkWritePermission(...)`, writes Claude's `hookSpecificOutput.permissionDecision` response, exits. Must behave identically to the current file.
- [x] Create `.claude/scripts/agent-guard-codex.mjs` as the **Codex adapter**: reads stdin, parses JSON, extracts fields using the **confirmed names from phase 01** (from `.codex/HOOK_PAYLOAD_NOTES.md`), calls `checkWritePermission(...)`, writes the Codex hook response format (see notes below), exits.
- [x] Verify the Claude adapter still passes by running `echo '{"agent_type":"planner","tool_input":{"file_path":"/tmp/foo/src/index.ts"},"cwd":"/tmp/foo"}' | node .claude/scripts/agent-guard.mjs` and confirming a deny response for planner writing to src/.
- [x] Verify allow case: `echo '{"agent_type":"planner","tool_input":{"file_path":"/tmp/foo/plans/phase.md"},"cwd":"/tmp/foo"}' | node .claude/scripts/agent-guard.mjs` — should exit 0 silently.
- [x] Verify unknown agent passes through: `echo '{"agent_type":"unknown","tool_input":{"file_path":"/tmp/foo/anything.ts"},"cwd":"/tmp/foo"}' | node .claude/scripts/agent-guard.mjs` — exit 0 silently.

## Verify

- `node .claude/scripts/agent-guard.mjs` (Claude adapter) produces identical ACL behavior to the pre-refactor file for all three cases: deny, allow, pass-through.
- `.claude/scripts/agent-guard-core.mjs` exports `checkWritePermission` and contains no `process.exit()` or `process.stdout.write()` calls.
- `.claude/scripts/agent-guard-codex.mjs` exists and imports from `./agent-guard-core.mjs`.
- `node .claude/settings.json` still references `agent-guard.mjs` (no path change needed — Claude adapter kept the same filename).

## Notes / risks

**Codex hook response format** — as of the user's research, Codex PreToolUse supports `permissionDecision: "deny"` in `hookSpecificOutput` (same as Claude). Confirm this from `.codex/HOOK_PAYLOAD_NOTES.md` before writing the adapter output format. If the response format differs, write the adapter output accordingly.

**No process.exit(0) in core** — the core module must be pure logic. Exit codes and process.exit belong exclusively to the adapter layer.

**Memory prefix adapts to harness** — the core's memory-prefix check (`".claude/agent-memory/<name>/"`) is Claude-specific. The Codex adapter should override or add a second prefix check for `.codex/agent-memory/<name>/` (or whatever path Codex uses — confirm in phase 01).

**Keep WRITE_SCOPES in core** — both adapters share the same scope table. Do not duplicate it.
