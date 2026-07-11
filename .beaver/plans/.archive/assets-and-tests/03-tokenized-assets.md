---
phase: 03
title: tokenized-assets
status: done
depends_on: [02]
---

## Goal
The remaining dynamic templates in `claude-setup.ts` (params or agent-registry interpolation) become asset files with `{{token}}` placeholders plus a small `interpolate()` helper — leaving `claude-setup.ts` holding only the AGENTS registry, the bucket logic, and token-value computation.

## Steps
- [x] Capture a BEFORE baseline render (same method and params as phase 02).
- [x] Add `interpolate(content: string, tokens: Record<string, string>): string` to `src/scaffold/shared/assets.ts` — simple global `{{name}}` replacement; throw if an unreplaced `{{...}}` remains in the output (catches token typos at scaffold time instead of shipping broken files).
- [x] Extract the parameterized scripts with tokens ONLY where content is actually dynamic:
  - `harness-assets/scripts/_docs-shared.mjs` ← `docsSharedMjsTemplate(flowEnum, layerEnum)` — tokens `{{flowEnumJson}}`, `{{layerEnumJson}}` (JSON-stringified arrays).
  - `harness-assets/scripts/validate-structure.mjs` ← `validateStructureMjsTemplate(allAgents)` — token `{{writeScopesJson}}`.
  - `harness-assets/scripts/agent-guard-core.mjs` ← `agentGuardCoreMjsTemplate(allAgents)` — token `{{writeScopesJson}}`.
  - `harness-assets/scripts/docs-first-reminder.sh` ← `docsFirstReminderShTemplate(reminderTrigger)` — token `{{reminderTrigger}}`.
  - `harness-assets/.claude/scripts/agent-guard.mjs` ← `agentGuardMjsTemplate(allAgents)` — token `{{writeScopesJson}}`.
- [x] Extract the agent definitions: `harness-assets/.claude/agents/{docs-writer,planner,advisor,scout}.md` and `harness-assets/.codex/agents/{dev,docs-writer,planner,advisor,scout}.toml` — tokens `{{projectName}}`, `{{slug}}`, plus registry-derived frontmatter values (`{{model}}`, `{{tools}}`, `{{memoryFrontmatter}}`). `agentTools()` / `agentMemoryFrontmatter()` stayed in TS as token-value producers — the derivation logic was not duplicated into the assets.
- [x] Extract the remaining shared content: `harness-assets/AGENTS.md` ← `agentsMdTemplate(projectName)` (`{{projectName}}`), `harness-assets/docs/_template.md` ← `docsTemplateMdTemplate(flowEnum, layerEnum)` (`{{flowEnumJoined}}`, `{{layerEnumJoined}}`), `harness-assets/.agents/memory/_seed.md` ← `agentMemorySeedTemplate(name)` (`{{agentName}}` — one asset, interpolated per agent, including test-writer), and the docs skill `harness-assets/skills/docs/SKILL.md` ← `docsSkillTemplate(...)` (`{{projectName}}`, `{{slug}}`, `{{flowEnumSlash}}`, `{{layerEnumSlash}}`; emitted at both `.claude/skills/{{slug}}-docs/` and `.agents/skills/{{slug}}-docs/` per the existing bucket logic).
- [x] Updated `buildClaudeFileMap` to `interpolate(readAsset(...), tokens)` for each; deleted all 18 replaced template functions plus the orphaned per-call `scopesObj` construction (consolidated into one `writeScopesJson(agents)` helper used by all three guard/validator assets). `params.claudeMd`, `params.conventionsSkill`, `params.devAgent`, `params.testing.*` stayed as passed-in strings (non-goal — project-type-owned).
- [x] Confirmed `dev.md` for Claude is `params.devAgent` (caller-owned, stays TS) while `dev.toml` for Codex is shared (`harness-assets/.codex/agents/dev.toml`) — mirrored the current split exactly, did not "unify" them.
- [x] Rendered AFTER and diffed against BEFORE — byte-identical, for all three harness modes (`claude`, `codex`, `both`) and testing on/off (6 renders total).

## Verify
- BEFORE/AFTER diffs empty for renders with `harness: 'claude'`, `'codex'`, `'both'` (× testing on/off — 6 renders).
- `interpolate` throws on a deliberately-missing token (quick manual check or leave for phase 07's tests).
- `npx tsc --noEmit`, `npm run build`, `npm pack --dry-run` (all assets listed) pass.
- `claude-setup.ts` no longer contains any multi-hundred-line template literal (spot check: file should shrink from ~2100 lines to a few hundred).

## Resolution

All 8 steps completed 2026-07-05. `claude-setup.ts` shrank from 1112 lines to 331 lines — it now holds only the AGENTS registry, `agentTools`/`agentMemoryFrontmatter`/`writeScopesJson` (token-value producers), `ClaudeHarnessParams`, `claudeHarnessTableTemplate` (out of scope for this plan — still a zero-param pure function consumed by project-type templates, not part of `buildClaudeFileMap`'s FileMap), and the shared/claudeOnly/codexOnly bucket logic.

18 new tokenized assets added under `harness-assets/`: `scripts/_docs-shared.mjs`, `scripts/validate-structure.mjs`, `scripts/agent-guard-core.mjs`, `scripts/docs-first-reminder.sh`, `.claude/scripts/agent-guard.mjs`, `.claude/agents/{docs-writer,planner,advisor,scout}.md`, `.agents/memory/_seed.md`, `AGENTS.md`, `docs/_template.md`, `skills/docs/SKILL.md`, `.codex/agents/{dev,docs-writer,planner,advisor,scout}.toml`.

`interpolate()` added to `src/scaffold/shared/assets.ts`: replaces `{{tokenName}}` (token names restricted to `[a-zA-Z0-9_]+`) and throws if any such placeholder remains unreplaced. The word-only token pattern was deliberately chosen over a bare `\{\{.*?\}\}` match: `scripts/agent-guard-core.mjs`'s JSDoc contains a literal `{{ decision: 'allow' | 'deny' | 'pass', reason?: string }}` type annotation (spaces/punctuation inside the braces) that must pass through untouched — confirmed no other `{{` collisions exist elsewhere via a repo-wide grep before extraction.

Verification: BEFORE/AFTER byte-identical diff across all 6 combos (claude/codex/both × testing on/off) — passed. `interpolate()` throw-on-missing-token and JSDoc-literal-passthrough both manually verified via a throwaway tsx script. `npx tsc --noEmit`, `npm run build`, `node scripts/validate-plans.mjs`, and `npm pack --dry-run` (all 18 new assets + prior 14 listed, 35 harness-assets files total) all passed.

## Notes / risks
- Classify assets by OWNERSHIP into shared/claudeOnly/codexOnly exactly as today (see `.agents/memory/dev/MEMORY.md` bullet on harness conditionality and planner memory: `.agents/memory/` seeds are shared, test-writer is Claude-only).
- The `{{...}}` token syntax could collide with literal `{{` in script content (unlikely in .mjs/.md, but grep each extracted asset for `{{` before adding tokens; if a collision exists pick a rarer delimiter for that file class and document it in assets.ts).
- Escaped sequences inside template literals (`\``, `\${`) must land as literal characters in asset files — render-and-save, don't hand-copy.
- Rollback: phases 02–03 are pure refactors verified by byte-identical output; `git checkout` of `claude-setup.ts` + deleting `harness-assets/` additions restores any intermediate state.
