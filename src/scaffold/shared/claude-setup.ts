import { interpolate, readAsset } from '@src/scaffold/shared/assets';
import { FileMap } from '@src/scaffold/utils';

// Project-type-agnostic pieces of the Claude Code harness (docs knowledge base,
// docs tooling, settings, docs skill, docs-writer agent, memory seeds).
// Project-specific pieces (CLAUDE.md, conventions skill, dev agent, test-writer)
// are rendered by each project type and passed in via ClaudeHarnessParams.

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
    writeScope: ['src/', 'test/', 'package.json', 'tsconfig.json', 'vite.config.ts', 'biome.json', 'eslint.config.js', '.github/', 'backlog/', 'plans/'],
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

// Generates the shared agent-routing table rows for use in CLAUDE.md templates.
// Includes advisor, scout, planner, and docs-writer (identical across project types).
// The caller appends its own project-type-specific dev row (and optional
// test-writer row) after this block.
// ROW ORDER NOTE (phase 02): dev row now appears AFTER docs-writer in the
// generated table. Previously it sat between planner and docs-writer. The spec
// does not mandate order — shared agents first, project-specific last is cleaner.
export const claudeHarnessTableTemplate = (): string =>
  `| Brainstorming / trade-off analysis / "what's the best approach?" before any change | \`advisor\` | read-only; deepest source mental model; recommends, never edits |
| Quick factual lookup about the code/docs (answer + \`path:line\`) | \`scout\` | read-only; cheap; for facts, not design reasoning |
| Decomposing a story into a resumable plan | \`planner\` | owns \`plans/\`; writes phase files only, never code |
| Analyzing requirements, writing/updating feature docs | \`docs-writer\` | owns \`docs/\`; rebuilds INDEX.md after every change |`;

export const STATUS_ENUM = ['active', 'draft', 'deprecated'];
export const LANG_ENUM = ['en', 'vi'];

export interface ClaudeHarnessParams {
  projectName: string;
  slug: string;
  productDescription: string;
  /** Which harness(es) to emit. Callers map cart.ai → this field.
   *  'claude' = .claude/ only; 'codex' = .codex/ only; 'both' = full dual harness. */
  harness: 'claude' | 'codex' | 'both';
  flowEnum: string[];
  layerEnum: string[];
  reminderTrigger: string;
  claudeMd: string;
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
// consumers (buildClaudeFileMap) fold it into allAgents when params.testing is set.
const TEST_WRITER_DEF: AgentDef = {
  name: 'test-writer',
  model: 'haiku',
  writeScope: ['src/', 'test/', 'tests/', 'e2e/', 'playwright/'],
  memory: true,
};

// ---------------------------------------------------------------------------
// File map
// ---------------------------------------------------------------------------

export const buildClaudeFileMap = (params: ClaudeHarnessParams): FileMap => {
  const { projectName, slug, flowEnum, layerEnum, harness } = params;

  const wantClaude = harness === 'claude' || harness === 'both';
  const wantCodex  = harness === 'codex'  || harness === 'both';

  const agentDef = (name: string): AgentDef => {
    const found = AGENTS.find((a) => a.name === name);
    if (!found) throw new Error(`Agent "${name}" not found in AGENTS registry`);
    return found;
  };

  const allAgents = [...AGENTS, ...(params.testing ? [TEST_WRITER_DEF] : [])];
  const scopesJson = writeScopesJson(allAgents);

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

  // ── SHARED — emitted for either claude, codex, or both ─────────────────────
  // Includes: docs tooling, agent-guard-core (imported by both adapters),
  // docs-first-reminder.sh (both hooks.json and settings.json reference it),
  // and the knowledge base (plans/, backlog/, docs/).
  // All shared scripts live in top-level scripts/ — harness-neutral, no .claude/ prefix.
  const shared: FileMap = [
    {
      relativePath: 'scripts/_docs-shared.mjs',
      content: interpolate(readAsset('scripts/_docs-shared.mjs'), {
        flowEnumJson: JSON.stringify(flowEnum),
        layerEnumJson: JSON.stringify(layerEnum),
      }),
    },
    // Fully static (zero-token) templates are read from harness-assets/ (see
    // plans/assets-and-tests/02-static-script-assets.md) instead of embedded template literals.
    { relativePath: 'scripts/build-docs-index.mjs', content: readAsset('scripts/build-docs-index.mjs') },
    { relativePath: 'scripts/lint-docs-frontmatter.mjs', content: readAsset('scripts/lint-docs-frontmatter.mjs') },
    {
      relativePath: 'scripts/validate-structure.mjs',
      content: interpolate(readAsset('scripts/validate-structure.mjs'), { writeScopesJson: scopesJson }),
    },
    { relativePath: 'scripts/validate-plans.mjs', content: readAsset('scripts/validate-plans.mjs') },
    {
      relativePath: 'scripts/docs-first-reminder.sh',
      content: interpolate(readAsset('scripts/docs-first-reminder.sh'), { reminderTrigger: params.reminderTrigger }),
    },
    // agent-guard-core.mjs is imported by both Claude and Codex adapters.
    {
      relativePath: 'scripts/agent-guard-core.mjs',
      content: interpolate(readAsset('scripts/agent-guard-core.mjs'), { writeScopesJson: scopesJson }),
    },
    // audit-log.mjs is imported by all deny call sites across both harnesses (phase 05).
    { relativePath: 'scripts/audit-log.mjs', content: readAsset('scripts/audit-log.mjs') },
    // ── Knowledge base ──────────────────────────────────────────────────────
    { relativePath: 'plans/README.md', content: readAsset('plans/README.md') },
    { relativePath: 'backlog/README.md', content: readAsset('backlog/README.md') },
    { relativePath: 'docs/README.md', content: readAsset('docs/README.md') },
    { relativePath: 'docs/INDEX.md', content: readAsset('docs/INDEX.md') },
    {
      relativePath: 'docs/_template.md',
      content: interpolate(readAsset('docs/_template.md'), {
        flowEnumJoined: flowEnum.join(' | '),
        layerEnumJoined: layerEnum.join(' | '),
      }),
    },
    ...params.seedDocs,
    // harness-neutral: emitted for claude, codex, and both
    { relativePath: '.agents/memory/dev/MEMORY.md', content: memorySeed('dev') },
    { relativePath: '.agents/memory/docs-writer/MEMORY.md', content: memorySeed('docs-writer') },
    { relativePath: '.agents/memory/planner/MEMORY.md', content: memorySeed('planner') },
    { relativePath: '.agents/memory/advisor/MEMORY.md', content: memorySeed('advisor') },
  ];

  // ── CLAUDE-ONLY — emitted only when harness includes claude ─────────────────
  // Includes: CLAUDE.md, .claude/settings.json, .claude/scripts/agent-guard.mjs
  // (the Claude adapter — the only script that stays in .claude/scripts/),
  // .claude/agents/*.md, .claude/skills/.
  const claudeOnly: FileMap = wantClaude ? [
    { relativePath: 'CLAUDE.md', content: params.claudeMd },
    // Skills under .claude/skills/ — Claude loads them natively from here.
    // (Codex twins live in .agents/skills/ under codexOnly.)
    { relativePath: `.claude/skills/${slug}-conventions/SKILL.md`, content: conventionsSkillContent },
    { relativePath: `.claude/skills/${slug}-docs/SKILL.md`, content: docsSkillContent },
    { relativePath: `.claude/skills/${slug}-memory-retro/SKILL.md`, content: memoryRetroSkillContent },
    { relativePath: '.claude/settings.json', content: readAsset('.claude/settings.json') },
    // Thin adapter — scopes live in scripts/agent-guard-core.mjs, so no tokens.
    { relativePath: '.claude/scripts/agent-guard.mjs', content: readAsset('.claude/scripts/agent-guard.mjs') },
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
      }),
    },
  ] : [];

  // ── CODEX-ONLY — emitted only when harness includes codex ──────────────────
  // Includes: AGENTS.md, .codex/hooks.json, .codex/agents/*.toml,
  // .agents/skills/ twins (real files — no symlinks), and the Codex-specific
  // hook scripts under .codex/scripts/ (hooks.json references them via git rev-parse).
  // No .claude/ directory is created for codex-only projects.
  const codexOnly: FileMap = wantCodex ? [
    { relativePath: 'AGENTS.md', content: interpolate(readAsset('AGENTS.md'), { projectName }) },
    { relativePath: '.codex/hooks.json', content: readAsset('.codex/hooks.json') },
    {
      relativePath: '.codex/agents/dev.toml',
      content: interpolate(readAsset('.codex/agents/dev.toml'), {
        projectName,
        slug,
        productDescription: params.productDescription,
        scopeList: agentDef('dev').writeScope.join(', '),
      }),
    },
    {
      relativePath: '.codex/agents/docs-writer.toml',
      content: interpolate(readAsset('.codex/agents/docs-writer.toml'), { projectName, slug }),
    },
    {
      relativePath: '.codex/agents/planner.toml',
      content: interpolate(readAsset('.codex/agents/planner.toml'), { projectName, productDescription: params.productDescription }),
    },
    {
      relativePath: '.codex/agents/advisor.toml',
      content: interpolate(readAsset('.codex/agents/advisor.toml'), { projectName, slug, productDescription: params.productDescription }),
    },
    {
      relativePath: '.codex/agents/scout.toml',
      content: interpolate(readAsset('.codex/agents/scout.toml'), { projectName, slug, productDescription: params.productDescription }),
    },
    // Skills duplicated as real files (no symlinks — symlinks don't survive npm pack / CI).
    { relativePath: `.agents/skills/${slug}-conventions/SKILL.md`, content: conventionsSkillContent },
    { relativePath: `.agents/skills/${slug}-docs/SKILL.md`, content: docsSkillContent },
    { relativePath: `.agents/skills/${slug}-memory-retro/SKILL.md`, content: memoryRetroSkillContent },
    // Codex hook scripts under .codex/scripts/ — hooks.json references them via git rev-parse.
    { relativePath: '.codex/scripts/agent-guard-codex.mjs', content: readAsset('.codex/scripts/agent-guard-codex.mjs') },
    { relativePath: '.codex/scripts/codex-subagent-start.mjs', content: readAsset('.codex/scripts/codex-subagent-start.mjs') },
    { relativePath: '.codex/scripts/codex-subagent-stop.mjs', content: readAsset('.codex/scripts/codex-subagent-stop.mjs') },
    { relativePath: '.codex/scripts/codex-permission-guard.mjs', content: readAsset('.codex/scripts/codex-permission-guard.mjs') },
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
