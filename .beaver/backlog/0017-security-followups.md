---
id: "0017"
title: "Security follow-ups from the shipped security-hardening plan: sandbox.credentials block + fail-mode review"
status: resolved
source: plans/.archive/security-hardening/00-overview.md
severity: low
created: 2026-07-04
resolution: >
  Part 1 (sandbox.credentials): adopted. Added a `sandbox.credentials` block
  (files: ~/.aws/credentials, ~/.ssh; envVars: AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN, GITHUB_TOKEN, NPM_TOKEN — all
  mode "deny") alongside the existing sandbox.filesystem.denyRead (kept as
  defense-in-depth) in harness-assets/.claude/settings.json (single source
  for both scaffolded projects and the dogfood copy). Dogfood
  .claude/settings.json regenerated via
  `npx tsx test/helpers/regen-dogfood.ts`. docs/features/security-hardening
  spec updated by docs-writer to document the new block.
  Part 2 (fail-mode question): RESOLVED as wontfix/no-op with user sign-off —
  keep fail-open on the Codex guard's JSON-parse-failure path. No code
  change. See "Why parked" below for the original rationale, now confirmed.
---

## Symptom

The security-hardening plan (6/6 phases done, archived 2026-07-04) left two deliberate open items, recorded in phase Resolution sections but nowhere actionable:

1. **`sandbox.credentials` block not used** (phase 02 Resolution): Claude Code docs describe a dedicated `sandbox.credentials` mechanism (file-specific protection that also unsets env vars) as the STRONGER, more targeted protection for `~/.aws/credentials` and `~/.ssh` — we only used the blunter `sandbox.filesystem.denyRead` globs. Adopting it would harden both the dogfood settings and the scaffolded `claudeSettingsTemplate()`.
2. **Fail-mode judgment call unconfirmed by user** (phase 03 Resolution): the Codex guard's JSON-parse-failure path remains fail-open (exit 0) for ALL pattern groups; "fail-closed" was implemented only at the pattern-matching level. Rationale documented (malformed hook JSON never occurs in practice; group-specific parse-failure handling adds complexity), but the plan explicitly flagged it for user review. If stricter posture is wanted: change parse failure → emit deny.

## Tried

N/A — these are recorded decisions/deferrals, not failed attempts.

## Why parked

End of session 2026-07-04; both are low-risk enhancements on top of a just-shipped feature — let it settle first.

## Suggested direction

1. Read the sandboxing docs section on `sandbox.credentials` (https://code.claude.com/docs/en/sandboxing), add a `credentials` block alongside `filesystem.denyRead` in both `.claude/settings.json` and `claudeSettingsTemplate()`; keep denyRead as defense-in-depth. Update `docs/features/security-hardening/security-hardening.spec.en.md` section (b) accordingly.
2. Ask the user the one-line fail-mode question (deny-on-parse-failure yes/no) and either flip the behavior in `.codex/scripts/codex-permission-guard.mjs` + template twin or mark this half of the entry wontfix with the user's sign-off.
3. Small, single-pass change — `dev` direct, no plan needed. If backlog/0013 has landed, edit in `harness-assets/` instead of the template string.

## Related

- plans/.archive/security-hardening/02-claude-denyread-hardening.md (Resolution)
- plans/.archive/security-hardening/03-shared-secret-guard-core.md (Resolution)
- docs/features/security-hardening/security-hardening.spec.en.md
