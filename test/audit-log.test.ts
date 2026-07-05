import { existsSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prepareGuardDir } from './helpers/prepare-guard-dir';
import { runHook } from './helpers/run-hook';

// Ports the audit-log Verify section from
// plans/.archive/security-hardening/05-guard-audit-log.md into a permanent
// test, run against the REAL guard scripts (harness-assets-sourced).

let guard: ReturnType<typeof prepareGuardDir>;
let workDir: string;

beforeEach(() => {
  guard = prepareGuardDir();
  workDir = mkdtempSync(join(tmpdir(), 'beaver-audit-cwd-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

const auditLogPath = () => join(workDir, '.agents', 'audit.log');

describe('audit-log.mjs', () => {
  it('a deny from codex-permission-guard.mjs appends exactly one line with the expected shape', () => {
    const result = runHook(guard.codexPermissionGuard, { tool_input: { command: 'cat .env' } }, { cwd: workDir });
    expect(result.exitCode).toBe(0);

    expect(existsSync(auditLogPath())).toBe(true);
    const lines = readFileSync(auditLogPath(), 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(1);
    // <ISO timestamp> | <agent_type or "unknown"> | deny | <reason, truncated>
    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z \| unknown \| deny \| .+$/);
  });

  it('a deny from agent-guard.mjs (write-scope ACL) logs the real agent_type', () => {
    const payload = { agent_type: 'planner', tool_input: { file_path: 'src/index.ts' }, cwd: '' };
    const result = runHook(guard.agentGuard, payload, { cwd: workDir });
    expect(result.exitCode).toBe(0);

    const lines = readFileSync(auditLogPath(), 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z \| planner \| deny \| .+$/);
  });

  it('an allow payload never creates the audit log', () => {
    const result = runHook(guard.codexPermissionGuard, { tool_input: { command: 'cat README.md' } }, { cwd: workDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('');
    expect(existsSync(auditLogPath())).toBe(false);
  });
});
