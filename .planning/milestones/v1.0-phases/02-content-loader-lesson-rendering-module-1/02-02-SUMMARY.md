---
phase: 02-content-loader-lesson-rendering-module-1
plan: "02"
id: 02-02
subsystem: content-pipeline
tags: [wave-1, content-loader, shiki, marked, lucide-npm, lesson-view, router, sidebar, tdd-green]
dependency_graph:
  requires:
    - phase: 02-01
      provides: shiki/marked/lucide installed; Wave 0 RED test stubs; content-loader.js stub; lesson-view.js stub
  provides:
    - src/content-loader.js full implementation (parseFrontmatter, renderMarkdown, fetchLesson, checkLessonAvailability, getLessonNav, getHighlighter)
    - src/views/lesson-view.js async renderLesson pipeline
    - src/router.js lesson route activated (#/lesson/:moduleId/:lessonId)
    - src/sidebar.js async initSidebar with HEAD fetch availability + setActiveLesson export
    - src/main.js activateIcons() from lucide npm bundle
    - All Wave 0 content-loader test stubs GREEN (10 tests)
    - Router lesson route test GREEN
  affects:
    - 02-03 (Wave 2 — compliance bar + footer nav build on lesson-wrapper placeholder IDs)
    - 02-04 (Module 1 content — lesson files fetched via fetchLesson)
    - Phase 3+ (progress store uses moduleId/lessonId pattern from content-loader)
tech-stack:
  added: []
  patterns:
    - "marked.use({ async: true, walkTokens }) — Shiki runs in walkTokens (async), renderer reads token.shikiHtml synchronously; avoids [object Promise] in output"
    - "Shiki singleton via getHighlighter() — createHighlighter called once, reused across all lesson renders"
    - "HEAD-fetch sidebar activation — parallel Promise.all over all lessons; available Set drives <a> vs <span> rendering"
    - "activateIcons() — named lucide imports centralized in main.js, called after any DOM mutation that adds data-lucide attrs"
    - "> [!OT] callout detection — token.raw.trimStart().startsWith('> [!OT]') is the reliable check; token.text may be pre-processed"
    - "esc() on all frontmatter values in template strings; rendered Markdown body is trusted repo content — no esc() on html blob"

key-files:
  created:
    - src/content-loader.js (parseFrontmatter, renderMarkdown, fetchLesson, checkLessonAvailability, getLessonNav, getHighlighter)
    - src/views/lesson-view.js (async renderLesson with placeholder IDs for Wave 2)
  modified:
    - src/router.js (lesson route added; handleRoute async; activateIcons replaces CDN check; setActiveLesson call)
    - src/sidebar.js (async initSidebar; parallel HEAD fetch; setActiveLesson export)
    - src/main.js (lucide named imports; activateIcons() export; Promise.all init)

key-decisions:
  - "marked.use() called once at module load (not inside renderMarkdown) — calling inside renderMarkdown would add duplicate renderer on every render call"
  - "Shiki loadLanguage for non-powershell langs wrapped in try/catch (Pattern 3) — unknown langs fall back to plain <pre><code>"
  - "Promise.all([handleRoute(), initSidebar()]) in init() — parallel init since neither depends on the other's DOM output"
  - "activateIcons() called in router.js handleRoute (for all views) — Wave 2 will also call it in lesson-view after DOM mutation for copy buttons"
  - "lesson-view.js Wave 1 returns full HTML string without calling activateIcons() — icons activated by handleRoute() after app.innerHTML is set"

patterns-established:
  - "Async view renderer: renderLesson returns Promise<string>; handleRoute awaits all renderers via await renderer(params)"
  - "Lesson error states use static text only — never inject moduleId/lessonId (T-02-07 threat mitigation)"
  - "data-code attribute on copy button uses esc(token.text) — browser decodes entities when clipboard reads btn.dataset.code"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04]

duration: "4m 33s"
completed: "2026-05-12"
---

# Phase 2 Plan 02: Content Loader + Router/Sidebar Wiring — Summary

**Full async Markdown-to-HTML pipeline via Shiki+marked.js walkTokens pattern, OT callout renderer, and lesson route activation with HEAD-fetch sidebar availability — all Wave 0 RED stubs turned GREEN.**

## Performance

- **Duration:** 4m 33s
- **Started:** 2026-05-12T22:14:18Z
- **Completed:** 2026-05-12T22:18:51Z
- **Tasks:** 2
- **Files modified:** 5 (2 created full implementations, 3 modified)

## Accomplishments

- Implemented `src/content-loader.js` from scratch: manual YAML frontmatter parser, Shiki singleton with `github-dark` theme, `marked.use({ async: true, walkTokens })` integration, OT callout blockquote renderer, copy-button code renderer, `fetchLesson` with in-memory Map cache, `checkLessonAvailability` HEAD fetch, `getLessonNav` prev/next from MODULES config
- Implemented `src/views/lesson-view.js`: full async fetch-parse-render pipeline with `renderLessonNotFound` and `renderLessonError` static-text fallbacks (XSS-safe per T-02-07)
- Wired lesson route into router, sidebar (async HEAD-fetch activation), and main.js (Lucide npm bundle with `activateIcons()`)
- All 22 automated tests GREEN; all 4 lesson-view stubs remain as `it.todo` for Wave 2

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/content-loader.js** - `57712fa` (feat)
2. **Task 2: Wire router/sidebar/main + lesson-view.js** - `78659c9` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified

- `src/content-loader.js` — Full implementation: parseFrontmatter (manual YAML), getHighlighter (Shiki singleton), marked.use configuration (walkTokens + code/blockquote renderers), fetchLesson (cache), checkLessonAvailability (HEAD), getLessonNav, renderMarkdown
- `src/views/lesson-view.js` — Async renderLesson pipeline; compliance-bar and lesson-footer placeholder IDs for Wave 2; renderLessonNotFound and renderLessonError static helpers
- `src/router.js` — Added `#/lesson/:moduleId/:lessonId` route; handleRoute() made async; setActiveLesson call after setActiveModule; activateIcons() replaces typeof lucide check
- `src/sidebar.js` — initSidebar() made async; parallel HEAD fetch (Promise.all allChecks); available Set drives `<a>` vs `<span>` rendering per lesson; setActiveLesson() export with D-11 active style
- `src/main.js` — Lucide named imports (createIcons, BookOpen, Shield, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle); activateIcons() export; init() uses Promise.all([handleRoute(), initSidebar()])

## Decisions Made

- `marked.use()` called once at module load (module-level side effect), not inside `renderMarkdown()`. Calling it inside renderMarkdown would add duplicate renderer entries on every render call.
- `activateIcons()` called in `handleRoute()` for all views (not only in lesson-view), ensuring icons activate after every route transition regardless of view type.
- `Promise.all([handleRoute(), initSidebar()])` in `init()` — parallel init since handleRoute populates `#app` and initSidebar populates `#sidebar-modules` independently.
- Wave 1 `lesson-view.js` returns the full HTML string but does not call `activateIcons()` or `setActiveLesson()` — these are called by `handleRoute()` after `app.innerHTML` is set (correct DOM order).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm install required in worktree**

- **Found during:** Task 1 verification run
- **Issue:** Vitest import resolution failed — `marked` and `shiki` not found. The Wave 0 plan installed packages in the main repo; the parallel worktree had its own empty `node_modules/` directory.
- **Fix:** Ran `npm install` in the worktree root. Packages resolved from the worktree's own `node_modules/`.
- **Files modified:** `node_modules/` (gitignored — no tracked file change)
- **Verification:** `npm test -- tests/content-loader.test.js` passed after install
- **Committed in:** Not committed (gitignored); resolved before Task 1 commit

---

**Total deviations:** 1 auto-fixed (1 blocking — worktree npm install)
**Impact on plan:** Required fix, no scope change. Node_modules not tracked in git.

## Issues Encountered

- Worktree npm install: standard worktree isolation issue — each worktree needs its own `node_modules/` resolved. Fixed with `npm install` in worktree root before running tests.

## User Setup Required

None — no external service configuration required.

## Known Stubs

The following placeholder IDs are intentionally empty in this wave:

| Element | ID | Reason | Future Plan |
|---------|----|--------|-------------|
| Compliance badge row | `#lesson-compliance-bar` | Wave 2 injects renderBadge() output | Plan 02-03 |
| Footer prev/next nav | `#lesson-footer` | Wave 2 injects getLessonNav() output | Plan 02-03 |

These stubs do not prevent the plan's goal — the vertical slice (fetch→parse→render) is fully functional. Wave 2 extends the lesson view layout.

## Threat Surface Scan

No new network endpoints or auth paths introduced. The following T-02 mitigations from the plan threat model were implemented as specified:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-02-04 | `esc(meta.title)` and all other frontmatter values in lesson-view.js template strings |
| T-02-05 | `rawCode = esc(token.text)` in content-loader.js code renderer; `data-code="${rawCode}"` |
| T-02-07 | `renderLessonNotFound()` and `renderLessonError()` use static text — no moduleId/lessonId injection |

## Next Phase Readiness

- Wave 1 complete: vertical slice works end-to-end (route → fetch → Shiki render → DOM inject)
- Wave 2 (Plan 02-03) can now fill in the `#lesson-compliance-bar` and `#lesson-footer` placeholder IDs
- Wave 3 (Plan 02-04) can author Module 1 lesson `.md` files at `public/data/modules/logging-auditing/lessons/` — `fetchLesson` and `checkLessonAvailability` are ready to serve them

## Self-Check

Files verified:
- [x] src/content-loader.js — FOUND (202 lines)
- [x] src/views/lesson-view.js — FOUND (full implementation)
- [x] src/router.js — contains `#/lesson/:moduleId/:lessonId`
- [x] src/sidebar.js — exports `setActiveLesson`
- [x] src/main.js — exports `activateIcons`, imports from lucide npm

Commits verified:
- [x] 57712fa — content-loader.js implementation
- [x] 78659c9 — router/sidebar/main/lesson-view wiring

Test results:
- [x] 22 tests GREEN, 4 todo (lesson-view Wave 2 stubs), 1 skipped (compliance-refs)
- [x] Router lesson route test GREEN
- [x] All parseFrontmatter, getLessonNav, renderMarkdown cases GREEN

## Self-Check: PASSED

---

*Phase: 02-content-loader-lesson-rendering-module-1*
*Completed: 2026-05-12*
