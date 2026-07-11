import { spawnSync } from 'child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { buildHarnessFileMap } from '@src/scaffold/shared/harness-setup';
import { FileMap } from '@src/scaffold/utils';
import { beaverParams } from './helpers/beaver-params';

// Emitted-validator self-test (backlog/0012 regression): the validate-plans.mjs
// / validate-structure.mjs / lint-docs-frontmatter.mjs scripts THIS repo emits
// via buildHarnessFileMap must pass against their own scaffolded output — both
// with LF (as rendered) and with CRLF line endings (Windows checkouts,
// core.autocrlf=true, per backlog/0012).
//
// Uses harness: 'both' WITHOUT `testing` — historically this avoided a
// collision (backlog/0018) where the test-writer agent def shared 'src/' as
// its first writeScope entry with 'dev', tripping validate-structure.mjs's
// primary-owned-directory uniqueness check. backlog/0018 fixed this by
// reordering TEST_WRITER_DEF.writeScope so 'test/' is first (src/scaffold/shared/harness-setup.ts).
// See the `harness: 'both'` + `testing` enabled describe block below for the
// regression test asserting that combination now passes too.

// baseDir: '' — this test validates the scaffolded-project layout (bare
// scripts/ at root), not beaver's own .beaver/-prefixed dogfood render.
const rendered: FileMap = buildHarnessFileMap({ ...beaverParams, harness: 'both', baseDir: '' });

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

// backlog/0018 regression: harness: 'both' + testing enabled used to bake a
// test-writer writeScope starting with 'src/' (same primary dir as dev) into
// the emitted scripts/validate-structure.mjs, making it fail against its own
// render with "agents \"dev\" and \"test-writer\" share the same primary
// owned directory \"src/\"". Fixed by reordering TEST_WRITER_DEF.writeScope
// (src/scaffold/shared/harness-setup.ts) so 'test/' is first. This describe
// block is the regression coverage the LF/CRLF blocks above deliberately
// avoided (see the file-level comment).
describe('emitted validators self-test (harness: both + testing enabled, backlog/0018 regression)', () => {
  const renderedWithTesting: FileMap = buildHarnessFileMap({
    ...beaverParams,
    harness: 'both',
    baseDir: '',
    testing: {
      testWriterAgent: `---
name: test-writer
description: "Test authoring agent — writes tests under test/ only."
model: haiku
memory: project
---

You are the test-writing agent. You write ONLY under \`test/\`.
`,
      testAuthorSkill: `# test-author skill\n\nMinimal fixture skill content for the backlog/0018 regression test.\n`,
    },
  });

  const root = mkdtempSync(join(tmpdir(), 'beaver-validator-selftest-testing-'));
  tmpDirs.push(root);
  writeFileMap(renderedWithTesting, root);

  it('scripts/validate-structure.mjs exits 0', () => {
    const { status, stdout, stderr } = runValidator(root, 'scripts/validate-structure.mjs');
    expect(status, `scripts/validate-structure.mjs failed:\nstdout: ${stdout}\nstderr: ${stderr}`).toBe(0);
  });
});
