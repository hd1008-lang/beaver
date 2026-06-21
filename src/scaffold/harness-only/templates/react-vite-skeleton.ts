import { HarnessOnlyCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';
import { buildClaudeFileMap, claudeHarnessTableTemplate } from '@src/scaffold/shared/claude-setup';

const slug = (cart: HarnessOnlyCore): string =>
  cart.projectName.toLowerCase().replace(/_/g, '-');

const claudeMdTemplate = (cart: HarnessOnlyCore): string =>
  `# ${cart.projectName}

> This project uses a Claude Code harness for AI-assisted development.
> Run \`claude /init\` to auto-generate a detailed CLAUDE.md tailored to this codebase.

## Project Overview

${cart.productDescription}

## Quick start

\`\`\`bash
npm run dev
npm run build
\`\`\`

## Docs

- \`docs/INDEX.md\` — knowledge base index (auto-generated)
- \`node .claude/scripts/build-docs-index.mjs\` — regenerate index after adding a doc
- \`node .claude/scripts/lint-docs-frontmatter.mjs\` — validate docs frontmatter

## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
${claudeHarnessTableTemplate()}
| Feature work or bug fix | \`dev\` | MUST read \`docs/INDEX.md\` before modifying a documented feature |

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase \`status: blocked\`, file a \`backlog/<id>\` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See \`backlog/README.md\`.

Each agent has persistent memory at \`.claude/agent-memory/<agent>/MEMORY.md\` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.
`;

const conventionsSkillTemplate = (cart: HarnessOnlyCore): string =>
  `---
name: ${slug(cart)}-conventions
description: Coding conventions and architecture rules for ${cart.projectName} (React + Vite). Use when writing or reviewing ANY code in this project.
---

# ${cart.projectName} — Conventions

## Stack

React 19, TypeScript, Vite

## Architecture

This project uses a feature-slice structure. Check the source layout and run \`claude /init\` to generate detailed conventions.

## General rules

- TypeScript strict mode — no \`any\`, no unchecked assertions
- Co-locate component, hook, and type in the same folder
- Barrel exports via \`index.ts\`
`;

const devAgentTemplate = (cart: HarnessOnlyCore): string =>
  `---
name: dev
description: "Implementation agent for ${cart.projectName}. Use for feature work and bug fixes."
model: sonnet
---

You are the implementation agent for ${cart.projectName} (React + Vite project).

## Onboarding

1. Read \`.claude/agent-memory/dev/MEMORY.md\`.
2. Read \`CLAUDE.md\` for project overview and commands.
3. Load the \`${slug(cart)}-conventions\` skill.

## Park rule (anti-loop)

If a step fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, out-of-scope), STOP — do not retry a third time. File a \`backlog/<id>\` entry per \`backlog/README.md\` (its **Tried** section must list what already failed so it isn't repeated), set the owning phase \`status: blocked\` and link both ways, tell the user it was parked, then continue with the next workable task. Don't loop, don't silently skip.

## Hard rules

- Never commit or push.
- Run lint and type-check before reporting a task done.
- Docs-first: check \`docs/INDEX.md\` before modifying a documented feature.
`;

const seedDocsTemplate = (cart: HarnessOnlyCore): FileMap => [
  {
    relativePath: 'docs/features/home/home.spec.en.md',
    content: `---
title: Home — Feature Spec
feature: home
flow: ui
layer: _cross
status: draft
lang: en
related: []
keywords: [home]
updated: ${new Date().toISOString().slice(0, 10)}
---

# Home

## Context

Starting feature doc for ${cart.projectName}. Replace with real content.

## Solution / Pattern

_To be documented._
`,
  },
];

export const getReactViteHarnessFileMap = (cart: HarnessOnlyCore): FileMap =>
  buildClaudeFileMap({
    projectName: cart.projectName,
    slug: slug(cart),
    productDescription: cart.productDescription,
    flowEnum: ['ui', 'data', 'infra', 'architecture', '_meta'],
    layerEnum: ['app', 'pages', 'features', 'entities', 'shared', '_cross'],
    reminderTrigger: 'home|landing',
    claudeMd: claudeMdTemplate(cart),
    conventionsSkill: conventionsSkillTemplate(cart),
    devAgent: devAgentTemplate(cart),
    seedDocs: seedDocsTemplate(cart),
  });
