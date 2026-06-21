// Validates every doc against the frontmatter schema. Exits non-zero on violation → CI-ready.
// Run via: node .claude/scripts/lint-docs-frontmatter.mjs
import { existsSync } from 'fs';
import { join } from 'path';
import { walkDocs, ENUMS, REQUIRED_FIELDS, DOCS_DIR } from './_docs-shared.mjs';

const errors = [];

for (const record of walkDocs()) {
  const where = 'docs/' + record.path;
  if (record.fm === null) {
    errors.push(where + ': missing frontmatter block');
    continue;
  }
  for (const field of REQUIRED_FIELDS) {
    if (record.fm[field] === undefined || record.fm[field] === '') {
      errors.push(where + ': missing required field "' + field + '"');
    }
  }
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const value = record.fm[field];
    if (value !== undefined && !allowed.includes(value)) {
      errors.push(where + ': invalid ' + field + ' "' + value + '" (allowed: ' + allowed.join(', ') + ')');
    }
  }
  if (record.fm.updated !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(record.fm.updated)) {
    errors.push(where + ': "updated" must be YYYY-MM-DD (got "' + record.fm.updated + '")');
  }
  if (Array.isArray(record.fm.keywords)) {
    for (const keyword of record.fm.keywords) {
      if (keyword !== keyword.toLowerCase()) {
        errors.push(where + ': keyword "' + keyword + '" must be lowercase');
      }
    }
  }
  for (const related of record.fm.related ?? []) {
    if (!existsSync(join(DOCS_DIR, related))) {
      errors.push(where + ': related path "' + related + '" does not exist under docs/');
    }
  }
}

if (errors.length > 0) {
  console.error('docs:lint failed with ' + errors.length + ' error(s):');
  for (const error of errors) console.error('  - ' + error);
  process.exit(1);
}
console.log('docs:lint passed.');
