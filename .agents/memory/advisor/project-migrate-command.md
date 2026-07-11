---
name: project-migrate-command
description: Trade-offs of a beaver migrate/update command to upgrade already-scaffolded projects to the new folder structure
metadata:
  type: project
---

Question raised 2026-07-11: should beaver ship a command to auto-upgrade old scaffolded projects to the new folder structure? Advice: NO general auto-migrator.

Key facts grounding the answer:
- Scaffolded projects carry NO beaver-version/manifest stamp (grep src/ for manifest/version → only chrome web-extension manifest.json, not a scaffold marker). Without a recorded "from" version+options, an auto-migrator can't know the source state — must diff/guess. Decisive against auto-migration.
- Two folder structures get conflated: (a) user app code src/ (FSD/BPR) = user-owned, non-pristine, never touch; (b) harness/knowledge-base files = beaver-authored, regenerable.
- The `.beaver/` baseDir move only affects beaver's OWN dogfood (`baseDir='.beaver'`). Scaffolded projects use `baseDir=''` → still emit at root. So the big recent "folder move" does NOT create a migration need for user projects.
- Harness re-emit is already ~90% served by `beaver --ai` / harness-only (overwrites harness files, no cleanup on error). Gap: it emits skeleton harness, not full react-vite harness; no diff/backup.
- Naming: `beaver update` is TAKEN — cli-update.spec = npm self-update of the CLI. A project migrator must not reuse that name.

**Why:** minimum-change + don't overwrite non-pristine user code. **How to apply:** if revisited, scope to a read-only diff report for harness files only (dev, needs docs-writer spec first); route structural moves to a migration-guide doc, not code.
