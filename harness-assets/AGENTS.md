# {{projectName}}

## Behavioral Guidelines

**Think Before Coding** — state assumptions explicitly; if multiple interpretations exist, present them; if something is unclear, stop and ask.
**Simplicity First** — minimum code that solves the problem; no speculative features, abstractions, or configurability.
**Surgical Changes** — touch only what the request requires; match existing style; every changed line traces to the request.
**Goal-Driven Execution** — turn tasks into verifiable success criteria before starting; loop until verified.

## Project Overview

{{productDescription}}

{{projectSections}}

## Agent Routing

| Task / trigger | Agent | Notes |
|---|---|---|
| Brainstorming / trade-off analysis / "what's the best approach?" before any change | `advisor` | read-only; deepest source mental model; recommends, never edits |
| Quick factual lookup about the code/docs (answer + `path:line`) | `scout` | read-only; cheap; for facts, not design reasoning |
| Decomposing a story into a resumable plan | `planner` | owns `{{plansDir}}/`; writes phase files only, never code |
| Analyzing requirements, writing/updating feature docs | `docs-writer` | owns `{{docsDir}}/`; rebuilds INDEX.md after every change |{{extraRoutingRows}}

**PARK RULE (anti-loop):** when executing a step/phase, if it fails twice and the cause isn't fixable right now (missing info, needs a user decision, environment, or out-of-scope), STOP — don't retry a third time. Set the phase `status: blocked`, file a `backlog/<id>` entry (record what was already tried so it isn't repeated), link both ways, tell the user it was parked, and move on to the next workable item. See `{{backlogDir}}/README.md`.

Each agent has persistent memory at `.agents/memory/<agent>/MEMORY.md` — agents read it on start and append new gotchas. Do NOT use the general assistant for work an agent owns — always delegate.

**MEMORY LIFECYCLE:** agent memory is short-term, not an append-only log — budget ≤ 15 bullets / ≤ 100 lines per file (`node {{scriptsDir}}/validate-structure.mjs` warns over budget, fails at 2×). Durable, architecture-level truth gets promoted into `{{docsDir}}/` and deleted from memory; one-off fix notes already recorded in `{{plansDir}}/` or `{{backlogDir}}/` don't belong there. Any change that renames a path/scope/convention must update or delete memory bullets referencing the old state in the same change. Over budget, or when archiving a plan, run the project's memory-retro skill.

## Task Documentation Convention

After any non-trivial fix or new pattern: copy `{{docsDir}}/_template.md`, fill the frontmatter, save as `{{docsDir}}/features/<feature>/<topic>.en.md` (or `{{docsDir}}/architecture/` for cross-cutting topics), then run `node {{scriptsDir}}/build-docs-index.mjs` and commit the doc together with `INDEX.md`. Validate with `node {{scriptsDir}}/lint-docs-frontmatter.mjs`.

**DOCS-FIRST RULE:** for any request to describe, explain, or modify a documented feature, you MUST grep `{{docsDir}}/` frontmatter and read the relevant docs BEFORE opening source files — and state what the docs already covered. Start at `{{docsDir}}/INDEX.md`.

**Operating loop:** finish a non-trivial task → write a doc from `{{docsDir}}/_template.md` → rebuild `INDEX.md` → commit together; agents update their `MEMORY.md` when they learn a gotcha.

## Provider Adapters

{{adapterNotes}}
