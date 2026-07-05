---
phase: 01
title: BEFORE render baseline + CLAUDE.md adapter asset + token inventory
status: pending
depends_on: []
---

## Goal

A byte-level BEFORE snapshot of every harness render exists for the diff guardrail, and the new (not-yet-consumed) `harness-assets/CLAUDE.md` adapter asset is authored with a documented token inventory.

## Steps

- [ ] First-touch: apply the verbatim backlog/0016 back-link edit from `00-overview.md` ("First-touch dev task" section).
- [ ] Write a throwaway render-matrix script in the session scratchpad (NOT committed): import `getClaudeFileMap` from `src/scaffold/react-vite/templates/claude-setup.ts` and `src/scaffold/chrome-extension/templates/claude-setup.ts`, plus `getReactViteHarnessFileMap` / `getChromeExtensionHarnessFileMap` / `getGenericHarnessFileMap` from `src/scaffold/harness-only/templates/`; render fixed carts covering harness `claude`/`codex`/`both` × testing `NOT_USING`/`VITEST` (testing axis for react-vite only; pin all other cart fields, and pin the seed-doc date if needed for stable diffs — `docsHomeSpecTemplate` embeds `new Date()`, so either freeze the clock or exclude `docs/features/home/` from the diff); dump each FileMap to `<scratchpad>/before/<case>/<relativePath>`. Run it and keep the output for phases 02–04.
- [ ] Create `harness-assets/CLAUDE.md` — the thin Claude adapter. Structure: line 1 `@AGENTS.md` (the import — must be the first content line); blank line; short note that AGENTS.md is the canonical project document; `## Claude Code specifics` section: skills references (`.claude/skills/{{slug}}-conventions`, `.claude/skills/{{slug}}-docs`, `.claude/skills/{{slug}}-memory-retro`{{testAuthorSkillRef}}), one-line notes on `.claude/settings.json` (permissions/hooks) and `.claude/scripts/agent-guard.mjs` (writeScope enforcement); end with `{{claudeExtras}}` token (empty string default supplied by the renderer). Tokens: `{{projectName}}`, `{{slug}}`, `{{testAuthorSkillRef}}`, `{{claudeExtras}}`.
- [ ] Confirm `.gitattributes` already pins `harness-assets/** text eol=lf` so the new asset is autocrlf-safe (see planner memory: checked-in assets are subject to autocrlf; template literals never were). Add the rule if missing.
- [ ] Record the final token inventory for BOTH assets (this new CLAUDE.md and the phase-02 AGENTS.md skeleton, from `00-overview.md`'s decision table) in this phase's Resolution note, so phase 02 has a fixed contract.

## Verify

- `npm run build` green; `npx vitest run` green (the new asset is not yet consumed — `readAsset('CLAUDE.md')` has no caller, so nothing changes; `harness-assets/AGENTS.md` is untouched this phase).
- `<scratchpad>/before/` contains one directory per matrix case with the full rendered file tree.
- `git diff --stat` shows only `harness-assets/CLAUDE.md` (new), possibly `.gitattributes`, and `backlog/0016-neutral-canonical-harness.md` (back-link).

## Notes / risks

- Do NOT touch `harness-assets/AGENTS.md` in this phase — `interpolate()` throws on unreplaced tokens (`src/scaffold/shared/assets.ts:63-66`), so adding new tokens to it before the renderer passes them breaks `buildClaudeFileMap` for codex/both modes and fails snapshot + golden tests.
- The scratchpad is session-specific; if execution spans sessions, re-run the BEFORE capture from the last commit preceding phase 02 (`git stash` / worktree) rather than trusting a stale directory.
