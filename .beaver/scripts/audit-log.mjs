// audit-log.mjs — append-only audit log for guard-script-mediated denials.
//
// Logs ONLY denials that pass through our OWN guard scripts: the write-scope ACL
// adapters (agent-guard.mjs, agent-guard-codex.mjs) and the codex-permission-guard.mjs
// pattern groups (git / secret-read / network-egress). Kept as a standalone module
// (not a function inside agent-guard-core.mjs) because that module has a documented
// "no fs side effects" constraint — see its header comment.
//
// HARD LIMITATION: Claude's native `permissions.deny` / `permissions.ask` and
// `sandbox.filesystem.denyRead` are enforced INSIDE Claude Code itself, with no hook
// firing at all — those denials never reach this log. Only denials produced by our own
// guard scripts (which do run as hooks) can be recorded here.
import { appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const AUDIT_LOG_PATH = '.agents/audit.log';
const MAX_DETAIL_LENGTH = 150;

/**
 * Append one line to .agents/audit.log: `<ISO timestamp> | <agent_type or "unknown"> | deny | <reason or command, truncated>`.
 * Never throws — a logging failure must not break the guard that calls it.
 *
 * @param {{ agentType?: string, reason?: string }} entry
 */
export function appendAuditLog(entry) {
  try {
    const timestamp = new Date().toISOString();
    const agentType = entry?.agentType || 'unknown';
    const detail = (entry?.reason || '').slice(0, MAX_DETAIL_LENGTH);
    const line = `${timestamp} | ${agentType} | deny | ${detail}\n`;
    mkdirSync(dirname(AUDIT_LOG_PATH), { recursive: true });
    appendFileSync(AUDIT_LOG_PATH, line, 'utf-8');
  } catch {
    // Logging must never break the guard — swallow any fs error.
  }
}
