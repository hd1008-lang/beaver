---
phase: 03
title: shared-secret-guard-core
status: done
depends_on: [02]
---

## Goal
Give Codex an equivalent secret-read guard to what Claude gets from `denyRead`, sourced from one shared list of sensitive path patterns so Claude's globs and Codex's regexes can't independently drift — Codex currently has zero `.env`/secret protection.

## Steps
- [x] Read `.codex/scripts/codex-permission-guard.mjs` in full (currently only denies dangerous git commands via `DENY_PATTERNS`).
- [x] Read `codexPermissionGuardMjsTemplate()` in `src/scaffold/shared/claude-setup.ts` (~line 1778) — the scaffold-template twin of the dogfood script.
- [x] Design the shared pattern source: reuse the same sensitive-path list introduced in phase 02 (`.env`, `.env.*`, `*.pem`, `*.key`, `credentials*`, `secrets*`, plus SSH/AWS dirs) by defining it once in `claude-setup.ts` (a single TS-level array, e.g. `SENSITIVE_FILE_PATTERNS`) and interpolating it into BOTH `claudeSettingsTemplate()`'s `denyRead` array and a new `codexSecretGuardPatterns` regex-building helper feeding `codexPermissionGuardMjsTemplate()`. This is the scaffold-side single source of truth.
- [x] Extend `codex-permission-guard.mjs` (dogfood) and `codexPermissionGuardMjsTemplate()` (scaffold template) with a second pattern group: command patterns that read `.env*`/secret files — `cat`, `less`, `head`, `tail`, `grep`, `sed`, `awk`, `strings` targeting the sensitive-path list, plus bare `printenv` / `env` (no args, i.e. a full environment dump — not `env FOO=bar cmd`).
- [x] Decide and document the fail-open vs fail-closed question for this new pattern group: recommend **fail-closed** (deny) for the secret-read group specifically, since the cost of a false positive (agent asks user to run one command manually) is far lower than the cost of a leaked secret. Keep the existing git-command group fail-open (unchanged behavior) — do not conflate the two groups' failure modes.
- [x] Update both `codex-permission-guard.mjs` and its scaffold-template twin identically — note in a code comment (mirroring the existing `WRITE_SCOPES`/`agent-guard-core.mjs` pattern) that the two must be kept in sync by hand since this particular guard isn't imported from a shared `.mjs` module the way `agent-guard-core.mjs` is.
- [x] Re-run the git-command deny smoke tests from the original codex-harness-port plan (`echo '{"tool_input":{"command":"git push"}}' | node .codex/scripts/codex-permission-guard.mjs`) to confirm the existing behavior is untouched by the new pattern group.

## Verify
- `echo '{"tool_input":{"command":"cat .env"}}' | node .codex/scripts/codex-permission-guard.mjs` emits a deny response.
- `echo '{"tool_input":{"command":"grep API_KEY .env.production"}}' | node .codex/scripts/codex-permission-guard.mjs` emits a deny response.
- `echo '{"tool_input":{"command":"printenv"}}' | node .codex/scripts/codex-permission-guard.mjs` emits a deny response.
- `echo '{"tool_input":{"command":"cat README.md"}}' | node .codex/scripts/codex-permission-guard.mjs` exits 0 silently (no false positive on a benign read).
- `echo '{"tool_input":{"command":"git push"}}' | node .codex/scripts/codex-permission-guard.mjs` still denies (pre-existing behavior unchanged).
- Parity check: `grep -n "denyRead" .claude/settings.json src/scaffold/shared/claude-setup.ts` shows the same pattern list feeding both Claude denyRead and the Codex regex builder.

## Notes / risks
- **This is the single biggest new attack-surface-reduction change in the plan** — spend the review time here. A regex-based command guard is inherently a heuristic backstop (an agent could pipe through an intermediate variable, base64, or a different tool not in the pattern list) — this must be stated plainly in phase 06's docs handoff, not oversold as a real boundary.
- `codex-permission-guard.mjs` does NOT currently import from `agent-guard-core.mjs` (that module is for write-scope ACL, a different concern). Do not merge the two modules — keep secret/network command guarding separate from write-scope ACL guarding; only the *pattern list*, not the logic, is shared with the Claude side.
- Fail-closed for secret-read is a judgment call made in this plan, not confirmed by the user in the original request (they said "consider fail-closed"). Flag this explicitly when the phase is executed in case the user wants to weigh in before `dev` commits to it.


## Resolution (2026-07-04)
- Added `SENSITIVE_FILE_PATTERNS` (single TS-level array, src/scaffold/shared/claude-setup.ts) as the scaffold-side single source of truth. `claudeSettingsTemplate()`'s `denyRead` now renders `SENSITIVE_FILE_PATTERNS` directly (verified byte-identical 8-entry output via rendered `.claude/settings.json` and a throwaway tsx render of `buildClaudeFileMap`).
- Added `globPatternToCommandRegexFragment()` + `buildCodexSecretFileTargetSource()` to derive Codex regex fragments from the same array (strips glob-only `**/`/`~/`/`/**` syntax, escapes regex metachars, turns `*` into `[^\s]*`).
- Extended both `codexPermissionGuardMjsTemplate()` and the dogfood `.codex/scripts/codex-permission-guard.mjs` with a `SECRET_READ_PATTERNS` group: `cat|less|head|tail|grep|sed|awk|strings` targeting a sensitive-file fragment, plus a bare `printenv`/`env` (anchored regex so `env FOO=bar cmd` does not match).
- **Fail-closed decision as implemented**: fail-closed applies at the pattern-matching level only — any match in `SECRET_READ_PATTERNS` denies unconditionally. The top-level `JSON.parse` failure path was left fail-open (unchanged `process.exit(0)` on parse error), for both the git group and the new secret group, per the phase note's documented fallback. Rationale: distinguishing "git-group fail-open" from "secret-group fail-closed" at the parse-failure stage would require speculatively parsing the payload differently per group before we even know which group applies — added complexity for a code path (malformed hook JSON) that in practice never happens from Codex's own hook invocation, whereas the real protection (denying on an actual regex match) is unconditional and unaffected by this choice. This is a judgment call per the phase notes ("consider fail-closed"), not user-confirmed — flagged here for user review.
- Added a "SYNC BY HAND" comment (mirroring the `WRITE_SCOPES`/`agent-guard-core.mjs` convention) to both copies, cross-referencing each other and this plan phase.
- Kept `agent-guard-core.mjs` untouched — secret/network command guarding lives only in `codex-permission-guard.mjs` and its scaffold-template twin.
- Verify: all 6 phase-listed commands produced the expected deny/silent-exit-0 results; `npx tsc --noEmit` and `npm run build` both succeeded; rendered `.claude/settings.json` via `buildClaudeFileMap` confirmed the unchanged 8-entry `denyRead` array; rendered `.codex/scripts/codex-permission-guard.mjs` via `buildClaudeFileMap` matched the dogfood copy's logic and secret-fragment regex exactly.
