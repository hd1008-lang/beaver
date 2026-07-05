// agent-guard-core.mjs — shared ACL logic for Claude and Codex guard adapters.
// Pure logic only: no process.exit(), no process.stdout.write(), no fs side effects.
// Both agent-guard.mjs (Claude adapter) and agent-guard-codex.mjs (Codex adapter) import from here.
// Generated from the AGENTS registry at scaffold time — do not edit by hand.

export const WRITE_SCOPES = {
  "dev": [
    "src/",
    "test/",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "biome.json",
    "eslint.config.js",
    ".github/",
    "backlog/"
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

/**
 * Determine whether an agent is allowed to write to a given file path.
 *
 * @param {string} agentType  - The agent name (e.g. "dev", "planner").
 * @param {string} filePath   - The absolute or project-relative path being written.
 * @param {string} cwd        - The project root (used to compute a relative path).
 * @returns {{ decision: 'allow' | 'deny' | 'pass', reason?: string }}
 *   - 'allow'  — agent is permitted to write this path.
 *   - 'deny'   — agent is NOT permitted; reason string is set.
 *   - 'pass'   — unknown agent or no file path; caller should exit 0 silently.
 */
export function checkWritePermission(agentType, filePath, cwd) {
  // Unknown agent or main thread — pass through.
  if (!agentType || !(agentType in WRITE_SCOPES)) {
    return { decision: 'pass' };
  }

  if (!filePath) {
    return { decision: 'pass' };
  }

  // Normalize to project-relative path when an absolute path is given.
  // Handles POSIX (/repo/...) and Windows (C:\repo\... or C:/repo/...) paths.
  let rel = filePath.replace(/\\/g, '/');
  if (cwd) {
    const prefix = cwd.replace(/\\/g, '/').replace(/\/+$/, '') + '/';
    if (rel.startsWith(prefix)) {
      rel = rel.slice(prefix.length);
    } else if (/^[A-Za-z]:\//.test(rel) && rel.toLowerCase().startsWith(prefix.toLowerCase())) {
      // Windows drive-letter paths are case-insensitive.
      rel = rel.slice(prefix.length);
    }
  }

  const allowedPrefixes = WRITE_SCOPES[agentType];

  // Always allow an agent to write its own memory directory (implicit, even for read-only agents).
  // Memory lives at the harness-neutral path .agents/memory/<agentType>/.
  const memoryPrefix = `.agents/memory/${agentType}/`;
  if (rel.startsWith(memoryPrefix)) {
    return { decision: 'allow' };
  }

  // Read-only agents (empty writeScope): deny all other writes.
  if (allowedPrefixes.length === 0) {
    return {
      decision: 'deny',
      reason: `read-only agent may not write any file. ${agentType} attempted to write ${filePath}. Route implementation to the dev agent instead.`,
    };
  }

  // Allow if path is within the agent's declared scope.
  const allowed = allowedPrefixes.some((prefix) => rel.startsWith(prefix));
  if (allowed) {
    return { decision: 'allow' };
  }

  return {
    decision: 'deny',
    reason: `${agentType} may only write under [${allowedPrefixes.join(', ')}] (and ${memoryPrefix}). Blocked write to ${filePath}. Route to the correct agent instead.`,
  };
}
