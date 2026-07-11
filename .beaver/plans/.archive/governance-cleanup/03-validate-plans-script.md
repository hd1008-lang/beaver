---
phase: 03
title: Add validate-plans.mjs — mechanical plan/backlog health checker
status: done
depends_on: []
---

## Goal

`.claude/scripts/validate-plans.mjs` exists and passes `node .claude/scripts/validate-plans.mjs` with exit 0 against the current repo state, checking four invariants described below.

**Owner: dev** — planner cannot write to `.claude/scripts/`.

## Steps

- [ ] Create `.claude/scripts/validate-plans.mjs` with the logic described in Notes. The script must use only Node built-ins (no external deps — same pattern as `lint-docs-frontmatter.mjs` and `validate-structure.mjs`).
- [ ] Run the script against the current repo state and confirm exit 0 (or fix any violations it surfaces first).
- [ ] Add an entry for the script in `CLAUDE.md`'s "Docs commands" line so agents know it exists.
- [ ] Add the script invocation to the skill file `.claude/skills/beaver-conventions/SKILL.md` under a "Plans & backlog commands" heading, so agents pick it up via the beaver-conventions skill. (Read the skill file first to find the right insertion point.)
- [ ] Verify the final state: `node .claude/scripts/validate-plans.mjs` exits 0; `node .claude/scripts/lint-docs-frontmatter.mjs` still exits 0; `npm run build` still exits 0.

## Verify

```bash
# 1. Script is syntactically valid JS
node --check .claude/scripts/validate-plans.mjs

# 2. Script passes against the current repo
node .claude/scripts/validate-plans.mjs

# 3. Existing doc lint unaffected
node .claude/scripts/lint-docs-frontmatter.mjs

# 4. Build unaffected
npm run build
```

All four must exit 0.

## Notes / risks

**Script logic — four checks (implement in this order):**

### Check A — Phase table ↔ frontmatter status consistency

For each active plan dir under `plans/` (skip `.archive/`):
1. Read `00-overview.md` and parse the "Ordered phases" table rows (Markdown table, columns: `#`, `Phase`, `Status`, `Steps`, `Updated`).
2. For each row, read `NN-<phase>.md` (where `NN` is the zero-padded row number) and parse its frontmatter `status` field.
3. Warn (not error) if the table row's Status cell doesn't match the phase file's `status:` frontmatter.

Reasoning: mismatch = executor forgot to sync the table. Warn rather than error so a partially-updated table doesn't hard-block the validator.

### Check B — All-done plans not yet archived

For each plan dir under `plans/` (skip `.archive/` and `governance-cleanup` itself during this plan's execution, but NOT after it's done):
1. Parse the "Ordered phases" table in `00-overview.md`.
2. If every row's Status is `done`, emit a warning: `"plans/<slug>: all phases done — consider archiving to plans/.archive/"`.

This is a warning, not an error, because the decision to archive is the executor's (per `plans/README.md:68`).

### Check C — Backlog ID uniqueness and sequence

For each file under `backlog/` matching `\d{4}-*.md`:
1. Parse its frontmatter `id:` field.
2. Collect all IDs; assert they are unique (error if duplicate).
3. Assert each file's NNNN prefix matches its `id:` field (error if mismatch).
4. Assert all required frontmatter fields are present: `id`, `title`, `status`, `source`, `severity`, `created` (error if any missing).
5. Assert `status` is one of `open | resolved | wontfix` (error if invalid).

### Check D — Two-way links between blocked phases and backlog entries

For each phase file (any `plans/` non-overview, non-archive file) with `status: blocked` in frontmatter:
1. Look for a `[[backlog/NNNN` or `backlog/NNNN` link in the file body.
2. If none found, emit a warning: `"<phase-file>: status blocked but no backlog link found in body"`.
3. For each linked `backlog/<NNNN>-*.md` file, check that the entry's `source:` field references the linking phase file path.
4. If back-link is missing, emit a warning: `"backlog/<id>: source field does not reference <phase-file>"`.

Both are warnings (not errors) because the link convention is new and existing blocked phases may predate it.

**Error vs. warning distinction:**
- Errors (exit non-zero): duplicate backlog IDs, missing required backlog frontmatter fields, invalid `status` enum values, backlog filename prefix/id mismatch.
- Warnings (print but exit 0): table/frontmatter status mismatch, all-done plan not archived, missing two-way links.

**Output format** (mirror `lint-docs-frontmatter.mjs`):
```
validate-plans: 2 error(s), 1 warning(s):
  ERROR plans/foo/02-bar.md: phase frontmatter status "done" but table row says "in-progress"
  WARN  plans/baz/00-overview.md: all phases done — consider archiving to plans/.archive/
validate-plans: passed with 1 warning(s).   # or "failed with N error(s)" if errors > 0
```

**Implementation notes:**
- Use `readdirSync` + `readFileSync` (same as `validate-structure.mjs`). No `walkDocs` helper — plans/ has a different layout.
- The "Ordered phases" Markdown table parser: look for lines matching `/^\|\s*\d+\s*\|/`, split on `|`, trim cells. Robust enough for the fixed 5-column format in `plans/README.md`.
- Skip files starting with `.` and the `README.md` in `plans/`.
- The script should resolve paths relative to `process.cwd()` so it works from the repo root.
- Do NOT import from `_docs-shared.mjs` — that helper is docs-specific (it walks `docs/`). Inline what's needed.
