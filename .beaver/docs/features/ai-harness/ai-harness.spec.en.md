---
title: AI Harness Generation — Feature Spec
feature: ai-harness
flow: templates
layer: scaffold
status: active
lang: en
related: [architecture/agent-workflow.en.md, features/harness-only/harness-only.spec.en.md]
keywords: [agentsmd, harnesssetup, buildharnessfilemap, adapter, vendorneutral, harness, aiharnesssetup, agents, agentregistry, skills, backlog, parkrule, plans, validator, productdescription, dualharness, harnessscaffold, toml, codexhooks, agentstoml, basedir, rootdiscovery, beaverfolder, knowledgebase]
updated: 2026-07-11
---

# AI Harness Generation — Feature Spec

## Context
Scaffolded projects ship with an optional AI harness (menu "Choose an AI setup"). Available for react-vite AND chrome-extension project types. The harness is also available for existing projects via the "Apply AI Harness" feature (harness-only mode).

The harness scaffolds a full agent workflow including docs (long-lived WHAT), plans (HOW/when phases), and backlog (deferred work), plus all supporting tooling and agent definitions wired into provider-specific files (AGENTS.md for all modes, CLAUDE.md adapter for Claude/both).

Tool providers (Claude Code, Codex) auto-discover harness metadata at the repository root only. Certain paths (`.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`) must remain at root because they are immovable tool-discovery paths. Knowledge-base paths (`plans/`, `docs/`, `backlog/`, `scripts/`) are movable via the `{{baseDir}}` token — beaver's dogfood places them under `.beaver/` for a cleaner root, while scaffolded projects emit them at root.

## Root Cause / Key Finding
The harness was originally react-vite-only and leaked unselected options (Zustand in the BPR diagram, an always-present test-writer agent, routing/state docs enums) into generated files — noisy context for the downstream agent.

The scaffolded agent workflow had no story-level planning or blocker-tracking. When agents hit problems during execution, they would retry indefinitely instead of parking the work and moving on — a token-wasting anti-pattern with no central home for deferred work.

Prior harness design treated CLAUDE.md as the canonical entry point and required Codex users to read it first via a pointer — a Claude-centric bias at odds with vendor neutrality.

## Solution / Pattern

### Root-Discovery Constraint (Immovable Paths)

Tool providers (Claude Code, Codex, and agent harnesses in general) auto-discover harness metadata at the **repository root only**. These paths **must always stay at root** and cannot be moved, nested, or prefixed:

- **Claude Code auto-discovery:** reads `CLAUDE.md`, `.claude/settings.json`, `.claude/agents/`, `.claude/skills/`, `.claude/scripts/` from root
- **Codex auto-discovery:** reads `AGENTS.md` (entry point), `.codex/hooks.json`, `.codex/agents/`, `.codex/scripts/` from root
- **Agent memory:** `.agents/memory/` and `.agents/skills/` (shared across both providers, read-only for stateless agents)

These discovery paths are **tool-level requirements**, not configurable. Moving them breaks agent initialization and skill resolution. This constraint applies universally — to beaver itself and every scaffolded project that uses the harness.

**Scaffold behavior:** Both beaver (via `baseDir = '.beaver'`) and scaffolded projects (via `baseDir = ''`) emit `.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, and `CLAUDE.md` at the repository root. The `{{baseDir}}` token **never** prefixes these paths.

### Knowledge-Base Folder Structure (Movable via baseDir)

The harness maintains a **knowledge-base layer** of project-internal documentation and workflow artifacts. Unlike tool-discovery paths, these can be relocated:

- **Beaver's dogfood** (this repo): `{{baseDir}} = '.beaver'` → knowledge-base at `.beaver/plans/`, `.beaver/docs/`, `.beaver/backlog/`, `.beaver/scripts/`
- **Scaffolded projects:** `{{baseDir}} = ''` (empty string) → knowledge-base at root: `plans/`, `docs/`, `backlog/`, `scripts/`

The `{{baseDir}}` token is **selective** — it prefixes only knowledge-base path references in rendered files. Tool-discovery paths remain bare.

**Rationale for baseDir:**
1. **Cleaner root in dogfood:** beaver's product code (src/, test/, npm scripts) at the top level; internal tooling hidden under `.beaver/`
2. **Scaffolded projects stay simple:** generated projects emit at root by default (no hidden directories)
3. **Single harness codebase:** one rendering engine (`buildHarnessFileMap`) emits at different paths via token substitution — no code duplication
4. **Future flexibility:** other CLI tools can adopt `.beaver/` convention without modifying beaver's rendering logic

### Harness Architecture (Vendor-Neutral Canonical)

**AGENTS.md is the canonical document** emitted for **all harness modes** (`claude` | `codex` | `both`), holding:
- Behavioral guidelines (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)
- Project Overview (`productDescription` + per-type stack/conventions sections)
- Agent Routing table
- PARK RULE, MEMORY LIFECYCLE, DOCS-FIRST rules
- Renderer-filled Provider Adapters section (lists capability asymmetries; see Decision 3 below)

**CLAUDE.md is a thin adapter** emitted only for `claude` / `both` harness modes, containing:
- `@AGENTS.md` import directive (first line: Claude Code does not read AGENTS.md natively — see Issue anthropics/claude-code#34235, decided 2026-07-05)
- Claude-only content: `.claude/skills/` references, `.claude/settings.json` and hook notes

**Shared pieces** (docs tooling, settings.json, docs skill, docs-writer agent, memory seeds, backlog, plans scaffolding) live in `src/scaffold/shared/harness-setup.ts` as `buildHarnessFileMap(params: HarnessParams)`.

Each project type renders its own conventions skill, dev agent, and project-specific sections, passing them in via `HarnessParams.projectSections` and `HarnessParams.extraRoutingRows`.

Everything is strictly cart-conditional: flow/layer enums, reminder trigger, key patterns, naming rows, and the test-writer agent (emitted only when `params.testing` is set — react-vite with a test framework chosen; never for chrome-extension).

The shared file map always emits five core agents: `dev`, `docs-writer`, `planner`, `advisor` (read-only brainstorming/trade-off analysis), and `scout` (read-only cheap factual lookup). `advisor` carries project memory (`.agents/memory/advisor/`); `scout` is stateless (no memory seed).

Agent models: dev = sonnet, docs-writer = haiku, planner = sonnet (inherit), advisor = opus, scout = haiku, test-writer = haiku.

Read-only agents are constrained by their `tools:` allowlist (advisor/scout have no `Write`/`Edit`). `planner` needs `Write`/`Edit` to author plans, so a path allowlist alone can't bound it — it is double-guarded: (a) a `tools:` allowlist with no `Bash`, and (b) a `PreToolUse` hook (`.claude/scripts/agent-guard.mjs`, matcher `Write|Edit|MultiEdit`) that hard-denies any write where `agent_type == "planner"` and the target is outside `plans/` (or `.agents/memory/planner/`). This stops the "planner drifts into coding" failure mode that prose rules alone can't prevent.

### Product Description Field
When AI Harness is enabled, users are prompted: "Describe your project. What is it?" (or equivalent in their language). This **required** field captures a one-line product summary and is rendered into the scaffolded `AGENTS.md` file's `## Project Overview` section as the opening sentence.

**Behavior:**
- Capture: At menu time, when user selects "Enable AI Harness", prompt them for `productDescription` (required input).
- Render: In the generated AGENTS.md, the `## Project Overview` section begins with the product description on its first line, followed by the project architecture/stack details.
- Example: User enters "B2B invoicing dashboard for SMEs" → `## Project Overview` opens with "B2B invoicing dashboard for SMEs" followed by the technology summary.
- Applies to: All project types where AI Harness is offered (react-vite, chrome-extension, harness-only skeletons, and future project types).
- Purpose: Agents (advisor, dev, docs-writer, planner) read this to quickly understand the project's domain and purpose when onboarding.

**Scope:** The field is part of `HarnessParams` (required string, non-empty). If not provided, the harness prompt re-asks until a non-empty string is supplied.

### Agent Registry (Data-Driven Agent Definition)
Agents are defined declaratively in a single source-of-truth table (`AGENTS` at the top of `src/scaffold/shared/harness-setup.ts`), with the MINIMAL schema:

| Field | Type | Description |
|---|---|---|
| `name` | string | Agent identifier (e.g., `dev`, `advisor`) |
| `model` | string | Model choice: `sonnet`, `haiku`, `opus`, or `inherit` |
| `writeScope` | string[] | Path prefixes the agent may write (e.g., `["src/", "package.json"]`). Empty = read-only; `.agents/memory/<name>/` is always implicitly allowed |
| `memory` | boolean | Whether to seed `.agents/memory/<name>/MEMORY.md` on first run |

**Derived invariants** (enforced mechanically, NOT re-declared):
- **Read-only constraint**: if `writeScope` is empty, the agent's emitted `tools:` list must NOT include `Write` or `Edit` — violations are flagged by a runtime validator.
- **Unique ownership**: no two agents may have the same PRIMARY owned directory (`writeScope[0]` — e.g., two agents can't both lead with `plans/`). Secondary overlap is allowed: `dev`'s scope includes `plans/` (decided 2026-07-05, backlog/0014) so it can update phase status/checkboxes/Resolution while executing, but `planner` remains the primary owner of `plans/`.
- **Path guarding**: the `agent-guard.mjs` hook becomes a GENERAL guard parameterized from the registry, denying writes outside each agent's `writeScope` and `.agents/memory/<name>/`.
- **Hard boundary ⇔ no Bash**: the guard only matches `Write|Edit|MultiEdit` tool calls — Bash file operations (redirects, heredocs, `node` scripts) are NOT scope-checked. Therefore the guard is a HARD boundary only for agents whose `tools:` list excludes `Bash` (planner, advisor, scout); for Bash-holding agents (dev, docs-writer) it is an advisory guardrail plus audit log (decided 2026-07-05, backlog/0014). An agent that must be strictly bounded must not be given `Bash` — that is the real enforcement mechanism; do not rely on regex heuristics over Bash commands.
- **Validators**: 
  - `validate-structure.mjs` (sibling to lint-docs-frontmatter.mjs) checks that emitted agents' `tools` lists respect their `writeScope` (read-only agents have no write tools; others have write tools if allowed).
  - `validate-plans.mjs` is a plan/backlog consistency checker emitted by `buildHarnessFileMap`, performing four checks: (A) the ordered phases table in `00-overview.md` matches frontmatter `status` values from each phase file, staying synchronized; (B) warning when a plan is all-done but not yet archived; (C) validating backlog ID format and monotonic ordering (4-digit zero-padded, e.g., `backlog/0001`, `backlog/0042`); (D) verifying bidirectional links between `status: blocked` phases and their corresponding `backlog/<id>` entries (each blocked phase must link to a backlog entry, and each entry's `source:` must point back).

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

## Harness Choice Option

When Claude Harness is enabled, users select which harness(es) to generate: **Claude**, **Codex**, or **Both**.

The `harness` field in `HarnessParams` accepts `'claude' | 'codex' | 'both'`, controlling which file sets are emitted by `buildHarnessFileMap`:

- `'claude'` — Claude harness only: CLAUDE.md, .claude/settings.json, .claude/agents/*.md, .claude/scripts/agent-guard.mjs
- `'codex'` — Codex harness only: AGENTS.md, .codex/, .agents/skills/, Codex-specific hook scripts
- `'both'` — Full dual harness: both sets above

Shared files are emitted for any harness choice: docs tooling, agent-guard-core.mjs, docs-first-reminder.sh, .agents/memory/, knowledge base (plans/, backlog/, docs/).

## Shared Harness Output

**Emitted for any harness choice** (`'claude'`, `'codex'`, or `'both'`). Knowledge-base paths use the `{{baseDir}}` token for selective prefixing; tool-discovery paths stay bare at root.

**Folder layout:**
- **Beaver's dogfood** (`baseDir = '.beaver'`): `.beaver/plans/`, `.beaver/docs/`, `.beaver/backlog/`, `.beaver/scripts/`
- **Scaffolded projects** (`baseDir = ''`): `plans/`, `docs/`, `backlog/`, `scripts/` at root

| File / Directory | Purpose |
|---|---|
| `AGENTS.md` (root) | Canonical AI harness entry point for all modes; holds behavioral guidelines, project overview, agent routing, PARK RULE, MEMORY LIFECYCLE, DOCS-FIRST rules, and renderer-filled provider-adapter notes |
| `{{baseDir}}/plans/README.md` | Plan artifact guide and lifecycle documentation |
| `{{baseDir}}/backlog/README.md` | Backlog artifact guide (append-only log of deferred work) |
| `{{baseDir}}/docs/README.md` | Docs knowledge-base guide |
| `{{baseDir}}/docs/INDEX.md` | Auto-generated index of all knowledge-base docs (regenerated by `build-docs-index.mjs`) |
| `{{baseDir}}/docs/_template.md` | Template for new docs; includes frontmatter schema enums for the project |
| `{{baseDir}}/docs/<feature-specs>` | Seed docs passed in via `HarnessParams.seedDocs` |
| `{{baseDir}}/scripts/_docs-shared.mjs` | Shared frontmatter schema helpers for docs tooling |
| `{{baseDir}}/scripts/build-docs-index.mjs` | Regenerates `docs/INDEX.md` from frontmatter |
| `{{baseDir}}/scripts/lint-docs-frontmatter.mjs` | Validates doc frontmatter completeness and correctness |
| `{{baseDir}}/scripts/validate-structure.mjs` | Validator: checks agents' `tools` lists respect `writeScope` constraints + memory budget (warn > 15 bullets/100 lines, fail at 2×) |
| `{{baseDir}}/scripts/validate-plans.mjs` | Validator: checks plan/backlog consistency (ordered phases, bidirectional links, backlog ID format) |
| `{{baseDir}}/scripts/docs-first-reminder.sh` | Hook script; logs reminder to read docs before opening source files (triggered by symbol name) |
| `{{baseDir}}/scripts/agent-guard-core.mjs` | Core ACL implementation; imported by both Claude (`agent-guard.mjs`) and Codex (`agent-guard-codex.mjs`) adapters |
| `.agents/memory/<agent>/MEMORY.md` (root) | Per-agent short-term memory seeds (`dev`, `docs-writer`, `planner`, `advisor`, and optionally `test-writer`) — see "Agent Memory Lifecycle" |
| `.agents/skills/<slug>-memory-retro/SKILL.md` (root) | Memory hygiene skill (dedupe / delete stale / promote to docs) |

## Claude Harness Output

**Emitted when** `harness: 'claude'` or `harness: 'both'` (in addition to Shared Harness Output).

| File / Directory | Purpose |
|---|---|
| `CLAUDE.md` | Claude Code adapter; imports AGENTS.md via `@AGENTS.md` directive; adds Claude-only skills and settings notes |
| `.claude/settings.json` | Claude Code workspace config (env vars, permissions, hooks) |
| `.claude/scripts/agent-guard.mjs` | Claude adapter; enforces agent `writeScope` boundaries |
| `.claude/agents/dev.md` | Dev agent (project-specific, write-capable) |
| `.claude/agents/docs-writer.md` | Docs-writer agent (read-only docs, writes to `docs/`) |
| `.claude/agents/planner.md` | Planner agent (writes resumable plans to `plans/`) |
| `.claude/agents/advisor.md` | Advisor agent (read-only: trade-off analysis and brainstorming) |
| `.claude/agents/scout.md` | Scout agent (read-only: cheap factual lookups) |
| `.claude/agents/test-writer.md` | Test-writer agent (optional, only if testing framework selected) |
| `.claude/skills/<slug>-conventions/SKILL.md` | Conventions skill (real file; Claude reads from `.claude/skills/`) |
| `.claude/skills/<slug>-docs/SKILL.md` | Docs skill (real file; Claude reads from `.claude/skills/`) |

### Agent Memory Lifecycle

Agent memory is SHORT-TERM with an explicit lifecycle, enforced by mechanism not discipline (decided 2026-07-05, backlog/0015):

- **Budget**: ≤ 15 bullets / ≤ 100 lines per `MEMORY.md`. `scripts/validate-structure.mjs` WARNs over budget and ERRORs (exit 1) at 2× budget.
- **Promote**: a bullet that is durable, architecture-level truth (formats, protocols, design rules) is moved into the relevant `docs/` spec by docs-writer, then deleted from memory. Memory holds only recent gotchas, temp state, and facts not yet stable enough for docs.
- **Invalidate**: any change renaming a path/scope/convention must update or delete memory bullets referencing the old state in the same change.
- **Distill triggers**: (a) the emitted `<slug>-memory-retro` skill (run when the validator warns, or on request); (b) plan archival — `plans/README.md`'s lifecycle section requires a memory retro when closing a plan. The seed template (`.agents/memory/_seed.md`) states these rules in its header so every agent sees them each session.

## Codex Harness Output

**Emitted when** `harness: 'codex'` or `harness: 'both'` (in addition to Shared Harness Output).

| File / Directory | Purpose |
|---|---|
| `.codex/hooks.json` | Codex hook configuration (PreToolUse, PostToolUse handlers) |
| `.codex/agents/dev.toml` | Dev agent (project-specific) |
| `.codex/agents/docs-writer.toml` | Docs-writer agent |
| `.codex/agents/planner.toml` | Planner agent |
| `.codex/agents/advisor.toml` | Advisor agent |
| `.codex/agents/scout.toml` | Scout agent |
| `.agents/skills/<slug>-conventions/SKILL.md` | Conventions skill (real file; Codex reads from `.agents/skills/`) |
| `.agents/skills/<slug>-docs/SKILL.md` | Docs skill (real file; Codex reads from `.agents/skills/`) |
| `.agents/skills/<slug>-memory-retro/SKILL.md` | Memory hygiene skill twin |
| `.codex/scripts/agent-guard-codex.mjs` | Codex adapter; enforces agent `writeScope` boundaries via PreToolUse hook |
| `.codex/scripts/codex-subagent-start.mjs` | Codex hook handler for SubagentStart events (agent identity reconstruction) |
| `.codex/scripts/codex-subagent-stop.mjs` | Codex hook handler for SubagentStop events |
| `.codex/scripts/codex-permission-guard.mjs` | Codex hook handler for permission enforcement |

**Note:** Skills are real files under `.agents/skills/`, not symlinks — symlinks do not survive npm pack or CI. Both Claude (which reads from `.claude/skills/`) and Codex (which reads from `.agents/skills/`) receive their own copies of the same skills content.

**Codex integration facts** (promoted from dev agent memory, 2026-07-05):
- `.codex/agents/<name>.toml` fields: `name`, `description`, `developer_instructions` (triple-quoted multiline), optional `sandbox_mode`, `model`.
- Codex PreToolUse hook payloads contain `turn_id`, `tool_name`, `tool_use_id`, `tool_input`, `session_id`, `cwd`, `hook_event_name`, `model`, `permission_mode` — there is NO equivalent of Claude's `agent_type` field (verified against developers.openai.com/codex/hooks). Agent identity is reconstructed via the SubagentStart/SubagentStop hook scripts instead. The deny response format is the same as Claude's (`hookSpecificOutput.permissionDecision = "deny"`).
- hooks.json discovery is at `<repo>/.codex/hooks.json`; no project-root env var is documented — hook commands use `$(git rev-parse --show-toplevel)`.

## HarnessParams Structure

The `HarnessParams` object (passed from per-type templates to `buildHarnessFileMap`) carries:

```typescript
interface HarnessParams {
  projectName: string;           // validated project directory name
  productDescription: string;    // required: one-line project summary
  projectSections: string;       // rendered project-type-specific stack/conventions/architecture body for AGENTS.md
  extraRoutingRows: string;      // rendered extra agent routing table rows (e.g., test-writer if testing is on)
  testing: boolean;              // whether a test framework is selected (controls test-writer emission)
  harness: 'claude' | 'codex' | 'both';  // which harness files to emit
  baseDir: string;               // prefix for knowledge-base paths ('.beaver' for beaver, '' for scaffolded projects); default ''
  seedDocs?: string;             // optional: seed docs passed from project type
  claudeExtras?: string;         // optional: Claude-only content lines for CLAUDE.md adapter
}
```

**Field notes:**
- `baseDir`: Selective prefix for knowledge-base paths (`plans/`, `docs/`, `backlog/`, `scripts/`) only. Tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, AGENTS.md, CLAUDE.md) always render at root regardless of baseDir.
  - Beaver's dogfood: `baseDir = '.beaver'` → `.beaver/plans/`, `.beaver/docs/`, etc.
  - Scaffolded projects: `baseDir = ''` (empty) → `plans/`, `docs/`, etc. at root
  - Default: empty string (`''`) for backward compatibility with existing scaffolded projects

Replaces the pre-0016 `claudeMd: string` field with the split `projectSections` + `extraRoutingRows` + optional `claudeExtras`, enabling per-provider rendering while keeping content (AGENTS.md project sections) neutral.

## Key Decisions

### 1. AGENTS.md is Canonical for All Modes
AGENTS.md, the open standard, is emitted for every harness choice and holds all vendor-neutral content (guidelines, project overview, agent routing, rules). This reverses the prior Claude-centric design where CLAUDE.md was treated as primary and Codex users had to read it first via a pointer.

**Rationale:** Vendor neutrality; single source of truth for shared knowledge; Codex gets an equally first-class experience.

### 2. CLAUDE.md = Thin Adapter
CLAUDE.md (Claude/both modes only) is a pure adapter: it opens with `@AGENTS.md` (import directive for Claude Code) and then adds Claude-only content. Claude Code does not read AGENTS.md natively (open issue anthropics/claude-code#34235, decided 2026-07-05), so the adapter pattern bridges the gap without requiring Codex to duplicate or bloat AGENTS.md.

**Rationale:** Minimal cognitive load; Claude users get one import + Claude-specific notes; Codex users read AGENTS.md directly.

### 3. Per-Provider Capability Asymmetries Live in the Renderer Layer
Differences between Claude and Codex (e.g., Claude has `permissions.ask`, Codex has PreToolUse hooks; Claude has memory natively, Codex needs files; Claude has `.claude/skills/`, Codex has `.agents/skills/`) are documented in AGENTS.md's "Provider Adapters" section (filled at render time), **never** in the content layer or AGENTS.md token placeholders.

**Rationale:** Content stays clean and reusable; provider notes are explicitly scoped and easy to update; no vendor bias in the source data.

### 4. Agents are ALWAYS Defined Declaratively
Agents are defined in a minimalist registry (4 fields: name, model, writeScope, memory) with derived constraints (read-only → no write tools, agent-guard parameterized from registry, validator checks consistency). This reverses the "no project-type registry" principle ONLY for agents because the template will host many and hand-maintained copies drift.

**Rationale:** Scalability; consistency; validator-enforced invariants prevent misconfigurations.

### 5. Product Description is Required
When AI Harness is enabled, the user is prompted for a one-line project summary. This field is rendered into AGENTS.md's `## Project Overview` section, providing all agents (especially advisor and dev on first run) with immediate context about the project's domain and purpose.

**Rationale:** Faster agent onboarding; better decision-making; agents don't have to reverse-engineer the project from source.

### 6. Harness Choice is Selectable
Users pick Claude, Codex, or Both at scaffold time. The `buildHarnessFileMap` function is fully dual-harness-aware and emits appropriate file sets per selection.

**Rationale:** Flexibility; future-proofs for new providers; allows teams to test multiple harnesses in parallel.

### 7. Chrome-extension Gets No Testing Menu
Chrome-extension gets no testing menu (and therefore no test-writer) for now.

**Rationale:** Limited scope; test-writer is react-vite-only until testing patterns stabilize for extensions.

### 8. Backlog as File-Based Append-Only Log
Backlog is a file-based append-only log, not GitHub Issues — agents read/write it directly, it travels with git, no network round-trip. Single source of truth to avoid drift.

**Rationale:** Simplicity; agents own the full decision loop; no external dependency; history is preserved locally.

### 9. Park Rule is Mandatory
The park rule is mandatory in the harness-emitted AGENTS.md and agent templates so every user of the harness applies it consistently.

**Rationale:** Token efficiency; blocks infinite retry loops; establishes a shared protocol for blocked work.

### 10. Beaver Dogfoods the Same Harness Shape
The beaver repo itself dogfoods the same harness (this docs/ tree, AGENTS.md, CLAUDE.md, .claude/, plans/, backlog/), with CLI-specific enums.

**Rationale:** Eats its own dog food; discovers UX issues early; harness is battle-tested by the dev team.

### 11. Knowledge-Base Paths Are Movable via {{baseDir}} Token
The harness uses a selective `{{baseDir}}` token to prefix knowledge-base paths (plans/, docs/, backlog/, scripts/) while keeping tool-discovery paths (`.claude/`, `.codex/`, `.agents/`, AGENTS.md, CLAUDE.md) fixed at root.

**Rationale:** 
- **Beaver**: `baseDir = '.beaver'` moves knowledge-base to `.beaver/` for a cleaner root, keeping product code (`src/`, `test/`) at the top level.
- **Scaffolded projects**: `baseDir = ''` (empty string) emits at root, matching user expectations (no hidden directories).
- **Single codebase, many layouts:** one harness rendering engine serves both beaver and scaffolded projects without duplication or environment-specific branching.
- **Future-proof:** other CLI tools can adopt `.beaver/` convention (like `.next/`, `.vite/`, `.cache/`) without forking the harness code.

## Related Files
- src/scaffold/shared/harness-setup.ts
- src/scaffold/react-vite/templates/harness-setup.ts
- src/scaffold/chrome-extension/templates/harness-setup.ts
- src/scaffold/harness-only/templates/react-vite-skeleton.ts
- src/scaffold/harness-only/templates/chrome-extension-skeleton.ts
- src/scaffold/harness-only/templates/generic-skeleton.ts
- .claude/scripts/agent-guard.mjs
- scripts/validate-structure.mjs
- scripts/validate-plans.mjs
- src/options/chrome-extension/index.ts
- src/options/react-vite/index.ts
- src/options/harness-only/index.ts
- backlog/README.md
- plans/README.md
- docs/architecture/agent-workflow.en.md (parent feature; covers park rule and backlog lifecycle)
- harness-assets/AGENTS.md (canonical skeleton asset; tokens: projectName, productDescription, projectSections, extraRoutingRows, adapterNotes)
- harness-assets/CLAUDE.md (adapter skeleton asset; tokens: projectName, slug, testAuthorSkillRef, claudeExtras)
