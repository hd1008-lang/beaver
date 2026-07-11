---
id: "0003"
title: agent-guard denies read-only agents writing their own agent-memory dir
status: resolved
source: conversation
severity: medium
created: 2026-06-20
---

## Symptom

In `agentGuardMjsTemplate` (`src/scaffold/shared/claude-setup.ts`) and the emitted
`.claude/scripts/agent-guard.mjs` (both beaver dogfood and every scaffolded project),
the empty-writeScope branch denies ALL writes and `process.exit(0)`s **before** the
`memoryPrefix` check is ever reached.

Effect: read-only agents (`advisor`, `scout` — empty writeScope) cannot write their own
`.claude/agent-memory/<name>/MEMORY.md`, even though their agent definitions explicitly
say that file is the one thing they ARE allowed to write (see `.claude/agents/advisor.md`:
"The only file you ever write is your own `.claude/agent-memory/advisor/MEMORY.md`").

Observed live: the advisor agent hit this guard during the `check/` verification task and
could not append its insights.

## Tried

Nothing attempted — deferred for later by user decision. (Identified during the `check/`
scaffold verification, 2026-06-20.)

## Why parked

Out of scope of the current task; user will handle later. This is a logic-ordering bug in
the guard, not a blocker for the work in progress.

## Suggested direction

In the guard logic, allow a write whose path starts with the agent's own
`.claude/agent-memory/<name>/` prefix BEFORE the empty-scope blanket-deny — i.e. move the
`memoryPrefix` allowance above the `allowedPrefixes.length === 0` deny branch (or fold it
into that branch). Fix the **template** (`agentGuardMjsTemplate` in
`src/scaffold/shared/claude-setup.ts`) FIRST, then sync the dogfood
`.claude/scripts/agent-guard.mjs` — template-first avoids re-introducing dogfood↔template
drift. Verify by re-running the scenario: a read-only agent should be able to write its own
memory file but still be denied any other path. Route to `dev`.

## Resolution

Hoisted the `memoryPrefix` early-exit above the empty-scope blanket-deny in both the template
(`src/scaffold/shared/claude-setup.ts` — `agentGuardMjsTemplate`) and the dogfood emitted file
(`.claude/scripts/agent-guard.mjs`). Removed the now-redundant `|| rel.startsWith(memoryPrefix)`
from the later `allowed` expression. TypeScript check and build both clean.
