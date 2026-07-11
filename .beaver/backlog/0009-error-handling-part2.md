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
