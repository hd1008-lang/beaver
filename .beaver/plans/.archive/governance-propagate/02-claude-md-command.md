---
phase: 02
title: claude-md-command
status: done
depends_on: [01]
---

## Goal

Add `node .claude/scripts/validate-plans.mjs` to the `commands` array in both per-project-type CLAUDE.md templates (react-vite and chrome-extension), so scaffolded projects surface the command to users.

## Steps

- [ ] Edit `src/scaffold/react-vite/templates/claude-setup.ts`: in the `commands` array (lines 57–65), add a new entry immediately after the `lint-docs-frontmatter.mjs` line:
  ```
  '- `node .claude/scripts/validate-plans.mjs` — check plan/backlog consistency (table↔frontmatter, archived, ID gaps, two-way links)',
  ```
  The insertion point is after line 64 (`lint-docs-frontmatter.mjs` entry) and before line 65 (`.filter(Boolean)`).

- [ ] Edit `src/scaffold/chrome-extension/templates/claude-setup.ts`: identical insertion in the `commands` array (lines 56–63), after the `lint-docs-frontmatter.mjs` entry (line 62) and before `.filter(Boolean)` (line 63).

- [ ] Run `npx tsc --noEmit` from the repo root — must pass with zero errors.

- [ ] Run `npm run build` — must exit 0.

## Verify

1. `npx tsc --noEmit` passes (0 errors).
2. `npm run build` exits 0.
3. Grep for `validate-plans` in both edited files to confirm the string is present:
   - `grep "validate-plans" src/scaffold/react-vite/templates/claude-setup.ts` — should return 1 hit.
   - `grep "validate-plans" src/scaffold/chrome-extension/templates/claude-setup.ts` — should return 1 hit.

## Notes / risks

- Do NOT edit `src/scaffold/harness-only/templates/*-skeleton.ts` — those are intentionally minimal stubs (per MEMORY.md: "Harness-only skeleton CLAUDE.md stubs are intentionally minimal").
- The new command entry must be in the same `commands` array that feeds `${commands.join('\n')}` in the CLAUDE.md template string — not in a separate location.
- Keep the description concise (fits on one line); the exact wording shown above matches the dogfood beaver `CLAUDE.md` style.
