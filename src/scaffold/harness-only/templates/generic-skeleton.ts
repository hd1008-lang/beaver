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

## Docs

- \`docs/INDEX.md\` — knowledge base index (auto-generated)
- \`node scripts/build-docs-index.mjs\` — regenerate index after adding a doc
- \`node scripts/lint-docs-frontmatter.mjs\` — validate docs frontmatter

## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
${claudeHarnessTableTemplate()}
| Feature work or bug fix | \`dev\` | MUST read \`docs/INDEX.md\` before modifying a documented feature |

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase \`status: blocked\`, file a \`backlog/<id>\` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See \`backlog/README.md\`.

Each agent has persistent memory at \`.agents/memory/<agent>/MEMORY.md\` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.
`;

const conventionsSkillTemplate = (cart: HarnessOnlyCore): string =>
  `---
name: ${slug(cart)}-conventions
description: Coding conventions for ${cart.projectName}. Run \`claude /init\` to replace with project-specific content.
---

# ${cart.projectName} — Conventions

> Run \`claude /init\` in this project to generate detailed, codebase-specific conventions.
`;

const devAgentTemplate = (cart: HarnessOnlyCore): string =>
  `---
name: dev
description: "Implementation agent for ${cart.projectName}."
model: sonnet
---

You are the implementation agent for ${cart.projectName}.

## Onboarding

1. Read \`.agents/memory/dev/MEMORY.md\`.
2. Read \`CLAUDE.md\` for project overview.
3. Load the \`${slug(cart)}-conventions\` skill.

## Park rule (anti-loop)

If a step fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, out-of-scope), STOP — do not retry a third time. File a \`backlog/<id>\` entry per \`backlog/README.md\` (its **Tried** section must list what already failed so it isn't repeated), set the owning phase \`status: blocked\` and link both ways, tell the user it was parked, then continue with the next workable task. Don't loop, don't silently skip.

## Hard rules

- Never commit or push.
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

const aiToHarness = (ai: HarnessOnlyCore['ai']): 'claude' | 'codex' | 'both' => {
  if (ai === 'CODEX') return 'codex';
  if (ai === 'BOTH') return 'both';
  return 'claude';
};

export const getGenericHarnessFileMap = (cart: HarnessOnlyCore): FileMap =>
  buildClaudeFileMap({
    projectName: cart.projectName,
    slug: slug(cart),
    productDescription: cart.productDescription,
    harness: aiToHarness(cart.ai),
    flowEnum: ['ui', 'data', 'infra', '_meta'],
    layerEnum: ['src', '_cross'],
    reminderTrigger: 'home',
    claudeMd: claudeMdTemplate(cart),
    conventionsSkill: conventionsSkillTemplate(cart),
    devAgent: devAgentTemplate(cart),
    seedDocs: seedDocsTemplate(cart),
  });
