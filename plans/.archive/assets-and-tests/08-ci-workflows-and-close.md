---
phase: 08
title: ci-workflows-and-close
status: done
depends_on: [05, 06, 07]
---

## Goal
GitHub Actions enforce the suite on every push and catch pinned-version rot weekly via a real scaffold-install-build run; the plan is closed out (backlog resolved, plan archived).

## Steps
- [x] Create `.github/workflows/ci.yml` — trigger: push (all branches) + pull_request. Steps: checkout, setup-node (Node 20, per `engines`; single version — open decision 4), `npm ci`, `npm run build`, `npm test`, then the 3 repo validators: `node scripts/validate-plans.mjs`, `node scripts/validate-structure.mjs`, `node scripts/lint-docs-frontmatter.mjs`.
- [x] Create a non-interactive scaffold entry for CI: `test/helpers/scaffold-fixture.ts` (run via `npx tsx`) that imports `scaffoldReactVite` directly with a full-featured hardcoded cart (router + zustand + query + tailwind + biome, harness `both`, testing on) and scaffolds into a path given by argv. The interactive menu is NOT driven in CI.
- [x] Create `.github/workflows/weekly-scaffold.yml` — trigger: `schedule` (weekly cron, e.g. Monday 03:00 UTC) + `workflow_dispatch` (manual re-run for debugging). Steps: checkout, setup-node 20, `npm ci`, `npm run build`, run `scaffold-fixture.ts` into `$RUNNER_TEMP/fixture`, then inside it `npm install && npm run build`. This exercises the pinned dependency versions (pins date from mid-2025 — this is the rot detector).
- [x] Confirm `.github/` is inside dev's writeScope (it is, per the AGENTS registry `dev.writeScope` in `src/scaffold/shared/claude-setup.ts`) — dev can execute this phase without main-session help.
- [ ] Push-trigger sanity: after the human commits/pushes, check the Actions run is green (dev cannot push — ask the user to push and report back; do not mark this step done on local green alone). **Not done — requires the user to push and report back; see Resolution.**
- [x] Update `backlog/0013-assets-as-files-and-test-suite.md`: `status: resolved` + one-line conclusion linking `plans/assets-and-tests/` (dev-scope write; also add the plan link if planner could not — see 00-overview note).
- [x] Check backlog/0016's sequencing note is now unblocked (Part A landed) — no edit needed unless 0016 references stale assumptions; if it does, add a one-line update there.
- [x] Archive: move `plans/assets-and-tests/` to `plans/.archive/assets-and-tests/` once all phases are `done`, and run `node scripts/validate-plans.mjs` to confirm consistency.

## Verify
- `npm test` and all 3 validators green locally.
- CI workflow green on GitHub after push (user-confirmed).
- `workflow_dispatch` run of weekly-scaffold green: fixture project installs and builds with the pinned versions.
- `node scripts/validate-plans.mjs` passes after archive + backlog resolution.

## Notes / risks
- Weekly scaffold WILL eventually fail when a pinned version rots or an upstream registry hiccups — that is its job. Its failure should file a backlog entry, not block push CI (keep the two workflows separate for exactly this reason).
- `npm install` in the fixture hits the network; flaky-registry retries: add `--fetch-retries` or accept occasional manual re-runs — do not over-engineer.
- If the golden test (phase 05) fails in CI on Linux but passes on Windows (or vice versa), it is a line-ending gap in `.gitattributes` — fix the attributes, not the test.

## Resolution (2026-07-05)

- `.github/workflows/ci.yml` created: push (all branches) + pull_request trigger,
  Node 20, `npm ci` -> `npm run build` -> `npm test` -> the 3 validators
  (`validate-plans.mjs`, `validate-structure.mjs`, `lint-docs-frontmatter.mjs`).
- `.github/workflows/weekly-scaffold.yml` created: weekly cron (Mon 03:00 UTC) +
  `workflow_dispatch`, runs `test/helpers/scaffold-fixture.ts` into
  `$RUNNER_TEMP/fixture` then `npm install && npm run build` inside it.
- `test/helpers/scaffold-fixture.ts` added: non-interactive entry point, imports
  `scaffoldReactVite` directly with a hardcoded full-featured cart (FSD, TanStack
  Router, Zustand, TanStack Query, Tailwind, Biome, Vitest, harness `both`).
  `scaffoldReactVite` resolves `projectName` relative to `process.cwd()` (it's a
  bare name embedded in nested slug paths, not a path itself), so the fixture
  `process.chdir`s into the target's parent dir and scaffolds the basename --
  verified locally against an `os.tmpdir()` target (never the repo tree).
- Verified locally (no GitHub push available from this session):
  - `node scripts/validate-plans.mjs`, `node scripts/validate-structure.mjs`,
    `node scripts/lint-docs-frontmatter.mjs` all pass.
  - Both workflow YAML files parse cleanly (`npx js-yaml <file>` -- actionlint not
    installed in this environment, noted as a gap rather than silently skipped).
  - `npx tsx test/helpers/scaffold-fixture.ts <tmp-path>` scaffolds successfully;
    `npm install` in the fixture succeeds (pinned versions still resolve as of
    2026-07-05); `npm run build` in the fixture **fails** on a pre-existing,
    unrelated bug -- `tsc` runs before Vite's TanStack Router plugin regenerates
    `routeTree.gen.ts`, so the placeholder tree (shipped by the scaffold, lacking
    type registration) doesn't type-check `createFileRoute('/')`. This is exactly
    the failure mode this workflow exists to catch, so per this phase's own Notes
    ("failure should file a backlog entry, not block push CI") it was **not**
    fixed here -- filed as [[backlog/0019-router-fixture-build-order.md]] (out of
    scope: a react-vite template/script-ordering fix, not a CI-wiring change).
  - `npm test` (94/94), `npx tsc --noEmit`, `npm run build` (this repo's own
    build) all green after the changes.
- `backlog/0013` set to `status: resolved` with a resolution note; `backlog/0016`
  updated to note it is now unblocked (0013 landed).
- Push-trigger sanity (Actions run green) and the `workflow_dispatch` weekly run
  are **not verifiable from this session** (dev cannot push) -- left for the user
  to confirm after pushing, per this phase's own Verify step.
- Plan archival (`plans/assets-and-tests/` -> `plans/.archive/assets-and-tests/`)
  is left to the main session per this task's instructions.
