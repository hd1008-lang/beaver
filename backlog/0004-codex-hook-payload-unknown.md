---
id: 0004
title: Codex PreToolUse payload schema unknown — guard adapter blocked
status: resolved
source: plans/codex-harness-port/01-verify-codex-hook-payload.md
severity: high
created: 2026-06-22
---

**Symptom** — Cannot write the Codex adapter for `agent-guard-core.mjs` because the exact
JSON field names in Codex's PreToolUse stdin payload are unknown. Claude uses
`payload.agent_type` and `payload.tool_input.file_path`; Codex docs do not name equivalents.
Specifically: no field for subagent identity (analogous to `agent_type`) was found in the
Codex PreToolUse payload schema in any official documentation.

**Tried** —

1. Fetched `developers.openai.com/codex/hooks` — confirmed payload fields: `turn_id`,
   `tool_name`, `tool_use_id`, `tool_input`, `session_id`, `cwd`, `hook_event_name`, `model`,
   `permission_mode`. No `agent_type` or subagent-identity field found.

2. Fetched `developers.openai.com/codex/subagents` — confirmed subagent TOML format
   (`name`, `description`, `developer_instructions`). Docs note `name` is the source of
   truth for agent ID, but do NOT state this appears in hook payloads.

3. Fetched `developers.openai.com/codex/config-reference` and `developers.openai.com/codex/config-sample` —
   no additional payload fields found. Confirmed `hookSpecificOutput.permissionDecision = "deny"`
   response format matches Claude's.

4. Fetched `github.com/openai/codex` — repo is Rust-based; no payload schema in AGENTS.md.

**Why parked** — No official Codex type definition for PreToolUse payload includes an
agent-identity field. Community examples were not accessible. Writing the adapter with a
guessed field name would create a silent fail-open guard — the entire guard would never fire
(not a deny, just a pass-through).

**Suggested direction** —

1. Trigger a real Codex hook with an `echo` command (`cat > /tmp/codex_payload.json`) and
   inspect the stdin. This is the fastest path — requires a working Codex CLI install.
2. Check the Codex TypeScript SDK source for `HookEvent` type definitions:
   `https://github.com/openai/openai-node` or `@openai/codex` npm package.
3. Ask in OpenAI developer community Discord/forum.
4. If Codex truly has no agent-identity field in PreToolUse: the Codex guard adapter cannot
   enforce per-agent write scopes from the hook alone. Alternatives: (a) use `SubagentStart`
   event to record the active agent name into a temp file, then read it in `PreToolUse`; or
   (b) accept that the Codex guard is tool-type-only (no agent ACL) and document the gap.

See also: [[plans/codex-harness-port/01-verify-codex-hook-payload.md]]

**Resolution (2026-06-22)** — User selected Option 3: two-hook approach via SubagentStart + PreToolUse.
SubagentStart writes `/tmp/.codex-agent-<session_id>` with the active agent name; PreToolUse reads it.
SubagentStop cleans up. Implemented in `.claude/scripts/agent-guard-core.mjs` (shared core) and
`.claude/scripts/agent-guard-codex.mjs` (Codex adapter). Phase 01 marked done.
Live end-to-end verification is pending a real Codex CLI install (mock-tested only).
