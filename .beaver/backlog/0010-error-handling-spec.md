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
