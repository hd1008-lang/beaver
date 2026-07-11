@AGENTS.md

AGENTS.md (repo root) is the canonical project document for {{projectName}} — behavioral
guidelines, project overview, agent routing, PARK RULE, and DOCS-FIRST rule all live there.
Read it first and in full. This file only adds Claude Code specifics.

## Claude Code specifics

Skills: `.claude/skills/{{slug}}-conventions` (architecture depth), `.claude/skills/{{slug}}-docs`
(how to query the knowledge base), `.claude/skills/{{slug}}-memory-retro` (memory hygiene){{testAuthorSkillRef}}.

- `.claude/settings.json` — workspace config: environment variables, tool permissions
  (`allow`/`ask`/`deny`), and hook registration.
- `.claude/scripts/agent-guard.mjs` — Claude adapter enforcing each agent's `writeScope`
  boundary via a `PreToolUse` hook on `Write`/`Edit`/`MultiEdit`.
{{claudeExtras}}
