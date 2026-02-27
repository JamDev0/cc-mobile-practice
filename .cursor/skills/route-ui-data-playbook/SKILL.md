---
name: route-ui-data-playbook
description: Builds route-to-UI data gathering guides with Swagger-ready payload templates. Use when the user asks for step-by-step instructions to collect data via UI for API routes, group endpoints by shared data, avoid repetition, and map placeholders to substitution keys.
---

# Route UI Data Playbook

## Purpose

Produce a reusable guide that maps API routes to:

1. UI actions that gather required data
2. Swagger-ready request templates
3. Placeholder keys to substitute
4. Grouped sections by shared data to avoid repetition

## When To Use

Use this skill when the user asks to:

- explain how to call routes from UI-collected data
- document payloads for Swagger testing
- group endpoints by shared required data
- avoid repeating steps across similar routes

## Required Output

Create or update a `.md` guide containing:

1. **Scope**: explicit route list
2. **Global assumptions**: auth mode, headers, session behavior
3. **Grouped route sections**:
   - route list
   - Swagger templates for each route
   - "Data to gather once" with placeholder mapping
   - UI step-by-step flow
4. **Quick mapping**: `route -> UI action` with placeholder hints

## Strict Workflow

Follow this checklist in order:

```text
Task Progress:
- [ ] Step 1: Confirm auth mode and constraints
- [ ] Step 2: Locate backend route validators/schemas
- [ ] Step 3: Locate frontend UI actions that trigger those routes
- [ ] Step 4: Extract exact required fields (path/query/body/headers)
- [ ] Step 5: Group routes by shared data needs
- [ ] Step 6: Write Swagger templates with placeholders
- [ ] Step 7: Add placeholder-substitution mapping in each section
- [ ] Step 8: Add quick route-to-UI map
- [ ] Step 9: Verify consistency of placeholder names across file
```

## Implementation Rules

- Do not duplicate steps across routes that share the same data family.
- Keep placeholders uppercase with angle brackets, for example `<WORKFLOW_ID>`.
- Reuse the same placeholder token globally for the same concept.
- Mark optional values explicitly with `_OPTIONAL` suffix when useful.
- Prefer concrete template blocks over abstract prose.
- If auth mode is not provided, ask before finalizing assumptions.

## Template Standard

For each route, include a Swagger-ready block with applicable keys:

- `path`
- `headers`
- `query`
- `body`

Omit irrelevant keys for that route.

## Quality Gate

Before finishing, validate:

- Every route from scope appears in exactly one grouped section.
- Every placeholder used in templates is explained in "Data to gather once" or global reference.
- "Quick mapping" includes all routes.
- No conflicting placeholder names for the same value.

## Additional Resources

- Detailed section structure and placeholder conventions: [reference.md](reference.md)
- Complete examples to emulate: [examples.md](examples.md)
