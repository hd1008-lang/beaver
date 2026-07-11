---
plan: 0017
title: Move beaver's knowledge-base folders to .beaver/ directory
status: done
created: 2026-07-11
---

## Goal

Consolidate beaver's knowledge-base folders (`plans/`, `docs/`, `backlog/`, `scripts/`) into `.beaver/` while keeping tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, and root `AGENTS.md`/`CLAUDE.md`) immovable at the root level.

## Scope

**Stay at root (immovable — tools auto-discover these):**
- `.claude/` — Claude Code agents and skills
- `.codex/` — Codex adapters
- `.agents/` — live agent memory
- `AGENTS.md` — project behavioral guidelines (root entry point)
- `CLAUDE.md` — Claude Code adapter

**Move to `.beaver/` (knowledge-base only):**
- `plans/` — resumable project phases
- `docs/` — feature specifications and documentation
- `backlog/` — parked work entries
- `scripts/` — maintenance and verification scripts

**Not changing:**
- No changes to `src/` product code
- No changes to feature specs (`docs/features/*.spec.md`)
- No changes to harness-setup.ts functionality, only its token handling
- No changes to regeneration machinery (regen-dogfood.ts core logic)

## Non-Goals

- Restructure harness-assets/ directory layout
- Change how scaffolded projects behave (they emit at root level)
- Update CI/CD or deployment configuration (out of scope; file as backlog if needed)

## Rationale

1. **Cleaner root** — product code (src/, test/, npm scripts) at top level; harness metadata hidden in `.beaver/`
2. **Clear separation** — beaver's internal tools stay auto-discoverable at root; knowledge-base tucked away
3. **Precedent** — matches frameworks like `.next/`, `.vite/`, `.cache/`
4. **Reusable pattern** — future CLI projects can adopt `.beaver/` without adapting beaver's own code

## Architectural Correctness

**The `{{baseDir}}` token is selective, not blanket:**
- Knowledge-base paths (`plans/`, `docs/`, `backlog/`, `scripts/`) get `{{baseDir}}/` prefix
- Tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`) stay bare at root
- When `baseDir = '.beaver'` (beaver's dogfood): `{{baseDir}}/plans/` → `.beaver/plans/`
- When `baseDir = ''` (scaffolded projects): `{{baseDir}}/plans/` → `plans/` (empty prefix, relative root)

**writeScope ACL correctness:**
- The `writeScopesJson` registry in harness-setup.ts maps agent write permissions by path prefix
- When paths move from `docs/` → `.beaver/docs/`, the ACL keys must also become `.beaver/docs/` (beaver only; scaffolded projects stay bare)
- This ensures agent-guard allows legitimate writes and blocks out-of-scope ones

**Atomic execution:**
- All six phases must land in ONE commit — the golden test validates render consistency
- Intermediate states break the test (render drift)

## Atomic Design

All phases land atomically:
1. Phase 01: Add `baseDir` parameter to HarnessParams
2. Phase 02: Update harness-assets templates with **selective** `{{baseDir}}/` prefixes (knowledge-base only)
3. Phase 03: Update `src/scaffold/shared/harness-setup.ts` to apply baseDir selectively in FileMap keys and writeScope entries
4. Phase 04: Update `test/helpers/beaver-params.ts` REGEN_PREFIXES and REGEN_FILES
5. Phase 05: **`git mv` the four folders** (atomically move content, not destructive rm)
6. Phase 06: Verify root is clean, run full test suite, commit everything together

## Key Files Modified

**Phase 01 (parameter plumbing):**
- `src/scaffold/shared/harness-setup.ts` — add `baseDir: string` field

**Phase 02 (template tokens — selective):**
- `harness-assets/AGENTS.md`, `harness-assets/.claude/agents/*.md`, `harness-assets/.codex/agents/*.toml` — prefix ONLY `{{baseDir}}/plans/`, `{{baseDir}}/docs/`, `{{baseDir}}/backlog/`, `{{baseDir}}/scripts/` references
- Leave `.claude/`, `.codex/`, `.agents/` refs bare

**Phase 03 (application of baseDir — selective in FileMap and writeScope):**
- `src/scaffold/shared/harness-setup.ts` lines 40-68 (writeScope registry), 155 (baseDir destructure), 205-333 (FileMap keys) — prefix ONLY knowledge-base path keys, leave tool-discovery keys bare

**Phase 04 (regeneration registry):**
- `test/helpers/beaver-params.ts` — add `baseDir: '.beaver'`, update REGEN_PREFIXES and REGEN_FILES

**Phase 05 (move, don't delete):**
- `git mv plans/ .beaver/plans/` (atomically move, not rm)
- `git mv docs/ .beaver/docs/`
- `git mv backlog/ .beaver/backlog/`
- `git mv scripts/ .beaver/scripts/`

**Phase 06 (verify, commit):**
- Full test suite, final verification, atomic commit

## Ordered Phases

| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | Add {{baseDir}} parameter to HarnessParams | done | 7/7 | 2026-07-11 |
| 02 | Update harness-assets templates — selective prefixing | done | 9/9 | 2026-07-11 |
| 03 | Update harness-setup.ts — selective baseDir application | done | 5/5 | 2026-07-11 |
| 04 | Update beaver-params.ts regeneration registry | done | 6/6 | 2026-07-11 |
| 05 | git mv the four knowledge-base folders | done | 5/5 | 2026-07-11 |
| 06 | Verify, run tests, commit atomically | done | 12/12 | 2026-07-11 |

## Resolution (2026-07-11)

All six phases landed in a single commit. Two classes of defects were found and fixed beyond the phase files' literal checklists (both required to make the `.beaver/` mechanism actually work, not just render):

1. **`{{baseDir}}/plans/` leading-slash bug**: interpolating a raw `baseDir` token immediately followed by a literal `/` produces `/plans/` (leading slash) when `baseDir=''`. Fixed by converting every `{{baseDir}}/plans/` (etc.) occurrence in `harness-assets/` to a pre-computed `{{plansDir}}`/`{{docsDir}}`/`{{backlogDir}}`/`{{scriptsDir}}` token, each resolved once in `buildHarnessFileMap` via a `kbDir()` helper.
2. **Cross-boundary references the phase files didn't enumerate**: `.claude/scripts/agent-guard.mjs`, `.codex/scripts/agent-guard-codex.mjs`, and `.codex/scripts/codex-permission-guard.mjs` (tool-discovery, immovable) import `scripts/agent-guard-core.mjs` and `scripts/audit-log.mjs` (knowledge-base, moves under baseDir) via relative paths — these needed the same `{{scriptsDir}}` token. Similarly `harness-assets/scripts/_docs-shared.mjs` (`DOCS_DIR`) and `harness-assets/scripts/validate-plans.mjs` (`PLANS_DIR`, `BACKLOG_DIR`) hardcoded bare directory-name constants resolved relative to `process.cwd()` — left untouched, `node .beaver/scripts/validate-plans.mjs` run from repo root would silently operate on nonexistent `./plans`/`./backlog`. Also fixed the same hook-command path in `.claude/settings.json` and `.codex/hooks.json` (`.../scripts/docs-first-reminder.sh`).

Also found and fixed: the staged (pre-existing, from an earlier interrupted session) harness-assets edits had over-prefixed `.agents/memory/...` and `.agents/skills/...` (tool-discovery paths) with `{{baseDir}}` — reverted to bare, matching this overview's stated selective-prefixing rule.

Test fixture fallout (not phase-file scope, but required for `npm run test` to pass): `test/validator-selftest.test.ts` and `test/helpers/prepare-guard-dir.ts` both reuse `beaverParams` as a config shortcut for scaffolded-project-style fixtures; both needed an explicit `baseDir: ''` / `scriptsDir: 'scripts'` override so they keep testing the bare (scaffolded) layout instead of inheriting beaver's own `.beaver/` prefix. `test/__snapshots__/filemap-snapshots.test.ts.snap` updated (path-only diff, `.beaver/`-prefixed knowledge-base paths).

Verified: `npx tsc --noEmit` clean, `npm run build` clean, `npm run test` 97/97 green, `npx tsx test/helpers/regen-dogfood.ts --check` 0 differing/missing/orphaned, `node .beaver/scripts/validate-plans.mjs` and `node .beaver/scripts/validate-structure.mjs` exit 0 from repo root, `npm run dev` starts cleanly.

Pre-existing, out-of-scope for this plan: `validate-plans.mjs` warns (exit 0, not an error) that this plan's own phase filenames don't match the title text in the Ordered Phases table above (a plan-authoring convention mismatch, unrelated to baseDir).
