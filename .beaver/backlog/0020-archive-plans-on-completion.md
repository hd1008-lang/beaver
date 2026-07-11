---
id: "0020"
title: "Plan archiving is discretionary, not a checklist step — completed plans get left in plans/ root"
status: resolved
source: plan 0017-beaver-folder-structure execution
severity: low
created: 2026-07-11
---

## Symptom

Plan `0017-beaver-folder-structure` had all 6 phases marked `status: done`
(every step checked) and was fully committed (implementation + docs), but the
plan folder was never moved to `.beaver/plans/.archive/`. It sat at
`.beaver/plans/0017-beaver-folder-structure/` alongside active plans until the
user noticed and asked why it hadn't been archived.

## Root cause

`.beaver/plans/README.md` (lifecycle section, ~lines 66-75) documents
archiving as one of several valid end-states for a completed plan ("can
either remain in `plans/`, be archived, or be deleted — choose based on
project norms"), decided by "whoever executed them (usually `dev`)." There is
no explicit trigger tied to the moment the last phase flips to `done` — no
step in `dev`'s phase-completion flow, nor in the plan template's own
"Verify" phase, says "if this was the last phase, archive the plan folder."

The only forcing language is a soft one ("do not leave a stale plan... either
keep it active... or archive it") with no owner and no trigger point. This
makes it easy for the completing agent to mark phases done and move on to
the next task without the archive step ever firing.

## Why parked

Process/checklist gap, not a code bug — filing as backlog rather than fixing
inline since it requires editing either the plan template, `dev`'s agent
definition, or `.beaver/plans/README.md`'s lifecycle section, none of which
`planner` owns unilaterally.

## Suggested direction

Add an explicit "last phase done → archive" checklist item to one of:
- The plan template's final "Verify" phase (`.beaver/plans/README.md` or the
  template `dev` copies when scaffolding new plans), so every plan ends with
  an archive step baked in.
- `dev`'s phase-completion flow in `harness-assets/.claude/agents/dev.md` /
  `.codex/agents/dev.toml`: after marking the last phase `done`, `git mv` the
  plan folder into `.archive/` as part of the same completion commit (or a
  follow-up one) rather than leaving it as a separate, easy-to-forget step.

Either fix removes the "discretionary" framing and makes archiving the
default outcome instead of something that has to be remembered.

## Resolution (2026-07-11)

Fixed via `.beaver/plans/README.md`'s new **Completion handoff** convention:
every plan's final phase now carries a human-addressed handoff block (stage →
commit → `git mv plans/<slug>/ plans/.archive/<slug>/` → commit the archive
move) instead of archiving being a discretionary afterthought. See
`.beaver/plans/README.md` sections "Completion handoff" and "Plan lifecycle
and archival".
