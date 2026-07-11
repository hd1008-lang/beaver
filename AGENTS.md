# beaver

## Behavioral Guidelines

**Think Before Coding** — state assumptions explicitly; if multiple interpretations exist, present them; if something is unclear, stop and ask.
**Simplicity First** — minimum code that solves the problem; no speculative features, abstractions, or configurability.
**Surgical Changes** — touch only what the request requires; match existing style; every changed line traces to the request.
**Goal-Driven Execution** — turn tasks into verifiable success criteria before starting; loop until verified.

## Project Overview

an interactive CLI that scaffolds web projects

This is an interactive CLI tool for scaffolding web projects. It presents users with a menu to select a project type (React + Vite, Next.js, etc.), guides them through configuration choices, then **generates the full project on disk** with pinned library versions.

This repo dogfoods the same agent harness it scaffolds (see `docs/features/ai-harness/ai-harness.spec.en.md`): root `AGENTS.md` and the harness adapters are regenerated from `harness-assets/` via `npx tsx test/helpers/regen-dogfood.ts` — never hand-edit the rendered copies.

## Commands

### Development
- `npm run dev` — Run the CLI directly using tsx (no TypeScript compilation needed)
- `npm run dev:build` — Compile TypeScript, alias paths, then run the compiled output
- `npm run build` — Compile TypeScript and resolve path aliases (outputs to `dist/`)

### Plans & backlog
- `node scripts/validate-plans.mjs` — Check plan/backlog consistency

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


## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
| Brainstorming / trade-off analysis / "what's the best approach?" before any change | `advisor` | read-only; deepest source mental model; recommends, never edits |
| Quick factual lookup about the code/docs (answer + `path:line`) | `scout` | read-only; cheap; for facts, not design reasoning |
| Decomposing a story into a resumable plan | `planner` | owns `.beaver/plans/`; writes phase files only, never code |
| Analyzing requirements, writing/updating feature docs | `docs-writer` | owns `.beaver/docs/`; rebuilds INDEX.md after every change |
| Feature work or bug fix in `src/` (menus, cart, templates) | `dev` | MUST read the relevant `docs/features/` spec before coding |

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase `status: blocked`, file a `backlog/<id>` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See `.beaver/backlog/README.md`.

Each agent has persistent memory at `.agents/memory/<agent>/MEMORY.md` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.

**MEMORY LIFECYCLE:** agent memory is short-term, not an append-only log — budget ≤ 15 bullets / ≤ 100 lines per file (`node .beaver/scripts/validate-structure.mjs` warns over budget, fails at 2×). Durable, architecture-level truth gets promoted into `.beaver/docs/` and deleted from memory; one-off fix notes already recorded in `.beaver/plans/` or `.beaver/backlog/` don't belong there. Any change that renames a path/scope/convention must update or delete memory bullets referencing the old state in the same change. Over budget, or when archiving a plan, run the project's memory-retro skill.

## Task Documentation Convention

After any non-trivial fix or new pattern: copy `.beaver/docs/_template.md`, fill the frontmatter, save as `.beaver/docs/features/<feature>/<topic>.en.md` (or `.beaver/docs/architecture/` for cross-cutting topics), then run `node .beaver/scripts/build-docs-index.mjs` and commit the doc together with `INDEX.md`. Validate with `node .beaver/scripts/lint-docs-frontmatter.mjs`.

**DOCS-FIRST RULE:** for any request to describe, explain, or modify a documented feature, you MUST grep `.beaver/docs/` frontmatter and read the relevant docs BEFORE opening source files — and state what the docs already covered. Start at `.beaver/docs/INDEX.md`.

**Operating loop:** finish a non-trivial task → write a doc from `.beaver/docs/_template.md` → rebuild `INDEX.md` → commit together; agents update their `MEMORY.md` when they learn a gotcha.

## Provider Adapters

**Claude Code**: entry point `CLAUDE.md` (thin `@AGENTS.md` adapter). Subagents: `.claude/agents/*.md`. Skills: `.claude/skills/`. Workspace config: `.claude/settings.json` (env vars, tool permissions — `allow`/`ask`/`deny` — and hooks). Write-scope enforcement: `.claude/scripts/agent-guard.mjs` (`PreToolUse` hook).

**Codex**: this file (AGENTS.md) is the entry point directly. Subagents: `.codex/agents/*.toml`. Skills (real files, not symlinks): `.agents/skills/`. Hook configuration: `.codex/hooks.json`; write-scope enforcement: `.codex/scripts/agent-guard-codex.mjs`. No `permissions.ask` tier — allow/deny only.
