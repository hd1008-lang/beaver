---
id: "0012"
title: "validate-plans.mjs frontmatter parser fails on CRLF files (Windows checkouts)"
status: resolved
source: plans/security-hardening/00-overview.md
severity: medium
created: 2026-07-04
---

> **Resolved 2026-07-04**: all frontmatter/body regexes made CRLF-tolerant (`\r?\n`) in `scripts/validate-plans.mjs` (×2), `scripts/_docs-shared.mjs`, `scripts/validate-structure.mjs`, and the four template twins in `src/scaffold/shared/claude-setup.ts`. Verified: `validate-plans` / `validate-structure` / `lint-docs-frontmatter` all pass on this CRLF Windows checkout, and the rendered `validate-plans.mjs` template contains the tolerant regex. `.gitattributes` normalization was NOT added (kept scope minimal — parsers now tolerate both endings).

## Symptom

`node scripts/validate-plans.mjs` reports `missing frontmatter block` for all pre-existing backlog entries (0001–0010) on a Windows checkout, even though every file has a valid `---` frontmatter block. Files written with LF endings (0011, 0012) pass.

## Tried

- Confirmed via `file backlog/0010-*.md`: pre-existing files have CRLF line terminators (git autocrlf on Windows); newly written LF files are not flagged.
- Confirmed the parser lives in `scripts/validate-plans.mjs` ("Minimal frontmatter parser — same pattern as validate-structure.mjs").

## Why parked

Fix belongs to `dev` and must cover ALL copies of the shared frontmatter parser pattern: `scripts/validate-plans.mjs`, `scripts/validate-structure.mjs`, `scripts/_docs-shared.mjs` (if same regex), and their scaffold-template twins in `src/scaffold/shared/claude-setup.ts`. Same "fix the twin" discipline as backlog/0011. Discovered while verifying the security-hardening plan, out of that plan's scope.

## Suggested direction

- Normalize content before parsing: `content.replace(/\r\n/g, '\n')` at read time, or make the frontmatter regex CRLF-tolerant (`/^---\r?\n([\s\S]*?)\r?\n---/`).
- Alternatively/additionally add a `.gitattributes` with `*.md text eol=lf` (and `*.mjs text eol=lf`) to the repo AND to the scaffold output so line endings are stable across platforms — this also protects hook scripts from CRLF breakage under bash.
- Related: backlog/0011 (agent-guard POSIX-only path handling) — both are "harness scripts assume POSIX" bugs; consider fixing them in one pass with Windows-payload smoke tests.
