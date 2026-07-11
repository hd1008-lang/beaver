# Neutral Canonical Harness — backlog/0016

Invert the harness canonical from Claude-centric to vendor-neutral: **AGENTS.md (the agents.md open standard) becomes the source of truth**; CLAUDE.md becomes a thin adapter that imports it via `@AGENTS.md`. Story: `backlog/0016-neutral-canonical-harness.md`. Spec (current architecture, pre-inversion): `docs/features/claude-harness/claude-harness.spec.en.md`.

## Goal

- Scaffolded projects (react-vite, chrome-extension, all 3 harness-only skeletons) emit a canonical `AGENTS.md` for **every** harness mode (`claude` | `codex` | `both`) holding: behavioral guidelines, project overview (`productDescription` + per-type stack/conventions sections), agent routing table, PARK RULE, DOCS-FIRST rule, MEMORY LIFECYCLE rule.
- Scaffolded `CLAUDE.md` (claude/both modes only) shrinks to: `@AGENTS.md` import line + Claude-only content (`.claude/skills/` references, settings/hooks notes).
- The old AGENTS.md → "Read CLAUDE.md first" pointer direction is REVERSED; the sync-by-hand comment dissolves.
- Beaver's own dogfood AGENTS.md/CLAUDE.md follow the same inversion, with the regen/golden roles in `test/helpers/beaver-params.ts` swapped accordingly.
- `src/scaffold/shared/claude-setup.ts` → `src/scaffold/shared/harness-setup.ts`; `buildClaudeFileMap` → `buildHarnessFileMap` (and related identifiers).
- Spec restructured to `docs/features/ai-harness/` (docs-writer handoff), absorbing any remainder of backlog/0005.

## Decisions already made by the user (2026-07-05 — do NOT re-litigate)

1. Canonical home = AGENTS.md open standard.
2. CLAUDE.md = thin adapter using the `@AGENTS.md` import syntax (Claude Code does not read AGENTS.md natively — verified open issue anthropics/claude-code#34235).
3. Per-provider capability asymmetries stay explicit in the **renderer** layer (e.g. Claude `permissions.ask` vs Codex), never in the content layer.
4. Neutral module/function rename (exact names chosen below).
5. Spec restructure `claude-harness` → `ai-harness`, absorbing backlog/0005 remainder.

## Plan-level design decisions (made here, binding for phases)

| Decision | Choice | Rationale |
|---|---|---|
| Composition model | `harness-assets/AGENTS.md` becomes a canonical **skeleton asset** holding all shared sections inline, with tokens for per-type content | Changing PARK RULE / routing / guidelines = edit ONE asset; adding provider N = zero content authoring (the point of 0016) |
| AGENTS.md tokens | `{{projectName}}`, `{{productDescription}}`, `{{projectSections}}`, `{{extraRoutingRows}}`, `{{adapterNotes}}` | `projectSections` = per-type stack/commands/architecture/patterns/naming/anti-patterns/test section; `extraRoutingRows` = per-type dev row + optional test-writer row; `adapterNotes` = renderer-filled provider-adapter section (harness-mode-conditional — decision 3) |
| CLAUDE.md adapter | New asset `harness-assets/CLAUDE.md`; tokens `{{projectName}}`, `{{slug}}`, `{{testAuthorSkillRef}}`, `{{claudeExtras}}` | First line `@AGENTS.md`; rest is Claude-only |
| `ClaudeHarnessParams` change | `claudeMd: string` removed; add `projectSections: string`, `extraRoutingRows: string`, optional `claudeExtras?: string` | Mirrors existing param-object pattern; per-type templates keep rendering project content |
| `claudeHarnessTableTemplate()` | Deleted — shared routing rows move into the AGENTS.md asset | Single source |
| Module rename | Single file `src/scaffold/shared/harness-setup.ts` (NOT a `harness/` dir); per-type `templates/claude-setup.ts` → `templates/harness-setup.ts` | Minimal import-alias churn |
| Function/type renames | `buildClaudeFileMap` → `buildHarnessFileMap`; `ClaudeHarnessParams` → `HarnessParams`; per-type `getClaudeFileMap` → `getHarnessFileMap` | Consistent, neutral |
| Beaver bespoke input home | `test/helpers/beaver-sections.md` (beaver's projectSections body, read via `live()`) | Bespoke inputs live next to `beaver-params.ts`, the single definition of beaver's cart |
| Dogfood regen roles | `AGENTS.md` stays in `REGEN_FILES` (now a composed render); `CLAUDE.md` **joins** `REGEN_FILES` (pure adapter render) | Both are outputs post-inversion; the bespoke input is `beaver-sections.md` |
| Phase atomicity constraint | Asset rewrite + renderer + ALL call sites land in one phase (02) | `interpolate()` throws on unreplaced tokens (`src/scaffold/shared/assets.ts:63-66`) — a tokenized asset with an old renderer (or vice versa) fails every render test |

## First-touch dev task (planner cannot write `backlog/`)

Before starting phase 01, dev makes this exact edit to `backlog/0016-neutral-canonical-harness.md` — append to the `## Related` section:

```
- plans/neutral-canonical-harness/00-overview.md — implementation plan (created 2026-07-05); phases update as they complete
```

(Do NOT change `status:` or `source:` yet — that happens in phase 06 when the work is done.)

## Scope

- `harness-assets/AGENTS.md` (rewrite), `harness-assets/CLAUDE.md` (new).
- `src/scaffold/shared/claude-setup.ts` (invert + later rename), `src/scaffold/react-vite/templates/claude-setup.ts`, `src/scaffold/chrome-extension/templates/claude-setup.ts`, `src/scaffold/harness-only/templates/{react-vite,chrome-extension,generic}-skeleton.ts`.
- Menu copy: `src/options/{react-vite,chrome-extension,harness-only}/constants/index.ts` descriptions ("CLAUDE.md + .claude/ agents ...").
- Dogfood: root `AGENTS.md`, root `CLAUDE.md`, `test/helpers/beaver-params.ts`, new `test/helpers/beaver-sections.md`, regen via `npx tsx test/helpers/regen-dogfood.ts`.
- Tests: `test/filemap-snapshots.test.ts` (intentional snapshot updates), `test/golden-dogfood.test.ts` (must stay green each phase), other tests touched only by identifier renames.
- Memory invalidation: `.agents/memory/*/MEMORY.md` stale-reference sweep in the rename phase (backlog/0015 rule).
- Docs: handoff to docs-writer (phase 05) — planner/dev never edit `docs/`.

## Non-goals

- No new providers (Gemini CLI, Cursor renderers) — this plan only makes them cheap later.
- No change to guard/hook behavior, agent registry schema, writeScopes, or security hardening.
- No change to skills content, docs tooling scripts, or the `.agents/memory` layout.
- No `harness/` directory split — single-file rename only.

## Verification spine (every phase ends green)

Each phase's Verify includes the relevant subset of: `npm run build`, `npx vitest run` (95 tests), `npx tsx test/helpers/regen-dogfood.ts --check`, `node scripts/validate-structure.mjs`, `node scripts/validate-plans.mjs`, `node scripts/lint-docs-frontmatter.mjs`. Phase 06 runs the full set. Behavior-preservation phases use the BEFORE/AFTER render-matrix diff captured in phase 01.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | baseline-and-adapter-asset | done | 5/5 | 2026-07-05 |
| 02 | canonical-inversion | done | 11/11 | 2026-07-05 |
| 03 | dogfood-claude-adapter | done | 7/7 | 2026-07-11 |
| 04 | neutral-rename | done | 8/8 | 2026-07-11 |
| 05 | spec-restructure-handoff | done | 5/5 | 2026-07-11 |
| 06 | close-out | done | 7/7 | 2026-07-11 |
