import { HarnessOnlyCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';
import { buildHarnessFileMap } from '@src/scaffold/shared/harness-setup';

const slug = (cart: HarnessOnlyCore): string =>
  cart.projectName.toLowerCase().replace(/_/g, '-');

// Minimal AGENTS.md project-sections stub — conventions/stack only. Agent
// workflow (routing table, PARK RULE, DOCS-FIRST) is guaranteed by the
// canonical harness-assets/AGENTS.md skeleton, never thinned here.
const projectSectionsTemplate = (): string =>
  `Run \`claude /init\` (or your provider's equivalent) to auto-generate detailed
project sections tailored to this codebase — merge the output into this file's
\`## Project Overview\` area. \`CLAUDE.md\` stays a thin \`@AGENTS.md\` adapter.

## Quick start

\`\`\`bash
npm run dev
npm run build-extension   # loads dist/ as unpacked extension at chrome://extensions
\`\`\`

## Docs

- \`docs/INDEX.md\` — knowledge base index (auto-generated)
- \`node scripts/build-docs-index.mjs\` — regenerate index after adding a doc
- \`node scripts/lint-docs-frontmatter.mjs\` — validate docs frontmatter`;

const extraRoutingRowsTemplate = (): string =>
  '\n| Feature work or bug fix | `dev` | MUST read `docs/INDEX.md` before modifying a documented feature |';

const conventionsSkillTemplate = (cart: HarnessOnlyCore): string =>
  `---
name: ${slug(cart)}-conventions
description: Coding conventions and architecture rules for ${cart.projectName} (Chrome Extension). Use when writing or reviewing ANY code in this project.
---

# ${cart.projectName} — Conventions

## Stack

React 19, TypeScript, Vite, Chrome Extension Manifest V3

## Architecture

Popup-centric structure. Check the source layout and run \`claude /init\` to generate detailed conventions.

## General rules

- TypeScript strict mode — no \`any\`, no unchecked assertions
- Manifest permissions: request only what's needed
- No cross-origin requests from content scripts without explicit host permissions
`;

const devAgentTemplate = (cart: HarnessOnlyCore): string =>
  `---
name: dev
description: "Implementation agent for ${cart.projectName}. Use for feature work and bug fixes."
model: sonnet
---

You are the implementation agent for ${cart.projectName} (Chrome Extension project).

## Onboarding

1. Read \`.agents/memory/dev/MEMORY.md\`.
2. Read \`AGENTS.md\` for project overview and commands.
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
    relativePath: 'docs/features/popup/popup.spec.en.md',
    content: `---
title: Popup — Feature Spec
feature: popup
flow: ui
layer: popup
status: draft
lang: en
related: []
keywords: [popup]
updated: ${new Date().toISOString().slice(0, 10)}
---

# Popup

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

export const getChromeExtensionHarnessFileMap = (cart: HarnessOnlyCore): FileMap =>
  buildHarnessFileMap({
    projectName: cart.projectName,
    slug: slug(cart),
    productDescription: cart.productDescription,
    harness: aiToHarness(cart.ai),
    flowEnum: ['ui', 'data', 'extension', 'infra', '_meta'],
    layerEnum: ['popup', 'components', 'hooks', 'lib', 'utils', '_cross'],
    reminderTrigger: 'popup|manifest',
    projectSections: projectSectionsTemplate(),
    extraRoutingRows: extraRoutingRowsTemplate(),
    conventionsSkill: conventionsSkillTemplate(cart),
    devAgent: devAgentTemplate(cart),
    seedDocs: seedDocsTemplate(cart),
  });
