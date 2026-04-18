import { ChromeExtensionCore } from '@src/types';

export const viteConfigTemplate = (cart: ChromeExtensionCore): string => {
  const hasTailwind = cart.css === 'TAILWIND';

  const imports = [
    `import { defineConfig } from 'vite';`,
    `import react from '@vitejs/plugin-react';`,
    hasTailwind ? `import tailwindcss from '@tailwindcss/vite';` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const plugins = ['react()', hasTailwind ? 'tailwindcss()' : '']
    .filter(Boolean)
    .join(',\n    ');

  return `${imports}

export default defineConfig({
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
