---
id: "0014"
title: "Guard Bash-bypass loophole: write scopes don't match real agent duties, memory teaches the workaround"
status: open
source: advisor-consultation-2026-07-04
severity: medium
created: 2026-07-04
---

## Symptom

The PreToolUse write-scope guard only matches `Write|Edit|MultiEdit`. Any agent with `Bash` can (and does) route around it. Concretely observed on 2026-07-04:
- `dev` had to edit `.claude/settings.json` (phases 02/04) and `plans/` status updates (every phase) via "throwaway Bash/node scripts" because those paths are outside its `WRITE_SCOPES` — the workaround was even INSTRUCTED in the phase prompts because it's established repo convention.
- `.agents/memory/dev/MEMORY.md` contains multiple bullets that explicitly teach the bypass ("plans/ writes need Bash — python3 heredoc", "use Bash (python3) to edit .codex/agents/"). The learning loop is memorializing how to defeat the safety mechanism.

Net effect: for Bash-holding agents the guard is theater; it only genuinely constrains `planner` (no Bash) and read-only agents (no Write/Edit).

## Tried

Nothing yet — parked for time.

## Why parked

End of session 2026-07-04. Needs a deliberate policy decision, not just code.

## Suggested direction

Decide the guard's purpose explicitly, then make scope match reality:

1. **Expand `dev`'s `WRITE_SCOPES`** (in `scripts/agent-guard-core.mjs` + template twin — or `harness-assets/` if backlog/0013 lands first) to cover what dev legitimately does: `plans/` (phase status updates during execution), `.claude/settings.json`, `.codex/agents/`, `CLAUDE.md`(?). Principle: the guard should only block what an agent must NEVER touch; anything it routinely needs via Bash-workaround belongs in scope.
2. **Keep the hard rule where it works**: agents that must be strictly bounded (planner, advisor, scout) simply don't get `Bash` in their `tools:` list — that is the real enforcement mechanism. Document this invariant in the claude-harness spec: "guard-bounded agent ⇒ no Bash".
3. Consider whether `planner` should own plan-status updates only, with `dev` allowed to update `status:`/checkboxes in existing phase files (current friction point).
4. **Clean the memory**: after scopes are fixed, prune/rewrite the `.agents/memory/dev/MEMORY.md` bullets that teach the Bash workaround (they become stale AND harmful). Ties into backlog/0015 (memory lifecycle).
5. Optional hardening (only if wanted): a Bash-matcher PreToolUse hook that pattern-matches obvious redirect/heredoc writes to out-of-scope paths — but per the security spec's own framing, don't oversell regex heuristics; the tools-allowlist approach (no Bash) is the honest boundary.
6. Update `docs/features/claude-harness/claude-harness.spec.en.md` (writeScope table + derived invariants section) and scaffold templates to match.

## Related

- backlog/0013 (if assets-as-files lands first, edit scopes once in `harness-assets/`)
- backlog/0015 (memory cleanup step overlaps)
