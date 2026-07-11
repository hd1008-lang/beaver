# security-hardening — Overview

## Goal
Close the confirmed secret-exposure and command-injection gaps in beaver's scaffolded projects and in this repo's own dogfooded harness: scaffolded `.gitignore` doesn't ignore `.env`, Claude's `denyRead`/`deny` lists are narrow, Codex has no secret-read or network-egress guard at all, and guard denials aren't logged anywhere. This is **accident prevention, not a security boundary** — phase 06 makes a docs spec say so explicitly.

## Scope
1. Fix the scaffolded `.gitignore` template so generated projects don't track `.env` files (react-vite template; chrome-extension reuses the same template — only one file to fix, not two).
2. Broaden Claude's `sandbox.filesystem.denyRead` globs (scaffold template + dogfood `.claude/settings.json`) to cover SSH keys, AWS credentials, `*.pem`/`*.key`, and generic `credentials*`/`secrets*` files.
3. Introduce a single shared source for "sensitive path" patterns and use it to drive a new Codex secret-read guard (extends `codex-permission-guard.mjs`), so Claude's denyRead globs and Codex's regex patterns can't drift independently.
4. Add a network-egress guard: `curl`/`wget`/`Invoke-WebRequest` moved to `ask` (Claude permissions) and denied/asked via an equivalent regex group in the Codex guard.
5. Add an audit log (`.agents/audit.log`) that guard scripts append to on every deny decision — scoped to guards that execute our own code (agent-guard adapters, codex-permission-guard.mjs). Claude's native `permissions.deny` and `sandbox.filesystem.denyRead` are enforced inside Claude Code itself with no hook invocation, so they cannot be audit-logged from our code — documented as a hard limitation.
6. Docs phase: hand off to `docs-writer` to create `docs/features/security-hardening/security-hardening.spec.en.md`, framing all of the above as defense-in-depth accident prevention, not a security boundary.

## Non-goals
- Real sandboxing/containerization of agent execution.
- Any change to `src/scaffold/` beyond template content (no new menu options/Cart fields/prompts).
- Encrypting or vaulting secrets — prevents *accidental* reads/leaks, not deliberate exfiltration by a fully compromised agent.
- Editing `docs/` directly (docs-writer's job — phase 06 only hands off the request).
- Retroactively scrubbing `.env` files already committed anywhere.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | scaffold-gitignore-env | done | 4/4 | 2026-07-04 |
| 02 | claude-denyread-hardening | done | 5/5 | 2026-07-04 |
| 03 | shared-secret-guard-core | done | 7/7 | 2026-07-04 |
| 04 | network-egress-guard | done | 6/6 | 2026-07-04 |
| 05 | guard-audit-log | done | 6/6 | 2026-07-04 |
| 06 | docs-spec-handoff | done | 3/3 | 2026-07-04 |

Phase 01 is independently shippable and should ship first. Phases 02→05 build on each other in order (02 creates the shared sensitive-path list that 03 consumes; 03 and 04 both touch guard scripts that 05 instruments). Phase 06 documents the end state, so run it last.
