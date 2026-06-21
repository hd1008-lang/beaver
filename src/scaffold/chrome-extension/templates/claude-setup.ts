import { ChromeExtensionCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';
import { buildClaudeFileMap, claudeHarnessTableTemplate } from '@src/scaffold/shared/claude-setup';

// Chrome-extension-specific pieces of the Claude Code harness (CLAUDE.md,
// conventions skill, dev agent). Project-agnostic pieces (docs tooling,
// settings, docs skill, docs-writer) live in @src/scaffold/shared/claude-setup.
// No test framework option exists for this project type → no test-writer.

const projectSlug = (cart: ChromeExtensionCore): string =>
  cart.projectName.toLowerCase().replace(/_/g, '-');

const layerEnum = (cart: ChromeExtensionCore): string[] => [
  'popup',
  'components',
  'hooks',
  'lib',
  ...(cart.stateManagement === 'ZUSTAND' ? ['stores'] : []),
  'types',
  'utils',
  '_cross',
];

const flowEnum = (cart: ChromeExtensionCore): string[] => [
  'ui',
  'data',
  ...(cart.stateManagement === 'ZUSTAND' ? ['state'] : []),
  'extension',
  'infra',
  'architecture',
  'onboarding',
  '_meta',
];

const reminderTrigger = (cart: ChromeExtensionCore): string =>
  `popup|manifest${cart.stateManagement === 'ZUSTAND' ? '|store|state' : ''}${cart.query === 'TANSTACK_QUERY' ? '|query|fetch' : ''}`;

// ---------------------------------------------------------------------------
// CLAUDE.md
// ---------------------------------------------------------------------------

const claudeMdTemplate = (cart: ChromeExtensionCore): string => {
  const hasZustand = cart.stateManagement === 'ZUSTAND';
  const hasQuery = cart.query === 'TANSTACK_QUERY';
  const slug = projectSlug(cart);

  const stack = [
    'React 19, TypeScript 5.8, Vite 6',
    'Chrome Extension Manifest V3 (popup-only)',
    hasZustand ? 'Zustand v5.0.5' : null,
    hasQuery ? 'TanStack Query v5.74.4' : null,
    cart.css === 'TAILWIND' ? 'Tailwind CSS v4.1.3' : null,
    cart.linter === 'BIOME' ? 'Biome v1.9.4' : cart.linter === 'ESLINT' ? 'ESLint v9' : null,
  ].filter(Boolean);

  const commands = [
    '- `npm run dev` — develop the popup as a normal Vite page (http://localhost:5173)',
    '- `npm run build` — type-check + production build into `dist/`',
    '- `npm run build-extension` — build + copy `manifest.json` into `dist/`; load `dist/` as an unpacked extension at chrome://extensions',
    cart.linter !== 'NOT_USING' ? '- `npm run lint` — lint code' : null,
    '- `node .claude/scripts/build-docs-index.mjs` — regenerate docs/INDEX.md (run after any doc change)',
    '- `node .claude/scripts/lint-docs-frontmatter.mjs` — validate docs frontmatter (CI-ready, exits non-zero on violation)',
    '- `node .claude/scripts/validate-plans.mjs` — check plan/backlog consistency (table↔frontmatter, archived, ID gaps, two-way links)',
  ].filter(Boolean);

  const keyPatterns: string[] = [
    `**Popup lifecycle — the popup unmounts when it closes:**
React state dies with the popup window. Anything that must survive a close (settings, session data) belongs in \`chrome.storage\`, not in component state${hasZustand ? ' or the Zustand store' : ''}.`,
  ];
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

  return `# ${cart.projectName}

## Behavioral Guidelines

**Think Before Coding** — state assumptions explicitly; if multiple interpretations exist, present them; if something is unclear, stop and ask.
**Simplicity First** — minimum code that solves the problem; no speculative features, abstractions, or configurability.
**Surgical Changes** — touch only what the request requires; match existing style; every changed line traces to the request.
**Goal-Driven Execution** — turn tasks into verifiable success criteria before starting; loop until verified.

## Project Overview

${cart.productDescription}

${stack.map((s) => `- ${s}`).join('\n')}

This is a **popup-only MV3 extension**: \`index.html\` → \`src/main.tsx\` → \`src/App.tsx\` is the popup root. No background service worker or content scripts are configured — adding one requires registering it in \`manifest.json\` AND adding a Rollup input in \`vite.config.ts\`.

## Commands

${commands.join('\n')}

## Architecture

\`\`\`
manifest.json  → MV3 source of truth (root of the repo)
src/App.tsx    → popup root component
components     → shared presentational components
hooks          → shared React hooks
lib            → third-party wrappers / configured clients
${hasZustand ? 'stores         → global state (Zustand)\n' : ''}types          → shared TypeScript types
utils          → pure utility functions
\`\`\`

**Hard rules:**
- \`manifest.json\` at the repo root is the single source of truth — NEVER edit \`dist/manifest.json\` (it is a build artifact copied by \`npm run build-extension\`).
- Shared folders (components/, hooks/, lib/, utils/) must stay feature-agnostic.
- Keep components presentational; data fetching and chrome.* API calls live in hooks or lib/.

## Key Patterns

${keyPatterns.join('\n\n')}

## Import Aliases

\`@/\` (src root), \`@components\`, \`@hooks\`, \`@lib\`, \`@types\`, \`@utils\` — defined in \`vite.config.ts\`. Never use long relative chains (\`../../..\`).

## Anti-Patterns

| Anti-pattern | Correct approach |
|---|---|
| Editing \`dist/manifest.json\` | Edit root \`manifest.json\`; rebuild with \`npm run build-extension\` |
| Persisting data in React state${hasZustand ? '/Zustand' : ''} that must survive popup close | Use \`chrome.storage\` |
| \`useEffect\` for derived state | Compute during render or use \`useMemo\` |

> Fill this table from real review feedback over time — it is the highest-leverage section for code quality.

## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
${claudeHarnessTableTemplate()}
| Feature work or bug fix in \`src/\` or \`manifest.json\` | \`dev\` | MUST read relevant \`docs/features/\` spec before coding |

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase \`status: blocked\`, file a \`backlog/<id>\` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See \`backlog/README.md\`.

Each agent has persistent memory at \`.claude/agent-memory/<agent>/MEMORY.md\` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.

## Task Documentation Convention

After any non-trivial fix or new pattern: copy \`docs/_template.md\`, fill the frontmatter, save as \`docs/features/<feature>/<topic>.en.md\` (or \`docs/architecture/\` for cross-cutting topics), then run \`node .claude/scripts/build-docs-index.mjs\` and commit the doc together with \`INDEX.md\`. Validate with \`node .claude/scripts/lint-docs-frontmatter.mjs\`.

## Further Reading + DOCS-FIRST RULE

Skills: \`.claude/skills/${slug}-conventions\` (architecture depth), \`.claude/skills/${slug}-docs\` (how to query the knowledge base).

**DOCS-FIRST RULE:** for any request to describe, explain, or modify a documented feature, you MUST grep \`docs/\` frontmatter and read the relevant docs BEFORE opening source files — and state what the docs already covered. Start at \`docs/INDEX.md\`.

**Operating loop:** finish a non-trivial task → write a doc from \`docs/_template.md\` → rebuild \`INDEX.md\` → commit together; agents update their \`MEMORY.md\` when they learn a gotcha.
`;
};

// ---------------------------------------------------------------------------
// Seed doc — docs/features/popup/popup.spec.en.md
// ---------------------------------------------------------------------------

const docsPopupSpecTemplate = (cart: ChromeExtensionCore): string => {
  const today = new Date().toISOString().slice(0, 10);
  return `---
title: Popup — Feature Spec
feature: popup
flow: ui
layer: popup
status: draft
lang: en
related: []
keywords: [popup, manifest]
updated: ${today}
---

# Popup — Feature Spec

## Context
Starter popup generated by the scaffold. Replace this spec with the real requirements for ${cart.projectName}'s popup.

## Root Cause / Key Finding
_(For feature specs, use this section for key constraints or discoveries.)_

## Solution / Pattern
- Requirements: [list what the popup must do]
- UI/UX: [screens and interactions]
- Data: [data structures, chrome.storage keys, API requirements]
- Edge cases: [what must not break — remember the popup unmounts on close]

## Key Decisions
_(Trade-offs made and alternatives rejected.)_

## Related Files
- src/App.tsx
- manifest.json
`;
};

// ---------------------------------------------------------------------------
// Conventions skill
// ---------------------------------------------------------------------------

const conventionsSkillTemplate = (cart: ChromeExtensionCore): string => {
  const slug = projectSlug(cart);
  const hasZustand = cart.stateManagement === 'ZUSTAND';
  return `---
name: ${slug}-conventions
description: Coding conventions and architecture rules for ${cart.projectName} (Chrome extension, MV3 popup). Use when writing or reviewing ANY code under src/ — components, hooks${hasZustand ? ', stores' : ''}, or styling — or when touching manifest.json. Triggers on tasks mentioning popup, manifest, components, naming, imports, or project structure.
---

# ${cart.projectName} Conventions

In-depth companion to CLAUDE.md. CLAUDE.md states the rules; this skill explains how to apply them.

## Structure

- Popup root: \`src/App.tsx\` (entry: \`index.html\` → \`src/main.tsx\`).
- Shared folders (components/, hooks/, lib/, utils/) must stay feature-agnostic.
- \`manifest.json\` at the repo root is the MV3 source of truth; \`npm run build-extension\` copies it into \`dist/\` — never edit the copy.
- No background service worker / content scripts are configured. Adding one = register it in \`manifest.json\` + add a Rollup input in \`vite.config.ts\`.

## Import aliases

\`@/\`, \`@components\`, \`@hooks\`, \`@lib\`, \`@types\`, \`@utils\` (see \`vite.config.ts\`). Never use long relative chains (\`../../..\`).

## Chrome APIs

- Wrap \`chrome.*\` calls in \`lib/\` or hooks — components stay presentational.
- State that must survive popup close goes in \`chrome.storage\`, not React state${hasZustand ? ' or Zustand' : ''}.

${hasZustand ? `## Zustand

- One store per domain; name \`use<Domain>Store\`.
- Components select narrow slices: \`useAppStore((s) => s.count)\`.
- Async actions live inside the store, setting loading/error state themselves.

` : ''}${cart.query === 'TANSTACK_QUERY' ? `## TanStack Query

- Define a key factory per entity next to its query functions.
- Mutations invalidate via the same factory: \`queryClient.invalidateQueries({ queryKey: todoKeys.all })\`.
- Server state belongs in Query — do not mirror it into ${hasZustand ? 'Zustand' : 'local state'}.

` : ''}${cart.css === 'TAILWIND' ? `## Tailwind CSS v4

- Theme tokens live in \`src/index.css\` under \`@theme\` — extend there, not in a JS config.
- Prefer semantic class composition in components over @apply.

` : ''}## When unsure

Check \`src/App.tsx\` first, then the docs (\`docs/INDEX.md\`), then ask.
`;
};

// ---------------------------------------------------------------------------
// Dev agent
// ---------------------------------------------------------------------------

const devAgentTemplate = (cart: ChromeExtensionCore): string => {
  const slug = projectSlug(cart);
  return `---
name: dev
description: "Implementation agent for ${cart.projectName} — all feature work and bug fixes under src/ and manifest.json. <example>user: 'Add a settings toggle to the popup' → dev <commentary>feature work in src/; dev reads the feature spec first, then implements</commentary></example> <example>user: 'The popup crashes on empty data — fix it' → dev <commentary>bug fix inside a documented feature</commentary></example> <example>user: 'Write a spec for the options page' → docs-writer, NOT dev <commentary>doc authoring belongs to docs-writer</commentary></example>"
model: sonnet
memory: project
---

You are the implementation agent for ${cart.projectName}.

## Onboarding protocol (in order, before any code)

1. Read \`.claude/agent-memory/dev/MEMORY.md\` — your accumulated gotchas.
2. Read \`docs/INDEX.md\` and the relevant \`docs/features/<feature>/\` spec for the task.
3. Load the \`${slug}-conventions\` skill for structure rules and patterns.
4. Read the code under change.

If no relevant feature spec exists, STOP and tell the user to run the docs-writer agent first.

## Workflow

1. State assumptions and success criteria.
2. Implement the minimum change that satisfies the spec; match existing style.
3. Verify (build; for manifest/extension changes run \`npm run build-extension\` and report what to check at chrome://extensions); report results faithfully.
4. Append newly discovered gotchas/patterns to \`.claude/agent-memory/dev/MEMORY.md\`.

## Park rule (anti-loop)

If a step fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, out-of-scope), STOP — do not retry a third time. File a \`backlog/<id>\` entry per \`backlog/README.md\` (its **Tried** section must list what already failed so it isn't repeated), set the owning phase \`status: blocked\` and link both ways, tell the user it was parked, then continue with the next workable task. Don't loop, don't silently skip.

## Hard rules

- Never commit or push — a human does that.
- Never write docs (delegate to docs-writer); flag when they are needed.
- Never edit \`dist/\` (build artifact, including \`dist/manifest.json\`) or \`docs/INDEX.md\` by hand.
`;
};

// ---------------------------------------------------------------------------
// File map
// ---------------------------------------------------------------------------

export const getClaudeFileMap = (cart: ChromeExtensionCore): FileMap =>
  buildClaudeFileMap({
    projectName: cart.projectName,
    slug: projectSlug(cart),
    productDescription: cart.productDescription,
    flowEnum: flowEnum(cart),
    layerEnum: layerEnum(cart),
    reminderTrigger: reminderTrigger(cart),
    claudeMd: claudeMdTemplate(cart),
    conventionsSkill: conventionsSkillTemplate(cart),
    devAgent: devAgentTemplate(cart),
    seedDocs: [{ relativePath: 'docs/features/popup/popup.spec.en.md', content: docsPopupSpecTemplate(cart) }],
  });
