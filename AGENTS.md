## Build & Run

Succinct rules for how to BUILD the project:

## Validation

Run these after implementing to get immediate feedback:

## Operational Notes

Succinct learnings about how to RUN the project:

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