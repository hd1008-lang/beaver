// agent-guard-codex.mjs — Codex adapter for the shared write-scope ACL guard.
//
// HOW AGENT IDENTITY IS RECOVERED (two-hook approach):
//   Codex PreToolUse payloads have no agent_type equivalent.
//   A SubagentStart hook writes the active agent name to a temp file keyed by session_id:
//     /tmp/.codex-agent-<session_id>
//   This PreToolUse adapter reads that file to recover the agent name.
//   A SubagentStop hook removes the temp file (cleanup).
//   If the temp file is missing, the adapter fails-open (pass-through).
import { readFileSync, existsSync } from 'fs';
import { checkWritePermission } from '../../.beaver/scripts/agent-guard-core.mjs';
import { appendAuditLog } from '../../.beaver/scripts/audit-log.mjs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const sessionId = payload.session_id;
const cwd = payload.cwd ?? '';

// Recover agent name from temp file written by SubagentStart hook.
let agentType = null;
if (sessionId) {
  const tempFile = `/tmp/.codex-agent-${sessionId}`;
  if (existsSync(tempFile)) {
    try {
      agentType = readFileSync(tempFile, 'utf-8').trim() || null;
    } catch {
      // fail-open below
    }
  }
}

if (!agentType) {
  process.stderr.write(`[agent-guard-codex] WARNING: no agent identity found for session ${sessionId ?? '(none)'}; passing through.\n`);
  process.exit(0);
}

// Extract file path from payload.
let filePath = payload.tool_input?.file_path ?? null;
if (!filePath && payload.tool_input?.command) {
  const cmd = payload.tool_input.command;
  const diffMatch = cmd.match(/^\+\+\+ b\/(.+)$/m) || cmd.match(/^--- a\/(.+)$/m);
  if (diffMatch) {
    filePath = diffMatch[1].startsWith('/') ? diffMatch[1] : `${cwd}/${diffMatch[1]}`;
  } else {
    const tokenMatch = cmd.match(/(?:^|\s)(\/[^\s]+)/);
    if (tokenMatch) filePath = tokenMatch[1];
  }
}

const result = checkWritePermission(agentType, filePath, cwd);

if (result.decision === 'pass' || result.decision === 'allow') {
  process.exit(0);
}

appendAuditLog({ agentType, reason: result.reason });
process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: result.reason,
    },
  })
);
process.exit(0);
