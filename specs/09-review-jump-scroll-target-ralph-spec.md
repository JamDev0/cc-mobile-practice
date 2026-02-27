# Mobile Practice V1 - Review Jump Scroll Target Spec (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-REVIEW-JUMP-TARGET |
| Version | 1.0.0 |
| Depends On | `02-solve-screen-interaction-ralph-spec.md`, `03-import-review-grading-ralph-spec.md` |
| Audience | Cross-tab navigation agents |

---

## 2) Objective

When a user jumps from Review to a specific answer, Solve must land on the correct page and visually bring target marker into view.

---

## 3) Problem Statement

Observed behavior:
- Review jump only changes tab/page context, but does not reliably scroll to marker location.

Impact:
- User loses context and must manually search marker.

---

## 4) Jump Contract

## 4.1 Input Payload

```ts
interface JumpRequest {
  sessionId: string
  markerId: string
  pageNumber: number
  openEditMarkerId?: string
}
```

## 4.2 Required Sequence

1. Validate session match.
2. Resolve marker existence.
3. Set solve tab active.
4. Ensure target page element is mounted.
5. Scroll target page into view.
6. Highlight marker for short pulse.
7. Optionally open edit sheet if `openEditMarkerId` matches.

## 4.3 Timing Robustness

1. If page node is not yet mounted, retry in subsequent frames.
2. Jump must not be consumed before at least one mount-aware scroll attempt.
3. Retry loop must be bounded to avoid infinite work.

---

## 5) Failure Handling

| Condition | Handling |
|---|---|
| Marker not found | show warning toast and consume request |
| Session mismatch | ignore request and keep current tab |
| Retry exhausted | show warning and keep solve usable |

---

## 6) Acceptance Tests

| Test ID | Scenario | Expected |
|---|---|---|
| RJT-01 | Jump to page with delayed mount | eventual scroll to target page |
| RJT-02 | Jump with openEditMarkerId | edit sheet opens for target marker |
| RJT-03 | Jump to missing marker | warning displayed, no crash |
| RJT-04 | Repeated jumps to different pages | latest request wins, each lands correctly |

---

## 7) Exit Criteria

1. Review jump consistently lands at target answer context.
2. No silent jump consumption before scroll attempt.
3. Jump-related tests pass.
