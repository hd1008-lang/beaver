---
title: React + Vite Project Scaffolding — Feature Spec
feature: react-vite
flow: scaffold
layer: _cross
status: active
lang: en
related: []
keywords: [projecttype, scaffolding, cartpattern, flowreactvite, tanstackrouter, zustand, tanstackquery, tailwind, biome, eslint, vitest, playwright, claude]
updated: 2026-06-10
---

# React + Vite Project Scaffolding — Feature Spec

## Overview

The React + Vite feature guides users through an interactive CLI menu to configure and scaffold a new React 19 + Vite 6 project. It collects user preferences across layout, routing, state management, data fetching, CSS, linting, testing, and AI setup, then generates a complete working project on disk with pinned library versions and boilerplate code.

## Menu Flow

After selecting "React + Vite" from the project type selection menu, users proceed through the following interactive steps in order:

### 1. Project Name
- **Prompt**: "Project name:"
- **Input type**: Text field with validation
- **Validation**: Non-empty, alphanumeric with hyphens and underscores only (`[a-zA-Z0-9_-]`)
- **Result field**: `cart.projectName`
- **Behavior**: User input is trimmed before storage

### 2. Layout
- **Prompt**: "Choose a layout"
- **Options**:
  - FSD (Feature Slice Design)
  - BPR (Bulletproof React)
- **Result field**: `cart.layout`
- **Impact**: Determines file structure and template variants used during scaffolding

### 3. Router
- **Prompt**: "Choose a Router"
- **Options**:
  - Not Using (no router installed)
  - TanStack Router v1.144.0
- **Result field**: `cart.router`
- **Impact**: Conditionally includes TanStack Router packages and route files; BPR includes route provider setup

### 4. State Management
- **Prompt**: "Choose a State Management"
- **Options**:
  - Not Using (no state management installed)
  - Zustand v5.0.5
- **Result field**: `cart.stateManagement`
- **Impact**: Conditionally includes zustand package and store boilerplate

### 5. Data Fetching Library
- **Prompt**: "Choose a Data Fetching library"
- **Options**:
  - Not Using (no data fetching library installed)
  - TanStack Query v5.74.4 (includes devtools)
- **Result field**: `cart.query`
- **Impact**: Conditionally includes TanStack Query packages and query provider setup

### 6. CSS Framework
- **Prompt**: "Choose a CSS framework"
- **Options**:
  - Not Using (no CSS framework installed)
  - Tailwind CSS v4.1.3 (Vite plugin, zero-config)
- **Result field**: `cart.css`
- **Impact**: Conditionally includes Tailwind and its Vite plugin; emits `src/index.css` entry point

### 7. Linter / Formatter
- **Prompt**: "Choose a Linter / Formatter"
- **Options**:
  - Not Using (no linter installed)
  - Biome v1.9.4 (all-in-one: lint + format)
  - ESLint v9 (flat config) + typescript-eslint v8.26.0
- **Result field**: `cart.linter`
- **Impact**: Conditionally includes linter packages and config files; registers lint and format npm scripts

### 8. Testing Setup
- **Prompt**: "Choose a Testing setup"
- **Options**:
  - Not Using (no testing framework installed)
  - Vitest v3.2.4 (unit + component testing with Testing Library v16.3.0, coverage via v8)
  - Playwright v1.52.0 (end-to-end testing)
- **Result field**: `cart.testing`
- **Impact**: Conditionally includes testing packages and config; registers test and coverage npm scripts

### 9. AI Setup
- **Prompt**: "Choose an AI setup"
- **Options**:
  - Not Using (no AI setup)
  - Claude (Claude Code) — includes CLAUDE.md, `.claude/` agents directory, and feature docs structure
- **Result field**: `cart.ai`
- **Impact**: Conditionally includes Claude-specific files (CLAUDE.md, agents, docs scripts)

## Cart Structure (ReactViteCore)

After all menus complete, the cart object contains:

```typescript
interface ReactViteCore {
  type: "react-vite"
  projectName: string                          // validated project directory name
  layout: "FSD" | "BPR"                       // layout choice
  router: "NOT_USING" | "TANSTACK_ROUTER"     // router choice
  stateManagement: "NOT_USING" | "ZUSTAND"    // state management choice
  query: "NOT_USING" | "TANSTACK_QUERY"       // query library choice
  css: "NOT_USING" | "TAILWIND"               // CSS framework choice
  linter: "NOT_USING" | "BIOME" | "ESLINT"    // linter choice
  testing: "NOT_USING" | "VITEST" | "PLAYWRIGHT"  // testing choice
  ai: "NOT_USING" | "CLAUDE"                  // AI setup choice
}
```

## Scaffolding Output

After all menu selections are collected, the scaffoldReactVite function generates the full project directory structure on disk. The process:

1. **Validation**: Fails if a directory with `projectName` already exists
2. **Layout dispatch**: Chooses FSD or BPR file map based on `cart.layout`
3. **Conditional file inclusion**: Each cart field determines which optional files are emitted
4. **File writing**: Recursively creates directories and writes all files
5. **Success**: Displays next steps (cd, npm install, npm run dev); notes auto-generation of routeTree.gen.ts if TanStack Router is selected
6. **Error handling**: On failure, rolls back (best-effort cleanup of partial directory) and exits with code 1

### Always-Generated Files

Every React + Vite project includes:

- `package.json` — project metadata and dependency pinning (see pinned versions table below)
- `vite.config.ts` — Vite configuration with React plugin and conditional Tailwind/Router plugins
- `tsconfig.json` — shared TypeScript configuration
- `tsconfig.node.json` — TypeScript config for Vite/build files
- `index.html` — HTML entry point with script pointing to `src/main.tsx`
- `.gitignore` — standard Node/Vite ignore rules
- `src/vite-env.d.ts` — Vite type definitions for module imports
- `src/main.tsx` — React DOM render with conditional providers based on query/router selection
- `src/App.tsx` (BPR) or `src/app/index.tsx` (FSD) — root component with optional router outlet and query client provider
- `src/pages/Home.tsx` (BPR) or `src/pages/home/ui/HomePage.tsx` (FSD) — example home page component
- Directory structure with `.gitkeep` placeholders (see Layout-Specific Files below)

### Layout-Specific Files

#### FSD (Feature Slice Design)

```
src/
  app/              # application-level concerns (root component)
  pages/            # page-level components
    home/
      ui/
        HomePage.tsx
      index.ts
  widgets/          # .gitkeep (page-level widgets)
  features/         # .gitkeep (business logic features)
  entities/         # .gitkeep (business entities)
  shared/           # reusable logic and UI
    ui/             # .gitkeep (shared components)
    lib/            # .gitkeep (shared utilities) [or store.ts if Zustand]
    api/            # .gitkeep (shared API logic)
    config/         # .gitkeep (shared config)
```

#### BPR (Bulletproof React)

```
src/
  App.tsx           # root component
  pages/
    Home.tsx        # example home page
  providers/
    index.tsx       # providers stack (TanStack Query provider if selected)
  assets/           # .gitkeep (static files)
  components/       # .gitkeep (shared components)
  config/           # .gitkeep (app configuration)
  features/         # .gitkeep (feature modules)
  hooks/            # .gitkeep (custom hooks)
  lib/              # .gitkeep (utilities and helpers)
  stores/           # .gitkeep (or appStore.ts if Zustand)
  types/            # .gitkeep (shared type definitions)
  utils/            # .gitkeep (utility functions)
```

### Conditional Files

#### If `router === "TANSTACK_ROUTER"`
- `src/routes/__root.tsx` — root route layout
- `src/routes/index.tsx` — home route (FSD or BPR variant)
- `src/routes/routeTree.gen.ts` — auto-generated route tree (initially a placeholder; regenerated on `npm run dev`)

#### If `stateManagement === "ZUSTAND"`
- `src/shared/lib/store.ts` (FSD) or `src/stores/appStore.ts` (BPR) — example Zustand store

#### If `css === "TAILWIND"`
- `src/index.css` — Tailwind CSS entry point with `@tailwind` directives

#### If `linter === "BIOME"`
- `biome.json` — Biome configuration for linting and formatting

#### If `linter === "ESLINT"`
- `eslint.config.js` — ESLint flat config with React and TypeScript rules

#### If `testing === "VITEST"`
- `vitest.config.ts` — Vitest configuration with happy-dom environment
- `src/**/*.test.ts(x)` — test file structure (scaffolded based on layout)

#### If `testing === "PLAYWRIGHT"`
- `playwright.config.ts` — Playwright configuration
- `tests/` — directory for e2e tests

#### If `ai === "CLAUDE"`
- `CLAUDE.md` — codebase documentation and behavioral guidelines
- `.claude/agents/` — subdirectory with dev and docs-writer agents
- `.claude/skills/` — subdirectory with beaver-conventions and beaver-docs skills
- `scripts/` — build-docs-index.mjs and lint-docs-frontmatter.mjs (harness-neutral shared scripts)
- `docs/` — directory structure with _template.md, INDEX.md, features/, architecture/

## Pinned Library Versions

All dependencies are pinned to exact versions in the scaffolded `package.json`:

| Package | Version | Category | When Included |
|---------|---------|----------|---------------|
| react | 19.1.0 | dep | always |
| react-dom | 19.1.0 | dep | always |
| @tanstack/react-router | 1.144.0 | dep | router === "TANSTACK_ROUTER" |
| @tanstack/router-devtools | 1.144.0 | devDep | router === "TANSTACK_ROUTER" |
| @tanstack/router-vite-plugin | 1.144.0 | devDep | router === "TANSTACK_ROUTER" |
| zustand | 5.0.5 | dep | stateManagement === "ZUSTAND" |
| @tanstack/react-query | 5.74.4 | dep | query === "TANSTACK_QUERY" |
| @tanstack/react-query-devtools | 5.74.4 | dep | query === "TANSTACK_QUERY" |
| tailwindcss | 4.1.3 | devDep | css === "TAILWIND" |
| @tailwindcss/vite | 4.1.3 | devDep | css === "TAILWIND" |
| @biomejs/biome | 1.9.4 | devDep | linter === "BIOME" |
| eslint | 9.39.4 | devDep | linter === "ESLINT" |
| @eslint/js | 9.39.4 | devDep | linter === "ESLINT" |
| typescript-eslint | 8.26.0 | devDep | linter === "ESLINT" |
| eslint-plugin-react-hooks | 5.2.0 | devDep | linter === "ESLINT" |
| eslint-plugin-react-refresh | 0.4.19 | devDep | linter === "ESLINT" |
| globals | 15.15.0 | devDep | linter === "ESLINT" |
| vitest | 3.2.4 | devDep | testing === "VITEST" |
| @vitest/coverage-v8 | 3.2.4 | devDep | testing === "VITEST" |
| @testing-library/react | 16.3.0 | devDep | testing === "VITEST" |
| @testing-library/jest-dom | 6.6.3 | devDep | testing === "VITEST" |
| jsdom | 26.1.0 | devDep | testing === "VITEST" |
| @playwright/test | 1.52.0 | devDep | testing === "PLAYWRIGHT" |
| vite | 6.4.3 | devDep | always |
| @vitejs/plugin-react | 4.4.1 | devDep | always |
| typescript | 5.8.3 | devDep | always |
| @types/react | 19.1.1 | devDep | always |
| @types/react-dom | 19.1.1 | devDep | always |

## npm Scripts

The scaffolded `package.json` includes these npm scripts (conditionally):

| Script | Command | When Included |
|--------|---------|---------------|
| dev | `vite` | always |
| build | `tsc && vite build` | always |
| preview | `vite preview` | always |
| lint | `biome check .` | linter === "BIOME" |
| format | `biome format --write .` | linter === "BIOME" |
| lint | `eslint .` | linter === "ESLINT" |
| test | `vitest` | testing === "VITEST" |
| test:run | `vitest run` | testing === "VITEST" |
| coverage | `vitest run --coverage` | testing === "VITEST" |
| test:e2e | `playwright test` | testing === "PLAYWRIGHT" |
| docs:index | `node scripts/build-docs-index.mjs` | ai === "CLAUDE" |
| docs:lint | `node scripts/lint-docs-frontmatter.mjs` | ai === "CLAUDE" |

## User Interactions After Scaffolding

Upon successful scaffolding, the CLI prints:

```
Project <projectName> created successfully!

Next steps:
  cd <projectName>
  npm install
  npm run dev

  Note: TanStack Router will auto-generate routeTree.gen.ts on first dev run.
  (printed only if router === "TANSTACK_ROUTER")
```

## Design Decisions

### Layout-Aware Scaffolding
FSD and BPR layouts differ in file structure and provider stack. By collecting layout choice early, the feature conditionally emits different file maps and boilerplate (e.g., `src/app/index.tsx` vs `src/App.tsx`, different provider nesting).

### Exact Version Pinning
All library versions are pinned to specific versions in generated `package.json`. This ensures reproducible scaffolds and avoids dependency drift in new projects.

### Conditional Provider Stacking
When multiple optional libraries are selected (e.g., TanStack Query + TanStack Router), the main.tsx and root route components intelligently layer providers to avoid nesting hell and maintain clarity.

### Best-Effort Cleanup on Error
If scaffolding fails partway through file creation, the partial project directory is removed. This prevents leaving corrupted or incomplete projects on disk, but the cleanup is best-effort (suppresses errors) to avoid masking the original failure.

### AI Setup Integration
When AI setup is selected during scaffolding, the project includes the Claude Code harness (CLAUDE.md, agents, skills, and docs structure). This enables Claude Code to assist with development tasks within the project's chosen architecture.

## Related Files

- `src/options/react-vite/constants/index.ts` — menu option definitions and descriptions
- `src/options/react-vite/index.ts` — flowReactVite orchestrator and menu functions
- `src/types/index.ts` — ReactViteCore interface definition
- `src/scaffold/react-vite/index.ts` — scaffoldReactVite orchestrator
- `src/scaffold/react-vite/templates/` — all template functions (package-json, vite-config, app-tsx, fsd-layout, bpr-layout, etc.)
