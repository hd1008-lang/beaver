---
id: "0015"
title: "Agent memory lifecycle: capture → distill → promote to docs → prune (currently append-only, unbounded, goes stale)"
status: resolved
source: advisor-consultation-2026-07-04
severity: medium
created: 2026-07-04
---

## Symptom

Agent memory (`.agents/memory/<agent>/MEMORY.md`) is append-only bullets, read in full at every session start, with no pruning, size budget, or invalidation. Three concrete failure modes, all already observable:
1. **Bloat**: `dev`'s MEMORY.md grew again during every phase of the security plan (2026-07-04) — each dev-agent run appended bullets. Cost scales with project age, paid every session.
2. **Staleness**: bullets record point-in-time facts that silently go wrong — e.g. the pre-migration `.claude/agent-memory/` path bullet was wrong after the 2026-06-22 move to `.agents/memory/`; the "plans/ writes need Bash" bullets become wrong the moment backlog/0014 fixes scopes.
3. **Role overlap with docs**: durable knowledge (e.g. "Codex TOML format", "harness bucket rule") sits in memory forever instead of graduating to `docs/`, so it's invisible to other agents and to `docs/INDEX.md` search.

The whole "AI learns continuously" vision (the core product goal of the beaver harness) currently rests on an unbounded, never-verified append log.

## Tried

Nothing yet — parked for time.

## Resolution (2026-07-05)

All six suggested-direction items implemented (main session, after backlog/0014):

1. **Budget** — `harness-assets/scripts/validate-structure.mjs` gained check 4:
   walks `.agents/memory/*/MEMORY.md`, WARNs over 15 bullets / 100 lines,
   ERRORs (exit 1) at 2× budget. Skips silently when no memory dir exists.
2. **Promote rule + 3. Invalidation rule** — stated in the seed header
   (`harness-assets/.agents/memory/_seed.md`), the new memory-retro skill, the
   claude-harness spec (new "Agent Memory Lifecycle" section), and this repo's
   CLAUDE.md ("MEMORY LIFECYCLE" rule).
4. **Distill triggers** — (a) new shared skill asset
   `harness-assets/skills/memory-retro/SKILL.md`, emitted to
   `.claude/skills/<slug>-memory-retro/` and `.agents/skills/<slug>-memory-retro/`
   for both harnesses; (c) `plans/README.md` lifecycle section now requires a
   memory retro when closing/archiving a plan. Option (b) SessionEnd hook was
   skipped — the validator + skill cover the loop without more machinery.
5. **Pilot compaction** — `.agents/memory/dev/MEMORY.md` 27 → 15 bullets
   (Codex payload fields / TOML format / hooks.json discovery PROMOTED to the
   claude-harness spec's new "Codex integration facts"; one-off notes already in
   plan Resolutions/backlog deleted). Bonus: `.agents/memory/planner/MEMORY.md`
   26 → 10 bullets (stale post-0013 bullets deleted, spec-gap bullets merged) —
   clears the validator's live WARN.
6. **Mirrored into the scaffold** — the seed header, validator check, and skill
   are all assets, so every scaffolded project gets the same lifecycle; dogfood
   regenerated via `npx tsx test/helpers/regen-dogfood.ts`, snapshots updated,
   full suite green.

## Why parked

End of session 2026-07-04. Needs design (lifecycle rules + enforcement), best done after backlog/0014 fixes scopes (that also requires a memory-cleanup pass — natural pilot for the prune workflow).

## Suggested direction

Define memory as SHORT-TERM with an explicit lifecycle, enforced by mechanism not discipline (the repo's own philosophy — same as park rule / docs-first hook):

1. **Budget**: hard cap per agent, e.g. ≤ 15 bullets or ≤ 100 lines in MEMORY.md. Enforce via a new check in `scripts/validate-structure.mjs` (it already walks agent files) — WARN over budget, ERROR at 2× budget.
2. **Promote rule**: a bullet that has survived N sessions / is architecture-level truth gets moved by `docs-writer` into the relevant `docs/` spec (or a new architecture doc), then DELETED from memory. Memory holds only: recent gotchas, temp state, things not yet stable enough for docs.
3. **Invalidation rule**: any phase/fix that changes a path, scope, or convention MUST grep `.agents/memory/*/` for bullets referencing the old state and update/delete them in the same change (add this to the conventions skill + CLAUDE.md guidelines).
4. **Distill trigger**: add a compaction step to the workflow — options: (a) a `/retro` skill run at end of significant work ("review your memory file: dedupe, delete stale, flag promote-candidates"), (b) a SessionEnd/Stop hook printing a reminder when MEMORY.md exceeds budget, (c) fold into planner's plan-completion checklist ("memory hygiene" phase in every plan). Start with (a)+(c) — cheapest.
5. **Immediate pilot**: run the first manual compaction on `.agents/memory/dev/MEMORY.md` — it currently mixes durable facts (Codex TOML format, payload fields, bucket rule → promote to claude-harness spec) with stale workaround notes (Bash-bypass bullets → delete after 0014) and one-off fix notes (already recorded in plans/backlog → delete).
6. Mirror the final rules into the scaffold: memory seed templates in `claude-setup.ts` (or `harness-assets/`) should state the lifecycle in their header line, and scaffolded validate-structure gets the same budget check.

## Related

- backlog/0014 (its memory-cleanup step is this entry's pilot)
- backlog/0013 (edit seeds once in harness-assets/ if that lands first)
