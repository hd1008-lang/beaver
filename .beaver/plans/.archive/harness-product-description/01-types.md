---
phase: 01
title: types
status: done
depends_on: []
---

## Goal

Add `productDescription: string` to every Cart interface that can carry harness settings, and add it to `ClaudeHarnessParams`.

## Steps

- [ ] Read `src/types/index.ts` in full before editing.
- [ ] In `src/types/index.ts`, add `productDescription: string` to `ReactViteCore` (after the `ai` field), `ChromeExtensionCore` (after `ai`), and `HarnessOnlyCore` (after `projectType`). The field is unconditional — it is always present when the harness is enabled, and the prompt (phase 02) enforces non-empty.
- [ ] Read `src/scaffold/shared/claude-setup.ts` (at least the `ClaudeHarnessParams` interface block, lines ~94–108) before editing.
- [ ] In `src/scaffold/shared/claude-setup.ts`, add `productDescription: string` to the `ClaudeHarnessParams` interface (after `slug`, before `flowEnum`, or after `reminderTrigger` — pick a slot that keeps the interface readable; after `slug` is natural).

## Verify

```
npm run build
```

Build must exit 0 with no TypeScript errors. The new field will produce downstream TypeScript errors in phase 03 and 04 call sites only after those phases complete — that is expected; the build is not strictly clean until phase 04. However, at this phase the type additions themselves must not break compilation of *existing* call sites because the field is added to interfaces (not yet consumed). Confirm by running `npx tsc --noEmit` from the repo root.

## Notes / Risks

- `HarnessOnlyCore` is the cart for harness-only mode. It has no `ai` field (unlike react-vite/chrome-extension); `productDescription` is always present there since harness is the entire purpose of that flow. Place the field last (after `projectType`).
- The three scaffold call sites that call `buildClaudeFileMap(params)` will need `productDescription` added to the params object (phases 03 and 04). TypeScript will error there once the interface requires the field — that is the intended signal to complete phases 03 and 04.
- Do NOT add a default value or make the field optional (`?:`). The spec requires it to be non-empty; optionality would let callers skip it silently.
