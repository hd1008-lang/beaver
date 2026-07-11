---
phase: 05
title: vitest-and-golden-test
status: done
depends_on: [04]
---

## Goal
`npm test` exists (vitest, devDependency only) and its first test is the golden dogfood-drift test: render with beaver's params, diff against the live repo files, fail on any drift — mechanically killing the drift bug class.

## Steps
- [x] Add `vitest` to `devDependencies` in `package.json` (latest stable; this is beaver's own tooling — it does NOT touch the pinned-versions table for scaffolded projects in CLAUDE.md).
- [x] Add `"test": "vitest run"` to `package.json` scripts; create `vitest.config.ts` (test dir `test/`, node environment; alias `@src`/`@utils` to match `tsconfig`).
- [x] Create `test/golden-dogfood.test.ts`: import `beaverParams` and the regeneration file set from `test/helpers/beaver-params.ts` (phase 04), render `buildClaudeFileMap(beaverParams)`, and for each file in the set assert content equals the live repo file (read from repo root, resolved relative to the test file). Normalize nothing — byte equality; the `.gitattributes` from phase 02 keeps line endings stable.
- [x] Assert set-completeness both ways: every rendered path in the file set exists on disk, AND every on-disk file under the asserted directories is present in the render (catches orphaned live files that the map no longer emits — the backlog/0006 drift class).
- [x] Give the failure message a remediation hint: "run `npx tsx test/helpers/regen-dogfood.ts` if the asset change is intentional".
- [x] Confirm `npm run build` still succeeds and `npm pack --dry-run` does NOT include `test/` or `vitest.config.ts` (files field is `["dist", "harness-assets"]` — nothing to do unless something leaked).
- [x] Run `npm test` — green.

## Verify
- `npm test` passes on a clean checkout.
- Mutate one live file (e.g. add a comment to `scripts/audit-log.mjs`), `npm test` fails naming that file; revert, green again.
- Mutate one asset file, `npm test` fails; revert, green again.

## Notes / risks
- The golden test reads the repo working tree — it is inherently a dogfood-repo test, meaningless in a scaffolded project. That is fine: this suite is beaver's own, never emitted.
- Windows CRLF: if a contributor's checkout rewrites live files to CRLF the byte-equality fails spuriously. The phase 02 `.gitattributes` (`eol=lf` for harness files) must cover the live copies too — extend it here if phase 02 scoped it to `harness-assets/**` only.
- If vitest's default include pattern picks up scaffolded temp output from other tests later, pin `include: ['test/**/*.test.ts']` now.

## Resolution (2026-07-05)

Executed from the main session (package.json, vitest.config.ts, .gitattributes and test/ sit outside dev's writeScope).

- vitest ^4.1.9 devDependency; `npm test` = `vitest run`; `vitest.config.ts` pins `include: ['test/**/*.test.ts']`, node env, @src/@utils aliases.
- `test/golden-dogfood.test.ts`: one test per rendered file in the golden set (30) + one orphan test — byte equality, remediation hint points at `npx tsx test/helpers/regen-dogfood.ts`. Shared disk-listing logic extracted to `regenFilesOnDisk()` in `test/helpers/beaver-params.ts` (reused by regen-dogfood.ts).
- `.gitattributes` extended: the whole asserted set (scripts/**, .claude/**, .codex/**, AGENTS.md, plans/README.md, backlog/README.md) is pinned `text eol=lf` so CRLF checkouts can't fail the byte-equality spuriously (phase Notes risk).
- Verify: 31/31 green; live-file mutation (audit-log canary) fails naming the file, asset mutation fails identically, both green after revert; `npm pack --dry-run` contains no test/ or vitest.config.ts; `npx tsc --noEmit` and `npm run build` pass.
- Gotcha for later phases: harness-assets/ is still untracked — `git checkout --` cannot revert asset edits, and reverting a live file re-introduces drift until `regen-dogfood.ts` is re-run.
