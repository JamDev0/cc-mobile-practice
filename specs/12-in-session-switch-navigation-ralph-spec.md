# Mobile Practice V1 - In-Session Switch Navigation Spec (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-SESSION-SWITCH-NAV |
| Version | 1.0.0 |
| Depends On | `00-system-contract-ralph-spec.md`, `04-nextjs-architecture-delivery-ralph-spec.md` |
| Audience | Navigation agents, session UX agents |

---

## 2) Objective

Allow users to change from the current session to another session while inside the session route.

---

## 3) Navigation Contract

## 3.1 Required Affordance

At least one always-discoverable action inside session route must navigate to session list (`/sessions`), with clear "switch session" semantics.

Allowed locations:
1. Session page header.
2. Session tab panel.
3. Both (recommended for mobile discoverability).

## 3.2 Behavior

1. Tapping switch affordance routes to `/sessions`.
2. Existing unsaved state constraints remain unchanged (no new blocking modal required for V1).
3. Returning to a session from list keeps current persistence model (IndexedDB) intact.

---

## 4) UX and Accessibility Contract

| Requirement | Rule |
|---|---|
| Label clarity | include verb, e.g. "Switch session" or "Back to sessions" |
| Touch size | >= 44x44 CSS px |
| Semantics | link/button accessible by keyboard and screen reader |
| Placement | visible without deep scrolling whenever possible |

---

## 5) Regression Constraints

Must not break:
1. Solve/Review/Session tab navigation.
2. Session metadata display.
3. Existing session-not-found behavior.

---

## 6) Acceptance Tests

| Test ID | Scenario | Expected |
|---|---|---|
| SSN-01 | Open session route | switch affordance is visible |
| SSN-02 | Activate switch action | route changes to `/sessions` |
| SSN-03 | Use keyboard activation | navigation works with Enter/Space per element type |
| SSN-04 | Session-not-found route | switch affordance still available |

---

## 7) Exit Criteria

1. Users can change sessions without URL manual editing.
2. Navigation affordance is clear and accessible.
3. Session navigation tests pass.
