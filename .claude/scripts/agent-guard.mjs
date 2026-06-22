// agent-guard.mjs — Claude adapter for the shared write-scope ACL guard.
// Reads Claude's PreToolUse payload (stdin), extracts agent_type + file_path,
// calls checkWritePermission() from agent-guard-core.mjs, and emits Claude's
// hookSpecificOutput response format.
//
// NOTE: Do not edit WRITE_SCOPES or ACL logic here — they live in agent-guard-core.mjs.
import { readFileSync } from 'fs';
import { checkWritePermission } from '../../scripts/agent-guard-core.mjs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const agentType = payload.agent_type;
const filePath = payload.tool_input?.file_path;
const cwd = payload.cwd ?? '';

const result = checkWritePermission(agentType, filePath, cwd);

if (result.decision === 'pass' || result.decision === 'allow') {
  process.exit(0);
}

// deny
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
