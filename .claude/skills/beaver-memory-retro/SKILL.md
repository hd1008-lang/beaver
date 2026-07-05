---
name: beaver-memory-retro
description: Memory hygiene retro for beaver agent memory (.agents/memory/<agent>/MEMORY.md). Use when validate-structure.mjs warns a memory file is over budget, when archiving a completed plan, or when asked to "clean up memory" / "memory retro" / "dọn memory". Dedupes, deletes stale bullets, and promotes durable facts to docs/.
---

# Memory Retro

Agent memory (`.agents/memory/<agent>/MEMORY.md`) is SHORT-TERM: recent gotchas, temporary state, and facts not yet stable enough for `docs/`. Budget: **≤ 15 bullets / ≤ 100 lines** per file — `node scripts/validate-structure.mjs` warns over budget and fails at 2× budget.

## Procedure

Go through the target file bullet by bullet; pick exactly one fate per bullet:

1. **Delete — stale**: it references a path, scope, or convention that has since changed. Verify against current code/docs before deleting if unsure.
2. **Delete — recorded elsewhere**: it's a one-off fix note already captured in a plan's Resolution section or a `backlog/` entry. Memory must not duplicate plans/backlog.
3. **Promote**: it's durable, architecture-level truth (formats, protocols, design rules, invariants). Move it into the relevant `docs/` spec (route to the docs-writer agent), run `node scripts/build-docs-index.mjs`, then delete the bullet from memory.
4. **Keep**: a recent, non-obvious, still-true gotcha that saves future sessions real time. Rewrite for brevity if wordy.
5. **Merge**: overlapping bullets become one.

Finish by re-running `node scripts/validate-structure.mjs` — the file must be back within budget.

## Invalidation rule (applies outside retros too)

Any change that renames a path, scope, or convention MUST grep `.agents/memory/*/MEMORY.md` for the old state and update/delete matching bullets in the same change — stale memory is worse than no memory.
