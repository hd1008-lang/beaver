# advisor — memory

Durable architectural insights and recurring trade-offs discovered while advising. One bullet per insight; cite real paths.

<!-- Append insights below. -->

- [Product-description prompt](product-description-prompt.md) — should a scaffold-time description feed the harness? Put it in AGENTS.md Project Overview, optional, no new config file.
- [Harness shared seam](harness-shared-seam.md) — buildHarnessFileMap is the one shared/domain seam; new consumers (e.g. codex) plug in, don't fork or extract to monorepo prematurely.
- [Harness target choice](harness-target-choice.md) — claude/codex/both/none rides the existing `ai` enum; gate the Codex block inside buildHarnessFileMap, no new cart field.
- [Error handling seams](error-handling-seams.md) — main() + per-scaffold try/catch + ScaffoldError; no process-level handlers; hangs are uncatchable, need a watchdog (symptom-masker for Windows bug).
- [Menu prompt duplication](menu-prompt-duplication.md) — selectFromMenu copy-pasted per flow; harness-only does input→input→select (Windows arrow-key bug suspect); check both copies for prompt-layer bugs.
- [Harness root discovery constraint](harness-root-discovery-constraint.md) — .claude/.codex/.agents/AGENTS.md/CLAUDE.md must stay at repo root (tool auto-discovery); only knowledge base can move to .beaver/.
- [Project migrate command](project-migrate-command.md) — no general auto-migrator for old scaffolded projects; no version manifest exists, harness re-emit already ~served by `--ai`, `update` name is taken.
- [Dogfood script layout](dogfood-script-layout.md) — scripts split 3 ways (scripts/ shared, .codex/scripts/ codex, .claude/scripts/agent-guard.mjs claude); .agents/ is skill twins only, NOT scripts. Dogfood migrated (backlog 0006 resolved 2026-06-22).
