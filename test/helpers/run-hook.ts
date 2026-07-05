import { spawnSync } from 'child_process';

// Cross-platform stand-in for the `echo '{...}' | node script.mjs` pattern used
// in the archived security-hardening plan's Verify sections. Writes the JSON
// payload directly to the child's stdin (no shell `echo`, so it works
// identically on Windows and POSIX) and captures stdout + exit code.

export interface HookResult {
  stdout: string;
  exitCode: number;
}

/**
 * Spawn `node <scriptPath>`, pipe `JSON.stringify(payload)` to stdin, and
 * capture stdout/exit code. Pass `cwd` to control where guard scripts that
 * resolve relative paths (e.g. `.agents/audit.log`) actually write — always
 * point it at a throwaway temp dir in tests, never the repo root.
 */
export function runHook(scriptPath: string, payload: unknown, options?: { cwd?: string }): HookResult {
  const result = spawnSync(process.execPath, [scriptPath], {
    input: JSON.stringify(payload),
    cwd: options?.cwd,
    encoding: 'utf-8',
  });

  return {
    stdout: (result.stdout ?? '').trim(),
    exitCode: result.status ?? -1,
  };
}
