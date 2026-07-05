# plans/

Resumable, phase-by-phase implementation plans authored by the `planner` agent and executed by the `dev` agent.

A plan is a **consumable** artifact (short-lived, kept in sync with reality), distinct from `docs/` which holds long-lived feature specs (WHAT). Plans describe **HOW and in what order** work gets done.

## Layout

```
plans/
  <slug>/
    00-overview.md      goal, scope, non-goals, + the progress tracker (see below)
    01-<phase>.md       one file per phase
    02-<phase>.md
    ...
```

- `<slug>` is kebab-case, derived from the feature/story (e.g. `nuxt-project-type`).
- Phases are numbered `NN-` so they sort in execution order.

`00-overview.md` is the single tracker for the plan — there is **no separate `index.md`**. Its **Ordered phases** table is the at-a-glance "where are we" view; each phase file's `status` frontmatter is the per-phase source of truth. The table aggregates across phases, so keep it in sync whenever a phase's status or step count changes.

## Progress tracker (the Ordered phases table)

`00-overview.md` ends with this table — it is what an executor reads first to know where to resume:

```
| # | Phase | Status | Steps | Updated |
|---|---|---|---|---|
| 01 | shared-backlog | done | 5/5 | 2026-06-20 |
| 02 | per-type-park-rule | in-progress | 2/6 | 2026-06-20 |
```

- **Status** — mirrors the phase file's frontmatter `status` (`pending | in-progress | done | blocked`).
- **Steps** — `<checked>/<total>` of the phase's `- [ ]` checklist; the quick "how far in" signal.
- **Updated** — ISO date the row last changed.

A `blocked` row should also carry the `backlog/<id>` link inline (e.g. `blocked → backlog/0003`).

## Phase file frontmatter

```
---
phase: NN
title: <short title>
status: pending        # pending | in-progress | done | blocked
depends_on: [<NN>, ...]
---
```

Body sections, in order: **Goal**, **Steps** (`- [ ]` checklist), **Verify** (runnable success criteria), **Notes / risks**.

## Resuming a plan

1. Open `00-overview.md` and read the **Ordered phases** table for overall progress.
2. Find the first phase whose `status` is not `done`; its **Steps** cell shows how far in it is.
3. Continue at its first unchecked `- [ ]` step in the phase file.
4. After each step, update the phase's **Steps** count and **Updated** date in the table. When a phase's `Verify` passes, set its frontmatter `status: done` and flip the table row to `done`.

A failure in one phase never invalidates completed phases — fix and resume from the unfinished phase.

## Blocked phases → backlog

If a phase can't proceed and the cause isn't fixable right now (missing info, needs a user decision, environment/out-of-scope), don't loop. Apply the **park rule** in `backlog/README.md`: set the phase `status: blocked`, file a `backlog/<id>` entry, link both ways (`[[backlog/<id>]]` from the phase; the entry's `source:` points back to the phase file), then move on to the next workable phase.

## Plan lifecycle and archival

When all phases are `done`, the plan becomes a completed artifact — it can either:
- **Remain in `plans/`** as historical record (git preserves it; useful for auditing how the work was actually decomposed).
- **Be archived** to `plans/.archive/<slug>/` (keep it searchable but out of the active directory).
- **Be deleted** if context is not valuable (rare; prefer archival so git history is preserved).

Choose based on project norms. The key: **plans are owned by whoever executed them** (usually `dev`) and the decision to archive/delete is theirs. Do not leave a stale plan in `plans/` — either keep it active (if next phases are coming) or archive it. The `00-overview.md` progress table is the arbiter: if all rows are `done` and no new work is queued, the plan is complete.
