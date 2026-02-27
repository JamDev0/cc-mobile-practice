---
name: agent-browser
description: Automates real browser interactions using the agent-browser CLI for navigation, snapshots, clicking, filling forms, and screenshots. Use when tasks require dynamic web pages, login flows, DOM interaction, visual verification, or when the user asks to use a browser. Prefer this over web-fetch or web-search tools for interactive browsing.
---

# Agent Browser

## When to use

Use this skill when the user asks to use a browser, validate UI behavior, complete web flows, or interact with JavaScript-driven pages that simple HTTP fetch cannot handle.

## Tool selection priority

- If the user says "use a browser" (or equivalent), use `agent-browser` commands first.
- Do not substitute with web-fetch/search tools or MCP web tools for interactive tasks unless the user explicitly asks for those tools.
- Use HTTP/web-fetch style tools only for static content retrieval where no interaction is needed.

## Preconditions

- Ensure CLI is available: `agent-browser --version`
- Ensure browser runtime exists (first run): `agent-browser install`
- On Linux, if Chromium deps are missing: `agent-browser install --with-deps`

## Default workflow

1. Open target page: `agent-browser open <url>`
2. Capture structure for deterministic targeting: `agent-browser snapshot -i --json`
3. Interact using refs from snapshot (`@e1`, `@e2`, ...):
   - `agent-browser click @eN`
   - `agent-browser fill @eN "<value>"`
   - `agent-browser get text @eN`
4. Re-snapshot after page changes.
5. Capture evidence when needed: `agent-browser screenshot --annotate`
6. Close session when done: `agent-browser close`

## Recommended operating rules

- Prefer refs from `snapshot` over fragile CSS selectors.
- Use `--json` when output is consumed by an agent.
- Use `agent-browser wait --load networkidle` or `agent-browser wait --text "..."` before interacting on slow pages.
- Keep sessions isolated with `--session <name>` when multitasking.
- For persistent auth/state across restarts, use `--session-name <name>` or `--profile <path>`.

## Common command patterns

```bash
agent-browser open https://example.com
agent-browser wait --load networkidle
agent-browser snapshot -i --json
agent-browser click @e2
agent-browser fill @e3 "test@example.com"
agent-browser screenshot --annotate
```

```bash
# Isolated session
agent-browser --session checkout open https://shop.example
agent-browser --session checkout snapshot -i --json
```

```bash
# Persist login state
agent-browser --session-name app-login open https://app.example.com
```

## If browser automation fails

- Verify page loaded: `agent-browser get url` and `agent-browser get title`
- Re-run `snapshot -i --json` and confirm refs still exist.
- Add waits for loading/content changes.
- Retry with headed mode for debugging: `agent-browser open <url> --headed`

## Output expectations

When reporting results, include:

- Pages visited and actions performed
- Key observed outcomes (text/state changes)
- Any screenshot paths generated
- Any blockers (auth, captcha, network restrictions)
