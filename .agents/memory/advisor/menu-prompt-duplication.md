---
name: menu-prompt-duplication
description: selectFromMenu is copy-pasted per flow (react-vite vs harness-only) with subtle divergences; prompt-layer bugs must be checked against ALL copies, not one.
metadata:
  type: project
---

`selectFromMenu` is duplicated, not shared. Two near-identical copies exist:
- src/options/react-vite/index.ts:17 (adds a trailing `new Separator()` to choices)
- src/options/harness-only/index.ts:10 (no Separator; otherwise identical)

Both wrap `@inquirer/prompts` `select`. The flows also differ in prompt ordering:
- react-vite (src/options/react-vite/index.ts:122): ONE `input` (projectName) then `select`s.
- harness-only (src/options/harness-only/index.ts:95): TWO consecutive `input`s (targetDirectory with `default:"."` + async validate, then projectName) then `select` (projectType).

**Why:** A Windows bug report — arrow keys dead at the harness-only "Project type" `select` — points at the input→input→select transition / raw-mode handoff, NOT at the select itself (react-vite selects work). The divergence is behavioral, so prompt-layer fixes must be validated on the harness-only path specifically.

**How to apply:** When advising on any inquirer/stdin/raw-mode issue, compare both selectFromMenu copies and both flow orderings before concluding. Consider that the shared seam (extracting one selectFromMenu) would also remove a class of "fixed in one flow, not the other" bugs. No stdin/raw-mode is hand-managed anywhere in src/ (grep confirms only hook scripts touch stdin) — so the cause is inquirer + Windows TTY, fixable only by inquirer version bump or prompt-sequencing, not by our own stdin code.
