# Mobile Practice V1 - Review Delete User Answer Spec (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-REVIEW-DELETE-ANSWER |
| Version | 1.0.0 |
| Depends On | `01-domain-data-model-ralph-spec.md`, `03-import-review-grading-ralph-spec.md` |
| Audience | Review UI agents, storage agents, QA agents |

---

## 2) Objective

Allow users to delete user-answer markers directly from Review without manually navigating to Solve first.

---

## 3) Scope

In scope:
1. Single-marker row deletion.
2. Conflict row deletion of a selected marker.
3. Immediate grading snapshot recomputation.

Out of scope:
1. Bulk delete all markers for a session.
2. Undo stack (V1 may use confirm dialog only).

---

## 4) Behavior Contract

## 4.1 Row-Level Action

Each review row with at least one user marker exposes a delete affordance for user answer data.

## 4.2 Single Marker Case

1. User taps delete.
2. Optional confirm prompt appears.
3. Marker is removed by `markerId`.
4. Row updates to missing-user state.
5. Counters and score update immediately.

## 4.3 Conflict Case

1. Row has multiple markers for same question.
2. Delete action prompts selection of target marker.
3. Selected marker is deleted.
4. Row status recalculates (may remain conflict or become non-conflict).

---

## 5) Data Contract

1. Deletion uses existing marker adapter delete operation.
2. After mutation, review snapshot is recomputed from fresh marker list + gabarito list.
3. Write errors must surface in existing `writeError` banner pattern.

---

## 6) UX Contract

| Element | Rule |
|---|---|
| Delete affordance | clear icon/text, mobile hit size >= 44x44 |
| Confirm copy | explicit: "Delete this user answer?" |
| Error state | non-blocking banner, action can be retried |

---

## 7) Acceptance Tests

| Test ID | Scenario | Expected |
|---|---|---|
| RDA-01 | Delete single-marker row | user answer removed, row updates |
| RDA-02 | Delete from conflict row | selected marker removed, status recomputed |
| RDA-03 | Delete causes missing-user row | mismatch counts update |
| RDA-04 | IndexedDB delete failure | write error banner shown |

---

## 8) Exit Criteria

1. User-answer deletion is available directly in Review.
2. Grading snapshot remains deterministic after delete.
3. Review tests covering delete flow pass.
