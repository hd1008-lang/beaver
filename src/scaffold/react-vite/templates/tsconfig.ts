export const tsconfigTemplate = (): string =>
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
          '@components/*': ['./src/components/*'],
          '@pages/*': ['./src/pages/*'],
          '@utils/*': ['./src/utils/*'],
          '@types/*': ['./src/types/*'],
          '@hooks/*': ['./src/hooks/*'],
          '@layouts/*': ['./src/layouts/*'],
          '@assets/*': ['./src/assets/*'],
        },
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    },
    null,
    2
  );

export const tsconfigNodeTemplate = (): string =>
  JSON.stringify(
    {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        strict: true,
      },
      include: ['vite.config.ts'],
    },
    null,
    2
  );
