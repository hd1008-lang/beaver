import { ReactViteCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';

// Centralized test pattern: all test code lives in the top-level test/ folder,
// never inside src/. Paired *.spec.md contracts under test/specs/ document
// what each test file covers (they are documentation, never executed).

const vitestConfigTemplate = (): string =>
  `import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/_shared/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
    },
  },
}));
`;

const vitestSetupTemplate = (): string =>
  `import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
`;

const testTsconfigTemplate = (hasVitest: boolean): string =>
  JSON.stringify(
    {
      extends: '../tsconfig.json',
      compilerOptions: hasVitest ? { types: ['@testing-library/jest-dom'] } : {},
      include: ['.'],
    },
    null,
    2
  );

const unitHomeTestTemplate = (cart: ReactViteCore): string => {
  const importLine =
    cart.layout === 'FSD'
      ? `import { HomePage } from '@/pages/home';`
      : `import Home from '@/pages/Home';`;
  const component = cart.layout === 'FSD' ? 'HomePage' : 'Home';
  return `import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
${importLine}

// Paired contract: test/specs/unit/pages/home.spec.md
describe('${component}', () => {
  it('renders without crashing', () => {
    const { container } = render(<${component} />);
    expect(container.firstChild).not.toBeNull();
  });
});
`;
};

const unitHomeSpecMdTemplate = (): string =>
  `# home.test.tsx — Contract

Traces to: \`docs/features/home/home.spec.en.md\`

| Case | Covers |
|---|---|
| renders without crashing | The home page mounts with no props and produces DOM output |

Add a row here for every new test case in \`test/unit/pages/home.test.tsx\`.
`;

const playwrightConfigTemplate = (): string =>
  `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
`;

const e2eHomePageObjectTemplate = (): string =>
  `import { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }
}
`;

const e2eHomeSpecTemplate = (projectName: string): string =>
  `import { test, expect } from '@playwright/test';
import { HomePage } from '../_shared/pages/home.page';

// Paired contract: test/specs/e2e/home.spec.md
test('home page loads', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(page).toHaveTitle(/${projectName}/i);
});
`;

const e2eHomeSpecMdTemplate = (): string =>
  `# home.spec.ts — Contract

Traces to: \`docs/features/home/home.spec.en.md\`

| Case | Covers |
|---|---|
| home page loads | Navigating to \`/\` renders the home page with the project title |

Add a row here for every new test case in \`test/e2e/home.spec.ts\`.
`;

const testReadmeTemplate = (cart: ReactViteCore): string => {
  const hasVitest = cart.testing === 'VITEST';
  return `# test/ — Centralized Tests

All test code lives here — never inside \`src/\`. One reviewable location, no test pollution in the source tree, no test-runner config changes needed when adding tests.

## Layout

\`\`\`
test/
${hasVitest
    ? `├── unit/              # mirrors src/ layer structure; <name>.test.{ts,tsx}
`
    : `├── e2e/               # mirrors business flows; <flow>.spec.ts
`}├── _shared/           # fixtures/, helpers/, mocks/${hasVitest ? '' : ', pages/ (Page Object Models)'}
├── specs/             # paired *.spec.md contracts — documentation, NEVER executed
└── tsconfig.json      # extends root tsconfig for editor support
\`\`\`

## Conventions

- Every test file has a paired contract at \`test/specs/<same-path>/<name>.spec.md\` listing what each case covers and which feature spec (\`docs/features/\`) it traces to. Update both together.
${hasVitest
    ? `- Unit tests import app code via the \`@/\` alias and use explicit vitest imports.
- Component tests use Testing Library — query by role/label, never by class name.

## Running

- \`npm test\` — watch mode
- \`npm run test:run\` — single run (CI)
- \`npm run coverage\` — with coverage report`
    : `- E2E specs stay thin — page interactions belong in Page Object Models under \`test/_shared/pages/\`.

## Running

- \`npm run test:e2e\` — runs Playwright (starts the dev server automatically)`}
`;
};

export const getTestingFileMap = (cart: ReactViteCore): FileMap => {
  const files: FileMap = [];

  if (cart.testing === 'VITEST') {
    files.push(
      { relativePath: 'vitest.config.ts', content: vitestConfigTemplate() },
      { relativePath: 'test/README.md', content: testReadmeTemplate(cart) },
      { relativePath: 'test/tsconfig.json', content: testTsconfigTemplate(true) },
      { relativePath: 'test/_shared/setup.ts', content: vitestSetupTemplate() },
      { relativePath: 'test/_shared/fixtures/.gitkeep', content: '' },
      { relativePath: 'test/_shared/helpers/.gitkeep', content: '' },
      { relativePath: 'test/_shared/mocks/.gitkeep', content: '' },
      { relativePath: 'test/unit/pages/home.test.tsx', content: unitHomeTestTemplate(cart) },
      { relativePath: 'test/specs/unit/pages/home.spec.md', content: unitHomeSpecMdTemplate() },
    );
  }

  if (cart.testing === 'PLAYWRIGHT') {
    files.push(
      { relativePath: 'playwright.config.ts', content: playwrightConfigTemplate() },
      { relativePath: 'test/README.md', content: testReadmeTemplate(cart) },
      { relativePath: 'test/tsconfig.json', content: testTsconfigTemplate(false) },
      { relativePath: 'test/_shared/fixtures/.gitkeep', content: '' },
      { relativePath: 'test/_shared/helpers/.gitkeep', content: '' },
      { relativePath: 'test/_shared/mocks/.gitkeep', content: '' },
      { relativePath: 'test/_shared/pages/home.page.ts', content: e2eHomePageObjectTemplate() },
      { relativePath: 'test/e2e/home.spec.ts', content: e2eHomeSpecTemplate(cart.projectName) },
      { relativePath: 'test/specs/e2e/home.spec.md', content: e2eHomeSpecMdTemplate() },
    );
  }

  return files;
};
