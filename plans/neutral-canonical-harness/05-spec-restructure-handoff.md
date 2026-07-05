---
phase: 05
title: Spec restructure handoff — claude-harness → ai-harness (docs-writer)
status: pending
depends_on: [04]
---

## Goal

`docs/features/ai-harness/` accurately describes the inverted architecture (AGENTS.md canonical, CLAUDE.md adapter, harness-setup module names), the old `claude-harness` feature axis is retired, and the backlog/0005 remainder (Codex output description) is absorbed — all authored by docs-writer, never by dev/planner.

## Steps

- [ ] Collect the handoff inputs: the `docs/` grep hit-lists parked by phases 03 and 04 (stale "CLAUDE.md is canonical" claims, old module paths in `Related Files`).
- [ ] Invoke the **docs-writer** agent with these exact instructions:
  1. Move `docs/features/claude-harness/claude-harness.spec.en.md` → `docs/features/ai-harness/ai-harness.spec.en.md`; frontmatter: `feature: ai-harness`, title "AI Harness Generation — Feature Spec", refresh `keywords` (add `agentsmd`, `harnesssetup`, `buildharnessfilemap`, `adapter`, `vendorneutral`; drop `claudesetup`, `buildclaudefilemap`), `updated: <today>`.
  2. Rewrite for the inversion: AGENTS.md is the canonical document emitted for ALL harness modes (list its sections: behavioral guidelines, project overview/productDescription, projectSections, agent routing, PARK RULE, MEMORY LIFECYCLE, DOCS-FIRST, renderer-filled adapter notes); CLAUDE.md is a thin adapter (`@AGENTS.md` import + Claude-only skills/settings notes) emitted only for claude/both; move the AGENTS.md row out of "Codex Harness Output" into "Shared Harness Output" and delete the "pointer to CLAUDE.md" description (this is the backlog/0005 remainder — its Suggested-direction bullet describing AGENTS.md as a pointer is now obsolete); document `HarnessParams` (`projectSections`, `extraRoutingRows`, `claudeExtras`) replacing `claudeMd`; state decision 3 (capability asymmetries live in the renderer layer) and the Claude-Code-does-not-read-AGENTS.md-natively rationale (issue anthropics/claude-code#34235, decided 2026-07-05).
  3. Update `Related Files` to the phase-04 names (`src/scaffold/shared/harness-setup.ts`, per-type `templates/harness-setup.ts`).
  4. Sweep other docs for the retired axis: `docs/architecture/agent-workflow.en.md` and any `related:` frontmatter pointing at `features/claude-harness/...` → repoint to `features/ai-harness/...`; fix the phase-03/04 hit-list items.
  5. Rebuild + validate: `node scripts/build-docs-index.mjs`, `node scripts/lint-docs-frontmatter.mjs`.
- [ ] Review docs-writer's output against this checklist (dev reads, does not edit docs).
- [ ] If docs-writer surfaces spec questions it cannot answer (e.g. undocumented Codex behavior), apply the PARK RULE: file a backlog entry and continue — do not block the plan on spec completeness.
- [ ] Confirm `docs/INDEX.md` shows `ai-harness` and no `claude-harness` entries.

## Verify

- `node scripts/lint-docs-frontmatter.mjs` and `node scripts/build-docs-index.mjs` exit 0; `docs/INDEX.md` regenerated with the new feature key.
- `grep -ri "claude-harness" docs/` returns zero hits (except historical mentions inside `plans/.archive` or backlog, which are out of docs/).
- `npx vitest run` still green (docs changes must not affect tests).

## Notes / risks

- docs-writer owns `docs/` exclusively — if the executor is tempted to hand-edit the spec, stop and delegate.
- backlog/0005 is already `status: resolved`; no backlog edit needed for it — the "absorption" is purely making the spec stop describing AGENTS.md as a pointer.
- `docs/INDEX.md` is generated — never hand-edit; frontmatter drives it.
