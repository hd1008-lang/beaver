import { interpolate, readAsset } from '@src/scaffold/shared/assets';
import { FileMap } from '@src/scaffold/utils';

// Project-type-agnostic pieces of the AI harness (docs knowledge base, docs
// tooling, settings, docs skill, docs-writer agent, memory seeds).
// Canonical project content now lives in AGENTS.md (harness-assets/AGENTS.md) —
// emitted for every harness mode. CLAUDE.md (claude/both modes only) is a thin
// adapter asset (harness-assets/CLAUDE.md) importing it via `@AGENTS.md`.
// Project-specific pieces (projectSections/extraRoutingRows body, conventions
// skill, dev agent, test-writer) are rendered by each project type and passed
// in via HarnessParams.

// ---------------------------------------------------------------------------
// Agent Registry — single source of truth for the five core agents.
// Derived invariants (read-only ⇒ no Write/Edit, guard parameterized from
// writeScope) are enforced by phase 03 (agent-guard) and phase 04 (validator).
// ---------------------------------------------------------------------------

export interface AgentDef {
  name: string;
  model: 'sonnet' | 'haiku' | 'opus' | 'inherit';
  /** Path prefixes the agent may write. Empty = read-only. */
  writeScope: string[];
  /** Whether to seed .agents/memory/<name>/MEMORY.md on first run. */
  memory: boolean;
}

export const AGENTS: readonly AgentDef[] = [
  {
    name: 'dev',
    model: 'sonnet',
    // backlog/ is part of dev's duties: the PARK RULE requires dev to file
    // backlog entries itself when a step gets parked. test/ because dev owns
    // the tests for its own changes (test-writer only exists when testing is on).
    // plans/ (decided 2026-07-05, backlog/0014): dev updates phase status/
    // checkboxes/Resolution while executing; planner remains the primary owner
    // (keep 'src/' first — validate-structure's primary-dir check uses writeScope[0]).
    // harness-assets/ (2026-07-05, 0014 principle applied during 0016 phase 01):
    // dev owns the harness template content post-0013 — same duty as src/ templates.
    writeScope: ['src/', 'test/', 'package.json', 'tsconfig.json', 'vite.config.ts', 'biome.json', 'eslint.config.js', '.github/', 'backlog/', 'plans/', 'harness-assets/'],
    memory: true,
  },
  {
    name: 'docs-writer',
    model: 'haiku',
    writeScope: ['docs/'],
    memory: true,
  },
  {
    name: 'planner',
    // inherit: planning quality tracks the main session's model (decided 2026-07-05,
    // plans/assets-and-tests phase 04 triage).
    model: 'inherit',
    writeScope: ['plans/'],
    memory: true,
  },
  {
    name: 'advisor',
    model: 'opus',
    writeScope: [],
    memory: true,
  },
  {
    name: 'scout',
    model: 'haiku',
    writeScope: [],
    memory: false,
  },
];

// Internal: per-agent tool-list overrides for agents whose tools can't be purely
// derived from writeScope (advisor and scout both have empty writeScope but
// different tool sets). Not part of the 4-field spec schema.
const TOOL_OVERRIDES: Record<string, string> = {
  advisor: 'Read, Grep, Glob, Bash, WebFetch, WebSearch, Skill, TodoWrite',
  scout: 'Read, Grep, Glob, Skill',
};

// Derives the `tools:` frontmatter value for an agent from its registry entry.
// Write-capable agents (non-empty writeScope) get Write+Edit but no Bash.
// Read-only agents fall back to TOOL_OVERRIDES (advisor/scout differ).
const agentTools = (agent: AgentDef): string => {
  if (TOOL_OVERRIDES[agent.name]) return TOOL_OVERRIDES[agent.name];
  return agent.writeScope.length > 0
    ? 'Read, Grep, Glob, Write, Edit, Skill, TodoWrite'
    : 'Read, Grep, Glob, Skill'; // fallback for unknown read-only agents
};

// Returns the `memory: project` frontmatter line when the agent seeds memory.
const agentMemoryFrontmatter = (agent: AgentDef): string =>
  agent.memory ? '\nmemory: project' : '';

// Bakes the WRITE_SCOPES map (agent name → allowed path prefixes) consumed by
// agent-guard.mjs, agent-guard-core.mjs, and validate-structure.mjs assets.
const writeScopesJson = (agents: AgentDef[]): string => {
  const scopesObj: Record<string, string[]> = {};
  for (const agent of agents) {
    scopesObj[agent.name] = agent.writeScope;
  }
  return JSON.stringify(scopesObj, null, 2);
};

export const STATUS_ENUM = ['active', 'draft', 'deprecated'];
export const LANG_ENUM = ['en', 'vi'];

export interface HarnessParams {
  projectName: string;
  slug: string;
  productDescription: string;
  /** Which harness(es) to emit. Callers map cart.ai → this field.
   *  'claude' = .claude/ only; 'codex' = .codex/ only; 'both' = full dual harness. */
  harness: 'claude' | 'codex' | 'both';
  /** Directory prefix for harness files, e.g. '.beaver' for beaver's dogfood, '' for scaffolded projects. Defaults to ''. */
  baseDir?: string;
  flowEnum: string[];
  layerEnum: string[];
  reminderTrigger: string;
  /** Per-type AGENTS.md body: stack/commands/architecture/patterns/naming/anti-patterns/test section. */
  projectSections: string;
  /** Per-type Agent Routing table rows (dev row + optional test-writer row), each prefixed with `\n`. */
  extraRoutingRows: string;
  /** Extra Claude-only content appended at the end of the CLAUDE.md adapter. Defaults to ''. */
  claudeExtras?: string;
  conventionsSkill: string;
  devAgent: string;
  seedDocs: FileMap;
  testing?: {
    testWriterAgent: string;
    testAuthorSkill: string;
  };
}

// TEST_WRITER_DEF is kept out of AGENTS (it is optional, not always emitted).
// agentGuardMjsTemplate/agentGuardCoreMjsTemplate/validateStructureMjsTemplate's
// consumers (buildHarnessFileMap) fold it into allAgents when params.testing is set.
const TEST_WRITER_DEF: AgentDef = {
  name: 'test-writer',
  model: 'haiku',
  // 'test/' kept first (backlog/0018): validate-structure's primary-owned-dir
  // uniqueness check derives an agent's primary dir from writeScope[0]. dev's
  // writeScope also starts with 'src/', so test-writer starting with 'src/' too
  // collided with dev's primary dir even though both legitimately write under
  // src/. Reordering only affects that heuristic — agent-guard-core.mjs's
  // checkWritePermission() does a full array membership check (`.some(...)`),
  // not an index-0 check, so actual write permissions are unchanged.
  writeScope: ['test/', 'tests/', 'e2e/', 'playwright/', 'src/'],
  memory: true,
};

// ---------------------------------------------------------------------------
// File map
// ---------------------------------------------------------------------------

export const buildHarnessFileMap = (params: HarnessParams): FileMap => {
  const { projectName, slug, flowEnum, layerEnum, harness, baseDir = '' } = params;

  const wantClaude = harness === 'claude' || harness === 'both';
  const wantCodex  = harness === 'codex'  || harness === 'both';

  // Selective baseDir application: only knowledge-base paths (plans/, docs/,
  // backlog/, scripts/) move under baseDir (e.g. '.beaver' for this repo's own
  // dogfood); tool-discovery paths (.claude/, .codex/, .agents/, AGENTS.md,
  // CLAUDE.md) always stay bare at root. Pre-computed *Dir tokens (rather than
  // interpolating a raw baseDir + hardcoded literal slash) avoid producing a
  // leading '/plans/' when baseDir is ''.
  const KB_ROOTS = ['plans/', 'docs/', 'backlog/', 'scripts/'];
  const kbDir = (name: string): string => (baseDir ? `${baseDir}/${name}` : name);
  const kb = (relativePath: string): string => {
    if (!baseDir) return relativePath;
    return KB_ROOTS.some((root) => relativePath.startsWith(root))
      ? `${baseDir}/${relativePath}`
      : relativePath;
  };
  const plansDir = kbDir('plans');
  const docsDir = kbDir('docs');
  const backlogDir = kbDir('backlog');
  const scriptsDir = kbDir('scripts');
  const kbDirTokens = { plansDir, docsDir, backlogDir, scriptsDir };

  const agentDef = (name: string): AgentDef => {
    const found = AGENTS.find((a) => a.name === name);
    if (!found) throw new Error(`Agent "${name}" not found in AGENTS registry`);
    return found;
  };

  const allAgents = [...AGENTS, ...(params.testing ? [TEST_WRITER_DEF] : [])];
  // ACL entries for knowledge-base paths move with baseDir too (e.g. planner's
  // 'plans/' -> '.beaver/plans/'); tool paths in writeScope (src/, test/, etc.)
  // are untouched by kb() since they don't match KB_ROOTS.
  const scopesJson = writeScopesJson(
    allAgents.map((a) => ({ ...a, writeScope: a.writeScope.map(kb) }))
  );

  const memorySeedAsset = readAsset('.agents/memory/_seed.md');
  const memorySeed = (agentName: string): string => interpolate(memorySeedAsset, { agentName });

  const conventionsSkillContent = params.conventionsSkill;
  const docsSkillContent = interpolate(readAsset('skills/docs/SKILL.md'), {
    projectName,
    slug,
    flowEnumSlash: flowEnum.join('/'),
    layerEnumSlash: layerEnum.join('/'),
  });
  const memoryRetroSkillContent = interpolate(readAsset('skills/memory-retro/SKILL.md'), {
    projectName,
    slug,
  });

  // Provider-adapter notes: per-provider capability asymmetries are stated here
  // (renderer layer), never baked into the AGENTS.md content layer (decision 3,
  // plans/neutral-canonical-harness/00-overview.md).
  const adapterNotesParts: string[] = [];
  if (wantClaude) {
    adapterNotesParts.push(
      `**Claude Code**: entry point \`CLAUDE.md\` (thin \`@AGENTS.md\` adapter). Subagents: \`.claude/agents/*.md\`. Skills: \`.claude/skills/\`. Workspace config: \`.claude/settings.json\` (env vars, tool permissions — \`allow\`/\`ask\`/\`deny\` — and hooks). Write-scope enforcement: \`.claude/scripts/agent-guard.mjs\` (\`PreToolUse\` hook).`
    );
  }
  if (wantCodex) {
    adapterNotesParts.push(
      `**Codex**: this file (AGENTS.md) is the entry point directly. Subagents: \`.codex/agents/*.toml\`. Skills (real files, not symlinks): \`.agents/skills/\`. Hook configuration: \`.codex/hooks.json\`; write-scope enforcement: \`.codex/scripts/agent-guard-codex.mjs\`. No \`permissions.ask\` tier — allow/deny only.`
    );
  }
  const adapterNotes = adapterNotesParts.join('\n\n');

  // ── SHARED — emitted for either claude, codex, or both ─────────────────────
  // Includes: docs tooling, agent-guard-core (imported by both adapters),
  // docs-first-reminder.sh (both hooks.json and settings.json reference it),
  // and the knowledge base (plans/, backlog/, docs/).
  // All shared scripts live in top-level scripts/ — harness-neutral, no .claude/ prefix.
  const shared: FileMap = [
    {
      relativePath: kb('scripts/_docs-shared.mjs'),
      content: interpolate(readAsset('scripts/_docs-shared.mjs'), {
        flowEnumJson: JSON.stringify(flowEnum),
        layerEnumJson: JSON.stringify(layerEnum),
        docsDir,
      }),
    },
    // Fully static (zero-token) templates are read from harness-assets/ (see
    // plans/assets-and-tests/02-static-script-assets.md) instead of embedded template literals.
    { relativePath: kb('scripts/build-docs-index.mjs'), content: readAsset('scripts/build-docs-index.mjs') },
    { relativePath: kb('scripts/lint-docs-frontmatter.mjs'), content: readAsset('scripts/lint-docs-frontmatter.mjs') },
    {
      relativePath: kb('scripts/validate-structure.mjs'),
      content: interpolate(readAsset('scripts/validate-structure.mjs'), { writeScopesJson: scopesJson }),
    },
    {
      relativePath: kb('scripts/validate-plans.mjs'),
      content: interpolate(readAsset('scripts/validate-plans.mjs'), { plansDir, backlogDir }),
    },
    {
      relativePath: kb('scripts/docs-first-reminder.sh'),
      content: interpolate(readAsset('scripts/docs-first-reminder.sh'), { reminderTrigger: params.reminderTrigger }),
    },
    // agent-guard-core.mjs is imported by both Claude and Codex adapters (via a
    // relative path threaded with scriptsDir — see claudeOnly/codexOnly below).
    {
      relativePath: kb('scripts/agent-guard-core.mjs'),
      content: interpolate(readAsset('scripts/agent-guard-core.mjs'), { writeScopesJson: scopesJson }),
    },
    // audit-log.mjs is imported by all deny call sites across both harnesses (phase 05).
    { relativePath: kb('scripts/audit-log.mjs'), content: readAsset('scripts/audit-log.mjs') },
    // ── Knowledge base ──────────────────────────────────────────────────────
    { relativePath: kb('plans/README.md'), content: readAsset('plans/README.md') },
    { relativePath: kb('backlog/README.md'), content: readAsset('backlog/README.md') },
    { relativePath: kb('docs/README.md'), content: readAsset('docs/README.md') },
    { relativePath: kb('docs/INDEX.md'), content: readAsset('docs/INDEX.md') },
    {
      relativePath: kb('docs/_template.md'),
      content: interpolate(readAsset('docs/_template.md'), {
        flowEnumJoined: flowEnum.join(' | '),
        layerEnumJoined: layerEnum.join(' | '),
      }),
    },
    ...params.seedDocs.map((f) => ({ ...f, relativePath: kb(f.relativePath) })),
    // AGENTS.md is the canonical project document — emitted for every harness
    // mode (claude/codex/both). CLAUDE.md (claudeOnly, below) is a thin adapter
    // importing it via `@AGENTS.md`. AGENTS.md itself is a tool-discovery path
    // and always stays bare at root, even though it references baseDir-prefixed
    // knowledge-base paths inside its body.
    {
      relativePath: 'AGENTS.md',
      content: interpolate(readAsset('AGENTS.md'), {
        projectName,
        productDescription: params.productDescription,
        projectSections: params.projectSections,
        extraRoutingRows: params.extraRoutingRows,
        adapterNotes,
        ...kbDirTokens,
      }),
    },
    // harness-neutral: emitted for claude, codex, and both. .agents/ is a
    // tool-discovery path — always bare, never baseDir-prefixed.
    { relativePath: '.agents/memory/dev/MEMORY.md', content: memorySeed('dev') },
    { relativePath: '.agents/memory/docs-writer/MEMORY.md', content: memorySeed('docs-writer') },
    { relativePath: '.agents/memory/planner/MEMORY.md', content: memorySeed('planner') },
    { relativePath: '.agents/memory/advisor/MEMORY.md', content: memorySeed('advisor') },
  ];

  // ── CLAUDE-ONLY — emitted only when harness includes claude ─────────────────
  // Includes: CLAUDE.md, .claude/settings.json, .claude/scripts/agent-guard.mjs
  // (the Claude adapter — the only script that stays in .claude/scripts/),
  // .claude/agents/*.md, .claude/skills/.
  const testAuthorSkillRef = params.testing ? `, \`.claude/skills/${slug}-test-author\`` : '';

  const claudeOnly: FileMap = wantClaude ? [
    {
      relativePath: 'CLAUDE.md',
      content: interpolate(readAsset('CLAUDE.md'), {
        projectName,
        slug,
        testAuthorSkillRef,
        claudeExtras: params.claudeExtras ?? '',
      }),
    },
    // Skills under .claude/skills/ — Claude loads them natively from here.
    // (Codex twins live in .agents/skills/ under codexOnly.)
    { relativePath: `.claude/skills/${slug}-conventions/SKILL.md`, content: conventionsSkillContent },
    { relativePath: `.claude/skills/${slug}-docs/SKILL.md`, content: docsSkillContent },
    { relativePath: `.claude/skills/${slug}-memory-retro/SKILL.md`, content: memoryRetroSkillContent },
    {
      relativePath: '.claude/settings.json',
      content: interpolate(readAsset('.claude/settings.json'), { scriptsDir }),
    },
    // Thin adapter — scopes live in scripts/agent-guard-core.mjs; scriptsDir
    // threads the relative import path across the immovable/movable boundary
    // (.claude/scripts/ always stays at root, but it imports from scripts/,
    // which moves under baseDir).
    {
      relativePath: '.claude/scripts/agent-guard.mjs',
      content: interpolate(readAsset('.claude/scripts/agent-guard.mjs'), { scriptsDir }),
    },
    { relativePath: '.claude/agents/dev.md', content: params.devAgent },
    {
      relativePath: '.claude/agents/docs-writer.md',
      // No tools frontmatter: docs-writer keeps the full toolset — it must run
      // build-docs-index.mjs (Bash) after every docs change (decided 2026-07-05).
      content: interpolate(readAsset('.claude/agents/docs-writer.md'), {
        projectName,
        slug,
        model: agentDef('docs-writer').model,
        memoryFrontmatter: agentMemoryFrontmatter(agentDef('docs-writer')),
        ...kbDirTokens,
      }),
    },
    {
      relativePath: '.claude/agents/planner.md',
      content: interpolate(readAsset('.claude/agents/planner.md'), {
        projectName,
        productDescription: params.productDescription,
        model: agentDef('planner').model,
        memoryFrontmatter: agentMemoryFrontmatter(agentDef('planner')),
        tools: agentTools(agentDef('planner')),
        ...kbDirTokens,
      }),
    },
    {
      relativePath: '.claude/agents/advisor.md',
      content: interpolate(readAsset('.claude/agents/advisor.md'), {
        projectName,
        slug,
        productDescription: params.productDescription,
        model: agentDef('advisor').model,
        memoryFrontmatter: agentMemoryFrontmatter(agentDef('advisor')),
        tools: agentTools(agentDef('advisor')),
        ...kbDirTokens,
      }),
    },
    {
      relativePath: '.claude/agents/scout.md',
      content: interpolate(readAsset('.claude/agents/scout.md'), {
        projectName,
        slug,
        productDescription: params.productDescription,
        model: agentDef('scout').model,
        tools: agentTools(agentDef('scout')),
        ...kbDirTokens,
      }),
    },
  ] : [];

  // ── CODEX-ONLY — emitted only when harness includes codex ──────────────────
  // Includes: .codex/hooks.json, .codex/agents/*.toml,
  // .agents/skills/ twins (real files — no symlinks), and the Codex-specific
  // hook scripts under .codex/scripts/ (hooks.json references them via git rev-parse).
  // No .claude/ directory is created for codex-only projects.
  const codexOnly: FileMap = wantCodex ? [
    {
      relativePath: '.codex/hooks.json',
      content: interpolate(readAsset('.codex/hooks.json'), { scriptsDir }),
    },
    {
      relativePath: '.codex/agents/dev.toml',
      content: interpolate(readAsset('.codex/agents/dev.toml'), {
        projectName,
        slug,
        productDescription: params.productDescription,
        scopeList: agentDef('dev').writeScope.map(kb).join(', '),
        ...kbDirTokens,
      }),
    },
    {
      relativePath: '.codex/agents/docs-writer.toml',
      content: interpolate(readAsset('.codex/agents/docs-writer.toml'), { projectName, slug, ...kbDirTokens }),
    },
    {
      relativePath: '.codex/agents/planner.toml',
      content: interpolate(readAsset('.codex/agents/planner.toml'), { projectName, productDescription: params.productDescription, ...kbDirTokens }),
    },
    {
      relativePath: '.codex/agents/advisor.toml',
      content: interpolate(readAsset('.codex/agents/advisor.toml'), { projectName, slug, productDescription: params.productDescription, ...kbDirTokens }),
    },
    {
      relativePath: '.codex/agents/scout.toml',
      content: interpolate(readAsset('.codex/agents/scout.toml'), { projectName, slug, productDescription: params.productDescription, ...kbDirTokens }),
    },
    // Skills duplicated as real files (no symlinks — symlinks don't survive npm pack / CI).
    // .agents/skills/ is a tool-discovery path — always bare, never baseDir-prefixed.
    { relativePath: `.agents/skills/${slug}-conventions/SKILL.md`, content: conventionsSkillContent },
    { relativePath: `.agents/skills/${slug}-docs/SKILL.md`, content: docsSkillContent },
    { relativePath: `.agents/skills/${slug}-memory-retro/SKILL.md`, content: memoryRetroSkillContent },
    // Codex hook scripts under .codex/scripts/ — hooks.json references them via git rev-parse.
    // scriptsDir threads the relative import path to shared scripts/agent-guard-core.mjs
    // and scripts/audit-log.mjs, which move under baseDir.
    {
      relativePath: '.codex/scripts/agent-guard-codex.mjs',
      content: interpolate(readAsset('.codex/scripts/agent-guard-codex.mjs'), { scriptsDir }),
    },
    { relativePath: '.codex/scripts/codex-subagent-start.mjs', content: readAsset('.codex/scripts/codex-subagent-start.mjs') },
    { relativePath: '.codex/scripts/codex-subagent-stop.mjs', content: readAsset('.codex/scripts/codex-subagent-stop.mjs') },
    {
      relativePath: '.codex/scripts/codex-permission-guard.mjs',
      content: interpolate(readAsset('.codex/scripts/codex-permission-guard.mjs'), { scriptsDir }),
    },
  ] : [];

  const files: FileMap = [...shared, ...claudeOnly, ...codexOnly];

  if (params.testing) {
    // test-writer is Claude-specific (agent .md file + memory seed + skill).
    // Only emit if the Claude harness is included.
    if (wantClaude) {
      files.push(
        { relativePath: '.claude/agents/test-writer.md', content: params.testing.testWriterAgent },
        { relativePath: '.agents/memory/test-writer/MEMORY.md', content: memorySeed('test-writer') },
        { relativePath: `.claude/skills/${slug}-test-author/SKILL.md`, content: params.testing.testAuthorSkill }
      );
    }
  }

  return files;
};
