import { ReactViteCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';

type Paths = {
  components: string;
  hooks: string;
  stores: string;
  apis: string;
  routes: string;
};

const FSD_PATHS: Paths = {
  components: 'src/**/ui/**/*.tsx,src/shared/ui/**/*.tsx',
  hooks: 'src/**/model/**/*.ts,src/**/lib/**/*.ts',
  stores: 'src/shared/lib/store.ts,src/**/model/**/*.ts',
  apis: 'src/**/api/**/*.ts',
  routes: 'src/routes/**/*.tsx',
};

const BPR_PATHS: Paths = {
  components: 'src/components/**/*.tsx,src/features/*/components/**/*.tsx',
  hooks: 'src/hooks/**/*.ts,src/features/*/hooks/**/*.ts',
  stores: 'src/stores/**/*.ts,src/features/*/stores/**/*.ts',
  apis: 'src/features/*/api/**/*.ts,src/lib/**/*.ts',
  routes: 'src/routes/**/*.tsx',
};

const frontmatter = (applyTo: string): string =>
  `---\napplyTo: "${applyTo}"\n---\n\n`;

const generalTemplate = (cart: ReactViteCore): string => {
  const isFsd = cart.layout === 'FSD';
  const stackLines = [
    '- React 19 + Vite 6 + TypeScript 5',
    `- Architecture: ${isFsd ? 'Feature-Sliced Design (FSD)' : 'Bulletproof React (BPR)'}`,
    cart.router === 'TANSTACK_ROUTER' ? '- Routing: TanStack Router (file-based)' : '- Routing: none',
    cart.stateManagement === 'ZUSTAND' ? '- State: Zustand' : '- State: local React state only',
    cart.query === 'TANSTACK_QUERY' ? '- Server state: TanStack Query' : '- Server state: none',
    cart.css === 'TAILWIND' ? '- CSS: Tailwind CSS v4.1.3 (Vite plugin, `src/index.css`)' : '- CSS: plain CSS',
    cart.linter === 'BIOME'
      ? '- Linter/formatter: Biome (`biome.json`)'
      : cart.linter === 'ESLINT'
      ? '- Linter: ESLint (`eslint.config.js`)'
      : '- Linter: none',
  ].join('\n');

  const layoutBlock = isFsd
    ? `## Architecture — Feature-Sliced Design

Layer order (top → bottom): \`app → pages → widgets → features → entities → shared\`.
A layer may only import from layers **below** it. Never import from \`features\` inside \`shared\`, never import from \`pages\` inside \`widgets\`, and so on.

Inside every slice, only these segments are allowed — do not invent new ones:

- \`ui/\` — React components for the slice
- \`model/\` — state, hooks, selectors, slice-local types
- \`api/\` — network calls, request/response types
- \`lib/\` — pure helpers specific to the slice
- \`config/\` — constants, enums

Where new code belongs:

- Reusable primitive (Button, Input) → \`src/shared/ui/<Name>/\`
- Cross-cutting helper → \`src/shared/lib/\`
- Domain model (User, Post) → \`src/entities/<name>/\`
- User-facing interaction (LoginForm) → \`src/features/<name>/\`
- Composition of features → \`src/widgets/<name>/\`
- Page-level composition → \`src/pages/<name>/ui/<Name>Page.tsx\` with \`src/pages/<name>/index.ts\` barrel

Pages **compose** widgets/features — no business logic inside \`pages/*/ui\`.
`
    : `## Architecture — Bulletproof React

Global, cross-feature folders directly under \`src/\`:

- \`components/\` — app-wide reusable UI primitives. No feature-specific UI.
- \`hooks/\` — hooks used by more than one feature.
- \`utils/\` — pure, framework-agnostic helpers.
- \`lib/\` — configured third-party clients (axios, dayjs).
- \`types/\` — types shared across features.
- \`config/\` — env readers, constants, feature flags.
- \`stores/\` — global stores.
- \`providers/\` — root-level providers. \`providers/index.tsx\` wraps the tree — compose new providers there.

Feature-scoped code lives under \`src/features/<feature>/\` with its own \`components/\`, \`hooks/\`, \`api/\`, \`stores/\`, \`types/\`, \`utils/\`.

Rule of thumb: if only one feature uses it, it stays inside that feature. Promote to \`src/\` only when a second feature needs it.
`;

  return `# Copilot Instructions — ${cart.projectName}

These are the project-wide conventions GitHub Copilot must follow. Match the structure below exactly — do not invent new top-level folders.

Path-specific rules live in \`.github/instructions/*.instructions.md\` — those files apply automatically to the files their \`applyTo\` glob matches.

## Stack
${stackLines}

## Import aliases

Always use path aliases instead of relative imports. Project-wide aliases are pre-configured in \`tsconfig.json\` and \`vite.config.ts\`:

- \`@/*\` → \`./src/\` — use for any import from src, e.g. \`import Button from '@/components/Button'\`.
- \`@components/*\` → \`./src/components/\` — e.g. \`import { Modal } from '@components/Modal'\`.
- \`@pages/*\` → \`./src/pages/\` — e.g. \`import { HomePage } from '@pages/Home'\`.
- \`@utils/*\` → \`./src/utils/\` — e.g. \`import { cn } from '@utils/cn'\`.
- \`@types/*\` → \`./src/types/\` — e.g. \`import type { User } from '@types/user'\`.
- \`@hooks/*\` → \`./src/hooks/\` — e.g. \`import { useAuth } from '@hooks/useAuth'\`.
- \`@layouts/*\` → \`./src/layouts/\` — e.g. \`import { MainLayout } from '@layouts/MainLayout'\`.
- \`@assets/*\` → \`./src/assets/\` — e.g. \`import logo from '@assets/logo.svg'\`.

**Never use relative imports** like \`import Foo from '../../../components/Foo'\`. Always resolve through an alias.

## Naming conventions

- **Components**: \`PascalCase.tsx\`, one component per file, named export (no default).
- **Hooks**: \`useXxx.ts\`, camelCase, named export, must start with \`use\`.
- **Stores** (Zustand): camelCase ending in \`Store.ts\` (e.g. \`authStore.ts\`). Export a typed hook, never the raw store.
- **Types / interfaces**: PascalCase, in \`*.types.ts\` or inline when used in one file only.
- **Constants**: \`UPPER_SNAKE_CASE\`, grouped in \`constants.ts\` per slice/feature.
- **Utility functions**: camelCase, one concern per file, named exports.

${layoutBlock}
## When unsure

Open the closest existing file of the same kind and match its location, casing, and export style.
`;
};

const componentsTemplate = (cart: ReactViteCore): string => {
  const paths = cart.layout === 'FSD' ? FSD_PATHS : BPR_PATHS;
  const placement =
    cart.layout === 'FSD'
      ? `- Reusable primitives (Button, Input, Modal) → \`src/shared/ui/<Name>/<Name>.tsx\`.
- Slice-specific components → \`src/<layer>/<slice>/ui/<Name>.tsx\`.
- Never put a component directly under \`src/pages/<name>/\` — use \`src/pages/<name>/ui/\`.`
      : `- App-wide reusable UI → \`src/components/<Name>/<Name>.tsx\`.
- Feature-specific UI → \`src/features/<feature>/components/<Name>.tsx\`.
- Do **not** put feature-specific components under \`src/components\`.`;

  return (
    frontmatter(paths.components) +
    `# React components

- File name matches the component name exactly: \`UserCard.tsx\` exports \`UserCard\`.
- One component per file. Named export only — never \`export default\`.
- Functional components with TypeScript props interface named \`<Name>Props\`, defined in the same file unless reused.
- Keep JSX return focused. Extract sub-trees into smaller components when the return exceeds ~60 lines.
- Hooks run at the top of the component body, before any conditional return.
- No business logic in components — delegate to hooks, stores, or query functions.
- Co-locate component-scoped styles, stories, and tests next to the component file.

## Where to place a new component

${placement}
`
  );
};

const hooksTemplate = (cart: ReactViteCore): string => {
  const paths = cart.layout === 'FSD' ? FSD_PATHS : BPR_PATHS;
  const placement =
    cart.layout === 'FSD'
      ? `- Slice-specific hook → \`src/<layer>/<slice>/model/useXxx.ts\` (stateful) or \`src/<layer>/<slice>/lib/useXxx.ts\` (pure helper).
- Reusable across slices → \`src/shared/lib/useXxx.ts\`.`
      : `- Cross-feature hook → \`src/hooks/useXxx.ts\`.
- Feature-specific hook → \`src/features/<feature>/hooks/useXxx.ts\`.`;

  return (
    frontmatter(paths.hooks) +
    `# Custom hooks

- File name starts with \`use\` and matches the exported hook: \`useDebouncedValue.ts\` exports \`useDebouncedValue\`.
- One hook per file. Named export only.
- Must call other hooks — if a function does not use any hook, it is a utility, not a hook.
- Return either a tuple \`[value, setter]\` or an object with named fields. Do not mix patterns within one hook.
- Keep hooks focused on one concern. Compose multiple hooks rather than building a single large one.
- Do not call hooks conditionally. Do not rename destructured return values unless renaming makes usage clearer.

## Where to place a new hook

${placement}
`
  );
};

const routerTemplate = (cart: ReactViteCore): string => {
  const paths = cart.layout === 'FSD' ? FSD_PATHS : BPR_PATHS;
  return (
    frontmatter(paths.routes) +
    `# TanStack Router (file-based)

- Every file in \`src/routes/\` is a route. Do not create unrelated helper files here.
- Root layout lives in \`src/routes/__root.tsx\` — wrap \`<Outlet />\` with app-wide chrome (header, devtools, providers that need router context).
- Leaf routes use \`createFileRoute('/path')\` and export \`Route\`. File name matches the URL segment.
- Dynamic segments use \`$param\` file names: \`src/routes/posts/$postId.tsx\`.
- Co-locate the route's \`loader\`, \`beforeLoad\`, and \`component\` in the same file. Push heavy logic into hooks / query functions imported from the feature folder.
- **Never edit \`src/routes/routeTree.gen.ts\`** — it is regenerated on dev/build.
- Internal navigation uses \`<Link to="..." />\` from \`@tanstack/react-router\`. Do not use \`<a href>\` for in-app links.
- Type-safe search params: declare them in the route's \`validateSearch\` and read via \`Route.useSearch()\`.
`
  );
};

const zustandTemplate = (cart: ReactViteCore): string => {
  const paths = cart.layout === 'FSD' ? FSD_PATHS : BPR_PATHS;
  const initialPath = cart.layout === 'FSD' ? 'src/shared/lib/store.ts' : 'src/stores/appStore.ts';
  const newStorePath =
    cart.layout === 'FSD'
      ? '- New global store → \`src/shared/lib/<name>Store.ts\`.\n- Entity-owned store → \`src/entities/<name>/model/store.ts\`.'
      : '- New global store → \`src/stores/<name>Store.ts\`.\n- Feature-scoped store → \`src/features/<feature>/stores/<name>Store.ts\`.';

  return (
    frontmatter(paths.stores) +
    `# Zustand stores

- Initial store lives at \`${initialPath}\`.
- One slice per concern — never pile unrelated state into a single store.
- Export a **typed hook** (e.g. \`useAuthStore\`). Never export the raw store object or the \`create\` result directly.
- Use selectors at call sites to read only what you need: \`const user = useAuthStore(s => s.user)\`. This avoids re-rendering on unrelated state changes.
- Derived values belong in selectors, not inside the store.
- Async actions go inside the store definition. They read/write state via \`set\` / \`get\`.
- Shape a store as \`{ ...state, ...actions }\`. Actions are methods, not separate exports.
- For cross-slice reads, use individual selectors — do not merge stores.

## Where to place a new store

${newStorePath}
`
  );
};

const queryTemplate = (cart: ReactViteCore): string => {
  const paths = cart.layout === 'FSD' ? FSD_PATHS : BPR_PATHS;
  const keysPath =
    cart.layout === 'FSD'
      ? `- Query keys, query functions, and hooks live in \`src/<layer>/<slice>/api/\`:
  - \`keys.ts\` — exported query key factories
  - \`queries.ts\` — \`useXxxQuery\` / \`useXxxMutation\` hooks wrapping \`useQuery\` / \`useMutation\``
      : `- Query keys, query functions, and hooks live in \`src/features/<feature>/api/\`:
  - \`keys.ts\` — exported query key factories
  - \`queries.ts\` — \`useXxxQuery\` / \`useXxxMutation\` hooks wrapping \`useQuery\` / \`useMutation\``;

  return (
    frontmatter(paths.apis) +
    `# TanStack Query

- A single \`QueryClient\` is already instantiated in the root provider. Do **not** create additional clients.
- Do not call \`useQuery\` / \`useMutation\` directly in leaf components unless the component is a page-level container. Wrap them in a hook inside the feature/slice.

## Query keys

- Use a **query key factory** per feature/slice — do not scatter string literals.
- Factory shape: \`export const postKeys = { all: ['posts'] as const, list: (f) => [...postKeys.all, 'list', f] as const, detail: (id) => [...postKeys.all, 'detail', id] as const };\`
- Invalidate via the factory: \`queryClient.invalidateQueries({ queryKey: postKeys.all })\`.

## Query functions

- Query functions return parsed, typed data — no raw \`Response\`. Throw on non-2xx.
- Mutations invalidate relevant keys in \`onSuccess\`; never manually refetch by calling queries.
- Prefer \`select\` for view-model transforms so the cached data stays normalized.

## Where to place queries

${keysPath}
`
  );
};

const tailwindTemplate = (cart: ReactViteCore): string => {
  const paths = cart.layout === 'FSD' ? FSD_PATHS : BPR_PATHS;
  return (
    frontmatter(paths.components) +
    `# Tailwind CSS v4

> **This project uses Tailwind CSS v4.** v4 removes \`tailwind.config.js\` entirely.
> All theme customization is done inside \`src/index.css\` using the \`@theme\` directive.
> Do NOT create or reference \`tailwind.config.js\`, \`tailwind.config.ts\`, or \`postcss.config.*\`.

## Entry point

\`src/index.css\` is the single Tailwind entry point — the only file that contains \`@import "tailwindcss"\`.
Import it once in \`src/main.tsx\`. Do not add additional Tailwind imports elsewhere.

## Using utilities

- Use Tailwind utility classes directly in JSX \`className\`. Do not write custom CSS for layout or spacing that a utility already covers.
- Prefer composing utilities over \`@apply\`. Only use \`@apply\` inside \`@layer components\` or \`@layer base\` in \`src/index.css\`, never in component files.
- Do not use inline \`style={{}}\` for values that a Tailwind utility can express.
- Responsive variants go smallest → largest: \`sm:\`, \`md:\`, \`lg:\`, \`xl:\`, \`2xl:\`.
- Dark mode: use the \`dark:\` variant. Do not add a separate CSS file or a manual class toggle.

## Theme customization — colors, spacing, and CSS variables

All design tokens live in \`src/index.css\` under the \`@theme\` block, **not** in a config file.

### Adding custom colors

\`\`\`css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.55 0.22 265);
  --color-brand-light: oklch(0.72 0.14 265);
  --color-brand-dark: oklch(0.38 0.22 265);
}
\`\`\`

This generates \`bg-brand\`, \`text-brand\`, \`border-brand\`, \`fill-brand\`, etc. automatically.

### Namespace → utility mapping (do not invent names outside these namespaces)

| CSS variable | Generated utilities |
|---|---|
| \`--color-*\` | \`bg-*\`, \`text-*\`, \`border-*\`, \`fill-*\`, \`stroke-*\` |
| \`--font-*\` | \`font-*\` (font family) |
| \`--text-*\` | \`text-*\` (font size) |
| \`--font-weight-*\` | \`font-*\` (weight) |
| \`--spacing-*\` | \`p-*\`, \`m-*\`, \`w-*\`, \`h-*\`, \`gap-*\`, etc. |
| \`--radius-*\` | \`rounded-*\` |
| \`--shadow-*\` | \`shadow-*\` |
| \`--breakpoint-*\` | responsive variants (\`sm:\`, \`md:\`, …) |
| \`--animate-*\` | \`animate-*\` |

### Extending vs. replacing defaults

**Extend** (keep defaults, add yours):
\`\`\`css
@theme {
  --color-tahiti: #3ab7bf;   /* new color, defaults kept */
}
\`\`\`

**Replace an entire namespace** (remove all defaults in that group):
\`\`\`css
@theme {
  --color-*: initial;        /* wipe default palette */
  --color-white: #fff;
  --color-primary: oklch(0.55 0.22 265);
}
\`\`\`

**Replace everything** (no defaults at all):
\`\`\`css
@theme {
  --*: initial;
  --spacing: 4px;
  --color-primary: oklch(0.55 0.22 265);
}
\`\`\`

### Variables that reference other variables

Use \`@theme inline\` when a token references another CSS variable:
\`\`\`css
@theme inline {
  --font-sans: var(--font-inter);   /* resolves the value, not the reference */
}
\`\`\`

### Regular CSS variables vs. theme tokens

- \`@theme { --color-brand: … }\` → creates utility classes (\`bg-brand\`, etc.)
- \`:root { --brand-opacity: 0.9; }\` → plain CSS variable, no utility generated

Use \`:root\` for runtime values (e.g., animation targets, JS-readable tokens) that must **not** produce utility classes.

### Defining custom animations

\`\`\`css
@theme {
  --animate-slide-in: slide-in 0.3s ease-out;

  @keyframes slide-in {
    from { transform: translateY(-8px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
}
\`\`\`

### Color format — prefer oklch

Tailwind v4's built-in palette uses oklch. Use oklch for custom colors too so tokens stay perceptually uniform and mix cleanly with the defaults:

\`\`\`css
@theme {
  --color-primary: oklch(0.55 0.22 265);   /* L  C  H */
  --color-muted:   oklch(0.62 0.01 265);
}
\`\`\`

Avoid hex or \`rgb()\` unless matching a fixed brand value.

### Theme variables are also CSS custom properties

Every \`@theme\` variable is a real CSS custom property — read it anywhere:

\`\`\`css
.my-element {
  color: var(--color-primary);   /* same value as the text-primary utility */
}
\`\`\`

Use \`var()\` for CSS that Tailwind utilities cannot express (e.g. complex \`box-shadow\`, SVG \`fill\`, pseudo-element content).

### Semantic token pattern — naming convention

Prefer **semantic names** (\`surface\`, \`text-muted\`, \`border\`) over raw scale names (\`slate-900\`, \`zinc-300\`). Semantic names decouple the design from the specific value and make theming easy:

\`\`\`css
@theme {
  /* Brand */
  --color-primary:       oklch(0.55 0.22 265);
  --color-primary-fg:    oklch(0.97 0.01 265);

  /* Surfaces (dark-first) */
  --color-surface:       oklch(0.11 0.015 265);
  --color-surface-muted: oklch(0.16 0.012 265);
  --color-surface-high:  oklch(0.21 0.010 265);

  /* Text */
  --color-text:          oklch(0.97 0.000 0);
  --color-text-muted:    oklch(0.62 0.010 265);
  --color-text-subtle:   oklch(0.42 0.010 265);

  /* Border */
  --color-border:        oklch(0.28 0.010 265);
}
\`\`\`

This generates: \`bg-primary\`, \`text-primary-fg\`, \`bg-surface\`, \`bg-surface-high/60\`, \`text-text\`, \`text-text-muted\`, \`border-border\`, etc. The \`/opacity\` modifier works on all generated utilities.
`
  );
};

const importsTemplate = (): string => {
  return (
    frontmatter('**') +
    `# Import aliases and code organization

All imports use path aliases defined in \`tsconfig.json\` and \`vite.config.ts\`. This avoids fragile relative paths and makes moving files safe.

## Available aliases

- \`@/*\` → \`./src/\` — shortest form, use when unambiguous
- \`@components/*\` — components in \`./src/components/\`
- \`@pages/*\` — pages in \`./src/pages/\`
- \`@utils/*\` — utilities in \`./src/utils/\`
- \`@types/*\` — types in \`./src/types/\`
- \`@hooks/*\` — hooks in \`./src/hooks/\`
- \`@layouts/*\` — layouts in \`./src/layouts/\`
- \`@assets/*\` — assets in \`./src/assets/\`

## Rules

- **Never use relative imports** (\`../../../\`). Always use an alias.
- **Group imports**: standard library, third-party, then project aliases.
- **Organize by type within a file**: imports, types, constants, then code.

### Examples

✅ Good:
\`\`\`typescript
import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';

import { Button } from '@components/Button';
import { useUser } from '@hooks/useUser';
import type { User } from '@types/user';
import { cn } from '@utils/cn';
\`\`\`

❌ Bad:
\`\`\`typescript
import { Button } from '../../../components/Button';  // relative path
import Button from '@components/Button/Button';       // no file extension in alias
\`\`\`
`
  );
};

const linterTemplate = (cart: ReactViteCore): string => {
  if (cart.linter === 'BIOME') {
    return (
      frontmatter('**') +
      `# Biome

- Configuration: \`biome.json\` at the repo root. Respect the rules it enforces.
- Run \`npm run lint\` and \`npm run format\` before committing.
- Do not disable rules inline (\`// biome-ignore\`) without a comment explaining why.
- Import order, formatting, and unused imports are enforced by Biome — do not manually format differently.
`
    );
  }
  if (cart.linter === 'ESLINT') {
    return (
      frontmatter('**') +
      `# ESLint

- Configuration: \`eslint.config.js\` (flat config) at the repo root.
- Run \`npm run lint\` before committing; fix all errors and warnings.
- Do not add \`// eslint-disable\` or \`/* eslint-disable */\` without a short comment explaining why.
- React hooks rules are enforced — never call hooks conditionally or in loops.
- Unused variables must be prefixed with \`_\` or removed.
`
    );
  }
  return '';
};

export const getCopilotInstructionFiles = (cart: ReactViteCore): FileMap => {
  const hasRouter = cart.router === 'TANSTACK_ROUTER';
  const hasZustand = cart.stateManagement === 'ZUSTAND';
  const hasQuery = cart.query === 'TANSTACK_QUERY';
  const hasLinter = cart.linter !== 'NOT_USING';

  const files: FileMap = [
    { relativePath: '.github/copilot-instructions.md', content: generalTemplate(cart) },
    { relativePath: '.github/instructions/imports.instructions.md', content: importsTemplate() },
    { relativePath: '.github/instructions/components.instructions.md', content: componentsTemplate(cart) },
    { relativePath: '.github/instructions/hooks.instructions.md', content: hooksTemplate(cart) },
  ];

  if (hasRouter) {
    files.push({
      relativePath: '.github/instructions/tanstack-router.instructions.md',
      content: routerTemplate(cart),
    });
  }
  if (hasZustand) {
    files.push({
      relativePath: '.github/instructions/zustand.instructions.md',
      content: zustandTemplate(cart),
    });
  }
  if (hasQuery) {
    files.push({
      relativePath: '.github/instructions/tanstack-query.instructions.md',
      content: queryTemplate(cart),
    });
  }
  if (cart.css === 'TAILWIND') {
    files.push({
      relativePath: '.github/instructions/tailwind.instructions.md',
      content: tailwindTemplate(cart),
    });
  }

  if (hasLinter) {
    files.push({
      relativePath: `.github/instructions/${cart.linter === 'BIOME' ? 'biome' : 'eslint'}.instructions.md`,
      content: linterTemplate(cart),
    });
  }

  return files;
};
