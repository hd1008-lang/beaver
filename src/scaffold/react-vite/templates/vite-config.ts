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
import path from 'path';
${tailwindImport}${tanstackImport}
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  plugins: [
    react(),${tailwindPlugin}${tanstackPlugin}
  ],
});
`;
};
