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
  model: 'sonnet' | 'haiku' | 'opus';
  /** Path prefixes the agent may write. Empty = read-only. */
  writeScope: string[];
  /** Whether to seed .agents/memory/<name>/MEMORY.md on first run. */
  memory: boolean;
}

export const AGENTS: readonly AgentDef[] = [
  {
    name: 'dev',
    model: 'sonnet',
    writeScope: ['src/', 'package.json', 'tsconfig.json', 'vite.config.ts', 'biome.json', 'eslint.config.js', '.github/'],
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
    model: 'sonnet',
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

// ---------------------------------------------------------------------------
// docs/ knowledge base
// ---------------------------------------------------------------------------

const docsTemplateMdTemplate = (flowEnum: string[], layerEnum: string[]): string =>
  `---
title: <Concise title; mirror the H1 below>
feature: _app        # feature folder name under docs/features/ | _app (cross-cutting)
flow: _meta          # enum: ${flowEnum.join(' | ')}
layer: _cross        # enum: ${layerEnum.join(' | ')}
status: active       # enum: ${STATUS_ENUM.join(' | ')}
lang: en             # enum: ${LANG_ENUM.join(' | ')}
related: []          # array of doc paths relative to docs/
keywords: []         # lowercase kebab-case; prefer real symbol/file names from the repo
updated: YYYY-MM-DD
---

# <Title>

## Context
What problem was being solved and why it was non-obvious.

## Root Cause / Key Finding
The core discovery that unblocked the task.

## Solution / Pattern
What was implemented and why.

## Key Decisions
Trade-offs made and alternatives rejected.

## Related Files
- path/to/relevant/file.ts
`;

const docsReadmeTemplate = (): string =>
  `# Docs — Knowledge Base

Frontmatter-indexed task docs. \`INDEX.md\` is auto-generated — never hand-edit it.

## Where to put new docs

| Doc type | Directory |
|---|---|
| Feature spec / feature-scoped finding | \`docs/features/<feature>/\` |
| Cross-cutting architecture / patterns | \`docs/architecture/\` |
| Onboarding material | \`docs/onboarding/\` |

## File naming

| Case | Name |
|---|---|
| Main spec of a feature | \`<feature>.spec.en.md\` |
| Spec translation alongside | \`<feature>.spec.vi.md\` |
| Topic doc (English) | \`<topic>.en.md\` |
| Translation alongside | \`<topic>.vi.md\` |

## Workflow

1. Copy \`docs/_template.md\`, fill ALL frontmatter fields (the index and lint are built from it).
2. Save to the right directory per the table above.
3. \`node scripts/build-docs-index.mjs\` — regenerates \`INDEX.md\`.
4. \`node scripts/lint-docs-frontmatter.mjs\` — must pass before committing.
5. Commit the doc and \`INDEX.md\` together.
`;

const docsIndexPlaceholderTemplate = (): string =>
  `# Docs Index

> Auto-generated by \`scripts/build-docs-index.mjs\` — do not edit by hand.
> Run \`node scripts/build-docs-index.mjs\` to regenerate.
`;

// ---------------------------------------------------------------------------
// Docs tooling (scripts/ — harness-neutral top-level directory)
// ---------------------------------------------------------------------------

const docsSharedMjsTemplate = (flowEnum: string[], layerEnum: string[]): string =>
  `// Shared helpers for docs tooling — single source of truth for the frontmatter schema.
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

export const DOCS_DIR = 'docs';
export const SKIP_FILES = new Set(['INDEX.md', 'README.md', '_template.md']);

export const ENUMS = {
  flow: ${JSON.stringify(flowEnum)},
  layer: ${JSON.stringify(layerEnum)},
  status: ${JSON.stringify(STATUS_ENUM)},
  lang: ${JSON.stringify(LANG_ENUM)},
};

export const REQUIRED_FIELDS = ['title', 'feature', 'flow', 'layer', 'status', 'lang', 'keywords', 'updated'];

// Minimal YAML frontmatter parser: scalar values and inline arrays ([a, b]).
export function parseFrontmatter(content) {
  const match = content.match(/^---\\n([\\s\\S]*?)\\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).replace(/\\s+#.*$/, '').trim();
    if (!key) continue;
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      meta[key] = inner === ''
        ? []
        : inner.split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return meta;
}

export function firstHeading(content) {
  const match = content.match(/^#\\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// Walks docs/**/*.md (excluding SKIP_FILES) and returns parsed records.
export function walkDocs(dir = DOCS_DIR, records = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      walkDocs(fullPath, records);
    } else if (item.name.endsWith('.md') && !SKIP_FILES.has(item.name)) {
      const content = readFileSync(fullPath, 'utf-8');
      records.push({
        path: relative(DOCS_DIR, fullPath),
        fm: parseFrontmatter(content),
        title: firstHeading(content),
      });
    }
  }
  return records;
}
`;

const buildDocsIndexMjsTemplate = (): string =>
  `// Regenerates docs/INDEX.md from frontmatter. Deterministic (sorted) so diffs stay clean.
// Run via: node scripts/build-docs-index.mjs
import { writeFileSync } from 'fs';
import { join } from 'path';
import { walkDocs, DOCS_DIR } from './_docs-shared.mjs';

const records = walkDocs().sort((a, b) => a.path.localeCompare(b.path));
const withFm = records.filter((record) => record.fm !== null).length;
const today = new Date().toISOString().slice(0, 10);

function entryLine(record) {
  const fm = record.fm ?? {};
  const title = fm.title ?? record.title ?? record.path;
  const tags = ['feature', 'flow', 'layer']
    .map((key) => '\`' + key + ':' + (fm[key] ?? '_unknown') + '\`')
    .join(' ');
  const keywords = Array.isArray(fm.keywords) && fm.keywords.length > 0
    ? ' — ' + fm.keywords.join(', ')
    : '';
  return '- [' + title + '](' + record.path + ') — ' + tags + keywords;
}

function section(heading, key) {
  const groups = new Map();
  for (const record of records) {
    const groupKey = record.fm?.[key] ?? '_unknown';
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(record);
  }
  const lines = ['## ' + heading, ''];
  for (const [name, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push('### ' + name + ' (' + group.length + ')');
    lines.push(...group.map(entryLine));
    lines.push('');
  }
  return lines;
}

function keywordIndex() {
  const map = new Map();
  for (const record of records) {
    for (const keyword of record.fm?.keywords ?? []) {
      if (!map.has(keyword)) map.set(keyword, []);
      map.get(keyword).push(record.path);
    }
  }
  if (map.size === 0) return [];
  return [
    '## Keyword Index',
    ...[...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([keyword, paths]) =>
        '- \`' + keyword + '\` → ' + paths.map((path) => '[' + path + '](' + path + ')').join(', ')
      ),
    '',
  ];
}

const lines = [
  '# Docs Index',
  '',
  '> Auto-generated by \`scripts/build-docs-index.mjs\` — do not edit by hand.',
  '> Generated: ' + today + ' from ' + records.length + ' files (' + withFm + ' with frontmatter, ' + (records.length - withFm) + ' without).',
  '',
];

if (records.length === 0) {
  lines.push('_(No docs yet. Copy docs/_template.md to get started.)_', '');
} else {
  lines.push(...section('By Feature', 'feature'));
  lines.push(...section('By Flow', 'flow'));
  lines.push(...section('By Layer', 'layer'));
  lines.push(...keywordIndex());
}

writeFileSync(join(DOCS_DIR, 'INDEX.md'), lines.join('\\n').replace(/\\n+$/, '\\n'));
console.log('docs/INDEX.md updated — ' + records.length + ' doc(s), ' + withFm + ' with frontmatter.');
`;

const lintDocsFrontmatterMjsTemplate = (): string =>
  `// Validates every doc against the frontmatter schema. Exits non-zero on violation → CI-ready.
// Run via: node scripts/lint-docs-frontmatter.mjs
import { existsSync } from 'fs';
import { join } from 'path';
import { walkDocs, ENUMS, REQUIRED_FIELDS, DOCS_DIR } from './_docs-shared.mjs';

const errors = [];

for (const record of walkDocs()) {
  const where = 'docs/' + record.path;
  if (record.fm === null) {
    errors.push(where + ': missing frontmatter block');
    continue;
  }
  for (const field of REQUIRED_FIELDS) {
    if (record.fm[field] === undefined || record.fm[field] === '') {
      errors.push(where + ': missing required field "' + field + '"');
    }
  }
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const value = record.fm[field];
    if (value !== undefined && !allowed.includes(value)) {
      errors.push(where + ': invalid ' + field + ' "' + value + '" (allowed: ' + allowed.join(', ') + ')');
    }
  }
  if (record.fm.updated !== undefined && !/^\\d{4}-\\d{2}-\\d{2}$/.test(record.fm.updated)) {
    errors.push(where + ': "updated" must be YYYY-MM-DD (got "' + record.fm.updated + '")');
  }
  if (Array.isArray(record.fm.keywords)) {
    for (const keyword of record.fm.keywords) {
      if (keyword !== keyword.toLowerCase()) {
        errors.push(where + ': keyword "' + keyword + '" must be lowercase');
      }
    }
  }
  for (const related of record.fm.related ?? []) {
    if (!existsSync(join(DOCS_DIR, related))) {
      errors.push(where + ': related path "' + related + '" does not exist under docs/');
    }
  }
}

if (errors.length > 0) {
  console.error('docs:lint failed with ' + errors.length + ' error(s):');
  for (const error of errors) console.error('  - ' + error);
  process.exit(1);
}
console.log('docs:lint passed.');
`;

const docsFirstReminderShTemplate = (trigger: string): string =>
  `#!/usr/bin/env bash
# UserPromptSubmit hook: inject a docs-first reminder when the prompt mentions
# a documented feature/flow/domain topic. Silent otherwise to avoid noise.
# The harness runs this on every user prompt, so the reminder cannot be skipped.
payload="$(cat)"

# Keep in sync with feature folders under docs/features/ + key domain nouns.
# Add an alternation entry whenever a new feature doc is created.
trigger='${trigger}'

if echo "$payload" | grep -iqE "$trigger"; then
  cat <<'EOF'
[docs-first guard] This request appears to touch a documented feature/flow.
BEFORE opening source code:
  1. Read docs/INDEX.md (grouped by feature / flow / layer + keyword index).
  2. Narrow with frontmatter grep, e.g.:
       grep -rlE '^feature: <feature>' docs/ | xargs grep -lE '^flow: <flow>'
  3. Read candidate doc bodies (<=5 files), then follow \`related:\` links.
  4. Open source only if docs are insufficient — and state what the docs covered.
EOF
fi
exit 0
`;

// TEST_WRITER_DEF is kept out of AGENTS (it is optional, not always emitted).
// Phase 03: agentGuardMjsTemplate consumes it when params.testing is set.
const TEST_WRITER_DEF: AgentDef = {
  name: 'test-writer',
  model: 'haiku',
  writeScope: ['src/', 'test/', 'tests/', 'e2e/', 'playwright/'],
  memory: true,
};

const agentGuardMjsTemplate = (agents: AgentDef[]): string => {
  // Bake WRITE_SCOPES map: agent name → allowed path prefixes.
  // Empty array = read-only agent (deny all writes with a dedicated message).
  const scopesObj: Record<string, string[]> = {};
  for (const agent of agents) {
    scopesObj[agent.name] = agent.writeScope;
  }
  const scopesJson = JSON.stringify(scopesObj, null, 2);

  return `// PreToolUse guard — registry-driven path enforcement.
// Generated from the AGENTS registry; do not edit by hand.
// Each agent may only write to its declared writeScope prefixes plus its own
// .agents/memory/<name>/ directory (implicit, added at runtime below).
// Agents NOT in WRITE_SCOPES (unknown agents, main thread) pass through.
// NOTE: writeScope is a heuristic backstop, not a precise ACL. Projects that
// place test files under src/__tests__ instead of test/ or tests/ will need to
// extend the test-writer scope — this guard is lenient for dev rather than tight.
import { readFileSync } from 'fs';

const WRITE_SCOPES = ${scopesJson};

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const agentType = payload.agent_type;
// Unknown agent or main thread — pass through.
if (!agentType || !(agentType in WRITE_SCOPES)) process.exit(0);

const filePath = payload.tool_input?.file_path;
if (!filePath) process.exit(0);

// Normalize to a project-relative path when an absolute path is given.
const cwd = payload.cwd ?? '';
let rel = filePath;
if (filePath.startsWith('/') && cwd && filePath.startsWith(cwd + '/')) {
  rel = filePath.slice(cwd.length + 1);
}

const allowedPrefixes = WRITE_SCOPES[agentType];
const memoryPrefix = \`.agents/memory/\${agentType}/\`;

// Always allow an agent to write its own memory dir (even read-only agents).
if (rel.startsWith(memoryPrefix)) process.exit(0);

// Read-only agents (empty writeScope): deny all other writes with a specific message.
if (allowedPrefixes.length === 0) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: \`read-only agent may not write any file. \${agentType} attempted to write \${filePath}. Route implementation to the dev agent instead.\`,
      },
    })
  );
  process.exit(0);
}

// Allow if path is within the agent's declared scope.
const allowed = allowedPrefixes.some((prefix) => rel.startsWith(prefix));

if (allowed) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: \`\${agentType} may only write under [\${allowedPrefixes.join(', ')}] (and \${memoryPrefix}). Blocked write to \${filePath}. Route to the correct agent instead.\`,
    },
  })
);
process.exit(0);
`;
};

// ---------------------------------------------------------------------------
// .claude/settings.json
// ---------------------------------------------------------------------------

const claudeSettingsTemplate = (): string =>
  JSON.stringify(
    {
      permissions: {
        deny: [
          'Bash(git push*)',
          'Bash(git commit*)',
          'Bash(git merge*)',
          'Bash(git rebase*)',
          'Bash(git tag*)',
          'Bash(git branch -D*)',
          'Bash(git branch -d*)',
          'Bash(git reset --hard*)',
          'Bash(git clean*)',
        ],
        allow: [],
      },
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command',
                command: 'bash "$CLAUDE_PROJECT_DIR/scripts/docs-first-reminder.sh"',
              },
            ],
          },
        ],
        PreToolUse: [
          {
            matcher: 'Write|Edit|MultiEdit',
            hooks: [
              {
                type: 'command',
                command: 'node "$CLAUDE_PROJECT_DIR/.claude/scripts/agent-guard.mjs"',
              },
            ],
          },
        ],
      },
      sandbox: {
        filesystem: { denyRead: ['**/.env', '**/.env.*'] },
      },
    },
    null,
    2
  );

// ---------------------------------------------------------------------------
// Docs skill + docs-writer agent + memory seeds
// ---------------------------------------------------------------------------

const docsSkillTemplate = (
  projectName: string,
  slug: string,
  flowEnum: string[],
  layerEnum: string[]
): string =>
  `---
name: ${slug}-docs
description: How to find and write knowledge-base docs for ${projectName}. Use when asked "is there a doc about…", "explain the X feature/flow", "document this", "write a spec", or the Vietnamese equivalents ("có tài liệu về…", "giải thích flow…", "viết docs/spec…"). Also use before modifying any documented feature.
---

# ${projectName} Docs Guide

## Finding docs (DOCS-FIRST)

1. Start at \`docs/INDEX.md\` — grouped By Feature / By Flow / By Layer, plus a keyword reverse-index.
2. Narrow with frontmatter grep (never semantic-search bodies):
   \`\`\`bash
   grep -rlE '^feature: home' docs/
   grep -rlE '^feature: home' docs/ | xargs grep -lE '^flow: ui'
   \`\`\`
3. Read candidate doc bodies (≤5 files), then follow their \`related:\` links.
4. Only open source when docs are insufficient — and state what the docs already covered.

## Writing docs

1. Copy \`docs/_template.md\`; every field is required (see \`docs/README.md\` for placement + naming).
2. Frontmatter axes: \`feature\` (folder under docs/features/ or \`_app\`), \`flow\` (${flowEnum.join('/')}), \`layer\` (${layerEnum.join('/')}).
3. Keywords: lowercase, prefer real symbol/file names an engineer would grep for.
4. Rebuild + validate, then commit doc and INDEX.md together:
   \`\`\`bash
   node scripts/build-docs-index.mjs && node scripts/lint-docs-frontmatter.mjs
   \`\`\`
`;

const docsWriterAgentTemplate = (projectName: string, slug: string, agent: AgentDef): string =>
  `---
name: docs-writer
description: "Documentation agent for ${projectName} — analyzes requirements from any source (conversation, tickets, Slack) and maintains docs/. <example>user: 'Here are the requirements for the profile page, write them up' → docs-writer <commentary>synthesizing requirements into a feature spec</commentary></example> <example>user: 'We just finished the auth refactor, document what changed' → docs-writer <commentary>post-task knowledge capture</commentary></example> <example>user: 'Update the home spec — the hero section was redesigned' → docs-writer <commentary>doc maintenance</commentary></example>"
model: ${agent.model}${agentMemoryFrontmatter(agent)}
tools: ${agentTools(agent)}
---

You are the documentation agent for ${projectName}. You own \`docs/\`.

## Onboarding protocol

1. Read \`.agents/memory/docs-writer/MEMORY.md\`.
2. Read \`docs/README.md\` (placement + naming rules) and \`docs/INDEX.md\` (what already exists).
3. Load the \`${slug}-docs\` skill.

## Workflow

1. Understand the requirement; if sources conflict, surface the conflict instead of guessing.
2. Check INDEX.md for an existing doc to update before creating a new one.
3. Copy \`docs/_template.md\`; fill ALL frontmatter fields (feature, flow, layer, status, lang, keywords, updated). Specs describe WHAT, not HOW.
4. Save per docs/README.md rules: \`docs/features/<feature>/<feature>.spec.en.md\` for feature specs, \`<topic>.en.md\` for findings, \`docs/architecture/\` for cross-cutting topics.
5. Run \`node scripts/build-docs-index.mjs\` then \`node scripts/lint-docs-frontmatter.mjs\` — both must succeed.
6. If the feature introduces new domain nouns, add them to the \`trigger\` list in \`scripts/docs-first-reminder.sh\`.
7. Report created/updated paths. Append lessons to \`.agents/memory/docs-writer/MEMORY.md\`.

## Hard rules

- Never hand-edit \`docs/INDEX.md\`.
- Never edit application code — you write markdown and run the docs scripts only.
- Never commit or push.
`;

const plannerAgentTemplate = (projectName: string, agent: AgentDef): string =>
  `---
name: planner
description: "Planning agent for ${projectName} — analyzes a request/story and produces a professional, detailed, resumable implementation plan under plans/. Splits work into phase files so a failure in one phase never breaks the whole flow; execution can resume from the unfinished phase. <example>user: 'Break this story into a step-by-step plan we can resume' → planner <commentary>resumable multi-phase plan</commentary></example> <example>user: 'Plan the rollout for the new feature' → planner <commentary>decompose a large feature into ordered, verifiable phases</commentary></example> <example>user: 'Fix this small bug' → dev, NOT planner <commentary>small, single-pass change — code directly</commentary></example> <example>user: 'Write a spec for X' → docs-writer, NOT planner <commentary>specs describe WHAT; plans describe HOW/when</commentary></example>"
model: ${agent.model}${agentMemoryFrontmatter(agent)}
tools: ${agentTools(agent)}
---

You are the planning agent for ${projectName}. You own \`plans/\`. You produce the plan; the \`dev\` agent executes it.

## Onboarding protocol (in order, before writing any plan)

1. Read \`.agents/memory/planner/MEMORY.md\` — accumulated planning gotchas.
2. Read \`plans/README.md\` — folder layout, file naming, and frontmatter contract.
3. Read \`docs/INDEX.md\` and the relevant \`docs/features/<feature>/\` spec(s) — the spec is your source of truth for WHAT. If no relevant spec exists, STOP and tell the user to run the docs-writer agent first.
4. Skim the code under change only enough to anchor the plan in real file paths.

## Workflow

1. Restate the request and surface ambiguity. If interpretations conflict, ask — do not guess.
2. Decompose the work into the **minimum** set of ordered phases. Each phase is independently completable and leaves the repo in a working state. Do not invent speculative phases.
3. Write \`plans/<slug>/00-overview.md\` (goal, scope, non-goals, and the **Ordered phases** tracker table — see below) and one \`plans/<slug>/NN-<phase>.md\` per phase.
4. Every phase file MUST be resumable on its own — see Phase file contract. Reference real source paths and the relevant \`docs/\` spec.
5. Report the created plan paths and the recommended starting phase. Append durable planning lessons to \`.agents/memory/planner/MEMORY.md\`.

## Phase file contract (this is what makes plans resumable)

Each \`NN-<phase>.md\` begins with frontmatter:

\`\`\`
---
phase: NN
title: <short title>
status: pending        # pending | in-progress | done | blocked
depends_on: [<NN>, ...]
---
\`\`\`

Body, in this order:
- **Goal** — one sentence; what "done" means.
- **Steps** — a \`- [ ]\` checklist; each item is a concrete, single action tied to a real path.
- **Verify** — explicit, runnable success criteria. A phase is only \`done\` when these pass.
- **Notes / risks** — gotchas, rollback hints.

The executor resumes by finding the first phase whose \`status\` is not \`done\` and continuing at its first unchecked step.

## Progress tracker (00-overview.md is the single index)

\`00-overview.md\` is the only tracker — never add a separate \`index.md\` per folder. End it with an **Ordered phases** table that doubles as the resume-from view:

\`\`\`
| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | <phase> | pending | 0/<n> | <ISO date> |
\`\`\`

- **Status** mirrors each phase file's frontmatter \`status\`; **Steps** is \`<checked>/<total>\` of that phase's \`- [ ]\` checklist; **Updated** is the ISO date the row last changed.
- This table is the one place that aggregates across phases. Keep it in sync whenever a phase's status, step count, or block state changes; a \`blocked\` row carries its \`backlog/<id>\` link inline.

## Backlog integration

- A phase that the executor parks gets \`status: blocked\` and a link to a \`backlog/<id>\` entry (see \`backlog/README.md\`). Treat blocked phases as paused, not failed — they don't invalidate completed work.
- When a backlog item is revived, read it for context and fold its **Suggested direction** into new or amended phases here. Backlog holds context; \`plans/\` holds the executable plan.

## Hard rules

- Write ONLY under \`plans/\` (and your own \`.agents/memory/planner/\`). Never edit source code, never write code, never run/modify the build. Your toolset has no Bash, and a PreToolUse hook hard-blocks any write outside \`plans/\` — if you feel the urge to implement, produce the plan and hand off to \`dev\` instead.
- Never write feature specs — that is docs-writer's job (specs = WHAT, plans = HOW/when). Flag when a spec is missing instead of writing one.
- Plans are consumable artifacts: keep them concrete and current, not aspirational prose.
- Never edit \`docs/INDEX.md\` or any docs/ file.
- Never commit or push — a human does that.
- Non-blocking follow-up work (spec gaps, deferred tasks, adjacent improvements) must be filed as a \`backlog/<NNNN>-<slug>.md\` entry (see \`backlog/README.md\`). Do NOT leave follow-up work as prose in a plan's overview or phase files — prose in done plans is archived and lost.
`;

const advisorAgentTemplate = (projectName: string, slug: string, agent: AgentDef): string =>
  `---
name: advisor
description: "Read-only brainstorming & advisory agent for ${projectName} — the engineer who understands the source logic most deeply. Reads the code, reasons about trade-offs, and returns the best, most optimal recommendation; never edits anything. <example>user: 'Should this be one flat interface or split apart? Talk me through it' → advisor <commentary>design brainstorm / trade-off analysis, no code change</commentary></example> <example>user: 'What is the cleanest way to add this option without bloating things?' → advisor <commentary>wants the optimal approach before any implementation</commentary></example> <example>user: 'Add the option' → dev, NOT advisor <commentary>actual implementation belongs to dev</commentary></example> <example>user: 'Break this into a resumable plan' → planner, NOT advisor <commentary>plan artifacts belong to planner</commentary></example>"
model: ${agent.model}${agentMemoryFrontmatter(agent)}
tools: ${agentTools(agent)}
---

You are the advisor for ${projectName}. You are the engineer who holds the **deepest, most accurate mental model of the source** and the trade-offs baked into it. Your job is to read, reason, and recommend — to brainstorm with the user and hand them the single best path forward. You do not write code, docs, or plans; \`dev\`, \`docs-writer\`, and \`planner\` do that after you've clarified the thinking.

## Onboarding protocol (in order, before advising)

1. Read \`.agents/memory/advisor/MEMORY.md\` — accumulated architectural insights and recurring trade-offs.
2. Read \`docs/INDEX.md\` and the relevant \`docs/features/<feature>/\` spec(s) for the area in question — the spec is the source of truth for WHAT.
3. Load the \`${slug}-conventions\` skill for the project's patterns and rules.
4. Read the actual source under discussion. Never advise from memory or assumption when the file is one Read away — ground every claim in a real path/line.

## Workflow

1. Restate the question and the real goal behind it. If interpretations conflict, surface them — don't silently pick one.
2. Read enough source to be certain. Trace the real data flow rather than guessing at it.
3. Brainstorm: lay out the viable options with their concrete trade-offs (simplicity, coupling, correctness, maintenance cost).
4. **Give a recommendation, not a survey.** Name the single best option, say why it wins, and cite the files/lines that justify it. Note the cheapest next step and which agent owns it (\`dev\` / \`planner\` / \`docs-writer\`).
5. Append durable architectural insights to \`.agents/memory/advisor/MEMORY.md\`.

## What "best advice" means here

- Favor the **minimum** change that solves the problem. Call out over-engineering explicitly.
- Optimal ≠ clever. Prefer the option a senior engineer would call obvious over the one that's impressive.
- When the user's instinct is wrong, say so plainly and explain the cost — pushing back is the job, not friction.

## Hard rules

- **Read-only. Never edit, create, or delete any file** — not source, not \`docs/\`, not \`plans/\`, not \`backlog/\`. The only file you ever write is your own \`.agents/memory/advisor/MEMORY.md\` (insights). If a change is warranted, recommend it and route it to the owning agent.
- Never run the build, never commit, never push.
- Ground claims in real paths/lines; if you haven't read it, say so instead of asserting.
- Hand off, don't implement: end with a clear, actionable recommendation and who should execute it.
`;

const scoutAgentTemplate = (projectName: string, slug: string, agent: AgentDef): string =>
  `---
name: scout
description: "Fast, cheap read-only Q&A & lookup agent for ${projectName} — reads, synthesizes, and answers in a few sentences with path:line citations. Use for factual questions about the codebase/docs, not design reasoning (→ advisor) or implementation (→ dev). <example>user: 'What version does this project pin for X?' → scout <commentary>factual lookup, answer + cite the source</commentary></example> <example>user: 'Is there a spec for feature X yet?' → scout <commentary>doc existence check via docs/INDEX.md</commentary></example> <example>user: 'Should this be split apart? Talk me through the trade-offs' → advisor, NOT scout <commentary>design reasoning belongs to advisor</commentary></example> <example>user: 'Add the option' → dev, NOT scout <commentary>implementation belongs to dev</commentary></example>"
model: ${agent.model}
tools: ${agentTools(agent)}
---

You are scout for ${projectName}. You answer factual questions about the codebase and docs **quickly and cheaply** — read what you need, synthesize, and reply in a few sentences. You do not reason about design trade-offs (that is \`advisor\`), and you never edit anything (that is \`dev\` / \`docs-writer\` / \`planner\`).

## Lookup protocol (DOCS-FIRST)

1. If the question touches a documented feature, start at \`docs/INDEX.md\` and read the relevant \`docs/features/<feature>/\` spec before opening source. Load the \`${slug}-docs\` skill when you need to locate a doc.
2. Otherwise grep/glob to the right file fast. Trace the real data flow rather than guessing.
3. Read only the lines you need to be certain — excerpts, not whole files. Stop as soon as you can answer.

## Answer style

- **Lead with the answer**, then a one-line why/where. Keep it to a few sentences.
- **Always cite** the real \`path:line\` you got it from. If you didn't read it, say so — never assert from memory.
- If the question is ambiguous, ask one short clarifying question instead of guessing.

## Hard rules

- **Read-only.** Never create, edit, or delete any file. No Bash, no build, no commit.
- **Stay in your lane — hand off, don't expand scope:**
  - Design / trade-off / "what's the best approach?" → recommend \`advisor\`.
  - Implementation, bug fix, new option → recommend \`dev\`.
  - Writing or updating docs → recommend \`docs-writer\`; multi-phase plan → \`planner\`.
- If answering would require running code or reasoning through a non-trivial design decision, stop and route it rather than overreaching.
`;

const plansReadmeTemplate = (): string =>
  `# plans/

Resumable, phase-by-phase implementation plans authored by the \`planner\` agent and executed by the \`dev\` agent.

A plan is a **consumable** artifact (short-lived, kept in sync with reality), distinct from \`docs/\` which holds long-lived feature specs (WHAT). Plans describe **HOW and in what order** work gets done.

## Layout

\`\`\`
plans/
  <slug>/
    00-overview.md      goal, scope, non-goals, + the progress tracker (see below)
    01-<phase>.md       one file per phase
    02-<phase>.md
    ...
\`\`\`

- \`<slug>\` is kebab-case, derived from the feature/story.
- Phases are numbered \`NN-\` so they sort in execution order.

\`00-overview.md\` is the single tracker for the plan — there is **no separate \`index.md\`**. Its **Ordered phases** table is the at-a-glance "where are we" view; each phase file's \`status\` frontmatter is the per-phase source of truth. The table aggregates across phases, so keep it in sync whenever a phase's status or step count changes.

## Progress tracker (the Ordered phases table)

\`00-overview.md\` ends with this table — it is what an executor reads first to know where to resume:

\`\`\`
| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | <phase> | done | 5/5 | 2026-01-01 |
| 02 | <phase> | in-progress | 2/6 | 2026-01-01 |
\`\`\`

- **Status** — mirrors the phase file's frontmatter \`status\` (\`pending | in-progress | done | blocked\`).
- **Steps** — \`<checked>/<total>\` of the phase's \`- [ ]\` checklist; the quick "how far in" signal.
- **Updated** — ISO date the row last changed.

A \`blocked\` row should also carry the \`backlog/<id>\` link inline (e.g. \`blocked → backlog/0003\`).

## Phase file frontmatter

\`\`\`
---
phase: NN
title: <short title>
status: pending        # pending | in-progress | done | blocked
depends_on: [<NN>, ...]
---
\`\`\`

Body sections, in order: **Goal**, **Steps** (\`- [ ]\` checklist), **Verify** (runnable success criteria), **Notes / risks**.

## Resuming a plan

1. Open \`00-overview.md\` and read the **Ordered phases** table for overall progress.
2. Find the first phase whose \`status\` is not \`done\`; its **Steps** cell shows how far in it is.
3. Continue at its first unchecked \`- [ ]\` step in the phase file.
4. After each step, update the phase's **Steps** count and **Updated** date in the table. When a phase's \`Verify\` passes, set its frontmatter \`status: done\` and flip the table row to \`done\`.

A failure in one phase never invalidates completed phases — fix and resume from the unfinished phase.

## Blocked phases → backlog

If a phase can't proceed and the cause isn't fixable right now (missing info, needs a user decision, environment/out-of-scope), don't loop. Apply the **park rule** in \`backlog/README.md\`: set the phase \`status: blocked\`, file a \`backlog/<id>\` entry, link both ways (\`[[backlog/<id>]]\` from the phase; the entry's \`source:\` points back to the phase file), then move on to the next workable phase.

## Plan lifecycle and archival

When all phases are \`done\`, the plan becomes a completed artifact — it can either:
- **Remain in \`plans/\`** as historical record (git preserves it; useful for auditing how the work was actually decomposed).
- **Be archived** to \`plans/.archive/<slug>/\` (keep it searchable but out of the active directory).
- **Be deleted** if context is not valuable (rare; prefer archival so git history is preserved).

Choose based on project norms. The key: **plans are owned by whoever executed them** (usually \`dev\`) and the decision to archive/delete is theirs. Do not leave a stale plan in \`plans/\` — either keep it active (if next phases are coming) or archive it. The \`00-overview.md\` progress table is the arbiter: if all rows are \`done\` and no new work is queued, the plan is complete.
`;

const backlogReadmeTemplate = (): string =>
  `# backlog/

Unfinished work: blockers that can't be solved right now, technical debt, or anything **deliberately deferred** so it doesn't derail the current flow.

How it differs from \`docs/\` and \`plans/\`:

| | \`docs/\` | \`plans/\` | \`backlog/\` |
|---|---|---|---|
| Nature | WHAT — long-lived spec | HOW/when — phases to run | deferred work / blockers / tech debt |
| Lifecycle | long-lived | consumable, deleted when done | append-only log, lives until \`resolved\` |
| Author | docs-writer | planner | any agent that hits a blocker (usually \`dev\`) |

A backlog item is **not** a plan. When an item is revived, \`planner\` reads it and produces new phases under \`plans/\` — backlog holds context, not the executable plan.

## Park rule (this is what stops the token-wasting loop)

Applies while executing a step/phase and hitting a problem:

> If a step **fails twice** and the cause is **not fixable right now** — missing info, needs a user decision, environment error, or out of scope — then **STOP, do not retry a third time**:
> 1. Set the owning phase \`status: blocked\` (see \`plans/README.md\`).
> 2. File a new entry in \`backlog/\` (template below); its **Tried** section must list what already failed so it isn't repeated.
> 3. Link both ways: the phase file points to \`backlog/<id>\`, the entry points back to the phase.
> 4. Move on to the next workable phase/task. Tell the user it was parked — don't silently skip it.

If the error is fixable on the spot, just fix it — this rule is only for real blockers.

## Layout

One item = one file: \`backlog/<NNN>-<slug>.md\` (\`NNN\` ascending so items sort and are easy to reference, e.g. "backlog/004").

## Frontmatter

\`\`\`
---
id: NNN
title: <short title>
status: open          # open | resolved | wontfix
source: plans/<slug>/NN-<phase>.md   # or "conversation", or the originating file path
severity: low         # low | medium | high
created: YYYY-MM-DD
---
\`\`\`

Body, in order:

- **Symptom** — what happened and where (real file paths).
- **Tried** — what was run/changed and how it failed. The most important section: prevents repeating failed attempts.
- **Why parked** — why it can't be solved now (missing info / needs user / environment / out of scope).
- **Suggested direction** — the next step if any, or the question the user needs to answer.

Link to other phases/specs/items with \`[[path]]\`.

## Lifecycle

- When solved: set \`status: resolved\` and add a one-line conclusion at the end of the body — **don't delete the file** (keep the history). To drop it entirely, set \`status: wontfix\` with a reason.
- When revived: hand the context to \`planner\` to create new phases under \`plans/\`; the entry stays \`open\` until the work is actually done.
`;

const agentMemorySeedTemplate = (agentName: string): string =>
  `# ${agentName} — Agent Memory

Append durable, non-obvious gotchas and patterns discovered while working — one bullet each, newest first. Link related docs/ files. Read this file at the start of every session.

_(no entries yet)_
`;

// ---------------------------------------------------------------------------
// Validator (scripts/validate-structure.mjs)
// ---------------------------------------------------------------------------

const validateStructureMjsTemplate = (agents: AgentDef[]): string => {
  // Bake WRITE_SCOPES map at generation time (same shape as agent-guard.mjs).
  const scopesObj: Record<string, string[]> = {};
  for (const agent of agents) {
    scopesObj[agent.name] = agent.writeScope;
  }
  const scopesJson = JSON.stringify(scopesObj, null, 2);

  return `// Mechanically checks derived invariants between the AGENTS registry, emitted
// agent .md files, and the guard. Generated from the AGENTS registry at scaffold
// time — do not edit by hand.
// Run via: node scripts/validate-structure.mjs
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Baked at scaffold time from the AGENTS registry.
const WRITE_SCOPES = ${scopesJson};

// Minimal frontmatter parser (no external deps — inlined from _docs-shared.mjs pattern).
function parseFrontmatter(content) {
  const match = content.match(/^---\\n([\\s\\S]*?)\\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    // Strip inline comments.
    value = value.replace(/\\s+#.*$/, '').trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      meta[key] = inner === ''
        ? []
        : inner.split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return meta;
}

const AGENTS_DIR = '.claude/agents';
const errors = [];

// 1. Read and parse all agent .md files.
let agentFiles;
try {
  agentFiles = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
} catch {
  console.error('validate-structure: cannot read ' + AGENTS_DIR);
  process.exit(1);
}

const parsed = [];
for (const file of agentFiles) {
  const fullPath = join(AGENTS_DIR, file);
  const content = readFileSync(fullPath, 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push(file + ': missing frontmatter block');
    continue;
  }
  const name = fm.name ?? file.replace(/\\.md$/, '');
  const toolsRaw = fm.tools ?? '';
  parsed.push({ file, name, toolsRaw });
}

// 2. Check read-only constraint: if writeScope is empty, tools must not include Write or Edit.
for (const { file, name, toolsRaw } of parsed) {
  if (!(name in WRITE_SCOPES)) continue; // unknown agent — skip
  const scope = WRITE_SCOPES[name];
  if (scope.length > 0) continue; // write-capable agent — constraint does not apply
  // Read-only agent: assert no Write/Edit in tools list.
  const tools = toolsRaw.split(',').map((t) => t.trim());
  for (const tool of tools) {
    if (tool === 'Write' || tool === 'Edit') {
      errors.push(
        file + ': read-only agent "' + name + '" must not have "' + tool +
        '" in its tools: list (writeScope is empty)'
      );
    }
  }
}

// 3. Check uniqueness of primary owned directories (first element of writeScope).
const primaryDirOwners = {};
for (const [agentName, scope] of Object.entries(WRITE_SCOPES)) {
  if (scope.length === 0) continue; // read-only agents have no primary dir
  const primaryDir = scope[0];
  if (primaryDirOwners[primaryDir]) {
    errors.push(
      'agents "' + primaryDirOwners[primaryDir] + '" and "' + agentName +
      '" share the same primary owned directory "' + primaryDir + '"'
    );
  } else {
    primaryDirOwners[primaryDir] = agentName;
  }
}

if (errors.length > 0) {
  console.error('validate-structure: failed with ' + errors.length + ' error(s):');
  for (const error of errors) console.error('  - ' + error);
  process.exit(1);
}
console.log('validate-structure: passed.');
`;
};

// ---------------------------------------------------------------------------
// Plan/backlog consistency checker (scripts/validate-plans.mjs)
// ---------------------------------------------------------------------------

const validatePlansMjsTemplate = (): string =>
  `// Mechanically checks plan/backlog consistency across four invariants.
// Run via: node scripts/validate-plans.mjs
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PLANS_DIR = 'plans';
const BACKLOG_DIR = 'backlog';

// Minimal frontmatter parser — same pattern as validate-structure.mjs (no external deps).
function parseFrontmatter(content) {
  const match = content.match(/^---\\n([\\s\\S]*?)\\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    value = value.replace(/\\s+#.*$/, '').trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      meta[key] = inner === ''
        ? []
        : inner.split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return meta;
}

// Parse the "Ordered phases" Markdown table from an overview file body.
// Returns array of { num, slug, status } where num is zero-padded (e.g. "01").
// Only parses rows from the section headed "## Ordered phases" (case-insensitive).
function parseOrderedPhasesTable(content) {
  const rows = [];
  // Find the "Ordered phases" section and extract only that table.
  const sectionMatch = content.match(/##\\s+Ordered phases\\b[\\s\\S]*?(?=\\n##\\s|\\n---\\n|$)/i);
  if (!sectionMatch) return rows;
  const section = sectionMatch[0];
  for (const line of section.split('\\n')) {
    // Match data rows: | 01 | slug | status | ... |
    if (!/^\\|\\s*\\d+\\s*\\|/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const num = cells[0].padStart(2, '0');
    const slug = cells[1];
    const status = cells[2].toLowerCase();
    rows.push({ num, slug, status });
  }
  return rows;
}

// Collect active plan dirs (skip .archive and README.md).
function getActivePlanDirs() {
  let entries;
  try {
    entries = readdirSync(PLANS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && e.name !== '.archive' && !e.name.startsWith('.'))
    .map((e) => e.name);
}

// Collect all plan dirs including .archive.
function getAllPlanDirs() {
  let entries;
  try {
    const archiveEntries = readdirSync(join(PLANS_DIR, '.archive'), { withFileTypes: true });
    const activeEntries = readdirSync(PLANS_DIR, { withFileTypes: true });
    return [
      ...activeEntries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => ({ name: e.name, archived: false })),
      ...archiveEntries.filter((e) => e.isDirectory()).map((e) => ({ name: e.name, archived: true })),
    ];
  } catch {
    return getActivePlanDirs().map((name) => ({ name, archived: false }));
  }
}

const errors = [];
const warnings = [];

// ── Check A — Phase table ↔ frontmatter status consistency ──────────────────
for (const planDir of getActivePlanDirs()) {
  const overviewPath = join(PLANS_DIR, planDir, '00-overview.md');
  if (!existsSync(overviewPath)) continue;
  const overviewContent = readFileSync(overviewPath, 'utf-8');
  const rows = parseOrderedPhasesTable(overviewContent);
  for (const { num, slug, status: tableStatus } of rows) {
    const phaseFile = join(PLANS_DIR, planDir, \`\${num}-\${slug}.md\`);
    if (!existsSync(phaseFile)) {
      warnings.push(\`WARN  \${phaseFile}: phase file not found (table row \${num} references it)\`);
      continue;
    }
    const phaseContent = readFileSync(phaseFile, 'utf-8');
    const fm = parseFrontmatter(phaseContent);
    if (!fm) {
      warnings.push(\`WARN  \${phaseFile}: missing frontmatter — cannot compare with table status\`);
      continue;
    }
    const fmStatus = (fm.status ?? '').toLowerCase();
    if (fmStatus !== tableStatus) {
      warnings.push(
        \`WARN  \${phaseFile}: phase frontmatter status "\${fmStatus}" but table row says "\${tableStatus}"\`
      );
    }
  }
}

// ── Check B — All-done plans not yet archived ────────────────────────────────
for (const planDir of getActivePlanDirs()) {
  const overviewPath = join(PLANS_DIR, planDir, '00-overview.md');
  if (!existsSync(overviewPath)) continue;
  const overviewContent = readFileSync(overviewPath, 'utf-8');
  const rows = parseOrderedPhasesTable(overviewContent);
  if (rows.length === 0) continue;
  if (rows.every(({ status }) => status === 'done')) {
    warnings.push(
      \`WARN  plans/\${planDir}/00-overview.md: all phases done — consider archiving to plans/.archive/\`
    );
  }
}

// ── Check C — Backlog ID uniqueness and sequence ─────────────────────────────
const REQUIRED_BACKLOG_FIELDS = ['id', 'title', 'status', 'source', 'severity', 'created'];
const VALID_BACKLOG_STATUSES = ['open', 'resolved', 'wontfix'];
const seenIds = new Set();

let backlogFiles;
try {
  backlogFiles = readdirSync(BACKLOG_DIR).filter((f) => /^\\d{4}-.*\\.md$/.test(f));
} catch {
  backlogFiles = [];
}

for (const file of backlogFiles) {
  const filePath = join(BACKLOG_DIR, file);
  const content = readFileSync(filePath, 'utf-8');
  const fm = parseFrontmatter(content);
  const prefix = file.slice(0, 4); // "0001"

  if (!fm) {
    errors.push(\`ERROR backlog/\${file}: missing frontmatter block\`);
    continue;
  }

  // Required fields
  for (const field of REQUIRED_BACKLOG_FIELDS) {
    if (fm[field] === undefined || fm[field] === '') {
      errors.push(\`ERROR backlog/\${file}: missing required frontmatter field "\${field}"\`);
    }
  }

  // ID uniqueness
  const id = fm.id ?? '';
  if (id) {
    if (seenIds.has(id)) {
      errors.push(\`ERROR backlog/\${file}: duplicate id "\${id}"\`);
    } else {
      seenIds.add(id);
    }

    // ID/filename prefix match
    if (id.padStart(4, '0') !== prefix) {
      errors.push(\`ERROR backlog/\${file}: filename prefix "\${prefix}" does not match id "\${id}"\`);
    }
  }

  // Status enum
  const status = fm.status ?? '';
  if (status && !VALID_BACKLOG_STATUSES.includes(status)) {
    errors.push(
      \`ERROR backlog/\${file}: invalid status "\${status}" (allowed: \${VALID_BACKLOG_STATUSES.join(', ')})\`
    );
  }
}

// ── Check D — Two-way links between blocked phases and backlog entries ────────
// Collect all phase files (non-overview, non-archive).
function collectPhaseFiles() {
  const result = [];
  for (const planDir of getActivePlanDirs()) {
    let files;
    try {
      files = readdirSync(join(PLANS_DIR, planDir)).filter(
        (f) => f.endsWith('.md') && f !== '00-overview.md'
      );
    } catch {
      continue;
    }
    for (const f of files) {
      result.push({ path: join(PLANS_DIR, planDir, f), rel: \`plans/\${planDir}/\${f}\` });
    }
  }
  return result;
}

for (const { path: phaseFilePath, rel } of collectPhaseFiles()) {
  const content = readFileSync(phaseFilePath, 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || fm.status !== 'blocked') continue;

  // Look for a backlog link in the body.
  const bodyMatch = content.match(/^---\\n[\\s\\S]*?\\n---\\n([\\s\\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : content;
  const backlogLinkMatch = body.match(/backlog\\/(\\d{4})/g);

  if (!backlogLinkMatch) {
    warnings.push(\`WARN  \${rel}: status blocked but no backlog link found in body\`);
    continue;
  }

  for (const linkStr of backlogLinkMatch) {
    const id = linkStr.replace('backlog/', '');
    // Find the backlog file with this prefix.
    const matchingFile = (backlogFiles ?? []).find((f) => f.startsWith(id));
    if (!matchingFile) {
      warnings.push(\`WARN  \${rel}: references \${linkStr} but no backlog/\${id}-*.md file found\`);
      continue;
    }
    const backlogContent = readFileSync(join(BACKLOG_DIR, matchingFile), 'utf-8');
    const backlogFm = parseFrontmatter(backlogContent);
    const source = backlogFm?.source ?? '';
    if (!source.includes(rel.replace(\`plans/\`, ''))) {
      warnings.push(
        \`WARN  backlog/\${matchingFile}: source field "\${source}" does not reference \${rel}\`
      );
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const totalErrors = errors.length;
const totalWarnings = warnings.length;

if (totalErrors > 0 || totalWarnings > 0) {
  console.log(
    \`validate-plans: \${totalErrors} error(s), \${totalWarnings} warning(s):\`
  );
  for (const e of errors) console.error('  ' + e);
  for (const w of warnings) console.warn('  ' + w);
}

if (totalErrors > 0) {
  console.error(\`validate-plans: failed with \${totalErrors} error(s).\`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(\`validate-plans: passed with \${totalWarnings} warning(s).\`);
} else {
  console.log('validate-plans: passed.');
}
`;

// ---------------------------------------------------------------------------
// Codex harness — .codex/agents/*.toml, .codex/hooks.json, .codex/scripts/,
// .agents/skills/, scripts/agent-guard-core.mjs, AGENTS.md
//
// Templates are pure functions returning strings (same rules as the rest of this
// file). Scaffolded projects get real files — no symlinks (symlinks don't survive
// npm pack / CI / directory copies).
// ---------------------------------------------------------------------------

// TOML for each agent. The developer_instructions mirror the dogfood TOMls but
// substitute projectName/slug so the agent is oriented to the user's project.

const codexDevTomlTemplate = (projectName: string, slug: string, agent: AgentDef): string => {
  const scopeList = agent.writeScope.join(', ');
  return `name = "dev"
description = "Implementation agent for ${projectName}. All feature work and bug fixes under ${scopeList}."

developer_instructions = """
You are the implementation agent for ${projectName}.

## Onboarding protocol (in order, before any code)

1. Read .agents/memory/dev/MEMORY.md — your accumulated gotchas.
2. Read docs/INDEX.md and the relevant docs/features/<feature>/ spec for the task.
3. Load the ${slug}-conventions skill (.agents/skills/${slug}-conventions/SKILL.md) for the project's patterns and rules.
4. Read the code under change.

If no relevant feature spec exists, STOP and tell the user to run the docs-writer agent first.

## Workflow

1. State assumptions and success criteria.
2. Implement the minimum change that satisfies the spec; match existing style.
3. Verify: run tests and/or build; report results faithfully.
4. Append newly discovered gotchas/patterns to .agents/memory/dev/MEMORY.md.

## Park rule (anti-loop)

If a step fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, out-of-scope), STOP — do not retry a third time. File a backlog/<id> entry per backlog/README.md (its Tried section must list what already failed so it isn't repeated), set the owning phase status: blocked and link both ways, tell the user it was parked, then continue with the next workable task. Don't loop, don't silently skip.

## Hard rules

- Never commit or push — a human does that.
- Never write docs (delegate to docs-writer); flag when they are needed.
- Never edit docs/INDEX.md by hand.
"""
`;
};

const codexDocsWriterTomlTemplate = (projectName: string, slug: string): string =>
  `name = "docs-writer"
description = "Documentation agent for ${projectName} — analyzes requirements from any source and maintains docs/."

developer_instructions = """
You are the documentation agent for ${projectName}. You own docs/.

## Onboarding protocol

1. Read .agents/memory/docs-writer/MEMORY.md.
2. Read docs/README.md (placement + naming rules) and docs/INDEX.md (what already exists).
3. Load the ${slug}-docs skill (.agents/skills/${slug}-docs/SKILL.md).

## Workflow

1. Understand the requirement; if sources conflict, surface the conflict instead of guessing.
2. Check INDEX.md for an existing doc to update before creating a new one.
3. Copy docs/_template.md; fill ALL frontmatter fields (feature, flow, layer, status, lang, keywords, updated). Specs describe WHAT, not HOW.
4. Save per docs/README.md rules: docs/features/<feature>/<feature>.spec.en.md for feature specs.
5. Run node scripts/build-docs-index.mjs then node scripts/lint-docs-frontmatter.mjs — both must succeed.
6. If the feature introduces new domain nouns, add them to the trigger list in scripts/docs-first-reminder.sh.
7. Report created/updated paths. Append lessons to .agents/memory/docs-writer/MEMORY.md.

## Hard rules

- Never hand-edit docs/INDEX.md.
- Never edit application code — you write markdown and run the docs scripts only.
- Never commit or push.
"""
`;

const codexPlannerTomlTemplate = (projectName: string): string =>
  `name = "planner"
description = "Planning agent for ${projectName} — analyzes a request/story and produces a professional, detailed, resumable implementation plan under plans/."

developer_instructions = """
You are the planning agent for ${projectName}. You own plans/. You produce the plan; the dev agent executes it.

## Onboarding protocol (in order, before writing any plan)

1. Read .agents/memory/planner/MEMORY.md — accumulated planning gotchas.
2. Read plans/README.md — folder layout, file naming, and frontmatter contract.
3. Read docs/INDEX.md and the relevant docs/features/<feature>/ spec(s) — the spec is your source of truth for WHAT. If no relevant spec exists, STOP and tell the user to run the docs-writer agent first.
4. Skim the code under change only enough to anchor the plan in real file paths.

## Workflow

1. Restate the request and surface ambiguity. If interpretations conflict, ask — do not guess.
2. Decompose the work into the minimum set of ordered phases. Each phase is independently completable and leaves the repo in a working state. Do not invent speculative phases.
3. Write plans/<slug>/00-overview.md (goal, scope, non-goals, and the Ordered phases tracker table) and one plans/<slug>/NN-<phase>.md per phase.
4. Every phase file MUST be resumable on its own. Reference real source paths and the relevant docs/ spec.
5. Report the created plan paths and the recommended starting phase. Append durable planning lessons to .agents/memory/planner/MEMORY.md.

## Phase file contract

Each NN-<phase>.md begins with frontmatter:
  phase: NN
  title: <short title>
  status: pending   # pending | in-progress | done | blocked
  depends_on: [<NN>, ...]

Body order: Goal, Steps (- [ ] checklist), Verify (runnable success criteria), Notes / risks.

## Park rule

If a step fails twice and the cause isn't fixable right now, STOP — do not retry a third time. Set the phase status: blocked, file a backlog/<id> entry (its Tried section must list what failed), link both ways, tell the user it was parked. See backlog/README.md.

## Hard rules

- Write ONLY under plans/ (and your own .agents/memory/planner/). Never edit src/, never write code.
- Never write feature specs — that is docs-writer's job. Flag when a spec is missing instead of writing one.
- Never edit docs/INDEX.md or any docs/ file.
- Never commit or push — a human does that.
- Non-blocking follow-up work must be filed as a backlog/<NNNN>-<slug>.md entry.
"""
`;

const codexAdvisorTomlTemplate = (projectName: string, slug: string): string =>
  `name = "advisor"
description = "Read-only brainstorming & advisory agent for ${projectName} — the engineer who understands the source logic most deeply. Reads the code, reasons about trade-offs, and returns the best, most optimal recommendation; never edits anything."
sandbox_mode = "network-disabled"

developer_instructions = """
You are the advisor for ${projectName}. You are the engineer who holds the deepest, most accurate mental model of the source and the trade-offs baked into it. Your job is to read, reason, and recommend — to brainstorm with the user and hand them the single best path forward. You do not write code, docs, or plans; dev, docs-writer, and planner do that after you've clarified the thinking.

## Onboarding protocol (in order, before advising)

1. Read .agents/memory/advisor/MEMORY.md — accumulated architectural insights and recurring trade-offs.
2. Read docs/INDEX.md and the relevant docs/features/<feature>/ spec(s) for the area in question.
3. Load the ${slug}-conventions skill (.agents/skills/${slug}-conventions/SKILL.md) for the project's patterns and rules.
4. Read the actual source under discussion. Never advise from memory or assumption when the file is one Read away.

## Workflow

1. Restate the question and the real goal behind it. If interpretations conflict, surface them — don't silently pick one.
2. Read enough source to be certain. Trace the real data flow rather than guessing at it.
3. Brainstorm: lay out the viable options with their concrete trade-offs (simplicity, coupling, correctness, maintenance cost).
4. Give a recommendation, not a survey. Name the single best option, say why it wins, and cite the files/lines that justify it. Note the cheapest next step and which agent owns it (dev / planner / docs-writer).
5. Append durable architectural insights to .agents/memory/advisor/MEMORY.md.

## What "best advice" means here

- Favor the minimum change that solves the problem. Call out over-engineering explicitly.
- Optimal != clever. Prefer the option a senior engineer would call obvious over the one that's impressive.
- When the user's instinct is wrong, say so plainly and explain the cost.

## Hard rules

- Read-only. Never edit, create, or delete any file — not source, not docs/, not plans/, not backlog/. The only file you ever write is your own .agents/memory/advisor/MEMORY.md (insights).
- Never run the build, never commit, never push.
- Ground claims in real paths/lines; if you haven't read it, say so instead of asserting.
- Hand off, don't implement: end with a clear, actionable recommendation and who should execute it.
"""
`;

const codexScoutTomlTemplate = (projectName: string, slug: string): string =>
  `name = "scout"
description = "Fast, cheap read-only Q&A & lookup agent for ${projectName} — reads, synthesizes, and answers in a few sentences with path:line citations."
sandbox_mode = "network-disabled"

developer_instructions = """
You are scout for ${projectName}. You answer factual questions about the codebase and docs quickly and cheaply — read what you need, synthesize, and reply in a few sentences. You do not reason about design trade-offs (that is advisor), and you never edit anything (that is dev / docs-writer / planner).

## Lookup protocol (DOCS-FIRST)

1. If the question touches a documented feature, start at docs/INDEX.md and read the relevant docs/features/<feature>/ spec before opening source. Load the ${slug}-docs skill (.agents/skills/${slug}-docs/SKILL.md) when you need to locate a doc.
2. Otherwise grep/glob to the right file fast. Trace the real data flow rather than guessing.
3. Read only the lines you need to be certain — excerpts, not whole files. Stop as soon as you can answer.

## Answer style

- Lead with the answer, then a one-line why/where. Keep it to a few sentences.
- Always cite the real path:line you got it from. If you didn't read it, say so — never assert from memory.
- If the question is ambiguous, ask one short clarifying question instead of guessing.

## Hard rules

- Read-only. Never create, edit, or delete any file.
- Stay in your lane — hand off, don't expand scope:
  - Design / trade-off / "what's the best approach?" → recommend advisor.
  - Implementation, bug fix, new option → recommend dev.
  - Writing or updating docs → recommend docs-writer; multi-phase plan → planner.
- If answering would require running code or reasoning through a non-trivial design decision, stop and route it rather than overreaching.
"""
`;

// .codex/hooks.json — uses $(git rev-parse --show-toplevel) for portability.
// The two-hook approach (SubagentStart/Stop + PreToolUse) mirrors the dogfood setup.
const codexHooksJsonTemplate = (): string =>
  JSON.stringify(
    {
      _comment:
        'Codex hook registry. Agent identity is recovered via the two-hook approach: SubagentStart writes /tmp/.codex-agent-<session_id>; PreToolUse reads it. SubagentStop cleans up.',
      hooks: {
        SubagentStart: [
          {
            hooks: [
              {
                type: 'command',
                command:
                  'node "$(git rev-parse --show-toplevel)/.codex/scripts/codex-subagent-start.mjs"',
                statusMessage: 'Recording subagent identity…',
              },
            ],
          },
        ],
        SubagentStop: [
          {
            hooks: [
              {
                type: 'command',
                command:
                  'node "$(git rev-parse --show-toplevel)/.codex/scripts/codex-subagent-stop.mjs"',
                statusMessage: 'Cleaning up subagent identity…',
              },
            ],
          },
        ],
        PreToolUse: [
          {
            matcher: 'write|edit|apply_patch|patch',
            hooks: [
              {
                type: 'command',
                command:
                  'node "$(git rev-parse --show-toplevel)/.codex/scripts/agent-guard-codex.mjs"',
                statusMessage: 'Checking write-scope ACL…',
                timeout: 10,
              },
            ],
          },
          {
            matcher: 'bash|shell|run_command',
            _comment_git_deny:
              "Git command deny list — mirrors Claude's permissions.deny. Codex does not have a static deny mechanism, so a PreToolUse hook intercepts dangerous git commands.",
            hooks: [
              {
                type: 'command',
                command:
                  'node "$(git rev-parse --show-toplevel)/.codex/scripts/codex-permission-guard.mjs"',
                statusMessage: 'Checking command permissions…',
                timeout: 10,
              },
            ],
          },
        ],
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: 'command',
                command:
                  'bash "$(git rev-parse --show-toplevel)/scripts/docs-first-reminder.sh"',
                statusMessage: 'Docs-first reminder…',
                timeout: 10,
              },
            ],
          },
        ],
      },
    },
    null,
    2
  );

// Shared guard core — pure logic, no process.exit()/stdout. Both Claude and Codex adapters
// import from here. Content is data-driven from the agents array (same as agentGuardMjsTemplate).
const agentGuardCoreMjsTemplate = (agents: AgentDef[]): string => {
  const scopesObj: Record<string, string[]> = {};
  for (const agent of agents) {
    scopesObj[agent.name] = agent.writeScope;
  }
  const scopesJson = JSON.stringify(scopesObj, null, 2);

  return `// agent-guard-core.mjs — shared ACL logic for Claude and Codex guard adapters.
// Pure logic only: no process.exit(), no process.stdout.write(), no fs side effects.
// Both agent-guard.mjs (Claude adapter) and agent-guard-codex.mjs (Codex adapter) import from here.
// Generated from the AGENTS registry at scaffold time — do not edit by hand.

export const WRITE_SCOPES = ${scopesJson};

/**
 * Determine whether an agent is allowed to write to a given file path.
 *
 * @param {string} agentType  - The agent name (e.g. "dev", "planner").
 * @param {string} filePath   - The absolute or project-relative path being written.
 * @param {string} cwd        - The project root (used to compute a relative path).
 * @returns {{ decision: 'allow' | 'deny' | 'pass', reason?: string }}
 *   - 'allow'  — agent is permitted to write this path.
 *   - 'deny'   — agent is NOT permitted; reason string is set.
 *   - 'pass'   — unknown agent or no file path; caller should exit 0 silently.
 */
export function checkWritePermission(agentType, filePath, cwd) {
  // Unknown agent or main thread — pass through.
  if (!agentType || !(agentType in WRITE_SCOPES)) {
    return { decision: 'pass' };
  }

  if (!filePath) {
    return { decision: 'pass' };
  }

  // Normalize to project-relative path when an absolute path is given.
  let rel = filePath;
  if (filePath.startsWith('/') && cwd && filePath.startsWith(cwd + '/')) {
    rel = filePath.slice(cwd.length + 1);
  }

  const allowedPrefixes = WRITE_SCOPES[agentType];

  // Always allow an agent to write its own memory directory (implicit, even for read-only agents).
  // Memory lives at the harness-neutral path .agents/memory/<agentType>/.
  const memoryPrefix = \`.agents/memory/\${agentType}/\`;
  if (rel.startsWith(memoryPrefix)) {
    return { decision: 'allow' };
  }

  // Read-only agents (empty writeScope): deny all other writes.
  if (allowedPrefixes.length === 0) {
    return {
      decision: 'deny',
      reason: \`read-only agent may not write any file. \${agentType} attempted to write \${filePath}. Route implementation to the dev agent instead.\`,
    };
  }

  // Allow if path is within the agent's declared scope.
  const allowed = allowedPrefixes.some((prefix) => rel.startsWith(prefix));
  if (allowed) {
    return { decision: 'allow' };
  }

  return {
    decision: 'deny',
    reason: \`\${agentType} may only write under [\${allowedPrefixes.join(', ')}] (and \${memoryPrefix}). Blocked write to \${filePath}. Route to the correct agent instead.\`,
  };
}
`;
};

// Codex adapter for the shared guard. Reads agent identity from temp file written
// by SubagentStart hook, then calls checkWritePermission from agent-guard-core.mjs.
const agentGuardCodexMjsTemplate = (): string =>
  `// agent-guard-codex.mjs — Codex adapter for the shared write-scope ACL guard.
//
// HOW AGENT IDENTITY IS RECOVERED (two-hook approach):
//   Codex PreToolUse payloads have no agent_type equivalent.
//   A SubagentStart hook writes the active agent name to a temp file keyed by session_id:
//     /tmp/.codex-agent-<session_id>
//   This PreToolUse adapter reads that file to recover the agent name.
//   A SubagentStop hook removes the temp file (cleanup).
//   If the temp file is missing, the adapter fails-open (pass-through).
import { readFileSync, existsSync } from 'fs';
import { checkWritePermission } from '../../scripts/agent-guard-core.mjs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const sessionId = payload.session_id;
const cwd = payload.cwd ?? '';

// Recover agent name from temp file written by SubagentStart hook.
let agentType = null;
if (sessionId) {
  const tempFile = \`/tmp/.codex-agent-\${sessionId}\`;
  if (existsSync(tempFile)) {
    try {
      agentType = readFileSync(tempFile, 'utf-8').trim() || null;
    } catch {
      // fail-open below
    }
  }
}

if (!agentType) {
  process.stderr.write(\`[agent-guard-codex] WARNING: no agent identity found for session \${sessionId ?? '(none)'}; passing through.\\n\`);
  process.exit(0);
}

// Extract file path from payload.
let filePath = payload.tool_input?.file_path ?? null;
if (!filePath && payload.tool_input?.command) {
  const cmd = payload.tool_input.command;
  const diffMatch = cmd.match(/^\\+\\+\\+ b\\/(.+)$/m) || cmd.match(/^--- a\\/(.+)$/m);
  if (diffMatch) {
    filePath = diffMatch[1].startsWith('/') ? diffMatch[1] : \`\${cwd}/\${diffMatch[1]}\`;
  } else {
    const tokenMatch = cmd.match(/(?:^|\\s)(\\/[^\\s]+)/);
    if (tokenMatch) filePath = tokenMatch[1];
  }
}

const result = checkWritePermission(agentType, filePath, cwd);

if (result.decision === 'pass' || result.decision === 'allow') {
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: result.reason,
    },
  })
);
process.exit(0);
`;

// SubagentStart hook — writes active agent name to /tmp/.codex-agent-<session_id>.
const codexSubagentStartMjsTemplate = (): string =>
  `// codex-subagent-start.mjs — SubagentStart hook for Codex.
// Reads the SubagentStart payload (stdin) and writes the active agent name to
// a temp file keyed by session_id so agent-guard-codex.mjs can read it in PreToolUse.
import { readFileSync, writeFileSync } from 'fs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const sessionId = payload.session_id;
if (!sessionId) {
  process.stderr.write('[codex-subagent-start] WARNING: no session_id in payload; cannot key temp file.\\n');
  process.exit(0);
}

// Try common field names for the agent name.
const agentName = payload.name ?? payload.agent_name ?? payload.subagent_name ?? null;
if (!agentName) {
  process.stderr.write(\`[codex-subagent-start] WARNING: no agent name field found in payload for session \${sessionId}. Payload keys: \${Object.keys(payload).join(', ')}\\n\`);
  process.exit(0);
}

const tempFile = \`/tmp/.codex-agent-\${sessionId}\`;
try {
  writeFileSync(tempFile, agentName, 'utf-8');
} catch (err) {
  process.stderr.write(\`[codex-subagent-start] ERROR: could not write temp file \${tempFile}: \${err.message}\\n\`);
}

process.exit(0);
`;

// SubagentStop hook — removes temp file to prevent stale agent identity leaking.
const codexSubagentStopMjsTemplate = (): string =>
  `// codex-subagent-stop.mjs — SubagentStop hook for Codex.
// Reads the SubagentStop payload (stdin) and removes the temp file written by
// codex-subagent-start.mjs so stale agent identity cannot leak into later turns.
import { readFileSync, unlinkSync, existsSync } from 'fs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const sessionId = payload.session_id;
if (!sessionId) {
  process.exit(0);
}

const tempFile = \`/tmp/.codex-agent-\${sessionId}\`;
if (existsSync(tempFile)) {
  try {
    unlinkSync(tempFile);
  } catch (err) {
    process.stderr.write(\`[codex-subagent-stop] WARNING: could not remove temp file \${tempFile}: \${err.message}\\n\`);
  }
}

process.exit(0);
`;

// Codex permission guard — denies dangerous git commands (mirrors Claude's permissions.deny).
const codexPermissionGuardMjsTemplate = (): string =>
  `// codex-permission-guard.mjs — Codex PreToolUse hook for blocking dangerous git commands.
// Mirrors Claude's permissions.deny static list.
import { readFileSync } from 'fs';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  process.exit(0);
}

const cmd = (payload.tool_input?.command ?? '').trim();
if (!cmd) process.exit(0);

const DENY_PATTERNS = [
  /\\bgit\\s+push\\b/,
  /\\bgit\\s+commit\\b/,
  /\\bgit\\s+merge\\b/,
  /\\bgit\\s+rebase\\b/,
  /\\bgit\\s+tag\\b/,
  /\\bgit\\s+branch\\s+-[Dd]\\b/,
  /\\bgit\\s+reset\\s+--hard\\b/,
  /\\bgit\\s+clean\\b/,
];

const matched = DENY_PATTERNS.find((p) => p.test(cmd));
if (!matched) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: \`Blocked git command: "\${cmd.slice(0, 120)}". Dangerous git operations (push, commit, merge, rebase, tag, branch -D, reset --hard, clean) are not permitted. A human must run this manually.\`,
    },
  })
);
process.exit(0);
`;

// AGENTS.md — Codex entry point; mirrors the dogfood AGENTS.md but generic.
const agentsMdTemplate = (projectName: string): string =>
  `# AGENTS.md

> This file is the Codex entry point for ${projectName}.
> All project context, behavioral guidelines, architecture details, and agent routing
> live in **CLAUDE.md** (repo root). Read that file first and in full.

<!-- CLAUDE.md is the canonical source of truth. Keep the routing table and PARK RULE
     below in sync with CLAUDE.md whenever that file is edited. -->

## Agent Routing

The following agents are available. Route tasks to the correct agent — do not do another
agent's job.

| Task / trigger | Agent | Notes |
|---|---|---|
| Brainstorming / trade-off analysis / "what's the best approach?" before any change | \`advisor\` | read-only; deepest source mental model; recommends, never edits — hands off to dev/planner/docs-writer |
| Decomposing a story into a resumable, multi-phase implementation plan | \`planner\` | owns \`plans/\`; writes phase files only, never code (see \`plans/README.md\`) |
| Feature work or bug fix | \`dev\` | MUST read the relevant \`docs/features/\` spec before coding |
| Analyzing requirements, writing/updating feature docs | \`docs-writer\` | owns \`docs/\`; rebuilds INDEX.md after every change |
| Fast read-only lookups, file/symbol searches, factual Q&A | \`scout\` | never edits; cites path:line |

## PARK RULE (anti-loop)

When executing a step or phase, if it fails **twice** and the cause is not fixable right now
(missing info, needs a user decision, environment issue, or out-of-scope), **STOP** — do not
retry a third time.

- Set the phase \`status: blocked\`
- File a \`backlog/<id>\` entry (record what was already tried so it is not repeated)
- Link both ways (phase → backlog, backlog → phase)
- Tell the user it was parked
- Move on to the next workable item

See \`backlog/README.md\` for the entry format.

## Subagent Definitions

Subagent TOML files live under \`.codex/agents/\`. Each file declares the agent's name,
description, and developer instructions. These mirror the Claude agent definitions under
\`.claude/agents/\`.

## For full context

Read **CLAUDE.md** — it contains the complete behavioral guidelines, architecture overview,
and agent-routing notes.
`;

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

  const conventionsSkillContent = params.conventionsSkill;
  const docsSkillContent = docsSkillTemplate(projectName, slug, flowEnum, layerEnum);

  // ── SHARED — emitted for either claude, codex, or both ─────────────────────
  // Includes: docs tooling, agent-guard-core (imported by both adapters),
  // docs-first-reminder.sh (both hooks.json and settings.json reference it),
  // and the knowledge base (plans/, backlog/, docs/).
  // All shared scripts live in top-level scripts/ — harness-neutral, no .claude/ prefix.
  const shared: FileMap = [
    { relativePath: 'scripts/_docs-shared.mjs', content: docsSharedMjsTemplate(flowEnum, layerEnum) },
    { relativePath: 'scripts/build-docs-index.mjs', content: buildDocsIndexMjsTemplate() },
    { relativePath: 'scripts/lint-docs-frontmatter.mjs', content: lintDocsFrontmatterMjsTemplate() },
    { relativePath: 'scripts/validate-structure.mjs', content: validateStructureMjsTemplate(allAgents) },
    { relativePath: 'scripts/validate-plans.mjs', content: validatePlansMjsTemplate() },
    { relativePath: 'scripts/docs-first-reminder.sh', content: docsFirstReminderShTemplate(params.reminderTrigger) },
    // agent-guard-core.mjs is imported by both Claude and Codex adapters.
    { relativePath: 'scripts/agent-guard-core.mjs', content: agentGuardCoreMjsTemplate(allAgents) },
    // ── Knowledge base ──────────────────────────────────────────────────────
    { relativePath: 'plans/README.md', content: plansReadmeTemplate() },
    { relativePath: 'backlog/README.md', content: backlogReadmeTemplate() },
    { relativePath: 'docs/README.md', content: docsReadmeTemplate() },
    { relativePath: 'docs/INDEX.md', content: docsIndexPlaceholderTemplate() },
    { relativePath: 'docs/_template.md', content: docsTemplateMdTemplate(flowEnum, layerEnum) },
    ...params.seedDocs,
    // harness-neutral: emitted for claude, codex, and both
    { relativePath: '.agents/memory/dev/MEMORY.md', content: agentMemorySeedTemplate('dev') },
    { relativePath: '.agents/memory/docs-writer/MEMORY.md', content: agentMemorySeedTemplate('docs-writer') },
    { relativePath: '.agents/memory/planner/MEMORY.md', content: agentMemorySeedTemplate('planner') },
    { relativePath: '.agents/memory/advisor/MEMORY.md', content: agentMemorySeedTemplate('advisor') },
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
    { relativePath: '.claude/settings.json', content: claudeSettingsTemplate() },
    { relativePath: '.claude/scripts/agent-guard.mjs', content: agentGuardMjsTemplate(allAgents) },
    { relativePath: '.claude/agents/dev.md', content: params.devAgent },
    { relativePath: '.claude/agents/docs-writer.md', content: docsWriterAgentTemplate(projectName, slug, agentDef('docs-writer')) },
    { relativePath: '.claude/agents/planner.md', content: plannerAgentTemplate(projectName, agentDef('planner')) },
    { relativePath: '.claude/agents/advisor.md', content: advisorAgentTemplate(projectName, slug, agentDef('advisor')) },
    { relativePath: '.claude/agents/scout.md', content: scoutAgentTemplate(projectName, slug, agentDef('scout')) },
  ] : [];

  // ── CODEX-ONLY — emitted only when harness includes codex ──────────────────
  // Includes: AGENTS.md, .codex/hooks.json, .codex/agents/*.toml,
  // .agents/skills/ twins (real files — no symlinks), and the Codex-specific
  // hook scripts under .codex/scripts/ (hooks.json references them via git rev-parse).
  // No .claude/ directory is created for codex-only projects.
  const codexOnly: FileMap = wantCodex ? [
    { relativePath: 'AGENTS.md', content: agentsMdTemplate(projectName) },
    { relativePath: '.codex/hooks.json', content: codexHooksJsonTemplate() },
    { relativePath: '.codex/agents/dev.toml', content: codexDevTomlTemplate(projectName, slug, agentDef('dev')) },
    { relativePath: '.codex/agents/docs-writer.toml', content: codexDocsWriterTomlTemplate(projectName, slug) },
    { relativePath: '.codex/agents/planner.toml', content: codexPlannerTomlTemplate(projectName) },
    { relativePath: '.codex/agents/advisor.toml', content: codexAdvisorTomlTemplate(projectName, slug) },
    { relativePath: '.codex/agents/scout.toml', content: codexScoutTomlTemplate(projectName, slug) },
    // Skills duplicated as real files (no symlinks — symlinks don't survive npm pack / CI).
    { relativePath: `.agents/skills/${slug}-conventions/SKILL.md`, content: conventionsSkillContent },
    { relativePath: `.agents/skills/${slug}-docs/SKILL.md`, content: docsSkillContent },
    // Codex hook scripts under .codex/scripts/ — hooks.json references them via git rev-parse.
    { relativePath: '.codex/scripts/agent-guard-codex.mjs', content: agentGuardCodexMjsTemplate() },
    { relativePath: '.codex/scripts/codex-subagent-start.mjs', content: codexSubagentStartMjsTemplate() },
    { relativePath: '.codex/scripts/codex-subagent-stop.mjs', content: codexSubagentStopMjsTemplate() },
    { relativePath: '.codex/scripts/codex-permission-guard.mjs', content: codexPermissionGuardMjsTemplate() },
  ] : [];

  const files: FileMap = [...shared, ...claudeOnly, ...codexOnly];

  if (params.testing) {
    // test-writer is Claude-specific (agent .md file + memory seed + skill).
    // Only emit if the Claude harness is included.
    if (wantClaude) {
      files.push(
        { relativePath: '.claude/agents/test-writer.md', content: params.testing.testWriterAgent },
        { relativePath: '.agents/memory/test-writer/MEMORY.md', content: agentMemorySeedTemplate('test-writer') },
        { relativePath: `.claude/skills/${slug}-test-author/SKILL.md`, content: params.testing.testAuthorSkill }
      );
    }
  }

  return files;
};
