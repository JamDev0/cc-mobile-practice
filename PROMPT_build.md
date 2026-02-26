0a. Study `specs/*` to learn the application specifications.
0b. Study @IMPLEMENTATION_PLAN.md.
0c. For reference, the application source code is in `./src`.


1. Your task is to implement functionality per the specifications. Follow @IMPLEMENTATION_PLAN.md and choose the most important item to address. Before making changes, search the codebase (don't assume not implemented).
2. After implementing functionality or resolving problems, run the tests for that unit of code that was improved. If functionality is missing then it's your job to add it as per the application specifications. Ultrathink.
3. When you discover issues, immediately update @IMPLEMENTATION_PLAN.md with your findings. When resolved, update and remove the item.
4. When the tests pass, update @IMPLEMENTATION_PLAN.md, then `git add` all changes exept the ones made on the files: `*.md` and `loop.sh`; then `git commit` with a message describing the changes.

999. Use the skills next-best-practices, react-best-practices
9999.When writting typescript you MUST follow these rules: Avoid using `as`, let Typescript infer, if it can't try helping it, if there is no solution, then use as, but only as last resource; Never define functions return types, just only extremely needed for clarity, rely on TypeScript's inference, as it always reflects the truth of the code.; Always define explicit types, avoid as much as possible using any and unknow, always try to find otherways that are more industry standard.; Follow Typescript Strict mode guidelines; Prefer Existing Type Definitions
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
999. Important: When authoring documentation, capture the why — tests and implementation importance.
9999. Important: Single sources of truth, no migrations/adapters. If tests unrelated to your work fail, resolve them as part of the increment.
999999. You may add extra logging if required to debug issues.
9999999. Keep @IMPLEMENTATION_PLAN.md current with learnings — future work depends on this to avoid duplicating efforts. Update especially after finishing your turn.
99999999. When you learn something new about how to run the application, update @AGENTS.md but keep it brief. For example if you run commands multiple times before learning the correct command then that file should be updated.
999999999. For any bugs you notice, resolve them or document them in @IMPLEMENTATION_PLAN.md even if it is unrelated to the current piece of work.
9999999999. Implement functionality completely. Placeholders and stubs waste efforts and time redoing the same work.
99999999999. When @IMPLEMENTATION_PLAN.md becomes large periodically clean out the items that are completed from the file.
999999999999. If you find inconsistencies in the refresh-token-cookie-spec.md then update the specs.
9999999999999. IMPORTANT: Keep @AGENTS.md operational only — status updates and progress notes belong in `IMPLEMENTATION_PLAN.md`. A bloated AGENTS.md pollutes every future loop's context.
99999999999999. IMPORTANT: DO NOT CHNAGE THE PRIVATE REGISTRY CONFIG
