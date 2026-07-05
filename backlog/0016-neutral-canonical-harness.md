---
id: "0016"
title: "Invert harness canonical: vendor-neutral core (.agents/ or AGENTS.md standard), CLAUDE.md/.codex become generated adapters"
status: open
source: advisor-consultation-2026-07-04
severity: low
created: 2026-07-04
---

## Symptom

The stated product vision is "provider-agnostic AI harness", but the architecture is Claude-canonical: CLAUDE.md is the source of truth, AGENTS.md is a pointer file ("Read CLAUDE.md first and in full"), the shared module is literally named `claude-setup.ts`, and Codex artifacts are hand-mirrored translations. Adding a third provider (Gemini CLI, Cursor, etc.) means translating from a competitor-named format, and every content change must be manually synced into each provider's copy.

Neutral bricks ALREADY exist: the `AGENTS` registry table (declarative agent defs in claude-setup.ts), `scripts/agent-guard-core.mjs` (pure shared ACL), `.agents/memory/` (neutral path, migrated 2026-06-22), `.agents/skills/` (neutral skills copies), top-level `scripts/` (neutral tooling). The inversion is incomplete, not unstarted.

## Tried

Nothing yet — parked for time.

## Why parked

End of session 2026-07-04. Deliberately sequenced LAST of the four advisory items: inverting the canonical is far easier once backlog/0013 (assets-as-files) is done, because canonical content becomes real files you move, not string templates you rewrite.

## Suggested direction

1. **Pick the canonical home**: two candidates — (a) `.agents/` directory (registry + workflow rules + routing table as neutral files), or (b) the emerging **AGENTS.md open standard** (agents.md — already adopted by multiple tools) as the canonical human-readable doc, with CLAUDE.md becoming the thin pointer instead. Investigate current tool support before choosing; (b) is more future-proof if Claude Code reads AGENTS.md acceptably via pointer.
2. Canonical content = behavioral guidelines, project overview, routing table, PARK RULE, DOCS-FIRST rule, agent registry (name/model/writeScope/memory/tools per agent). Provider adapters render from it: `CLAUDE.md` + `.claude/agents/*.md` + settings.json (Claude renderer), `AGENTS.md` + `.codex/agents/*.toml` + hooks.json (Codex renderer). Adding provider N = one new renderer, zero content authoring.
3. Rename `src/scaffold/shared/claude-setup.ts` → `src/scaffold/shared/harness/` (or similar) — cosmetic but aligns the mental model; do it during the 0013 refactor to avoid a separate churn commit.
4. Keep per-provider capability asymmetries EXPLICIT in the renderer layer, not the content layer (e.g. Claude has `permissions.ask`, Codex doesn't — see security-hardening spec section on network-egress asymmetry).
5. Update `docs/features/claude-harness/claude-harness.spec.en.md` (probably rename the feature to `harness` or `ai-harness`) and the AGENTS.md sync-by-hand comment (it currently instructs manual sync with CLAUDE.md — that instruction dissolves once both are generated).

## Related

- backlog/0013 — hard prerequisite in practice (do 0013 first). **Resolved 2026-07-05**
  ([[plans/.archive/assets-and-tests/00-overview.md]]) — assets are now real files
  under `harness-assets/`, so this item is unblocked.
- backlog/0005 (resolved?) — earlier spec-gap about Codex scaffold output; the spec restructure here should absorb any remainder
