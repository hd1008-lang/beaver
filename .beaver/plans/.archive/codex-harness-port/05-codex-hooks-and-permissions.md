---
phase: 05
title: codex-hooks-and-permissions
status: done
depends_on: [01, 02]
---

## Goal

Wire up `.codex/hooks.json` (PreToolUse → agent-guard-codex adapter; UserPromptSubmit → docs-first reminder) and map Claude's `permissions.deny` git commands to Codex's equivalent sandbox restrictions. The repo must now enforce write-scope ACL and docs-first reminder for both Claude and Codex sessions simultaneously.

## Steps

- [x] Read `.codex/HOOK_PAYLOAD_NOTES.md` (from phase 01) to confirm: (a) response format for permissionDecision deny in Codex hooks, (b) whether Codex hooks.json uses the same event names (`PreToolUse`, `UserPromptSubmit`) as Claude, (c) `matcher` syntax for filtering tool types.
- [x] Write `.codex/hooks.json` with two hook registrations:
  1. `PreToolUse` with a matcher equivalent to Claude's `"Write|Edit|MultiEdit"` — command: `node "$CODEX_PROJECT_DIR/.claude/scripts/agent-guard-codex.mjs"` (absolute-path friendly; confirm correct env var name for Codex's project root).
  2. `UserPromptSubmit` — command: `bash "$CODEX_PROJECT_DIR/.claude/scripts/docs-first-reminder.sh"` (the script is already harness-agnostic; re-use it directly, no symlink needed).
- [x] Confirm the correct Codex env var for project root directory (Claude uses `$CLAUDE_PROJECT_DIR`). If Codex uses a different var (e.g., `$CODEX_PROJECT_DIR` or `$PROJECT_DIR`), use the confirmed name. If unknown after one lookup attempt, use `$(pwd)` as a fallback and note the risk in the hooks.json comment.
- [x] Map Claude's `permissions.deny` git blocklist to Codex. Codex `sandbox_mode` controls network; for git command restrictions, check if Codex hooks support a `PermissionRequest` event or if Codex has a native git-deny mechanism. Write the equivalent in `.codex/hooks.json` or `.codex/config.toml` (whichever is appropriate). At minimum: deny `git push`, `git commit`, `git merge`, `git rebase`, `git tag`, `git branch -D`, `git reset --hard`, `git clean`.
- [x] If Codex does NOT have a native deny mechanism equivalent to `permissions.deny`: document this gap in `.codex/HOOK_PAYLOAD_NOTES.md`, add a PermissionRequest hook that checks the command and denies, OR accept the gap and note it as a known limitation. Do not block the phase — apply PARK RULE only if two active attempts to find the mechanism fail.
- [x] Run a smoke test: from a Codex session (or by simulating the hook stdin), pipe a planner-writes-src payload through `node .claude/scripts/agent-guard-codex.mjs` and confirm the deny response is emitted correctly.
- [x] Verify `.claude/settings.json` is unchanged — Claude's existing hooks still reference `agent-guard.mjs` (Claude adapter), not the Codex adapter. The two harnesses are fully independent at the hook registration level.
- [x] Verify `.codex/hooks.json` is valid JSON: `node -e "JSON.parse(require('fs').readFileSync('.codex/hooks.json','utf-8'))"`.

## Verify

- `.codex/hooks.json` is valid JSON and contains PreToolUse + UserPromptSubmit hook registrations.
- `echo '{"agent_type":"planner","tool_input":{"file_path":"/repo/src/index.ts"},"cwd":"/repo"}' | node .claude/scripts/agent-guard-codex.mjs` (using confirmed Codex field names from phase 01) emits a deny response.
- `echo '{"agent_type":"planner","tool_input":{"file_path":"/repo/plans/test.md"},"cwd":"/repo"}' | node .claude/scripts/agent-guard-codex.mjs` exits 0 silently (allow).
- `.claude/settings.json` is byte-for-byte unchanged.
- Git restriction equivalents exist in `.codex/` config (or gap is documented with severity).

## Notes / risks

**Env var for project root** — Claude uses `$CLAUDE_PROJECT_DIR`. Codex may use `$CODEX_PROJECT_DIR`, `$PROJECT_DIR`, or inject cwd differently. This is a one-lookup question; confirm before writing hooks.json. Fallback: use `$(pwd)` inside the command string (works if the hook runs with cwd = project root, which is standard behavior).

**docs-first-reminder.sh is already agnostic** — the script reads stdin and greps for keywords; it does not reference any Claude-specific path. Re-use it directly from `.claude/scripts/docs-first-reminder.sh` without copying.

**`[features] hooks = true`** — if Codex uses `.codex/config.toml` to enable hooks (per `[features]` section in docs), add that config file too. Do not assume hooks are on by default.

**PermissionRequest vs deny list** — Claude enforces git denials via `permissions.deny` (static list processed by the harness, no hook needed). Codex may require a `PermissionRequest` hook to intercept Bash calls. If so, add a `codex-permission-guard.mjs` that checks `payload.tool_input.command` against the deny list and returns deny. Keep this script small — it's a one-function check.
