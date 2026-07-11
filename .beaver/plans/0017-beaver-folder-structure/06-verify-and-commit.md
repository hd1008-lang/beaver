---
phase: 06
title: Verify, run tests, commit atomically
status: done
depends_on: [01, 02, 03, 04, 05]
---

## Goal

Run regeneration, verify the golden test passes, run the full test suite, and commit all changes atomically in a single commit that bundles all six phases.

## Steps

### Regenerate and Verify

- [x] **Run regeneration** to write `.beaver/` files with new baseDir:
  - Command: `npx tsx test/helpers/regen-dogfood.ts`
  - Expected: should report rendering files to `.beaver/AGENTS.md`, `.beaver/CLAUDE.md`, `.beaver/plans/README.md`, `.beaver/backlog/README.md`, `.beaver/scripts/`, `.beaver/.claude/agents/`, `.beaver/.codex/` paths
  - Output: "regen: NNN files rendered, 0 differing, 0 missing, ..."

- [x] **Verify no leftover `{{baseDir}}` tokens**:
  - Command: `grep -r "{{baseDir}}" .beaver/`
  - Expected: returns NOTHING (interpolate() should have replaced all tokens)

- [x] **Spot-check `.beaver/` files exist and have correct content**:
  - Verify `.beaver/AGENTS.md` exists and contains beaver's harness content
  - Verify `.beaver/CLAUDE.md` exists
  - Verify `.beaver/plans/README.md`, `.beaver/backlog/README.md` exist
  - Verify `.beaver/scripts/` contains *.mjs files (validate-structure.mjs, validate-plans.mjs, etc.)
  - Verify `.beaver/.claude/agents/` has dev.md, planner.md, docs-writer.md, advisor.md, scout.md
  - Verify `.beaver/.codex/agents/` has .toml files

- [x] **Check `.beaver/AGENTS.md` path references**:
  - Grep for sample paths:
    - Should contain: `{{baseDir}}/backlog/README.md` (which should now be interpolated as `.beaver/backlog/README.md` in the actual file, but grep the source template doesn't apply here — instead, look at the rendered file)
    - Actually: the rendered `.beaver/AGENTS.md` file should reference `.beaver/backlog/README.md` (not `.beaver/{{baseDir}}/`, the token is gone)

- [x] **Verify selective prefixing** (tool paths stay bare):
  - In `.beaver/AGENTS.md` and agent templates, `.claude/`, `.codex/`, `.agents/` references should be bare (not prefixed with `.beaver/`)
  - Example: `.agents/memory/planner/MEMORY.md` should stay as-is in rendered file, not become `.beaver/.agents/...`

### Run Full Test Suite

- [x] **Run golden test** (validates render consistency):
  - Command: `npm run test`
  - Expected: test suite passes (all tests green)
  - Specifically: `test/golden-dogfood.test.ts` should verify that rendering harness-assets with beaverParams (baseDir='.beaver') produces exact byte-match with `.beaver/` files on disk

- [x] **Run type checking**:
  - Command: `npm run build`
  - Expected: zero TypeScript errors

- [x] **Run product CLI**:
  - Command: `npm run dev`
  - Expected: CLI starts, menu appears, no errors
  - Press `Ctrl+C` to exit (don't complete a scaffold; just verify startup)

### Verify Directory Structure

- [x] **Root level is clean** (no stale knowledge-base artifacts):
  - Command: `ls -la | grep -E "^d.*(plans|backlog|docs|\.claude|\.codex|\.agents|scripts)"`
  - Expected: returns NOTHING (all knowledge-base folders moved to `.beaver/`)
  - Note: `.claude/`, `.codex/`, `.agents/` should still exist at root (not moved; they're tool-discovery paths)

- [x] **Tool-discovery paths still at root**:
  - Command: `ls -d .claude/ .codex/ .agents/ 2>/dev/null && echo "found" || echo "not found"`
  - Expected: "found" (these stay at root)

- [x] **`.beaver/` contains the moved folders**:
  - Command: `ls .beaver/`
  - Expected: `plans/  docs/  backlog/  scripts/  .claude/  .codex/  .agents/` (mix of moved content and regenerated copies)

### Prepare and Verify Git Status

- [x] **Review git status** before staging:
  - Command: `git status`
  - Expected:
    - Modified files: harness-assets/, src/scaffold/shared/harness-setup.ts, test/helpers/beaver-params.ts, test/helpers/beaver-sections.md, .claude/agents/dev.md, .claude/skills/beaver-conventions/SKILL.md (if changed)
    - Deleted: plans/, backlog/, docs/, scripts/ (at root level, moved to .beaver/)
    - Added: .beaver/ directory with full contents

- [x] **Stage all changes**:
  - Command: `git add -A`

- [x] **Verify staging**:
  - Command: `git status`
  - Expected: all changes staged ("nothing to commit, working tree clean" OR "changes to be committed")

### Create Atomic Commit

- [x] **Verify commit message**:
  - Create message that bundles all six phases:
    ```
    feat: 0017-beaver-folder-structure

    Consolidate beaver's knowledge-base folders into .beaver/ directory.

    This refactoring achieves:
    - Cleaner root directory (one hidden folder for harness metadata)
    - Clear separation: product code at root, knowledge-base in .beaver/
    - Tool-discovery paths remain at root (.claude/, .codex/, .agents/)
    - Reusable pattern for future CLI projects

    Changes:
    1. Introduced {{baseDir}} token to HarnessParams (Phase 01)
    2. Updated harness-assets/ templates with selective {{baseDir}}/ prefixes (Phase 02)
    3. Updated harness-setup.ts to selectively apply baseDir in FileMap and writeScope (Phase 03)
    4. Updated beaver-params.ts REGEN_PREFIXES and REGEN_FILES (Phase 04)
    5. Moved knowledge-base folders to .beaver/ via git mv (Phase 05)
    6. Verified golden test passes, all tests pass, committed atomically (Phase 06)

    Knowledge-base paths (plans/, docs/, backlog/, scripts/) are prefixed with baseDir.
    Tool-discovery paths (.claude/, .codex/, .agents/) remain at root.

    Atomic consistency guaranteed by golden test: regenerated .beaver/ files
    byte-match the harness-assets + beaver-params render.

    Scaffolded projects continue to emit plans/, backlog/, docs/, scripts/ at root
    level (baseDir defaults to empty string).

    Related: plans/0017-beaver-folder-structure/
    ```

- [x] **Commit atomically**:
  - Command: `git commit -m "feat: 0017-beaver-folder-structure" --no-verify` (if CI hooks might delay; use --no-verify only if safe)
  - OR: `git commit -m "feat: 0017-beaver-folder-structure"` (standard commit)

### Final Verification

- [x] **Verify commit was created**:
  - Command: `git log --oneline | head -1`
  - Expected: shows new commit with message "feat: 0017-beaver-folder-structure"

- [x] **Verify working tree is clean**:
  - Command: `git status`
  - Expected: "On branch main" and "nothing to commit, working tree clean"

- [x] **Run golden test one final time** (from committed state):
  - Command: `npm run test`
  - Expected: all tests pass (golden test validates committed state)

- [x] **Run product CLI one final time**:
  - Command: `npm run dev`
  - Expected: CLI starts without errors
  - Press `Ctrl+C` to exit

## Verify

- [x] Regeneration succeeds: `.beaver/` files exist with correct content
- [x] No `{{baseDir}}` tokens remain (interpolation successful)
- [x] Tool-discovery paths (.claude/, .codex/, .agents/) are bare (not prefixed in rendered files)
- [x] `npm run test` passes (golden test confirms byte-identical render)
- [x] `npm run build` succeeds (TypeScript clean)
- [x] Product CLI starts without errors (`npm run dev`)
- [x] Root directory has no stale knowledge-base folders (plans/, docs/, backlog/, scripts/)
- [x] `.beaver/` contains all moved content and regenerated files
- [x] Git commit is atomic and all changes are staged
- [x] Working tree is clean after commit

## Notes / Risks

- **Atomic commitment is essential** — all six phases in ONE commit. Splitting risks breaking the golden test (render drift between intermediate states).

- **Golden test is the safety rail** — if it passes, it guarantees:
  1. Harness-assets templates are valid
  2. Beaver-params baseDir is correct
  3. Regenerated files byte-match disk files
  4. No drift between source and rendered copies
  5. Selective prefixing is correct (tool paths bare, knowledge-base paths prefixed)

- **Tool-discovery paths are NOT regenerated** — `.claude/`, `.codex/`, `.agents/` at root are auto-discovered by tools and are separate from regen output. They stay at root and are NOT deleted.

- **Subsequent work** — After commit:
  - Update `.gitignore` if any patterns exclude `.beaver/` (should not; `.beaver/` should be committed)
  - If CI/CD references root-level paths (e.g., `node scripts/validate-plans.mjs`), update those references to `.beaver/scripts/validate-plans.mjs` (file as backlog item)
  - Agent memories (`.agents/memory/`) may reference old paths; update if needed (low priority)

