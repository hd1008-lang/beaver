---
name: harness-target-choice
description: The Claude-vs-Codex-vs-both harness choice rides the existing `ai` enum; gate the Codex block inside buildClaudeFileMap, don't add a new cart field.
metadata:
  type: project
---

When asked to let users pick which AI harness to emit (Claude / Codex / both / none):

- The choice is NOT a new cart field. It rides the EXISTING `ai` enum: `REACT_MENU_AI` (`src/options/react-vite/constants/index.ts:118`) and `CHROME_MENU_AI` (`src/options/chrome-extension/constants/index.ts:48`). Today only `NOT_USING` + `CLAUDE`. Add `CODEX` + `BOTH`. Single-select `selectFromMenu` — matches every other beaver option; reject multi-select.
- `NOT_USING` already gates the whole harness upstream at `src/scaffold/react-vite/templates/fsd-layout.ts:31` (`cart.ai === 'CLAUDE' ? getClaudeFileMap(cart) : []`). So `none` never reaches buildClaudeFileMap.
- The regression is INTERNAL to `buildClaudeFileMap` (`src/scaffold/shared/claude-setup.ts:1871`): it emits the `.claude/` and `.codex/` blocks as ONE unconditional `files` array (lines 1885-1932). Fix = add `harness: 'claude'|'codex'|'both'` to ClaudeHarnessParams (line 94), bucket files into shared/claudeOnly/codexOnly, gate with two spreads. No per-harness builder functions — surgical.
- SHARED-FILE TRAP: `agent-guard-core.mjs`  is genuinely shared (both Claude `agent-guard.mjs` and `agent-guard-codex.mjs` import it). But `agent-guard-codex.mjs`, `codex-subagent-start/stop.mjs`, `codex-permission-guard.mjs`, `AGENTS.md`, and the `.agents/skills/` skill twins are codex-only (now correctly living under `.codex/scripts/` after backlog/0006 migration). Don't omit core or duplicate adapters.
- Harness-only flow (`HarnessOnlyCore`, `src/types/index.ts:47`) has NO `ai` field; its three skeletons call buildClaudeFileMap directly. Default them to `'both'` to preserve current behavior, or wire a new select — a scope decision for the user, not the fix.

**Why:** Phase 07 made buildClaudeFileMap emit both harnesses unconditionally; user wants it to be a choice. The cart already models the choice axis — extend it, don't duplicate it.

**How to apply:** Route implementation to `dev`, enum-display wording + AI-table docs to `docs-writer`. See [[harness-shared-seam]].
