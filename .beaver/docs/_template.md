---
title: <Concise title; mirror the H1 below>
feature: _app        # feature folder name under docs/features/ | _app (cross-cutting)
flow: _meta          # enum: menu | scaffold | templates | infra | architecture | onboarding | _meta
layer: _cross        # enum: options | scaffold | types | constants | utils | _cross
status: active       # enum: active | draft | deprecated
lang: en             # enum: en | vi
related: []          # array of doc paths relative to docs/
keywords: []         # lowercase kebab-case; prefer real symbol/file names from the repo
updated: YYYY-MM-DD
---

# <Title>

## Context
What problem was being solved and why it was non-obvious.

## Root Cause / Key Finding
The core discovery that unblocked the task.

## Solution / Pattern
What was implemented and why.

## Key Decisions
Trade-offs made and alternatives rejected.

## Related Files
- path/to/relevant/file.ts
