// Shared helpers for docs tooling — single source of truth for the frontmatter schema.
import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

export const DOCS_DIR = 'docs';
export const SKIP_FILES = new Set(['INDEX.md', 'README.md', '_template.md']);

export const ENUMS = {
  flow: ["menu","scaffold","templates","infra","architecture","onboarding","_meta"],
  layer: ["options","scaffold","types","constants","utils","_cross"],
  status: ["active","draft","deprecated"],
  lang: ["en","vi"],
};

export const REQUIRED_FIELDS = ['title', 'feature', 'flow', 'layer', 'status', 'lang', 'keywords', 'updated'];

// Minimal YAML frontmatter parser: scalar values and inline arrays ([a, b]).
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).replace(/\s+#.*$/, '').trim();
    if (!key) continue;
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      meta[key] = inner === ''
        ? []
        : inner.split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return meta;
}

export function firstHeading(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// Walks docs/**/*.md (excluding SKIP_FILES) and returns parsed records.
export function walkDocs(dir = DOCS_DIR, records = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      walkDocs(fullPath, records);
    } else if (item.name.endsWith('.md') && !SKIP_FILES.has(item.name)) {
      const content = readFileSync(fullPath, 'utf-8');
      records.push({
        path: relative(DOCS_DIR, fullPath),
        fm: parseFrontmatter(content),
        title: firstHeading(content),
      });
    }
  }
  return records;
}
