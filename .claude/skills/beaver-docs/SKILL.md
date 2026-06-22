---
name: beaver-docs
description: How to find and write knowledge-base docs for beaver. Use when asked "is there a doc about…", "explain the X feature/flow", "document this", "write a spec", or the Vietnamese equivalents ("có tài liệu về…", "giải thích flow…", "viết docs/spec…"). Also use before modifying any documented feature.
---

# beaver Docs Guide

## Finding docs (DOCS-FIRST)

1. Start at `docs/INDEX.md` — grouped By Feature / By Flow / By Layer, plus a keyword reverse-index.
2. Narrow with frontmatter grep (never semantic-search bodies):
   ```bash
   grep -rlE '^feature: home' docs/
   grep -rlE '^feature: home' docs/ | xargs grep -lE '^flow: ui'
   ```
3. Read candidate doc bodies (≤5 files), then follow their `related:` links.
4. Only open source when docs are insufficient — and state what the docs already covered.

## Writing docs

1. Copy `docs/_template.md`; every field is required (see `docs/README.md` for placement + naming).
2. Frontmatter axes: `feature` (folder under docs/features/ or `_app`), `flow` (menu/scaffold/templates/infra/architecture/onboarding/_meta), `layer` (options/scaffold/types/constants/utils/_cross).
3. Keywords: lowercase, prefer real symbol/file names an engineer would grep for.
4. Rebuild + validate, then commit doc and INDEX.md together:
   ```bash
   node scripts/build-docs-index.mjs && node scripts/lint-docs-frontmatter.mjs
   ```
