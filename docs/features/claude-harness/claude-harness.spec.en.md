---
title: Claude Harness Generation — Feature Spec
feature: claude-harness
flow: templates
layer: scaffold
status: active
lang: en
related: [architecture/agent-workflow.en.md, features/harness-only/harness-only.spec.en.md]
keywords: [claudesetup, harness, aiharnesssetup, buildclaudefilemap, agents, agentregistry, skills, backlog, parkrule, plans, validator, productdescription]
updated: 2026-06-21
---

# Claude Harness Generation — Feature Spec

## Context
Scaffolded projects ship with an optional Claude Code harness (menu "Choose an AI setup"). Available for react-vite AND chrome-extension project types. The harness is also available for existing projects via the "Apply AI Harness" feature (harness-only mode).

The harness scaffolds a full agent workflow including docs (long-lived WHAT), plans (HOW/when phases), and backlog (deferred work), plus all supporting tooling and agent definitions wired into CLAUDE.md.

## Root Cause / Key Finding
The harness was originally react-vite-only and leaked unselected options (Zustand in the BPR diagram, an always-present test-writer agent, routing/state docs enums) into generated files — noisy context for the downstream agent.

The scaffolded agent workflow had no story-level planning or blocker-tracking. When agents hit problems during execution, they would retry indefinitely instead of parking the work and moving on — a token-wasting anti-pattern with no central home for deferred work.

## Solution / Pattern

### Harness Architecture
- Shared, project-agnostic pieces (docs tooling, settings.json, docs skill, docs-writer agent, memory seeds, backlog, plans scaffolding) live in `src/scaffold/shared/claude-setup.ts` as `buildClaudeFileMap(params: ClaudeHarnessParams)`.
- Each project type renders its own CLAUDE.md, conventions skill, and dev agent, and passes them in (`src/scaffold/react-vite/templates/claude-setup.ts`, `src/scaffold/chrome-extension/templates/claude-setup.ts`).
- Everything is strictly cart-conditional: flow/layer enums, reminder trigger, key patterns, naming rows, and the test-writer agent (emitted only when `params.testing` is set — react-vite with a test framework chosen; never for chrome-extension).
- The shared file map always emits five agents: `dev`, `docs-writer`, `planner`, `advisor` (read-only brainstorming/trade-off analysis), and `scout` (read-only cheap factual lookup). `advisor` carries project memory (`.claude/agent-memory/advisor/`); `scout` is stateless (no memory seed).
- Agent models: dev = sonnet, docs-writer = haiku, planner = sonnet, advisor = opus, scout = haiku, test-writer = haiku.
- Read-only agents are constrained by their `tools:` allowlist (advisor/scout have no `Write`/`Edit`). `planner` needs `Write`/`Edit` to author plans, so a path allowlist alone can't bound it — it is double-guarded: (a) a `tools:` allowlist with no `Bash`, and (b) a `PreToolUse` hook (`.claude/scripts/agent-guard.mjs`, matcher `Write|Edit|MultiEdit`) that hard-denies any write where `agent_type == "planner"` and the target is outside `plans/` (or `.claude/agent-memory/planner/`). This stops the "planner drifts into coding" failure mode that prose rules alone can't prevent.

### Product Description Field
When Claude Harness is enabled, users are prompted: "Describe your project. What is it?" (or equivalent in their language). This **required** field captures a one-line product summary and is rendered into the scaffolded `CLAUDE.md` file's `## Project Overview` section as the opening sentence.

**Behavior:**
- Capture: At menu time, when user selects "Enable Claude Harness", prompt them for `productDescription` (required input).
- Render: In the generated CLAUDE.md, the `## Project Overview` section begins with the product description on its first line, followed by the project architecture/stack details.
- Example: User enters "B2B invoicing dashboard for SMEs" → `## Project Overview` opens with "B2B invoicing dashboard for SMEs" followed by the technology summary.
- Applies to: All project types where Claude Harness is offered (react-vite, chrome-extension, harness-only skeletons, and future project types).
- Purpose: Agents (advisor, dev, docs-writer, planner) read this to quickly understand the project's domain and purpose when onboarding.

**Scope:** The field is part of `ClaudeHarnessParams` (required string, non-empty). If not provided, the harness prompt re-asks until a non-empty string is supplied.

### Agent Registry (Data-Driven Agent Definition)
Agents are defined declaratively in a single source-of-truth table (`AGENTS` at the top of `src/scaffold/shared/claude-setup.ts`), with the MINIMAL schema:

| Field | Type | Description |
|---|---|---|
| `name` | string | Agent identifier (e.g., `dev`, `advisor`) |
| `model` | string | Model choice: `sonnet`, `haiku`, or `opus` |
| `writeScope` | string[] | Path prefixes the agent may write (e.g., `["src/", "package.json"]`). Empty = read-only; `.claude/agent-memory/<name>/` is always implicitly allowed |
| `memory` | boolean | Whether to seed `.claude/agent-memory/<name>/MEMORY.md` on first run |

**Derived invariants** (enforced mechanically, NOT re-declared):
- **Read-only constraint**: if `writeScope` is empty, the agent's emitted `tools:` list must NOT include `Write` or `Edit` — violations are flagged by a runtime validator.
- **Unique ownership**: no two agents may have the same primary owned directory (e.g., two agents can't both write `plans/`).
- **Path guarding**: the `agent-guard.mjs` hook becomes a GENERAL guard parameterized from the registry, denying writes outside each agent's `writeScope` and `.claude/agent-memory/<name>/`.
- **Validators**: 
  - `validate-structure.mjs` (sibling to lint-docs-frontmatter.mjs) checks that emitted agents' `tools` lists respect their `writeScope` (read-only agents have no write tools; others have write tools if allowed).
  - `validate-plans.mjs` is a plan/backlog consistency checker emitted by `buildClaudeFileMap`, performing four checks: (A) the ordered phases table in `00-overview.md` matches frontmatter `status` values from each phase file, staying synchronized; (B) warning when a plan is all-done but not yet archived; (C) validating backlog ID format and monotonic ordering (4-digit zero-padded, e.g., `backlog/0001`, `backlog/0042`); (D) verifying bidirectional links between `status: blocked` phases and their corresponding `backlog/<id>` entries (each blocked phase must link to a backlog entry, and each entry's `source:` must point back).

**Why this design:**
The minimality trade-off: agent registries can grow unbounded with features (roles, teams, approval workflows). This schema intentionally stays to 4 fields and reverses the earlier "no project-type registry" decision ONLY for agents, because:
1. The template will host many agents as the harness matures.
2. Derivation rules (read-only → no write tools, planner guard → parameterized) eliminate hand-maintained copies that drift.
3. The validator prevents misconfigurations that prose rules can't catch.

The `tools:` list and `Bash` allowance are implementation details (HOW), not part of the registry — derived from model choice and `writeScope`.

### Agent Workflow & Backlog Integration
Scaffolded projects now emit three coordinated artifact trees (see [[architecture/agent-workflow.en.md]]):

| Tree | Ownership | Lifecycle | Use case |
|---|---|---|---|
| `docs/` | docs-writer | Long-lived | WHAT — feature specs, decisions, system knowledge |
| `plans/` | planner | Consumable | HOW/when — phases to execute, progress tracker in `00-overview.md` |
| `backlog/` | dev (or any executor) | Append-only, lives until resolved | Deferred work, blockers, tech debt — things NOT fixable now |

The **park rule** (wired into CLAUDE.md and agent definitions) stops token-wasting retry loops:
- If a step **fails twice** and the cause is **not fixable right now** (missing info, needs user decision, environment issue, out of scope), then **STOP, do not retry a third time**.
- Set the owning phase `status: blocked`, file a backlog entry with the **Tried** section listing what failed (prevents repeating attempts), link both ways, and move on to the next workable item.
- The plan's `00-overview.md` progress table flags blocked phases inline (e.g., `blocked → backlog/0003`), and the backlog entry's `source:` field points back to the phase file.

Backlog files live at `backlog/<NNNN>-<slug>.md` (`NNNN` zero-padded to 4 digits) with frontmatter (`id`, `status: open|resolved|wontfix`, `source`, `severity`, `created`) and body sections: **Symptom**, **Tried**, **Why parked**, **Suggested direction**. When revived, the planner reads it and produces fresh phases under `plans/`.

## What Changed
- **Product Description field is now required** when enabling Claude Harness. The field is captured via prompt at harness-enable time and rendered into CLAUDE.md's `## Project Overview` section, providing agents with immediate context about the project's domain and purpose.

## Key Decisions
- Parameter object over inheritance/abstraction for project types — only ~10 fields, no project-type registry. `ClaudeHarnessParams` now includes the required `productDescription: string` field.
- **Agents are ALWAYS defined declaratively** in a minimalist registry (4 fields: name, model, writeScope, memory) with derived constraints (read-only → no write tools, agent-guard parameterized from registry, validator checks consistency). This reverses the "no registry" principle ONLY for agents because the template will host many and hand-maintained copies drift. Keep the schema minimal to avoid becoming a general framework.
- Chrome-extension gets no testing menu (and therefore no test-writer) for now.
- Backlog as file-based append-only log, not GitHub Issues — agents read/write it directly, it travels with git, no network round-trip. Single source of truth to avoid drift.
- The park rule is mandatory in the harness-emitted CLAUDE.md and agent templates so every user of the harness applies it consistently.
- The beaver repo itself dogfoods the same harness shape (this docs/ tree, .claude/, plans/, backlog/), with CLI-specific enums.

## Related Files
- src/scaffold/shared/claude-setup.ts
- src/scaffold/react-vite/templates/claude-setup.ts
- src/scaffold/chrome-extension/templates/claude-setup.ts
- .claude/scripts/agent-guard.mjs
- .claude/scripts/validate-structure.mjs
- .claude/scripts/validate-plans.mjs
- src/options/chrome-extension/index.ts
- backlog/README.md
- plans/README.md
- docs/architecture/agent-workflow.en.md (parent feature; covers park rule and backlog lifecycle)
