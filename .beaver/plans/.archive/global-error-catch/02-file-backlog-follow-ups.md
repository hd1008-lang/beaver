---
phase: 02
title: file-backlog-follow-ups
status: pending
depends_on: [01]
---

## Goal

File two backlog entries to track deferred work so it is not lost in prose: (a) Phần 2 of the error-handling initiative, and (b) the missing error-handling spec for docs-writer.

## Steps

- [ ] Create `backlog/0009-error-handling-part2.md` with the following content:

  ```markdown
  ---
  id: "0009"
  title: "Error handling — Phần 2: watchdog + selectFromMenu dedup + Windows fix"
  status: open
  source: plans/global-error-catch/00-overview.md
  severity: medium
  created: 2026-06-24
  ---

  ## Symptom

  Three deferred improvements left out of Phần 1 (plans/global-error-catch/):

  1. **Watchdog / timeout:** On Windows, `--ai` flow hangs silently at the project-type `select` prompt when arrow keys don't work. There is no timeout or watchdog to surface this as an error.
  2. **`selectFromMenu` duplication:** Two near-identical copies of the prompt helper exist at `src/options/react-vite/index.ts:17` and `src/options/harness-only/index.ts:10`. Should be extracted to a shared utility.
  3. **Windows arrow-key root cause:** The underlying bug is likely a TTY/readline issue on Windows. A shim (`await sleep(0)`) or an alternative prompt library may be needed; needs investigation.

  ## Tried

  Nothing attempted yet — deliberately deferred to keep Phần 1 surgical.

  ## Why parked

  Phần 1 scope was intentionally limited to the global error catch layer only. The watchdog requires design decisions (timeout value, signal path); the `selectFromMenu` dedup is a refactor that could introduce regressions; the Windows fix needs reproduction steps in a Windows environment.

  ## Suggested direction

  - Reproduce the Windows hang by running `npm run dev -- --ai` on a Windows machine (native, not WSL2) and confirming which prompt library call stalls.
  - Evaluate `@inquirer/select` stream-flush options or a `setTimeout`-based watchdog that throws a named error after N seconds of prompt inactivity.
  - Extract `selectFromMenu` to `src/utils/menu.ts` once the above is confirmed stable.
  ```

- [ ] Create `backlog/0010-error-handling-spec.md` with the following content:

  ```markdown
  ---
  id: "0010"
  title: "Spec gap: no docs/ coverage for CLI error-handling behaviour"
  status: open
  source: plans/global-error-catch/00-overview.md
  severity: low
  created: 2026-06-24
  ---

  ## Symptom

  `docs/INDEX.md` has no feature spec covering how beaver surfaces errors to the user — exit codes, Ctrl+C behaviour, `ExitPromptError` handling, or the distinction between global handlers and per-scaffold try/catch.

  After Phần 1 lands, the implemented behaviour has no canonical WHAT document.

  ## Tried

  N/A — this is a spec gap, not a failed attempt.

  ## Why parked

  Spec authoring is docs-writer's domain. Planner cannot write docs/.

  ## Suggested direction

  Ask docs-writer to create `docs/features/error-handling/error-handling.spec.en.md` covering:
  - Exit codes (0 for Ctrl+C / clean exit, 1 for errors).
  - `handleFatal` contract: which error types print red, which exit silently.
  - Per-scaffold error handling boundary (ScaffoldError, isNodeError) vs. global handler.
  - Process-level safety nets (unhandledRejection, uncaughtException).
  ```

## Verify

- `backlog/0009-error-handling-part2.md` exists and its frontmatter `id` is `"0009"`.
- `backlog/0010-error-handling-spec.md` exists and its frontmatter `id` is `"0010"`.
- Run `node scripts/validate-plans.mjs` — no errors or broken backlog links reported.

## Notes / risks

- Dev must create both backlog files (planner's write guard blocks `backlog/` writes). These are small, template-driven writes — no code involved.
- After these files are created, update `plans/global-error-catch/00-overview.md`'s table to show phase 02 as `done`.
- Once both phases are done, the plan should be archived to `plans/.archive/global-error-catch/` per `plans/README.md`.
