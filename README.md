<div align="center"><img width="400" height="225" alt="Beaver CLI" src="https://raw.githubusercontent.com/hd1008-lang/beaver/main/media/beaver.gif" /></div>

# Beaver

An interactive CLI tool for scaffolding modern web projects and applying AI development harness. Select your project type, configure your stack through a guided menu, and get a production-ready project generated on disk with pinned library versions.

**Current Version:** 2.0.2

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm

### Installation

**Option 1: Install globally** (recommended for frequent use)

```bash
npm install -g beaver-build
beaver
```

**Option 2: Use directly with npx** (no installation needed)

```bash
npx beaver-build
```

### Commands & Options

**Main command:**

```bash
beaver                          # Interactive project scaffolding
```

**Options:**

```bash
beaver -v, --version            # Show current version
beaver -h, --help               # Show help and available commands
beaver update                   # Update beaver to the latest version from npm
```

### Usage

Simply run the command and follow the interactive prompts:

```bash
beaver
```

The CLI will guide you through:

1. **Project Type** — Choose React + Vite, Chrome Extension, or Next.js (upcoming)
2. **Project Name** — Enter your project directory name
3. **Configuration** — Select your preferred stack (layout, router, state management, styling, linter, AI setup, testing)

After answering all prompts, your production-ready project will be generated in the specified directory with:

- All dependencies pinned to stable versions
- Claude Code harness (CLAUDE.md, agents, docs) when Claude AI setup is selected
- Ready to run with `npm install && npm run dev`

---

## Development (Contributing)

To contribute or develop locally:

```bash
npm install

# Development & Building
npm run dev           # Run CLI directly in development mode (using tsx)
npm run dev:build     # Compile TypeScript, resolve aliases, then run
npm run build         # Compile TypeScript for distribution (outputs to dist/)

# Documentation
node scripts/build-docs-index.mjs    # Regenerate docs/INDEX.md
node scripts/lint-docs-frontmatter.mjs     # Validate frontmatter in docs/
```

**Publishing:**

When ready to publish a new version:

```bash
npm version patch|minor|major    # Update version in package.json
npm publish                      # Publishes to npm (runs build automatically)
```

---

## Project Types

| Type | Description | Status |
|---|---|---|
| React + Vite | React 19 + Vite with comprehensive tooling options | ✅ Available |
| Chrome Extension | React 19 + Vite for Chrome Manifest v3 extensions | ✅ Available |
| Apply AI Harness | Add Claude Code harness to an existing project | ✅ Available |
| Next.js | Next 15 with app router and modern features | 🔄 Upcoming |
| Nuxt | Nuxt 4 with Vue 3 composition API | 🔄 Upcoming |

---

## React + Vite

The CLI walks you through the following choices:

### 1. Project Name

Validated to allow only letters, numbers, hyphens, and underscores (`[a-zA-Z0-9_-]`).

### 2. Layout

| Option | Description |
|---|---|
| FSD | Feature Slice Design — modular file structure |
| BPR | Bulletproof React — scalable architecture |

### 3. Router

| Option | Version |
|---|---|
| Not Using | — |
| TanStack Router | v1.144.0 |

### 4. State Management

| Option | Version |
|---|---|
| Not Using | — |
| Zustand | v5.0.5 |

### 5. Data Fetching

| Option | Version |
|---|---|
| Not Using | — |
| TanStack Query | v5.74.4 |

### 6. CSS / Styling

| Option | Version |
|---|---|
| Not Using | — |
| Tailwind CSS | v4.1.3 |

### 7. AI Setup

| Option | Description |
|---|---|
| Not Using | — |
| Claude (Claude Code) | CLAUDE.md + .claude/ agents + feature docs |

### 8. Project Description

| Prompt | Notes |
|---|---|
| Describe your project (one line) | Optional — appears when Claude AI setup is selected |

### 9. Testing

| Option | Description |
|---|---|
| Not Using | — |
| Setup Testing Base | Vitest + React Testing Library configuration |

### 10. Linter / Formatter

| Option | Version | Notes |
|---|---|---|
| Not Using | — | — |
| Biome | v1.9.4 | All-in-one lint + format |
| ESLint | v9.39.4 | Flat config + typescript-eslint |

---

## Chrome Extension

Build Chrome Manifest v3 extensions with React 19 and Vite. The CLI guides you through:

### 1. Project Name

Validated to allow only letters, numbers, hyphens, and underscores (`[a-zA-Z0-9_-]`).

### 2. State Management

| Option | Version |
|---|---|
| Not Using | — |
| Zustand | v5.0.5 |

### 3. Data Fetching

| Option | Version |
|---|---|
| Not Using | — |
| TanStack Query | v5.74.4 |

### 4. CSS / Styling

| Option | Version |
|---|---|
| Not Using | — |
| Tailwind CSS | v4.1.3 |

### 5. AI Setup

| Option | Description |
|---|---|
| Not Using | — |
| Claude (Claude Code) | CLAUDE.md + .claude/ agents + feature docs |

### 6. Project Description

| Prompt | Notes |
|---|---|
| Describe your project (one line) | Optional — appears when Claude AI setup is selected |

### 7. Linter / Formatter

| Option | Version | Notes |
|---|---|---|
| Not Using | — | — |
| Biome | v1.9.4 | All-in-one lint + format |
| ESLint | v9.39.4 | Flat config + typescript-eslint |

---

## Apply AI Harness

Add Claude Code harness setup to an existing project. This creates CLAUDE.md, .claude/ agents, and feature documentation for AI-assisted development.

The CLI guides you through:

### 1. Project Type

| Option | Description |
|---|---|
| React + Vite | For React + Vite projects |
| Chrome Extension | For Chrome Manifest v3 extensions |
| Generic Project | For any other project type |

This generates appropriate skeleton files and agent setup based on your project type.

---

## Generated Project — Pinned Dependencies

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
| @biomejs/biome | 1.9.4 |
| eslint | 9.39.4 |
| @eslint/js | 9.39.4 |
| typescript-eslint | 8.26.0 |
| eslint-plugin-react-hooks | 5.2.0 |
| eslint-plugin-react-refresh | 0.4.19 |
| globals | 15.15.0 |
| vitest | Latest (when testing enabled) |
| @testing-library/react | Latest (when testing enabled) |
| @testing-library/jest-dom | Latest (when testing enabled) |

---

## Project Structure

```
src/
  index.ts                          Entry point — greeting, menu, error handling
  types/index.ts                    Cart, ProjectType, ReactViteCore, ChromeExtensionCore, HarnessOnlyCore
  constants/index.ts                Top-level menu options (React+Vite, Chrome Extension, Apply AI Harness, Next.js, Nuxt)
  commands/
    update.ts                       runUpdate() — check and install latest version from npm
  options/
    index.ts                        Top-level project type selection
    react-vite/
      index.ts                      React + Vite menu flow
      constants/index.ts            Menu option definitions (layout, router, state, query, CSS, AI, testing, linter)
      types/index.ts                MenuOptions type
    chrome-extension/
      index.ts                      Chrome Extension menu flow
      constants/index.ts            Menu option definitions (state, query, CSS, AI, linter)
    harness-only/
      index.ts                      Apply AI Harness menu flow
      constants/index.ts            Menu option definitions (project type selection)
  scaffold/
    errors.ts                       ScaffoldError, isNodeError
    utils.ts                        FileMap, dirExists(), writeProjectFile()
    shared/
      claude-setup.ts               Shared Claude Code setup templates
    react-vite/
      index.ts                      Scaffold orchestrator
      templates/
        package-json.ts             packageJsonTemplate(cart)
        vite-config.ts              viteConfigTemplate(cart)
        tsconfig.ts                 tsconfigTemplate(), tsconfigNodeTemplate()
        index-html.ts               indexHtmlTemplate(projectName)
        main-tsx.ts                 mainTsxTemplate(layout)
        app-tsx.ts                  appTsxFsdTemplate(), appTsxBprTemplate()
        router.ts                   rootRouteTemplate(), indexRouteTemplate()
        zustand.ts                  zustandStoreTemplate()
        query.ts                    queryProviderBprTemplate()
        linter.ts                   biomeConfigTemplate(), eslintConfigTemplate()
        testing-setup.ts            vitestConfigTemplate(), testingSetupTemplate()
        styles.ts                   stylesCssTemplate()
        gitignore.ts                gitignoreTemplate()
        claude-setup.ts             claudeSetupTemplate()
        home-page.ts                homePageTemplate()
        vite-env-d-ts.ts            viteEnvDtsTemplate()
        fsd-layout.ts               getFsdFileMap(cart)
        bpr-layout.ts               getBprFileMap(cart)
    chrome-extension/
      index.ts                      Scaffold orchestrator for Chrome extensions
      templates/
        package-json.ts             packageJsonTemplate(cart)
        vite-config.ts              viteConfigTemplate(cart)
        manifest-json.ts            manifestJsonTemplate(cart)
        tsconfig.ts                 tsconfigTemplate()
        main-tsx.ts                 mainTsxTemplate()
        app-tsx.ts                  appTsxTemplate()
        layout.ts                   layoutTemplate()
        linter.ts                   biomeConfigTemplate(), eslintConfigTemplate()
        query.ts                    queryProviderTemplate()
        gitignore.ts                gitignoreTemplate()
        claude-setup.ts             claudeSetupTemplate()
        build-extension-script.ts   buildExtensionScriptTemplate()
    harness-only/
      index.ts                      Scaffold orchestrator for AI harness setup
      templates/
        generic-skeleton.ts         Generic project skeleton
        react-vite-skeleton.ts      React + Vite skeleton
        chrome-extension-skeleton.ts Chrome Extension skeleton
  utils/
    animation.ts                    typeWriter effect
    user.ts                         getUserName() from git config
    check-node-version.ts           checkNodeVersion() — verify Node.js >= 20.0.0
    index.ts                        sleep()
```

---

## Adding a New Project Type

To enable a new project type (e.g., enable Next.js):

1. Set `disabled: false` in `src/constants/index.ts`
2. Create `src/options/<project-name>/` directory with:
   - `index.ts` — menu flow function (e.g. `flowNextJS()`)
   - `constants/index.ts` — menu option definitions
3. Handle the new type in `src/options/index.ts` — import and call the flow function
4. Add the interface to `src/types/index.ts` and include it in the `Cart` union (e.g. `NextJSCore`)
5. Create `src/scaffold/<project-name>/` with:
   - `index.ts` — scaffold orchestrator (spinner, file writing, cleanup on error)
   - `templates/` — all template functions (package.json, config files, source templates)

## Adding a New Option to React + Vite

To add a new menu option (e.g., a new UI library):

1. Add the constant to `src/options/react-vite/constants/index.ts`
   - Define `REACT_MENU_<OPTION_NAME>` with display, value, description, disabled fields
2. Export the value type from `src/types/index.ts` and add the field to `ReactViteCore`
3. Add a `menu<OptionName>` function in `src/options/react-vite/index.ts` using `selectFromMenu`
4. Call it in `flowReactVite` in the right order (before scaffold step)
5. Update `getFsdFileMap` and `getBprFileMap` in `src/scaffold/react-vite/templates/` to handle the new option

## Adding a New Option to Chrome Extension

Same process as React + Vite:

1. Add the constant to `src/options/chrome-extension/constants/index.ts`
2. Export the value type from `src/types/index.ts` and add the field to `ChromeExtensionCore`
3. Add a `menu<OptionName>` function in `src/options/chrome-extension/index.ts`
4. Call it in `flowChromeExtension`
5. Update templates in `src/scaffold/chrome-extension/templates/` to handle the new option

## Adding Support for New Project Types in Apply AI Harness

To add support for a new project type in Apply AI Harness:

1. Create a new skeleton template in `src/scaffold/harness-only/templates/<project-type>-skeleton.ts`
2. Update `src/options/harness-only/constants/index.ts` to include the new project type
3. Update `src/options/harness-only/index.ts` to handle the new type in the menu flow
4. Add the skeleton template to the harness scaffold orchestrator
