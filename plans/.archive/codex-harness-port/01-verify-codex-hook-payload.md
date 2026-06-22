---
phase: 01
title: verify-codex-hook-payload
status: done
depends_on: []
---

## Goal

Determine the exact JSON field names in Codex's PreToolUse hook payload for (a) which subagent is executing and (b) the target file path — before any guard adapter is written. If these fields cannot be verified, apply the PARK RULE and log to backlog.

## Why this must come first

`agent-guard.mjs` reads `payload.agent_type` and `payload.tool_input.file_path`. If Codex uses different names the adapter will fail-open (no error, guard simply never fires). This is the #1 risk for the entire plan. Nothing in phase 02 or 05 should be written until the adapter field names are confirmed.

## Steps

- [x] Read the full Codex hooks documentation at `https://developers.openai.com/codex/hooks` (or equivalent) — use WebFetch if available from an advisor session; otherwise search Codex SDK release notes / changelog for "PreToolUse payload" schema.
- [x] Search the Codex GitHub repo / community discussions for sample PreToolUse stdin payloads that show the actual JSON keys. Target evidence: a real JSON snippet or an official type definition.
- [x] Record confirmed field names (partial — deny response confirmed; agent_type equivalent NOT found) in `.codex/HOOK_PAYLOAD_NOTES.md` (a scratch file for dev reference, not a spec). At minimum: the field name for subagent identity (Claude: `agent_type`) and for tool input file path (Claude: `tool_input.file_path`). Also note the field for cwd and session_id if visible.
- [x] If a Codex sandbox is available locally  ← NOT ATTEMPTED (no local Codex install). Resolved by two-hook approach (SubagentStart writes agent name; PreToolUse reads it). Live verification pending a real Codex install.
- [x] If neither of the above produces confirmed field names after two attempts: set this phase `status: done`, file `backlog/0004-codex-hook-payload-unknown.md` (content template below), link both ways, and report to user. Do NOT proceed to phase 02 guard writing until unblocked.
- [x] Resolution confirmed (user decision 2026-06-22): two-hook approach selected. `.codex/HOOK_PAYLOAD_NOTES.md` updated with CONFIRMED header for SubagentStart/PreToolUse mechanism.

## Verify

- `.codex/HOOK_PAYLOAD_NOTES.md` exists and contains at minimum the two field names (subagent identity, file path) under a "CONFIRMED" header — OR — phase is `blocked` with backlog entry `0004` filed.
- No guard code has been written yet (code writing is phase 02's job).

## Notes / risks

**PARK RULE applies here.** Two failed attempts to find the schema → park immediately. Do not guess field names and write the adapter optimistically.

**Backlog entry content (if parking):**

```
---
id: 0004
title: Codex PreToolUse payload schema unknown — guard adapter blocked
status: open
source: plans/codex-harness-port/01-verify-codex-hook-payload.md
severity: high
created: <date>
---

**Symptom** — Cannot write the Codex adapter for agent-guard-core.mjs because the exact
JSON field names in Codex's PreToolUse stdin payload are unknown. Claude uses
`payload.agent_type` and `payload.tool_input.file_path`; Codex docs do not name equivalents.

**Tried** — [fill in what was searched/run and what it returned]

**Why parked** — No official Codex type definition for PreToolUse payload found; community
examples ambiguous. Writing the adapter with guessed field names would create a silent
fail-open guard.

**Suggested direction** — (1) Trigger a real Codex hook with an echo command and inspect
stdin. (2) Ask in Codex community Discord. (3) Check Codex TypeScript SDK for `HookEvent`
type definitions in the `@openai/codex` package source.
```

**If Codex uses the same field names as Claude** — that is a happy path: phase 02 adapter becomes trivial (just re-export the core). Record it anyway so future sessions don't re-investigate.


<!-- BLOCKED: backlog/0004-codex-hook-payload-unknown.md -->