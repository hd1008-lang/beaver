# assets-and-tests — Overview

Plan input: [[backlog/0013-assets-as-files-and-test-suite.md]] (advisor items #1 + #5 combined).

> **Pending back-link (dev/main-session task, first touch):** add to backlog/0013 body, above `## Symptom`:
> `> **Plan created 2026-07-05**: [[plans/assets-and-tests/00-overview.md]] — 8 phases (01 packaging investigation → 04 dogfood regeneration → 05 golden test → 08 CI). Entry stays open until the work lands.`
> (planner is guard-blocked from `backlog/` writes; phase 08 closes the entry as `resolved`.)

## Goal
Kill the template-in-string dual-maintenance problem: move the harness scripts/assets embedded as template literals in `src/scaffold/shared/claude-setup.ts` (~2000 lines) into real files under a new `harness-assets/` directory, make this repo's own `scripts/`, `.claude/`, `.codex/`, `AGENTS.md` the literal rendered output of `buildClaudeFileMap`, and add a permanent vitest suite + GitHub Actions CI whose golden test mechanically fails on any dogfood drift.

## Scope
**Part A — assets-as-files (phases 01–04):**
1. Packaging investigation FIRST (phase 01): confirm option (a) — ship `harness-assets/` in the npm package via the `files` field + runtime path resolution relative to `import.meta.url` (mirroring how `getVersion()` in `src/index.ts:13-20` reads `../package.json`). Fallback: option (b), inline at build time via a tsup loader/plugin.
2. Extract all templates from `claude-setup.ts` into `harness-assets/` — fully static scripts first (zero tokens), then tokenized templates (`{{projectName}}`, `{{slug}}`, `{{reminderTrigger}}`, `{{flowEnum}}`, agent-registry-derived blocks).
3. `buildClaudeFileMap` becomes: read asset → interpolate tokens → emit. The shared/claudeOnly/codexOnly bucket logic (claude-setup.ts:2040-2126) is unchanged.
4. Regenerate the dogfood copies from `buildClaudeFileMap` with beaver's own params, eliminating deliberate diffs (preferred over an allowlist — see phase 04).

**Part B — test suite + CI (phases 05–08):**
5. vitest as devDependency only + the golden dogfood-drift test.
6. Port the security-plan throwaway tests as permanent tests (guard path matrix, codex-permission-guard deny/allow matrix, audit-log).
7. FileMap snapshot tests, JSON/TOML parse tests, emitted-validator self-test with CRLF fixtures.
8. GitHub Actions: push CI + weekly scaffold-and-build cron.

## Non-goals
- No change to menus, Cart fields, or prompts.
- No change to scaffolded projects' pinned library versions (vitest and the TOML parser are devDependencies of beaver itself only).
- Project-type-owned templates stay TS-side: `params.claudeMd`, `params.conventionsSkill`, `params.devAgent`, `params.testing.*` are rendered by each project type and passed in — they are NOT moved to `harness-assets/` in this plan.
- backlog/0016 (neutral canonical inversion) — explicitly sequenced AFTER this plan; do not fold it in.
- backlog/0014, 0015, 0017 — separate work.

## Open decisions flagged for the user

> **DECIDED 2026-07-05 (user):** all four recommendations accepted as-is — golden-test file set per item 1, regenerate dogfood (item 2), `smol-toml` (item 3), Node 20 only (item 4).
1. **Golden-test file set** (phase 05): recommended assert list is `scripts/**`, `.claude/settings.json`, `.claude/scripts/**`, `.claude/agents/**`, `.claude/skills/**`, `.codex/**`, `AGENTS.md`, `plans/README.md`, `backlog/README.md` — EXCLUDING `CLAUDE.md` (dogfood copy is bespoke), `docs/**` (real docs live there), `.agents/memory/**` (live memory diverges by design).
2. **Regenerate vs allowlist** (phase 04): regenerate is recommended (per backlog/0013), which deletes the "LIVE VERIFICATION STATUS" block in `.codex/scripts/agent-guard-codex.mjs` and all "SYNC BY HAND" comments (obsolete once single-sourced). Anything worth keeping moves to docs or a backlog note first.
3. **TOML parser dev-dep** (phase 07): recommend `smol-toml` (small, ESM, actively maintained). Veto if you prefer `@iarna/toml` or the python3 trick.
4. **CI Node version** (phase 08): recommend Node 20 only (matches `engines`), no matrix.

## Ordered phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | packaging-investigation | done | 6/6 | 2026-07-05 |
| 02 | static-script-assets | done | 7/7 | 2026-07-05 |
| 03 | tokenized-assets | done | 8/8 | 2026-07-05 |
| 04 | dogfood-regeneration | done | 7/7 | 2026-07-05 |
| 05 | vitest-and-golden-test | done | 7/7 | 2026-07-05 |
| 06 | port-security-tests | done | 6/6 | 2026-07-05 |
| 07 | filemap-and-validator-tests | done | 7/7 | 2026-07-05 |
| 08 | ci-workflows-and-close | done | 7/8 | 2026-07-05 |

Phase 01 is a decision gate — all later phases assume its outcome (option a). 02→03→04 must run in order (each keeps rendered output byte-identical to the previous state). 05 depends on 04 (golden test asserts against regenerated dogfood). 06 needs only 02 (real script files exist); 07 needs 03+05; 08 last.
