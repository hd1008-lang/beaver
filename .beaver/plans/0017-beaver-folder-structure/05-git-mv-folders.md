---
phase: 05
title: git mv the four knowledge-base folders
status: done
depends_on: [04]
---

## Goal

Atomically move the four knowledge-base folders from root to `.beaver/` using `git mv` (preserving history) instead of destructive rm. Create the `.beaver/` parent directory.

## Context

Phases 01-04 set up the token infrastructure. Now we physically move the content. Using `git mv` instead of `rm` preserves git history and is safer — no data loss risk.

## Steps

- [x] **Create `.beaver/` directory** (if it doesn't exist):
  - Command: `mkdir -p .beaver` (or git will create it implicitly on first mv)

- [x] **Move `plans/` to `.beaver/plans/`**:
  - Command: `git mv plans/ .beaver/plans/`
  - Expected: git stages the move (detects files as deleted from root, added to `.beaver/`)

- [x] **Move `docs/` to `.beaver/docs/`**:
  - Command: `git mv docs/ .beaver/docs/`

- [x] **Move `backlog/` to `.beaver/backlog/`**:
  - Command: `git mv backlog/ .beaver/backlog/`

- [x] **Move `scripts/` to `.beaver/scripts/`**:
  - Command: `git mv scripts/ .beaver/scripts/`

- [x] **Verify no orphan directories at root**:
  - Command: `ls -la | grep -E "^d.*(plans|backlog|docs|scripts)"`
  - Should return NOTHING (all four folders moved)
  - Command: `ls .beaver/` should show: `plans/ docs/ backlog/ scripts/` (and later, .claude/ and .codex/ when those are moved by regeneration)

- [x] **Verify git status**:
  - Command: `git status`
  - Expected: shows deletions at root (plans/, backlog/, docs/, scripts/) and additions in `.beaver/`
  - Should list files as "renamed" (git mv shows as rename)

## Verify

- [x] Root directory has no `plans/`, `docs/`, `backlog/`, `scripts/` directories
- [x] `.beaver/` contains: `plans/`, `docs/`, `backlog/`, `scripts/` with all original content
- [x] `git status` shows renames (git mv) for all four folders
- [x] No files lost (count of files in each folder matches before/after)
- [x] `git mv` completed successfully (no errors or warnings)

## Notes / Risks

- **git mv preserves history** — better than rm + manual move. Helps with git blame, git log
- **Staged, not committed** — Phase 06 commits all changes together atomically
- **No tool-discovery moves yet** — `.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md` stay at root (tools auto-discover them). Regeneration in Phase 04 may write new files to `.beaver/.claude/`, `.beaver/.codex/` alongside the root copies (they're separate, not moved).
- **Check file count** — before/after should match exactly to ensure no silent data loss

