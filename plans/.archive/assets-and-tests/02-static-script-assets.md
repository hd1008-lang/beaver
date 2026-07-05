---
phase: 02
title: static-script-assets
status: done
depends_on: [01]
---

## Goal
Every zero-token (fully static) template in `src/scaffold/shared/claude-setup.ts` lives as a real, executable/lintable file in `harness-assets/`, with `buildClaudeFileMap` reading it via the phase-01 loader — rendered output byte-identical to before.

## Steps
- [x] Capture a BEFORE baseline: render `buildClaudeFileMap` with fixed params (harness `'both'`, testing on) via a throwaway tsx script into a temp dir (scratchpad, not the repo). Keep it until the end of the phase for diffing.
- [x] Add `readAsset(relPath: string): string` to `src/scaffold/shared/assets.ts` (resolveAssetsDir + readFileSync, cache optional but unnecessary — keep it simple).
- [x] Extract the static `.mjs` script templates to `harness-assets/`, mirroring their emitted relative paths (this makes phase 05's golden test trivial):
  - `harness-assets/scripts/build-docs-index.mjs` ← `buildDocsIndexMjsTemplate()`
  - `harness-assets/scripts/lint-docs-frontmatter.mjs` ← `lintDocsFrontmatterMjsTemplate()`
  - `harness-assets/scripts/validate-plans.mjs` ← `validatePlansMjsTemplate()` (static per planner memory — no params)
  - `harness-assets/.codex/scripts/agent-guard-codex.mjs` ← `agentGuardCodexMjsTemplate()`
  - `harness-assets/.codex/scripts/codex-subagent-start.mjs` ← `codexSubagentStartMjsTemplate()`
  - `harness-assets/.codex/scripts/codex-subagent-stop.mjs` ← `codexSubagentStopMjsTemplate()`
  - `harness-assets/.codex/scripts/codex-permission-guard.mjs` ← `codexPermissionGuardMjsTemplate()`
- [x] Extract the static config/doc templates the same way: `harness-assets/.claude/settings.json` ← `claudeSettingsTemplate()` (verify it truly takes no params — `SENSITIVE_FILE_PATTERNS` is interpolated at TS module load, so the OUTPUT is constant; the asset file holds the final rendered JSON), `harness-assets/.codex/hooks.json` ← `codexHooksJsonTemplate()`, `harness-assets/plans/README.md` ← `plansReadmeTemplate()`, `harness-assets/backlog/README.md` ← `backlogReadmeTemplate()`, `harness-assets/docs/README.md` ← `docsReadmeTemplate()`, `harness-assets/docs/INDEX.md` ← `docsIndexPlaceholderTemplate()`.
- [x] Replace each corresponding template call in `buildClaudeFileMap` (claude-setup.ts:2045-2110) with `readAsset('<same relative path>')`. Delete the now-unused template functions and any helpers made orphan by the deletion (e.g. if `SENSITIVE_FILE_PATTERNS`/`buildCodexSecretFileTargetSource` become unused after settings.json + codex-permission-guard.mjs both move to assets, delete them too — but ONLY if genuinely unused; grep first).
- [x] Add `.gitattributes` entries (or create the file) pinning `harness-assets/** text eol=lf` — CRLF in emitted `.sh`/`.mjs` files breaks bash hooks (context: backlog/0012). Assets are now checked-in files subject to git autocrlf; the template literals never were.
- [x] Render the AFTER output with the same fixed params and diff against the BEFORE baseline — must be byte-identical (a trailing-newline diff from editor auto-formatting is the classic failure; fix the asset, not the baseline).

## Verify
- BEFORE/AFTER rendered trees are byte-identical (`git diff --no-index <before> <after>` empty).
- `node harness-assets/scripts/validate-plans.mjs` parses (run with `node --check` for each `.mjs` asset — they are now real lintable files; this is the point of the refactor).
- `npx tsc --noEmit` and `npm run build` pass.
- `npm pack --dry-run` lists all new asset files.

## Notes / risks
- Do NOT reformat script content while extracting — copy the template-literal output verbatim (render it, don't hand-transcribe). Watch for `\`` and `\${` escapes in the literals that must become literal backtick/`${` in the files.
- The dogfood copies under `scripts/`, `.claude/`, `.codex/` are NOT touched in this phase — they still carry SYNC BY HAND comments and may differ slightly from assets. Phase 04 reconciles them.
- Guard scope: `harness-assets/` is not in dev's writeScope in `.claude/settings.json`. If the dev subagent is blocked writing there, run the extraction from the main session (precedent: security-hardening phase 04 used a throwaway Bash script for out-of-scope writes) — do NOT widen the guard config as a side effect of this plan.

## Resolution (2026-07-05)

All 13 fully static templates extracted verbatim from `src/scaffold/shared/claude-setup.ts`
into `harness-assets/` (mirroring their emitted relative paths):

- `harness-assets/scripts/build-docs-index.mjs`
- `harness-assets/scripts/lint-docs-frontmatter.mjs`
- `harness-assets/scripts/validate-plans.mjs`
- `harness-assets/.codex/scripts/agent-guard-codex.mjs`
- `harness-assets/.codex/scripts/codex-subagent-start.mjs`
- `harness-assets/.codex/scripts/codex-subagent-stop.mjs`
- `harness-assets/.codex/scripts/codex-permission-guard.mjs`
- `harness-assets/.claude/settings.json`
- `harness-assets/.codex/hooks.json`
- `harness-assets/plans/README.md`
- `harness-assets/backlog/README.md`
- `harness-assets/docs/README.md`
- `harness-assets/docs/INDEX.md`

`readAsset(relPath)` added to `src/scaffold/shared/assets.ts` (thin wrapper around
`resolveAssetsDir()` + `readFileSync`). `buildClaudeFileMap` in `claude-setup.ts` now calls
`readAsset('<path>')` for all 13 of the above, plus the phase-01 `scripts/audit-log.mjs` entry
(migrated from an inline `readFileSync(join(resolveAssetsDir(), ...))` call to the new
`readAsset()` helper for consistency). The 13 corresponding template functions were deleted
from `claude-setup.ts` (2089 → 1112 lines), along with orphaned helpers `SENSITIVE_FILE_PATTERNS`,
`globPatternToCommandRegexFragment`, and `buildCodexSecretFileTargetSource` (both only fed the
now-deleted `claudeSettingsTemplate`/`codexPermissionGuardMjsTemplate`).

`.gitattributes` created at repo root with `harness-assets/** text eol=lf`.

**Byte-identical verification**: rendered `buildClaudeFileMap({ harness: 'both', testing: {...} })`
with fixed params via a throwaway tsx script before and after the edit (44 files), sorted by
relativePath, dumped to JSON, and diffed with `git diff --no-index` — zero output, confirming
byte-identical output. Also ran `node --check` on all 7 new `.mjs` assets and JSON.parse on the
2 new JSON assets — all pass. `npx tsc --noEmit`, `npm run build`, and
`node scripts/validate-plans.mjs` all pass. `npm pack --dry-run` lists all 13 new asset paths
under `harness-assets/`.

No surprises — the phase-01 `audit-log.mjs` inline read was the only pre-existing pattern to
reconcile, folded into `readAsset()` for consistency rather than left as a one-off.
