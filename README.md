# cc-mobile-practice

Mobile web app for solving PDF-based exams: tap the PDF to place answer markers, assign tokens (A–E or blank), import a *gabarito* (answer key), and review/grade attempts—fully offline, with no account required.

## What it does

- **One session per PDF** — Create a session from a local PDF; markers and gabarito are stored in the browser (IndexedDB).
- **Solve flow** — Tap the PDF to add a marker, use the radial picker to choose an answer and question number; edit or delete markers as needed.
- **Gabarito import** — Paste answer keys in numbered format (`1A, 2B, 3C`) or sequential format (`A,B,D,...` with a start index); invalid tokens are skipped with warnings.
- **Review & grading** — Question-ordered list with user answer vs gabarito, status badges, and jump-to-marker from review to the PDF. Duplicate question numbers are treated as conflicts and excluded from the score.
- **Offline-first** — No backend for V1; all core flows work after first load with no network.

## Tech stack

- **Next.js 16.1.6** (App Router), **React 19**, **TypeScript** (strict)
- **react-pdf** + **pdfjs-dist** for PDF rendering
- **IndexedDB** via **idb** for local persistence
- **Vitest** (unit), **Playwright** (e2e, mobile/tablet viewports)

## Requirements

- **Node 22** (see `.nvmrc` and `package.json` engines)
- npm ≥10

## Getting started

```bash
git clone <repo-url>
cd mobile-practice
git submodule update --init   # for cc-feedback (in-product feedback)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use a mobile viewport or device for the intended experience.

### Optional: feedback mock API

In-product feedback uses [cc-feedback](https://github.com/JamDev0/cc-feedback) (vendored under `vendor/cc-feedback`). Default endpoint: `NEXT_PUBLIC_FEEDBACK_ENDPOINT` (e.g. `http://localhost:8787/v1/feedback`). To run the mock API:

```bash
cd vendor/cc-feedback/apps/mock-feedback-api && npm start
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check (`next typegen` + `tsc --noEmit`) |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e (mobile + tablet) |
| `npm run verify:cloud` | Full lint + typecheck + test + build + e2e |

If you hit a `_document`-related build error, try: `rm -rf .next && npm run build`.

## Specs

Product and architecture are defined in **Ralph specs** under `specs/`:

- **Entry point:** `specs/99-spec-index-ralph-spec.md` — read first, then follow the dependency order.
- **Core:** system contract (`00`), domain data model (`01`), solve/review/grading flows (`02`, `03`), Next.js architecture (`04`), plus focused specs for PDF scroll, tab bar, radial picker, in-session navigation, etc.

Agents and contributors should resolve conflicts using: `00` for product behavior, `01` for data semantics.

## Data and privacy

V1 is **local-only**. All sessions, markers, and gabarito live in this browser on this device. Clearing site/browser data can delete them permanently. The app shows a clear warning in the Session tab; no PII or backend is required for core use.

## License

See repository license file.
