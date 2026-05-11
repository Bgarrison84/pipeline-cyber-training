# Phase 2: Content Loader + Lesson Rendering + Module 1 - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Fetch Markdown lesson files at runtime, render them with PS 5.1 Shiki syntax highlighting, implement the lesson view layout, activate sidebar navigation for Module 1 lessons, and author all three Module 1 (Logging & Auditing) lessons with at least one quiz placeholder, one terminal exercise placeholder, and one scenario placeholder. This phase locks the content authoring contract that all five modules follow.

</domain>

<decisions>
## Implementation Decisions

### Lesson Frontmatter Schema
- **D-01:** Compliance tagging uses **both layers**: `complianceTags: [TSA, NIST]` for badge display (looked up from compliance-refs.json) AND `complianceControls: [TSA-PC-1, NIST-CM-6]` for specific control IDs (consumed by the compliance index in Phase 6). Both fields are arrays.
- **D-02:** Minimal core fields only: `title`, `lessonId`, `moduleId`, `order`, `complianceTags[]`, `complianceControls[]`. No estimatedMinutes, difficulty, or keywords — Claude's discretion for any additional metadata.
- **D-03:** "In OT environments:" callout blocks use `> [!OT]` blockquote syntax. A custom marked.js renderer rule converts this into a styled callout component. This is the canonical authoring pattern for all OT-relevant lessons across all 5 modules.

### Lesson View Layout
- **D-04:** Responsive prose column — `max-width: 720px`, centered in `#app`, `padding: var(--spacing-xl)`. Full-width on mobile (no max-width on small viewports). Comfortable for both workstations and tablets/phones.
- **D-05:** Lesson navigation: sidebar lesson items for Module 1 activate as real links (replacing grayed-out spans) + a prev/next button pair in the lesson footer. Both navigation mechanisms active simultaneously.
- **D-06:** Code blocks: dark-background container (`var(--color-bg-base)`), top header bar showing language label ("PowerShell"), copy-to-clipboard icon button in the top-right corner of the header bar. Shiki renders token colors; the container is custom CSS/HTML wrapping the Shiki output.

### Module 1 Content Scope
- **D-07:** Module 1 (Logging & Auditing) has exactly **3 lessons**: `01-intro.md` (Introduction to Windows Event Logs), `02-ps-logging.md` (Enabling PowerShell Script Block Logging), `03-audit-policies.md` (Configuring Audit Policies via Group Policy). This matches the 3 stubs already in `src/modules-config.js`.
- **D-08:** Admin-level depth: task-focused, command-heavy. Assume reader is an IT/OT admin who knows Windows basics. Each lesson targets 400–600 words, 3–5 PS 5.1 code blocks, inline compliance reason per command, and at least one `> [!OT]` callout where applicable.
- **D-09:** Environment identifiers follow CLAUDE.md spec: `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp`. PS output is realistic-format but generic — real-format timestamps and plausible EventIDs, no company-specific values.

### Sidebar Activation
- **D-10:** **Data-driven activation** — lesson items become real `<a>` links when their corresponding `.md` file exists at the expected `public/data/modules/{moduleId}/lessons/{lessonId}.md` path. The content loader attempts `HEAD` (or small fetch) at startup to determine availability. Module 1 lessons activate; other modules stay grayed-out automatically as their files don't exist yet.
- **D-11:** Active lesson indicator in sidebar: same accent-border treatment as active modules — `3px left border var(--color-accent)` + `background: rgba(249,115,22,0.08)` + text color `var(--color-accent)`. No new visual language.

### Claude's Discretion
- Exact Shiki integration pattern (static bundle vs. lazy-load grammar) — follow STACK.md recommendation
- marked.js renderer customization structure — follow established marked.js v17 patterns
- Copy button implementation details (clipboard API, success feedback toast/icon swap)
- Exact module.json schema (metadata file for each module directory)
- Quiz placeholder format (one question stub with correct/incorrect answer fields)
- Terminal exercise and scenario placeholder shapes — minimal stubs that Phase 5/6 can expand
- Loading state UI while lesson Markdown is being fetched
- Error state when lesson Markdown 404s

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `CLAUDE.md` — content file structure, data directory layout, stack requirements (marked.js v17, Shiki v4, jQuery Terminal for Phase 5), PS version target (5.1), compliance content rules
- `.planning/REQUIREMENTS.md` — CONT-01, CONT-02, CONT-03, CONT-04, MOD-01 are the Phase 2 requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 criteria, all must be TRUE)

### Phase 1 Foundation (read before modifying any existing file)
- `.planning/phases/01-app-shell-build-pipeline-deploy/01-CONTEXT.md` — locked Phase 1 decisions, especially D-05 through D-16 (sidebar, routing, visual identity)
- `src/modules-config.js` — existing MODULES array shape; Phase 2 adds fetch-based loading on top of this static config
- `src/router.js` — hash router; Phase 2 activates `#/lesson/:moduleId/:lessonId` route (currently commented)
- `src/sidebar.js` — sidebar rendering; Phase 2 must modify to activate lesson links for Module 1
- `src/badge.js` — renderBadge() for compliance tags; Phase 2 lesson view reuses this

### Research
- `.planning/research/STACK.md` — Shiki v4 integration approach, marked.js v17 API, content fetch patterns
- `.planning/research/ARCHITECTURE.md` — content file architecture, module data models, build order
- `.planning/research/PITFALLS.md` — known pitfalls including fetch/path issues on GitHub Pages

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/badge.js` — `renderBadge(directiveKey)` renders TSA/NIST badges; lesson view reuses directly
- `src/utils/escape.js` — `esc(str)` HTML escape helper; use for any data-derived strings in templates
- `src/main.js` — `getComplianceRefs()` returns cached compliance refs; lesson view uses this for control ID display
- `import.meta.env.BASE_URL` pattern — all `public/data/` fetches must use this prefix
- `src/style.css` `@theme` block — all color, spacing, and typography tokens defined here; use CSS custom properties throughout

### Established Patterns
- Data files must live in `public/data/` (not `data/` at project root) — Vite only copies `public/` to `dist/`
- Lesson route `#/lesson/:moduleId/:lessonId` is commented in `src/router.js` lines 9-10 — activate by uncommenting and adding the view renderer
- `src/views/` directory — add `lesson-view.js` here following the same `renderXxx({ params })` export pattern
- All `innerHTML`-bound strings use `esc()` from `src/utils/escape.js`

### Integration Points
- `src/sidebar.js` `initSidebar()` currently renders all lesson items as `<span aria-disabled="true">`. Phase 2 modifies this to render available lessons as `<a href="#/lesson/{moduleId}/{lessonId}">` links.
- `src/router.js` `handleRoute()` dispatches to view renderers via `viewRenderers` object — add `lesson: renderLesson` entry.
- `src/modules-config.js` `MODULES` array — Phase 2 reads lesson IDs from here to determine expected file paths.

</code_context>

<specifics>
## Specific Ideas

- OT callout styling: use a distinctive left border in a contrasting color (perhaps a muted amber/yellow — not the main accent orange, to avoid confusion with active nav). Background: very subtle tint. Label: "IN OT ENVIRONMENTS" in small uppercase monospace.
- The `> [!OT]` syntax mirrors GitHub's `> [!NOTE]` / `> [!WARNING]` callout convention, which authors may already know.
- For the copy button: use a clipboard icon (Lucide `Copy`) that swaps to a checkmark (`Check`) for 2 seconds on success, then reverts. No toast notification needed — the icon swap is sufficient feedback.
- Lesson footer prev/next: simple `< Previous Lesson` / `Next Lesson >` text links styled as accent-colored buttons, no arrows icons needed. Show module title beneath each link for context.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02 - Content Loader + Lesson Rendering + Module 1*
*Context gathered: 2026-05-11*
