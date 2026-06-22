---
id: "0008"
title: "Spec: move .agents/memory/ from Claude-only to Shared Harness Output"
status: open
source: plans/codex-memory-seed/01-fix-template.md
severity: low
created: 2026-06-22
---

## Symptom
`docs/features/claude-harness/claude-harness.spec.en.md` "Harness Choice Option" section
(~line 95) lists `.agents/memory/` under the `'claude'` bullet. After fix in
`plans/codex-memory-seed/`, these files are emitted for all harness modes, so the
spec now misrepresents the actual scaffold output.

## Tried
Nothing — this is a spec-only gap discovered during the codex-memory-seed plan.

## Why parked
Spec updates belong to docs-writer; the fix itself (code change) is already done.

## Suggested direction
docs-writer should update the "Harness Choice Option" section:
- Move `.agents/memory/` from the `'claude'` bullet to the "Shared files" sentence
  at the end of that section.
- No other sections need changing.
