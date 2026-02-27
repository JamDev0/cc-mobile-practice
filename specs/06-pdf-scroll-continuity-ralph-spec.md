# Mobile Practice V1 - PDF Scroll Continuity Spec (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-SOLVE-PDF-SCROLL |
| Version | 1.0.0 |
| Depends On | `00-system-contract-ralph-spec.md`, `02-solve-screen-interaction-ralph-spec.md` |
| Audience | Solve UI agents, QA agents |

---

## 2) Objective

Guarantee uninterrupted vertical navigation through all pages in Solve mode, including long PDFs, without becoming stuck near page 2.

---

## 3) Problem Statement

Observed behavior:
1. User scrolls in PDF viewport.
2. Rendering window and active-page detection drift.
3. Viewport stops progressing beyond the early pages.

Impact:
- Core answer capture flow is blocked for multi-page exams.

---

## 4) Behavior Contract

## 4.1 Scroll Reachability

1. User can scroll from page 1 to page N and back.
2. Reachability must hold independent of marker count.
3. Reachability must hold after jump-to-marker and edit-sheet open/close.

## 4.2 Active Page Tracking

1. Active page is derived from the page whose center is closest to viewport center.
2. Active page update must be monotonic with natural scroll direction unless user reverses direction.
3. Active page must not oscillate rapidly at page boundaries.

## 4.3 Rendering Strategy

1. Rendering optimization must never hide pages in a way that blocks natural scrolling.
2. If windowing is used, mount/unmount policy must preserve continuous scroll height semantics.
3. If continuity cannot be guaranteed with current windowing approach, fallback to fully rendered page list is acceptable for V1 correctness.

---

## 5) Non-Functional Constraints

| Metric | Target |
|---|---|
| Scroll input latency | no visible stutter in 60Hz interaction |
| Active page update delay | <= 100 ms perceived |
| Jump-to-target completion | <= 600 ms typical |

---

## 6) Implementation Guidance

1. Review `PdfViewport` active-page algorithm and child traversal assumptions.
2. Avoid logic that depends on unstable DOM order or temporary virtual nodes.
3. Prefer robust geometric checks based on container viewport and page rects.
4. Keep tap-to-marker and marker overlay coordinate mapping unchanged.

---

## 7) Failure Handling

| Condition | Handling |
|---|---|
| Missing page element during jump | retry after next frame; do not consume jump early |
| Page count unknown | allow incremental render until count resolves |
| PDF load error | preserve existing blocking error panel |

---

## 8) Acceptance Tests

| Test ID | Scenario | Expected |
|---|---|---|
| PSC-01 | Scroll through 5+ page PDF | last page becomes reachable |
| PSC-02 | Scroll down then up | active page tracks correctly both directions |
| PSC-03 | Jump from review to late page | viewport lands near target page |
| PSC-04 | Add marker after long scroll | marker persists on correct page |
| PSC-05 | Open/close edit sheet mid-scroll | no loss of scroll continuity |

---

## 9) Exit Criteria

1. Solve flow no longer blocks near second page.
2. Targeted solve tests pass.
3. Typecheck passes.
