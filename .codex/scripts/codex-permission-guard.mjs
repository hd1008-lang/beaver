// codex-permission-guard.mjs — Codex PermissionRequest / PreToolUse hook for blocking
// dangerous git commands. Mirrors Claude's permissions.deny static list.
//
// Denied commands: git push, git commit, git merge, git rebase, git tag,
//   git branch -D, git branch -d, git reset --hard, git clean
//
// Also denies: git push --force, git push -f (covered by prefix match below).
import { readFileSync } from 'fs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const cmd = (payload.tool_input?.command ?? '').trim();
if (!cmd) process.exit(0);

// Patterns that match the deny list — same semantics as Claude's permissions.deny.
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

const matched = DENY_PATTERNS.find((p) => p.test(cmd));
if (!matched) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Blocked git command: "${cmd.slice(0, 120)}". Dangerous git operations (push, commit, merge, rebase, tag, branch -D, reset --hard, clean) are not permitted. A human must run this manually.`,
    },
  })
);
process.exit(0);
