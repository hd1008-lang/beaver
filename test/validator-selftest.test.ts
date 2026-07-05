import { spawnSync } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { buildClaudeFileMap } from '@src/scaffold/shared/claude-setup';
import { FileMap } from '@src/scaffold/utils';
import { beaverParams } from './helpers/beaver-params';

// Emitted-validator self-test (backlog/0012 regression): the validate-plans.mjs
// / validate-structure.mjs / lint-docs-frontmatter.mjs scripts THIS repo emits
// via buildClaudeFileMap must pass against their own scaffolded output — both
// with LF (as rendered) and with CRLF line endings (Windows checkouts,
// core.autocrlf=true, per backlog/0012).
//
// Uses harness: 'both' WITHOUT `testing` — the emitted validate-structure.mjs
// bakes a primary-owned-directory uniqueness check over its WRITE_SCOPES, and
// the test-writer agent def (src/scaffold/shared/claude-setup.ts TEST_WRITER_DEF)
// shares 'src/' as its first writeScope entry with 'dev', which trips that
// check and makes the emitted validate-structure.mjs fail on itself whenever
// `testing` is set. That collision is a pre-existing bug in claude-setup.ts,
// out of scope for this phase (filed as backlog/0018) — this self-test
// deliberately renders without `testing` to avoid it and cover the scripts
// under test with valid, non-colliding input.

const rendered: FileMap = buildClaudeFileMap({ ...beaverParams, harness: 'both' });

const tmpDirs: string[] = [];

function writeFileMap(files: FileMap, root: string, transform?: (content: string, relativePath: string) => string): void {
  for (const file of files) {
    const abs = join(root, file.relativePath);
    mkdirSync(dirname(abs), { recursive: true });
    const content = transform ? transform(file.content, file.relativePath) : file.content;
    writeFileSync(abs, content, 'utf-8');
  }
}

function runValidator(root: string, relScriptPath: string): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync(process.execPath, [join(root, relScriptPath)], {
    cwd: root,
    encoding: 'utf-8',
  });
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', status: result.status };
}

const VALIDATORS = [
  'scripts/validate-plans.mjs',
  'scripts/validate-structure.mjs',
  'scripts/lint-docs-frontmatter.mjs',
];

afterAll(() => {
  for (const dir of tmpDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('emitted validators self-test (LF, as rendered)', () => {
  const root = mkdtempSync(join(tmpdir(), 'beaver-validator-selftest-'));
  tmpDirs.push(root);
  writeFileMap(rendered, root);

  for (const script of VALIDATORS) {
    it(`${script} exits 0`, () => {
      const { status, stdout, stderr } = runValidator(root, script);
      expect(status, `${script} failed:\nstdout: ${stdout}\nstderr: ${stderr}`).toBe(0);
    });
  }
});

describe('emitted validators self-test (CRLF .md fixtures, backlog/0012 regression)', () => {
  const root = mkdtempSync(join(tmpdir(), 'beaver-validator-selftest-crlf-'));
  tmpDirs.push(root);
  writeFileMap(rendered, root, (content, relativePath) =>
    relativePath.endsWith('.md') ? content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n') : content
  );

  for (const script of VALIDATORS) {
    it(`${script} exits 0 against CRLF .md fixtures`, () => {
      const { status, stdout, stderr } = runValidator(root, script);
      expect(status, `${script} failed:\nstdout: ${stdout}\nstderr: ${stderr}`).toBe(0);
    });
  }
});
