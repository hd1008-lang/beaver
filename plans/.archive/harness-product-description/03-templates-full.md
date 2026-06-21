---
phase: 03
title: templates-full
status: done
depends_on: [01, 02]
---

## Goal

Render `productDescription` as the opening line of `## Project Overview` in the react-vite and chrome-extension CLAUDE.md templates, and thread the field through their `buildClaudeFileMap` call sites.

## Steps

- [ ] Read `src/scaffold/react-vite/templates/claude-setup.ts` before editing.
  - In `claudeMdTemplate(cart)`: change the `## Project Overview` section to begin with `${cart.productDescription}\n\n` before the existing stack bullet list. The stack list follows on the next line. Result:
    ```
    ## Project Overview

    <productDescription>

    - React 19, TypeScript 5.8, Vite 6
    - ...
    ```
  - In the function that calls `buildClaudeFileMap(...)` (search for the call in this file or in the react-vite scaffold orchestrator): add `productDescription: cart.productDescription` to the params object passed to `buildClaudeFileMap`.

- [ ] Read `src/scaffold/chrome-extension/templates/claude-setup.ts` before editing.
  - Apply the identical `## Project Overview` change: prepend `${cart.productDescription}\n\n` before the stack list.
  - Add `productDescription: cart.productDescription` to the `buildClaudeFileMap` params object.

- [ ] Run `npx tsc --noEmit` — after this phase, the only remaining TS errors must be in the harness-only skeleton files (phase 04).

- [ ] Inspect the rendered output mentally: confirm `productDescription` appears before the stack bullets and is not duplicated.

## Verify

```
npx tsc --noEmit
```

Zero TypeScript errors in `src/scaffold/react-vite/**` and `src/scaffold/chrome-extension/**`. The harness-only skeleton files may still error (phase 04 will fix them).

## Notes / Risks

- The `buildClaudeFileMap` call for react-vite is inside `src/scaffold/react-vite/templates/claude-setup.ts` in the exported `getReactViteHarnessFileMap` function (or equivalent — confirm the actual export name before editing). Do not guess the function name; read the file.
- Chrome-extension call is similarly in `src/scaffold/chrome-extension/templates/claude-setup.ts` — the exported function is `getChromeExtensionHarnessFileMap` or equivalent; confirm before editing.
- The `buildClaudeFileMap` function itself does NOT use `productDescription` directly (it is not rendered into any shared output); the field is only consumed by the project-type CLAUDE.md templates. No change to `buildClaudeFileMap`'s body is needed — only the interface (done in phase 01) and the caller's params object (this phase).
- Do NOT modify the stack list order or any other section. Only the `## Project Overview` opening paragraph changes.
