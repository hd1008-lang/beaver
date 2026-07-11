---
phase: 04
title: Add backlog-filing rule to planner agent + fix skill file
status: done
depends_on: []
---

## Goal

Two harness files are updated: (a) `.claude/agents/planner.md` gains an explicit rule that non-blocking follow-ups must be filed as backlog entries — not left in plan prose; (b) the stale orphan sentence referencing `.claude/scripts/planner-guard.mjs` in the MEMORY is addressed by ensuring no live harness file (agent, skill, CLAUDE.md) contains the old name.

**Owner: dev** — planner cannot write to `.claude/agents/` or `.claude/skills/`.

## Steps

- [ ] Edit `.claude/agents/planner.md`: in the "## Hard rules" section (currently ends at line 71 with "Never commit or push — a human does that."), add a new bullet at the end of the list:
  ```
  - Non-blocking follow-up work (spec gaps, deferred tasks, adjacent improvements) must be filed as a `backlog/<NNNN>-<slug>.md` entry (see `backlog/README.md`). Do NOT leave follow-up work as prose in a plan's overview or phase files — prose in done plans is archived and lost.
  ```
- [ ] Verify no live harness file (`.claude/agents/*.md`, `.claude/skills/**`, `CLAUDE.md`) contains the string `planner-guard.mjs`. (The stale references are only in `docs/` — docs-writer's scope — and in archived plans, which are inert.)

## Verify

```bash
# 1. New rule is present in planner.md
grep -n "Non-blocking follow-up" .claude/agents/planner.md

# 2. No live harness file references the old guard name
grep -r "planner-guard" .claude/agents/ .claude/skills/ CLAUDE.md
# must return no matches

# 3. validate-structure still passes (guard against accidentally breaking agent frontmatter)
node .claude/scripts/validate-structure.mjs
```

All three checks must pass (grep in step 2 must be empty).

## Notes / risks

- The only live references to `planner-guard.mjs` in the repo (as of 2026-06-20) are in:
  - `.claude/agent-memory/planner/MEMORY.md` (historical note — leave it, it's accurate history)
  - `docs/features/claude-harness/claude-harness.spec.en.md` (docs-writer's scope — handled via `backlog/0001`)
  - `plans/agent-registry/` plan files (will be archived in Phase 02)
  No change to `.claude/agents/planner.md` is needed for the guard rename — it has no such reference. Step 2 is a verification-only step.
- Read `.claude/agents/planner.md` before editing (per conventions) to get the current "Hard rules" section text and ensure the new bullet is appended correctly without disturbing existing content.
- The new rule closes the mismatch between `backlog/README.md:3` ("anything deliberately deferred") and planner's current behavior of embedding follow-ups in plan overview prose (as seen in `plans/harness-backlog-park-rule/00-overview.md` § "Spec gap").
- Do NOT add this rule to the scaffold template for the planner agent (`src/scaffold/shared/claude-setup.ts`) in this phase — that is a separate story (the template's planner agent is for users of scaffolded projects, not for the beaver harness itself). The scope here is the beaver repo's own `.claude/agents/planner.md`.
