---
phase: 01
title: implement-handler
status: pending
depends_on: []
---

## Goal

Rewrite `src/index.ts` to add `handleFatal`, route both existing catch blocks through it, wire `main().catch(handleFatal)`, and register process-level safety nets — leaving all other code and per-scaffold error handling untouched.

## Steps

- [ ] Read `src/index.ts` in full before editing (confirm line numbers match: `--ai` try/catch at 57–68, menu try/catch at 72–79, `main()` call at 82).
- [ ] Add `handleFatal` helper directly in `src/index.ts`, immediately before the `main` function:
  ```ts
  const handleFatal = (err: unknown): void => {
    if (err instanceof Error && err.name === "ExitPromptError") {
      process.exit(0);
    }
    if (err instanceof Error) {
      console.error(chalk.red(err.message));
    } else {
      console.error(chalk.red("An unexpected error occurred."), err);
    }
    process.exit(1);
  };
  ```
  Note: `ExitPromptError` is identified by `err.name` string check (Inquirer does not export the class for instanceof).
- [ ] Replace the `--ai` catch block (lines ~61–65) with a single `catch (err) { handleFatal(err); }`.
- [ ] Replace the menu catch block (lines ~74–78) with a single `catch (err) { handleFatal(err); }`.
- [ ] Change line 82 from `main();` to `main().catch(handleFatal);`.
- [ ] Add process-level safety nets immediately after the `handleFatal` definition and before `main`:
  ```ts
  process.on("unhandledRejection", handleFatal);
  process.on("uncaughtException", handleFatal);
  ```
- [ ] Run `npm run build` and confirm it exits 0 with no TypeScript errors.

## Verify

1. **TypeScript:** `npm run build` exits 0, no errors in `dist/`.
2. **Normal error path:** Run `npm run dev` and trigger a scaffold error (e.g., pick React+Vite, enter a project name that is an existing directory). Confirm red error message printed and CLI exits with code 1.
3. **Ctrl+C path:** Run `npm run dev`, reach the project-type menu, press Ctrl+C. Confirm CLI exits cleanly (exit code 0) with **no** red error printed.
4. **`--ai` branch smoke test:** Run `npm run dev -- --ai`, reach the project-type prompt, press Ctrl+C. Confirm exit 0, no red output.
5. **Unhandled rejection linting:** Manually inspect `src/index.ts` diff — confirm `main().catch(handleFatal)` is present and `process.on("unhandledRejection", ...)` / `process.on("uncaughtException", ...)` registrations appear before the `main()` call site.

## Notes / risks

- **Do not touch** `src/scaffold/harness-only/index.ts:47–59` or `src/scaffold/react-vite/index.ts` — those per-scaffold try/catch blocks produce specific, user-friendly messages (spinner failure text + `ScaffoldError` / `isNodeError` discrimination) and call `process.exit(1)` directly. They are correct and intentionally bypass the global handler.
- **No `SIGINT` handler.** Inquirer already converts Ctrl+C into an `ExitPromptError` thrown from the active prompt. Adding `process.on("SIGINT", ...)` would race against Inquirer and produce double output.
- **`ExitPromptError` name check:** Inquirer v9+ throws an error with `.name === "ExitPromptError"`. The class is not publicly exported, so use the string check rather than `instanceof`. If Inquirer is ever upgraded, re-verify this name.
- **Rollback:** The edit is confined to `src/index.ts`. If something breaks, `git diff src/index.ts` shows the full delta; revert with `git checkout src/index.ts`.
