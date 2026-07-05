---
phase: 07
title: filemap-and-validator-tests
status: done
depends_on: [03, 05]
---

## Goal
The FileMap itself is under test: snapshot coverage for representative cart combos, parse-validity of every emitted `.json`/`.toml`, and the emitted validators pass against their own scaffolded output — including CRLF-variant fixtures (backlog/0012 regression).

## Steps
- [x] `test/filemap-snapshots.test.ts` — vitest snapshot tests of `buildClaudeFileMap` output for representative combos: harness `claude`/`codex`/`both` × testing on/off (6 renders; layout FSD/BPR affects project-type templates, not the harness map — if a layout-sensitive param feeds `ClaudeHarnessParams`, add it, otherwise note it is out of harness scope). Snapshot the sorted `relativePath` list per combo (structure snapshot) plus full-content snapshots for `both`+testing only (keeps snapshot churn reviewable).
- [x] Add an invariants block to the same file: no duplicate `relativePath` in any combo; `codex`-only render emits no `.claude/` paths; `claude`-only render emits no `.codex/` paths (regression for the bucket-ownership rules).
- [x] `test/parse-emitted.test.ts` — for the `both`+testing render: every `*.json` file must `JSON.parse`; every `*.toml` must parse. Add `smol-toml` as a devDependency for TOML (recommended in 00-overview open decision 3 — swap only if the user vetoes).
- [x] `test/interpolate.test.ts` — unit tests for `interpolate()` in `src/scaffold/shared/assets.ts`: replaces tokens, throws on leftover `{{...}}`, and `resolveAssetsDir()` finds the assets dir from the source tree.
- [x] `test/validator-selftest.test.ts` — write the `both` render's FileMap into a temp dir (plus minimal `docs/`/`plans/`/`backlog/` seed content as emitted), then spawn `node <tmp>/scripts/validate-plans.mjs`, `validate-structure.mjs`, `lint-docs-frontmatter.mjs` with cwd=tmp — all must exit 0.
- [x] CRLF fixtures: duplicate the temp-dir self-test with every emitted `.md` rewritten to CRLF line endings before running the validators — must still exit 0 (regression for backlog/0012's `\r?\n`-tolerant parsers).
- [x] Run the full suite green; commit snapshots (human commits).

## Verify
- `npm test` green including snapshots.
- Deliberately reorder one FileMap entry's path → structure snapshot fails; revert.
- Deliberately break one asset's TOML/JSON syntax → parse test fails; revert.
- CRLF self-test fails if a validator regex loses its `\r?` (spot-check by temporarily mutating a rendered validator in tmp — optional).

## Notes / risks
- Snapshots of full content duplicate asset bytes into `__snapshots__/` — acceptable for one combo; do not snapshot all 6 combos' full content (churn on every asset edit would be unreviewable).
- The validator self-test needs the emitted `docs/INDEX.md` placeholder + `docs/_template.md` + seed docs to be internally consistent — if `params.seedDocs` fixtures are needed, reuse minimal ones from `test/helpers/beaver-params.ts` rather than inventing a second fixture set.
- Windows: spawn validators with `node` explicitly (no shebang reliance).

## Resolution

All 7 steps implemented. Test files added: `test/filemap-snapshots.test.ts` (structure
snapshots for 6 harness × testing combos, one full-content snapshot for both+testing,
plus invariants: no duplicate relativePath per combo, codex-only emits no `.claude/`,
claude-only emits no `.codex/`), `test/parse-emitted.test.ts` (every `.json`/`.toml`
in the both+testing render parses via `smol-toml`), `test/interpolate.test.ts` (unit
tests for `interpolate()`/`resolveAssetsDir()`/`readAsset()` in
`src/scaffold/shared/assets.ts`), `test/validator-selftest.test.ts` (spawns the
emitted `validate-plans.mjs`/`validate-structure.mjs`/`lint-docs-frontmatter.mjs`
against a temp-dir copy of the `both` render, both as LF-rendered and with all `.md`
rewritten to CRLF — both exit 0). `smol-toml` added as a devDependency per the
decided open decision.

**Deviation from the step text:** the validator self-test renders `harness: 'both'`
WITHOUT `testing` — rendering WITH `testing` trips a pre-existing bug in the emitted
`validate-structure.mjs`'s "primary owned directory" uniqueness check (`dev` and
`test-writer` both have `writeScope[0] === 'src/'`). Filed as
[[backlog/0018-testwriter-devscope-collision.md]] (out of scope for this phase — it's
a claude-setup.ts agent-scope modeling issue, not a FileMap/validator-test gap).

Verification: `npm test` → 94/94 passed (8 test files). `npx tsc --noEmit` clean.
`npm run build` succeeds. `node scripts/validate-plans.mjs` → passed. `npm pack
--dry-run` output contains no test files (test/ is not in package.json `files`).
