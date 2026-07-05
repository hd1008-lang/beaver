---
phase: 02
title: Canonical inversion — AGENTS.md skeleton asset, renderer split, all call sites
status: pending
depends_on: [01]
---

## Goal

`buildClaudeFileMap` emits a canonical AGENTS.md for every harness mode and an adapter CLAUDE.md for claude/both modes; all five call sites compile and render through the new `projectSections`/`extraRoutingRows` params; snapshots updated; dogfood regenerated; golden green.

This phase is deliberately atomic: asset tokens, renderer, and call sites cannot be split (interpolate throws on token mismatch in either direction).

## Steps

- [ ] Rewrite `harness-assets/AGENTS.md` as the canonical skeleton. Delete the pointer content ("Read CLAUDE.md first", the sync-by-hand HTML comment, "For full context"). New structure, in order:
  1. `# {{projectName}}` title.
  2. **Behavioral Guidelines** — the 4 condensed bullets (Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution), moved verbatim from the per-type `claudeMdTemplate`s (`src/scaffold/react-vite/templates/claude-setup.ts:160-165`).
  3. `## Project Overview` opening with `{{productDescription}}`.
  4. `{{projectSections}}` — per-type body (stack list, Commands, Architecture Layers, Key Patterns, Naming, Anti-Patterns, optional test section).
  5. `## Agent Routing` — table header + the four shared rows currently in `claudeHarnessTableTemplate()` (`claude-setup.ts:104-108`, including scout) + `{{extraRoutingRows}}`.
  6. **PARK RULE** paragraph — verbatim from the current per-type CLAUDE.md (cart-independent; keep the existing wording exactly).
  7. Agent memory line (`.agents/memory/<agent>/MEMORY.md ...`) + **MEMORY LIFECYCLE** rule (budget / promote / invalidate / distill — mirror the wording the harness already emits in `.agents/memory/_seed.md` and validate-structure docs).
  8. **Task Documentation Convention** + **DOCS-FIRST RULE** + operating loop — moved verbatim from the per-type `claudeMdTemplate` (drop the `.claude/skills/` references from DOCS-FIRST here; skills refs are Claude-only and live in the CLAUDE.md adapter; keep the neutral `.agents/skills/` mention only inside `{{adapterNotes}}` if needed).
  9. `{{adapterNotes}}` — provider adapters section, filled by the RENDERER per harness mode (decision 3).
- [ ] In `src/scaffold/shared/claude-setup.ts`: change `ClaudeHarnessParams` — remove `claudeMd: string`; add `projectSections: string`, `extraRoutingRows: string`, `claudeExtras?: string`. Update the header comment (canonical = AGENTS.md).
- [ ] In `buildClaudeFileMap`: move the `AGENTS.md` entry from `codexOnly` into `shared`, rendering `readAsset('AGENTS.md')` with `projectName`, `productDescription`, `projectSections`, `extraRoutingRows`, and a renderer-built `adapterNotes` string: for wantClaude mention `CLAUDE.md` + `.claude/` (agents, skills, settings.json with `permissions.ask`, agent-guard hook); for wantCodex mention `.codex/` (agents *.toml, hooks.json, scripts) + `.agents/skills/` twins — this is where the current asset's "Subagent Definitions" section content lands, and where Claude-vs-Codex capability asymmetries are stated (renderer layer, not content layer).
- [ ] In `buildClaudeFileMap` `claudeOnly`: replace `{ relativePath: 'CLAUDE.md', content: params.claudeMd }` with an interpolate of `readAsset('CLAUDE.md')` using `projectName`, `slug`, `testAuthorSkillRef` (e.g. `` `, \`.claude/skills/${slug}-test-author\`` `` when `params.testing`, else `''`), `claudeExtras: params.claudeExtras ?? ''`. Delete `claudeHarnessTableTemplate` (export and all imports).
- [ ] Migrate `src/scaffold/react-vite/templates/claude-setup.ts`: rename `claudeMdTemplate` → `projectSectionsTemplate` returning ONLY the per-type body (stack/commands/architecture/key patterns/naming/anti-patterns/test section) — strip title, behavioral guidelines, project-overview heading, agent routing shell, PARK RULE, memory paragraph, task-doc convention, DOCS-FIRST/Further Reading (now asset-side). Build `extraRoutingRows` from the existing dev row + conditional test-writer row strings. Pass `projectSections`, `extraRoutingRows` instead of `claudeMd`.
- [ ] Migrate `src/scaffold/chrome-extension/templates/claude-setup.ts` the same way (no test-writer row).
- [ ] Migrate the three harness-only skeletons (`src/scaffold/harness-only/templates/{react-vite,chrome-extension,generic}-skeleton.ts`): their `claudeMdTemplate` bodies become minimal `projectSections` (overview stub, docs commands, skeleton architecture notes); dev routing row → `extraRoutingRows`. Reword the `claude /init` guidance: `/init` writes CLAUDE.md, but project detail now belongs in AGENTS.md — instruct users to merge `/init` output into AGENTS.md's project sections and keep CLAUDE.md as the `@AGENTS.md` adapter (also check `src/scaffold/harness-only/index.ts:45` next-steps hint). Skeleton AGENTS.md MUST still carry the routing table + PARK RULE (planner memory: stubs are minimal only for conventions/stack, never for agent workflow — the asset now guarantees this).
- [ ] Update menu copy `'CLAUDE.md + .claude/ agents + feature docs structure'` in `src/options/react-vite/constants/index.ts:128`, `src/options/chrome-extension/constants/index.ts:58`, `src/options/harness-only/constants/index.ts:5` → e.g. `'AGENTS.md + provider adapters (.claude/, .codex/) + feature docs structure'`.
- [ ] Compile fix for `test/helpers/beaver-params.ts`: create `test/helpers/beaver-sections.md` holding beaver's project-specific body (extract from the current root `CLAUDE.md`: Project Overview/product line, Commands, Architecture/Module Structure, Cart Pattern, Scaffold System, Pinned Versions, Adding New Project Types/Options — everything EXCEPT behavioral guidelines and the "Claude Harness (this repo)" section, which are now asset-side); set `projectSections: live('test/helpers/beaver-sections.md')`, `extraRoutingRows` = beaver's dev row (from current root CLAUDE.md table, no test-writer), remove `claudeMd`. Leave root `CLAUDE.md` and REGEN sets untouched this phase (phase 03 does that).
- [ ] Regenerate dogfood: `npx tsx test/helpers/regen-dogfood.ts` — beaver's root `AGENTS.md` is rewritten as the full canonical render. Then update snapshots: `npx vitest run -u` and REVIEW the `test/filemap-snapshots.test.ts` snapshot diff file-by-file (expected: AGENTS.md content change in all modes + new presence in claude mode; CLAUDE.md shrunk to adapter; zero changes elsewhere).
- [ ] AFTER render-matrix capture (same scratchpad script as phase 01) and diff vs `before/`: assert the ONLY changed/added files are `AGENTS.md` and `CLAUDE.md` in every matrix case; every other file byte-identical. Record the diff summary in this phase's Resolution.

## Verify

- `npm run build` green.
- `npx vitest run` green (snapshots intentionally updated; `test/golden-dogfood.test.ts` green after regen; `npx tsx test/helpers/regen-dogfood.ts --check` clean).
- BEFORE/AFTER diff shows changes confined to `AGENTS.md` + `CLAUDE.md` across all harness modes × testing on/off.
- Rendered AGENTS.md for `harness: 'claude'` exists and contains routing table + PARK RULE; rendered CLAUDE.md first line is `@AGENTS.md`; `harness: 'codex'` emits AGENTS.md but NO CLAUDE.md.

## Notes / risks

- `interpolate` runs its leftover-token check on the RESULT, so a `{{name}}`-shaped string inside `projectSections`/`extraRoutingRows` values would throw at scaffold time. Current per-type content has none, but scan the migrated bodies for accidental `{{...}}`.
- Dogfood duplication is expected mid-plan: after this phase beaver's root CLAUDE.md (old, full) and AGENTS.md (new, canonical) overlap; phase 03 resolves it. Don't "fix" it here.
- Rollback: single revert of this phase's commit restores the pointer-AGENTS.md world; phase 01 artifacts are unaffected.
