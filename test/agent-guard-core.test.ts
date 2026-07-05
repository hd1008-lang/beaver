import { pathToFileURL } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prepareGuardDir } from './helpers/prepare-guard-dir';

// Ports the 12-case Windows/POSIX path matrix from backlog/0011's resolution
// into a permanent test, run against the REAL agent-guard-core.mjs asset
// (harness-assets/scripts/agent-guard-core.mjs, interpolated with the real
// AGENTS registry scopes) rather than a re-implementation.

type CheckWritePermission = (
  agentType: string | undefined,
  filePath: string | undefined,
  cwd: string
) => { decision: 'allow' | 'deny' | 'pass'; reason?: string };

let checkWritePermission: CheckWritePermission;

beforeAll(async () => {
  const dir = prepareGuardDir();
  const mod = (await import(pathToFileURL(dir.agentGuardCore).href)) as {
    checkWritePermission: CheckWritePermission;
  };
  checkWritePermission = mod.checkWritePermission;
});

describe('checkWritePermission — Windows/POSIX path matrix (backlog/0011)', () => {
  it('POSIX absolute path in scope allows (dev -> src/)', () => {
    expect(checkWritePermission('dev', '/repo/src/index.ts', '/repo').decision).toBe('allow');
  });

  it('POSIX absolute path out of scope denies (planner -> src/)', () => {
    expect(checkWritePermission('planner', '/repo/src/index.ts', '/repo').decision).toBe('deny');
  });

  it('POSIX relative path in scope allows (docs-writer -> docs/)', () => {
    expect(checkWritePermission('docs-writer', 'docs/index.md', '').decision).toBe('allow');
  });

  it('POSIX relative path out of scope denies (planner -> src/)', () => {
    expect(checkWritePermission('planner', 'src/index.ts', '').decision).toBe('deny');
  });

  it('Windows backslash absolute path in scope allows (dev -> src/)', () => {
    expect(checkWritePermission('dev', 'C:\\repo\\src\\index.ts', 'C:\\repo').decision).toBe('allow');
  });

  it('Windows backslash absolute path out of scope denies (planner -> src/)', () => {
    expect(checkWritePermission('planner', 'C:\\repo\\src\\index.ts', 'C:\\repo').decision).toBe('deny');
  });

  it('Windows forward-slash drive-letter path in scope allows (planner -> plans/)', () => {
    expect(checkWritePermission('planner', 'C:/repo/plans/x.md', 'C:/repo').decision).toBe('allow');
  });

  it('Windows drive-letter cwd stripping is case-insensitive', () => {
    expect(checkWritePermission('planner', 'c:/repo/plans/x.md', 'C:/repo').decision).toBe('allow');
  });

  it('.agents/memory/<agent>/ is implicitly allowed even for read-only agents (POSIX)', () => {
    expect(checkWritePermission('advisor', '/repo/.agents/memory/advisor/MEMORY.md', '/repo').decision).toBe('allow');
  });

  it('.agents/memory/<agent>/ is implicitly allowed even for read-only agents (Windows)', () => {
    expect(checkWritePermission('scout', 'C:\\repo\\.agents\\memory\\scout\\MEMORY.md', 'C:\\repo').decision).toBe(
      'allow'
    );
  });

  it('read-only agent (empty writeScope) denies any other write', () => {
    expect(checkWritePermission('advisor', '/repo/src/index.ts', '/repo').decision).toBe('deny');
  });

  it('missing/unknown agent_type passes through', () => {
    expect(checkWritePermission(undefined, '/repo/src/index.ts', '/repo').decision).toBe('pass');
    expect(checkWritePermission('some-unregistered-agent', '/repo/src/index.ts', '/repo').decision).toBe('pass');
  });

  it('missing file path passes through', () => {
    expect(checkWritePermission('dev', undefined, '/repo').decision).toBe('pass');
  });
});
