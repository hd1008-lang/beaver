---
phase: 05
title: Sync the beaver repo's own .claude/ to match the new template output
status: done
depends_on: [02, 03, 04]
---

## Goal

Bring the beaver repo's own `.claude/` directory into alignment with the new registry-driven output: rename `planner-guard.mjs` → `agent-guard.mjs`, update `settings.json` to reference the new guard, add `validate-structure.mjs`, and verify that the emitted agent `.md` frontmatter in `.claude/agents/` matches what the registry would generate.

## Steps

- [x] Copy the emitted `agent-guard.mjs` content (rendered from `agentGuardMjsTemplate(AGENTS)`) into `.claude/scripts/agent-guard.mjs`. Do this by running the render script from the Verify section of phase 03 and copying the output.
- [x] Delete `.claude/scripts/planner-guard.mjs` from the beaver repo.
- [x] Update `.claude/settings.json` in the beaver repo: change the PreToolUse hook command from `planner-guard.mjs` to `agent-guard.mjs`. All other settings remain unchanged.
- [x] Copy the emitted `validate-structure.mjs` content into `.claude/scripts/validate-structure.mjs` (rendered from `validateStructureMjsTemplate(AGENTS)`).
- [x] Run `node .claude/scripts/validate-structure.mjs` against the beaver repo's `.claude/agents/`. All five agent `.md` files must pass. If any agent `.md` frontmatter is out of sync with what the registry would generate (e.g. a stale `tools:` line), update the relevant `.claude/agents/*.md` file to match — these are the dogfood copies and should be authoritative.
- [x] Run `npm run build` one final time to confirm the full build still passes after all dogfood changes.

## Verify

```bash
# 1. Confirm old guard is gone:
ls .claude/scripts/planner-guard.mjs   # must fail (file not found)

# 2. Confirm new guard exists and is syntactically valid JS:
node --check .claude/scripts/agent-guard.mjs

# 3. Confirm settings.json references the new guard:
grep 'agent-guard.mjs' .claude/settings.json

# 4. Confirm validator exists and passes against the beaver repo:
node .claude/scripts/validate-structure.mjs

# 5. Final build:
npm run build
```

All five checks must pass. Exit codes: 0 for node --check, grep, validate-structure, and npm run build. The `ls` on the old file must return non-zero (file not found).

## Notes / Risks

- The beaver repo's own `.claude/agents/*.md` files were authored before the registry existed. Their `tools:` lines must match what the registry would now derive. Check each:
  - `advisor.md`: `tools: Read, Grep, Glob, Bash, WebFetch, WebSearch, Skill, TodoWrite` — no Write/Edit, should pass.
  - `scout.md`: `tools: Read, Grep, Glob, Skill` — no Write/Edit, should pass.
  - `planner.md`: `tools: Read, Grep, Glob, Write, Edit, Skill, TodoWrite` — has Write/Edit, should pass (non-empty writeScope).
  - `dev.md`: check its actual tools line before assuming it passes.
  - `docs-writer.md`: check its actual tools line.
  - If any file fails, update it to match the registry output — this is the dogfood sync, not a bug in the validator.
- Deleting `planner-guard.mjs` in this phase means the guard is broken in the beaver repo between phase 03 (template change) and phase 05 (dogfood sync) unless both are done in the same work session. If the executor pauses between phases, the beaver repo's guard will reference a missing file. The risk is low (the guard is a PreToolUse hook, not load-bearing for `npm run build`), but note it.
- The `validate-structure.mjs` added to `.claude/scripts/` is a copy of the emitted template content rendered with the beaver repo's own agent definitions baked in. This is NOT the same as running the TypeScript source — it's running the rendered output. Make sure the render step uses `AGENTS` from the compiled `dist/` output, not a stale cached version.
- After this phase completes, the beaver repo dogfoods the exact same agent-guard and validator that every scaffolded project will receive. Future agent additions need to update `AGENTS` in `src/scaffold/shared/claude-setup.ts` AND re-run this phase's sync steps.
