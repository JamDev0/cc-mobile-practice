# Mobile Practice V1 - System Contract (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-SYSTEM-CONTRACT |
| Version | 1.0.0 |
| Status | Approved for implementation |
| Product | Mobile web app for solving PDF-based exams |
| Target Runtime | Next.js `16.1.6` (App Router) |
| Primary Device | Mobile browser |
| Secondary Device | None for V1 (desktop support is out of scope) |
| Primary Language | pt-BR content expected, UI can be pt-BR or en-US |
| Storage Model | Local only (IndexedDB) |
| Network Model | Fully offline-capable for all V1 core features |

---

## 2) Product Positioning

### 2.1 Core Problem

Students solve exam PDFs manually outside digital correction workflows. They need:
- fast answer capture over PDF context,
- lightweight grading against a gabarito,
- no account friction,
- full offline use.

### 2.2 Core Outcome

A single user can:
1. Open a PDF in a local session.
2. Tap anywhere in the PDF to place a marker.
3. Assign answer token (`A/B/C/D/E/-`) and question number.
4. Import gabarito via plain text formats.
5. Review and grade attempts with conflict signaling.

---

## 3) Scope Boundary

### 3.1 In Scope (V1)

| ID | Capability | Notes |
|---|---|---|
| S-01 | One session per PDF | User can switch sessions, but each session has one PDF |
| S-02 | Marker overlay | Marker anchored by page + normalized coordinates |
| S-03 | Radial answer picker | Primary input interaction after PDF tap |
| S-04 | Editable question number | Default to sequential, editable by user |
| S-05 | Duplicate question number allowed | Conflicts must be surfaced and excluded from score |
| S-06 | Gabarito import format A | `1A, 2B, 3C` style |
| S-07 | Gabarito import format B | `A,B,D,...` with user-defined start index |
| S-08 | Review page | Question-number ordered list, grading statuses |
| S-09 | Jump to marker | Tap question number in review to focus marker in PDF |
| S-10 | Local persistence | IndexedDB only, no cloud sync |

### 3.2 Out of Scope (V1)

| ID | Capability | Reason |
|---|---|---|
| O-01 | OCR question detection | High complexity, low reliability in MVP timeline |
| O-02 | Automatic answer region mapping | Deliberately removed by product decision |
| O-03 | Auth/login | Not required for local-only MVP |
| O-04 | Multi-user collaboration | Not required |
| O-05 | Teacher portal | Not required |
| O-06 | Advanced analytics | Not required |
| O-07 | Cloud backup/sync | Deferred |
| O-08 | Accessibility compliance certification | Deferred (basic accessibility still required) |

---

## 4) Product Principles (Hard Rules)

1. **No OCR dependency** in any core path.
2. **No backend requirement** for V1 core use.
3. **Any score must be reproducible** from deterministic local state.
4. **Conflicts must never be hidden**; conflict state must be explicit in UI and grade.
5. **PDF interaction must preserve spatial context** (marker pinned to page position).
6. **Offline-first behavior** is mandatory, not optional.

---

## 5) Functional Requirements

### 5.1 Session Lifecycle

| Req ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | User can create session from a local PDF file | P0 | Selecting a PDF creates persistent session metadata + PDF blob |
| FR-002 | User can reopen existing session | P0 | Session restores markers, gabarito, and UI defaults |
| FR-003 | User can switch sessions | P0 | Switching does not corrupt previous session data |
| FR-004 | One session maps to one PDF | P0 | Session creation enforces one PDF attachment |

### 5.2 Solve Flow

| Req ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-010 | Tap PDF to create pending marker candidate | P0 | Candidate appears on tapped page at normalized coordinates |
| FR-011 | Open radial answer picker on marker creation | P0 | Picker displays `A,B,C,D,E,-` |
| FR-012 | Save marker with selected answer token | P0 | Marker persists with answer + question number |
| FR-013 | Default question number uses last inserted + 1 | P0 | If last inserted was `5`, next default is `6` |
| FR-014 | User can edit question number before save | P0 | Edit is validated and persisted |
| FR-015 | User can edit saved marker answer + number | P0 | Edit updates state and review consistency |
| FR-016 | User can drag marker position after save | P1 | Position update persists and remains page-accurate |
| FR-017 | User can delete marker | P0 | Deletion immediate; review and grade update instantly |

### 5.3 Conflict Logic

| Req ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-020 | Duplicate question number is allowed | P0 | System stores all duplicates |
| FR-021 | User receives alert before editing into duplicate | P0 | Pre-commit warning appears |
| FR-022 | Duplicates flagged as conflict status | P0 | All duplicates display conflict badge |
| FR-023 | Conflicted questions excluded from score | P0 | `excludedConflictCount` increments, no correct/wrong assignment |

### 5.4 Gabarito Import

| Req ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-030 | Parse numbered format (`1A,2B`) | P0 | Valid entries imported with strict token validation |
| FR-031 | Parse sequential format (`A,B,C`) | P0 | Start question prompt required and applied |
| FR-032 | Partial import with warnings | P0 | Invalid tokens skipped; warning report generated |
| FR-033 | User decides replace vs merge on existing gabarito | P0 | Modal offers both actions |
| FR-034 | User can manually edit gabarito after import | P0 | Edits persisted and reflected in grade |

### 5.5 Review & Grading

| Req ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-040 | Review ordered by question number ascending | P0 | Always sorted ascending |
| FR-041 | Show user answer and gabarito answer side-by-side | P0 | Row includes both tokens and status badge |
| FR-042 | Tap question number to jump to PDF marker | P0 | Opens Solve tab, navigates to marker page, highlights marker |
| FR-043 | Tap answer cell to edit respective source | P0 | User answer cell edits marker; gabarito cell edits key |
| FR-044 | Missing user answer treated as blank/wrong | P0 | Grade marks wrong/blank according to token rules |
| FR-045 | Missing gabarito treated as not gradable | P0 | Row status = not gradable, excluded from correct/wrong |

---

## 6) Non-Functional Requirements

| Req ID | Requirement | Target |
|---|---|---|
| NFR-001 | Mobile render performance | Initial view interactive under 2.5s for typical device |
| NFR-002 | Memory safety | Avoid full-document eager render for large PDFs |
| NFR-003 | Deterministic grading | Same input state always yields same score |
| NFR-004 | Offline resilience | App fully usable after first load, no network required |
| NFR-005 | Data durability | No data loss across normal refresh/reopen |
| NFR-006 | Error containment | Invalid import should not corrupt existing state |

---

## 7) UX Contract

### 7.1 Navigation Contract

- Bottom tab bar includes: `Solve`, `Review`, `Session`.
- Primary actions anchored near bottom for thumb access where possible.
- Absolute "single thumb everywhere" is not mandatory; primary actions are priority.

### 7.2 Solve Interaction Contract

1. User taps PDF.
2. Marker candidate appears.
3. Radial menu opens near tap.
4. User selects token.
5. Marker commits with default question number.
6. Optional inline edit for question number.

### 7.3 Review Interaction Contract

1. Row sorted by `questionNumber`.
2. Press question number => jump to marker.
3. Press user answer => edit user marker.
4. Press gabarito answer => edit gabarito entry.

---

## 8) Scoring Contract

### 8.1 Token Set

- Allowed answer tokens: `A`, `B`, `C`, `D`, `E`, `-`.
- `-` means explicit blank answer.

### 8.2 Result Categories Per Question

| Category | Definition | Included in score? |
|---|---|---|
| Correct | User token equals gabarito token and not conflict | Yes |
| Wrong | User token different from gabarito token | Yes |
| Blank wrong | User token missing or `-` while gabarito has non-blank | Yes (counts as wrong) |
| Not gradable | Gabarito missing for question | No |
| Conflict | Multiple user markers with same question number | No |

### 8.3 Score Outputs

- `gradableCount`
- `correctCount`
- `wrongCount`
- `blankCount` (subset of wrong if policy chooses; explicitly reported)
- `conflictExcludedCount`
- `notGradableCount`
- `accuracy = correctCount / gradableCount` (if `gradableCount > 0`)

---

## 9) Data Loss Warning Contract

Because V1 is local-only without backup:
- UI must show a clear warning in Session tab:
  - "Your data is stored only in this browser on this device."
  - "Clearing browser data may delete your sessions permanently."
- This warning is mandatory and cannot be removed by theme config.

---

## 10) Error Policy

| Error Type | User Message Style | Technical Handling |
|---|---|---|
| Invalid import token | Warning, non-blocking | Skip invalid item, continue import |
| Corrupt local record | Blocking with recovery option | Attempt schema repair, fallback to quarantine record |
| PDF render failure | Blocking for current session | Keep session metadata, allow reattach PDF |
| Jump target missing | Warning | Stay on review, prompt user to relink marker |

---

## 11) Risk Register

| Risk ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-01 | Duplicate conflicts confuse users | High | Persistent conflict badges + score exclusion explanation |
| R-02 | Radial picker mis-taps on small screens | Medium | Larger hit areas, delayed commit threshold |
| R-03 | Large PDF performance on low-end devices | High | Virtualized page rendering and lazy loading |
| R-04 | Local-only storage loss | High | Mandatory warning + future backup feature in post-V1 |
| R-05 | Parser ambiguity in free text imports | Medium | Strict grammar + warning report UI |

---

## 12) Definition of Done (System Level)

V1 is considered done only if:
1. All P0 functional requirements pass.
2. Conflict handling is visibly consistent across Solve + Review + Score.
3. Import parser supports both formats with partial warning report.
4. Jump from Review to marker works on multi-page PDFs.
5. Core flows function fully offline.
6. No backend dependency exists in runtime.

