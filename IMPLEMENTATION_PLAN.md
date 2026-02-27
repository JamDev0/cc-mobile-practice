# Mobile Practice V1 - Implementation Plan

## Work Packet Status

| Packet | Scope | Status | Exit Gate |
|--------|-------|--------|-----------|
| WP-01 | Project Bootstrap | Done | sessions route renders and supports navigation |
| WP-02 | Domain Contracts | Done | static type checks pass with strict mode |
| WP-03 | IndexedDB Layer | Done | integration test: create->reload->read ✓ |
| WP-04 | Parser and Grading Engine | Done | full unit matrix green for parser/grading |
| WP-05 | Solve Screen | Done | solve acceptance tests green |
| WP-06 | Review Screen | Done | review acceptance tests green |
| WP-07 | Hardening and QA | Done | release checklist complete |

## Issue-focused Specs (06–12) — Complete

| Spec | Scope | Status |
|------|-------|--------|
| 06 | PDF scroll continuity (fallback full render, active-page tracking) | Done |
| 07 | Tab bar pointer isolation (z-index, safe-area, no leaked solve taps) | Done |
| 08 | Answer edit entry (AEE-01–04, MarkerDot pointer capture guarded) | Done |
| 09 | Review jump scroll target (retry loop, onScrollAttempted, RJT-01–04) | Done |
| 10 | Review delete user answer (RDA-01–04, DeleteConflictPickerModal) | Done |
| 11 | Radial press-slide-release (pointer capture, settleOnce, RPS-01–04) | Done |
| 12 | In-session switch navigation (SSN-01–04, header + Session tab link) | Done |

**Release checklist (spec 04 §15)**: ✓ All P0 tests pass; ✓ Playwright viewport smoke (mobile + tablet); ✓ conflict behavior in unit/integration; ✓ local data warning in Session tab; ✓ no backend dependency.

## Validation Summary (2025-02-26)

Re-verified: all gates pass. CI/reproducibility: run `npm run build` before `npm run typecheck`.

- `npm run build` ✓
- `npm run typecheck` ✓ (requires prior build for .next/types)
- `npm run test` ✓ (108 unit tests)
- `npm run test:e2e` ✓ (20 viewport smoke tests, mobile + tablet)

## Learnings and Notes

### Build and Tooling
- **Private registry**: If npm install fails (Xray blocks Next.js), use one-time override: `npm install --registry https://registry.npmjs.org/`. Do not modify persisted registry config.
- **Next.js 14.2.35** used (patched for CVE-2025-55184). Spec mentions 16.1.6—use 14.x for compatibility. Use `next.config.mjs` (not `.ts`) for Next.js 14.x.
- **typecheck**: Requires `.next/types` from `npm run build`. On fresh clone, run build before typecheck.
- **Build _document error**: If build fails with `Cannot find module for page: /_document`, run `rm -rf .next && npm run build`.
- **E2E**: Playwright in `e2e/viewport-smoke.spec.ts` (mobile 375x667, tablet 768x1024). PORT=3300. Future Next.js may require `allowedDevOrigins` in next.config for cross-origin e2e—currently non-blocking.

### Test Patterns
- **Vitest**: Use `within(container)` for component tests; set `fileParallelism: false` for isolation. `esbuild: { jsx: "automatic" }` so components need not import React for JSX.
- **PointerEvent in jsdom**: Polyfill in setup.ts (`PointerEvent extends MouseEvent`) so clientX/clientY/pointerId pass through for pointer tests.
- **DOM pollution**: Use `cleanup()` in beforeEach and `within(container)` for queries in ReviewScreen/SessionPage tests.
- **useReviewSession act() fix**: `const report = await act(async () => result.current.importGabarito(...))` so type flows from return; use `ImportWarning` for filter callback to satisfy noImplicitAny.

### Key Implementation Details
- **Domain**: `src/domain/` — types, invariants, conflicts (deriveMarkerStatuses), grading (buildReviewRows, computeGradingSnapshot, resolveEffectiveUserToken).
- **Storage**: `src/storage/indexeddb/` — stores per spec 01 §5. fake-indexeddb in Node does not fully round-trip Blobs; real browser preserves them.
- **Solve**: PdfViewport, MarkerDot (pointer capture guarded for jsdom), RadialPickerPortal, EditMarkerSheet. Jump effect waits for `session` before processing (avoids S-UI-04 race). Spec 09 scroll retry via requestAnimationFrame; consumption in onScrollAttempted.
- **Review**: ReviewScreen, useReviewSession, conflict picker modal, ImportGabaritoModal. Write errors surfaced via `writeError`; SolveScreen/ReviewScreen show dismissible red banner.
- **Session tab**: SessionTabPanel with mandatory data loss warning per spec 00 §9.
- **Spec 02 §12**: MarkerDot uses `marker-dot` class; globals.css `@media (prefers-reduced-motion)` disables highlight transition.
