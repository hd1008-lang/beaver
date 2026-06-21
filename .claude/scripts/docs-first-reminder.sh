#!/usr/bin/env bash
# UserPromptSubmit hook: inject a docs-first reminder when the prompt mentions
# a documented feature/flow/domain topic. Silent otherwise to avoid noise.
# The harness runs this on every user prompt, so the reminder cannot be skipped.
payload="$(cat)"

# Keep in sync with feature folders under docs/features/ + key domain nouns.
# Add an alternation entry whenever a new feature doc is created.
trigger='scaffold|template|menu|cart|claude-setup|harness'

if echo "$payload" | grep -iqE "$trigger"; then
  cat <<'EOF'
[docs-first guard] This request appears to touch a documented feature/flow.
BEFORE opening source code:
  1. Read docs/INDEX.md (grouped by feature / flow / layer + keyword index).
  2. Narrow with frontmatter grep, e.g.:
       grep -rlE '^feature: <feature>' docs/ | xargs grep -lE '^flow: <flow>'
  3. Read candidate doc bodies (<=5 files), then follow `related:` links.
  4. Open source only if docs are insufficient — and state what the docs covered.
EOF
fi
exit 0
