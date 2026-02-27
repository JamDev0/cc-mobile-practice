---
name: git-commit-message
description: Generate commit messages that follow the repository's existing commit message patterns. Use when the user asks to create a commit, write a commit message, or wants to commit changes following project conventions.
---

# Git Commit Message Generator

Generate commit messages aligned with the repository's existing patterns by analyzing recent commits.

## Workflow

Follow these steps in order:

### Step 1: Gather Context

Run the context gathering script:

```bash
~/.cursor/skills/git-commit-message/scripts/gather-context.sh
```

This script outputs:
- The last 40 commit messages (showing the repository's commit style)
- The currently staged changes (the diff to describe)

### Step 2: Analyze Commit Patterns

From the last 40 commits, identify:
- Format style (conventional commits, simple descriptions, ticket prefixes, etc.)
- Tense used (imperative "Add", past "Added", present "Adds")
- Scope conventions (if using conventional commits)
- Any prefix patterns (ticket numbers, emojis, tags)

### Step 3: Generate Commit Message

Create a commit message for the staged changes that:
1. Matches the identified pattern from recent commits
2. Accurately describes what the staged changes do
3. Focuses on the "why" rather than the "what" when appropriate

## Output

Present the generated commit message on a git commit command in a code block, ready to copy:

```
git commit -m "<generated commit message here>"
```

If the message needs a body, format as:

```
git commit -m "<subject line>

<body explaining the change>"
```

## Common Patterns Reference

| Pattern | Example |
|---------|---------|
| Conventional | `feat(auth): add JWT validation` |
| Simple | `Add user authentication` |
| Ticket prefix | `[JIRA-123] Fix login timeout` |
| Emoji | `:sparkles: Add new feature` |

Match whatever pattern the repository uses based on the recent commits, it do not need to be included on the refferenced patterns.
