---
phase: 02
title: Update harness-assets templates — selective prefixing
status: done
depends_on: [01]
---

## Goal

Replace hardcoded knowledge-base paths in harness-assets templates with `{{baseDir}}/` prefix. **Tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`) stay bare — they are not prefixed.**

## Context

The key architectural principle: only knowledge-base paths are prefixed. Tool discovery paths stay at root.

- **Knowledge-base paths** (get `{{baseDir}}/` prefix): `plans/`, `docs/`, `backlog/`, `scripts/`
- **Tool-discovery paths** (stay bare at root): `.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`

When `baseDir = '.beaver'`: `{{baseDir}}/plans/` → `.beaver/plans/`, but `.claude/` → `.claude/` (no prefix)
When `baseDir = ''`: `{{baseDir}}/plans/` → `plans/`, and `.claude/` → `.claude/` (both bare)

## Steps

### AGENTS.md Template

- [x] **Edit `harness-assets/AGENTS.md`** — prefix ONLY knowledge-base references:
  - Search for `plans/`, `backlog/`, `docs/`, `scripts/` references
  - Prefix each with `{{baseDir}}/`
  - Example: `plans/README.md` → `{{baseDir}}/plans/README.md`
  - Example: `scripts/validate-plans.mjs` → `{{baseDir}}/scripts/validate-plans.mjs`
  - Example: `docs/INDEX.md` → `{{baseDir}}/docs/INDEX.md`
  - DO NOT prefix: `.agents/`, `.claude/`, `.codex/` — these stay bare

- [x] **Manual verification**: grep for remaining bare paths in AGENTS.md:
  - Run: `grep -n "plans/\|backlog/\|docs/\|scripts/" harness-assets/AGENTS.md | grep -v "{{baseDir}}"`
  - Should return NOTHING (all knowledge-base paths prefixed)
  - Tool paths like `.agents/`, `.claude/`, `.codex/` should still be bare (not in the grep result)

### Agent Template Files (.claude/agents/*.md)

- [x] **Edit `harness-assets/.claude/agents/planner.md`** — prefix ONLY knowledge-base paths:
  - Prefix: `plans/`, `backlog/`, `docs/` references with `{{baseDir}}/`
  - Keep bare: `.agents/memory/planner/MEMORY.md`, `.claude/`, `.codex/` references
  - Example: `plans/README.md` → `{{baseDir}}/plans/README.md`
  - Example: `docs/INDEX.md` → `{{baseDir}}/docs/INDEX.md`
  - Example: `.agents/memory/planner/MEMORY.md` stays bare (tool path)

- [x] **Edit `harness-assets/.claude/agents/docs-writer.md`**:
  - Prefix: `docs/`, `backlog/` references
  - Keep bare: `.agents/memory/docs-writer/MEMORY.md`, `.claude/`, `.codex/`

- [x] **Edit `harness-assets/.claude/agents/advisor.md`**:
  - Prefix: `docs/` references
  - Keep bare: `.agents/memory/advisor/MEMORY.md`, `.claude/`, `.codex/`

- [x] **Edit `harness-assets/.claude/agents/scout.md`**:
  - Prefix: `docs/` references
  - Keep bare: `.agents/memory/scout/MEMORY.md`, `.claude/`, `.codex/`

- [x] **Edit `harness-assets/.claude/agents/dev.md`** (if path references exist):
  - Prefix: `plans/`, `backlog/`, `docs/`, `scripts/` references
  - Keep bare: `.agents/`, `.claude/`, `.codex/`

### Codex Agent Template Files (.codex/agents/*.toml)

- [x] **Edit `harness-assets/.codex/agents/planner.toml`**:
  - Prefix: knowledge-base paths in developer_instructions
  - Keep bare: `.agents/`, `.claude/`, `.codex/` paths

- [x] **Edit `harness-assets/.codex/agents/docs-writer.toml`**, **advisor.toml**, **scout.toml**, **dev.toml**:
  - Apply same selective prefixing rule

### Summary Check

- [x] **Verify selective prefixing**:
  - Knowledge-base paths (plans/, docs/, backlog/, scripts/) should all be prefixed with `{{baseDir}}/`
  - Tool-discovery paths (.agents/, .claude/, .codex/) should remain bare
  - Run: `grep -r "{{baseDir}}" harness-assets/` — confirm only knowledge-base paths are prefixed
  - Run: `grep -r "\.claude/\|\.codex/\|\.agents/" harness-assets/ | grep -v "{{baseDir}}"` — confirm tool paths stay bare

## Verify

- [x] TypeScript compilation: `npm run build` (no errors from template changes)
- [x] Knowledge-base paths are consistently prefixed with `{{baseDir}}/` across all templates
- [x] Tool-discovery paths (`.agents/`, `.claude/`, `.codex/`) remain bare (unprefixed)
- [x] No typos in `{{baseDir}}` (should be exactly this casing)
- [x] Manual spot-check: `harness-assets/AGENTS.md` shows `{{baseDir}}/plans/README.md`, `{{baseDir}}/docs/INDEX.md`, but `.agents/memory/...` stays bare

## Notes / Risks

- **Selective prefixing is critical** — prefixing tool-discovery paths would break auto-discovery (tools look for `.claude/`, `.codex/`, `.agents/` at root, not in `.beaver/`)
- **Empty string is valid**: when `baseDir=''`, `{{baseDir}}/plans/` renders to `/plans/`, and interpolate() should handle leading slash removal if needed (or it produces `plans/` naturally)
- **Token interpolation**: Phase 03 applies this via interpolate(baseDir, template); if any `{{baseDir}}` remains, the golden test will catch it
- **Paired changes**: Phase 02 templates + Phase 03 application + Phase 04 beaver-params MUST run together or golden test breaks

