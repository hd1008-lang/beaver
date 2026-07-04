---
phase: 02
title: scaffold-templates
status: done
depends_on: [01]
---

## Goal

Update all scaffold template files so that newly generated projects emit `.agents/memory/<agent>/MEMORY.md` instead of `.claude/agent-memory/<agent>/MEMORY.md` in every instruction string, guard template, and seed file path.

## Steps

- [x] Edit `src/scaffold/shared/claude-setup.ts`:
  - Comment on line ~19: `/** Whether to seed .agents/memory/<name>/MEMORY.md on first run. */`
  - `agentGuardMjsTemplate` (line ~463): change `const memoryPrefix = \`.claude/agent-memory/\${agentType}/\`` → `.agents/memory/\${agentType}/`. Also update the comment above that line (~432).
  - Guard deny-reason string (line ~484 area): update the message to reference `.agents/memory/<name>/` instead of `.claude/agent-memory/<name>/`.
  - Guard inline comment (line ~1607–1609): update the two old prefix constants to a single `.agents/memory/${agentType}/` check (mirrors the agent-guard-core.mjs change in phase 01).
  - Seed file relativePaths (lines ~1931–1934, ~1968): `.claude/agent-memory/dev/MEMORY.md` → `.agents/memory/dev/MEMORY.md` (and docs-writer, planner, advisor, test-writer).
  - All instruction prose referencing `.claude/agent-memory/<agent>/MEMORY.md` (grep shows ~16 occurrences in this file): replace with `.agents/memory/<agent>/MEMORY.md`. Agents to touch: docs-writer (lines ~603, 615), planner (lines ~636, 647, 690), advisor (lines ~710, 721, 731), dev in Codex TOML section (lines ~1309, 1321), docs-writer Codex section (~1345, 1357), planner Codex section (~1376, 1387, 1405), advisor Codex section (~1423, 1434, 1444).
- [x] Edit `src/scaffold/react-vite/templates/claude-setup.ts`:
  - CLAUDE.md prose mentioning `.claude/agent-memory/<agent>/MEMORY.md` (line ~210): update to `.agents/memory/<agent>/MEMORY.md`.
  - Dev agent instruction text (lines ~387, 399): update read/append paths.
  - Test-writer instruction text (lines ~426, 436): update read/append paths.
- [x] Edit `src/scaffold/chrome-extension/templates/claude-setup.ts`:
  - CLAUDE.md prose (line ~153): update to `.agents/memory/<agent>/MEMORY.md`.
  - Dev agent instruction text (lines ~282, 294): update read/append paths.
- [x] Edit `src/scaffold/harness-only/templates/generic-skeleton.ts`:
  - CLAUDE.md prose (line ~33): update to `.agents/memory/<agent>/MEMORY.md`.
  - Dev onboarding (line ~58): update.
- [x] Edit `src/scaffold/harness-only/templates/react-vite-skeleton.ts`:
  - CLAUDE.md prose (line ~40): update.
  - Dev onboarding (line ~77): update.
- [x] Edit `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts`:
  - CLAUDE.md prose (line ~40): update.
  - Dev onboarding (line ~77): update.
- [x] Run `npx tsc --noEmit` — must pass with zero errors.
- [x] Run `npm run build` — must succeed.

## Verify

```bash
# 1. No remaining references to the old path inside scaffold source
grep -r "\.claude/agent-memory" src/scaffold/
# expect: zero matches

# 2. New path present in shared template
grep "\.agents/memory" src/scaffold/shared/claude-setup.ts | head -5

# 3. TypeScript clean
npx tsc --noEmit

# 4. Build clean
npm run build
```

## Notes / risks

- **Line numbers are approximate** — the file was read at commit HEAD; they may shift by a few lines if phase 01 touched adjacent files. Always grep for the string rather than jumping to a hard-coded line number.
- **Replace-all vs targeted** — use a targeted replace for each occurrence rather than a global sed, because the phrase `.claude/agent-memory/` also appears in comments and `AgentDef` JSDoc. The JSDoc comment (`/** Whether to seed … */`) should be updated too for accuracy, but the `AgentDef.memory` boolean field name and type stay unchanged.
- **`agentGuardMjsTemplate` in `shared/claude-setup.ts`** generates the standalone guard for scaffolded Claude-only projects. It currently hardcodes the Claude prefix only (no Codex dual-prefix). After this change it should hardcode `.agents/memory/` — the single neutral path. The dual-prefix pattern in `agent-guard-core.mjs` (dogfood) becomes single-prefix in the generated output.
- **`buildClaudeFileMap` seed paths** (lines ~1931–1934) emit real files. These must change so the seed MEMORY.md lands at `.agents/memory/` in the scaffolded project, not `.claude/agent-memory/`.
