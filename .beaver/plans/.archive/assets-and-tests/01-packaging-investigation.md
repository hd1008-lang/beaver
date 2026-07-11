---
phase: 01
title: packaging-investigation
status: done
depends_on: []
---

## Goal
Prove (or disprove) option (a): assets shipped as real files in the npm package via the `files` field, resolved at runtime relative to `import.meta.url` — so every later phase can build on a confirmed packaging strategy.

## Steps
- [x] Add `"harness-assets"` to the `files` array in `package.json` (currently `["dist"]`, line 10-12).
- [x] Create `harness-assets/` with ONE real sample asset copied verbatim from an existing static template — use `scripts/audit-log.mjs` content (from `auditLogMjsTemplate()` in `src/scaffold/shared/claude-setup.ts`) as `harness-assets/scripts/audit-log.mjs`.
- [x] Create `src/scaffold/shared/assets.ts` with a `resolveAssetsDir(): string` helper. CRITICAL: after tsup bundling, `import.meta.url` for ALL modules resolves to `dist/index.js`, so a fixed `../harness-assets` relative path works for the built CLI but NOT for `tsx src/index.ts` dev mode (module dir = `src/scaffold/shared/`). Implement as: from `dirname(fileURLToPath(import.meta.url))`, walk up parent directories (max 4) until a directory containing `harness-assets/` is found; throw a `ScaffoldError` if not found.
- [x] Wire the sample asset into `buildClaudeFileMap`: replace the `auditLogMjsTemplate()` call at claude-setup.ts:2055 with a read of the sample asset via `assets.ts` (`readFileSync(join(resolveAssetsDir(), 'scripts/audit-log.mjs'), 'utf-8')`). Delete `auditLogMjsTemplate` (your change made it unused).
- [x] Verify both execution modes read the asset: `npm run dev` (tsx) and `npm run dev:build` (compiled dist) — scaffold a throwaway project into a temp dir each time and confirm `scripts/audit-log.mjs` content in the output is byte-identical to the asset file.
- [x] Run `npm pack --dry-run` and confirm every `harness-assets/**` file appears in the tarball listing. Record the outcome in a **Resolution** section at the bottom of this file: option (a) confirmed, OR option (a) failed with reason → investigate option (b) (tsup loader that inlines `harness-assets/` at build time; see tsup `loader`/`esbuild` plugin options in `tsup.config.ts`) and record which option all later phases use.

## Verify
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- `npm pack --dry-run` output lists `harness-assets/scripts/audit-log.mjs`.
- Both `npm run dev` and `npm run dev:build` scaffold runs emit a `scripts/audit-log.mjs` identical to the asset file.

## Notes / risks
- This phase is a DECISION GATE. If option (a) fails, STOP before phase 02 and record option (b) findings — the shape of phases 02–03 (read at runtime vs import at build time) depends on it. Do not silently proceed.
- `npm run dev` is interactive — drive it manually or answer prompts by hand; there is no non-interactive scaffold entry point yet (phase 08 adds one for CI).
- The walk-up resolution must NOT accidentally find a `harness-assets/` in a parent of an end user's install; it starts from the module's own directory (inside the package), so the first hit is always the package's own copy. Cap the walk at 4 levels to be safe.
- Rollback: revert `package.json`, delete `harness-assets/` and `src/scaffold/shared/assets.ts`, restore `auditLogMjsTemplate`.

## Resolution

**Option (a) CONFIRMED.** `harness-assets/` ships as real files in the npm package and is resolved
at runtime via a walk-up from `import.meta.url`, working identically in both `tsx` dev mode and
the tsup-compiled `dist/` bundle.

Changes made:
- `package.json`: added `"harness-assets"` to the `files` array (alongside `"dist"`).
- `harness-assets/scripts/audit-log.mjs`: new file, byte-identical to the string previously
  returned by `auditLogMjsTemplate()`.
- `src/scaffold/shared/assets.ts`: new `resolveAssetsDir()` helper — walks up from this module's
  own directory (max 4 levels) looking for a sibling `harness-assets/` directory; throws
  `ScaffoldError` if not found within the cap.
- `src/scaffold/shared/claude-setup.ts`: removed `auditLogMjsTemplate()` (now unused); the
  `scripts/audit-log.mjs` file-map entry reads
  `readFileSync(join(resolveAssetsDir(), 'scripts/audit-log.mjs'), 'utf-8')` instead.

Verification results:
- `npx tsc --noEmit` — passes, no errors.
- `npm run build` (tsup) — succeeds, `dist/index.js` 218.80 KB.
- `npm pack --dry-run` — tarball listing includes `harness-assets/scripts/audit-log.mjs` (1.7kB).
- Both-mode byte-identical check: called `buildClaudeFileMap(...)` directly from a throwaway
  script (not the interactive menu) — once under `npx tsx` (dev mode, module dir under
  `src/scaffold/shared/`) and once from a tsup-bundled single-file build placed at the project
  root (mimicking `dist/index.js`'s collapsed `import.meta.url`). Both runs produced a
  `scripts/audit-log.mjs` content of 1722 bytes with SHA-256
  `736d3d9656aad5d34b77e9f431b9f798ec61aac7645c60fa5d1d557955748fd2`, identical to
  `harness-assets/scripts/audit-log.mjs` on disk. Throwaway scripts and temp output dirs were
  deleted after verification; nothing under `scripts/` or a temp dir was left behind.

**All later phases (02-08) proceed on option (a).**
