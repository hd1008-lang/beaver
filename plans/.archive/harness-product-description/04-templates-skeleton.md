---
phase: 04
title: templates-skeleton
status: done
depends_on: [01, 03]
---

## Goal

Render `productDescription` in all three harness-only skeleton CLAUDE.md templates and thread the field through their `buildClaudeFileMap` call sites. After this phase, `npx tsc --noEmit` must be clean across the entire repo.

## Steps

- [ ] Read `src/scaffold/harness-only/templates/generic-skeleton.ts` before editing.
  - In `claudeMdTemplate(cart)`: the existing template is a minimal stub that defers to `claude /init`. The `## Project Overview` section does not yet exist in this stub — add it immediately after the opening `> This project uses a Claude Code harness...` block (before `## Docs`):
    ```
    ## Project Overview

    <productDescription>
    ```
  - In `getGenericHarnessFileMap(cart)`, add `productDescription: cart.productDescription` to the `buildClaudeFileMap` params object.

- [ ] Read `src/scaffold/harness-only/templates/react-vite-skeleton.ts` before editing.
  - Apply the same two changes: add `## Project Overview\n\n${cart.productDescription}` section to `claudeMdTemplate`, and add `productDescription: cart.productDescription` to the `buildClaudeFileMap` call.

- [ ] Read `src/scaffold/harness-only/templates/chrome-extension-skeleton.ts` before editing.
  - Apply the same two changes.

- [ ] Run `npx tsc --noEmit` — must be fully clean (zero errors) across all `src/**`.

- [ ] Run `npm run build` — must exit 0.

## Verify

```
npx tsc --noEmit   # zero errors
npm run build      # exits 0
```

## Notes / Risks

- The harness-only skeleton CLAUDE.md stubs are intentionally minimal (per MEMORY.md: "they tell users to run `claude /init`"). The `## Project Overview` section with `productDescription` is the ONE piece of user-provided real content — it is appropriate to add it. Do NOT add agent routing tables, park rules, or any other content beyond the description line.
- The spec says harness-only skeletons must also carry `productDescription`. The section placement: right after the opening `>` callout block, before `## Docs`. This is the natural "first meaningful content" slot.
- All three skeleton files share the same pattern but are separate files — edit them individually, do not create a shared helper (surgical change rule; also MEMORY.md: "Keep it as a literal string duplication rather than a shared helper").
- After this phase, the repo's TypeScript is fully clean. Phase 05 (dogfood sync) is a deployment concern, not a code fix.
