// ──────────────────────────────────────────────
// FSD — src/app/index.tsx
// ──────────────────────────────────────────────

export const appTsxFsdTemplate = (
  hasRouter: boolean,
  hasQuery: boolean
): string => {
  const queryImports = hasQuery
    ? `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\nimport { ReactQueryDevtools } from '@tanstack/react-query-devtools';\n`
    : '';
  const queryClientDef = hasQuery ? `\nconst queryClient = new QueryClient();\n` : '';

  const routerImports = hasRouter
    ? `import { RouterProvider, createRouter } from '@tanstack/react-router';\nimport { routeTree } from '../routes/routeTree.gen';\n\nconst router = createRouter({ routeTree });\n\ndeclare module '@tanstack/react-router' {\n  interface Register {\n    router: typeof router;\n  }\n}\n`
    : '';

  const homeImport = !hasRouter ? `import { HomePage } from '@/pages/home';\n` : '';

  const inner = hasRouter
    ? `<RouterProvider router={router} />`
    : `<HomePage />`;

  if (hasQuery) {
    return `${queryImports}${homeImport}${routerImports}${queryClientDef}
export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      ${inner}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
`;
  }

  if (hasRouter) {
    return `${routerImports}
export const App = () => {
  return <RouterProvider router={router} />;
};
`;
  }

  return `${homeImport}
export const App = () => {
  return <HomePage />;
};
`;
};

// ──────────────────────────────────────────────
// BPR — src/App.tsx
// ──────────────────────────────────────────────

export const appTsxBprTemplate = (
  hasRouter: boolean,
  hasQuery: boolean
): string => {
  const providerImport = hasQuery
    ? `import { AppProvider } from './providers';\n`
    : '';

  const routerImports = hasRouter
    ? `import { RouterProvider, createRouter } from '@tanstack/react-router';\nimport { routeTree } from './routes/routeTree.gen';\n\nconst router = createRouter({ routeTree });\n\ndeclare module '@tanstack/react-router' {\n  interface Register {\n    router: typeof router;\n  }\n}\n`
    : '';

  const homeImport = !hasRouter ? `import Home from '@/pages/Home';\n` : '';

  const inner = hasRouter
    ? `<RouterProvider router={router} />`
    : `<Home />`;

  const body = hasQuery
    ? `<AppProvider>\n      ${inner}\n    </AppProvider>`
    : inner;

  return `${providerImport}${homeImport}${routerImports}
const App = () => {
  return (
    ${body}
  );
};

export default App;
`;
};
