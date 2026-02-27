# Mobile Practice V1 - Tab Bar Pointer Isolation Spec (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-NAV-POINTER-ISOLATION |
| Version | 1.0.0 |
| Depends On | `00-system-contract-ralph-spec.md`, `02-solve-screen-interaction-ralph-spec.md`, `04-nextjs-architecture-delivery-ralph-spec.md` |
| Audience | Navigation UI agents, QA agents |

---

## 2) Objective

Ensure tab bar taps always trigger tab navigation and never leak to underlying Solve PDF interactions.

---

## 3) Problem Statement

Observed behavior:
- With PDF content visually under the fixed nav, tapping nav can create a pending answer marker instead of switching tabs.

Impact:
- User intent is inverted.
- Data integrity risk due to accidental answer creation.

---

## 4) Interaction Contract

## 4.1 Priority of Pointer Targets

1. Tab bar is the top-most interactive layer in its visual bounds.
2. Any tap within tab bar bounds must dispatch only to tab controls.
3. Underlying solve canvas must not receive pointer events for those taps.

## 4.2 Layout Safety

1. Main content reserves bottom spacing equal to tab bar height.
2. Safe-area inset support must be respected on mobile devices.
3. Scrollable content remains fully reachable above nav bar.

## 4.3 Accessibility

1. Each tab remains a `role="tab"` element.
2. Minimum hit target is `44x44` CSS px.
3. Active tab continues to expose `aria-selected=true`.

---

## 5) Implementation Guidance

1. Use explicit stacking context (`z-index`) for fixed tab bar.
2. Audit pointer-events usage for solve viewport overlays and portals.
3. Keep tab bar independent from solve gesture handlers.
4. Do not regress existing tab keyboard behavior.

---

## 6) Regression Boundaries

Must not break:
1. Marker placement on PDF content above nav.
2. Radial picker interactions.
3. Edit sheet interactions.
4. Review and Session tab switching.

---

## 7) Acceptance Tests

| Test ID | Scenario | Expected |
|---|---|---|
| NPI-01 | Tap each tab from Solve view | active tab changes correctly |
| NPI-02 | Tap near top edge of tab bar | no pending marker created |
| NPI-03 | Repeated rapid tab taps | no leaked solve interactions |
| NPI-04 | Mobile safe area viewport | tabs remain tappable and isolated |

---

## 8) Exit Criteria

1. No accidental marker creation from nav taps.
2. Tab bar tests pass.
3. Solve interaction tests still pass.
