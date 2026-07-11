---
phase: 01
title: scaffold-gitignore-env
status: done
depends_on: []
---

## Goal
Scaffolded projects ignore `.env` files by default, so generated repos never accidentally track/push secrets.

## Steps
- [x] Read `src/scaffold/react-vite/templates/gitignore.ts` in full (currently a single `gitignoreTemplate()` returning a static string with no env section).
- [x] Add an `# Environment variables` section to the returned string: `.env`, `.env.local`, `.env.*.local`, `!.env.example` (allow the example file to be tracked — matches the pattern already used in this repo's own `.gitignore`).
- [x] Confirm `src/scaffold/chrome-extension/templates/layout.ts` imports `gitignoreTemplate` from `@src/scaffold/react-vite/templates/gitignore` (it does, line 13) — no second file to edit; chrome-extension gets the fix for free.
- [x] Grep the repo for any other place a `.gitignore` string is built for a scaffolded project (`grep -rn "gitignoreTemplate\|# Environment variables" src/scaffold`) to confirm there is truly only one template.

## Verify
- `node -e "const {gitignoreTemplate}=require('./src/scaffold/react-vite/templates/gitignore.ts')"` isn't runnable directly (TS) — instead: run `npm run build` (or `npm run dev:build`) and inspect `dist/scaffold/react-vite/templates/gitignore.js` for the new `.env` lines, OR grep the source directly: `grep -n "\.env" src/scaffold/react-vite/templates/gitignore.ts` returns matches.
- Manually scaffold a react-vite project via `npm run dev` (or read the generated file map in a test run) and confirm the written `.gitignore` contains `.env`.

## Notes / risks
- This is the smallest, lowest-risk phase in the plan — ship independently, don't block it on phases 02+.
- Do not touch the dogfood repo's own root `.gitignore` — it already has `.env` / `.env.local` / `.env.*.local` (confirmed by reading `.gitignore` during planning); this phase is scaffold-template-only.
- Match the existing template's style (no comments beyond the section header already used for `# Logs`, `# Dependencies`, etc.) — don't reformat the whole file.
