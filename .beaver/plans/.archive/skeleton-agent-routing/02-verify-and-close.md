---
phase: 02
title: verify-and-close
status: done
depends_on: [01]
---

## Goal

Manually verify a generated harness-only CLAUDE.md contains the Agent Routing table, correct the stale MEMORY.md note, and archive the plan.

## Steps

- [ ] Run `npm run dev` and select "Apply AI Harness" → any project type → complete flow into a temp directory (e.g., `/tmp/test-harness`). Inspect the generated `CLAUDE.md` to confirm it contains:
  - `## Agent Routing` heading
  - The four shared rows (advisor, scout, planner, docs-writer)
  - A dev row
  - The PARK RULE paragraph

- [ ] Confirm `validate-plans.mjs` passes: `node .claude/scripts/validate-plans.mjs` — zero errors.

- [ ] Update `.claude/agent-memory/planner/MEMORY.md`: remove or correct the note that reads "Harness-only skeleton CLAUDE.md stubs are intentionally minimal — they tell users to run `claude /init`. Never add full agent-routing tables or park-rule lines to `src/scaffold/harness-only/templates/*-skeleton.ts` CLAUDE.md templates." Replace it with an accurate note: "**Harness-only skeleton CLAUDE.md stubs must include Agent Routing table + PARK RULE** — `claudeHarnessTableTemplate()` is called in all three `*-skeleton.ts` `claudeMdTemplate` functions, same as full scaffold. The stubs are minimal only for conventions/stack details, not for the agent workflow sections mandated by `docs/features/claude-harness/claude-harness.spec.en.md`."

- [ ] Set this phase `status: done` in frontmatter and update both rows in `plans/skeleton-agent-routing/00-overview.md` to `done`.

- [ ] Move `plans/skeleton-agent-routing/` to `plans/.archive/skeleton-agent-routing/`.

## Verify

- Generated CLAUDE.md (any skeleton type) contains `## Agent Routing` with the four shared rows plus dev row and PARK RULE.
- `node .claude/scripts/validate-plans.mjs` exits 0 (or with only pre-existing warnings unrelated to this plan).
- Planner MEMORY.md no longer contains the incorrect "Never add agent-routing tables" note.
- `plans/skeleton-agent-routing/` exists only under `plans/.archive/`.

## Notes / risks

- The `npm run dev` manual test requires an interactive terminal — if running in a non-interactive context, dev can instead call the template function directly in a small test script or unit test to inspect its string output.
- The temp directory used for manual test (`/tmp/test-harness`) can be deleted after verification.
- Updating `.claude/agent-memory/planner/MEMORY.md` is within planner's write scope and is the right agent for this step. Dev should NOT edit planner memory — if executing via dev, include this step explicitly as a task for planner or human.
