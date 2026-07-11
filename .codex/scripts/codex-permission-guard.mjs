// codex-permission-guard.mjs — Codex PreToolUse hook for blocking dangerous git
// commands, commands that could read sensitive files / dump the environment, and
// network-egress commands (curl/wget/Invoke-WebRequest).
// Mirrors Claude's permissions.deny (git), sandbox.filesystem.denyRead (secrets), and
// permissions.ask (network egress — Codex has no ask tier, so this group denies instead).
//
// Pattern groups (SYNC BY HAND — see below):
//   DENY_PATTERNS            — dangerous git commands; fail-open on JSON-parse errors.
//   SECRET_READ_PATTERNS     — reads of sensitive files / env dumps; fail-closed on match.
//   NETWORK_EGRESS_PATTERNS  — curl/wget/Invoke-WebRequest; fail-closed on match (Codex
//                              has no interactive "ask", so this is a stricter fallback
//                              than Claude's ask-tier prompt for the same commands).
//
// Every deny below is appended to .agents/audit.log via appendAuditLog() (phase 05).
// Codex PreToolUse payloads carry no agent_type field, so denials here are logged as
// "unknown" — see scripts/audit-log.mjs for the hard limitation this implies for Claude's
// native permissions.deny/ask and sandbox.filesystem.denyRead (no hook fires for those).
import { readFileSync } from 'fs';
import { appendAuditLog } from '../../.beaver/scripts/audit-log.mjs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const cmd = (payload.tool_input?.command ?? '').trim();
if (!cmd) process.exit(0);

const DENY_PATTERNS = [
  /\bgit\s+push\b/,
  /\bgit\s+commit\b/,
  /\bgit\s+merge\b/,
  /\bgit\s+rebase\b/,
  /\bgit\s+tag\b/,
  /\bgit\s+branch\s+-[Dd]\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\b/,
];

// Secret-read guard: cat/less/head/tail/grep/sed/awk/strings targeting a sensitive file,
// plus a bare "printenv" or bare "env" (full environment dump — "env FOO=bar cmd" does
// NOT match). Fail-closed at the pattern-matching level: any match here denies. JSON-parse
// failures above stay fail-open (unchanged, rare, pre-existing behavior for both groups).
const SECRET_READ_PATTERNS = [
  /\b(?:cat|less|head|tail|grep|sed|awk|strings)\b[^\n]*(?:\.env|\.env\.[^\s]*|[^\s]*\.pem|[^\s]*\.key|credentials[^\s]*|secrets[^\s]*|\.ssh|\.aws)/,
  /^(?:printenv|env)(?:\s+-\S+)*\s*$/,
];

// Network-egress guard: curl/wget/Invoke-WebRequest could ship file contents (including
// secrets) to an external host without the user noticing. Claude routes these through
// permissions.ask (a confirmation prompt); Codex has no equivalent "ask" tier, so this
// group denies outright — a stricter fallback than Claude's, not a symmetric one.
const NETWORK_EGRESS_PATTERNS = [
  /\b(?:curl|wget)\b/,
  /\bInvoke-WebRequest\b/,
];

const matchedGit = DENY_PATTERNS.find((p) => p.test(cmd));
const matchedSecret = !matchedGit && SECRET_READ_PATTERNS.find((p) => p.test(cmd));
const matchedNetwork = !matchedGit && !matchedSecret && NETWORK_EGRESS_PATTERNS.find((p) => p.test(cmd));
if (!matchedGit && !matchedSecret && !matchedNetwork) process.exit(0);

const reason = matchedSecret
  ? `Blocked command that may read a sensitive file or dump environment variables: "${cmd.slice(0, 120)}". Reading .env/.pem/.key/credentials/secrets files, SSH/AWS credential directories, or a full environment dump is not permitted via automated tool calls. A human must run this manually.`
  : matchedNetwork
  ? `Blocked network-egress command: "${cmd.slice(0, 120)}". curl/wget/Invoke-WebRequest are not permitted via automated tool calls, since they could ship file contents to an external host unnoticed. A human must run this manually.`
  : `Blocked git command: "${cmd.slice(0, 120)}". Dangerous git operations (push, commit, merge, rebase, tag, branch -D, reset --hard, clean) are not permitted. A human must run this manually.`;

appendAuditLog({ agentType: 'unknown', reason });
process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  })
);
process.exit(0);
