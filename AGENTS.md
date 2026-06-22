# AGENTS.md

> This file is the Codex entry point for the beaver repository.
> All project context, behavioral guidelines, architecture details, and agent routing
> live in **CLAUDE.md** (repo root). Read that file first and in full.

<!-- CLAUDE.md is the canonical source of truth. Keep the routing table and PARK RULE
     below in sync with CLAUDE.md whenever that file is edited. -->

## Agent Routing

The following agents are available. Route tasks to the correct agent — do not do another
agent's job.

| Task / trigger | Agent | Notes |
|---|---|---|
| Brainstorming / trade-off analysis / "what's the best approach?" before any change | `advisor` | read-only; deepest source mental model; recommends, never edits — hands off to dev/planner/docs-writer |
| Decomposing a story into a resumable, multi-phase implementation plan | `planner` | owns `plans/`; writes phase files only, never code (see `plans/README.md`) |
| Feature work or bug fix in `src/` (menus, cart, templates) | `dev` | MUST read the relevant `docs/features/` spec before coding |
| Analyzing requirements, writing/updating feature docs | `docs-writer` | owns `docs/`; rebuilds INDEX.md after every change |
| Fast read-only lookups, file/symbol searches, factual Q&A | `scout` | never edits; cites path:line |

## PARK RULE (anti-loop)

When executing a step or phase, if it fails **twice** and the cause is not fixable right now
(missing info, needs a user decision, environment issue, or out-of-scope), **STOP** — do not
retry a third time.

- Set the phase `status: blocked`
- File a `backlog/<id>` entry (record what was already tried so it is not repeated)
- Link both ways (phase → backlog, backlog → phase)
- Tell the user it was parked
- Move on to the next workable item

See `backlog/README.md` for the entry format.

## Subagent Definitions

Subagent TOML files live under `.codex/agents/`. Each file declares the agent's name,
description, and developer instructions. These mirror the Claude agent definitions under
`.claude/agents/`.

## For full context

Read **CLAUDE.md** — it contains the complete behavioral guidelines, architecture overview,
cart pattern, scaffold system, pinned library versions, and agent-routing notes.
