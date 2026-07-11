---
id: "0006"
title: Migrate dogfood repo's own .claude/scripts/ layout to match neutral scripts/ pattern
status: resolved
source: conversation — layout bug fix 2026-06-22 (scaffold output fix)
severity: low
created: 2026-06-22
---

## Symptom

The beaver repo itself (the dogfood) still uses the old co-located layout where shared scripts
live under `.claude/scripts/` and Codex scripts also live under `.claude/scripts/`:

- `.claude/scripts/_docs-shared.mjs`
- `.claude/scripts/build-docs-index.mjs`
- `.claude/scripts/lint-docs-frontmatter.mjs`
- `.claude/scripts/validate-structure.mjs`
- `.claude/scripts/validate-plans.mjs`
- `.claude/scripts/docs-first-reminder.sh`
- `.claude/scripts/agent-guard-core.mjs`
- `.claude/scripts/agent-guard-codex.mjs` (Codex adapter, still in .claude/)
- `.claude/scripts/codex-*.mjs` (Codex hooks, still in .claude/)

The scaffold output was fixed (2026-06-22) to use the new neutral layout:
- Shared scripts → `scripts/` (harness-neutral, no `.claude/` prefix)
- Codex scripts → `.codex/scripts/`
- Claude adapter → `.claude/scripts/agent-guard.mjs` (only file staying there)

The dogfood repo's own committed files were NOT updated (intentionally scoped out of the
layout bug fix) and now diverge from the pattern the scaffold emits.

## Tried

Nothing — this was explicitly parked as out-of-scope during the layout bug fix.

## Why parked

The layout bug fix was scoped to scaffold OUTPUT only. Updating the dogfood repo's own
`.claude/` and `.codex/` committed files would require:
1. Moving 7 shared scripts from `.claude/scripts/` to `scripts/`
2. Moving 4 codex scripts from `.claude/scripts/` to `.codex/scripts/`
3. Updating all references in CLAUDE.md, AGENTS.md, agent .md files, TOML files, and skills
4. Updating the `$CLAUDE_PROJECT_DIR/.claude/scripts/...` paths in `.claude/settings.json`
5. Updating the `$(git rev-parse --show-toplevel)/.claude/scripts/...` paths in `.codex/hooks.json`
6. Updating `.claude/scripts/agent-guard.mjs` import of `./agent-guard-core.mjs` → `../../scripts/agent-guard-core.mjs`
7. Updating MEMORY.md bullet about old Codex scaffold pattern (phase 07) which says codex scripts go at `.claude/scripts/codex-*.mjs`

## Suggested direction

Run the same path-rename logic that was applied to scaffold templates, but on the dogfood
committed files. The change set is mechanical:
- `git mv .claude/scripts/{_docs-shared,build-docs-index,lint-docs-frontmatter,validate-structure,validate-plans,docs-first-reminder.sh,agent-guard-core}.mjs scripts/`
- `git mv .claude/scripts/agent-guard-codex.mjs .codex/scripts/`
- `git mv .claude/scripts/codex-*.mjs .codex/scripts/`
- Update all references using the same list of files as the scaffold fix
- Update MEMORY.md to reflect the new layout
- Update `docs/features/claude-harness/claude-harness.spec.en.md` shared-output table (currently still lists `.claude/scripts/` for shared scripts)
