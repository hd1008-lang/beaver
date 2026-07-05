---
phase: 04
title: dogfood-regeneration
status: done
depends_on: [03]
---

## Goal
This repo's own `scripts/`, `.claude/`, `.codex/`, `AGENTS.md`, `plans/README.md`, `backlog/README.md` are byte-identical to the rendered output of `buildClaudeFileMap` with beaver's own params — zero deliberate diffs (regenerate, not allowlist).

## Steps
- [x] Create the beaver params fixture at `test/helpers/beaver-params.ts`: the exact `ClaudeHarnessParams` for this repo (`projectName: 'beaver'`, `slug: 'beaver'`, `harness: 'both'`, the repo's real flowEnum/layerEnum/reminderTrigger — recover these by diffing current `scripts/_docs-shared.mjs` and `scripts/docs-first-reminder.sh` against the tokenized assets). This fixture is reused by phase 05's golden test — it is the single definition of "beaver's cart".
- [x] Define the regeneration file set in the fixture too (exported allow-list of relative paths to write/assert): `scripts/**`, `.claude/settings.json`, `.claude/scripts/**`, `.claude/agents/**`, `.claude/skills/**`, `.codex/**`, `AGENTS.md`, `plans/README.md`, `backlog/README.md`. EXCLUDED: `CLAUDE.md` (bespoke dogfood copy), `docs/**` (real knowledge base), `.agents/memory/**` (live memory content). Confirm `plans/README.md`/`backlog/README.md` currently match the templates before including them — if they deliberately diverge, drop them from the set and note why here.
- [x] Diff the render against the live copies FIRST (report-only) and triage every diff: (a) obsolete "SYNC BY HAND" comments → delete from live (regeneration removes them); (b) "LIVE VERIFICATION STATUS" block in `.codex/scripts/agent-guard-codex.mjs` → its content is historical verification evidence; move anything worth keeping into `plans/.archive/codex-harness-port/` notes or a backlog comment before deleting; (c) genuine fixes present in live but missing from assets (drift the other direction) → port INTO the asset first, re-render, re-diff.
- [x] Write `test/helpers/regen-dogfood.ts` (run via `npx tsx`): renders `buildClaudeFileMap(beaverParams)`, filters to the regeneration file set, writes into the repo root. This script stays permanently — it is the sanctioned way to update dogfood after any asset change.
- [x] Run the regeneration; inspect `git diff` — every hunk must be explainable by the phase's triage (no surprise content loss).
- [x] Manually smoke the regenerated harness: `node scripts/validate-plans.mjs`, `node scripts/validate-structure.mjs`, `node scripts/lint-docs-frontmatter.mjs` all pass on this repo; `echo '{"tool_input":{"command":"git push"}}' | node .codex/scripts/codex-permission-guard.mjs` still denies; a planner-style write payload through `.claude/scripts/agent-guard.mjs` still allows `plans/` and denies `src/`.
- [x] Re-render and confirm zero diff against the live tree (the golden condition phase 05 will automate).

## Verify
- `npx tsx test/helpers/regen-dogfood.ts` followed by `git status` → clean (no diffs).
- The three repo validators pass; codex-permission-guard and agent-guard smoke commands behave as before (see `plans/.archive/security-hardening/03-*.md` / `04-*.md` Verify lists).
- Claude Code still loads: `.claude/settings.json` is valid JSON and hooks reference existing script paths.

## Notes / risks
- **Write scope**: `scripts/`, `.claude/`, `.codex/` are outside the dev agent's writeScope. Run `regen-dogfood.ts` from the main session via Bash (precedent: security-hardening phase 04 resolution). Do not widen dev's writeScope for this.
- This phase mutates the live harness the agents themselves run under. If a regenerated guard/settings file breaks agent operation mid-phase, `git checkout -- .claude .codex scripts` restores instantly — commit-worthy checkpoint before running the regeneration is advisable (human commits; just flag it).
- If a live-copy diff turns out to be a real behavioral divergence whose correct side is unclear (asset vs live), that is a user decision — park per the PARK RULE rather than guessing which side wins.

## Resolution (2026-07-05)

Executed from the main session (dev writeScope excludes scripts/, .claude/, .codex/ — per Notes).

- Fixture `test/helpers/beaver-params.ts` + permanent `test/helpers/regen-dogfood.ts` (write mode + `--check` report-only mode; CRLF→LF normalization on the disk side for core.autocrlf=true checkouts).
- Report-only triage found 19 differing files + 1 orphan. User decisions (recorded in 00-overview.md):
  1. **Guard scope**: registry + `backlog/` (PARK RULE duty). The six security-hardening-era manual-sync scopes (scripts/, .claude/scripts/, .codex/scripts/, .claude/agents/, .claude/skills/) were dropped from live — regen-dogfood.ts is now the sanctioned sync path. Partially pre-resolves backlog/0014.
  2. **planner `model: inherit`** and **docs-writer unrestricted tools** (needs Bash for build-docs-index.mjs): live won; ported into the registry (AgentDef model union + docs-writer tools line removed from asset).
  3. **Prompt enrichment**: `{{productDescription}}` token added to the opening line of planner/advisor/scout .md and dev/planner/advisor/scout .toml assets; beaver-bespoke examples reverted to the generic asset text per decision.
- Ported live→asset: thin-adapter `.claude/scripts/agent-guard.mjs` (now zero-token), governance-evolved `plans/README.md` + `backlog/README.md` (NNNN ids, planless-backlog section), settings.json trailing newline.
- Cleaned from live via regeneration: LIVE VERIFICATION STATUS block, SYNC BY HAND comments (also removed the obsolete one inside the codex-permission-guard asset), stale audit-log plan-path comment, stale "PermissionRequest" comment in hooks.json (guard actually runs under PreToolUse).
- Orphan `.codex/HOOK_PAYLOAD_NOTES.md` → moved to `plans/.archive/codex-harness-port/` (only archived plans reference it).
- Verify: 3 validators pass; codex-permission-guard denies `git push`; agent-guard allows planner→plans/, denies planner→src/; settings.json valid JSON; `npx tsc --noEmit` + `npm run build` pass; `regen-dogfood.ts --check` → **0 differing, 0 missing, 0 orphaned**.
