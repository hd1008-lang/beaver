---
id: "0013"
title: "Assets-as-files refactor + test suite/CI — kill the template-in-string dual-maintenance problem"
status: resolved
source: advisor-consultation-2026-07-04
severity: medium
created: 2026-07-04
---

> **Plan created 2026-07-05**: [[plans/assets-and-tests/00-overview.md]] — 8 phases (01 packaging investigation → 04 dogfood regeneration → 05 golden test → 08 CI). Entry stays open until the work lands.

## Symptom

`src/scaffold/shared/claude-setup.ts` is ~2000+ lines and growing. All harness scripts (`agent-guard-core.mjs`, `codex-permission-guard.mjs`, `audit-log.mjs`, validators, hooks) are embedded as **template literals** — they cannot be linted, type-checked, or executed directly. Worse, this repo dogfoods its own harness, so every script exists **twice**: the live copy (`scripts/`, `.claude/`, `.codex/`) and the string twin inside `claude-setup.ts`.

Evidence this is the #1 maintenance tax (from the 2026-07-04 security-hardening plan execution):
- Every one of phases 02–05 required editing BOTH copies and manually diffing rendered output against the dogfood copy ("SYNC BY HAND" comments were added as a stopgap).
- Historical drift already happened: backlog/0006 (script dir migration), 0007, 0008 were all drift-repair work.
- The Windows path bug (backlog/0011) and CRLF bug (0012) each needed the fix applied in 2 and 8 places respectively.
- The repo has **zero tests**. All verification during the security plan was throwaway scripts (guard smoke tests, `buildClaudeFileMap` render + diff scripts, adapter pipe tests) — written, run once, deleted. That raw material is described in the plan Resolution sections (`plans/.archive/security-hardening/`) and can be reconstructed as a permanent suite.

## Tried

Nothing yet — parked for time. This entry IS the plan-input; hand it to `planner` tomorrow.

## Why parked

End of working session 2026-07-04. Large refactor; needs a fresh multi-phase plan and uninterrupted time.

## Suggested direction

Combine advisory items #1 (assets-as-files) and #5 (test suite/CI) into ONE plan — they compound: real files make the golden test trivial, and the throwaway verify scripts become the seed of the suite.

**Part A — assets-as-files:**
1. Create `harness-assets/` in the repo containing the REAL files (`.mjs` scripts, `.sh` hooks, skill `.md`s, agent `.md`/`.toml`s, settings.json, hooks.json) with token placeholders (`{{projectName}}`, `{{slug}}`, `{{reminderTrigger}}`, etc.) only where content is actually dynamic. Most scripts are 100% static — zero tokens.
2. `buildClaudeFileMap` becomes: read asset file → interpolate tokens → emit. Keep the shared/claudeOnly/codexOnly bucket logic (classify by OWNERSHIP — see `.agents/memory/dev/MEMORY.md` bullet on harness conditionality).
3. **Packaging constraint (must investigate first):** the build uses tsup → single `dist/index.js`. Assets must either (a) ship in the npm package (`files` field in package.json + runtime path resolution relative to `import.meta.url`, mirroring how `getVersion()` already reads `../package.json`), or (b) be inlined at build time via a tsup loader/plugin. Option (a) is simpler and keeps assets editable; verify `npm pack` output contains them.
4. **Dogfood = generated output:** make this repo's own `scripts/`, `.claude/`, `.codex/`, `AGENTS.md` literally the rendered output of `buildClaudeFileMap` with beaver's own params. Known obstacle: dogfood copies currently carry small deliberate extras (e.g. "LIVE VERIFICATION STATUS" comment block in `.codex/scripts/agent-guard-codex.mjs`, cross-reference comments). Decide: regenerate dogfood to eliminate diffs (preferred) or maintain a small allowlist of acceptable diffs.
5. Golden test: render with beaver's cart → diff against the repo's live files → CI fails on drift. This mechanically kills the drift class forever.

**Part B — test suite + CI:**
1. Add vitest (devDependency only — does NOT touch scaffolded-project pinned versions).
2. Port the throwaway tests from the security plan as permanent tests:
   - guard core: the 12-case Windows/POSIX path matrix (see backlog/0011 resolution note).
   - codex-permission-guard: deny/allow matrix for all 3 pattern groups (git / secret-read / network-egress) — the exact commands are listed in `plans/.archive/security-hardening/03-*.md` and `04-*.md` Verify sections.
   - audit-log: deny appends a line, allow does not.
3. Snapshot tests of the FileMap for representative cart combos (harness claude/codex/both × FSD/BPR × testing on/off).
4. Parse tests: every emitted `.json` must `JSON.parse`, every `.toml` must parse (node has no built-in TOML — use a tiny dev-dep or the python3 trick from dev memory).
5. Emitted-validator self-test: run `validate-plans.mjs`/`validate-structure.mjs`/`lint-docs-frontmatter.mjs` against a scaffolded output — must pass. Include CRLF-variant fixtures (regression for backlog/0012).
6. GitHub Actions: on push — build + vitest + the 3 repo validators. Weekly cron — scaffold a project into temp, `npm install && npm run build` inside it (catches pinned-version rot; pins date from mid-2025).

**Sequencing note:** do Part A before backlog/0016 (neutral canonical) — inverting the canonical is far easier once assets are real files.

## Resolution (2026-07-05)

All 8 phases landed: [[plans/.archive/assets-and-tests/00-overview.md]]. Assets live
under `harness-assets/`, `buildClaudeFileMap` reads+interpolates them, dogfood
(`scripts/`, `.claude/`, `.codex/`, `AGENTS.md`, `plans/README.md`,
`backlog/README.md`) is regenerated to byte-match the render (asserted by
`test/golden-dogfood.test.ts`), vitest suite is 94/94 green, and
`.github/workflows/ci.yml` (push/PR) + `.github/workflows/weekly-scaffold.yml`
(pinned-version rot detector) are in place. backlog/0016 is now unblocked.
