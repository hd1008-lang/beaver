---
phase: 01
title: dogfood-migrate
status: done
depends_on: []
---

## Goal

Move all existing memory files from `.claude/agent-memory/` to `.agents/memory/`, update every agent definition file and the guard core in the dogfood repo so that both harnesses read/write the new path and the repo is internally consistent.

## Steps

- [x] Create destination directories and move memory files:
  - `.agents/memory/dev/MEMORY.md` ← `.claude/agent-memory/dev/MEMORY.md`
  - `.agents/memory/docs-writer/MEMORY.md` ← `.claude/agent-memory/docs-writer/MEMORY.md`
  - `.agents/memory/planner/MEMORY.md` ← `.claude/agent-memory/planner/MEMORY.md`
  - `.agents/memory/advisor/MEMORY.md` ← `.claude/agent-memory/advisor/MEMORY.md`
  - `.agents/memory/advisor/product-description-prompt.md` ← `.claude/agent-memory/advisor/product-description-prompt.md`
  - `.agents/memory/advisor/harness-only-claude-md-gaps.md` ← `.claude/agent-memory/advisor/harness-only-claude-md-gaps.md`
  - `.agents/memory/advisor/harness-shared-seam.md` ← `.claude/agent-memory/advisor/harness-shared-seam.md`
  - `.agents/memory/advisor/harness-target-choice.md` ← `.claude/agent-memory/advisor/harness-target-choice.md`
  - `.agents/memory/advisor/dogfood-script-layout.md` ← `.claude/agent-memory/advisor/dogfood-script-layout.md`
  - `.agents/memory/docs-writer/productdescription_field.md` ← `.claude/agent-memory/docs-writer/productdescription_field.md`
- [x] Delete the old `.claude/agent-memory/` tree (all 10 files + their directories).
- [x] Update `scripts/agent-guard-core.mjs` lines 61–64: replace the two memory prefix constants with a single `.agents/memory/${agentType}/` prefix and update the allow check and the deny reason string accordingly.
- [x] Update `.claude/agents/dev.md` step 1 in Onboarding protocol: `.claude/agent-memory/dev/MEMORY.md` → `.agents/memory/dev/MEMORY.md`; update step 4 (append line) to match.
- [x] Update `.claude/agents/docs-writer.md` step 1 in Onboarding protocol and any append lines: `.claude/agent-memory/docs-writer/MEMORY.md` → `.agents/memory/docs-writer/MEMORY.md`.
- [x] Update `.claude/agents/planner.md`: all references to `.claude/agent-memory/planner/MEMORY.md` → `.agents/memory/planner/MEMORY.md`; also update the Hard rules write-scope note.
- [x] Update `.claude/agents/advisor.md`: all references to `.claude/agent-memory/advisor/MEMORY.md` → `.agents/memory/advisor/MEMORY.md`; also update the Hard rules note.
- [x] Update `.codex/agents/dev.toml` developer_instructions: same path changes as the `.claude` MD counterpart.
- [x] Update `.codex/agents/docs-writer.toml`, `.codex/agents/planner.toml`, `.codex/agents/advisor.toml`: same substitution pattern.

## Verify

```bash
# 1. New files exist
ls .agents/memory/dev/MEMORY.md
ls .agents/memory/docs-writer/MEMORY.md
ls .agents/memory/planner/MEMORY.md
ls .agents/memory/advisor/MEMORY.md

# 2. Old directory is gone
ls .claude/agent-memory 2>&1 | grep -c "No such file"   # expect: 1

# 3. No remaining references to old path in live agent files or guard
grep -r "\.claude/agent-memory" scripts/ .claude/agents/ .codex/agents/
# expect: zero matches

# 4. Guard core has the neutral prefix
grep "agents/memory" scripts/agent-guard-core.mjs
# expect: at least one line with .agents/memory/

# 5. Build still passes
npm run build
```

## Notes / risks

- **Planner guard scope**: the planner agent's own hard-rules text says `(and your own .claude/agent-memory/planner/)`. Update that sentence to `.agents/memory/planner/` — it is read by the agent as instruction, not enforced by code, but stale text causes confusion.
- **Guard core deny-reason string** (line 84 in current file): also mentions `.claude/agent-memory/`. Update the message to show the new canonical prefix.
- **`.codex/scripts/agent-guard-codex.mjs`** imports from `../scripts/agent-guard-core.mjs` (which now lives under `scripts/`). The import path is already correct; no change needed to the Codex adapter.
- **`.claude/scripts/agent-guard.mjs`** similarly imports from `../../scripts/agent-guard-core.mjs`. No change needed.
- Do NOT create `.codex/agent-memory/` — that directory must not exist after this phase.
- The `MEMORY.md` planner index (`.agents/memory/planner/MEMORY.md`) references old `.claude/agent-memory/` paths in its own bullet list (the SYSTEM PROMPT context injected above). Those are durable planning lessons inside the memory file itself; do not do a blanket find-replace inside memory content — only the paths agents are *instructed to read/write* need updating. The file content will self-correct over time.
