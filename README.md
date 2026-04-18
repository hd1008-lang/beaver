<div align="center"><img width="400" height="225" alt="Image" src="https://github.com/user-attachments/assets/d233a5ee-ef86-4f25-adb3-31fe191a08a9" /></div>

# Beaver

An interactive CLI tool for scaffolding modern web projects. Select your project type, configure your stack through a guided menu, and get a production-ready project generated on disk with pinned library versions.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Usage

Run interactively in development mode:

```bash
npm run dev
```

Or build and run the compiled output:

```bash
npm run dev:build
```

Build for distribution:

```bash
npm run build
```

---

## Project Types

| Type | Status |
|---|---|
| React + Vite | Available |
| Chrome Extension | Available |
| Next.js | Upcoming |
| Nuxt | Upcoming |

---

## React + Vite

The CLI walks you through the following choices:

### 1. Project Name

Validated to allow only letters, numbers, hyphens, and underscores (`[a-zA-Z0-9_-]`).

### 2. Layout

| Option | Description |
|---|---|
| FSD | Feature Slice Design |
| BPR | Bulletproof React |

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

### 7. Linter / Formatter

| Option | Version | Notes |
|---|---|---|
| Not Using | — | — |
| Biome | v1.9.4 | All-in-one lint + format |
| ESLint | v9.22.0 | Flat config + typescript-eslint |

---

## Generated Project — Copilot Instructions

Every scaffolded project includes a set of GitHub Copilot custom instructions so that AI-assisted coding inside the project follows the conventions of the chosen stack. The files are layout-aware — the `applyTo` glob patterns and placement rules change between FSD and BPR.

Files emitted in the generated project:

| File | Scope | Emitted when |
|---|---|---|
| `.github/copilot-instructions.md` | Repo-wide overview — stack, naming, architecture | Always |
| `.github/instructions/components.instructions.md` | Component file paths per layout | Always |
| `.github/instructions/hooks.instructions.md` | Hook file paths per layout | Always |
| `.github/instructions/tanstack-router.instructions.md` | `src/routes/**/*.tsx` | Router = TanStack Router |
| `.github/instructions/zustand.instructions.md` | Store file paths per layout | State = Zustand |
| `.github/instructions/tanstack-query.instructions.md` | API/query file paths per layout | Query = TanStack Query |
| `.github/instructions/biome.instructions.md` or `eslint.instructions.md` | `**` | Linter ≠ none |

The format follows GitHub's [path-specific custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions#creating-path-specific-custom-instructions) spec (`applyTo` frontmatter).

**Rule for contributors:** every new option added to the CLI (new router, new state library, new UI framework, etc.) must ship with its own instruction template in `src/scaffold/react-vite/templates/copilot-instructions.ts`. See [Adding a New Option to React + Vite](#adding-a-new-option-to-react--vite) below.

---

## Generated Project — Pinned Dependencies

| Package | Version |
|---|---|
| react | 19.1.0 |
| react-dom | 19.1.0 |
| vite | 6.3.1 |
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
| eslint | 9.22.0 |
| @eslint/js | 9.22.0 |
| typescript-eslint | 8.26.0 |
| eslint-plugin-react-hooks | 5.2.0 |
| eslint-plugin-react-refresh | 0.4.19 |
| globals | 15.15.0 |

---

## Project Structure

```
src/
  index.ts                        Entry point — greeting, menu, error handling
  types/index.ts                  Cart, ProjectType, ReactViteCore, NextJSCore
  constants/index.ts              Top-level menu options
  options/
    index.ts                      Top-level project type selection
    react-vite/
      index.ts                    React + Vite menu flow
      constants/index.ts          Menu option definitions
      types/index.ts              MenuOptions type
  scaffold/
    errors.ts                     ScaffoldError, isNodeError
    utils.ts                      FileMap, dirExists(), writeProjectFile()
    react-vite/
      index.ts                    Scaffold orchestrator
      templates/
        package-json.ts           packageJsonTemplate(cart)
        vite-config.ts            viteConfigTemplate(cart)
        tsconfig.ts               tsconfigTemplate(), tsconfigNodeTemplate()
        index-html.ts             indexHtmlTemplate(projectName)
        main-tsx.ts               mainTsxTemplate(layout)
        app-tsx.ts                appTsxFsdTemplate(), appTsxBprTemplate()
        router.ts                 rootRouteTemplate(), indexRouteTemplate()
        zustand.ts                zustandStoreTemplate()
        query.ts                  queryProviderBprTemplate()
        linter.ts                 biomeConfigTemplate(), eslintConfigTemplate()
        gitignore.ts              gitignoreTemplate()
        copilot-instructions.ts   getCopilotInstructionFiles(cart) — Copilot instruction set
        fsd-layout.ts             getFsdFileMap(cart)
        bpr-layout.ts             getBprFileMap(cart)
  utils/
    animation.ts                  typeWriter effect
    user.ts                       getUserName() from git config
    index.ts                      sleep()
```

---

## Adding a New Project Type

1. Set `disabled: false` in `src/constants/index.ts`
2. Create `src/options/<project-name>/` with constants, types, and flow functions
3. Handle the new type in `src/options/index.ts`
4. Add the interface to `src/types/index.ts` and include it in the `Cart` union
5. Create `src/scaffold/<project-name>/` with templates and an orchestrator

## Adding a New Option to React + Vite

1. Add the constant to `src/options/react-vite/constants/index.ts`
2. Export the value type from `src/types/index.ts` and add the field to `ReactViteCore`
3. Add a `menu<OptionName>` function in `src/options/react-vite/index.ts`
4. Call it in `flowReactVite`
5. Update `getFsdFileMap` and `getBprFileMap` to handle the new option
6. **Add a Copilot instruction template** in `src/scaffold/react-vite/templates/copilot-instructions.ts`:
   - Write a new template function (e.g. `newOptionTemplate(cart)`) returning a markdown string that starts with an `applyTo` frontmatter block scoped to the right paths for both FSD and BPR (use `FSD_PATHS` / `BPR_PATHS`)
   - Register it inside `getCopilotInstructionFiles` under a conditional block keyed by the new cart field
   - If the new option introduces a new kind of file path, extend the `Paths` type and both `FSD_PATHS` / `BPR_PATHS` maps so every path-specific rule stays layout-aware

   This step is mandatory — any user who scaffolds a project with the new option must get a matching Copilot instruction file automatically.
