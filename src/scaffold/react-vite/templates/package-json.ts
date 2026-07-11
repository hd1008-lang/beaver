import { ReactViteCore } from '@src/types';

export const packageJsonTemplate = (cart: ReactViteCore): string => {
  const deps: Record<string, string> = {
    react: '19.1.0',
    'react-dom': '19.1.0',
  };

  if (cart.router === 'TANSTACK_ROUTER') {
    deps['@tanstack/react-router'] = '1.144.0';
  }
  if (cart.stateManagement === 'ZUSTAND') {
    deps['zustand'] = '5.0.5';
  }
  if (cart.query === 'TANSTACK_QUERY') {
    deps['@tanstack/react-query'] = '5.74.4';
    deps['@tanstack/react-query-devtools'] = '5.74.4';
  }

  const devDeps: Record<string, string> = {
    '@types/react': '19.1.1',
    '@types/react-dom': '19.1.1',
    '@vitejs/plugin-react': '4.4.1',
    typescript: '5.8.3',
    vite: '6.4.3',
  };

  if (cart.router === 'TANSTACK_ROUTER') {
    devDeps['@tanstack/router-devtools'] = '1.144.0';
    devDeps['@tanstack/router-vite-plugin'] = '1.144.0';
  }

  if (cart.css === 'TAILWIND') {
    devDeps['@tailwindcss/vite'] = '4.1.3';
    devDeps['tailwindcss'] = '4.1.3';
  }

  if (cart.linter === 'BIOME') {
    devDeps['@biomejs/biome'] = '1.9.4';
  } else if (cart.linter === 'ESLINT') {
    devDeps['@eslint/js'] = '9.39.4';
    devDeps['eslint'] = '9.39.4';
    devDeps['eslint-plugin-react-hooks'] = '5.2.0';
    devDeps['eslint-plugin-react-refresh'] = '0.4.19';
    devDeps['globals'] = '15.15.0';
    devDeps['typescript-eslint'] = '8.26.0';
  }

  if (cart.testing === 'VITEST') {
    devDeps['vitest'] = '3.2.4';
    devDeps['@vitest/coverage-v8'] = '3.2.4';
    devDeps['@testing-library/react'] = '16.3.0';
    devDeps['@testing-library/jest-dom'] = '6.6.3';
    devDeps['jsdom'] = '26.1.0';
  }

  if (cart.testing === 'PLAYWRIGHT') {
    devDeps['@playwright/test'] = '1.52.0';
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    // TanStack Router's Vite plugin regenerates src/routes/routeTree.gen.ts
    // (scaffolded as a type-unchecked placeholder, see router.ts) during its
    // Vite build hooks, before Rollup processes source files. `tsc` runs
    // before `vite build` ever gets a chance to do that, so the placeholder's
    // untyped createFileRoute('/') calls fail tsc on the very first build
    // (backlog/0019). Reordering so vite build runs first lets the plugin
    // regenerate the tree with full type info before tsc checks it — the
    // trade-off is losing tsc's fail-fast-before-bundling guarantee for this
    // case, which only the router path needs to accept.
    build: cart.router === 'TANSTACK_ROUTER' ? 'vite build && tsc --noEmit' : 'tsc && vite build',
    preview: 'vite preview',
  };

  if (cart.linter === 'BIOME') {
    scripts['lint'] = 'biome check .';
    scripts['format'] = 'biome format --write .';
  } else if (cart.linter === 'ESLINT') {
    scripts['lint'] = 'eslint .';
  }

  if (cart.testing === 'VITEST') {
    scripts['test'] = 'vitest';
    scripts['test:run'] = 'vitest run';
    scripts['coverage'] = 'vitest run --coverage';
  }

  if (cart.testing === 'PLAYWRIGHT') {
    scripts['test:e2e'] = 'playwright test';
  }

  return JSON.stringify(
    {
      name: cart.projectName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts,
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2
  );
};
