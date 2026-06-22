# advisor — memory

Durable architectural insights and recurring trade-offs discovered while advising. One bullet per insight; cite real paths.

<!-- Append insights below. -->

- [Product-description prompt](product-description-prompt.md) — should a scaffold-time description feed the harness? Put it in CLAUDE.md Project Overview, optional, no new config file.
- [Harness-only CLAUDE.md gaps](harness-only-claude-md-gaps.md) — skeleton CLAUDE.md omits the Agent Routing table full scaffolds emit; port the existing block, don't over-abstract.
- [Harness shared seam](harness-shared-seam.md) — buildClaudeFileMap is the one shared/domain seam; new consumers (e.g. codex) plug in, don't fork or extract to monorepo prematurely.
- [Harness target choice](harness-target-choice.md) — claude/codex/both/none rides the existing `ai` enum; gate the Codex block inside buildClaudeFileMap, no new cart field.
- [Dogfood script layout](dogfood-script-layout.md) — scripts split 3 ways (scripts/ shared, .codex/scripts/ codex, .claude/scripts/agent-guard.mjs claude); .agents/ is skill twins only, NOT scripts. Dogfood migrated (backlog 0006 resolved 2026-06-22).
