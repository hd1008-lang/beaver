# backlog/

Unfinished work: blockers that can't be solved right now, technical debt, or anything **deliberately deferred** so it doesn't derail the current flow.

How it differs from `docs/` and `plans/`:

| | `docs/` | `plans/` | `backlog/` |
|---|---|---|---|
| Nature | WHAT — long-lived spec | HOW/when — phases to run | deferred work / blockers / tech debt |
| Lifecycle | long-lived | consumable, deleted when done | append-only log, lives until `resolved` |
| Author | docs-writer | planner | any agent that hits a blocker (usually `dev`) |

A backlog item is **not** a plan. When an item is revived, `planner` reads it and produces new phases under `plans/` — backlog holds context, not the executable plan.

## Park rule (this is what stops the token-wasting loop)

Applies while executing a step/phase and hitting a problem:

> If a step **fails twice** and the cause is **not fixable right now** — missing info, needs a user decision, environment error, or out of scope — then **STOP, do not retry a third time**:
> 1. **If there is an owning phase:** Set the phase `status: blocked` (see `plans/README.md`).
> 2. File a new entry in `backlog/` (template below); its **Tried** section must list what already failed so it isn't repeated.
> 3. **Link both ways:** the phase file (if any) points to `backlog/<id>`, the entry points back via `source:`. For planless work, set `source: conversation` and skip the phase linking step.
> 4. Move on to the next workable phase/task. Tell the user it was parked — don't silently skip it.

**Planless backlog (conversation-driven work):** If you hit a blocker while working on an unplanned task (dev work during a conversation, not part of an active phase), just file a backlog entry with `source: conversation` and no phase to link. This is valid and expected — not every piece of work comes from a plan.

If the error is fixable on the spot, just fix it — this rule is only for real blockers.

## Layout

One item = one file: `backlog/<NNNN>-<slug>.md` (`NNNN` ascending, zero-padded to 4 digits, so items sort and are easy to reference, e.g. "backlog/0004").

## Frontmatter

```
---
id: NNNN
title: <short title>
status: open          # open | resolved | wontfix
source: plans/<slug>/NN-<phase>.md   # or "conversation", or the originating file path
severity: low         # low | medium | high
created: YYYY-MM-DD
---
```

Body, in order:

- **Symptom** — what happened and where (real file paths).
- **Tried** — what was run/changed and how it failed. The most important section: prevents repeating failed attempts.
- **Why parked** — why it can't be solved now (missing info / needs user / environment / out of scope).
- **Suggested direction** — the next step if any, or the question the user needs to answer.

Link to other phases/specs/items with `[[path]]`.

## Lifecycle

- When solved: set `status: resolved` and add a one-line conclusion at the end of the body — **don't delete the file** (keep the history). To drop it entirely, set `status: wontfix` with a reason.
- When revived: hand the context to `planner` to create new phases under `plans/`; the entry stays `open` until the work is actually done.
