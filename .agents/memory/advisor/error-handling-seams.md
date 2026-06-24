---
name: error-handling-seams
description: Where beaver handles errors today — main() try/catch + per-scaffold try/catch + ScaffoldError; no process-level handlers. Guidance for global-catch / anti-hang requests.
metadata:
  type: project
---

Current error-handling seams (read before advising on global catch / watchdog):
- src/index.ts: `main()` wraps `menu()` in try/catch (src/index.ts:72-79) and the `--ai` path in its own try/catch (src/index.ts:57-68). Both print `err.message` (red) and `process.exit(1)`. `main()` is called with NO `.catch()` (src/index.ts:82) — a rejection from the exit paths or anything outside the try blocks becomes an unhandledRejection.
- src/scaffold/errors.ts: `ScaffoldError` (typed scaffold failure) + `isNodeError` guard.
- Each scaffold orchestrator has its own try/catch that classifies ScaffoldError / NodeError / unknown, prints, and exits 1 (e.g. src/scaffold/harness-only/index.ts:47-59).
- NO process-level handlers anywhere (no process.on uncaughtException/unhandledRejection/SIGINT in src/). Inquirer installs its own SIGINT → throws ExitPromptError on Ctrl+C, which currently bubbles to main()'s catch and prints an ugly message.

**Why it matters for anti-hang:** An infinite menu/prompt loop or a stuck `select` (the Windows arrow-key bug) never throws — it just awaits forever. No try/catch or process handler can catch a hang; only a watchdog timeout or a loop-iteration counter can. So a global catch layer addresses crashes/silent-exits, NOT hangs — these are two separate mechanisms.

**How to apply:** Recommend (a) a thin process-level handler block in src/index.ts for uncaughtException/unhandledRejection + graceful ExitPromptError handling, and (b) treat anti-hang separately — but flag that a watchdog on prompts is a symptom-masker for the real Windows TTY bug, not a fix. Keep both minimal; there is no central prompt wrapper today (selectFromMenu is duplicated — see [[menu-prompt-duplication]]), so a watchdog has no single chokepoint without first creating one.
