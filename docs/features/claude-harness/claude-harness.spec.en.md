---
title: Claude Harness Generation — Feature Spec
feature: claude-harness
flow: templates
layer: scaffold
status: active
lang: en
related: []
keywords: [claude-setup, harness, ai-menu, buildclaudefilemap, agents, skills]
updated: 2026-06-10
---

# Claude Harness Generation — Feature Spec

## Context
Scaffolded projects ship with an optional Claude Code harness (menu "Choose an AI setup"). Available for react-vite AND chrome-extension project types.

## Root Cause / Key Finding
The harness was originally react-vite-only and leaked unselected options (Zustand in the BPR diagram, an always-present test-writer agent, routing/state docs enums) into generated files — noisy context for the downstream agent.

## Solution / Pattern
- Shared, project-agnostic pieces (docs tooling, settings.json, docs skill, docs-writer agent, memory seeds) live in `src/scaffold/shared/claude-setup.ts` as `buildClaudeFileMap(params: ClaudeHarnessParams)`.
- Each project type renders its own CLAUDE.md, conventions skill, and dev agent, and passes them in (`src/scaffold/react-vite/templates/claude-setup.ts`, `src/scaffold/chrome-extension/templates/claude-setup.ts`).
- Everything is strictly cart-conditional: flow/layer enums, reminder trigger, key patterns, naming rows, and the test-writer agent (emitted only when `params.testing` is set — react-vite with a test framework chosen; never for chrome-extension).
- Agent models: dev = sonnet, docs-writer = haiku, test-writer = haiku.

## Key Decisions
- Parameter object over inheritance/abstraction — only ~10 fields, no project-type registry.
- Chrome-extension gets no testing menu (and therefore no test-writer) for now.
- The beaver repo itself dogfoods the same harness shape (this docs/ tree, .claude/), with CLI-specific enums.

## Related Files
- src/scaffold/shared/claude-setup.ts
- src/scaffold/react-vite/templates/claude-setup.ts
- src/scaffold/chrome-extension/templates/claude-setup.ts
- src/options/chrome-extension/index.ts
