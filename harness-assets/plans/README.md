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

## 00-overview.md frontmatter

```
---
plan: <NNNN>
title: <short title>
status: pending        # pending | in-progress | done
created: YYYY-MM-DD
commit_boundary: per-phase   # per-phase | "atomic: <reason>"
---
```

- **`commit_boundary`** — authored once by `planner`, never repeated per phase:
  - `per-phase` (default) — a human commits after each phase's Verify passes.
  - `atomic: <reason>` — all phases must land in one commit (e.g. a golden/snapshot test validates full render consistency and intermediate states would drift). State the reason inline so a human resuming later knows why phases can't be committed piecemeal.

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

## Agents mark, humans commit

Every agent that touches `plans/` (`planner`, `dev`) carries a hard rule: never commit or push — a human does that. This means a phase's **Steps** checklist must never contain `git add`, `git commit`, `git mv`, "stage changes", "verify commit was created", or "verify working tree is clean" as checkable `- [ ]` items. An agent checking off `[x]` next to a git action it didn't (and can't) perform misrepresents who did the work — even if a human ran the commit moments later out-of-band.

A phase's Steps end at implementation + **Verify**. `status: done` with a green **Verify** section IS the "ready to commit" signal — nothing further needs to be recorded in the checklist. Where the plan does need to describe the eventual commit(s) (message text, atomic-vs-per-phase boundary), that belongs in prose — the `commit_boundary` frontmatter field and the **Completion handoff** block below — never as an agent-checkable step.

## Resuming a plan

1. Open `00-overview.md` and read the **Ordered phases** table for overall progress.
2. Find the first phase whose `status` is not `done`; its **Steps** cell shows how far in it is.
3. Continue at its first unchecked `- [ ]` step in the phase file.
4. After each step, update the phase's **Steps** count and **Updated** date in the table. When a phase's `Verify` passes, set its frontmatter `status: done` and flip the table row to `done`.

A failure in one phase never invalidates completed phases — fix and resume from the unfinished phase.

## Blocked phases → backlog

If a phase can't proceed and the cause isn't fixable right now (missing info, needs a user decision, environment/out-of-scope), don't loop. Apply the **park rule** in `backlog/README.md`: set the phase `status: blocked`, file a `backlog/<id>` entry, link both ways (`[[backlog/<id>]]` from the phase; the entry's `source:` points back to the phase file), then move on to the next workable phase.

## Completion handoff

Every plan's final phase file ends with a **Completion handoff** section, addressed directly to the human — not agent-checkable items, since committing and archiving are human actions. It fires once, when the last phase in the **Ordered phases** table reaches `status: done`:

```
## Completion handoff

All phases done — this plan is ready to close. To finish:
1. Stage the changes (respecting `commit_boundary` in 00-overview.md: one commit
   per phase, or a single atomic commit if declared `atomic: <reason>`).
   Suggested commit message(s): <text, if useful>
2. Commit.
3. Archive the plan: `git mv plans/<slug>/ plans/.archive/<slug>/`
4. Commit the archive move, e.g. `chore: archive plan <slug>`.
```

`planner` authors this block (it can pre-fill suggested commit message text); `dev` fills in real content as phases complete but never executes the git commands itself.

## Plan lifecycle and archival

Archiving is the **default outcome**, not one option among equals. When all phases are `done` and the Completion handoff (above) has been carried out by a human, the plan folder is `git mv`'d to `plans/.archive/<slug>/` — this keeps it searchable via git history while keeping the active `plans/` directory limited to work still in flight.

Deleting a plan outright (skipping the archive) is rare — only when the plan's context is not worth preserving — and is a deliberate exception, not a default.

Do not leave a stale plan in `plans/` root: either its next phase is actively queued, or it has been archived. The `00-overview.md` progress table is the arbiter — if all rows are `done` and no new work is queued, the Completion handoff should already have fired and the folder should already be under `plans/.archive/`.

Closing a plan also closes its memory: run a **memory retro** (see the memory-retro skill) on the executing agents' `.agents/memory/<agent>/MEMORY.md` — delete bullets that only mattered during execution (they're recorded in the phases' Resolution sections), promote durable facts to `docs/`, and confirm `node scripts/validate-structure.mjs` stays within the memory budget.
