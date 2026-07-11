# harness-product-description — Overview

## Goal

Add a required `productDescription` field to Claude Harness so that when any project type enables the harness, the user is prompted for a one-line project summary that is rendered as the opening line of `## Project Overview` in the generated CLAUDE.md.

## Scope

- All project types that offer Claude Harness: `react-vite`, `chrome-extension`, `harness-only` (generic + react-vite + chrome-extension skeletons).
- The field flows through: Cart type → menu prompt → `ClaudeHarnessParams` → CLAUDE.md template render.
- Final phase: dogfood sync (beaver's own `.claude/` regenerated from the updated template).

## Non-Goals

- No new menu option; this is a required `input()` prompt gated on "AI enabled" (same pattern as `menuProjectName`).
- No change to the harness-only skeleton CLAUDE.md structure beyond prepending the description. Skeletons remain intentionally minimal (see MEMORY.md: harness-only stubs tell users to run `/init`).
- No changes to `docs/` files.
- No TypeScript test additions (not requested).

## Spec Reference

`docs/features/claude-harness/claude-harness.spec.en.md` — "Product Description Field" section.

## Phase Decomposition Strategy

| Concern | Phase |
|---|---|
| Type system: add field to Cart interfaces + `ClaudeHarnessParams` | 01 |
| Prompts: add `menuProductDescription` to all three flow files | 02 |
| Templates: render description in react-vite + chrome-extension CLAUDE.md | 03 |
| Templates: render description in harness-only skeletons (3 files) | 04 |
| Dogfood sync: re-render beaver's own `.claude/` from updated template | 05 |

Each phase touches exactly one concern and leaves the repo in a working (buildable) state.

---

## Ordered Phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | types | done | 0/4 | 2026-06-21 |
| 02 | menu-prompts | done | 0/5 | 2026-06-21 |
| 03 | templates-full | done | 0/4 | 2026-06-21 |
| 04 | templates-skeleton | done | 0/5 | 2026-06-21 |
| 05 | dogfood-sync | done | 0/5 | 2026-06-21 |
