# Mobile Practice V1 - Spec Index and Reading Order (Ralph Spec)

## 1) Purpose

This file is the canonical entry point for autonomous agents.  
Read this file first, then consume specs in strict dependency order.

---

## 2) File Inventory

| Order | File | Purpose |
|---|---|---|
| 1 | `specs/00-system-contract-ralph-spec.md` | Product contract, scope, requirement IDs |
| 2 | `specs/01-domain-data-model-ralph-spec.md` | Domain types, invariants, storage, algorithms |
| 3 | `specs/02-solve-screen-interaction-ralph-spec.md` | Solve UI behavior, radial picker, marker flow |
| 4 | `specs/03-import-review-grading-ralph-spec.md` | Import grammar, review rules, grading semantics |
| 5 | `specs/04-nextjs-architecture-delivery-ralph-spec.md` | App architecture, modules, delivery phases |
| 6 | `specs/05-agent-execution-playbook-ralph-spec.md` | Work packets, gates, handoff protocol |
| 7 | `specs/06-pdf-scroll-continuity-ralph-spec.md` | Solve PDF continuous scroll and active-page contract |
| 8 | `specs/07-tabbar-pointer-isolation-ralph-spec.md` | Bottom nav pointer isolation and layering |
| 9 | `specs/08-answer-edit-entry-ralph-spec.md` | Deterministic edit entry from answer taps |
| 10 | `specs/09-review-jump-scroll-target-ralph-spec.md` | Review-to-solve jump scroll reliability |
| 11 | `specs/10-review-delete-user-answer-ralph-spec.md` | Delete user answers directly from review |
| 12 | `specs/11-radial-press-slide-release-ralph-spec.md` | Radial picker press-slide-release gesture contract |
| 13 | `specs/12-in-session-switch-navigation-ralph-spec.md` | In-session navigation to switch sessions |
| 14 | `specs/99-spec-index-ralph-spec.md` | Entry point and dependency graph |

---

## 3) Dependency Graph

```mermaid
flowchart TD
  S00[00-system-contract] --> S01[01-domain-data-model]
  S01 --> S02[02-solve-screen-interaction]
  S01 --> S03[03-import-review-grading]
  S00 --> S04[04-nextjs-architecture-delivery]
  S02 --> S04
  S03 --> S04
  S04 --> S05[05-agent-execution-playbook]
  S00 --> S05
  S01 --> S05
  S02 --> S06[06-pdf-scroll-continuity]
  S02 --> S07[07-tabbar-pointer-isolation]
  S02 --> S08[08-answer-edit-entry]
  S02 --> S09[09-review-jump-scroll-target]
  S03 --> S10[10-review-delete-user-answer]
  S02 --> S11[11-radial-press-slide-release]
  S04 --> S12[12-in-session-switch-navigation]
```

---

## 4) Agent Consumption Protocol

1. Parse requirement IDs from `00`.
2. Build data contracts and invariants from `01`.
3. Implement Solve flow from `02`.
4. Implement parser/review/grading from `03`.
5. Align app structure and phase execution with `04`.
6. Apply issue-focused contracts from `06` through `12` as needed.
7. Execute work packets and gates in `05`.
8. Report completion using template in `05`.

---

## 5) Conflict Resolution Rule

If two files appear inconsistent:
1. `00-system-contract` has highest authority for product behavior.
2. `01-domain-data-model` has highest authority for data semantics.
3. UI/architecture files must conform to 00 and 01.

If unresolved conflict remains, stop implementation and escalate.

---

## 6) Minimum Build Command Contract (Suggested)

Agents should keep a reproducible command sequence:

```bash
npm install
npm run typecheck
npm run test
npm run build
```

If project scripts differ, align command set in package-level docs before implementation continues.

