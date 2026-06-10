---
title: CLI Self-Update Command — Feature Spec
feature: cli-update
flow: infra
layer: _cross
status: active
lang: en
related: []
keywords: [update, self-update, npm, beaver-build, runupdate, version]
updated: 2026-06-10
---

# CLI Self-Update Command — Feature Spec

## Context
Beaver is published to npm as `beaver-build` (bin: `beaver`). Before this feature, updating required users to manually run `npm install -g beaver-build@latest`. `beaver update` automates that.

## Solution / Pattern
- `src/index.ts` dispatches `args[0] === "update"` (after the `--version`/`--help` flag checks, before the interactive menu) to `runUpdate(getVersion())` and exits.
- `runUpdate(currentVersion)` in `src/commands/update.ts`:
  1. Spinner "Checking for updates..." → `npm view beaver-build version` to read the latest published version.
  2. If it equals the local version → success message "Already on the latest version (vX.Y.Z)." and return.
  3. Otherwise → spinner switches to "Updating beaver-build vCur → vLatest..." and runs `npm install -g beaver-build@latest`.
  4. On failure: spinner error; if the message matches `EACCES`/`permission`, suggest `sudo npm install -g beaver-build@latest`; exit code 1.
- Uses `node:child_process` `exec` promisified — no new dependencies. Spinner/error styling follows the scaffold orchestrator pattern (nanospinner + chalk).

## Key Decisions
- Plain string inequality for version comparison (no semver library) — any difference from the registry `latest` triggers an install of `@latest`.
- npm only; no package-manager detection.

## Related Files
- src/commands/update.ts
- src/index.ts
