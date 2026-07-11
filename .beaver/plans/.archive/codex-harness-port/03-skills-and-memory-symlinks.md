---
phase: 03
title: skills-and-memory-symlinks
status: done
depends_on: []
---

## Goal

Wire up `.agents/skills/` so Codex discovers the existing Claude skills without duplicating any content — one canonical SKILL.md per skill, the other harness symlinks. Apply the same single-source pattern to agent-memory if Codex reads a dedicated memory path.

## Steps

- [x] Confirm Codex skill discovery path: per user research, `.agents/skills/` is the repo-scope discovery path. Verify the directory exists (it was noted as empty placeholder); if not, it will be created by symlink creation.
- [x] Create symlink `.agents/skills/beaver-conventions` → `.claude/skills/beaver-conventions/` (directory symlink). On WSL2 this is `ln -s "$(pwd)/.claude/skills/beaver-conventions" "$(pwd)/.agents/skills/beaver-conventions"`. The canonical SKILL.md at `.claude/skills/beaver-conventions/SKILL.md` is the single source; Codex reads through the symlink.
- [x] Create symlink `.agents/skills/beaver-docs` → `.claude/skills/beaver-docs/` (directory symlink). Same pattern.
- [x] Confirm whether Codex reads agent-memory  (no dedicated memory path in Codex docs; skip symlink) from `.codex/agent-memory/` or a different path. If it does: create symlink `.codex/agent-memory` → `.claude/agent-memory/` so both harnesses share the same memory directories without duplication. If Codex has no memory concept (or reads from `~/.codex/`), skip this step and note it in `.codex/HOOK_PAYLOAD_NOTES.md`.
- [x] Verify the symlinks resolve: `ls -la .agents/skills/beaver-conventions/SKILL.md` and `ls -la .agents/skills/beaver-docs/SKILL.md` should both show the real file.
- [x] Run validate-plans.mjs to confirm no breakage (if it validates `.agents/` structure) — or at minimum `node .claude/scripts/validate-plans.mjs` — to confirm no structural breakage.

## Verify

- `ls -la .agents/skills/` shows two symlink entries (`beaver-conventions`, `beaver-docs`) pointing into `.claude/skills/`.
- Reading `.agents/skills/beaver-conventions/SKILL.md` returns the same content as `.claude/skills/beaver-conventions/SKILL.md`.
- No duplicate SKILL.md files created — content lives exclusively in `.claude/skills/`.
- If memory symlink was created: `ls -la .codex/agent-memory/` shows entries for `dev/`, `planner/`, etc. matching `.claude/agent-memory/`.

## Notes / risks

**WSL2 symlinks** — user confirmed WSL2 symlinks work. Use absolute paths in `ln -s` to avoid relative-path breakage when the repo is accessed from a different cwd. Pattern: `ln -s "$(pwd)/target" "$(pwd)/link"`.

**Directory vs file symlinks** — symlink the whole skill directory (not just SKILL.md) so any future files in the skill directory (e.g., `agents/openai.yaml` for Codex) are auto-included. The canonical location for Claude-specific files remains `.claude/skills/<name>/`; Codex-specific metadata (if any) would live in `.agents/skills/<name>/` as real files alongside the symlink — this would require converting from a directory symlink to individual file symlinks. Flag this if needed.

**`.gitignore` check** — verify `.codex/` and `.agents/` are not gitignored. Symlinks must be committed so other contributors get them.
