# docs-writer — Agent Memory

Append durable, non-obvious gotchas and patterns discovered while working — one bullet each, newest first. Link related docs/ files. Read this file at the start of every session.

- **Keywords must not contain commas or hyphens within single keywords** — the index builder splits on those characters. Use single kebab-case keywords (no hyphenation across words). Example: instead of `menu-flow, project-type`, use `menuflow, projecttype`. Bad characters become separate index entries in "Keyword Index" section of INDEX.md.
