# docs-writer — Agent Memory

Append durable, non-obvious gotchas and patterns discovered while working — one bullet each, newest first. Link related docs/ files. Read this file at the start of every session.

- **Product Description field is required in HarnessParams** — captured at harness-enable time ("Describe your project. What is it?") and rendered into AGENTS.md's `## Project Overview` (post-0016; CLAUDE.md is a thin `@AGENTS.md` adapter). Details: [[productdescription_field.md]]; full spec: [[ai-harness.spec.en.md]].
- **Keywords must not contain commas or hyphens within single keywords** — the index builder splits on those characters. Use single kebab-case keywords (no hyphenation across words). Example: instead of `menu-flow, project-type`, use `menuflow, projecttype`. Bad characters become separate index entries in "Keyword Index" section of INDEX.md.
