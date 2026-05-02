import { ChromeExtensionCore } from '@src/types';

export const viteConfigTemplate = (cart: ChromeExtensionCore): string => {
  const hasTailwind = cart.css === 'TAILWIND';

  const imports = [
    `import { defineConfig } from 'vite';`,
    `import react from '@vitejs/plugin-react';`,
    `import path from 'path';`,
    hasTailwind ? `import tailwindcss from '@tailwindcss/vite';` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const plugins = ['react()', hasTailwind ? 'tailwindcss()' : '']
    .filter(Boolean)
    .join(',\n    ');

  return `${imports}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  plugins: [
    ${plugins},
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
`;
};
