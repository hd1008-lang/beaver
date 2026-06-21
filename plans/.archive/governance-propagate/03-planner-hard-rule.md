---
phase: 03
title: planner-hard-rule
status: done
depends_on: [01]
---

## Goal

Add the "non-blocking follow-up work must be filed as backlog entries" hard-rule bullet to `plannerAgentTemplate` in `src/scaffold/shared/claude-setup.ts`, matching the rule already present in the dogfood `.claude/agents/planner.md`.

## Steps

- [ ] Read `src/scaffold/shared/claude-setup.ts` lines 683–690 (the `## Hard rules` block of `plannerAgentTemplate`) to confirm the current last bullet and the closing backtick-quote-semicolon before editing.

- [ ] In `src/scaffold/shared/claude-setup.ts`, locate the `plannerAgentTemplate` function's `## Hard rules` section. After the line:
  ```
  - Never commit or push — a human does that.
  ```
  and before the closing `\`;\n` of the template literal, add the new bullet:
  ```
  - Non-blocking follow-up work (spec gaps, deferred tasks, adjacent improvements) must be filed as a \`backlog/<NNNN>-<slug>.md\` entry (see \`backlog/README.md\`). Do NOT leave follow-up work as prose in a plan's overview or phase files — prose in done plans is archived and lost.
  ```
  The exact current last line of the hard rules block is (line ~689):
  `- Never commit or push — a human does that.`

- [ ] Run `npx tsc --noEmit` from the repo root — must pass with zero errors.

## Verify

1. `npx tsc --noEmit` passes (0 errors).
2. Grep for `Non-blocking follow-up` in `src/scaffold/shared/claude-setup.ts` — must return exactly 1 hit.
3. Diff the hard-rules section of the template against the dogfood `.claude/agents/planner.md` lines 65–72 to confirm they are now identical in wording (ignoring escaped backslashes in the template literal vs. raw text in the dogfood file).

## Notes / risks

- The template literal in `plannerAgentTemplate` uses `\`` as the delimiter; backticks inside must be escaped as `\\\``. The new bullet contains no backtick characters — only single-backtick inline-code spans written as `\\\`backlog/...\\\`` — so apply the standard template-literal escaping used throughout the file.
- Reference: dogfood rule at `.claude/agents/planner.md` line 72.
- Do not add the bullet anywhere else (e.g., `docsWriterAgentTemplate` or `advisorAgentTemplate`) — it is planner-specific.
