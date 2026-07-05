# {{agentName}} — Agent Memory

Short-term memory with a lifecycle — NOT an append-only log. One bullet per durable, non-obvious gotcha, newest first. Link related docs/ files. Read this file at the start of every session.

Lifecycle (see the memory-retro skill):
- **Budget**: keep ≤ 15 bullets / ≤ 100 lines (`validate-structure.mjs` warns over budget, fails at 2×).
- **Promote**: durable, architecture-level truth belongs in `docs/` — move it there, then delete the bullet.
- **Invalidate**: when a path/scope/convention changes, update or delete bullets referencing the old state in the same change.
- **Don't duplicate**: one-off fix notes already recorded in plans/ Resolutions or backlog/ don't belong here.

_(no entries yet)_
