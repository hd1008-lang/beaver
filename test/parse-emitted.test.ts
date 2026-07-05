import { parse as parseToml } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import { buildClaudeFileMap } from '@src/scaffold/shared/claude-setup';
import { beaverParams } from './helpers/beaver-params';

// Every emitted .json/.toml file must be syntactically valid — catches broken
// interpolation (e.g. an unescaped value producing invalid JSON/TOML) that a
// pure string-content test wouldn't notice.

const files = buildClaudeFileMap({
  ...beaverParams,
  harness: 'both',
  testing: {
    testWriterAgent: '# test-writer\n\nplaceholder test-writer agent body.\n',
    testAuthorSkill: '# test-author skill\n\nplaceholder test-author skill body.\n',
  },
});

describe('parse-emitted (both + testing render)', () => {
  const jsonFiles = files.filter((f) => f.relativePath.endsWith('.json'));
  const tomlFiles = files.filter((f) => f.relativePath.endsWith('.toml'));

  it('has at least one .json and one .toml file to check', () => {
    expect(jsonFiles.length).toBeGreaterThan(0);
    expect(tomlFiles.length).toBeGreaterThan(0);
  });

  for (const file of jsonFiles) {
    it(`${file.relativePath} is valid JSON`, () => {
      expect(() => JSON.parse(file.content)).not.toThrow();
    });
  }

  for (const file of tomlFiles) {
    it(`${file.relativePath} is valid TOML`, () => {
      expect(() => parseToml(file.content)).not.toThrow();
    });
  }
});
