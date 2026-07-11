---
name: productdescription_field
description: Product Description is now a required field in HarnessParams, captured at harness-enable time and rendered into AGENTS.md Project Overview
metadata:
  type: project
---

## Product Description Field — Required Input for Claude Harness

**Decision:** Product Description (`productDescription: string`) is now **required** when scaffolding Claude Harness across all project types.

**Behavior:**
- **Capture:** When user enables Claude Harness (at menu time), they are prompted "Describe your project. What is it?" — this is a required, non-empty string input.
- **Render:** The value is injected into the scaffolded `AGENTS.md` file's `## Project Overview` section as the opening sentence, followed by architecture/stack details (post-0016; CLAUDE.md is a thin `@AGENTS.md` adapter).
- **Example:** User input: "B2B invoicing dashboard for SMEs" → AGENTS.md shows:
  ```
  ## Project Overview
  B2B invoicing dashboard for SMEs. Built with React + Vite + TypeScript...
  ```
- **Scope:** Applies to all project types: react-vite, chrome-extension, harness-only skeletons, and future types.
- **Purpose:** Provides agents (advisor, dev, docs-writer, planner, scout) with immediate project domain context during onboarding.

**Why this decision:**
Agents read the Project Overview to understand the business/product purpose. Without a concise domain summary, agents must infer purpose from technology stack alone, which wastes tokens and can miss domain-specific constraints (e.g., SME tax compliance vs. enterprise scaling requirements).

**Related:** [[ai-harness.spec.en.md]] (updated 2026-06-21)
