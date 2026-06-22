# Codex Hook Payload Notes

Research conducted: 2026-06-22

## PreToolUse Payload — KNOWN FIELDS

From `developers.openai.com/codex/hooks` and `developers.openai.com/codex/config-reference`:

```json
{
  "turn_id": "<string>",
  "tool_name": "<string>",
  "tool_use_id": "<string>",
  "tool_input": { "command": "<string>" },
  "session_id": "<string>",
  "cwd": "<string>",
  "hook_event_name": "PreToolUse",
  "model": "<string>",
  "permission_mode": "<string>"
}
```

### File path field
- For Write/Edit/patch operations: `tool_input.command` (or similar) — NOT `tool_input.file_path`.
  - The `apply_patch` tool uses `tool_input.command`.
  - Claude uses `tool_input.file_path`; Codex uses `tool_input.command` (command string or patch diff).
  - **Not confirmed**: whether a dedicated `tool_input.file_path` key exists for write operations in Codex.

### cwd field
- `payload.cwd` — confirmed present.

### session_id field
- `payload.session_id` — confirmed present.

## CRITICAL GAP: No agent_type equivalent found

**Claude guard relies on `payload.agent_type`** to know which subagent is executing.
**Codex PreToolUse payload does NOT include an agent identity field** per available documentation.

The Codex subagents docs confirm `name` is the agent identifier in TOML config but does not state
it appears in hook payloads. No field analogous to `agent_type` was found.

This means the Codex adapter for `agent-guard-core.mjs` cannot determine which agent is running
from the PreToolUse payload alone.

## PreToolUse Deny Response Format

The response format is identical to Claude:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "reason string"
  }
}
```

Alternatively: exit with code 2, write reason to stderr.

## hooks.json Format (Codex)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "regex_or_star",
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script",
            "statusMessage": "optional ui text",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
```

Discovery locations: `~/.codex/hooks.json` (user), `<repo>/.codex/hooks.json` (project).

Supported event names: `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`,
`PostCompact`, `SessionStart`, `SubagentStart`, `SubagentStop`, `UserPromptSubmit`, `Stop`.

## Project Root Env Var

No equivalent to `CLAUDE_PROJECT_DIR` documented. For repo-local hooks, docs recommend resolving
from git root: `$(git rev-parse --show-toplevel)`.

Plugin hooks receive `PLUGIN_ROOT`; no project-root var for non-plugin hooks.

## TOML Subagent Format

```toml
name = "agent-name"
description = "..."
developer_instructions = """..."""
# optional: model, sandbox_mode, mcp_servers, model_reasoning_effort
```

Location: `.codex/agents/<name>.toml`

## CONFIRMED: Agent Identity via Two-Hook Approach

Resolution confirmed by user decision 2026-06-22. Selected: **Option 3 — SubagentStart + PreToolUse hooks**.

### Mechanism

Since Codex PreToolUse payloads have no `agent_type` equivalent, agent identity is reconstructed via two hooks:

1. **SubagentStart hook** — fires when a Codex subagent begins. Payload includes `session_id` and
   (expected) the subagent name. Write the agent name to a temp file keyed by `session_id`:
   `/tmp/.codex-agent-<session_id>`.

2. **PreToolUse hook** — reads the temp file at `/tmp/.codex-agent-<session_id>` to recover the
   agent name, then calls `checkWritePermission(agentName, filePath, cwd)` from `agent-guard-core.mjs`.

3. **SubagentStop hook** — fires when subagent ends. Removes the temp file to prevent stale identity
   leaking into a later session.

### SubagentStart Payload (expected fields — not yet confirmed from live run)

Based on Codex docs pattern (`session_id` is present in all events), the SubagentStart payload is
expected to contain:
- `session_id` — use as the temp file key
- `name` or `agent_name` — the subagent name (field name unconfirmed; adapter will try both)

**Live verification is still pending a real Codex install.** The adapter logs a warning and
fails-open (pass-through) if the agent name cannot be read.

### Race condition / staleness analysis

- One subagent per session at a time (Codex subagents are sequential within a turn) — no clobber risk.
- Cross-session: `session_id` key prevents any interference.
- Stale file: SubagentStop hook cleans up. If a crash skips SubagentStop, the next SubagentStart
  for the same `session_id` overwrites the file (safe — same agent restarts same session).

### File path field for Codex Write/Edit operations

`tool_input.command` contains the command string for `apply_patch` / shell-based write tools.
For file path extraction in the guard adapter, parse `tool_input.command` or pass the full command
string to the core — the core will look for a path substring. See `agent-guard-codex.mjs` comments.

## Status: RESOLVED — see backlog/0004-codex-hook-payload-unknown.md (closed)
