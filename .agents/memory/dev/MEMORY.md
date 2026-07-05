# dev — Agent Memory

Short-term memory with a lifecycle — NOT an append-only log. One bullet per durable, non-obvious gotcha, newest first. Link related docs/ files. Read this file at the start of every session. Budget ≤ 15 bullets / ≤ 100 lines; over budget → run the beaver-memory-retro skill (dedupe, delete stale, promote durable facts to docs/).

- **Write-scope policy (decided 2026-07-05, backlog/0014)**: `plans/` is now IN dev's writeScope — update phase status/checkboxes/Resolution directly with Write/Edit (planner remains the primary owner of `plans/`). Current `WRITE_SCOPES.dev`: `[src/, test/, package.json, tsconfig.json, vite.config.ts, biome.json, eslint.config.js, .github/, backlog/, plans/]` plus implicit `.agents/memory/dev/`. The guard is a HARD boundary only for no-Bash agents (planner/advisor/scout); for dev it is advisory + audit log — but do NOT route around a denial with Bash file tricks: a deny means the target is out of scope on purpose. For legitimate out-of-scope targets, either it's regenerated output (change the source template/registry and run `npx tsx test/helpers/regen-dogfood.ts`) or it belongs to the main session / another agent — report and hand off. See `docs/features/claude-harness/claude-harness.spec.en.md` "Derived invariants".

- **`.agents/memory/<agent>/MEMORY.md` seed placement**: The four core-agent seeds (dev, docs-writer, planner, advisor) live in the `shared` block of `buildClaudeFileMap` — NOT `claudeOnly`. `test-writer` seed stays in the `wantClaude` branch (no `.codex/agents/test-writer.toml` exists). The `flowEnum`/`layerEnum` params must be arrays (used with `.join()`), not plain strings — plain strings cause a silent `TypeError: .join is not a function` at render time.

- **Agent memory lives at harness-neutral `.agents/memory/<agent>/MEMORY.md`**: write it directly with Write/Edit — the guard allows it via the implicit `memoryPrefix` check. `.codex/agents/` files are regenerated output — never hand-edit; change the source and run `npx tsx test/helpers/regen-dogfood.ts`.

- **validate-plans.mjs table parser**: `parseOrderedPhasesTable()` must scope parsing to the "## Ordered phases" section — plans/overview files often have multiple Markdown tables (e.g. "Owner map") whose rows also match `/^\|\s*\d+\s*\|/`. Use a section regex first, then parse rows within it.

- **Throwaway verification scripts go under `test/`**: the scratchpad/OS-temp dir and top-level `scripts/` are outside dev's writeScope (the guard checks absolute paths, not just repo-relative ones). Write to `test/tmp-*.mjs`/`.ts` (in scope), run with `node`/`npx tsx`, then delete via Bash `rm`.

- **Bash string interpolation with `$()`/backtick-heavy content is fragile in this shell**: passing a JS/TS template string containing literal backticks and `$(...)`-shaped text through `node -e "..."` lets bash interpret `$(...)` and backslash-escapes before node sees them (silent truncation or line-by-line errors). Write a real `.mjs`/`.ts` file with the Write tool (under `test/`) and run it with `node`, rather than inlining via `node -e`.

- **Harness conditionality (`harness` param)**: `buildClaudeFileMap` takes `harness: 'claude' | 'codex' | 'both'` and splits the file map into shared / claudeOnly / codexOnly buckets — classify by OWNERSHIP, not path prefix (bucket contents documented in the claude-harness spec's output tables). Callers map `cart.ai` → `harness` via a local `aiToHarness()` helper; layout gates use `cart.ai !== 'NOT_USING'`. The `ai` enum has four values (NOT_USING / CLAUDE / CODEX / BOTH); harness-only uses its own `HARNESS_MENU_AI` constant without NOT_USING.

- **Embedding computed regex fragments into a giant emitted-file template literal** (`claude-setup.ts`): values interpolated via `${...}` at runtime pass their backslashes through untouched — no extra escaping. Only literal regex syntax written directly in the outer template source (e.g. `\b`, `\s`) needs `\\b`/`\\s` so it survives the template literal's own escape processing. Verify via a throwaway tsx render rather than reasoning about escaping in your head.

- **`ClaudeHarnessParams` required fields for a throwaway render**: `buildClaudeFileMap()` needs `productDescription: string` and `seedDocs: FileMap` (an array — `...params.seedDocs` throws `TypeError: not iterable` if missing). Minimal call: `{ projectName, slug, flowEnum: string[], layerEnum: string[], harness, productDescription, conventionsSkill, seedDocs: [] }`.

- **Claude Code `permissions.ask` tier is real and documented** (verified 2026-07-04 via `https://code.claude.com/docs/en/permissions`): evaluation order is `deny` → `ask` → `allow`, all three peer arrays under `permissions` in settings.json. Check that page before assuming `ask` needs a `deny` fallback.

- **Three separate `agent-guard.mjs`-shaped templates exist and are NOT the same shape**: `agentGuardMjsTemplate()` in `src/scaffold/shared/claude-setup.ts` (self-contained WRITE_SCOPES inline) is what scaffolded projects get at `.claude/scripts/agent-guard.mjs`, while this repo's dogfood copy imports `checkWritePermission` from `agent-guard-core.mjs` (matching the Codex adapter's shape). When editing "the agent-guard template," check which shape you're looking at first.

- **`python3` on this Windows box is broken** (Microsoft Store app-execution-alias stub). Use `node` with a real `.mjs` script file (Write tool, under `test/`), run with `node test/tmp-*.mjs`, then delete it.

- **`scaffoldReactVite(cart)` resolves `cart.projectName` relative to `process.cwd()`, not as a path** — passing an absolute path breaks slug-derived nested paths (e.g. `.claude/skills/${projectName}-conventions/`). For non-interactive/CI entry points (`test/helpers/scaffold-fixture.ts`), `process.chdir()` into the target's parent first and pass only `path.basename(targetPath)` as `projectName`.

- **`npx tsx <file>.ts` DOES resolve `@src/*`/`@utils/*` path aliases from `tsconfig.json`** (no separate loader config; vitest separately uses `resolve.alias` in `vitest.config.ts`). Confirmed 2026-07-05 running `test/helpers/scaffold-fixture.ts` standalone.

- **Before executing a "pending" phase, check for already-written deliverables** (`git status`, `Glob` the target paths): plans/assets-and-tests phase 07 arrived fully pre-implemented from an interrupted session while its tracker still said `pending, 0/7`. Re-run the phase's own Verify steps first rather than re-implementing.
