import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ClaudeHarnessParams } from '@src/scaffold/shared/claude-setup';

// The single definition of "beaver's cart": the exact ClaudeHarnessParams that
// render this repo's own harness. Used by test/helpers/regen-dogfood.ts (writes
// the dogfood copies) and the phase-05 golden test (asserts zero drift).

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Bespoke project-specific inputs (beaver is a CLI tool, not a scaffolded
// react-vite project, so its CLAUDE.md / conventions skill / dev agent are
// hand-written). They are read verbatim from the live copies: they are INPUTS
// to the harness, not harness assets — the golden test's real coverage is the
// asset-derived files.
const live = (relPath: string): string => readFileSync(join(REPO_ROOT, relPath), 'utf-8');

export const beaverParams: ClaudeHarnessParams = {
  projectName: 'beaver',
  slug: 'beaver',
  // Clause form: assets interpolate it as "for {{projectName}}, {{productDescription}}."
  productDescription: 'an interactive CLI that scaffolds web projects',
  harness: 'both',
  // Recovered from the live rendered copies (scripts/_docs-shared.mjs:9-10).
  flowEnum: ['menu', 'scaffold', 'templates', 'infra', 'architecture', 'onboarding', '_meta'],
  layerEnum: ['options', 'scaffold', 'types', 'constants', 'utils', '_cross'],
  // scripts/docs-first-reminder.sh:9
  reminderTrigger: 'scaffold|template|menu|cart|claude-setup|harness',
  claudeMd: live('CLAUDE.md'),
  conventionsSkill: live('.claude/skills/beaver-conventions/SKILL.md'),
  devAgent: live('.claude/agents/dev.md'),
  seedDocs: [],
  // No test-writer agent in this repo (yet) — plans/assets-and-tests phase 05+
  // adds vitest but the test-writer harness agent remains unscaffolded here.
};

// Regeneration/golden file set (decided 2026-07-05, plans/assets-and-tests/00-overview.md):
// everything harness-emitted EXCEPT CLAUDE.md (bespoke dogfood copy), docs/**
// (real knowledge base) and .agents/** (live memory + skill twins diverge by design).
export const REGEN_PREFIXES = [
  'scripts/',
  '.claude/scripts/',
  '.claude/agents/',
  '.claude/skills/',
  '.codex/',
] as const;

export const REGEN_FILES = [
  '.claude/settings.json',
  'AGENTS.md',
  'plans/README.md',
  'backlog/README.md',
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
