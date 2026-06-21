---
phase: 02
title: Archive the two fully-done plans
status: done
depends_on: [01]
---

## Goal

Both `plans/harness-backlog-park-rule/` and `plans/agent-registry/` (all phases `done`, no pending work queued) are moved to `plans/.archive/` so `plans/` only contains active or future plans, per `plans/README.md:73`.

**Owner: dev** — planner cannot move directories; it can only write files under `plans/`.

## Steps

- [ ] Create `plans/.archive/` directory if it does not already exist (a `.gitkeep` or the moved dirs suffice — do not create it as an empty dir under git; just move the plan dirs and git will track the new paths).
- [ ] Move `plans/harness-backlog-park-rule/` → `plans/.archive/harness-backlog-park-rule/` (use `git mv` to preserve history).
- [ ] Move `plans/agent-registry/` → `plans/.archive/agent-registry/` (use `git mv`; this dir is untracked — git status `??` — so a plain `mv` is fine; the new path will be a new untracked dir).
- [ ] Verify `plans/` now contains only `README.md`, `governance-cleanup/`, and `.archive/` (no residual plan dirs).

## Verify

```bash
# 1. Old paths are gone
ls plans/harness-backlog-park-rule/   # must fail
ls plans/agent-registry/              # must fail

# 2. New paths exist and are complete
ls plans/.archive/harness-backlog-park-rule/
ls plans/.archive/agent-registry/

# 3. plans/ root only has expected entries
ls plans/
# expected: README.md  governance-cleanup/  .archive/

# 4. Build still passes (no source imports these paths)
npm run build
```

## Notes / risks

- `plans/agent-registry/` has git status `??` (untracked — was never committed). A plain `mv` works; `git mv` is not needed and will error on an untracked path. After the move, `plans/.archive/agent-registry/` will also be untracked. That is acceptable — the next commit will track it at its new location.
- `plans/harness-backlog-park-rule/` is staged/modified (`A` or `M` status in git). Use `git mv plans/harness-backlog-park-rule plans/.archive/harness-backlog-park-rule` to move it cleanly; git will record this as a rename.
- Do NOT delete the plan files — archival preserves history. If the user wants to delete, that is a separate decision.
- `npm run build` should be unaffected (plans/ is not imported by src/). The verify step is a sanity check, not a functional gate.
- After this phase, any agent that tries to resume a phase from the old path will get a "file not found". The phase files in `.archive/` are read-only historical record — no one should be resuming them.
