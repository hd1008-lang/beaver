// codex-subagent-start.mjs — SubagentStart hook for Codex.
// Reads the SubagentStart payload (stdin) and writes the active agent name to
// a temp file keyed by session_id so agent-guard-codex.mjs can read it in PreToolUse.
import { readFileSync, writeFileSync } from 'fs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const sessionId = payload.session_id;
if (!sessionId) {
  process.stderr.write('[codex-subagent-start] WARNING: no session_id in payload; cannot key temp file.\n');
  process.exit(0);
}

// Try common field names for the agent name.
const agentName = payload.name ?? payload.agent_name ?? payload.subagent_name ?? null;
if (!agentName) {
  process.stderr.write(`[codex-subagent-start] WARNING: no agent name field found in payload for session ${sessionId}. Payload keys: ${Object.keys(payload).join(', ')}\n`);
  process.exit(0);
}

const tempFile = `/tmp/.codex-agent-${sessionId}`;
try {
  writeFileSync(tempFile, agentName, 'utf-8');
} catch (err) {
  process.stderr.write(`[codex-subagent-start] ERROR: could not write temp file ${tempFile}: ${err.message}\n`);
}

process.exit(0);
