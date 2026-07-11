# docs-writer — Agent Memory

Append durable, non-obvious gotchas and patterns discovered while working — one bullet each, newest first. Link related docs/ files. Read this file at the start of every session.

- **{{baseDir}} token is selective, not blanket** (2026-07-11) — only prefixes knowledge-base paths (`plans/`, `docs/`, `backlog/`, `scripts/`); tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`) always stay bare at root and never get `{{baseDir}}/` prefix. When baseDir='', the empty prefix must produce `/plans/` → `plans/` not broken. Docs: [[ai-harness.spec.en.md]] sections "Root-Discovery Constraint" and "Knowledge-Base Folder Structure".
- **Product Description field is required in HarnessParams** — captured at harness-enable time ("Describe your project. What is it?") and rendered into AGENTS.md's `## Project Overview` (post-0016; CLAUDE.md is a thin `@AGENTS.md` adapter). Details: [[productdescription_field.md]]; full spec: [[ai-harness.spec.en.md]].
- **Keywords must not contain commas or hyphens within single keywords** — the index builder splits on those characters. Use single kebab-case keywords (no hyphenation across words). Example: instead of `menu-flow, project-type`, use `menuflow, projecttype`. Bad characters become separate index entries in "Keyword Index" section of INDEX.md.
