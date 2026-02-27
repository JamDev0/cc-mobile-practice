---
name: frontend-bug-hunt-playbook
description: Investigates and fixes frontend bugs with a strict, hypothesis-driven workflow. Use when debugging UI issues, touch/scroll/gesture regressions, layout breakage, React/Next.js behavior bugs, or frontend performance problems; requires root-cause validation and mandatory manual browser pass before concluding.
---

# Frontend Bug Hunt Playbook

## Purpose

Use this playbook to produce assertive fixes with high confidence, especially for interaction bugs that are easy to "partially fix".

## Default Output Contract

Use this structure:

1. Hypotheses (ranked)
2. Experiments run (what confirmed/rejected each hypothesis)
3. Root cause (single sentence)
4. Patch summary (minimal, targeted changes)
5. Proof of fix (tests + manual browser pass)
6. Residual risks and follow-ups

## Non-Negotiable Rules

- Do not conclude until one root cause is confirmed by evidence.
- Prefer minimal-scope fixes before larger refactors.
- Add or update regression tests for the reported behavior.
- Run typecheck and relevant tests after edits.
- Run a manual browser pass before concluding (mandatory).
- If manual pass and automated tests disagree, investigate and reconcile before concluding.

## Strict Workflow

Copy this checklist and keep it updated:

```markdown
Bug Hunt Progress:
- [ ] Reproduce bug
- [ ] Define expected behavior
- [ ] Build ranked hypotheses
- [ ] Run targeted experiments
- [ ] Confirm root cause
- [ ] Apply minimal fix
- [ ] Add/update regression tests
- [ ] Run typecheck + targeted tests
- [ ] Run manual browser pass
- [ ] Report proof and residual risks
```

## Step 1: Reproduce and Bound

- Capture exact symptoms, where they happen, and where they do not.
- Separate environment factors (mobile/desktop, browser family, viewport).
- Document the expected behavior in one clear sentence.

## Step 2: Hypothesis Ranking

Create 3-5 hypotheses max, ranked by likelihood and blast radius:

- Event model mismatch (touch/pointer/wheel/passive listeners)
- Scroll container/layout constraints (`min-height`, overflow ownership, fixed elements)
- State timing/race (open/close state, async updates, stale refs)
- Rendering/perf bottlenecks (expensive rerenders, sync work in interaction path)
- CSS interaction locks (`touch-action`, `pointer-events`, transform stacking)

## Step 3: Targeted Experiments

For each hypothesis, run one focused experiment:

- Observe computed styles and container metrics.
- Verify event firing sequence and gate conditions.
- Toggle one condition at a time to isolate causality.
- Prefer direct measurements over visual guesses.

Stop when one hypothesis is confirmed with direct evidence.

## Step 4: Patch Strategy

- Fix the confirmed cause, not nearby symptoms.
- Scope lock/gesture logic to the owning component when possible.
- Avoid global document/body side effects unless strictly necessary.
- Keep behavior explicit for open/closed states.

## Step 5: Regression Armor

- Add/update tests that fail on pre-fix behavior and pass post-fix.
- Cover state boundaries (before, during, after interaction).
- For interaction bugs, include at least one end-to-end check where practical.

## Step 6: Mandatory Manual Browser Pass

Use `agent-browser` and report measurable observations:

- Baseline behavior before trigger
- Behavior during trigger state
- Behavior after trigger ends

Minimum evidence to report:

- Page/flow executed
- Actions performed
- Measured values or state transitions
- Final observed result

## Frontend Bug Patterns (Quick Heuristics)

- **Scroll bugs**: Verify real scroll owner and whether container is constrained (`clientHeight < scrollHeight`).
- **Gesture bugs**: Confirm `touch-action` and pointer/touch fallback path consistency.
- **Modal/overlay bugs**: Check z-index and pointer capture/release lifecycle.
- **Lag/perf bugs**: Remove sync writes in hot interaction loops; prefer optimistic UI updates.
- **Highlight/selection bugs**: Ensure cleanup on close/unmount and timeout cancellation.

## Reporting Template

```markdown
## Investigation
- Expected behavior:
- Actual behavior:
- Confirmed root cause:

## Fix
- Files changed:
- Why this fix addresses root cause:

## Validation
- Automated:
  - [command] -> [result]
- Manual browser pass:
  - [flow]
  - [observed measurements]
  - [result]

## Risks
- [remaining edge cases or follow-ups]
```

