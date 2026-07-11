---
name: basedir-root-discovery-spec-update
description: 2026-07-11 update to ai-harness spec documenting {{baseDir}} token and root-discovery constraint
metadata:
  type: project
---

**Spec updated**: `docs/features/ai-harness/ai-harness.spec.en.md` documented plan 0017 outcomes:

1. **Root-discovery constraint** (new section) — why `.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md` must stay at root
   - Tool-level requirements, not configurable
   - Claude Code auto-discovers from root only
   - Codex auto-discovers from root only
   - Applies universally (beaver + all scaffolded projects)

2. **Knowledge-base folder structure** (new section) — `.beaver/` for beaver, root for scaffolded projects
   - Beaver: `baseDir = '.beaver'` → `.beaver/plans/`, `.beaver/docs/`, etc.
   - Scaffolded: `baseDir = ''` → `plans/`, `docs/`, etc. at root
   - `{{baseDir}}` is **selective** — only prefixes knowledge-base paths, never tool-discovery paths

3. **Shared Harness Output table** updated to show:
   - `{{baseDir}}/plans/`, `{{baseDir}}/docs/`, etc. (paths that move)
   - Root-level `.agents/`, `AGENTS.md`, etc. (paths that stay fixed)
   - Folder layout row showing both beaver and scaffolded layouts

4. **HarnessParams** section updated with `baseDir: string` field and rationale

5. **Key Decision 11** added: Knowledge-base paths are movable via {{baseDir}} token
   - Single codebase, many layouts — one rendering engine
   - Future-proof for other CLI tools adopting `.beaver/` convention
   - Cleaner root in dogfood; simple root in scaffolded projects

6. **Frontmatter keywords** extended: `basedir`, `rootdiscovery`, `beaverfolder`, `knowledgebase`

Both `build-docs-index.mjs` and `lint-docs-frontmatter.mjs` passed. Index regenerated with new keywords.

Related: `.beaver/plans/0017-beaver-folder-structure/` (completed plan, 6 phases shipped 2026-07-11)
