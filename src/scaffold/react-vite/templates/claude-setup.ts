import { ReactViteCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';
import { buildClaudeFileMap } from '@src/scaffold/shared/claude-setup';

// React+Vite-specific pieces of the Claude Code harness (CLAUDE.md, conventions
// skill, dev/test-writer agents). Project-agnostic pieces (docs tooling, settings,
// docs skill, docs-writer) live in @src/scaffold/shared/claude-setup.

const projectSlug = (cart: ReactViteCore): string =>
  cart.projectName.toLowerCase().replace(/_/g, '-');

const fsdLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const bprLayers = ['app', 'pages', 'components', 'features', 'hooks', 'stores', 'lib', 'utils'];

const layerEnum = (cart: ReactViteCore): string[] =>
  [...(cart.layout === 'FSD' ? fsdLayers : bprLayers), '_cross'];

const flowEnum = (cart: ReactViteCore): string[] => [
  'ui',
  'data',
  ...(cart.router === 'TANSTACK_ROUTER' ? ['routing'] : []),
  ...(cart.stateManagement === 'ZUSTAND' ? ['state'] : []),
  'infra',
  'architecture',
  'onboarding',
  '_meta',
];

const reminderTrigger = (cart: ReactViteCore): string =>
  `home|landing${cart.router === 'TANSTACK_ROUTER' ? '|route|routing' : ''}${cart.stateManagement === 'ZUSTAND' ? '|store|state' : ''}${cart.query === 'TANSTACK_QUERY' ? '|query|fetch' : ''}`;

// ---------------------------------------------------------------------------
// CLAUDE.md
// ---------------------------------------------------------------------------

const claudeMdTemplate = (cart: ReactViteCore): string => {
  const isFsd = cart.layout === 'FSD';
  const hasRouter = cart.router === 'TANSTACK_ROUTER';
  const hasZustand = cart.stateManagement === 'ZUSTAND';
  const hasQuery = cart.query === 'TANSTACK_QUERY';
  const hasVitest = cart.testing === 'VITEST';
  const hasPlaywright = cart.testing === 'PLAYWRIGHT';
  const hasTesting = cart.testing !== 'NOT_USING';
  const slug = projectSlug(cart);

  const stack = [
    'React 19, TypeScript 5.8, Vite 6',
    hasRouter ? 'TanStack Router v1.144.0 (file-based routes in src/routes/)' : null,
    hasZustand ? 'Zustand v5.0.5' : null,
    hasQuery ? 'TanStack Query v5.74.4' : null,
    cart.css === 'TAILWIND' ? 'Tailwind CSS v4.1.3' : null,
    cart.linter === 'BIOME' ? 'Biome v1.9.4' : cart.linter === 'ESLINT' ? 'ESLint v9' : null,
    hasVitest ? 'Vitest v3.2.4 + Testing Library' : null,
    hasPlaywright ? 'Playwright v1.52.0' : null,
  ].filter(Boolean);

  const commands = [
    '- `npm run dev` — start dev server (http://localhost:5173)',
    '- `npm run build` — type-check + production build',
    cart.linter !== 'NOT_USING' ? '- `npm run lint` — lint code' : null,
    hasVitest ? '- `npm run test:run` — run unit/component tests once (`npm test` for watch)' : null,
    hasPlaywright ? '- `npm run test:e2e` — run Playwright E2E tests' : null,
    '- `npm run docs:index` — regenerate docs/INDEX.md (run after any doc change)',
    '- `npm run docs:lint` — validate docs frontmatter (CI-ready, exits non-zero on violation)',
  ].filter(Boolean);

  const fsdArchitecture = `\`\`\`
app        → app shell, providers, global setup
pages      → route-level pages (one folder per page: ui/ + index.ts barrel)
widgets    → composite UI blocks assembled from features/entities
features   → user interactions with business value
entities   → business domain objects (model, api, ui)
shared     → reusable foundation: ui/, lib/, api/, config/
\`\`\`

**Hard rules:**
- Upper layers import lower layers only — NEVER the reverse (shared must not import pages).
- Cross-imports inside one layer are forbidden (a feature must not import another feature).
- Every page exposes its public API through \`index.ts\` — import \`@/pages/home\`, never \`@/pages/home/ui/HomePage\`.`;

  const bprArchitecture = `\`\`\`
pages      → route-level pages
components → shared presentational components
features   → feature folders (components + hooks + api per feature)
hooks      → shared React hooks
stores     → global state${hasZustand ? ' (Zustand)' : ''}
lib        → third-party wrappers / configured clients
utils      → pure utility functions
\`\`\`

**Hard rules:**
- A feature may import from shared folders (components/, hooks/, lib/, utils/) — shared folders must NEVER import from features/ or pages/.
- Cross-feature imports are forbidden; lift shared logic into hooks/ or lib/ instead.
- Keep components presentational; data fetching and state live in hooks.`;

  const keyPatterns: string[] = [];
  if (hasZustand) {
    keyPatterns.push(`**Zustand — select narrowly, never the whole store:**
\`\`\`ts
const count = useAppStore((state) => state.count); // ✅ re-renders on count only
const store = useAppStore();                       // ❌ re-renders on every change
\`\`\``);
  }
  if (hasQuery) {
    keyPatterns.push(`**TanStack Query — key factories, not inline keys:**
\`\`\`ts
const todoKeys = {
  all: ['todos'] as const,
  detail: (id: string) => [...todoKeys.all, id] as const,
};
useQuery({ queryKey: todoKeys.detail(id), queryFn: () => fetchTodo(id) });
\`\`\``);
  }
  if (hasRouter) {
    keyPatterns.push(`**TanStack Router — one file per route in src/routes/; never edit routeTree.gen.ts:**
\`\`\`ts
export const Route = createFileRoute('/about')({ component: AboutPage });
\`\`\``);
  }
  if (keyPatterns.length === 0) {
    keyPatterns.push('_(Add canonical code snippets here as the project establishes its patterns.)_');
  }

  const namingRows = isFsd
    ? `| Pattern | Example | Layer |
|---|---|---|
| PascalCase component, named export | \`HomePage.tsx\` → \`export const HomePage\` | pages/widgets/features ui |
| \`use\` prefix, camelCase | \`useAuth.ts\` | hooks (in lib/ or feature) |
| camelCase barrel | \`index.ts\` re-exporting public API | every slice |
| kebab-case folders | \`src/features/add-todo/\` | all layers |`
    : `| Pattern | Example | Layer |
|---|---|---|
| PascalCase component, default export for pages | \`Home.tsx\` → \`export default Home\` | pages |
| PascalCase component, named export | \`Button.tsx\` → \`export const Button\` | components |
| \`use\` prefix, camelCase | \`useAuth.ts\` | hooks |${hasZustand ? '\n| camelCase store, `use*Store` | `appStore.ts` → `useAppStore` | stores |' : ''}`;

  const testSection = hasTesting
    ? `## Centralized Test Pattern

All test code lives in the top-level \`test/\` folder — never inside \`src/\`:

\`\`\`
test/
├── README.md          # conventions + how to run
${hasVitest ? '├── unit/              # mirrors src/ layer structure; *.test.tsx\n' : ''}${hasPlaywright ? '├── e2e/               # mirrors business flows; *.spec.ts\n' : ''}├── _shared/           # fixtures/, helpers/, mocks/${hasPlaywright ? ', pages/ (Page Objects)' : ''}
└── specs/             # paired human-readable *.spec.md contracts — documentation, never executed
\`\`\`

Every test file has a paired \`test/specs/.../<name>.spec.md\` describing WHAT it covers. See \`test/README.md\`.

` : '';

  const testWriterRow = hasTesting
    ? '\n| Writing or updating tests | `test-writer` | writes only under `test/`; requires a feature spec first |'
    : '';

  return `# ${cart.projectName}

## Behavioral Guidelines

**Think Before Coding** — state assumptions explicitly; if multiple interpretations exist, present them; if something is unclear, stop and ask.
**Simplicity First** — minimum code that solves the problem; no speculative features, abstractions, or configurability.
**Surgical Changes** — touch only what the request requires; match existing style; every changed line traces to the request.
**Goal-Driven Execution** — turn tasks into verifiable success criteria before starting; loop until verified.

## Project Overview

${stack.map((s) => `- ${s}`).join('\n')}

Architecture: **${isFsd ? 'Feature Slice Design (FSD)' : 'Bulletproof React (BPR)'}**. Reference implementation: \`src/pages/home${isFsd ? '/' : '.tsx'}\` — consult it before generating new pages. Verify actual directory names with \`ls\` before writing paths.

## Commands

${commands.join('\n')}

## Architecture Layers

${isFsd ? fsdArchitecture : bprArchitecture}

## Key Patterns

${keyPatterns.join('\n\n')}

## Naming Conventions

${namingRows}

## Anti-Patterns

| Anti-pattern | Correct approach |
|---|---|
${isFsd ? '| Importing a slice\'s internals (`@/pages/home/ui/HomePage`) | Import the barrel: `@/pages/home` |\n| Business logic in `shared/` | `shared/` is generic-only; domain logic goes in `entities/` or `features/` |' : '| Cross-feature imports (`features/a` → `features/b`) | Lift shared code into `hooks/` or `lib/` |\n| Fetching data inside presentational components | Move fetching into a hook; pass data via props |'}
| \`useEffect\` for derived state | Compute during render or use \`useMemo\` |
| Hand-editing generated files${hasRouter ? ' (`routeTree.gen.ts`)' : ''} | Regenerate via the owning tool |

> Fill this table from real review feedback over time — it is the highest-leverage section for code quality.

${testSection}## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
| Feature work or bug fix in \`src/\` | \`dev\` | MUST read relevant \`docs/features/\` spec before coding |
| Analyzing requirements, writing/updating feature docs | \`docs-writer\` | owns \`docs/\`; rebuilds INDEX.md after every change |${testWriterRow}

Each agent has persistent memory at \`.claude/agent-memory/<agent>/MEMORY.md\` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.

## Task Documentation Convention

After any non-trivial fix or new pattern: copy \`docs/_template.md\`, fill the frontmatter, save as \`docs/features/<feature>/<topic>.en.md\` (or \`docs/architecture/\` for cross-cutting topics), then run \`npm run docs:index\` and commit the doc together with \`INDEX.md\`. Validate with \`npm run docs:lint\`.

## Further Reading + DOCS-FIRST RULE

Skills: \`.claude/skills/${slug}-conventions\` (architecture depth), \`.claude/skills/${slug}-docs\` (how to query the knowledge base)${hasTesting ? `, \`.claude/skills/${slug}-test-author\` (test conventions)` : ''}.

**DOCS-FIRST RULE:** for any request to describe, explain, or modify a documented feature, you MUST grep \`docs/\` frontmatter and read the relevant docs BEFORE opening source files — and state what the docs already covered. Start at \`docs/INDEX.md\`.

**Operating loop:** finish a non-trivial task → write a doc from \`docs/_template.md\` → rebuild \`INDEX.md\` → commit together; agents update their \`MEMORY.md\` when they learn a gotcha.
`;
};

// ---------------------------------------------------------------------------
// Seed doc — docs/features/home/home.spec.en.md
// ---------------------------------------------------------------------------

const docsHomeSpecTemplate = (cart: ReactViteCore): string => {
  const today = new Date().toISOString().slice(0, 10);
  return `---
title: Home Page — Feature Spec
feature: home
flow: ui
layer: pages
status: draft
lang: en
related: []
keywords: [home, landing]
updated: ${today}
---

# Home Page — Feature Spec

## Context
Starter page generated by the scaffold. Replace this spec with the real requirements for ${cart.projectName}'s home page.

## Root Cause / Key Finding
_(For feature specs, use this section for key constraints or discoveries.)_

## Solution / Pattern
- Requirements: [list what the page must do]
- UI/UX: [screens and interactions]
- Data: [data structures, API requirements]
- Edge cases: [what must not break]

## Key Decisions
_(Trade-offs made and alternatives rejected.)_

## Related Files
- src/pages/${cart.layout === 'FSD' ? 'home/ui/HomePage.tsx' : 'Home.tsx'}
`;
};

// ---------------------------------------------------------------------------
// Conventions skill
// ---------------------------------------------------------------------------

const conventionsSkillTemplate = (cart: ReactViteCore): string => {
  const isFsd = cart.layout === 'FSD';
  const slug = projectSlug(cart);
  return `---
name: ${slug}-conventions
description: Coding conventions and architecture rules for ${cart.projectName}. Use when writing or reviewing ANY code under src/ — components, pages, hooks${cart.stateManagement === 'ZUSTAND' ? ', stores' : ''}${cart.router === 'TANSTACK_ROUTER' ? ', routes' : ''}, or styling. Triggers on tasks mentioning components, pages, layout, naming, imports, or project structure.
---

# ${cart.projectName} Conventions

In-depth companion to CLAUDE.md. CLAUDE.md states the rules; this skill explains how to apply them.

## Layer boundaries (${isFsd ? 'FSD' : 'BPR'})

${isFsd
    ? `Import direction is one-way: \`app → pages → widgets → features → entities → shared\`.
- Adding a page: create \`src/pages/<name>/ui/<Name>Page.tsx\` + \`src/pages/<name>/index.ts\` barrel.
- Adding a feature: \`src/features/<name>/\` with its own ui/, model/, api/ as needed.
- Anything used by 2+ slices and free of domain logic belongs in \`shared/\`.
- NEVER deep-import another slice's internals; only its \`index.ts\` barrel.`
    : `- Adding a page: \`src/pages/<Name>.tsx\`, default export.
- Adding a feature: \`src/features/<name>/\` holding that feature's components, hooks, and api together.
- Shared folders (components/, hooks/, lib/, utils/) must stay feature-agnostic — no imports from features/ or pages/.
- Cross-feature reuse: lift into hooks/ or lib/, never import feature → feature.`}

## Import alias

Use \`@/\` for everything under src/ (e.g. \`import { HomePage } from '@/pages/home'\`). Never use long relative chains (\`../../..\`).

${cart.stateManagement === 'ZUSTAND' ? `## Zustand

- One store per domain; name \`use<Domain>Store\`.
- Components select narrow slices: \`useAppStore((s) => s.count)\`.
- Async actions live inside the store, setting loading/error state themselves.

` : ''}${cart.query === 'TANSTACK_QUERY' ? `## TanStack Query

- Define a key factory per entity next to its query functions.
- Mutations invalidate via the same factory: \`queryClient.invalidateQueries({ queryKey: todoKeys.all })\`.
- Server state belongs in Query — do not mirror it into ${cart.stateManagement === 'ZUSTAND' ? 'Zustand' : 'local state'}.

` : ''}${cart.router === 'TANSTACK_ROUTER' ? `## TanStack Router

- One file per route under \`src/routes/\`; the Vite plugin regenerates \`routeTree.gen.ts\` — never edit it.
- Route files export \`Route = createFileRoute('<path>')({ component })\`; keep components in their layer and import them.

` : ''}${cart.css === 'TAILWIND' ? `## Tailwind CSS v4

- Theme tokens live in \`src/index.css\` under \`@theme\` — extend there, not in a JS config.
- Prefer semantic class composition in components over @apply.

` : ''}## When unsure

Check the reference implementation (\`src/pages/home${isFsd ? '/' : '.tsx'}\`) first, then the docs (\`docs/INDEX.md\`), then ask.
`;
};

// ---------------------------------------------------------------------------
// Test-author skill (only when a test framework is configured)
// ---------------------------------------------------------------------------

const testAuthorSkillTemplate = (cart: ReactViteCore): string => {
  const slug = projectSlug(cart);
  const hasVitest = cart.testing === 'VITEST';
  return `---
name: ${slug}-test-author
description: Centralized test conventions for ${cart.projectName}. Use when asked to "write a test", "add a spec", "cover this with tests", or fix a failing test. All test code lives under test/ — never inside src/.
---

# ${cart.projectName} Test Conventions

## Layout

\`\`\`
test/
${hasVitest ? '├── unit/              # mirrors src/ layers; <name>.test.tsx\n' : '├── e2e/               # mirrors business flows; <flow>.spec.ts\n'}├── _shared/           # fixtures/, helpers/, mocks/${hasVitest ? '' : ', pages/ (Page Object Models)'}
└── specs/             # paired *.spec.md contracts — documentation, never executed
\`\`\`

## Rules

- Tests go under \`test/\` ONLY — never create __tests__ folders or *.test.* files inside src/.
- Every test file gets a paired contract: \`test/specs/<same-path>/<name>.spec.md\` listing what each case covers and which feature spec (docs/features/) it traces to.
${hasVitest
    ? `- Unit tests import via the \`@/\` alias and explicit vitest imports (\`import { describe, it, expect } from 'vitest'\`).
- Component tests use Testing Library; query by role/label, never by class name.
- Run: \`npm run test:run\` (CI) / \`npm test\` (watch).`
    : `- E2E tests use Page Object Models from \`test/_shared/pages/\`; specs stay thin.
- Run: \`npm run test:e2e\` (starts the dev server automatically).`}
- Test behavior, not implementation; cover the edge cases listed in the feature spec.
`;
};

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

const devAgentTemplate = (cart: ReactViteCore): string => {
  const slug = projectSlug(cart);
  const hasTesting = cart.testing !== 'NOT_USING';
  const testWriterExample = hasTesting
    ? " <example>user: 'Cover the login form with tests' → test-writer, NOT dev <commentary>test authoring belongs to test-writer</commentary></example>"
    : '';
  const delegationRule = hasTesting
    ? '- Never write tests (delegate to test-writer) or docs (delegate to docs-writer); flag when they are needed.'
    : '- Never write docs (delegate to docs-writer); flag when they are needed.';
  return `---
name: dev
description: "Implementation agent for ${cart.projectName} — all feature work and bug fixes under src/. <example>user: 'Add a dark-mode toggle to the header' → dev <commentary>feature work in src/; dev reads the feature spec first, then implements</commentary></example> <example>user: 'The home page crashes on empty data — fix it' → dev <commentary>bug fix inside a documented feature</commentary></example> <example>user: 'Write a spec for the checkout flow' → docs-writer, NOT dev <commentary>doc authoring belongs to docs-writer</commentary></example>${testWriterExample}"
model: sonnet
memory: project
---

You are the implementation agent for ${cart.projectName}.

## Onboarding protocol (in order, before any code)

1. Read \`.claude/agent-memory/dev/MEMORY.md\` — your accumulated gotchas.
2. Read \`docs/INDEX.md\` and the relevant \`docs/features/<feature>/\` spec for the task.
3. Load the \`${slug}-conventions\` skill for layer rules and patterns.
4. Read the code under change.

If no relevant feature spec exists, STOP and tell the user to run the docs-writer agent first.

## Workflow

1. State assumptions and success criteria.
2. Implement the minimum change that satisfies the spec; match existing style.
3. Verify (build${hasTesting ? ' + run the relevant tests' : ''}); report results faithfully.
4. Append newly discovered gotchas/patterns to \`.claude/agent-memory/dev/MEMORY.md\`.

## Hard rules

- Never commit or push — a human does that.
${delegationRule}
- Never edit generated files${cart.router === 'TANSTACK_ROUTER' ? ' (`src/routes/routeTree.gen.ts`)' : ''} or \`docs/INDEX.md\` by hand.
`;
};

const testWriterAgentTemplate = (cart: ReactViteCore): string => {
  const slug = projectSlug(cart);
  return `---
name: test-writer
description: "Test authoring agent for ${cart.projectName} — writes tests and their paired spec.md contracts, only under test/. Runs after docs-writer has produced the feature spec. <example>user: 'Cover the home page with tests' → test-writer <commentary>test authoring from an existing feature spec</commentary></example> <example>user: 'Add edge-case tests for the date validator' → test-writer <commentary>narrow test scope, reads the spec for edge cases</commentary></example> <example>user: 'Fix the validation bug the test caught' → dev, NOT test-writer <commentary>app-code changes belong to dev</commentary></example>"
model: haiku
memory: project
---

You are the test-writing agent for ${cart.projectName}. You write ONLY under \`test/\`.

## Onboarding protocol

1. Read \`.claude/agent-memory/test-writer/MEMORY.md\`.
2. Read the feature spec: \`docs/features/<feature>/<feature>.spec.en.md\` — requirements and edge cases drive the test plan. If it does not exist, STOP and request docs-writer first.
3. Load the \`${slug}-test-author\` skill and \`test/README.md\`.

## Workflow

1. Derive the test plan from the spec's requirements and edge cases.
2. Write tests under ${cart.testing === 'VITEST' ? '`test/unit/` (mirroring src/ layers)' : '`test/e2e/` (mirroring business flows, using Page Objects from `test/_shared/pages/`)'}.
3. Write the paired contract at \`test/specs/<same-path>/<name>.spec.md\`: what each case covers, which feature spec it traces to.
4. Run ${cart.testing === 'VITEST' ? '`npm run test:run`' : '`npm run test:e2e`'} and report results faithfully — including failures.
5. Append lessons to \`.claude/agent-memory/test-writer/MEMORY.md\`.

## Hard rules

- Never create test files inside \`src/\` — \`test/\` only.
- Never edit application code, configs, or docs/ — if a test exposes a bug, report it for the dev agent.
- Never weaken a test to make it pass.
- Never commit or push.
`;
};

// ---------------------------------------------------------------------------
// File map
// ---------------------------------------------------------------------------

export const getClaudeFileMap = (cart: ReactViteCore): FileMap => {
  const hasTesting = cart.testing !== 'NOT_USING';
  return buildClaudeFileMap({
    projectName: cart.projectName,
    slug: projectSlug(cart),
    flowEnum: flowEnum(cart),
    layerEnum: layerEnum(cart),
    reminderTrigger: reminderTrigger(cart),
    claudeMd: claudeMdTemplate(cart),
    conventionsSkill: conventionsSkillTemplate(cart),
    devAgent: devAgentTemplate(cart),
    seedDocs: [{ relativePath: 'docs/features/home/home.spec.en.md', content: docsHomeSpecTemplate(cart) }],
    testing: hasTesting
      ? {
          testWriterAgent: testWriterAgentTemplate(cart),
          testAuthorSkill: testAuthorSkillTemplate(cart),
        }
      : undefined,
  });
};
