// Mechanically checks plan/backlog consistency across four invariants.
// Run via: node scripts/validate-plans.mjs
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PLANS_DIR = '.beaver/plans';
const BACKLOG_DIR = '.beaver/backlog';

// Minimal frontmatter parser — same pattern as validate-structure.mjs (no external deps).
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

// Parse the "Ordered phases" Markdown table from an overview file body.
// Returns array of { num, slug, status } where num is zero-padded (e.g. "01").
// Only parses rows from the section headed "## Ordered phases" (case-insensitive).
function parseOrderedPhasesTable(content) {
  const rows = [];
  // Find the "Ordered phases" section and extract only that table.
  const sectionMatch = content.match(/##\s+Ordered phases\b[\s\S]*?(?=\n##\s|\n---\n|$)/i);
  if (!sectionMatch) return rows;
  const section = sectionMatch[0];
  for (const line of section.split('\n')) {
    // Match data rows: | 01 | slug | status | ... |
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const num = cells[0].padStart(2, '0');
    const slug = cells[1];
    const status = cells[2].toLowerCase();
    rows.push({ num, slug, status });
  }
  return rows;
}

// Collect active plan dirs (skip .archive and README.md).
function getActivePlanDirs() {
  let entries;
  try {
    entries = readdirSync(PLANS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && e.name !== '.archive' && !e.name.startsWith('.'))
    .map((e) => e.name);
}

// Collect all plan dirs including .archive.
function getAllPlanDirs() {
  let entries;
  try {
    const archiveEntries = readdirSync(join(PLANS_DIR, '.archive'), { withFileTypes: true });
    const activeEntries = readdirSync(PLANS_DIR, { withFileTypes: true });
    return [
      ...activeEntries.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => ({ name: e.name, archived: false })),
      ...archiveEntries.filter((e) => e.isDirectory()).map((e) => ({ name: e.name, archived: true })),
    ];
  } catch {
    return getActivePlanDirs().map((name) => ({ name, archived: false }));
  }
}

const errors = [];
const warnings = [];

// ── Check A — Phase table ↔ frontmatter status consistency ──────────────────
for (const planDir of getActivePlanDirs()) {
  const overviewPath = join(PLANS_DIR, planDir, '00-overview.md');
  if (!existsSync(overviewPath)) continue;
  const overviewContent = readFileSync(overviewPath, 'utf-8');
  const rows = parseOrderedPhasesTable(overviewContent);
  for (const { num, slug, status: tableStatus } of rows) {
    const phaseFile = join(PLANS_DIR, planDir, `${num}-${slug}.md`);
    if (!existsSync(phaseFile)) {
      warnings.push(`WARN  ${phaseFile}: phase file not found (table row ${num} references it)`);
      continue;
    }
    const phaseContent = readFileSync(phaseFile, 'utf-8');
    const fm = parseFrontmatter(phaseContent);
    if (!fm) {
      warnings.push(`WARN  ${phaseFile}: missing frontmatter — cannot compare with table status`);
      continue;
    }
    const fmStatus = (fm.status ?? '').toLowerCase();
    if (fmStatus !== tableStatus) {
      warnings.push(
        `WARN  ${phaseFile}: phase frontmatter status "${fmStatus}" but table row says "${tableStatus}"`
      );
    }
  }
}

// ── Check B — All-done plans not yet archived ────────────────────────────────
for (const planDir of getActivePlanDirs()) {
  const overviewPath = join(PLANS_DIR, planDir, '00-overview.md');
  if (!existsSync(overviewPath)) continue;
  const overviewContent = readFileSync(overviewPath, 'utf-8');
  const rows = parseOrderedPhasesTable(overviewContent);
  if (rows.length === 0) continue;
  if (rows.every(({ status }) => status === 'done')) {
    warnings.push(
      `WARN  plans/${planDir}/00-overview.md: all phases done — consider archiving to plans/.archive/`
    );
  }
}

// ── Check C — Backlog ID uniqueness and sequence ─────────────────────────────
const REQUIRED_BACKLOG_FIELDS = ['id', 'title', 'status', 'source', 'severity', 'created'];
const VALID_BACKLOG_STATUSES = ['open', 'resolved', 'wontfix'];
const seenIds = new Set();

let backlogFiles;
try {
  backlogFiles = readdirSync(BACKLOG_DIR).filter((f) => /^\d{4}-.*\.md$/.test(f));
} catch {
  backlogFiles = [];
}

for (const file of backlogFiles) {
  const filePath = join(BACKLOG_DIR, file);
  const content = readFileSync(filePath, 'utf-8');
  const fm = parseFrontmatter(content);
  const prefix = file.slice(0, 4); // "0001"

  if (!fm) {
    errors.push(`ERROR backlog/${file}: missing frontmatter block`);
    continue;
  }

  // Required fields
  for (const field of REQUIRED_BACKLOG_FIELDS) {
    if (fm[field] === undefined || fm[field] === '') {
      errors.push(`ERROR backlog/${file}: missing required frontmatter field "${field}"`);
    }
  }

  // ID uniqueness
  const id = fm.id ?? '';
  if (id) {
    if (seenIds.has(id)) {
      errors.push(`ERROR backlog/${file}: duplicate id "${id}"`);
    } else {
      seenIds.add(id);
    }

    // ID/filename prefix match
    if (id.padStart(4, '0') !== prefix) {
      errors.push(`ERROR backlog/${file}: filename prefix "${prefix}" does not match id "${id}"`);
    }
  }

  // Status enum
  const status = fm.status ?? '';
  if (status && !VALID_BACKLOG_STATUSES.includes(status)) {
    errors.push(
      `ERROR backlog/${file}: invalid status "${status}" (allowed: ${VALID_BACKLOG_STATUSES.join(', ')})`
    );
  }
}

// ── Check D — Two-way links between blocked phases and backlog entries ────────
// Collect all phase files (non-overview, non-archive).
function collectPhaseFiles() {
  const result = [];
  for (const planDir of getActivePlanDirs()) {
    let files;
    try {
      files = readdirSync(join(PLANS_DIR, planDir)).filter(
        (f) => f.endsWith('.md') && f !== '00-overview.md'
      );
    } catch {
      continue;
    }
    for (const f of files) {
      result.push({ path: join(PLANS_DIR, planDir, f), rel: `plans/${planDir}/${f}` });
    }
  }
  return result;
}

for (const { path: phaseFilePath, rel } of collectPhaseFiles()) {
  const content = readFileSync(phaseFilePath, 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm || fm.status !== 'blocked') continue;

  // Look for a backlog link in the body.
  const bodyMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : content;
  const backlogLinkMatch = body.match(/backlog\/(\d{4})/g);

  if (!backlogLinkMatch) {
    warnings.push(`WARN  ${rel}: status blocked but no backlog link found in body`);
    continue;
  }

  for (const linkStr of backlogLinkMatch) {
    const id = linkStr.replace('backlog/', '');
    // Find the backlog file with this prefix.
    const matchingFile = (backlogFiles ?? []).find((f) => f.startsWith(id));
    if (!matchingFile) {
      warnings.push(`WARN  ${rel}: references ${linkStr} but no backlog/${id}-*.md file found`);
      continue;
    }
    const backlogContent = readFileSync(join(BACKLOG_DIR, matchingFile), 'utf-8');
    const backlogFm = parseFrontmatter(backlogContent);
    const source = backlogFm?.source ?? '';
    if (!source.includes(rel.replace(`plans/`, ''))) {
      warnings.push(
        `WARN  backlog/${matchingFile}: source field "${source}" does not reference ${rel}`
      );
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const totalErrors = errors.length;
const totalWarnings = warnings.length;

if (totalErrors > 0 || totalWarnings > 0) {
  console.log(
    `validate-plans: ${totalErrors} error(s), ${totalWarnings} warning(s):`
  );
  for (const e of errors) console.error('  ' + e);
  for (const w of warnings) console.warn('  ' + w);
}

if (totalErrors > 0) {
  console.error(`validate-plans: failed with ${totalErrors} error(s).`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`validate-plans: passed with ${totalWarnings} warning(s).`);
} else {
  console.log('validate-plans: passed.');
}
