import { describe, expect, it } from 'vitest';
import { interpolate, readAsset, resolveAssetsDir } from '@src/scaffold/shared/assets';

describe('interpolate', () => {
  it('replaces a single token', () => {
    expect(interpolate('hello {{name}}', { name: 'world' })).toBe('hello world');
  });

  it('replaces multiple distinct tokens', () => {
    expect(interpolate('{{a}}-{{b}}-{{a}}', { a: '1', b: '2' })).toBe('1-2-1');
  });

  it('throws on a leftover unresolved token', () => {
    expect(() => interpolate('hello {{name}}', {})).toThrow(/unreplaced token/);
  });

  it('leaves a punctuation-shaped {{ ... }} untouched (not a valid token name)', () => {
    const content = "type Decision = {{ decision: 'allow' | 'deny', reason?: string }};";
    expect(interpolate(content, {})).toBe(content);
  });

  it('does not throw on unrelated {{ ... }} punctuation blocks even with real tokens present', () => {
    const content = "{{name}} — {{ decision: 'allow' | 'deny' }}";
    expect(interpolate(content, { name: 'x' })).toBe("x — {{ decision: 'allow' | 'deny' }}");
  });
});

describe('resolveAssetsDir', () => {
  it('finds the harness-assets/ directory from the source tree', () => {
    const dir = resolveAssetsDir();
    expect(dir.replace(/\\/g, '/')).toMatch(/harness-assets$/);
  });

  it('readAsset can read a known static asset through the resolved dir', () => {
    const content = readAsset('scripts/build-docs-index.mjs');
    expect(content.length).toBeGreaterThan(0);
  });
});
