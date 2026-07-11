---
phase: 03
title: Update harness-setup.ts — selective baseDir application
status: done
depends_on: [01, 02]
---

## Goal

Apply `baseDir` selectively in `src/scaffold/shared/harness-setup.ts` to prefix ONLY knowledge-base path keys in FileMap and writeScope entries. Keep tool-discovery paths bare.

## Context

This is the core mechanism phase. The token `{{baseDir}}` has been added to templates (Phase 02), but templates must be **interpolated** with the actual baseDir value. That happens in buildHarnessFileMap via interpolate(baseDir, ...).

Two places need selective baseDir application:
1. **FileMap keys** (lines 205-333) — only prefix knowledge-base path keys, keep tool paths bare
2. **writeScope ACL** (lines 40-68) — only prefix knowledge-base scope entries, keep tool paths bare

## Steps

### Understand Current Structure

- [x] **Read `src/scaffold/shared/harness-setup.ts`** around lines 40-68 (writeScopesJson):
  - Understand how writeScope entries map agent names to path prefixes they can write
  - Example: `planner: ['.agents/memory/planner', 'plans/', 'backlog/']`
  - When paths move, ACL keys must move too (beaver only; scaffolded projects stay at root)

- [x] **Read lines 155 (baseDir destructure) and 205-333 (FileMap keys)**:
  - Understand how FileMap is built: it's a record of `path: string => content: string`
  - Example: `FileMap['.claude/agents/planner.md'] = ...`
  - We need to selectively prefix only knowledge-base keys

### Update FileMap Building Logic (lines 205-333)

- [x] **Identify all FileMap entries** that reference knowledge-base paths:
  - Knowledge-base paths to prefix: `plans/`, `docs/`, `backlog/`, `scripts/`
  - Tool-discovery paths to keep bare: `.claude/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`

- [x] **Selectively prefix FileMap keys**:
  - For entries like `['plans/README.md']`, prefix: `[`${baseDir ? baseDir + '/' : ''}plans/README.md`]`
  - For entries like `['.claude/agents/planner.md']`, keep bare: `['.claude/agents/planner.md']`
  - For entries like `['AGENTS.md']`, keep bare: `['AGENTS.md']`
  - Pattern: `baseDir && ['plans/', 'docs/', 'backlog/', 'scripts/'].some(p => key.startsWith(p)) ? `${baseDir}/${key}` : key`

- [x] **Update the FileMap building loop**:
  - For each FileMap entry, check if its key is a knowledge-base path
  - If yes: prefix with baseDir (if non-empty)
  - If no (tool-discovery path): keep bare

### Update writeScope Registry (lines 40-68)

- [x] **Review writeScopesJson** mapping:
  - Understand that `planner: ['.agents/memory/planner', 'plans/', 'backlog/']` means planner can write to those paths
  - Tool paths like `.agents/` stay at root; knowledge-base paths move to `.beaver/`

- [x] **Update writeScope entries selectively**:
  - For beaver's dogfood (baseDir='.beaver'):
    - Keep tool paths bare: `.agents/memory/planner`
    - Prefix knowledge-base paths: `plans/` → `.beaver/plans/`
  - Example transformation:
    ```typescript
    // Before (beaver-params beaverParams):
    planner: ['.agents/memory/planner', 'plans/', 'backlog/']
    
    // After (with selective baseDir prefixing):
    planner: ['.agents/memory/planner', '.beaver/plans/', '.beaver/backlog/']
    ```

- [x] **Implement writeScope update**:
  - For scaffolded projects (baseDir=''), keep ACL entries bare (knowledge-base paths stay at root)
  - For beaver (baseDir='.beaver'), prefix knowledge-base paths in ACL
  - Pseudocode:
    ```typescript
    const writeScopesJson = {
      planner: [
        '.agents/memory/planner',  // bare (tool path)
        ...(baseDir ? [`${baseDir}/plans/`, `${baseDir}/backlog/`] : ['plans/', 'backlog/'])
      ],
      ...
    }
    ```

### Verify Selective Application

- [x] **Test TypeScript compilation**: `npm run build` succeeds

- [x] **Spot-check FileMap keys**:
  - Knowledge-base keys should be prefixed when baseDir='.beaver' (beaver's render)
  - Tool keys should stay bare

- [x] **Spot-check writeScope entries**:
  - planner's writeScope should include `.beaver/plans/` (beaver) or `plans/` (scaffolded)
  - All entries should include `.agents/memory/planner` bare (no prefix)

## Verify

- [x] FileMap keys for knowledge-base paths are conditionally prefixed based on baseDir
- [x] FileMap keys for tool-discovery paths stay bare
- [x] writeScope entries for knowledge-base paths are conditionally prefixed
- [x] writeScope entries for tool-discovery paths stay bare
- [x] `npm run build` succeeds (no type errors)
- [x] TypeScript recognizes all computed paths as strings

## Notes / Risks

- **Conditional logic is essential** — baseDir must be checked before prefixing. Empty string `''` is falsy, so use `baseDir && baseDir.length > 0` or similar to avoid `//` in paths
- **ACL correctness is highest-risk** — if writeScope is wrong, agent-guard will deny legitimate writes in beaver or allow out-of-scope writes in scaffolded projects. Test carefully.
- **Paired changes**: Phase 02 (templates) + Phase 03 (application) + Phase 04 (beaver-params registry) must run together
- **Not yet regenerated**: This phase updates harness-setup.ts logic, but regeneration happens in Phase 04

