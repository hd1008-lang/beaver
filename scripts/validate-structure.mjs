// Mechanically checks derived invariants between the AGENTS registry, emitted
// agent .md files, and the guard. Generated from the AGENTS registry at scaffold
// time — do not edit by hand.
// Run via: node scripts/validate-structure.mjs
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// Baked at scaffold time from the AGENTS registry.
const WRITE_SCOPES = {
  "dev": [
    "src/",
    "test/",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "biome.json",
    "eslint.config.js",
    ".github/",
    "backlog/",
    "plans/"
  ],
  "docs-writer": [
    "docs/"
  ],
  "planner": [
    "plans/"
  ],
  "advisor": [],
  "scout": []
};

// Minimal frontmatter parser (no external deps — inlined from _docs-shared.mjs pattern).
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    // Strip inline comments.
    value = value.replace(/\s+#.*$/, '').trim();
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

const AGENTS_DIR = '.claude/agents';
const errors = [];

// 1. Read and parse all agent .md files.
let agentFiles;
try {
  agentFiles = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
} catch {
  console.error('validate-structure: cannot read ' + AGENTS_DIR);
  process.exit(1);
}

const parsed = [];
for (const file of agentFiles) {
  const fullPath = join(AGENTS_DIR, file);
  const content = readFileSync(fullPath, 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push(file + ': missing frontmatter block');
    continue;
  }
  const name = fm.name ?? file.replace(/\.md$/, '');
  const toolsRaw = fm.tools ?? '';
  parsed.push({ file, name, toolsRaw });
}

// 2. Check read-only constraint: if writeScope is empty, tools must not include Write or Edit.
for (const { file, name, toolsRaw } of parsed) {
  if (!(name in WRITE_SCOPES)) continue; // unknown agent — skip
  const scope = WRITE_SCOPES[name];
  if (scope.length > 0) continue; // write-capable agent — constraint does not apply
  // Read-only agent: assert no Write/Edit in tools list.
  const tools = toolsRaw.split(',').map((t) => t.trim());
  for (const tool of tools) {
    if (tool === 'Write' || tool === 'Edit') {
      errors.push(
        file + ': read-only agent "' + name + '" must not have "' + tool +
        '" in its tools: list (writeScope is empty)'
      );
    }
  }
}

// 3. Check uniqueness of primary owned directories (first element of writeScope).
const primaryDirOwners = {};
for (const [agentName, scope] of Object.entries(WRITE_SCOPES)) {
  if (scope.length === 0) continue; // read-only agents have no primary dir
  const primaryDir = scope[0];
  if (primaryDirOwners[primaryDir]) {
    errors.push(
      'agents "' + primaryDirOwners[primaryDir] + '" and "' + agentName +
      '" share the same primary owned directory "' + primaryDir + '"'
    );
  } else {
    primaryDirOwners[primaryDir] = agentName;
  }
}

if (errors.length > 0) {
  console.error('validate-structure: failed with ' + errors.length + ' error(s):');
  for (const error of errors) console.error('  - ' + error);
  process.exit(1);
}
console.log('validate-structure: passed.');
