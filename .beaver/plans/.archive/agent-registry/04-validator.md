---
phase: 04
title: Add validate-structure.mjs emitted into generated projects
status: done
depends_on: [01, 02]
---

## Goal

Ship a `validate-structure.mjs` script (sibling to `lint-docs-frontmatter.mjs` in `.claude/scripts/`) that is emitted into every generated project and mechanically checks the derived invariants: read-only agents have no Write/Edit in their `tools:` list, no two agents share a primary owned directory, and all agent `.md` files listed in `.claude/agents/` are parseable.

## Steps

- [x] In `src/scaffold/shared/claude-setup.ts`, add a `validateStructureMjsTemplate(agents: AgentDef[]): string` pure function. The emitted script must:
  1. Read all `.md` files under `.claude/agents/` using `readdirSync` + `readFileSync`.
  2. Parse their YAML frontmatter (reuse or inline the minimal parser pattern from `_docs-shared.mjs` — do NOT import from it at runtime since the validator is standalone).
  3. For each agent file: check `tools:` value against `writeScope`. Specifically, look up the agent name in the baked-in `WRITE_SCOPES` map (same map as `agent-guard.mjs`, baked at generation time from the `agents` argument). If `writeScope` is empty, assert that the `tools:` value does not contain `Write` or `Edit`. Emit a clear error line if violated.
  4. Check uniqueness of primary owned directories: collect the first element of each agent's `writeScope` (the "primary dir"). Assert no two agents share the same non-empty primary dir. Emit a clear error line if violated.
  5. Exit non-zero if any errors, zero if clean. Format: same style as `lint-docs-frontmatter.mjs` (`console.error` for failures, `console.log` for pass).
- [x] Add the file to `buildClaudeFileMap` in `src/scaffold/shared/claude-setup.ts`:
  ```
  { relativePath: '.claude/scripts/validate-structure.mjs', content: validateStructureMjsTemplate(AGENTS) }
  ```
  Place it adjacent to `lint-docs-frontmatter.mjs` in the array.
- [x] Also add a `validate-structure.mjs` entry to the harness-only skeleton templates: since they call `buildClaudeFileMap`, this is automatic — verify by checking `getGenericHarnessFileMap` output in Verify.
- [x] Run `npx tsc --noEmit` to confirm no TypeScript errors.
- [x] Run `npm run build` to emit `dist/`.
- [x] Smoke-test the emitted validator against the beaver repo's own `.claude/agents/` (they should all pass since they were authored correctly):

```bash
# Emit the validator to a temp location and run it against this repo's .claude/agents/:
npx tsx -e "
  import { buildClaudeFileMap } from './src/scaffold/shared/claude-setup.ts';
  import { writeFileSync } from 'fs';
  const files = buildClaudeFileMap({
    projectName: 'test', slug: 'test',
    flowEnum: ['ui'], layerEnum: ['src', '_cross'],
    reminderTrigger: 'home',
    claudeMd: '# test',
    conventionsSkill: '---\nname: test-conventions\ndescription: test\n---\n',
    devAgent: '---\nname: dev\n---\ntest',
    seedDocs: [],
  });
  const v = files.find(f => f.relativePath === '.claude/scripts/validate-structure.mjs');
  writeFileSync('/tmp/validate-structure.mjs', v.content);
"
node /tmp/validate-structure.mjs
```

- [x] Confirm the validator exits 0 against the beaver repo's own `.claude/agents/`.

## Verify

```bash
npx tsc --noEmit
npm run build
node /tmp/validate-structure.mjs   # as constructed above
```

Expected output from the smoke-test: `validate-structure: passed.` (or equivalent) with exit code 0.

To confirm failure detection works, temporarily edit `/tmp/validate-structure.mjs` to add a fake read-only agent with `Write` in tools and re-run — it must exit non-zero with a descriptive error. (This is a manual check, not an automated test.)

## Notes / Risks

- The validator bakes the `WRITE_SCOPES` map at template generation time (when beaver scaffolds a project). The agent `.md` files it checks are runtime files in the generated project. This means the validator is checking the generated output against the spec it was generated from — a self-consistency check, not a live registry read. This is intentional and desirable.
- The validator does NOT parse the full YAML spec — it uses the same minimal line-by-line parser as `_docs-shared.mjs`. This is sufficient for the flat frontmatter format used in agent `.md` files.
- The `dev` agent is project-type-specific and passed in via `params.devAgent` — its `tools:` line may differ from what the registry would derive. The validator should still check it: look it up by name in the baked-in map. If `dev` is in the map with a non-empty `writeScope`, the validator should NOT flag it for having Write/Edit — only flag read-only agents (empty writeScope) that have write tools.
- If the beaver repo's `.claude/agents/advisor.md` has `tools:` containing `Write` or `Edit`, the smoke-test will fail. Before running, verify the advisor's tools line: it currently reads `tools: Read, Grep, Glob, Bash, WebFetch, WebSearch, Skill, TodoWrite` — no Write/Edit, so it should pass.
- Keep the emitted script small. Do NOT import from `_docs-shared.mjs` — inline only what's needed (the frontmatter parser is ~20 lines).
