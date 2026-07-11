---
phase: 01
title: update-skeletons
status: done
depends_on: []
---

## Goal

Add `## Agent Routing` table and PARK RULE to the `claudeMdTemplate` in all three harness-only skeleton files, importing `claudeHarnessTableTemplate` from the shared module.

## Context

The pattern to follow is in `src/scaffold/react-vite/templates/claude-setup.ts` lines 201–210:

```ts
## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
${claudeHarnessTableTemplate()}
| Feature work or bug fix | `dev` | MUST read relevant `docs/features/` spec before coding |

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase `status: blocked`, file a `backlog/<id>` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See `backlog/README.md`.

Each agent has persistent memory at `.claude/agent-memory/<agent>/MEMORY.md` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.
```

Skeleton CLAUDE.md stubs are minimal so the dev row should be simplified (no test-writer row, no "MUST read spec" hardcoding) — but must include the Agent Routing heading, the shared 4-row table, a generic dev row, and the PARK RULE paragraph.

Place the `## Agent Routing` block AFTER `## Docs` and BEFORE the closing template backtick.

## Steps

- [x] Open `src/scaffold/harness-only/templates/generic-skeleton.ts`. Add `claudeHarnessTableTemplate` to the import from `@src/scaffold/shared/claude-setup`. In `claudeMdTemplate`, append `## Agent Routing` table + PARK RULE after the `## Docs` section. Use the simplified dev row: `| Feature work or bug fix | \`dev\` | MUST read \`docs/INDEX.md\` before modifying a documented feature |`.

- [x] Open `src/scaffold/harness-only/templates/react-vite-skeleton.ts`. Same import addition and same CLAUDE.md insertion after `## Docs`. Use the same simplified dev row as above.

- [x] Open `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts`. Same import addition and same CLAUDE.md insertion after `## Docs`. Use the same simplified dev row as above.

- [x] Run `npx tsc --noEmit` to confirm no TypeScript errors across all three modified files and their imports.

- [x] Run `npm run build` to confirm the compiled output is clean.

## Verify

- `npx tsc --noEmit` exits 0.
- `npm run build` exits 0.
- Each of the three skeleton files now imports `claudeHarnessTableTemplate` from `@src/scaffold/shared/claude-setup`.
- Each `claudeMdTemplate` contains `## Agent Routing` and `PARK RULE` text.

## Notes / risks

- `claudeHarnessTableTemplate()` takes no arguments (it is a zero-param function). Call it as `${claudeHarnessTableTemplate()}` inside the template literal.
- The import in all three skeleton files currently reads: `import { buildClaudeFileMap } from '@src/scaffold/shared/claude-setup';` — just add `claudeHarnessTableTemplate` to the named import list.
- Do NOT change the `devAgentTemplate` inside the skeleton files — the Park rule already appears there correctly. The CLAUDE.md body is the missing piece.
- No changes needed to `buildClaudeFileMap`, `ClaudeHarnessParams`, or any shared file.
- Harness-only skeletons are intentionally minimal in conventions and stack details — but the Agent Routing table and PARK RULE are mandatory per `docs/features/claude-harness/claude-harness.spec.en.md` ("Applies to: All project types where Claude Harness is offered (react-vite, chrome-extension, harness-only skeletons...)").
