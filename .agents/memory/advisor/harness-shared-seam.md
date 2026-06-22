---
name: harness-shared-seam
description: The shared-vs-domain seam for the Claude harness already exists at buildClaudeFileMap; new project types/consumers should call it, not fork it.
metadata:
  type: project
---

The harness has ONE seam between project-agnostic and domain code, and any new consumer (new project type, or a sibling project like codex) should plug into it rather than fork.

- Shared/agnostic lives in `src/scaffold/shared/claude-setup.ts` as `buildClaudeFileMap(params: ClaudeHarnessParams)`: docs tooling, settings.json, docs skill, docs-writer/planner/advisor/scout agents, memory seeds, backlog + plans scaffolding, validators (agent-guard.mjs, validate-plans.mjs, validate-structure.mjs), park rule, docs-first rule.
- Domain/per-type lives in each `src/scaffold/<type>/templates/claude-setup.ts`: that type's CLAUDE.md, conventions skill, and dev agent — passed INTO buildClaudeFileMap.
- The `AGENTS` registry (name/model/writeScope/memory, 4 fields) with derived invariants (read-only → no write tools; agent-guard parameterized; unique dir ownership) is the agnostic backbone.

**Why:** spec `docs/features/claude-harness/claude-harness.spec.en.md` deliberately separated these so unselected options stop leaking into generated context.

**How to apply:** when asked to extend the harness to a new target, recommend a NEW buildClaudeFileMap consumer (adapt only CLAUDE.md, conventions skill, dev agent verify-loop, flow/layer enums). Resist extracting shared code to a monorepo package until a consumer exists that is NOT a beaver scaffold target — premature per CLAUDE.md §2. The seam already exists; extraction is a cheap deferred move.
