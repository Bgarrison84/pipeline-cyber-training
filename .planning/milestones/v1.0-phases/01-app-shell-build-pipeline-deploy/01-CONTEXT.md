# Phase 1: App Shell + Build Pipeline + Deploy - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build and deploy the static site skeleton that all subsequent phases mount into: Vite + Tailwind v4 build pipeline, hash-based router, left collapsible sidebar navigation, top bar, five module placeholder views with structural skeletons, and live GitHub Pages deployment via GitHub Actions. No real content yet — this phase establishes the frame, the deploy pipeline, and the visual identity.

</domain>

<decisions>
## Implementation Decisions

### GitHub Repository
- **D-01:** Account: `Bgarrison84`, repo name: `pipeline-cyber-training` — must be created as part of this phase
- **D-02:** GitHub Pages URL: `Bgarrison84.github.io/pipeline-cyber-training`
- **D-03:** Vite `base` config: `/pipeline-cyber-training/` — must be set in `vite.config.js` before first build or all asset paths will be wrong
- **D-04:** Deploy strategy: GitHub Actions on push to `main` → build `dist/` → deploy to GitHub Pages; `.nojekyll` must be present in `dist/`

### Navigation Layout
- **D-05:** Primary navigation: left sidebar (not top nav)
- **D-06:** Sidebar is collapsible — toggle button to hide/show; useful for terminal exercise phases that need width
- **D-07:** Sidebar tree depth: active module expanded (shows its lessons), all other modules collapsed
- **D-08:** Top bar contains: app display name ("OT Security Lab") on left, compliance index link and overall progress summary on right

### Visual Identity
- **D-09:** App display name in UI: **"OT Security Lab"** (repo stays `pipeline-cyber-training`)
- **D-10:** Tone: high-contrast industrial — bold colors, strong borders, readable in ambient-light environments
- **D-11:** Color palette direction: safety orange + dark gray — immediately signals pipeline industry context
- **D-12:** Tailwind v4 color tokens should be defined as CSS custom properties for easy forking/rebranding

### Module Placeholder Views
- **D-13:** When a learner navigates to a module in Phase 1, they see a **structural skeleton**: module title, goal statement, and labeled empty sections — Lessons, Quizzes, Terminal Exercises, Scenarios — showing the shape of what's coming
- **D-14:** Individual lesson items appear in the sidebar but are **grayed out and not clickable** — visible as "coming in Phase 2+" without creating dead-end navigation
- **D-15:** Each module placeholder shows the compliance control IDs it will cover (sourced from `data/compliance-refs.json`), so the content promise is visible even before lessons exist

### Compliance Data
- **D-16:** `data/compliance-refs.json` is created in this phase with current TSA directive version (SD-02F, effective May 3 2025) and NIST SP 800-82 Rev 3 as canonical references — no version strings hardcoded anywhere else

### Claude's Discretion
- Exact Tailwind v4 utility class structure and CSS custom property naming convention — follow Tailwind v4 best practices
- GitHub Actions workflow file structure — use the official `actions/deploy-pages` + `actions/upload-pages-artifact` pattern
- Exact sidebar toggle animation (CSS transition) — keep simple
- Favicon and page `<title>` — use "OT Security Lab" as title

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — project overview, constraints, key decisions
- `.planning/REQUIREMENTS.md` — SHELL-01, SHELL-02, DATA-01 are the Phase 1 requirements
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 criteria, all must be TRUE)

### Architecture & Stack
- `.planning/research/STACK.md` — full stack rationale; Vite 8.x, Tailwind v4, jQuery Terminal (Phase 5), marked.js, Shiki — read before making any tooling choices
- `.planning/research/ARCHITECTURE.md` — hash routing decision, content architecture, data models, build order rationale
- `.planning/research/SUMMARY.md` — synthesized findings including GitHub Pages deploy specifics and `.nojekyll` requirement

### Compliance Data
- `.planning/research/PITFALLS.md` — GitHub Pages SPA routing 404 pitfall (hash routing chosen to avoid this), localStorage pitfalls for later phases

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components or utilities.

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow.

### Integration Points
- `data/compliance-refs.json` created here is consumed by every subsequent phase for compliance control ID display
- The hash router created here is the routing contract all phase views register with
- The sidebar module/lesson tree structure created here determines the data shape Phase 2 populates

</code_context>

<specifics>
## Specific Ideas

- The "OT Security Lab" name should feel like an internal tool or lab environment — not a marketing site. Bold, utilitarian typography.
- Safety orange is the primary action/accent color; dark gray (`#1a1a1a` range) for backgrounds; white/near-white for content areas
- The structural skeleton for each module placeholder should make clear this is a training platform — not a wiki or docs site. Section labels like "Terminal Exercises" and "Scenarios" communicate the interactive nature before any content exists.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1 - App Shell + Build Pipeline + Deploy*
*Context gathered: 2026-05-10*
