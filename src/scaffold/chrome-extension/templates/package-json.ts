import { ChromeExtensionCore } from '@src/types';

export const packageJsonTemplate = (cart: ChromeExtensionCore): string => {
  const deps: Record<string, string> = {
    react: '19.1.0',
    'react-dom': '19.1.0',
  };

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
    vite: '6.3.1',
  };

  if (cart.css === 'TAILWIND') {
    devDeps['@tailwindcss/vite'] = '4.1.3';
    devDeps['tailwindcss'] = '4.1.3';
  }

  if (cart.linter === 'BIOME') {
    devDeps['@biomejs/biome'] = '1.9.4';
  } else if (cart.linter === 'ESLINT') {
    devDeps['@eslint/js'] = '9.22.0';
    devDeps['eslint'] = '9.22.0';
    devDeps['eslint-plugin-react-hooks'] = '5.2.0';
    devDeps['eslint-plugin-react-refresh'] = '0.4.19';
    devDeps['globals'] = '15.15.0';
    devDeps['typescript-eslint'] = '8.26.0';
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: 'tsc && vite build',
    'build-extension': 'node scripts/build-extension.js',
    preview: 'vite preview',
  };

  if (cart.linter === 'BIOME') {
    scripts['lint'] = 'biome check .';
    scripts['format'] = 'biome format --write .';
  } else if (cart.linter === 'ESLINT') {
    scripts['lint'] = 'eslint .';
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
