---
name: beaver-conventions
description: Coding conventions and architecture rules for beaver, the CLI scaffolding tool. Use when writing or reviewing ANY code under src/ — menu options, cart fields, scaffold templates, project types. Triggers on tasks mentioning menu, cart, scaffold, template, project type, or pinned versions.
---

# beaver Conventions

In-depth companion to AGENTS.md. AGENTS.md states the rules; this skill explains how to apply them. The authoritative checklists live in AGENTS.md — read the referenced sections, do not work from memory.

## Core architecture (see AGENTS.md "Architecture")

- Entry: `src/index.ts` → menu system `src/options/` → cart accumulates selections → `src/scaffold/<project-type>/` generates files.
- Path aliases: `@src/*` → `src/*`, `@utils/*` → `src/utils/*`.
- The cart is a discriminated union (`src/types/index.ts`): every `menu*` function guards on `cart.type` before writing a field.

## Templates

- Templates are pure functions returning strings — no side effects, no fs access.
- Pinned versions only: when adding a dependency to a generated project, pin the exact version and add it to the AGENTS.md versions table.
- Generated content is strictly cart-driven: never mention a library the user did not select (this includes docs enums, agent files, and skill descriptions emitted by harness-setup templates).
- Shared Claude-harness pieces live in `src/scaffold/shared/harness-setup.ts` (`buildHarnessFileMap`); each project type renders its own project sections / conventions skill / dev agent and passes them in via `HarnessParams`.

## Checklists (follow AGENTS.md verbatim)

- New project type → AGENTS.md section "Adding New Project Types".
- New react-vite menu option → AGENTS.md section "Adding New Options to React + Vite".
- New option that affects the Claude harness → also thread it through the relevant `harness-setup.ts` conditionals (AGENTS.md project sections, conventions skill, flow/layer enums, reminder trigger).

## Verification pattern

Render templates with a throwaway script instead of running the interactive CLI:
```bash
npx tsx -e "import { getHarnessFileMap } from '@src/scaffold/react-vite/templates/harness-setup'; console.log(getHarnessFileMap({...} as any).map(f => f.relativePath).join('\n'))"
```

## Plans & backlog commands

```bash
# Check plan/backlog health (phase table sync, backlog ID uniqueness, two-way links)
node scripts/validate-plans.mjs
```

Run after updating any phase frontmatter or creating/closing backlog entries.

## When unsure

Check AGENTS.md first, then the docs (`docs/INDEX.md`), then ask.
