# Skill: frontend-workflow

This is a **meta-skill** that orchestrates complementary frontend skills:

**Core Skills:**
- **`frontend-design`** (file:///home/juan/.kilocode/skills/frontend-design/SKILL.md) — Creative ideation, bold aesthetics, design thinking
- **`design-taste-frontend`** (file:///home/juan/.agents/skills/frontend-taste/SKILL.md) — Technical enforcement, anti-slop rules, production guardrails

**Framework-Specific (auto-loaded when detected):**
- **`next-best-practices`** (file:///home/juan/.agents/skills/next-best-practices/SKILL.md) — Next.js file conventions, RSC boundaries, data patterns, optimization

Use this skill when generating any frontend code, UI components, pages, or interfaces.

---

## 1. INVOCATION TRIGGERS

This skill automatically activates when:
- User requests frontend code generation
- UI/design/frontend keywords detected in prompt
- Component or page creation detected
- User explicitly requests this skill

---

## 2. FIXED BASELINE CONFIGURATION

These dials are **fixed** and drive all downstream decisions:

| Dial | Value | Meaning |
|------|-------|---------|
| DESIGN_VARIANCE | 8 | Asymmetric, bold layouts |
| MOTION_INTENSITY | 6 | Fluid CSS + subtle choreography |
| VISUAL_DENSITY | 4 | Balanced spacing, breathable |

Do NOT ask user to modify these. Apply them consistently.

---

## 3. DECISION TREE

### 3.1 Detection Phase

When invoked, analyze the request for these signals (in order of priority):

1. **Task Type**: New component / Full page / Refactor / Design system / Variations
2. **Output Format Hints**: "dashboard" vs "landing page" vs "editorial" vs "app"
3. **Aesthetic Intent**: "minimal" / "bold" / "playful" / "premium" / "utilitarian"
4. **Complexity**: Quick fix / Standard component / Full page / Entire app

### 3.2 Skill Priority Assignment

Based on detection, assign skill priority:

| Context | Primary Skill | Secondary Skill | Report Message |
|---------|---------------|-----------------|----------------|
| Dashboard / SaaS / Utility UI | `design-taste-frontend` | `frontend-design` (selective) | "Applying enforcement-first mode for utilitarian context" |
| Landing page / Marketing / Editorial | `frontend-design` | `design-taste-frontend` (guardrails) | "Applying creative-first mode for editorial context" |
| Component library / Design system | `design-taste-frontend` | `frontend-design` (aesthetic guidance) | "Applying systematic mode for design system context" |
| Creative portfolio / Art / Experimental | `frontend-design` | `design-taste-frontend` (minimal) | "Applying experimental mode for creative context" |
| Refactor / Polish existing code | `design-taste-frontend` | `frontend-design` (enhancement) | "Applying refinement mode for existing codebase" |
| Generate variations | Both equally | — | "Applying exploratory mode with dual-skill synthesis" |

**CRITICAL**: Always report the chosen mode to user when auto-detecting.

### 3.3 Output Mode Selection

The decision tree branches into these output modes:

| Mode | Trigger | Description |
|------|---------|-------------|
| **Code Generation** | Default | Produce complete, working component/page |
| **Design System** | User requests system/guidance | Output tokens, patterns, and implementation guidance |
| **Critique + Refactor** | User provides existing code | Analyze and suggest improvements |
| **Variations** | User requests options/alternatives | Generate multiple distinct approaches |

---

## 4. INTERACTIVE MODE

If user explicitly asks the agent to ask questions, or if the request is ambiguous, execute this question sequence:

### Question 1: Purpose
"What is the primary purpose of this interface? Who will use it?"

### Question 2: Tone/Aesthetic
"What aesthetic direction should this take?"
- A) Minimal/Refined
- B) Bold/Maximalist
- C) Playful/Friendly
- D) Premium/Luxury
- E) Utilitarian/Functional

### Question 3: Constraints
"Any technical constraints? (framework, performance requirements, accessibility needs)"

### Question 4: Output Format
"What output format do you need?"
- A) Complete component/page code
- B) Design system + guidance
- C) Critique of existing code
- D) Multiple variations to choose from
- E) Other

### Question 5: Skill Priority
"Which skill should take priority?"
- A) Creative-first (frontend-design) — for marketing, editorial, portfolios
- B) Enforcement-first (design-taste-frontend) — for dashboards, SaaS, utilities
- C) Balanced synthesis — apply both equally
- D) Auto-detect based on context
- E) Other

---

## 5. SKILL DELEGATION

When executing, use these delegation patterns:

### For frontend-design (creative ideation):
```
Apply /frontend-design SKILL principles for:
- Design thinking and aesthetic direction
- Bold typography and color choices
- Unexpected layouts and spatial composition
- Motion and micro-interactions creative guidance
```

### For design-taste-frontend (technical enforcement):
```
Apply /design-taste-frontend SKILL principles for:
- Configuration dials (VARIANCE: 8, MOTION: 6, DENSITY: 4)
- Anti-slop rules and banned patterns
- Technical guardrails (RSC, Tailwind, performance)
- Pre-flight checklist validation
```

### For next-best-practices (Next.js projects only):
```
Apply /next-best-practices SKILL principles for:
- File conventions and route structure
- RSC boundaries (async client component detection, non-serializable props)
- Async patterns (params, searchParams, cookies, headers in Next.js 15+)
- Data patterns (Server Components, Server Actions, Route Handlers)
- Metadata and OG image generation
- Image optimization with next/image
- Font optimization with next/font
- Error handling boundaries (error.tsx, not-found.tsx)
```

---

## 6. CONFLICT RESOLUTION

When skills conflict, apply context-based resolution:

| Conflict | Resolution | Report |
|----------|------------|--------|
| Font choice: frontend-design says "unique/bold" vs design-taste-frontend bans Inter/mandates Geist | Dashboard/Utility: use Geist/Satoshi. Creative/Editorial: allow bold choices. | Report which path taken and why. |
| Color: frontend-design says "commit to palette" vs design-taste-frontend bans "AI purple" | Both agree: avoid purple gradients. If user explicitly requests purple, allow with override note. | "Purple accent applied per user override (typically avoided)." |
| Layout: frontend-design says "asymmetric/bold" vs design-taste-frontend says "anti-center bias" | Both agree on asymmetry. Apply DESIGN_VARIANCE: 8 rules. | No conflict. |
| Motion: frontend-design says "surprise/delight" vs design-taste-frontend says "performance guardrails" | Apply MOTION_INTENSITY: 6. Use CSS-first, Framer Motion for choreography. Never block main thread. | No conflict. |
| Next.js RSC: design-taste-frontend says "Client Component for motion" vs next-best-practices says "Server Components by default" | Extract interactivity to leaf Client Components. Keep layout in Server Components. | "Motion isolated to Client Component per RSC best practices." |
| Next.js font: frontend-design wants custom font vs next-best-practices requires `next/font` | Use `next/font` with frontend-design font choice. Both satisfied. | No conflict. |

**Rule**: When user explicitly overrides a ban (e.g., "use Inter font"), proceed and note the override in output.

---

## 7. EXECUTION WORKFLOW

### Step 0: Detect Next.js Context
Check `package.json` for `"next"` dependency. If found:

1. **Report**: "Next.js project detected — loading next-best-practices skill"
2. **Apply /next-best-practices SKILL principles** for:
   - File conventions and route structure
   - RSC boundaries (Server vs Client Components)
   - Async patterns (params, searchParams, cookies, headers)
   - Data fetching and caching strategies
   - Metadata and OG image generation
   - Image and font optimization (`next/image`, `next/font`)
   - Error handling boundaries

3. **Integration points with frontend skills:**

| Next.js Pattern | Frontend Skill Integration |
|-----------------|---------------------------|
| RSC boundaries | Interactive components (MOTION_INTENSITY > 5) MUST be Client Components with `'use client'` |
| `next/font` | Use with frontend-design typography choices (Geist, Satoshi, Cabinet Grotesk) |
| `next/image` | Apply frontend-design image treatment (aspect ratios, lazy loading, blur placeholders) |
| Metadata | Use frontend-design aesthetic direction for OG images, titles, descriptions |
| Suspense boundaries | Align with design-taste-frontend loading states (skeletal loaders) |
| Error boundaries | Apply design-taste-frontend error state patterns |
| Route handlers | For API-backed dashboards, coordinate with VISUAL_DENSITY for data refresh patterns |

### Step 1: Detect Context
Analyze request for task type, output format hints, aesthetic intent, complexity.

### Step 2: Assign Skill Priority
Map to primary/secondary skill. Report chosen mode.

### Step 3: Apply Primary Skill
Execute core guidance from primary skill.

### Step 4: Cross-Reference Secondary Skill
Pull relevant rules/patterns from secondary skill:
- If creative-first: apply design-taste-frontend guardrails (no purple, no Inter, performance)
- If enforcement-first: apply frontend-design aesthetic thinking (bold choices, differentiation)

### Step 5: Validate Against Pre-flight Checklist
Before output, verify:
- [ ] Global state used appropriately
- [ ] Mobile layout collapse guaranteed
- [ ] `min-h-[100dvh]` for full-height sections
- [ ] `useEffect` cleanup functions present
- [ ] Empty/loading/error states provided
- [ ] Cards used intentionally (not overused)
- [ ] Perpetual animations isolated in Client Components

**If Next.js detected, also verify:**
- [ ] Server Components used for static/data-fetching, Client Components for interactivity
- [ ] `next/font` used instead of external font imports
- [ ] `next/image` used instead of `<img>` tags
- [ ] Async params/searchParams handled correctly (Next.js 15+)
- [ ] Error boundaries (`error.tsx`, `not-found.tsx`) in place
- [ ] Metadata generated for pages (SEO, OG images)

### Step 6: Report Decisions
Brief summary of:
- Mode selected
- Skill priority applied
- Any overrides from user
- Key design choices made

---

## 8. QUICK REFERENCE

### When to prioritize frontend-design:
- Landing pages, marketing sites
- Portfolios, creative projects
- Editorial content
- Experimental interfaces
- When user requests "bold", "unique", "memorable"

### When to prioritize design-taste-frontend:
- Dashboards, SaaS applications
- Admin panels, internal tools
- Component libraries
- Design systems
- When user requests "clean", "professional", "functional"

### Always apply from both:
- Typography: distinctive fonts, no Inter (frontend-design + design-taste-frontend)
- Color: no purple gradients, no neon glows (design-taste-frontend)
- Motion: CSS-first, transform/opacity only (design-taste-frontend)
- Layout: asymmetric, grid-based (frontend-design + design-taste-frontend)
- Responsive: mobile-first, viewport stability (design-taste-frontend)

### When Next.js detected, always apply:
- RSC boundaries: Server Components by default, Client Components for interactivity
- Font: `next/font` with frontend-design font choices (Geist, Satoshi, Cabinet Grotesk)
- Images: `next/image` with proper sizing and priority for LCP
- Metadata: Generate OG images matching aesthetic direction
- Error handling: `error.tsx`, `not-found.tsx` with design-taste-frontend error states
- Data: Server Components for data fetching, avoid waterfalls with `Promise.all`

---

## 9. EXAMPLE WORKFLOW

**User request**: "Create a dashboard for monitoring server metrics"

**Agent execution**:
1. Detect Next.js: Check package.json → If Next.js found, load next-best-practices
2. Detect: Task = component/page, Format = dashboard, Intent = utilitarian
3. Assign: Primary = design-taste-frontend, Secondary = frontend-design
4. Report: "Applying enforcement-first mode for utilitarian context"
5. Apply design-taste-frontend: VISUAL_DENSITY: 4, monospace numbers, no cards where possible, Geist font
6. Cross-reference frontend-design: ensure data visualization is clear, purposeful hierarchy
7. If Next.js: Apply RSC boundaries (Client Components for interactivity), next/font for Geist, Suspense for loading states
8. Validate: pre-flight checklist
9. Output: Complete dashboard component with reported decisions

**User request**: "Design a landing page for a creative agency"

**Agent execution**:
1. Detect Next.js: Check package.json → If Next.js found, load next-best-practices
2. Detect: Task = page, Format = landing, Intent = creative/premium
3. Assign: Primary = frontend-design, Secondary = design-taste-frontend
4. Report: "Applying creative-first mode for editorial context"
5. Apply frontend-design: bold typography, asymmetric hero, memorable visual hook
6. Cross-reference design-taste-frontend: no purple, no Inter, performance guardrails
7. If Next.js: Apply metadata generation for OG images, next/image optimization, next/font for typography
8. Validate: pre-flight checklist
9. Output: Complete landing page with reported decisions
