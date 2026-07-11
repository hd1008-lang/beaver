---
phase: 02
title: menu-prompts
status: done
depends_on: [01]
---

## Goal

Add a `menuProductDescription` prompt to all three flow files so that `cart.productDescription` is populated (non-empty, validated) whenever the user selects a Claude Harness AI option.

## Steps

- [ ] Read `src/options/react-vite/index.ts` before editing.
  - Add a `menuProductDescription` function (uses `input()` from `@inquirer/prompts`; validates non-empty with `.trim()`; re-prompts until non-empty; assigns to `cart.productDescription`).
  - Call it inside `flowReactVite` immediately after `menuAI(cart)` (only if `cart.ai !== 'NOT_USING'` — guard mirrors the harness-conditional pattern already used for the testing menu).
  - The prompt message string: `"Describe your project (one line):"`.

- [ ] Read `src/options/chrome-extension/index.ts` before editing.
  - Apply the same `menuProductDescription` function and call it in `flowChromeExtension` after `menuAI(cart)` with the same AI guard.

- [ ] Read `src/options/harness-only/index.ts` before editing.
  - Add `menuProductDescription`. For harness-only, the AI harness is the *entire* purpose of this flow (no opt-in menu) — the prompt is unconditional; call it in `flowHarnessOnly` after `menuProjectType(cart)`.
  - Assign to `(cart as HarnessOnlyCore).productDescription`.

- [ ] Run `npx tsc --noEmit` — expect TypeScript errors only at the `buildClaudeFileMap` call sites (the missing `productDescription` in the params object), not at the new `cart.productDescription` assignments.

- [ ] Confirm the three `REACT_MENU_AI` / `CHROME_MENU_AI` "not using" sentinel values to write the correct guard. For react-vite the sentinel is `'NOT_USING'` (see `src/options/react-vite/constants/index.ts`); verify the same for chrome-extension before writing the guard.

## Verify

```
npx tsc --noEmit
```

The only remaining errors must be in the `buildClaudeFileMap` call sites (3 files) complaining about the missing `productDescription` param — not in the option flow files. Zero errors in `src/options/**`.

## Notes / Risks

- For react-vite and chrome-extension: the `menuProductDescription` call must be guarded by `if (cart.ai !== SOME_SENTINEL_VALUE)` to match the spec ("when user enables Claude Harness"). Read the `REACT_MENU_AI` / `CHROME_MENU_AI` constants before writing the guard.
- For harness-only: no guard needed — every harness-only run installs the harness.
- Do NOT make `productDescription` optional in the cart or use a default. The `input()` validator should return the error string `"Description cannot be empty"` when the user submits blank, forcing a re-prompt. Use `transformer: (v) => v.trim()` to strip whitespace.
- The `menuProductDescription` function pattern mirrors `menuProjectName` exactly — use it as the template.
