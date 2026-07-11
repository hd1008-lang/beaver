---
id: "0011"
title: "agent-guard denies ALL subagent writes on Windows (POSIX-only path normalization)"
status: resolved
source: plans/security-hardening/00-overview.md
severity: high
created: 2026-07-04
---

> **Resolved 2026-07-04**: `checkWritePermission` now normalizes backslashes, strips the `cwd` prefix for both POSIX and Windows paths, and compares drive-letter paths case-insensitively. Fixed in `scripts/agent-guard-core.mjs` AND the template twin `agentGuardCoreMjsTemplate` in `src/scaffold/shared/claude-setup.ts`. Verified: 12-case smoke test against the repo copy, 5-case test against the rendered template output, and real-adapter pipe test (`planner` → `plans/` allowed, `planner` → `src/` denied, Windows paths).

## Symptom

On Windows, every `Write`/`Edit` from every scoped subagent (dev, docs-writer, planner) is denied by the PreToolUse guard — including writes to paths explicitly inside the agent's `writeScope` and even the implicitly-allowed `.agents/memory/<agent>/` directory. Discovered when the `planner` agent tried to author `plans/security-hardening/` and could not persist a single file (main-session writes pass because they carry no `agent_type`).

## Root cause

`checkWritePermission()` in `scripts/agent-guard-core.mjs` (line ~54) only strips the `cwd` prefix when the path is POSIX-absolute:

```js
if (filePath.startsWith('/') && cwd && filePath.startsWith(cwd + '/')) {
  rel = filePath.slice(cwd.length + 1);
}
```

Windows absolute paths (`C:\Users\...\plans\x.md` or `C:/Users/...`) never start with `/`, so `rel` stays absolute and can never match relative prefixes like `"plans/"` — every scope check fails, including the `memoryPrefix` implicit allow.

## Tried

- `planner` attempted `plans/security-hardening/00-overview.md` → denied.
- `planner` attempted diagnostic write to its own `.agents/memory/planner/` → also denied, confirming the bug is in path normalization, not scope configuration.
- Plan content was rescued by the main session (no `agent_type` → guard passes through) and written to `plans/security-hardening/`.

## Why parked

Fix belongs to `dev` (touches `scripts/agent-guard-core.mjs` AND its scaffold-template twin `agentGuardCoreMjsTemplate` in `src/scaffold/shared/claude-setup.ts` — both must change together). Out of planner's scope; the security-hardening plan does not depend on it except phase 05 smoke tests on Windows.

## Suggested direction

In `checkWritePermission`, normalize before comparing:
1. Replace backslashes with forward slashes in both `filePath` and `cwd`.
2. Detect absolute paths cross-platform (leading `/` OR drive-letter pattern `/^[A-Za-z]:\//`), then strip the normalized `cwd` prefix case-insensitively on Windows.
3. Apply the identical fix to the template twin in `src/scaffold/shared/claude-setup.ts`.
4. Add smoke tests piping Windows-style payloads (`{"agent_type":"planner","tool_input":{"file_path":"C:\\repo\\plans\\x.md"},"cwd":"C:\\repo"}`) through both adapters.

Note: fail-open vs fail-closed asymmetry — today the bug fails **closed** (denies everything), which is safe but blocks all agent work on Windows.
