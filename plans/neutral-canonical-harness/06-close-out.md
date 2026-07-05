---
phase: 06
title: Close-out — full verification, backlog/0016 resolution, memory retro, archive
status: pending
depends_on: [05]
---

## Goal

The whole plan is verified green end-to-end, backlog/0016 is resolved with a back-link, executing agents' memories are retro'd, and the plan is archived.

## Steps

- [ ] Full verification pass (mirrors CI): `npm run build`, `npm test` (all ~95+ tests), `npx tsx test/helpers/regen-dogfood.ts --check`, `node scripts/build-docs-index.mjs` (no diff), `node scripts/lint-docs-frontmatter.mjs`, `node scripts/validate-structure.mjs`, `node scripts/validate-plans.mjs` — all exit 0, `git status` clean of unexplained changes.
- [ ] Final stale-reference grep across the repo (excluding `plans/.archive`, `backlog/`, git history): `claude-setup`, `buildClaudeFileMap`, `ClaudeHarnessParams`, "Read CLAUDE.md first", "keep ... in sync with CLAUDE.md" — zero hits.
- [ ] Resolve backlog/0016 — edit `backlog/0016-neutral-canonical-harness.md` frontmatter: `status: resolved`, add `resolved: <today>` and `resolution: AGENTS.md is now the canonical harness document for all harness modes (harness-assets/AGENTS.md skeleton); CLAUDE.md is a generated @AGENTS.md adapter; module renamed to src/scaffold/shared/harness-setup.ts (buildHarnessFileMap/HarnessParams); spec moved to docs/features/ai-harness/; dogfood inverted (CLAUDE.md joined the regen set, bespoke input = test/helpers/beaver-sections.md). See plans/.archive/neutral-canonical-harness/.`
- [ ] Check for orphaned follow-up prose: scan all phase files' Resolution/Notes for "FLAG"/"follow-up"/"later" items; every item must already be a `backlog/` entry — file any that aren't (prose in archived plans is invisible to future agents).
- [ ] **Memory retro** (required by `plans/README.md` lifecycle): run the `beaver-memory-retro` skill against the executing agents' memories — `.agents/memory/dev/MEMORY.md`, `.agents/memory/docs-writer/MEMORY.md`, `.agents/memory/planner/MEMORY.md`: delete bullets that only mattered during execution, promote durable inversion facts (e.g. "AGENTS.md is canonical; edit harness-assets/AGENTS.md, never per-provider copies") to the ai-harness spec via docs-writer if not already there, update the phase-04 invalidation edits if the retro finds more stale bullets. Confirm `node scripts/validate-structure.mjs` stays within memory budget.
- [ ] Update the Ordered phases table in `00-overview.md` (all rows `done`) and set this phase's frontmatter `status: done` once Verify passes.
- [ ] Archive: `git mv plans/neutral-canonical-harness plans/.archive/neutral-canonical-harness`; run `node scripts/validate-plans.mjs` once more (archived-plan check must pass).

## Verify

- Every command in step 1 exits 0 on a clean tree.
- `backlog/0016` frontmatter is `status: resolved` with resolution + plan back-link; `node scripts/validate-plans.mjs` green after archival.
- All memory files within budget; no memory bullet references pre-inversion names/paths.
- Human does the commit/push — agents never commit (hand the final tree to the user).

## Notes / risks

- If CI (`.github/workflows/ci.yml`) diverges from the local command set, run whatever CI runs — CI is the arbiter.
- Archival is the executor's (dev's) decision per `plans/README.md`; this plan pre-decides "archive" because the roadmap continues past 0016 and a done plan must not linger in `plans/`.
