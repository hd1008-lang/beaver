import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { buildHarnessFileMap } from '@src/scaffold/shared/harness-setup';
import { beaverParams, inRegenSet, regenFilesOnDisk, REPO_ROOT } from './beaver-params';

// The sanctioned way to update this repo's dogfood harness copies after any
// harness-assets/ or harness-setup.ts change:
//
//   npx tsx test/helpers/regen-dogfood.ts          # write the rendered files
//   npx tsx test/helpers/regen-dogfood.ts --check  # report-only diff, exit 1 on drift
//
// Comparison normalizes CRLF -> LF on the disk side only: core.autocrlf=true
// checkouts materialize LF-indexed files as CRLF on Windows (backlog/0012).
// Writes always emit LF; git normalizes on add.

const check = process.argv.includes('--check');

const normalize = (s: string): string => s.replace(/\r\n/g, '\n');

const rendered = buildHarnessFileMap(beaverParams).filter((f) => inRegenSet(f.relativePath));
const renderedPaths = new Set(rendered.map((f) => f.relativePath));

// Orphans: files on disk inside the regen set that the render does not emit.
const orphans = regenFilesOnDisk().filter((rel) => !renderedPaths.has(rel));

let differing = 0;
let missing = 0;

for (const file of rendered) {
  const abs = join(REPO_ROOT, file.relativePath);
  if (!existsSync(abs)) {
    missing++;
    console.log(`MISSING  ${file.relativePath}`);
  } else if (normalize(readFileSync(abs, 'utf-8')) !== normalize(file.content)) {
    differing++;
    console.log(`DIFFERS  ${file.relativePath}`);
  }
  if (!check) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.content, 'utf-8');
  }
}

for (const rel of orphans) {
  console.log(`ORPHAN   ${rel} (on disk, not rendered — delete or move it manually)`);
}

const drift = differing + missing + orphans.length;
console.log(
  `${check ? 'check' : 'regen'}: ${rendered.length} files rendered, ${differing} differing, ${missing} missing, ${orphans.length} orphaned${check ? '' : ' — files written'}`
);
if (check && drift > 0) process.exit(1);
