---
phase: 03
title: spec-handoff
status: done
depends_on: [01, 02]
---

## Goal

File the docs-writer backlog entry for the spec update, run validate-plans to confirm plan/backlog consistency, and archive this plan — leaving no dangling prose.

## Steps

- [x] Create `backlog/0007-memory-neutral-path-spec-update.md` with the content specified in `plans/memory-neutral-path/00-overview.md` (the "Spec gap — handoff to docs-writer" section). Use next available ID 0007.
- [x] Run `node scripts/validate-plans.mjs` and confirm zero errors.
- [x] Move `plans/memory-neutral-path/` to `plans/.archive/memory-neutral-path/`.

## Verify

```bash
# 1. Backlog entry exists and is well-formed
cat backlog/0007-memory-neutral-path-spec-update.md

# 2. validate-plans reports clean
node scripts/validate-plans.mjs

# 3. Plan is archived (no live plan directory remains)
ls plans/memory-neutral-path 2>&1 | grep -c "No such file"   # expect: 1
ls plans/.archive/memory-neutral-path/00-overview.md          # expect: file found
```

## Notes / risks

- `backlog/` writes belong to dev scope — the guard allows dev to write there. This is a dev execution step.
- The spec update itself is NOT done here — docs-writer picks up backlog/0007 in a separate session. Do not block archival on the spec being updated.
- After archiving, this plan's files are still in git history. The backlog entry is the live pointer for docs-writer.
