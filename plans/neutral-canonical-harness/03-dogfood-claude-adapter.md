---
phase: 03
title: Dogfood inversion — root CLAUDE.md becomes rendered adapter, regen roles swapped
status: pending
depends_on: [02]
---

## Goal

Beaver's own repo fully follows the inversion: root AGENTS.md is the canonical rendered document, root CLAUDE.md is the regen-managed `@AGENTS.md` adapter, and the regen/golden set in `test/helpers/beaver-params.ts` reflects the new roles.

## Steps

- [ ] Audit the current root `CLAUDE.md` for content not yet carried over in phase 02: anything project-specific still missing from `test/helpers/beaver-sections.md` gets moved there; anything Claude-only (skills references beyond the asset's standard three, hooks/settings notes) goes into a `claudeExtras` value. Beaver has no `<slug>-test-author` skill — confirm `testAuthorSkillRef` renders empty (no `testing` in beaverParams).
- [ ] Set `claudeExtras` in `test/helpers/beaver-params.ts` (inline string or `live()` of a small file next to `beaver-sections.md` — dev's call; keep it minimal, most of the old CLAUDE.md belongs in sections).
- [ ] Update the regen/golden roles in `test/helpers/beaver-params.ts`: add `'CLAUDE.md'` to `REGEN_FILES` (`AGENTS.md` is already there and stays). Update the file's comments: bespoke inputs are now `beaver-sections.md` (+ skills/dev-agent live copies); `CLAUDE.md` is no longer bespoke.
- [ ] Delete the old root `CLAUDE.md` content and regenerate: `npx tsx test/helpers/regen-dogfood.ts` writes both root `AGENTS.md` and root `CLAUDE.md` from the render.
- [ ] Sanity-read the regenerated root files: `AGENTS.md` must contain beaver's full onboarding (behavioral guidelines, project overview, agent routing incl. dev row, PARK RULE, DOCS-FIRST, MEMORY LIFECYCLE, docs commands); `CLAUDE.md` must start with `@AGENTS.md` and reference `.claude/skills/beaver-*`.
- [ ] Grep the repo for instructions that say "CLAUDE.md is canonical" or "keep AGENTS.md in sync with CLAUDE.md" outside `docs/` (e.g. comments in `test/helpers/*`, `.claude/agents/*.md`, skills): fix any found in dev-writable paths; list `docs/` hits for phase 05's docs-writer handoff instead of editing them.
- [ ] Update snapshots if the golden/regen change touched any snapshot (`npx vitest run -u`, review diff).

## Verify

- `npm run build` green; `npx vitest run` green; `npx tsx test/helpers/regen-dogfood.ts --check` clean.
- Root `CLAUDE.md` line 1 is `@AGENTS.md`; root `AGENTS.md` contains the routing table and PARK RULE; no content appears in both files.
- Launch a fresh Claude Code session in the repo (or `claude -p 'what is the PARK RULE?'`) to confirm the `@AGENTS.md` import expands — the canonical content must be visible to the assistant. (This is the load-bearing bet of decision 2; if the import does not expand, PARK — see risks.)
- `node scripts/validate-structure.mjs` and `node scripts/validate-plans.mjs` green.

## Notes / risks

- **Import-expansion risk**: `@AGENTS.md` in CLAUDE.md is verified working as of 2026-07 but is the single point of failure for claude-mode projects. If the live check fails, apply the PARK RULE (file a backlog entry, status: blocked) rather than inventing a fallback inline — the fallback (duplicating content) is exactly what 0016 removes.
- This repo's own agents read CLAUDE.md at session start; between the delete-and-regen steps the repo is briefly without onboarding content — do the delete and regen in the same working step, never commit between them.
- Rollback: `git checkout` the previous root CLAUDE.md/AGENTS.md + revert `beaver-params.ts`; scaffold output (phase 02) is unaffected.
