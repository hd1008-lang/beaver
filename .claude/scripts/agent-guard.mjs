// PreToolUse guard — registry-driven path enforcement.
// Generated from the AGENTS registry; do not edit by hand.
// Each agent may only write to its declared writeScope prefixes plus its own
// .claude/agent-memory/<name>/ directory (implicit, added at runtime below).
// Agents NOT in WRITE_SCOPES (unknown agents, main thread) pass through.
// NOTE: writeScope is a heuristic backstop, not a precise ACL. Projects that
// place test files under src/__tests__ instead of test/ or tests/ will need to
// extend the test-writer scope — this guard is lenient for dev rather than tight.
import { readFileSync } from 'fs';

const WRITE_SCOPES = {
  "dev": [
    "src/",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "biome.json",
    "eslint.config.js",
    ".github/"
  ],
  "docs-writer": [
    "docs/"
  ],
  "planner": [
    "plans/"
  ],
  "advisor": [],
  "scout": []
};

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const agentType = payload.agent_type;
// Unknown agent or main thread — pass through.
if (!agentType || !(agentType in WRITE_SCOPES)) process.exit(0);

const filePath = payload.tool_input?.file_path;
if (!filePath) process.exit(0);

// Normalize to a project-relative path when an absolute path is given.
const cwd = payload.cwd ?? '';
let rel = filePath;
if (filePath.startsWith('/') && cwd && filePath.startsWith(cwd + '/')) {
  rel = filePath.slice(cwd.length + 1);
}

const allowedPrefixes = WRITE_SCOPES[agentType];
const memoryPrefix = `.claude/agent-memory/${agentType}/`;

// Always allow an agent to write its own memory dir (even read-only agents).
if (rel.startsWith(memoryPrefix)) process.exit(0);

// Read-only agents (empty writeScope): deny all other writes with a specific message.
if (allowedPrefixes.length === 0) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `read-only agent may not write any file. ${agentType} attempted to write ${filePath}. Route implementation to the dev agent instead.`,
      },
    })
  );
  process.exit(0);
}

// Allow if path is within the agent's declared scope.
const allowed = allowedPrefixes.some((prefix) => rel.startsWith(prefix));

if (allowed) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `${agentType} may only write under [${allowedPrefixes.join(', ')}] (and ${memoryPrefix}). Blocked write to ${filePath}. Route to the correct agent instead.`,
    },
  })
);
process.exit(0);
