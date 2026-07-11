---
title: Apply AI Harness to Existing Project — Feature Spec
feature: harness-only
flow: scaffold
layer: _cross
status: active
lang: en
related: [features/ai-harness/ai-harness.spec.en.md]
keywords: [harnessonly, aiharness, existingproject, skeletontemplate, --ai, noscaffold]
updated: 2026-07-11
---

# Apply AI Harness to Existing Project — Feature Spec

## Context

Users may want to add a Claude Code harness (.claude/, CLAUDE.md, docs/) to an **existing** project without scaffolding full source code. Previously, the CLI was scaffolding-first only: you'd use beaver to generate a new project with optional harness, but not to augment a hand-written or legacy codebase.

## Root Cause / Key Finding

The original scaffold system generated source code *and* harness together, tied to cart selections (React + Vite libraries, Next.js options, etc.). Decoupling harness generation from source scaffolding requires:
- A new top-level menu entry (`HARNESS_ONLY`)
- A minimal flow (target directory, project name, project type only — no library/testing questions)
- A separate skeleton system that generates harness templates without cart complexity
- A `--ai` CLI flag for fast access

## Solution / Pattern

### Menu Entry
- New top-level option in `MENU_OPTIONS_LEVEL_1`: `HARNESS_ONLY` (display name "Apply AI Harness")
- Appears alongside "React + Vite", "Next.js", etc. in `src/constants/index.ts`
- Value: `HARNESS_ONLY` (uppercase, matching other project-type enum values)

### Flow (`flowHarnessOnly`)
Entry point: `src/options/harness-only/index.ts`. Sequence:

1. **Target Directory**: prompt user for existing directory path; validate it EXISTS (`dirExists()`)
2. **Project Name**: suggest default (last path segment of directory), allow override; validate format `[a-zA-Z0-9_-]+`
3. **Project Type**: select from `HARNESS_MENU_PROJECT_TYPE` (REACT_VITE | CHROME_EXTENSION | GENERIC)
4. **Scaffold**: call `scaffoldHarnessOnly(cart)` with `HarnessOnlyCore` object

### Skeleton Templates
Unlike full scaffold (which selects libraries per cart field), harness-only uses **skeleton templates** — fixed, minimal harness layouts keyed by project type:

- **react-vite-skeleton.ts**: `getReactViteHarnessFileMap(cart)` — assumes FSD layout, no library-specific content
- **chrome-extension-skeleton.ts**: `getChromeExtensionHarnessFileMap(cart)` — chrome-specific CLAUDE.md and skills
- **generic-skeleton.ts**: `getGenericHarnessFileMap(cart)` — minimal harness with prompt to run `claude /init`

Each skeleton returns a `FileMap` (same type as full scaffold); orchestrator writes files via `writeProjectFile()`.

### Orchestrator (`src/scaffold/harness-only/index.ts`)

```
scaffoldHarnessOnly(cart: HarnessOnlyCart)
  1. Validate target directory exists (fail if not)
  2. Pick skeleton template by cart.projectType
  3. Get FileMap from skeleton
  4. Show spinner: "Setting up Claude harness..."
  5. Write all files via writeProjectFile()
  6. Show success + next steps (e.g., "Run: cd <dir> && claude /init")
  7. On error: show failure message, exit(1) — DO NOT cleanup (existing project)
```

Key difference from full scaffold: **no cleanup on error**. We don't delete files from an existing project on partial writes.

### `--ai` CLI Flag
In `src/index.ts`:
- If `process.argv.includes('--ai')`, skip main menu and call `flowHarnessOnly()` directly
- Used like: `beaver --ai` to jump straight into harness setup

## Key Decisions

1. **No library selection** — Harness-only asks only 3 questions (dir, name, type), not 8+ like full scaffold. This is intentional: we assume the user already has an existing codebase with its own choices. Generic skeletons provide starter CLAUDE.md + harness shape; users customize via `claude /init` or manual edits.

2. **Three project types, not unlimited** — REACT_VITE, CHROME_EXTENSION, GENERIC. We don't generate bespoke harnesses for every possible framework. GENERIC scaffolds a minimal harness and tells the user to run `claude /init` for detailed help.

3. **No validation of existing project structure** — We don't check "is this really a React project?" or "does package.json exist?". We trust the user knows what they're adding to. Validators would be tight-coupling to specific frameworks.

4. **No cleanup on error** — Unlike full scaffold (which deletes a partial directory on failure), partial file writes are left as-is. The worst case is a user manually removes .claude/ or CLAUDE.md; much safer than us deleting their work.

5. **Skeleton templates, not cart branching** — Skeleton functions return fixed `FileMap` objects. They don't branch on cart.router or cart.zustand like full templates do. This keeps the harness generic and compatible with *any* existing project structure.

6. **`--ai` shortcut** — Bypasses the main menu entirely. Intended for fast access and scripting (e.g., CI/CD automation). Without it, user sees full menu.

## Related Files
- src/constants/index.ts — `HARNESS_ONLY` in `MENU_OPTIONS_LEVEL_1`
- src/types/index.ts — `HarnessOnlyCore` interface, `HARNESS_PROJECT_TYPE_VALUE` type
- src/index.ts — `--ai` flag handling
- src/options/harness-only/constants/index.ts — `HARNESS_MENU_PROJECT_TYPE` options
- src/options/harness-only/index.ts — `flowHarnessOnly()` orchestrator
- src/scaffold/harness-only/index.ts — scaffold orchestrator
- src/scaffold/harness-only/templates/react-vite-skeleton.ts — React + Vite harness skeleton
- src/scaffold/harness-only/templates/chrome-extension-skeleton.ts — Chrome extension harness skeleton
- src/scaffold/harness-only/templates/generic-skeleton.ts — Generic/minimal harness skeleton
- docs/features/ai-harness/ai-harness.spec.en.md — shared harness generation patterns (vendor-neutral canonical architecture)
