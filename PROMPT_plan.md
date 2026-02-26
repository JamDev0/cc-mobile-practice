0a. Study `specs/*` to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0d. For reference, the application source code is in `./src`.

1. Study @IMPLEMENTATION_PLAN.md (if present; it may be incorrect) and study existing source code in `./src` and compare it against `specs/*`. Analyze findings, prioritize tasks, and create/update @IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented. Ultrathink. Consider searching for TODO, minimal implementations, placeholders, skipped/flaky tests, and inconsistent patterns. Study @IMPLEMENTATION_PLAN.md to determine starting point for research and keep it up to date with items considered complete/incomplete.

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first. Prefer consolidated, idiomatic implementations there over ad-hoc copies.

ULTIMATE GOAL: Deliver a production-ready V1 of the mobile-first, offline-first Next.js 16.1.6 app defined in `specs/*`, where a student can open one PDF per session, place/edit/delete answer markers via tap + radial token picker (`A-E,-`), import/edit gabarito from both plain-text formats (numbered and sequential), review answers side-by-side with deterministic grading (including explicit conflict and not-gradable handling), jump from review rows to PDF markers, and persist all core data locally in IndexedDB with reliable performance and no backend dependency.