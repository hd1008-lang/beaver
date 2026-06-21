---
phase: 01
title: validate-plans-template
status: done
depends_on: []
---

## Goal

Add a `validatePlansMjsTemplate()` function to `src/scaffold/shared/claude-setup.ts` and register it in `buildClaudeFileMap`, so scaffolded projects receive `.claude/scripts/validate-plans.mjs`.

## Steps

- [ ] Read `src/scaffold/shared/claude-setup.ts` lines 897–1061 (the `validateStructureMjsTemplate` block through end of `buildClaudeFileMap`) to confirm exact insertion points before editing.
- [ ] Add `validatePlansMjsTemplate()` as a new `const` function immediately after the closing `};` of `validateStructureMjsTemplate` (around line 1009) in `src/scaffold/shared/claude-setup.ts`. The function takes no arguments and returns a static string — copy the full content of `.claude/scripts/validate-plans.mjs` verbatim as a template literal (the script has no registry-baked values, unlike `validateStructureMjsTemplate`).
- [ ] Register the new file in `buildClaudeFileMap` by adding this line immediately after the `validate-structure.mjs` entry (~line 1030):
  ```
  { relativePath: '.claude/scripts/validate-plans.mjs', content: validatePlansMjsTemplate() },
  ```
- [ ] Run `npx tsc --noEmit` from the repo root — must pass with zero errors.
- [ ] Run `npm run build` — must exit 0.

## Verify

1. `npx tsc --noEmit` passes (0 errors).
2. `npm run build` exits 0.
3. Render a spot-check: in a temporary Node/tsx snippet (or by reading the compiled output), confirm `buildClaudeFileMap` now contains an entry with `relativePath: '.claude/scripts/validate-plans.mjs'`.
4. Confirm the content of that entry starts with `// Mechanically checks plan/backlog consistency` (matches the first comment line of the reference file at `.claude/scripts/validate-plans.mjs`).

## Notes / risks

- `validatePlansMjsTemplate` is a **static** template (no parameters) unlike `validateStructureMjsTemplate` which bakes in the AGENTS registry. The validate-plans script references only `plans/` and `backlog/` directory names which are constant across all project types — no parameterization needed.
- The function body must escape backslash sequences correctly. The pattern used in other static scripts in the file (e.g., `plansReadmeTemplate`, `backlogReadmeTemplate`) is a plain template literal with no internal escaping. Use the same pattern since `validate-plans.mjs` contains no TypeScript interpolation characters that would conflict.
- Double-check that the template literal does not accidentally interpret `${...}` in the script's JS source. The script body contains no `${...}` expressions, so a straight template literal is safe.
- Reference file: `/home/home-linux/project/2026/beaver/.claude/scripts/validate-plans.mjs` (255 lines).
