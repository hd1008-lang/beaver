import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { buildClaudeFileMap } from '@src/scaffold/shared/claude-setup';
import { beaverParams, inRegenSet, regenFilesOnDisk, REPO_ROOT } from './helpers/beaver-params';

// Golden dogfood-drift test: this repo's own scripts/, .claude/, .codex/,
// AGENTS.md, plans/README.md and backlog/README.md must be byte-identical to
// the rendered output of buildClaudeFileMap with beaver's own params.
// Line endings are pinned to LF by .gitattributes, so no normalization here.

const HINT =
  'live file differs from the rendered harness — if the asset/template change is intentional, run `npx tsx test/helpers/regen-dogfood.ts` to update the dogfood copies';

const rendered = buildClaudeFileMap(beaverParams).filter((f) => inRegenSet(f.relativePath));

describe('golden dogfood drift', () => {
  for (const file of rendered) {
    it(`${file.relativePath} matches the render`, () => {
      const abs = join(REPO_ROOT, file.relativePath);
      expect(existsSync(abs), `${file.relativePath} is rendered but missing on disk — ${HINT}`).toBe(true);
      expect(readFileSync(abs, 'utf-8'), `${file.relativePath}: ${HINT}`).toBe(file.content);
    });
  }

  it('no orphaned live files (on disk but no longer rendered)', () => {
    const renderedPaths = new Set(rendered.map((f) => f.relativePath));
    const orphans = regenFilesOnDisk().filter((rel) => !renderedPaths.has(rel));
    expect(orphans, `orphaned files: delete them or add them back to the file map — ${HINT}`).toEqual([]);
  });
});
