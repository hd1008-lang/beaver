// codex-subagent-stop.mjs — SubagentStop hook for Codex.
// Reads the SubagentStop payload (stdin) and removes the temp file written by
// codex-subagent-start.mjs so stale agent identity cannot leak into later turns.
import { readFileSync, unlinkSync, existsSync } from 'fs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const sessionId = payload.session_id;
if (!sessionId) {
  process.exit(0);
}

const tempFile = `/tmp/.codex-agent-${sessionId}`;
if (existsSync(tempFile)) {
  try {
    unlinkSync(tempFile);
  } catch (err) {
    process.stderr.write(`[codex-subagent-stop] WARNING: could not remove temp file ${tempFile}: ${err.message}\n`);
  }
}

process.exit(0);
