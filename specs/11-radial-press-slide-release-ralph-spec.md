# Mobile Practice V1 - Radial Press-Slide-Release Spec (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-RADIAL-GESTURE-PSR |
| Version | 1.0.0 |
| Depends On | `02-solve-screen-interaction-ralph-spec.md` |
| Audience | Gesture interaction agents, QA agents |

---

## 2) Objective

Define a deterministic radial picker gesture where selection activates on press, previews during slide, and commits on release.

---

## 3) Gesture Contract

## 3.1 Lifecycle

1. `pointerdown`: gesture starts, picker enters active tracking mode.
2. `pointermove`: preview token updates as finger slides across slices.
3. `pointerup`: commit token currently under pointer.
4. `pointercancel` or release in dead zone: cancel pending marker.

## 3.2 Pointer Capture

1. Component captures pointer at gesture start.
2. Tracking continues even if pointer leaves initial bounds.
3. Capture is always released on end/cancel.

## 3.3 Dead Zone Rule

1. Inner circle is neutral zone.
2. Release inside dead zone cancels, does not commit.

---

## 4) Visual Feedback Contract

| State | Required Visual |
|---|---|
| Idle | all slices low emphasis |
| Active preview | hovered slice highlighted |
| Commit | picker closes and marker persists |
| Cancel | picker closes and no marker persists |

---

## 5) Reliability Rules

1. Exactly one of `onSelect` or `onCancel` fires per gesture.
2. Multiple `pointermove` events must not trigger commits.
3. Drag jitter near slice boundaries must not produce duplicate saves.

---

## 6) Acceptance Tests

| Test ID | Scenario | Expected |
|---|---|---|
| RPS-01 | Press then release over slice | corresponding token committed |
| RPS-02 | Press, slide across slices, release | token under release point committed |
| RPS-03 | Press then release in dead zone | cancel without marker save |
| RPS-04 | Pointer cancel during gesture | cancel once, no commit |

---

## 7) Exit Criteria

1. Radial selector follows press-slide-release interaction.
2. No duplicate marker commits from one gesture.
3. Gesture tests pass.
