---
phase: 01
title: Anchor spec-gap follow-up as a backlog entry
status: done
depends_on: []
---

## Goal

The floating spec-gap note in `plans/harness-backlog-park-rule/00-overview.md` (§ "Spec gap — FLAG for docs-writer") is converted into a proper `backlog/0001-harness-spec-gap-park-rule.md` entry before that plan is archived, so the work isn't lost.

**Owner: dev** — planner cannot write to `backlog/`.

## Steps

- [ ] Create `backlog/0001-harness-spec-gap-park-rule.md` with the exact content specified in the Notes section below.
- [ ] Verify the file is valid: frontmatter parses, all four body sections present, `source:` points to the correct phase file.
- [ ] Verify `backlog/` directory listing shows exactly `README.md` and `0001-harness-spec-gap-park-rule.md` (no other stray files).

## Verify

```bash
# 1. File exists
ls /home/home-linux/project/2026/beaver/backlog/0001-harness-spec-gap-park-rule.md

# 2. Frontmatter fields present
node -e "
const fs = require('fs');
const content = fs.readFileSync('backlog/0001-harness-spec-gap-park-rule.md', 'utf-8');
const required = ['id:', 'title:', 'status:', 'source:', 'severity:', 'created:'];
for (const field of required) {
  if (!content.includes(field)) console.error('MISSING:', field);
  else console.log('OK:', field);
}
"

# 3. backlog/ contains exactly README.md + the new file
ls backlog/
```

## Notes / risks

**Exact file content to create at `backlog/0001-harness-spec-gap-park-rule.md`:**

```
---
id: "0001"
title: Update claude-harness spec — backlog folder, park rule, agent-guard rename
status: open
source: plans/harness-backlog-park-rule/00-overview.md
severity: low
created: 2026-06-20
---

## Symptom

`docs/features/claude-harness/claude-harness.spec.en.md` has two categories of stale/missing content discovered after the `harness-backlog-park-rule` and `agent-registry` plans completed:

1. **`planner-guard.mjs` references** — lines 33, 48, and 77 still name `planner-guard.mjs`. The guard was renamed to `agent-guard.mjs` during `plans/agent-registry/03-registry-guard.md` (done 2026-06-20). The spec was explicitly a non-goal of that plan.

2. **Missing backlog/park-rule coverage** — the spec's "Harness Architecture" section does not mention `backlog/README.md` as an emitted file. The "Related Files" list at the bottom omits both `backlog/README.md` and `plans/README.md`. The "Agent Workflow & Backlog Integration" subsection already documents the park rule correctly, but the implementation detail (that `buildClaudeFileMap` now emits `backlog/README.md`) is absent.

## Tried

Nothing attempted — this was deliberately deferred as a non-goal in `plans/harness-backlog-park-rule/00-overview.md` (§ "Spec gap — FLAG for docs-writer"). The original flag noted: "This can proceed in parallel with or after Phase 01 — it does not block execution."

## Why parked

docs/ is docs-writer's exclusive scope. The planner flagged it during propagation work but cannot execute the update. No blocking dependency — execution can start immediately once docs-writer picks it up.

## Suggested direction

docs-writer should open `docs/features/claude-harness/claude-harness.spec.en.md` and make two targeted edits:

1. Replace every occurrence of `planner-guard.mjs` with `agent-guard.mjs` (3 occurrences: lines 33, 48, 77 as of 2026-06-20).

2. In the "Related Files" section at the bottom, add:
   - `backlog/README.md` (or `backlog/` if listed by directory)
   - `plans/README.md`

After edits, run:
```
node .claude/scripts/build-docs-index.mjs
node .claude/scripts/lint-docs-frontmatter.mjs
```
Both must exit 0. Then set this entry `status: resolved`.
```

- The content above uses a nested code fence — the outer fence in this phase file uses backtick fences; the inner example is indented as a block. Dev should write the file contents verbatim (without the outer wrapper fences).
- Do NOT create `backlog/0002-*` or any other backlog file in this phase — only `0001`.
- The `source:` value points to the harness-backlog-park-rule plan (the original home of the flag), not to this governance-cleanup plan. That is intentional — it preserves provenance.
