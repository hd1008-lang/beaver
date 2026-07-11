---
name: dogfood-script-layout
description: Harness scripts have a 3-way ownership split (scripts/ shared, .codex/scripts/ codex, .claude/scripts/agent-guard.mjs claude); .agents/ is for skill twins only, never scripts.
metadata:
  type: project
---

The Claude/Codex harness scripts follow a 3-way OWNERSHIP split (classify by ownership, not path prefix):

- **Shared → top-level `scripts/`** (harness-neutral, no `.claude/` prefix): `_docs-shared.mjs`, `build-docs-index.mjs`, `lint-docs-frontmatter.mjs`, `validate-structure.mjs`, `validate-plans.mjs`, `docs-first-reminder.sh`, `agent-guard-core.mjs`. Emitted by `src/scaffold/shared/harness-setup.ts`.
- **Claude adapter only → `.claude/scripts/agent-guard.mjs`** — the ONLY file that stays under `.claude/scripts/` (line 1925). Imports core via `../../scripts/agent-guard-core.mjs`.
- **Codex → `.codex/scripts/`**: `agent-guard-codex.mjs`, `codex-subagent-start/stop.mjs`, `codex-permission-guard.mjs` (lines 1954-1957). `hooks.json` references them via `git rev-parse --show-toplevel`.

**`.agents/` is NOT a scripts directory** — it holds Codex SKILL twins only (`.agents/skills/<slug>-{conventions,docs}/SKILL.md`, real files not symlinks). Spec `docs/features/ai-harness/ai-harness.spec.en.md:131-138`. Do not propose moving scripts into `.agents/`.

**Dogfood migrated (2026-06-22):** backlog/0006 resolved. Beaver's own committed files now match the scaffold output. `.claude/scripts/` contains ONLY `agent-guard.mjs`. Spec output tables updated to match.

**Why:** spec separated harness-neutral tooling from harness-specific adapters so generated projects don't tie shared validators to `.claude/`. The dogfood must match what it emits.

**How to apply:** when asked where harness scripts belong, recommend the 3-way split above, not `.agents/`. The migration is mechanical (git mv + fix 2 import paths in the guard adapters + update settings.json/hooks.json/CLAUDE.md/spec). Owner: `dev` for config/src moves, `docs-writer` for spec tables. See [[harness-shared-seam]], [[harness-target-choice]].
