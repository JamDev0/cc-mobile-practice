#!/bin/bash
# Gathers git context for commit message generation
# Outputs: recent commit messages and staged changes

echo "=== LAST 40 COMMIT MESSAGES ==="
git log --oneline -40 --format="%s" 2>/dev/null | cat || echo "No commits found or not a git repository"

echo ""
echo "=== STAGED CHANGES ==="
STAGED=$(git diff --cached 2>/dev/null)
if [ -z "$STAGED" ]; then
    echo "No staged changes found. Stage your changes with 'git add' first."
else
    echo "$STAGED"
fi
