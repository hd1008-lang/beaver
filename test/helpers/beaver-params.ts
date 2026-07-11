import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { HarnessParams } from '@src/scaffold/shared/harness-setup';

// The single definition of "beaver's cart": the exact HarnessParams that
// render this repo's own harness. Used by test/helpers/regen-dogfood.ts (writes
// the dogfood copies) and the phase-05 golden test (asserts zero drift).

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Bespoke project-specific inputs (beaver is a CLI tool, not a scaffolded
// react-vite project, so its AGENTS.md project-sections body / conventions
// skill / dev agent are hand-written). They are read verbatim from the live
// copies: they are INPUTS to the harness, not harness assets — the golden
// test's real coverage is the asset-derived files. beaver-sections.md is the
// project-sections input; it lives next to this file. Root CLAUDE.md is NOT
// bespoke — it is regen-managed, rendered from harness-assets/CLAUDE.md.
const live = (relPath: string): string => readFileSync(join(REPO_ROOT, relPath), 'utf-8');

export const beaverParams: HarnessParams = {
  projectName: 'beaver',
  slug: 'beaver',
  // Clause form: assets interpolate it as "for {{projectName}}, {{productDescription}}."
  productDescription: 'an interactive CLI that scaffolds web projects',
  harness: 'both',
  baseDir: '.beaver',
  // Recovered from the live rendered copies (scripts/_docs-shared.mjs:9-10).
  flowEnum: ['menu', 'scaffold', 'templates', 'infra', 'architecture', 'onboarding', '_meta'],
  layerEnum: ['options', 'scaffold', 'types', 'constants', 'utils', '_cross'],
  // scripts/docs-first-reminder.sh:9
  reminderTrigger: 'scaffold|template|menu|cart|harness-setup|harness',
  projectSections: live('test/helpers/beaver-sections.md'),
  extraRoutingRows:
    '\n| Feature work or bug fix in `src/` (menus, cart, templates) | `dev` | MUST read the relevant `docs/features/` spec before coding |',
  // Phase-03 audit found nothing Claude-only left in the old root CLAUDE.md
  // beyond the adapter asset's standard skill/settings/guard references.
  claudeExtras: '',
  conventionsSkill: live('.claude/skills/beaver-conventions/SKILL.md'),
  devAgent: live('.claude/agents/dev.md'),
  seedDocs: [],
  // No test-writer agent in this repo (yet) — plans/assets-and-tests phase 05+
  // adds vitest but the test-writer harness agent remains unscaffolded here.
};

// Regeneration/golden file set (decided 2026-07-05, plans/assets-and-tests/00-overview.md;
// CLAUDE.md added by plans/neutral-canonical-harness phase 03; .beaver/ prefix
// added by plans/0017-beaver-folder-structure): everything harness-emitted
// EXCEPT docs/** (real knowledge base) and .agents/** (live memory + skill
// twins diverge by design). scripts/ is knowledge-base tooling and moves under
// `.beaver/` (see baseDir in beaverParams below); .claude/ and .codex/ are
// tool-discovery paths and stay bare at root.
export const REGEN_PREFIXES = [
  '.beaver/scripts/',
  '.claude/scripts/',
  '.claude/agents/',
  '.claude/skills/',
  '.codex/',
] as const;

export const REGEN_FILES = [
  '.claude/settings.json',
  'AGENTS.md',
  'CLAUDE.md',
  '.beaver/plans/README.md',
  '.beaver/backlog/README.md',
] as const;

export const inRegenSet = (relativePath: string): boolean =>
  REGEN_PREFIXES.some((p) => relativePath.startsWith(p)) ||
  (REGEN_FILES as readonly string[]).includes(relativePath);

const listFiles = (dir: string): string[] => {
  const abs = join(REPO_ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const rel = `${dir}${name}`;
    return statSync(join(REPO_ROOT, rel)).isDirectory() ? listFiles(`${rel}/`) : [rel];
  });
};

/** Every file currently on disk that falls inside the regen/golden set. */
export const regenFilesOnDisk = (): string[] => [
  ...REGEN_PREFIXES.flatMap((p) => listFiles(p)),
  ...REGEN_FILES.filter((f) => existsSync(join(REPO_ROOT, f))),
];
