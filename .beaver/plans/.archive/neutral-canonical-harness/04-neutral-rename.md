---
phase: 04
title: Neutral rename — harness-setup module/identifiers + memory invalidation sweep
status: done
depends_on: [03]
---

## Goal

No source identifier or path is Claude-named for vendor-neutral machinery: `claude-setup.ts` → `harness-setup.ts`, `buildClaudeFileMap` → `buildHarnessFileMap`, `ClaudeHarnessParams` → `HarnessParams`, and every stale reference (including agent memories) is fixed in the same phase.

## Steps

- [x] `git mv src/scaffold/shared/claude-setup.ts src/scaffold/shared/harness-setup.ts`; rename exports: `buildClaudeFileMap` → `buildHarnessFileMap`, `ClaudeHarnessParams` → `HarnessParams` (keep `AGENTS`, `AgentDef`, `STATUS_ENUM`, `LANG_ENUM` names as-is).
- [x] `git mv` the per-type files: `src/scaffold/react-vite/templates/claude-setup.ts` → `harness-setup.ts`, `src/scaffold/chrome-extension/templates/claude-setup.ts` → `harness-setup.ts`; rename their `getClaudeFileMap` exports → `getHarnessFileMap`.
- [x] Fix all imports/call sites: grep `claude-setup`, `buildClaudeFileMap`, `ClaudeHarnessParams`, `getClaudeFileMap` across `src/` and `test/` (known: `src/scaffold/react-vite/index.ts`-side orchestrators, `src/scaffold/chrome-extension/`, `src/scaffold/harness-only/templates/*`, `src/scaffold/harness-only/index.ts`, `test/helpers/beaver-params.ts`, `test/helpers/regen-dogfood.ts`, `test/filemap-snapshots.test.ts`, `test/parse-emitted.test.ts`, `test/golden-dogfood.test.ts` — confirm by grep, don't trust this list).
- [x] Update beaver's `reminderTrigger` in `test/helpers/beaver-params.ts` from `'scaffold|template|menu|cart|claude-setup|harness'` to `'scaffold|template|menu|cart|harness-setup|harness'` — this changes the rendered `scripts/docs-first-reminder.sh`, so regen dogfood in this phase.
- [x] Grep dev-writable dogfood surfaces for `claude-setup` / `buildClaudeFileMap` mentions that are inputs to the render: `test/helpers/beaver-sections.md` (Scaffold System section names `claude-setup.ts` paths — update to `harness-setup.ts`), `.claude/skills/beaver-conventions/SKILL.md` description ("claude-setup" trigger word), `.claude/agents/dev.md` if it names the module. Regen dogfood after: `npx tsx test/helpers/regen-dogfood.ts`.
- [x] **Memory invalidation sweep (backlog/0015 rule, mandatory)**: grep `.agents/memory/*/MEMORY.md` for `claude-setup`, `buildClaudeFileMap`, `ClaudeHarnessParams`, `claudeHarnessTableTemplate`, and "CLAUDE.md" canonical-direction claims. Known stale after this phase: planner memory bullets referencing `claude-setup.ts` (byte-identical-diff bullet, harness-change-plans bullet, agent-registry bullet) and any dev-memory equivalents. Each agent's own memory is guard-scoped — have the main session (unrestricted) apply the edits, updating path/identifier references in place.
- [x] Update snapshots (`npx vitest run -u`) if snapshot titles/imports embed old names; review diff.
- [x] List any `docs/` hits from the same greps (e.g. spec `Related Files` naming `src/scaffold/shared/claude-setup.ts`) — do NOT edit; append them to phase 05's handoff notes.

## Verify

- `grep -r "claude-setup\|buildClaudeFileMap\|ClaudeHarnessParams" src/ test/ .agents/ .claude/` returns zero hits (docs/ hits allowed until phase 05).
- `npm run build` green; `npx vitest run` green; `npx tsx test/helpers/regen-dogfood.ts --check` clean.
- `node scripts/validate-structure.mjs` green (memory files within budget after edits).

## Notes / risks

- Pure-mechanical phase: zero rendered-output changes EXCEPT `scripts/docs-first-reminder.sh` (reminderTrigger) and any dogfood files whose interpolated inputs changed. If the regen diff shows anything else, stop and investigate before committing.
- Windows `git mv` is case-preserving here (full name change), no case-only-rename trap.
- Rollback: revert the commit; renames are content-free.

## Resolution (2026-07-11)

All 8 steps done (mechanical rename by dev agent; memory sweep applied by main session — agent memory is guard-scoped).

Renames: `src/scaffold/shared/claude-setup.ts` → `harness-setup.ts` (`buildClaudeFileMap` → `buildHarnessFileMap`, `ClaudeHarnessParams` → `HarnessParams`); per-type `templates/claude-setup.ts` → `harness-setup.ts` for react-vite + chrome-extension (`getClaudeFileMap` → `getHarnessFileMap`); all imports/call sites fixed across `src/` and `test/`; `reminderTrigger` → `'scaffold|template|menu|cart|harness-setup|harness'`; `.claude/skills/beaver-conventions/SKILL.md` trigger word updated; dogfood regenerated — regen diff was exactly `scripts/docs-first-reminder.sh` (trigger only), confirming the pure-mechanical expectation. No snapshot changes needed.

Memory invalidation sweep (backlog/0015 rule): identifier/path renames applied across all `.agents/memory/**` files; additionally deleted `.agents/memory/advisor/harness-only-claude-md-gaps.md` (resolved-bug analysis referencing the deleted `claudeHarnessTableTemplate` and pre-inversion skeleton model) + its index line; fixed stale post-inversion claims (render target CLAUDE.md → AGENTS.md project sections in advisor/docs-writer memories; dev's HarnessParams minimal-call bullet now lists `projectSections`/`extraRoutingRows`); dropped dead line-number refs in `dogfood-script-layout.md`.

Verify: grep `claude-setup|buildClaudeFileMap|ClaudeHarnessParams|getClaudeFileMap|claudeHarnessTableTemplate` over `src/ test/ .agents/ .claude/` → zero hits; `npm run build` green; `npx vitest run` 96/96; `regen-dogfood --check` clean (32 rendered, 0 drift); `validate-structure` + `validate-plans` pass.

**docs/ hits for phase 05 handoff** (identifier mentions, NOT edited): `docs/features/claude-harness/claude-harness.spec.en.md:28,29,45,48,64,94,168,179,183,191,192,193`; `docs/features/security-hardening/security-hardening.spec.en.md:47,92,179,207` — combine with the CLAUDE.md-canonicality hits listed in phase 03's Resolution.
