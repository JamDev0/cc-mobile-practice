# Mobile Practice V1 - Agent Execution Playbook (Ralph Spec)

## 1) Document Metadata

| Field | Value |
|---|---|
| Spec ID | MP-V1-AGENT-PLAYBOOK |
| Version | 1.0.0 |
| Audience | Autonomous implementation agents |
| Mission Type | Multi-phase frontend build |

---

## 2) Primary Mission

Build a mobile-first, offline-first web application where a student:
1. opens a PDF session,
2. taps to add answer markers,
3. imports gabarito text,
4. reviews and grades answers,
5. resolves conflicts.

All behavior must align with:
- `00-system-contract-ralph-spec.md`
- `01-domain-data-model-ralph-spec.md`
- `02-solve-screen-interaction-ralph-spec.md`
- `03-import-review-grading-ralph-spec.md`
- `04-nextjs-architecture-delivery-ralph-spec.md`

---

## 3) Global Rules for Agents

1. Do not infer product behavior beyond the contract unless explicitly marked as extension-safe.
2. If a requirement conflicts with current implementation, update implementation, not spec.
3. Preserve deterministic grading semantics.
4. Never hide conflicts; conflict visibility is mandatory.
5. Avoid broad refactors while delivering P0 behavior.

---

## 4) Work Packet Plan

## WP-01: Project Bootstrap

| Item | Requirement |
|---|---|
| Goal | Prepare Next.js app shell and base structure |
| Inputs | architecture spec |
| Outputs | app routing skeleton, base layout, placeholder tabs |
| Exit Gate | `sessions` route renders and supports navigation |

## WP-02: Domain Contracts

| Item | Requirement |
|---|---|
| Goal | Implement type contracts and invariant guards |
| Inputs | domain data model spec |
| Outputs | shared types, validators, error codes |
| Exit Gate | static type checks pass with strict mode |

## WP-03: IndexedDB Layer

| Item | Requirement |
|---|---|
| Goal | Persistent local storage adapter |
| Inputs | storage schema spec |
| Outputs | db init, CRUD for sessions/markers/gabarito |
| Exit Gate | integration test: create->reload->read consistency |

## WP-04: Parser and Grading Engine

| Item | Requirement |
|---|---|
| Goal | Deterministic import parser and scoring |
| Inputs | import/review spec |
| Outputs | parser module + grading snapshot builder |
| Exit Gate | full unit matrix green for parser/grading |

## WP-05: Solve Screen

| Item | Requirement |
|---|---|
| Goal | PDF tap-to-marker flow with radial picker |
| Inputs | solve interaction spec |
| Outputs | marker placement/edit/delete/drag |
| Exit Gate | solve acceptance tests green |

## WP-06: Review Screen

| Item | Requirement |
|---|---|
| Goal | Sorted rows, side-by-side answers, jump and edits |
| Inputs | review/grading spec |
| Outputs | review UI and interactions |
| Exit Gate | review acceptance tests green |

## WP-07: Hardening and QA

| Item | Requirement |
|---|---|
| Goal | performance and failure handling stabilization |
| Inputs | all previous outputs |
| Outputs | optimized render behavior and robust error states |
| Exit Gate | release checklist complete |

---

## 5) Agent Prompt Template (for sub-agents)

Use this template when delegating each work packet:

```text
You are implementing WP-XX for Mobile Practice V1.
Read and obey these spec files in order:
1) specs/00-system-contract-ralph-spec.md
2) specs/01-domain-data-model-ralph-spec.md
3) specs/02-solve-screen-interaction-ralph-spec.md
4) specs/03-import-review-grading-ralph-spec.md
5) specs/04-nextjs-architecture-delivery-ralph-spec.md
6) specs/05-agent-execution-playbook-ralph-spec.md

Constraints:
- Keep behavior deterministic.
- Do not add backend dependencies.
- Do not change grading semantics.
- Raise explicit TODO if any required input is missing.

Deliverables:
- Code changes only for WP-XX scope.
- Tests for all added logic.
- Short implementation note listing decisions and tradeoffs.
```

---

## 6) Handoff Protocol Between Agents

Each agent must leave a structured handoff note:

| Field | Description |
|---|---|
| `packetId` | WP identifier |
| `completed` | yes/no |
| `filesChanged` | list of paths |
| `testsAdded` | list of test files |
| `knownLimitations` | unresolved issues |
| `followUpPacket` | next WP id |

Example:

```json
{
  "packetId": "WP-04",
  "completed": "yes",
  "filesChanged": [
    "src/features/gabarito/parser/parseGabarito.ts",
    "src/domain/grading/computeGradingSnapshot.ts"
  ],
  "testsAdded": [
    "src/tests/unit/parseGabarito.test.ts",
    "src/tests/unit/computeGradingSnapshot.test.ts"
  ],
  "knownLimitations": [
    "Whitespace normalization currently only supports commas and semicolons"
  ],
  "followUpPacket": "WP-05"
}
```

---

## 7) Quality Gates

## Gate A - Compile and Type Safety

- TypeScript strict compile passes.
- No `any` unless justified in a documented shim boundary.

## Gate B - Domain Determinism

- Same fixture input produces same grading snapshot across runs.
- Conflict semantics pass all duplicate scenarios.

## Gate C - Interaction Reliability

- Marker placement/edit/deletion reflects immediately in review and score.
- Jump-to-marker consistent for multi-page PDFs.

## Gate D - Offline Integrity

- Core flows run with network disabled after initial load.
- Data survives refresh/reopen.

---

## 8) Minimum Test Inventory

| Category | Minimum Count |
|---|---|
| Parser unit tests | 12 |
| Grading unit tests | 12 |
| Storage integration tests | 8 |
| Solve flow integration tests | 8 |
| Review flow integration tests | 8 |
| End-to-end mobile tests | 4 |

---

## 9) Common Failure Patterns and Mitigations

| Failure Pattern | Detection | Mitigation |
|---|---|---|
| Marker drift after zoom | visual mismatch test | enforce normalized coordinate mapping |
| Silent conflict overwrite | score mismatch vs row list | never collapse duplicate markers automatically |
| Parser over-acceptance | invalid imports appear valid | strict grammar and warning reporting |
| Partial DB writes | inconsistent UI after action | use atomic transactions |
| Review/sove desync | row tap jumps incorrectly | always resolve marker by id, not guessed question index |

---

## 10) No-Go Conditions

Stop and escalate if any occur:
1. Requirement conflict between spec files.
2. Inability to render target PDF reliably on supported device profile.
3. Non-deterministic grading due to unresolved race in write/recompute loop.
4. IndexedDB data corruption not recoverable via migration/repair.

---

## 11) Completion Report Template

```markdown
# Mobile Practice V1 - Execution Report

## Packet
- ID: WP-XX
- Scope: <short scope text>

## Changes
- Files: <list>
- Behavior delivered: <list>

## Verification
- Unit tests: pass/fail + counts
- Integration tests: pass/fail + counts
- Manual checks: <list>

## Risks Remaining
- <bullet list>

## Recommended Next Packet
- WP-YY
```

