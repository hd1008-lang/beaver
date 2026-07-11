---
phase: 01
title: Introduce the AGENTS table (data only)
status: done
depends_on: []
---

## Goal

Add a typed `AGENTS` constant at the top of `src/scaffold/shared/claude-setup.ts` that enumerates all five core agents with their 4-field schema — no behavior change, no generated output change yet.

## Steps

- [x] In `src/scaffold/shared/claude-setup.ts`, above all template functions, define the `AgentDef` TypeScript interface with fields: `name: string`, `model: 'sonnet' | 'haiku' | 'opus'`, `writeScope: string[]`, `memory: boolean`.
- [x] Add an `AGENTS` constant (typed `readonly AgentDef[]`) listing the five core agents in this order with values that match the current hand-written output exactly:
  - `dev` — model: sonnet, writeScope: `['src/', 'package.json', 'tsconfig.json', 'vite.config.ts', 'biome.json', 'eslint.config.js', '.github/']`, memory: true
  - `docs-writer` — model: haiku, writeScope: `['docs/']`, memory: true
  - `planner` — model: sonnet, writeScope: `['plans/']`, memory: true
  - `advisor` — model: opus, writeScope: `[]`, memory: true
  - `scout` — model: haiku, writeScope: `[]`, memory: false
- [x] Add an `AgentDef` export so downstream phases and the validator can import the type.
- [x] Add a short JSDoc comment above `AGENTS` explaining the schema: "Single source of truth — derived invariants (read-only ⇒ no Write/Edit, guard parameterized from writeScope) are enforced by phase 03 and 04."
- [x] Confirm that `npx tsc --noEmit` still passes (no type errors introduced).
- [x] Confirm that `npm run build` produces `dist/` without errors.

## Verify

```bash
# From the repo root:
npx tsc --noEmit
npm run build
```

Both must exit 0. No behavior change to generated projects — this phase is data-only, nothing reads `AGENTS` yet.

## Notes / Risks

- `writeScope` for `dev` is intentionally broad (many project-specific paths). The exact list may need refinement in phase 03 when the guard is parameterized — use a conservative superset here and narrow it then if needed.
- The `test-writer` agent is NOT in `AGENTS` — it is cart-conditional and passed in via `params.testing` just like today. The registry covers the unconditional five agents only.
- Do not change any template function signatures or the `ClaudeHarnessParams` interface in this phase. Pure addition only.
- If `dev`'s `writeScope` list feels project-type-specific (it is — react-vite paths differ from chrome-extension), treat it as a generic "writes most of src/" descriptor for now. The guard phase (03) will handle project-type awareness.
