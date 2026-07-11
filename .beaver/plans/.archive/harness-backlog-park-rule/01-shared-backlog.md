---
phase: 01
title: Shared — backlog template + planner section
status: done
depends_on: []
---

## Goal

`buildClaudeFileMap` emits `backlog/README.md` in every scaffolded project, `plannerAgentTemplate` includes the "Backlog integration" section, and `plansReadmeTemplate` references the blocked-phase → backlog link — all matching what this repo dogfoods.

## Context

Relevant spec: `docs/architecture/agent-workflow.en.md` (backlog pattern and park rule).
Source file: `src/scaffold/shared/claude-setup.ts`.

- `plannerAgentTemplate` (lines 437-490) is missing the "## Backlog integration" section that exists in the repo's `.claude/agents/planner.md` (lines 46-49). It also lacks the `blocked` status mention in the phase-contract wording.
- `plansReadmeTemplate` (lines 492-534) is missing the "Blocked phases → backlog" section that exists in the repo's `plans/README.md` (lines 43-45).
- `buildClaudeFileMap` (lines 548-581) has `plans/README.md` but no `backlog/README.md`. The repo's source of truth for the backlog template content is `backlog/README.md` at the repo root.

## Steps

- [x] In `src/scaffold/shared/claude-setup.ts`, add a `backlogReadmeTemplate()` function immediately after `plansReadmeTemplate`. Model its content on the repo's `backlog/README.md` — it should include: the intro table (docs/plans/backlog distinctions), the park rule box ("If a step fails twice…" with numbered steps 1-4), the layout section (one item = one file, `backlog/<NNN>-<slug>.md`), the frontmatter block, the body-section list (Symptom/Tried/Why parked/Suggested direction), and the lifecycle section (resolved/wontfix). Do not copy wholesale; keep the template self-contained with literal backtick escaping for embedded code fences.

- [x] In `plannerAgentTemplate` (the template string returned by the function at line 437), add a "## Backlog integration" section immediately before the existing "## Hard rules" section. Copy the exact two-bullet text from `.claude/agents/planner.md` lines 46-49, substituting `\`` escaping as needed for embedded backticks in the template literal.

- [x] In `plannerAgentTemplate`, update the phase-contract body description to include `blocked` in the status comment alongside `pending | in-progress | done`. The line currently reads `status: pending        # pending | in-progress | done | blocked` — verify this already includes `blocked`; if it does, no change needed here.

- [x] In `plansReadmeTemplate`, add a "## Blocked phases → backlog" section at the end of the template (after the existing "A failure in one phase never invalidates completed phases" paragraph). The content should match the repo's `plans/README.md` lines 43-45: reference the park rule in `backlog/README.md`, the `status: blocked` field, and the two-way link requirement.

- [x] In `buildClaudeFileMap`, add `{ relativePath: 'backlog/README.md', content: backlogReadmeTemplate() }` to the `files` array immediately after the `plans/README.md` entry (around line 565).

## Verify

```bash
cd /home/home-linux/project/2026/beaver
npx tsc --noEmit
npm run build
```

Both must exit 0. Then do a spot-check:

```bash
npx tsx -e "
import { buildClaudeFileMap } from './src/scaffold/shared/claude-setup';
const files = buildClaudeFileMap({
  projectName: 'test',
  slug: 'test',
  flowEnum: ['ui'],
  layerEnum: ['src', '_cross'],
  reminderTrigger: 'home',
  claudeMd: '# test',
  conventionsSkill: '# skill',
  devAgent: '# dev',
  seedDocs: [],
});
const paths = files.map(f => f.relativePath);
console.log('backlog/README.md present:', paths.includes('backlog/README.md'));
console.log('plans/README.md present:', paths.includes('plans/README.md'));
const planner = files.find(f => f.relativePath === '.claude/agents/planner.md');
console.log('Backlog integration in planner:', planner?.content.includes('Backlog integration'));
const plans = files.find(f => f.relativePath === 'plans/README.md');
console.log('Blocked phases in plans/README:', plans?.content.includes('Blocked phases'));
const backlog = files.find(f => f.relativePath === 'backlog/README.md');
console.log('Park rule in backlog/README:', backlog?.content.includes('Park rule'));
"
```

All five `console.log` lines must print `true`.

## Notes / risks

- The `backlog/README.md` template uses nested code fences (the frontmatter example block). Escape all backticks inside the template literal: `` \`\`\` ``.
- The planner "Backlog integration" text references `backlog/README.md` — that path will exist in every scaffolded project once this phase is done, so the cross-reference is valid.
- Do NOT change `ClaudeHarnessParams` — `backlog/README.md` is project-type-agnostic (no cart fields needed), so it belongs in shared without a param.
- Rollback: all changes are additive (new function + one array entry + two template sections). If anything breaks, revert only the lines added in this phase.
