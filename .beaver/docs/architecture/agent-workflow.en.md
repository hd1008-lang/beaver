---
title: Agent Workflow — planner / dev / backlog
feature: _app
flow: architecture
layer: _cross
status: active
lang: en
related: [features/ai-harness/ai-harness.spec.en.md]
keywords: [planner, dev, backlog, plans, park-rule, blocked, resumable, dogfood]
updated: 2026-07-11
---

# Agent Workflow — planner / dev / backlog

## Context
This repo dogfoods its own Claude Code harness. Larger work is decomposed by the `planner` agent into resumable phase files under `plans/` and executed by `dev`. A recurring failure mode: when execution hits a blocker it can't resolve right now, the agent keeps retrying — looping and burning tokens — instead of parking the work and continuing. There was no shared place to record deferred work, so context had to be re-read to recover it later.

## Root Cause / Key Finding
The missing piece was not a place to write notes (`plans/` phase files already have a "Notes / risks" section and a `blocked` status). It was a **rule for when to stop trying** plus a **central, append-only home** for deferred work that spans multiple plans. The token-saving value lives in the rule, not the folder.

## Solution / Pattern
A `backlog/` directory at the repo root (see `backlog/README.md`), one file per item (`NNN-<slug>.md`) with frontmatter (`id`, `status: open|resolved|wontfix`, `source`, `severity`, `created`) and a body of **Symptom / Tried / Why parked / Suggested direction**.

The **park rule** ties it together: if a step fails twice and the cause isn't fixable now (missing info, needs a user decision, environment, out of scope), STOP — don't retry a third time. Set the owning phase `status: blocked`, file a `backlog/<id>` entry whose **Tried** section lists what already failed, link both ways, tell the user it was parked, and move on to the next workable item.

Roles stay distinct:
- `docs/` = WHAT (long-lived specs). `plans/` = HOW/when (consumable phases). `backlog/` = deferred work / blockers (append-only, lives until `resolved`).
- A backlog item is not a plan. When revived, `planner` reads it for context and folds its **Suggested direction** into new phases under `plans/`.

The park rule is wired into `AGENTS.md` (agent routing table), `plans/README.md` (blocked phases → backlog), and the `dev` and `planner` agent definitions.

## Key Decisions
- File-based backlog over GitHub Issues — agents read/write it directly, it travels with git, and it needs no network round-trip. Trade-off: keep it the single source of truth to avoid drift with Issues.
- Append-only with a `resolved`/`wontfix` status instead of deleting files — preserves the history of what was tried.
- The "Tried" section is mandatory: it is what prevents re-running failed attempts on resume.

## Related Files
- backlog/README.md
- plans/README.md
- .claude/agents/dev.md
- .claude/agents/planner.md
- AGENTS.md
- CLAUDE.md (adapter)
