import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { interpolate, readAsset } from '@src/scaffold/shared/assets';
import { AGENTS } from '@src/scaffold/shared/harness-setup';

// Builds a runnable, harness-assets-sourced copy of the write-scope guard trio
// (agent-guard-core.mjs + its two adapters + audit-log.mjs) under a throwaway
// temp directory, preserving the same relative import layout the real
// scaffold output uses (scripts/ + .claude/scripts/ + .codex/scripts/). This
// lets tests import/spawn the REAL asset content (via readAsset/interpolate,
// the same functions buildHarnessFileMap uses) instead of the dogfood copies,
// while still producing valid, executable JS — the raw harness-assets copy of
// agent-guard-core.mjs contains an unresolved `{{writeScopesJson}}` token and
// is not valid JS on its own (see MEMORY.md note on tokenized assets).

export interface GuardDir {
  root: string;
  agentGuardCore: string;
  agentGuard: string;
  agentGuardCodex: string;
  codexPermissionGuard: string;
  auditLog: string;
}

export function prepareGuardDir(): GuardDir {
  const root = mkdtempSync(join(tmpdir(), 'beaver-guard-'));
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, '.claude', 'scripts'), { recursive: true });
  mkdirSync(join(root, '.codex', 'scripts'), { recursive: true });

  // Mirrors writeScopesJson() in src/scaffold/shared/harness-setup.ts.
  const scopesObj: Record<string, string[]> = {};
  for (const agent of AGENTS) scopesObj[agent.name] = agent.writeScope;
  const scopesJson = JSON.stringify(scopesObj, null, 2);

  const agentGuardCore = join(root, 'scripts', 'agent-guard-core.mjs');
  const auditLog = join(root, 'scripts', 'audit-log.mjs');
  const agentGuard = join(root, '.claude', 'scripts', 'agent-guard.mjs');
  const agentGuardCodex = join(root, '.codex', 'scripts', 'agent-guard-codex.mjs');
  const codexPermissionGuard = join(root, '.codex', 'scripts', 'codex-permission-guard.mjs');

  // scriptsDir: 'scripts' — this fixture always mirrors the bare (baseDir='')
  // scaffolded-project layout, so the adapters' relative imports resolve to
  // '../../scripts/...' unchanged (see plans/0017-beaver-folder-structure).
  writeFileSync(agentGuardCore, interpolate(readAsset('scripts/agent-guard-core.mjs'), { writeScopesJson: scopesJson }));
  writeFileSync(auditLog, readAsset('scripts/audit-log.mjs'));
  writeFileSync(agentGuard, interpolate(readAsset('.claude/scripts/agent-guard.mjs'), { scriptsDir: 'scripts' }));
  writeFileSync(agentGuardCodex, interpolate(readAsset('.codex/scripts/agent-guard-codex.mjs'), { scriptsDir: 'scripts' }));
  writeFileSync(codexPermissionGuard, interpolate(readAsset('.codex/scripts/codex-permission-guard.mjs'), { scriptsDir: 'scripts' }));

  return { root, agentGuardCore, agentGuard, agentGuardCodex, codexPermissionGuard, auditLog };
}
