---
phase: 02
title: Per-type — park rule in dev agent and CLAUDE.md
status: done
depends_on: [01]
---

## Goal

Every scaffolded project's dev agent and CLAUDE.md include the park rule (anti-loop) section, matching what the repo's `.claude/agents/dev.md` and `CLAUDE.md` now contain.

## Context

Relevant spec: `docs/architecture/agent-workflow.en.md` (park rule definition).

Gaps to close — 6 files, 2 kinds of change each:

**Dev agent — missing "## Park rule (anti-loop)" section**

The repo's `.claude/agents/dev.md` (lines 26-28) has:
```
## Park rule (anti-loop)

If a step fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, out-of-scope), STOP — do not retry a third time. File a `backlog/<id>` entry per `backlog/README.md` (its **Tried** section must list what already failed so it isn't repeated), set the owning phase `status: blocked` and link both ways, tell the user it was parked, then continue with the next workable task. Don't loop, don't silently skip.
```

This is absent from all six `devAgentTemplate` functions:
- `src/scaffold/react-vite/templates/claude-setup.ts` → `devAgentTemplate` (line 362)
- `src/scaffold/chrome-extension/templates/claude-setup.ts` → `devAgentTemplate` (line 264)
- `src/scaffold/harness-only/templates/generic-skeleton.ts` → `devAgentTemplate` (line 32)
- `src/scaffold/harness-only/templates/react-vite-skeleton.ts` → `devAgentTemplate` (line 51)
- `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts` → `devAgentTemplate`

**CLAUDE.md — missing planner row and park-rule mention**

The two full project-type files (react-vite, chrome-extension) emit a `claudeMdTemplate`. Currently:
- The "Agent Routing" table has no planner row. The repo's `CLAUDE.md` has a planner row: `| Decomposing a story into a resumable, multi-phase implementation plan | \`planner\` | owns \`plans/\`; writes phase files only, never code (see \`plans/README.md\`) |`
- There is no PARK RULE line under or near the agent routing table. The repo's `CLAUDE.md` has: `**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice…`

The harness-only skeleton CLAUDE.md templates are minimal stubs (by design — they say "run \`claude /init\`"), so they do NOT need a planner row or park-rule line. Only the full-featured react-vite and chrome-extension claudeMdTemplate functions need updating.

## Strategy — where to add things

**Dev agent (all 6 files):** Insert the "## Park rule (anti-loop)" section between the existing "## Workflow" and "## Hard rules" sections. The wording is identical across all project types; no cart-conditioning needed.

**CLAUDE.md planner row (react-vite + chrome-extension only):** In `claudeMdTemplate`, extend the "Agent Routing" table to add a planner row. The row should read:
`| Decomposing a story into a resumable plan | \`planner\` | owns \`plans/\`; writes phase files only, never code |`
Place it after the existing dev row.

**CLAUDE.md park rule (react-vite + chrome-extension only):** Add a bold `**PARK RULE (anti-loop):**` inline after the agent-routing table (before the "Each agent has persistent memory…" sentence that currently follows it). Use the same condensed wording as the repo's CLAUDE.md: when a step fails twice and the cause is unfixable right now, STOP — set the phase `status: blocked`, file a `backlog/<id>` entry, link both ways, tell the user, move on.

## Steps

- [x] `src/scaffold/react-vite/templates/claude-setup.ts` — in `devAgentTemplate`, add "## Park rule (anti-loop)" section between the Workflow and Hard rules sections. Copy the exact paragraph from `.claude/agents/dev.md` lines 26-28, with backtick escaping for the template literal.

- [x] `src/scaffold/chrome-extension/templates/claude-setup.ts` — identical change to its `devAgentTemplate`.

- [x] `src/scaffold/harness-only/templates/generic-skeleton.ts` — identical change to its `devAgentTemplate`.

- [x] `src/scaffold/harness-only/templates/react-vite-skeleton.ts` — identical change to its `devAgentTemplate`.

- [x] `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts` — identical change to its `devAgentTemplate`. (Read the file first to confirm the exact function structure before editing.)

- [x] `src/scaffold/react-vite/templates/claude-setup.ts` — in `claudeMdTemplate`, extend the "Agent Routing" table to add a planner row after the dev row, and add a `**PARK RULE (anti-loop):**` line immediately after the table (before the `Each agent has persistent memory` sentence).

- [x] `src/scaffold/chrome-extension/templates/claude-setup.ts` — identical CLAUDE.md changes.

## Verify

```bash
cd /home/home-linux/project/2026/beaver
npx tsc --noEmit
npm run build
```

Both must exit 0. Then spot-check each project type:

```bash
npx tsx -e "
import { getClaudeFileMap } from './src/scaffold/react-vite/templates/claude-setup';
const cart = {
  type: 'ReactVite',
  projectName: 'test-rv',
  layout: 'FSD',
  router: 'NOT_USING',
  stateManagement: 'NOT_USING',
  query: 'NOT_USING',
  css: 'NOT_USING',
  linter: 'NOT_USING',
  testing: 'NOT_USING',
};
const files = getClaudeFileMap(cart as any);
const dev = files.find(f => f.relativePath === '.claude/agents/dev.md');
const claude = files.find(f => f.relativePath === 'CLAUDE.md');
console.log('[react-vite] dev park rule:', dev?.content.includes('Park rule'));
console.log('[react-vite] CLAUDE.md planner row:', claude?.content.includes('planner'));
console.log('[react-vite] CLAUDE.md park rule:', claude?.content.includes('PARK RULE'));
"
```

```bash
npx tsx -e "
import { getClaudeFileMap } from './src/scaffold/chrome-extension/templates/claude-setup';
const cart = {
  type: 'ChromeExtension',
  projectName: 'test-ce',
  stateManagement: 'NOT_USING',
  query: 'NOT_USING',
  css: 'NOT_USING',
  linter: 'NOT_USING',
};
const files = getClaudeFileMap(cart as any);
const dev = files.find(f => f.relativePath === '.claude/agents/dev.md');
const claude = files.find(f => f.relativePath === 'CLAUDE.md');
console.log('[chrome-ext] dev park rule:', dev?.content.includes('Park rule'));
console.log('[chrome-ext] CLAUDE.md planner row:', claude?.content.includes('planner'));
console.log('[chrome-ext] CLAUDE.md park rule:', claude?.content.includes('PARK RULE'));
"
```

```bash
npx tsx -e "
import { getGenericHarnessFileMap } from './src/scaffold/harness-only/templates/generic-skeleton';
import { getReactViteHarnessFileMap } from './src/scaffold/harness-only/templates/react-vite-skeleton';
const cart = { type: 'HarnessOnly', projectName: 'test-ho', targetDirectory: '/tmp/test', projectType: 'GENERIC' } as any;
const g = getGenericHarnessFileMap(cart);
const rv = getReactViteHarnessFileMap(cart);
const gDev = g.find(f => f.relativePath === '.claude/agents/dev.md');
const rvDev = rv.find(f => f.relativePath === '.claude/agents/dev.md');
console.log('[generic harness] dev park rule:', gDev?.content.includes('Park rule'));
console.log('[react-vite harness] dev park rule:', rvDev?.content.includes('Park rule'));
"
```

All `console.log` lines must print `true`.

## Notes / risks

- The harness-only CLAUDE.md stubs are intentionally minimal. Do NOT add a planner row or park-rule line to them — they instruct the user to run `claude /init` instead.
- The park-rule paragraph is identical across all dev-agent templates. Keep it literally the same rather than introducing a shared helper — the templates are already pure string functions and a helper would add indirection for minimal gain.
- `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts` was not read during planning (the git status shows it as a new `AM` file). Read it before editing to confirm the `devAgentTemplate` function exists and its surrounding structure. If the file is a stub without a `devAgentTemplate`, document the discrepancy and park rather than guess.
- Rollback: all changes are additive string insertions inside existing template literals. If tsc fails, revert only the affected template string — none of the changes alter function signatures or exported types.
