---
phase: 01
title: fix-template
status: done
depends_on: []
---

## Goal
Move the four core-agent memory seed entries (dev, docs-writer, planner, advisor) out of the `claudeOnly` block and into a harness-neutral block inside `buildClaudeFileMap`, so that `harness: 'codex'` scaffolds also emit `.agents/memory/<agent>/MEMORY.md` files. Guard against duplicates in `harness: 'both'` mode. Then verify all three harness modes render correctly and TypeScript is clean.

## Steps

- [x] Open `src/scaffold/shared/claude-setup.ts` and locate `buildClaudeFileMap` (~line 1873). Read the full function body including `claudeOnly`, `codexOnly`, and the `testing` block.
- [x] Extract the four memory seed entries from the `claudeOnly` array:
  ```
  { relativePath: '.agents/memory/dev/MEMORY.md',         content: agentMemorySeedTemplate('dev') },
  { relativePath: '.agents/memory/docs-writer/MEMORY.md', content: agentMemorySeedTemplate('docs-writer') },
  { relativePath: '.agents/memory/planner/MEMORY.md',     content: agentMemorySeedTemplate('planner') },
  { relativePath: '.agents/memory/advisor/MEMORY.md',     content: agentMemorySeedTemplate('advisor') },
  ```
  Add them to the `shared` block (the `FileMap` that is always emitted regardless of harness choice). Confirm `shared` is defined in `buildClaudeFileMap` before `claudeOnly` and `codexOnly`.
  - If `shared` is not a standalone variable but is inlined (e.g., directly as `[...shared, ...claudeOnly, ...]`), create or extend the existing shared variable — do not create a new top-level variable outside the function.
- [x] Remove the four extracted lines from the `claudeOnly` array. Leave the `test-writer` memory seed line (`'.agents/memory/test-writer/MEMORY.md'`) in the `wantClaude` branch of the `testing` block — it stays Claude-only.
- [x] Verify no duplicate path arises for `harness: 'both'`: since the memory seeds move to `shared` (always emitted once), and neither `claudeOnly` nor `codexOnly` now contain them, there is no duplication risk. Add a comment next to the moved entries: `// harness-neutral: emitted for claude, codex, and both`.
- [x] File `backlog/0008-harness-spec-memory-section-update.md` flagging that `docs/features/claude-harness/claude-harness.spec.en.md` needs updating — the "Harness Choice Option" section currently lists `.agents/memory/` under the `'claude'` bullet but it should appear under "Shared files" instead. (See content spec below.)

## Verify

1. **TypeScript clean** — run `npx tsc --noEmit` from the repo root. Must produce zero errors.
2. **File map — codex-only** — add a temporary inline call or use the existing test/render path to instantiate `buildClaudeFileMap` with `harness: 'codex'` and a minimal params object, then inspect the resulting `FileMap`. Assert all four paths are present:
   - `.agents/memory/dev/MEMORY.md`
   - `.agents/memory/docs-writer/MEMORY.md`
   - `.agents/memory/planner/MEMORY.md`
   - `.agents/memory/advisor/MEMORY.md`
   - `.agents/memory/test-writer/MEMORY.md` is **absent** (no test-writer for codex).
3. **File map — claude-only** — repeat with `harness: 'claude'`. Assert the same four core paths are present. Assert `.agents/memory/test-writer/MEMORY.md` is present only if `params.testing` is set.
4. **File map — both** — repeat with `harness: 'both'`. Assert:
   - Each of the four core memory paths appears exactly **once** (no duplicates).
   - `.agents/memory/test-writer/MEMORY.md` is present (testing set) or absent (testing unset).
5. **Backlog entry** — confirm `backlog/0008-harness-spec-memory-section-update.md` exists with `status: open` and `source` pointing to this phase file.
6. **Update plan tracker** — set this phase `status: done` and flip the table row in `00-overview.md` to `done`, Steps `5/5`, Updated `<today>`.

## Notes / risks

- **Where is `shared`?** Before editing, confirm the shape of the existing `shared` variable in `buildClaudeFileMap`. From the code read, `shared` is expected to be a `FileMap` array built unconditionally. If the function composes files differently (e.g., if `shared` is imported rather than local), adjust accordingly — do not guess; read first.
- **No `harness: 'both'` dedup logic needed** — once memory seeds live in `shared`, they cannot appear in both `claudeOnly` and `codexOnly`, so no explicit dedup guard is required. The comment is sufficient.
- **test-writer stays Claude-only** — confirmed: there is no `.codex/agents/test-writer.toml` in the codexOnly block. Emitting a memory seed without a corresponding TOML would confuse Codex agents. Do not move test-writer seed.
- **Dogfood not affected** — the beaver repo's own `.agents/memory/` directory exists independently of the scaffold template; no copy/sync needed.
- **Spec update is out of scope** — flag it as backlog/0008, do not edit `docs/features/claude-harness/claude-harness.spec.en.md`.
- **Archive** — once Verify passes, move this plan to `plans/.archive/codex-memory-seed/` as the final sub-step of step 6.

### Backlog entry content (for step 5)

Create `backlog/0008-harness-spec-memory-section-update.md` with:

```
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
```
