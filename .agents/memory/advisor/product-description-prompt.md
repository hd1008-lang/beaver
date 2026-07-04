---
name: product-description-prompt
description: Trade-offs of capturing a project/product description at scaffold time and feeding it to the generated Claude harness
metadata:
  type: project
---

Idea explored 2026-06-21: add a prompt for a "product description" during `beaver` / harness-only, store it so generated agents understand what the project does.

**Why:** generated harness agents (dev/advisor/etc.) currently get architecture/stack context from CLAUDE.md but zero domain/product context, so they can't reason about *what the app is for*.

**How to apply / key findings:**
- The harness CLAUDE.md (`src/scaffold/react-vite/templates/claude-setup.ts` `claudeMdTemplate`) already has a `## Project Overview` section that lists stack only — that is the natural, zero-new-file home for a one-line description. No new config file needed.
- Free-text `input()` prompt pattern already exists (`src/options/harness-only/index.ts` menuProjectName) — adding a description prompt is mechanically trivial; the cost is UX friction + maintenance of one more cart field threaded through types + every claude-setup template, not implementation difficulty.
- Recommended shape: make it OPTIONAL (skippable, empty default), one line, injected into CLAUDE.md `## Project Overview`. Do NOT invent a new `.beaver/` config file — that adds a read path nothing else consumes and a second source of truth vs CLAUDE.md.
- Recommended against: inferring from project name (too thin), reading from git (no description there), or a multi-line/structured product brief (that is what the home.spec.en.md seed doc + docs-writer agent are already for — a free-text brief would duplicate docs/ and drift).
- Cart-conditional rule still applies: if description is empty, emit the existing stack-only Project Overview unchanged (no empty heading).
- For harness-only/GENERIC skeleton: even higher value there (no stack inference possible), but skeletons are intentionally fixed FileMaps — threading a cart field in is the same one-field change.
