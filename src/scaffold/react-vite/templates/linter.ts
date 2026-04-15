export const biomeConfigTemplate = (): string =>
  JSON.stringify(
    {
      $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
      organizeImports: { enabled: true },
      linter: {
        enabled: true,
        rules: { recommended: true },
      },
      formatter: {
        enabled: true,
        indentStyle: 'space',
        indentWidth: 2,
      },
      javascript: {
        formatter: { quoteStyle: 'single' },
      },
    },
    null,
    2
  );

export const eslintConfigTemplate = (): string =>
  `import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
`;
