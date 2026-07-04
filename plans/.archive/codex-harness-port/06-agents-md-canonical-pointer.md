---
phase: 06
title: agents-md-canonical-pointer
status: done
depends_on: [04, 05]
---

## Goal

Establish a single canonical source for the "project context" file that both Claude (`CLAUDE.md`) and Codex (`AGENTS.md`) rely on — one file is the truth, the other is a one-line pointer — so behavioral guidelines, agent routing table, and park rule are never duplicated or drift.

## Steps

- [x] Confirm whether Codex reads `AGENTS.md` from the repo root, and whether `AGENTS.md` can contain a reference/include to another file (e.g. "see CLAUDE.md") rather than duplicating content. Check Codex docs or community notes (one lookup; don't loop).
- [x] Decision: `CLAUDE.md` remains canonical (it is already comprehensive and is referenced throughout `.claude/agents/*.md` and `plans/`). `AGENTS.md` becomes the pointer.
- [x] Write `AGENTS.md` at repo root with the following structure:
  ```
  # AGENTS.md

  > This file is the Codex entry point. All project context, agent routing, and
  > behavioral guidelines live in CLAUDE.md (repo root). Read that file first.

  <!-- Contents of CLAUDE.md are the source of truth. -->
  ```
  Then include a condensed copy of the **Agent Routing table** and **PARK RULE** section only — these are the two sections Codex absolutely needs to load up front. Everything else (stack details, scaffold architecture) can be read from CLAUDE.md on demand.
- [x] If Codex supports a native `include:` or `extends:` directive in AGENTS.md, use that instead of copying the two sections — fewer bytes to maintain. Only copy if no include mechanism exists.
- [x] Verify no behavioral content in `AGENTS.md` contradicts `CLAUDE.md`. The agent routing table in AGENTS.md must list the same five agents with the same trigger descriptions.

## Verify

- `AGENTS.md` exists at repo root.
- `AGENTS.md` references `CLAUDE.md` as the canonical source.
- Agent routing table in `AGENTS.md` matches the table in `CLAUDE.md` (same agents, same trigger descriptions).
- `CLAUDE.md` is unchanged.

## Notes / risks

**Keeping two files in sync** — even a "pointer" file with a copied routing table can drift. Consider adding a comment in CLAUDE.md: `<!-- Keep AGENTS.md routing table in sync when editing this section -->`. This is a human reminder, not automation.

**If Codex ignores AGENTS.md** — some Codex deployments may read `AGENTS.md` only for subagent discovery metadata, not for developer_instructions. In that case, the pointer approach is still correct — the subagent TOML files (phase 04) carry the behavioral instructions, and AGENTS.md is just the repo-level entrypoint.

**Scope note** — this phase does NOT modify any `.claude/agents/*.md` file. Those files are Claude's subagent definitions and are NOT affected by AGENTS.md.
