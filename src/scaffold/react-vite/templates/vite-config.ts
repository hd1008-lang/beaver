import { ReactViteCore } from '@src/types';

export const viteConfigTemplate = (cart: ReactViteCore): string => {
  const hasTanstack = cart.router === 'TANSTACK_ROUTER';
  const hasTailwind = cart.css === 'TAILWIND';

  const tailwindImport = hasTailwind ? `import tailwindcss from '@tailwindcss/vite';\n` : '';
  const tanstackImport = hasTanstack
    ? `import { TanStackRouterVite } from '@tanstack/router-vite-plugin';\n`
    : '';
  const tailwindPlugin = hasTailwind ? `\n    tailwindcss(),` : '';
  const tanstackPlugin = hasTanstack
    ? `\n    TanStackRouterVite({ routesDirectory: './src/routes', generatedRouteTree: './src/routes/routeTree.gen.ts' }),`
    : '';

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
${tailwindImport}${tanstackImport}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),${tailwindPlugin}${tanstackPlugin}
  ],
});
`;
};
