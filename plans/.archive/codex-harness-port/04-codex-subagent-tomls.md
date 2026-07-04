---
phase: 04
title: codex-subagent-tomls
status: done
depends_on: [03]
---

## Goal

Create `.codex/agents/*.toml` for all five beaver agents (advisor, dev, docs-writer, planner, scout) — each TOML is a thin translation of the corresponding `.claude/agents/*.md`, using the same behavioral instructions but in Codex's native TOML format.

## Steps

- [x] Read each `.claude/agents/*.md` file in full before writing any TOML. The frontmatter (`name`, `description`) and body (`developer_instructions`) map directly; `model` and `sandbox_mode` are optional.
- [x] Write `.codex/agents/advisor.toml` — fields: `name`, `description` (from Claude frontmatter description, trimmed of `<example>` XML which is Claude-specific), `developer_instructions` (the body text from advisor.md, adapted: remove `.claude/`-specific paths where Codex equivalents differ, keep behavioral rules intact). Set `sandbox_mode = "network-disabled"` (read-only advisor should not have outbound network by default unless needed for WebFetch).
- [x] Write `.codex/agents/dev.toml` — translate dev.md. `developer_instructions` must include: onboarding protocol referencing `docs/INDEX.md`, park rule, hard rules, path references (note `.codex/` paths where relevant alongside `.claude/` paths). Keep skill loading instruction referencing `beaver-conventions`.
- [x] Write `.codex/agents/docs-writer.toml` — translate docs-writer.md. Instructions reference `docs/` and `docs/INDEX.md` commands. Hard rules: never edit `src/`, never write code.
- [x] Write `.codex/agents/planner.toml` — translate planner.md. Instructions reference `plans/` and `backlog/`. Hard rule: writes only under `plans/`.
- [x] Write `.codex/agents/scout.toml` — translate scout.md. Read-only agent; `sandbox_mode = "network-disabled"` or equivalent if Codex supports it.
- [x] Verify TOML syntax (python3 tomllib validated all 5): run `node -e "import('.codex/agents/dev.toml')"` will fail (TOML not native JSON), so instead run a minimal TOML lint: `npx --yes @iarna/toml < .codex/agents/dev.toml` or use `python3 -c "import tomllib; open('.codex/agents/dev.toml','rb')" ` — or simply inspect manually for balanced quotes and no stray commas.

## Verify

- Five files exist: `.codex/agents/{advisor,dev,docs-writer,planner,scout}.toml`.
- Each file has at minimum `name`, `description`, and `developer_instructions` fields.
- `developer_instructions` for each agent preserves the core behavioral rules from the corresponding `.claude/agents/*.md`.
- No `.claude/`-specific XML examples (`<example>`, `<commentary>`) appear verbatim in TOML (Codex does not parse these).
- TOML is well-formed (no syntax errors on manual inspection).

## Notes / risks

**Two files per agent is intentional (user confirmed)** — Claude uses MD+YAML frontmatter; Codex uses TOML. The parser difference makes code-gen over-engineering for 5 agents. Write them by hand.

**`developer_instructions` is a TOML multi-line string** — use `"""..."""` (triple-quoted) for multi-line. Escape any `"""` that appear in the body (unlikely but possible in example code blocks).

**Behavioral parity, not byte-for-byte copy** — Claude agent files contain Claude-specific idioms (e.g., `$CLAUDE_PROJECT_DIR` env var in hook commands, XML example tags). Codex versions should preserve the behavioral intent while adapting syntax. Do not copy the XML example blocks verbatim into TOML.

**`model` field** — Codex TOML agents can specify `model`. The user's context uses `sonnet` in Claude frontmatter. For Codex, use the equivalent OpenAI model (e.g., `o4-mini` or `codex-mini-latest`). Leave blank to inherit from parent if unsure — do not hardcode a model that may not exist.

**`mcp_servers`** — omit unless a specific MCP server is needed. Inherited from parent.

**Planner TOML hard rule re: `.codex/` writes** — the planner's write scope is `plans/`. Its TOML `developer_instructions` should note that the Codex guard (phase 05) will enforce this. Reference `.codex/agents/planner.toml` hard rules the same way `planner.md` does.
