---
phase: 02
title: claude-denyread-hardening
status: done
depends_on: []
---

## Goal
Extend Claude's `sandbox.filesystem.denyRead` glob list (both the scaffold template and this repo's own dogfood settings) beyond `.env` to cover the other common accidental-secret-read paths: SSH keys, AWS credentials, PEM/key files, and generic credentials/secrets files.

## Steps
- [x] Read `claudeSettingsTemplate()` in `src/scaffold/shared/claude-setup.ts` (~line 504-550) — this is the single scaffold-side source of the `denyRead` array.
- [x] Extend the `denyRead` array in `claudeSettingsTemplate()` to: `["**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/credentials*", "**/secrets*", "~/.ssh/**", "~/.aws/**"]`. Confirm Claude's sandbox glob syntax supports `~/` expansion for home-directory paths (check Claude Code sandbox docs or existing precedent in this settings file); if `~/` is not supported, use the documented equivalent (e.g. an absolute glob anchored differently) and note the substitution here.
- [x] Apply the identical array to this repo's own `.claude/settings.json` (`sandbox.filesystem.denyRead`) — this is the drift risk called out in the overview: the scaffold template and the dogfood file are two separate places that must both change.
- [x] Do not touch `.claude/settings.json`'s `permissions.deny` git list or `hooks` block — only the `sandbox.filesystem.denyRead` array changes in this phase.
- [x] Grep for any other place `denyRead` or the literal string `.env` appears in `src/scaffold/shared/claude-setup.ts` to confirm there is exactly one render site (`grep -n "denyRead" src/scaffold/shared/claude-setup.ts`).

## Verify
- `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf-8'))"` — still valid JSON.
- `grep -n "denyRead" .claude/settings.json` shows the full 8-entry array.
- `grep -n "denyRead" src/scaffold/shared/claude-setup.ts` shows the matching array in `claudeSettingsTemplate()`.
- Scaffold a project (or inspect generated `dist/` output) and confirm the written `.claude/settings.json` contains the extended `denyRead` array.

## Notes / risks
- **Glob home-directory syntax is unverified** — Claude Code's sandbox glob matcher may not support `~/`. If it doesn't, this step needs a park-rule decision: either drop the SSH/AWS home-dir entries (documenting the gap) or find the correct anchoring syntax. Don't guess silently — verify against Claude Code's actual sandbox docs before committing to `~/.ssh/**` syntax.
- This phase deliberately does NOT wire the same list into Codex — phase 03 builds the actual shared single-source module and Codex-side enforcement. Keep phase 02 scoped to Claude only so it stays independently reviewable.
- Two edit sites again (scaffold template + dogfood settings) — the recurring drift risk in this whole plan. Grep both after editing to confirm parity.

## Resolution (2026-07-04)
- **~/ home-dir glob CONFIRMED supported** — verified against the official Claude Code sandbox docs (https://code.claude.com/docs/en/sandboxing, "Configure sandboxing" section). The docs' path-prefix table states: `~/` prefix means "Relative to home directory", example `~/.kube` becomes `$HOME/.kube`. The "Protect credentials" section also gives `~/.aws/credentials` and `~/.ssh` as literal example entries for `sandbox.credentials.files` (same path-prefix rules as `filesystem.*`). No substitution needed — the full 8-entry array (including `~/.ssh/**` and `~/.aws/**`) was applied as originally proposed to both `claudeSettingsTemplate()` (src/scaffold/shared/claude-setup.ts:544-556) and this repo's `.claude/settings.json`.
- Note: the docs also describe a dedicated `sandbox.credentials` block (file-specific, unsets env vars too) as the more targeted mechanism for `~/.aws/credentials` and `~/.ssh` — out of scope for this phase (which only touches `filesystem.denyRead` per the phase's explicit boundary); worth a future phase/backlog note if stronger credential protection is wanted.
- Verify results: `.claude/settings.json` parses as valid JSON; `grep -n "denyRead"` on both files shows matching 8-entry arrays; `npm run build` succeeds; rendered `getClaudeFileMap()` output (via a throwaway tsx script) confirmed the scaffolded `.claude/settings.json` contains the extended array.
