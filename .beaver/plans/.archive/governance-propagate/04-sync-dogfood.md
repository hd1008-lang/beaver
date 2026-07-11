---
phase: 04
title: sync-dogfood
status: done
depends_on: [01, 02, 03]
---

## Goal

Verify parity between the scaffold template output and beaver's own dogfood `.claude/` directory, and archive this plan once all checks pass.

## Steps

- [ ] Render the template output for the `validate-plans.mjs` script by running:
  ```
  node -e "
  const { buildClaudeFileMap } = require('./dist/scaffold/shared/claude-setup.js');
  // Use a minimal params object to render the shared file map
  " 
  ```
  Alternative (simpler): diff the raw template function output by reading the `validatePlansMjsTemplate` return value against `.claude/scripts/validate-plans.mjs`.
  Concretely: after `npm run build`, confirm `.claude/scripts/validate-plans.mjs` (dogfood) and the string returned by `validatePlansMjsTemplate()` in the compiled output are character-for-character identical. The easiest check: `grep -c "Mechanically checks plan/backlog consistency" .claude/scripts/validate-plans.mjs` should return `1` — confirms the dogfood file IS the reference source that was copied into the template.

- [ ] Verify `.claude/agents/planner.md` (dogfood) hard-rules section now matches what `plannerAgentTemplate` emits. Specifically confirm that both contain the bullet starting with "Non-blocking follow-up work":
  ```
  grep "Non-blocking follow-up" .claude/agents/planner.md
  grep "Non-blocking follow-up" src/scaffold/shared/claude-setup.ts
  ```
  Both must return 1 hit.

- [ ] Verify the CLAUDE.md commands line for a scaffolded project: render `buildClaudeFileMap` output (or read the react-vite `commands` array) and confirm `validate-plans.mjs` appears in the commands block of both react-vite and chrome-extension templates:
  ```
  grep "validate-plans" src/scaffold/react-vite/templates/claude-setup.ts
  grep "validate-plans" src/scaffold/chrome-extension/templates/claude-setup.ts
  ```
  Both must return 1 hit.

- [ ] Create `backlog/0002-harness-spec-gap-validate-plans.md` (dev scope — planner cannot write to `backlog/`). Content: record that (a) `validate-plans.mjs` is absent from `docs/features/claude-harness/claude-harness.spec.en.md`'s "Related Files" and "Validator" coverage, and (b) `plansReadmeTemplate()` in `src/scaffold/shared/claude-setup.ts` is missing the "Plan lifecycle and archival" section (compare with `plans/README.md` lines 68–73). `source: plans/governance-propagate/00-overview.md`, `severity: low`.

- [ ] Archive the plan: move `plans/governance-propagate/` to `plans/.archive/governance-propagate/`. Run `node .claude/scripts/validate-plans.mjs` — must pass (no errors, possibly 0 warnings once the plan is archived).

## Verify

1. All four grep checks above return exactly 1 hit each.
2. `node .claude/scripts/validate-plans.mjs` exits 0.
3. `npm run build` exits 0 (final clean build confirmation).
4. `plans/governance-propagate/` no longer exists in `plans/` (moved to `plans/.archive/governance-propagate/`).

## Notes / risks

- The dogfood `.claude/scripts/validate-plans.mjs` IS the reference source — it was created by `governance-cleanup` plan (phase 03). The template simply copies it verbatim. Parity check is therefore: template content == dogfood file content.
- If a diff is found between the template body and the dogfood file, it means either (a) the template was incorrectly copied in phase 01, or (b) the dogfood file was modified after phase 01 was written. Fix by re-reading the dogfood file and updating the template function.
- Archive command: `mv plans/governance-propagate plans/.archive/governance-propagate` (dev agent executes this via Bash — planner cannot).
- After archiving, update all four phase `status:` fields to `done` before moving — or the validate-plans script will warn about stale statuses in the archived files (non-blocking, but cleaner).
