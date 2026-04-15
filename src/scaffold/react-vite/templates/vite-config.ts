import { ReactViteCore } from '@src/types';

export const viteConfigTemplate = (cart: ReactViteCore): string => {
  const hasTanstack = cart.router === 'TANSTACK_ROUTER';
  const tanstackImport = hasTanstack
    ? `import { TanStackRouterVite } from '@tanstack/router-vite-plugin';\n`
    : '';
  const tanstackPlugin = hasTanstack
    ? `\n    TanStackRouterVite({ routesDirectory: './src/routes' }),`
    : '';

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
${tanstackImport}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),${tanstackPlugin}
  ],
});
`;
};
