# CLAUDE.md

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

\`\`\`
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
\`\`\`

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive CLI tool for scaffolding web projects. It presents users with a menu to select a project type (React + Vite, Next.js, etc.), guides them through configuration choices, then **generates the full project on disk** with pinned library versions.

## Commands

### Development
- `npm run dev` — Run the CLI directly using tsx (no TypeScript compilation needed)
- `npm run dev:build` — Compile TypeScript, alias paths, then run the compiled output
- `npm run build` — Compile TypeScript and resolve path aliases (outputs to `dist/`)

## Architecture

### Module Structure

The codebase uses path aliases for cleaner imports:
- `@src/*` → `src/*`
- `@utils/*` → `src/utils/*`

### Core Flow

1. **Entry point** (`src/index.ts`): Greets the user, invokes the main menu, wraps errors in try/catch
2. **Menu system** (`src/options/`):
   - `src/options/index.ts` — Top-level project type selection (React + Vite, Next.js, Nuxt disabled)
   - `src/options/react-vite/` — Submenu flows for React + Vite configuration
3. **Type system** (`src/types/index.ts`): Defines `Cart` (user selections), `ProjectType`, and project-specific interfaces like `ReactViteCore` and `NextJSCore`
4. **Constants** (`src/constants/` and `src/options/react-vite/constants/`): Menu option definitions with display names, values, and disabled states
5. **Scaffold system** (`src/scaffold/`): Generates project files on disk after all menu choices are collected
6. **Utilities** (`src/utils/`):
   - `animation.ts` — `typeWriter` effect for intro text
   - `user.ts` — Gets username from git config
   - `index.ts` — `sleep` helper

### Cart Pattern

The "cart" object accumulates user selections as the CLI progresses through menus. For React + Vite (`ReactViteCore`), it collects:
- `projectName` — validated project directory name (`[a-zA-Z0-9_-]` only)
- `layout` — FSD (Feature Slice Design) or BPR (Bulletproof React)
- `router` — TanStack Router v1.144.0 or none
- `stateManagement` — Zustand v5.0.5 or none
- `query` — TanStack Query v5.74.4 or none
- `css` — Tailwind CSS v4.1.3 or none
- `linter` — Biome v1.9.4, ESLint v9.39.4, or none

### Scaffold System (`src/scaffold/`)

After all menu choices are collected, `scaffoldReactVite(cart)` generates the full project:

```
src/scaffold/
  errors.ts                        — ScaffoldError class, isNodeError guard
  utils.ts                         — FileMap type, dirExists(), writeProjectFile()
  react-vite/
    index.ts                       — Orchestrator: spinner, write files, cleanup on error, next steps
    templates/
      package-json.ts              — packageJsonTemplate(cart) — pinned versions
      vite-config.ts               — viteConfigTemplate(cart)
      tsconfig.ts                  — tsconfigTemplate(), tsconfigNodeTemplate()
      index-html.ts                — indexHtmlTemplate(projectName)
      main-tsx.ts                  — mainTsxTemplate(cart)
      styles.ts                    — stylesCssTemplate() (Tailwind CSS entry point)
      app-tsx.ts                   — appTsxFsdTemplate(hasRouter), appTsxBprTemplate(hasRouter)
      router.ts                    — rootRouteTemplate(), indexRouteTemplate() (TanStack Router)
      zustand.ts                   — zustandStoreTemplate()
      query.ts                     — queryProviderBprTemplate(), simpleProviderBprTemplate() (TanStack Query)
      linter.ts                    — biomeConfigTemplate(), eslintConfigTemplate()
      gitignore.ts                 — gitignoreTemplate()
      fsd-layout.ts                — getFsdFileMap(cart): FileMap
      bpr-layout.ts                — getBprFileMap(cart): FileMap
```

**Key design decisions:**
- Templates are pure functions returning strings — no side effects
- `fs.mkdir({ recursive: true })` before every `writeFile` — no manual directory pre-creation needed
- `dirExists` check before starting — fails fast if project directory already exists
- On error: spinner shows failure, partial directory is cleaned up (best-effort), then `process.exit(1)`
- TanStack Router: `routeTree.gen.ts` is auto-generated by the Vite plugin on first `npm run dev`

### Pinned Library Versions (for scaffolded projects)

| Package | Version |
|---|---|
| react | 19.1.0 |
| react-dom | 19.1.0 |
| vite | 6.4.3 |
| @vitejs/plugin-react | 4.4.1 |
| typescript | 5.8.3 |
| @types/react | 19.1.1 |
| @types/react-dom | 19.1.1 |
| @tanstack/react-router | 1.144.0 |
| @tanstack/router-devtools | 1.144.0 |
| @tanstack/router-vite-plugin | 1.144.0 |
| zustand | 5.0.5 |
| @tanstack/react-query | 5.74.4 |
| @tanstack/react-query-devtools | 5.74.4 |
| tailwindcss | 4.1.3 |
| @tailwindcss/vite | 4.1.3 |
| @biomejs/biome | 1.9.4 |
| eslint | 9.39.4 |
| @eslint/js | 9.39.4 |
| typescript-eslint | 8.26.0 |
| eslint-plugin-react-hooks | 5.2.0 |
| eslint-plugin-react-refresh | 0.4.19 |
| globals | 15.15.0 |

### Adding New Project Types

To add a new project type (e.g., enable Nuxt):
1. Update `src/constants/index.ts` — set `disabled: false`
2. Create `src/options/<project-name>/` with its own constants, types, and flow functions
3. Add handling in `src/options/index.ts` to import and call the project-specific flow
4. Define the project type interface in `src/types/index.ts` and add it to the `Cart` union
5. Create `src/scaffold/<project-name>/` with templates and an orchestrator following the same pattern as `react-vite`

### Adding New Options to React + Vite

To add a new menu option (e.g., a new UI library choice):
1. Add a new constant in `src/options/react-vite/constants/index.ts`
2. Export the new value type from `src/types/index.ts` and add the field to `ReactViteCore`
3. Add a `menu<OptionName>` function in `src/options/react-vite/index.ts` using `selectFromMenu`
4. Call it in `flowReactVite` before the scaffold step
5. Update `getFsdFileMap` and `getBprFileMap` in `src/scaffold/react-vite/templates/` to handle the new option

## Claude Harness (this repo)

This repo dogfoods the same Claude Code harness it scaffolds (see `docs/features/claude-harness/claude-harness.spec.en.md`).

| Task / trigger | Agent | Notes |
|---|---|---|
| Brainstorming / trade-off analysis / "what's the best approach?" before any change | `advisor` | read-only; deepest source mental model; recommends, never edits — hands off to dev/planner/docs-writer |
| Decomposing a story into a resumable, multi-phase implementation plan | `planner` | owns `plans/`; writes phase files only, never code (see `plans/README.md`) |
| Feature work or bug fix in `src/` (menus, cart, templates) | `dev` | MUST read the relevant `docs/features/` spec before coding |
| Analyzing requirements, writing/updating feature docs | `docs-writer` | owns `docs/`; rebuilds INDEX.md after every change |

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase `status: blocked`, file a `backlog/<id>` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See `backlog/README.md`.

**DOCS-FIRST RULE:** for any request to describe, explain, or modify a documented feature, grep `docs/` frontmatter and read the relevant docs BEFORE opening source files. Start at `docs/INDEX.md`.

Docs commands: `node scripts/build-docs-index.mjs` (regenerate `docs/INDEX.md`), `node scripts/lint-docs-frontmatter.mjs` (validate frontmatter), `node scripts/validate-plans.mjs` (check plan/backlog consistency). Skills: `.claude/skills/beaver-conventions`, `.claude/skills/beaver-docs`.
