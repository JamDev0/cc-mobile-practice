---
name: github-cli-help-sweep
description: Studies GitHub CLI capabilities by enumerating commands and collecting help text. Use when the user asks to learn gh commands, inspect available subcommands, or run help across the full command tree.
---

# GitHub CLI Help Sweep

## Purpose

Use this skill to systematically inspect GitHub CLI (`gh`) command capabilities and produce a reliable command reference.

## When To Apply

- User asks to "study gh", "list gh commands", "run help for all commands", or similar.
- User requests command discovery before automation, scripting, or documentation.
- User requests a full or partial `gh` capability inventory.

## Core Rules

- Prefer `--help` or `gh help <command> [subcommand]`.
- Do **not** assume `-h` means help for subcommands; in many `gh` commands, `-h` is `--hostname`.
- Build command inventory from `gh help reference` to cover top-level and subcommands.
- Handle special cases:
  - `gh completion` expects `-s <shell>` in usage; use `gh completion --help`.
  - `gh extension exec` treats trailing args as extension names; use `gh help extension exec`.
- Keep help collection non-interactive by redirecting stdin (`</dev/null`) in loops.

## Workflow

1. Collect reference:
   - Run `gh help reference`.
2. Extract command paths:
   - Parse `## gh ...` and `### gh ...` headings.
   - Remove argument placeholders like `[flags]`, `<name>`, etc.
3. Run help for each command path:
   - Use `gh <command path> --help </dev/null`.
   - Save each output to a separate file.
4. Run special-case help:
   - `gh completion --help`
   - `gh help extension exec`
5. Report outcomes:
   - Total command paths discovered.
   - Succeeded vs failed runs.
   - Notes on special handling and caveats.

## Utility Scripts

- `scripts/run.sh [output-dir]`
  - Runs the full help sweep and writes artifacts.
  - Default output directory: `.cursor/tmp/gh-help`
- `scripts/summary.sh [output-dir]`
  - Prints a concise summary from generated artifacts.
  - Shows non-zero exit commands and failure lines.

## Reference Implementation

```bash
# From the skill directory:
bash scripts/run.sh
bash scripts/summary.sh

# Optional custom output directory:
bash scripts/run.sh /tmp/gh-help
bash scripts/summary.sh /tmp/gh-help
```

## Output Template

Use this format when reporting:

```markdown
GitHub CLI help sweep complete.

- Commands discovered: <N>
- Help succeeded: <N>
- Help failed: <N>
- Special cases handled: `gh completion --help`, `gh help extension exec`
- Notes: `-h` is not universally help for `gh` subcommands; prefer `--help` or `gh help ...`.
```
