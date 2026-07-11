---
phase: 03
title: Generalize planner-guard into a registry-driven path guard
status: done
depends_on: [01]
---

## Goal

Replace the hard-coded planner-specific guard template with a general `agent-guard.mjs` template that is parameterized from the `AGENTS` registry: it reads each agent's `writeScope` at generation time and bakes the allowed-paths map into the emitted script, so the guard enforces every agent's scope without per-agent manual updates.

## Steps

- [x] In `src/scaffold/shared/claude-setup.ts`, replace `plannerGuardMjsTemplate()` with `agentGuardMjsTemplate(agents: AgentDef[]): string`. The new template bakes a `WRITE_SCOPES` map (agent name → allowed path prefixes) from the `agents` argument into the emitted `.mjs` file. The emitted logic:
  1. Parse the `PreToolUse` payload.
  2. Look up `payload.agent_type` in the baked-in `WRITE_SCOPES` map. If the agent is not in the map, pass through (unknown agent = main thread or future agent).
  3. For agents WITH a map entry: allow if the normalized relative path starts with any entry in the agent's allowed prefixes OR starts with `.claude/agent-memory/<agentName>/` (implicit per spec).
  4. Deny and emit the same JSON structure as today if none of the prefixes match.
  5. For agents whose writeScope is empty (advisor, scout): they should never trigger a Write/Edit at all — if they do, the deny message should say "read-only agent may not write any file."
- [x] Update the `buildClaudeFileMap` call in the file-map array: change the key from `'.claude/scripts/planner-guard.mjs'` to `'.claude/scripts/agent-guard.mjs'` and call `agentGuardMjsTemplate(AGENTS)` (pass only the core unconditional agents — the optional test-writer, if present, needs its `writeScope` appended; handle via a conditional).
- [x] Update `claudeSettingsTemplate()`: change the hook command from `planner-guard.mjs` to `agent-guard.mjs`.
- [x] If `params.testing` is set, the emitted `agent-guard.mjs` must also include the `test-writer` agent's writeScope entry. Add a `testingAgentDef?: AgentDef` optional field to `ClaudeHarnessParams`, or compute the merged agents list inside `buildClaudeFileMap` before calling `agentGuardMjsTemplate`. The simpler approach: build `const guardAgents = [...AGENTS, ...(params.testing ? [TEST_WRITER_DEF] : [])]` where `TEST_WRITER_DEF` is a local constant (not in `AGENTS`) defining test-writer's writeScope (e.g. `['src/', 'test/', 'tests/', 'e2e/', 'playwright/']`).
- [x] In the harness-only skeleton templates (`src/scaffold/harness-only/templates/generic-skeleton.ts`, `react-vite-skeleton.ts`, `chrome-extension-skeleton.ts`): these call `buildClaudeFileMap` and inherit the guard automatically — no changes needed to these files as long as the emitted filename in `claudeSettingsTemplate` changes consistently.
- [x] Run `npx tsc --noEmit` and `npm run build`.

## Verify

```bash
npx tsc --noEmit
npm run build

# Render and inspect the emitted guard script:
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
    const guard = files.find(f => f.relativePath === '.claude/scripts/agent-guard.mjs');
    console.log(guard?.content ?? 'NOT FOUND');
  });
"
```

Check that:
- The emitted file is named `agent-guard.mjs` (not `planner-guard.mjs`).
- The `WRITE_SCOPES` map contains entries for `dev`, `docs-writer`, `planner`, `advisor`, `scout`.
- `advisor` and `scout` map to `[]` (empty scope — deny all writes).
- `planner` maps to `['plans/', '.claude/agent-memory/planner/']` (or the implicit memory path is added at runtime by the guard logic).
- The `settings.json` hook command references `agent-guard.mjs`.
- Running the guard manually with a fake planner payload targeting `src/foo.ts` produces a `deny` response:

```bash
node -e "
  process.stdin.push(JSON.stringify({
    agent_type: 'planner',
    tool_input: { file_path: 'src/foo.ts' },
    cwd: '/tmp'
  }));
  process.stdin.end();
" | node /tmp/agent-guard.mjs  # copy the emitted file to /tmp first
```

## Notes / Risks

- The rename from `planner-guard.mjs` to `agent-guard.mjs` affects any existing generated projects — they will still reference `planner-guard.mjs` in their `settings.json`. This is acceptable: this is a TEMPLATE change; existing projects are unaffected until they re-scaffold. Document this as a known migration gap.
- The beaver repo's own `.claude/scripts/planner-guard.mjs` is updated in phase 05 (dogfood sync) — do not touch it here.
- Test-writer's `writeScope` is a heuristic. If a project doesn't have a `tests/` dir (it may use `src/__tests__`), the guard will deny. This is acceptable for now — the guard is a backstop, not a precise ACL. Document in the emitted file's leading comment.
- `dev`'s `writeScope` is broad (phase 01 note). Denying writes outside it is a backstop, not primary access control — keep the guard lenient for `dev` rather than tight. `dev`'s `writeScope: ['src/', ...]` from phase 01 must be accurate enough that the guard never false-blocks legitimate dev writes.
- This phase does NOT need to touch `src/scaffold/react-vite/templates/claude-setup.ts` or the chrome-extension equivalent — they inherit the guard via `buildClaudeFileMap`.
