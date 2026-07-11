---
phase: 02
title: Generate agent .md files and CLAUDE.md harness table from AGENTS
status: done
depends_on: [01]
---

## Goal

Replace every hand-written agent `.md` template function and the CLAUDE.md routing table with derivations from the `AGENTS` constant, so the five core agents' frontmatter (`model`, `tools`, `memory`) and the routing table are never duplicated.

## Steps

- [x] In `src/scaffold/shared/claude-setup.ts`, add a pure helper `agentTools(agent: AgentDef): string` that derives the `tools:` frontmatter line from `writeScope`:
  - If `writeScope` is empty (read-only): return `"Read, Grep, Glob, Bash, WebFetch, WebSearch, Skill, TodoWrite"` for advisor; `"Read, Grep, Glob, Skill"` for scout. Since tool lists can't be purely derived from `writeScope` alone (scout drops Bash/WebFetch), drive per-name overrides via a `toolOverride?: string[]` optional fifth field added to `AgentDef`, defaulting to the read-only superset. **Do not add a fifth field to the spec schema** — `toolOverride` is a template-implementation detail, not part of the 4-field spec schema. Keep it unexported/internal if needed.
  - If `writeScope` is non-empty (can write): return `"Read, Grep, Glob, Write, Edit, Skill, TodoWrite"`. (Bash is excluded from write-capable agents unless they explicitly need it — dev currently has no Bash in the template, confirm by checking `devAgentTemplate` in `claude-setup.ts` line 490 area.)
  - Planner is write-capable (`writeScope: ['plans/']`) but also has no Bash — confirm current template and match exactly.
- [x] Add a helper `agentMemoryFrontmatter(agent: AgentDef): string` that returns `"memory: project"` if `agent.memory` is true, else omits the line (returns `""`).
- [x] Refactor `docsWriterAgentTemplate`, `plannerAgentTemplate`, `advisorAgentTemplate`, and `scoutAgentTemplate` to accept an `AgentDef` (looked up from `AGENTS` by name) and derive their `model:` and `tools:` frontmatter lines from it instead of hard-coding them. Keep the prose body of each template unchanged.
- [x] In `buildClaudeFileMap`, when writing the four agent files, look up the corresponding `AgentDef` from `AGENTS` by name (e.g. `AGENTS.find(a => a.name === 'planner')`) and pass it to the template function. The `dev` agent continues to come from `params.devAgent` (project-type-specific) — do NOT put dev in the derived path in this phase; that adds risk. Only the four shared agents (docs-writer, planner, advisor, scout) are refactored here.
- [x] Add a `claudeHarnessTableTemplate(agents: AgentDef[]): string` helper that generates the agent routing table rows seen in CLAUDE.md (the `| Task / trigger | Agent | Notes |` rows). Then update each project-type's CLAUDE.md template (`src/scaffold/react-vite/templates/claude-setup.ts` and `src/scaffold/chrome-extension/templates/claude-setup.ts`) to call this helper instead of hard-coding the table. The `dev` row and optional `test-writer` row remain project-type-specific and are appended separately.
- [x] Verify the file map output is byte-for-byte identical to what was produced before (or document any intentional wording changes in a comment). Row order change documented in comment at `claudeHarnessTableTemplate` in `src/scaffold/shared/claude-setup.ts`.
- [x] Run `npx tsc --noEmit` and `npm run build`.
- [x] Remove the temporary verify comment once output is confirmed correct.

## Verify

```bash
# Type-check:
npx tsc --noEmit

# Build:
npm run build

# Render the file map with a throwaway script to inspect agent .md content:
node -e "
  import('./dist/scaffold/shared/claude-setup.js').then(m => {
    const files = m.buildClaudeFileMap({
      projectName: 'test', slug: 'test',
      flowEnum: ['ui'], layerEnum: ['src', '_cross'],
      reminderTrigger: 'home',
      claudeMd: '# test',
      conventionsSkill: '---\nname: test-conventions\ndescription: test\n---\n',
      devAgent: '---\nname: dev\n---\ntest',
      seedDocs: [],
    });
    files.filter(f => f.relativePath.startsWith('.claude/agents/')).forEach(f => {
      console.log('=== ' + f.relativePath + ' ===');
      console.log(f.content.slice(0, 400));
      console.log();
    });
  });
"
```

Check that:
- Each agent `.md` file has `model: <correct>` and `tools: <correct>` frontmatter.
- `advisor` and `scout` have no `Write` or `Edit` in their `tools:` line.
- `planner` and `docs-writer` have `Write, Edit` in their `tools:` line.
- Prose bodies are unchanged from the current output.

## Notes / Risks

- The `dev` agent template is project-type-specific (it references the project name and project-specific patterns). Keep it passed in via `params.devAgent` — do not try to derive it from `AGENTS` in this phase. A future phase could unify it, but that adds scope.
- `advisorAgentTemplate` currently hard-codes `tools: Read, Grep, Glob, Bash, WebFetch, WebSearch, Skill, TodoWrite` (line 570 in `claude-setup.ts`). The spec says advisor is read-only (writeScope empty) — this is correct since none of those are Write/Edit. Preserve this exactly.
- `scoutAgentTemplate` hard-codes `tools: Read, Grep, Glob, Skill` — a strict read-only subset. This is NOT derivable from writeScope alone (advisor and scout both have empty writeScope but different tool sets). The `toolOverride` field (internal to templates, not in the spec schema) handles this correctly.
- The CLAUDE.md harness table template generates the shared rows only; each project type still appends its own dev row. Do not try to unify project-type dev rows in this phase.
- If the `claudeHarnessTableTemplate` helper changes any wording in the routing table compared to the current hand-written versions, record the diff in a comment rather than silently changing it — documentation accuracy matters.
