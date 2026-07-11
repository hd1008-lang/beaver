---
phase: 01
title: Add {{baseDir}} parameter to HarnessParams
status: done
depends_on: []
---

## Goal

Introduce `baseDir: string` parameter to HarnessParams so templates can conditionally emit knowledge-base paths (plans/, docs/, backlog/, scripts/) at `.beaver/` (beaver's dogfood) or root level (scaffolded projects).

## Context

The `baseDir` token is a **selective prefix** — it only prefixes knowledge-base paths. Tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`) stay bare at root because they are auto-discovered by tools and cannot move.

## Steps

- [x] **Read `src/scaffold/shared/harness-setup.ts`** — understand HarnessParams interface and where it's passed to buildHarnessFileMap (around line 155, 205-333)

- [x] **Update HarnessParams interface** in `src/scaffold/shared/harness-setup.ts`:
  - Add field: `baseDir: string` (description: "prefix for knowledge-base paths, e.g. '.beaver' for beaver's dogfood, '' for scaffolded projects")
  - Position: after `harness` field
  - Make it optional with default value `''` (empty string) for backward compatibility

- [x] **Verify parameter is destructured** at line 155 or nearby where buildHarnessFileMap receives HarnessParams:
  - Confirm `baseDir` is extracted (e.g., `const { baseDir, harness, ... } = params;`)
  - No changes needed to logic yet; Phase 03 applies it selectively

- [x] **Check all call sites of buildHarnessFileMap**:
  - Search for `buildHarnessFileMap(` in `test/` and `src/scaffold/`
  - Expected: `test/helpers/regen-dogfood.ts`, `test/golden-dogfood.test.ts`, and per-project scaffold templates
  - These will add baseDir parameter in Phase 04 (regen) and Phase 01's per-project updates below

- [x] **Update per-project harness templates** to pass `baseDir: ''`:
  - `src/scaffold/react-vite/templates/harness-setup.ts` — pass `baseDir: ''` in buildHarnessFileMap call
  - `src/scaffold/chrome-extension/templates/harness-setup.ts` — pass `baseDir: ''`
  - `src/scaffold/harness-only/templates/react-vite-skeleton.ts` — pass `baseDir: ''`
  - `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts` — pass `baseDir: ''`
  - `src/scaffold/harness-only/templates/generic-skeleton.ts` — pass `baseDir: ''`

- [x] **Verify TypeScript compilation**: `npm run build` produces no errors

## Verify

- [x] HarnessParams interface includes `baseDir: string` field with default value `''`
- [x] `npm run build` succeeds (no type errors)
- [x] All buildHarnessFileMap call sites in per-project templates have `baseDir: ''` parameter
- [x] TypeScript recognizes baseDir as optional with default

## Notes / Risks

- **Backward compatibility**: default `baseDir = ''` means existing scaffolded projects continue to emit at root level
- **Parameter added but unused**: This phase only adds plumbing; Phase 03 applies baseDir selectively in FileMap keys and writeScope. Until then, the parameter is inert (safe to pause here).
- **No template changes yet**: Phase 02 adds `{{baseDir}}/` tokens to templates; this phase only adds the parameter.

