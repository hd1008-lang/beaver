# Docs — Knowledge Base

Frontmatter-indexed task docs. `INDEX.md` is auto-generated — never hand-edit it.

## Where to put new docs

| Doc type | Directory |
|---|---|
| Feature spec / feature-scoped finding | `docs/features/<feature>/` |
| Cross-cutting architecture / patterns | `docs/architecture/` |
| Onboarding material | `docs/onboarding/` |

## File naming

| Case | Name |
|---|---|
| Main spec of a feature | `<feature>.spec.en.md` |
| Spec translation alongside | `<feature>.spec.vi.md` |
| Topic doc (English) | `<topic>.en.md` |
| Translation alongside | `<topic>.vi.md` |

## Workflow

1. Copy `docs/_template.md`, fill ALL frontmatter fields (the index and lint are built from it).
2. Save to the right directory per the table above.
3. `node scripts/build-docs-index.mjs` — regenerates `INDEX.md`.
4. `node scripts/lint-docs-frontmatter.mjs` — must pass before committing.
5. Commit the doc and `INDEX.md` together.
