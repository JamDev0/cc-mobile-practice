## Build & Run

- `npm run setup:cloud` — one-time cloud bootstrap (Node guard, npm install, Playwright deps/browser)
- `npm install`
- `npm run dev` — start dev server
- `npm run build` — production build (if _document error: `rm -rf .next && npm run build`)

## Validation

- `npm run typecheck` — TypeScript strict check (`next typegen` + `tsc --noEmit`)
- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Playwright viewport smoke tests (mobile + tablet)
- `npm run build` — full build
- `npm run verify:cloud` — full lint/typecheck/test/build/e2e validation chain

## Operational Notes

- Next.js 16.1.6, App Router, `src/` layout per spec 04.

## Cursor Cloud specific instructions

- Cloud environment config lives in `.cursor/environment.json`.
- The cloud install step runs `npm run setup:cloud` to avoid repeated manual setup.
- Keep the repository on Node 22 (`.nvmrc`, `package.json#engines`) so lint/typecheck/build/test/e2e behavior stays consistent across local + cloud agents.

### Codebase Patterns

#### Typescript musts
- Never define functions return types, just only extremely needed for clarity, rely on TypeScript's inference, as it always reflects the truth of the code.
- Always define explicit types, avoid as much as possible using any and unknow, always try to find otherways that are more industry standard.
- Follow Typescript Strict mode guidelines
- Avoid using `as`, let Typescript infer, if it can't try helping it, if there is no solution, then use as, but only as last resource
- Prefer Existing Type Definitions
  When a type already exists in a library or the codebase, import and use it rather than manually defining the shape inline.
  ```typescript
	// ❌ BAD - Inline type definition
	const cookieOptions: {
		httpOnly: boolean
		secure: boolean
		sameSite: 'strict' | 'lax' | 'none'
		path: string
		maxAge: number
		domain?: string
	} = {
		httpOnly: true,
		secure: true,
		// ...
	
	// ✅ GOOD - Use imported type
	import { CookieOptions } from 'express'
	
	const cookieOptions: CookieOptions = {
	    httpOnly: true,
	    secure: true,
	    // ...
	}
  ```