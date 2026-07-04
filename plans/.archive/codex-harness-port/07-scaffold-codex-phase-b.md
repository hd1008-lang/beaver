---
phase: 07
title: scaffold-codex-phase-b
status: done
depends_on: [01, 02, 03, 04, 05, 06]
---

## Goal

Extend `src/scaffold/shared/claude-setup.ts` (`buildClaudeFileMap`) to emit `.codex/` and `.agents/skills/` alongside `.claude/` when scaffolding end-user projects — so beaver-generated projects get a dual-harness (Claude + Codex) out of the box.

## Steps

- [x] Read `docs/features/claude-harness/claude-harness.spec.en.md` in full before touching any code.
- [x] Read `src/scaffold/shared/claude-setup.ts` in full. Understand `buildClaudeFileMap`'s return type (`FileMap`), what files it currently emits, and how the orchestrators consume it.
- [x] Plan the additions to `FileMap`:
  - `.codex/agents/advisor.toml`, `.codex/agents/dev.toml`, `.codex/agents/docs-writer.toml`, `.codex/agents/planner.toml`, `.codex/agents/scout.toml` — content is the same as what was written for this repo in phase 04, but templated with `params.productDescription` and `params.projectName` substituted where relevant.
  - `.codex/hooks.json` — same as this repo's `.codex/hooks.json` from phase 05, templated for the user's project root.
  - `.agents/skills/<name>/SKILL.md` — the skill files are already in `.claude/skills/`; for scaffolded projects they should be emitted as real files (not symlinks, since symlinks may not survive `npm pack` or CI). Emit them at both paths.
  - `AGENTS.md` — same pointer file from phase 06.
- [x] Implement the additions in `src/scaffold/shared/claude-setup.ts`. Follow the existing pattern: pure string templates, no side effects, no `fs` calls inside the template functions.
- [x] Run `npx tsc --noEmit` to verify TypeScript compiles cleanly.
- [x] Run `npm run build` to verify the compiled output is valid.

## Verify

- `npx tsc --noEmit` exits 0.
- `npm run build` exits 0.
- A throwaway `npx tsx` render of `buildClaudeFileMap(sampleParams)` shows the new `.codex/` and `.agents/` keys in the returned `FileMap`.
- No existing `.claude/` key is removed or renamed.

## Notes / risks

**Symlinks in scaffolded output** — the dogfood repo uses symlinks for skills/memory (phase 03). Scaffolded user projects cannot use symlinks (they must emit real files, not pointers into a sibling directory). `buildClaudeFileMap` should emit duplicate real files at `.claude/skills/<name>/SKILL.md` AND `.agents/skills/<name>/SKILL.md` (same content, two paths). This is intentional for scaffolded projects; the dogfood repo uses symlinks as a developer convenience.

**This phase is blocked until phases 01–06 are done** — the TOML content and hooks.json content for scaffolded projects are derived from the verified dogfood originals. Do not write templates until the originals are confirmed working.

**Spec gap** — `docs/features/claude-harness/claude-harness.spec.en.md` does not cover Codex output. A backlog entry should be filed for docs-writer to update the spec. Record content for backlog entry here (dev will file it in a phase step):
  - `id: 0005`
  - `title: claude-harness spec missing Codex scaffold output section`
  - `source: plans/codex-harness-port/07-scaffold-codex-phase-b.md`
  - `severity: low`
  - Symptom: spec describes only `.claude/` output; Codex additions to `buildClaudeFileMap` are undocumented.
  - Suggested direction: docs-writer adds `## Codex Harness Output` section to the spec listing the new FileMap keys.

**Archive step** — once this phase is done, move the entire `plans/codex-harness-port/` directory to `plans/.archive/codex-harness-port/`. This is the last phase.
