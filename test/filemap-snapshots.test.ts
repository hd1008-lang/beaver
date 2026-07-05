import { describe, expect, it } from 'vitest';
import { buildClaudeFileMap, ClaudeHarnessParams } from '@src/scaffold/shared/claude-setup';
import { beaverParams } from './helpers/beaver-params';

// Snapshot coverage for buildClaudeFileMap across the harness × testing matrix.
// Layout (FSD/BPR) is a project-type-owned concern (CLAUDE.md/conventions
// skill/dev agent are passed in as opaque strings) — it does not feed
// ClaudeHarnessParams, so it is out of scope for these harness-map snapshots.

const HARNESSES = ['claude', 'codex', 'both'] as const;

const withTesting = (params: ClaudeHarnessParams): ClaudeHarnessParams => ({
  ...params,
  testing: {
    testWriterAgent: '# test-writer\n\nplaceholder test-writer agent body.\n',
    testAuthorSkill: '# test-author skill\n\nplaceholder test-author skill body.\n',
  },
});

const combos = HARNESSES.flatMap((harness) => [
  { name: `${harness}-no-testing`, params: { ...beaverParams, harness } },
  { name: `${harness}-testing`, params: withTesting({ ...beaverParams, harness }) },
]);

describe('filemap snapshots', () => {
  for (const { name, params } of combos) {
    it(`${name}: structure`, () => {
      const files = buildClaudeFileMap(params);
      const paths = files.map((f) => f.relativePath).sort();
      expect(paths).toMatchSnapshot();
    });
  }

  // Full-content snapshot for one combo only (both + testing) — keeps snapshot
  // churn reviewable (see phase 07 notes: do not snapshot all 6 combos' content).
  it('both-testing: full content', () => {
    const files = buildClaudeFileMap(withTesting({ ...beaverParams, harness: 'both' }));
    const sorted = [...files].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    expect(sorted).toMatchSnapshot();
  });

  describe('invariants', () => {
    for (const { name, params } of combos) {
      it(`${name}: no duplicate relativePath`, () => {
        const files = buildClaudeFileMap(params);
        const paths = files.map((f) => f.relativePath);
        expect(new Set(paths).size).toBe(paths.length);
      });
    }

    it('codex-only render emits no .claude/ paths', () => {
      const files = buildClaudeFileMap({ ...beaverParams, harness: 'codex' });
      const claudePaths = files.filter((f) => f.relativePath.startsWith('.claude/'));
      expect(claudePaths).toEqual([]);
    });

    it('codex-only + testing render emits no .claude/ paths', () => {
      const files = buildClaudeFileMap(withTesting({ ...beaverParams, harness: 'codex' }));
      const claudePaths = files.filter((f) => f.relativePath.startsWith('.claude/'));
      expect(claudePaths).toEqual([]);
    });

    it('claude-only render emits no .codex/ paths', () => {
      const files = buildClaudeFileMap({ ...beaverParams, harness: 'claude' });
      const codexPaths = files.filter((f) => f.relativePath.startsWith('.codex/'));
      expect(codexPaths).toEqual([]);
    });

    it('claude-only + testing render emits no .codex/ paths', () => {
      const files = buildClaudeFileMap(withTesting({ ...beaverParams, harness: 'claude' }));
      const codexPaths = files.filter((f) => f.relativePath.startsWith('.codex/'));
      expect(codexPaths).toEqual([]);
    });
  });
});
