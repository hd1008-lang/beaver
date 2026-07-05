import { ScaffoldError } from '@src/scaffold/errors';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const MAX_WALK_UP = 4;

/**
 * Resolve the absolute path of the package's `harness-assets/` directory.
 *
 * `import.meta.url` for this module resolves differently depending on how the
 * CLI is run: under `tsx src/index.ts` (dev mode) it points at
 * `src/scaffold/shared/`, while after `tsup` bundling (compiled `dist/index.js`)
 * every module's `import.meta.url` collapses to `dist/`. Both cases have
 * `harness-assets/` as a sibling of an ancestor directory, so walk up from this
 * module's own directory until a directory containing `harness-assets/` is found.
 */
export const resolveAssetsDir = (): string => {
  let dir = dirname(fileURLToPath(import.meta.url));

  for (let i = 0; i <= MAX_WALK_UP; i++) {
    const candidate = join(dir, 'harness-assets');
    if (existsSync(candidate)) {
      return candidate;
    }
    dir = dirname(dir);
  }

  throw new ScaffoldError(
    `Could not locate harness-assets/ directory (searched up to ${MAX_WALK_UP} levels above ${dirname(fileURLToPath(import.meta.url))})`
  );
};

/**
 * Read a static asset from `harness-assets/` by its path relative to that
 * directory (e.g. `'scripts/build-docs-index.mjs'`). Used for fully static
 * (zero-token) templates — tokenized templates still interpolate in TS.
 */
export const readAsset = (relPath: string): string =>
  readFileSync(join(resolveAssetsDir(), relPath), 'utf-8');

/**
 * Replace `{{tokenName}}` placeholders in `content` with values from `tokens`.
 * Token names are restricted to `[a-zA-Z0-9_]+` — this intentionally excludes
 * literal `{{ ... }}` occurrences that contain spaces/punctuation (e.g. a JSDoc
 * `{{ decision: 'allow' | 'deny', reason?: string }}` type annotation baked
 * into an asset), so such literals pass through untouched instead of false-
 * positiving the leftover-token check below.
 *
 * Throws if any `{{tokenName}}`-shaped placeholder remains after substitution
 * — this catches token typos (mismatched name between call site and asset)
 * at scaffold time instead of shipping a broken file with a literal `{{...}}`
 * in it.
 */
const TOKEN_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export const interpolate = (content: string, tokens: Record<string, string>): string => {
  const result = content.replace(TOKEN_PATTERN, (match, name: string) => {
    if (!(name in tokens)) return match;
    return tokens[name];
  });

  const leftover = result.match(TOKEN_PATTERN);
  if (leftover) {
    throw new ScaffoldError(`interpolate: unreplaced token(s) remain in output: ${leftover.join(', ')}`);
  }

  return result;
};
