import path from 'path';
import { scaffoldReactVite } from '@src/scaffold/react-vite';
import { Cart } from '@src/types';
import { MENU_OPTIONS_LEVEL_1 } from '@src/constants';

// Non-interactive scaffold entry point for CI. Not run through the interactive
// menu — a full-featured hardcoded cart exercises every pinned dependency
// (router + zustand + query + tailwind + biome, harness both, testing on).
// Usage: npx tsx test/helpers/scaffold-fixture.ts <absolute-target-path>
//
// scaffoldReactVite resolves projectName relative to process.cwd() (it's a
// bare directory name, not a path, since slugs derived from it are embedded
// in nested file paths) — so chdir into the target's parent and scaffold the
// basename, mirroring how the interactive CLI is actually invoked.

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Usage: npx tsx test/helpers/scaffold-fixture.ts <absolute-target-path>');
  process.exit(1);
}

process.chdir(path.dirname(targetPath));

const cart: Cart = {
  type: MENU_OPTIONS_LEVEL_1.ReactVite.value,
  projectName: path.basename(targetPath),
  layout: 'FSD',
  router: 'TANSTACK_ROUTER',
  stateManagement: 'ZUSTAND',
  query: 'TANSTACK_QUERY',
  css: 'TAILWIND',
  linter: 'BIOME',
  testing: 'VITEST',
  ai: 'BOTH',
  productDescription: 'a CI fixture project exercising every pinned dependency',
};

await scaffoldReactVite(cart);
