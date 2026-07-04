# global-error-catch — Overview

## Goal

Add a centralised fatal-error handler to `src/index.ts` so that every crash, unhandled rejection, or Ctrl+C is surfaced consistently — no more silent freezes or invisible crashes.

## Scope

- `src/index.ts` only.
- Phần 1 of a two-part initiative. Phần 2 (watchdog 10 s timeout + dedup `selectFromMenu` + Windows `await sleep(0)` fix) is deliberately out of scope and tracked in `backlog/0009-error-handling-part2.md`.

## Non-goals

- No changes to scaffold-level try/catch in `src/scaffold/react-vite/index.ts` or `src/scaffold/harness-only/index.ts` — those produce user-friendly messages and must stay untouched.
- No `SIGINT` handler (conflicts with Inquirer's own Ctrl+C → `ExitPromptError` conversion).
- No new feature spec (none exists for error-handling today; a docs-writer follow-up is filed as `backlog/0010-error-handling-spec.md`).
- No changes to any docs/ file.

## Context

`src/index.ts:82` calls `main()` with **no `.catch()`**. Any rejection that escapes the two isolated try/catch blocks (lines 58–68 for `--ai`, 72–79 for menu) silently swallows the error. There are no process-level handlers.

The fix is purely additive:
1. A `handleFatal(err)` helper — prints red + exits 1, except `ExitPromptError` (Ctrl+C) → exits 0 silently.
2. Route both existing catch blocks through `handleFatal`.
3. `main().catch(handleFatal)` on line 82.
4. `process.on("unhandledRejection", handleFatal)` + `process.on("uncaughtException", handleFatal)` as last-resort safety nets.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | implement-handler | done | 7/7 | 2026-06-24 |
| 02 | file-backlog-follow-ups | done | 2/2 | 2026-06-24 |
