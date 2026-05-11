---
phase: 01-app-shell-build-pipeline-deploy
plan: "03"
subsystem: views
status: complete
tags: [views, home-view, module-view, not-found-view, xss-hygiene, compliance-badges]
dependency_graph:
  requires:
    - 01-02-SUMMARY.md (router, badge.js, sidebar)
  provides:
    - renderHome — 5-card module catalog with compliance badges
    - renderModule — module placeholder with goal, badges, 4 section cards
    - renderNotFound — static 404 view
  affects:
    - src/router.js (consumes all three view renderers via viewRenderers object)
tech_stack:
  added: []
  patterns:
    - HTML-string view pattern (views return strings, router assigns via innerHTML)
    - XSS hygiene: hash-derived moduleId never reaches innerHTML
    - Compliance badge rendering via renderBadge() from badge.js (no hardcoded version strings)
key_files:
  created: []
  modified:
    - src/views/module-view.js
decisions:
  - renderModuleNotFound outputs fully static text — moduleId never injected into DOM (T-03-01 mitigation)
  - badge.js import retained (not main.js) — preserves circular-dependency fix from Plan 02
  - mod.icon passed as-is to data-lucide (PascalCase) — Lucide CDN accepts it correctly
metrics:
  duration: ~10 minutes
  completed_date: "2026-05-11"
  tasks_completed: 2
  tests_green: 11
  build: pass
---

# Phase 1 Plan 03: View Functions (Home, Module, Not-Found) Summary

## One-liner

Static HTML-string views for home catalog (5 module cards with compliance badges), module placeholder (goal callout, COMPLIANCE CONTROLS COVERED row, 4 section skeleton cards), and 404 view — all XSS-safe, no hardcoded compliance version strings.

## What Was Built

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Home view — module catalog cards with compliance badges | Pre-built by Wave 0; verified correct | src/views/home-view.js |
| Task 2: Module view + Not-Found view; router import wiring | fbfe95e (fixes applied) | src/views/module-view.js |

**Note:** All three view files were pre-built by Wave 0. Plan 03 verified each file against the spec and found three gaps in `module-view.js` that were fixed and committed.

## Verification Results

| Check | Result |
|-------|--------|
| `renderHome({})` returns string with "Select a module to begin" heading | PASS |
| `renderHome({})` contains exactly 5 `<article>` elements | PASS |
| Each article has onclick and onkeydown hash navigation | PASS |
| Each article contains renderBadge output (badge CSS vars present) | PASS |
| `renderModule({ moduleId: 'logging-auditing' })` contains title "Logging & Auditing" | PASS |
| Module view contains "COMPLIANCE CONTROLS COVERED" (all-caps per copywriting contract) | PASS |
| Module view contains "Lessons", "Terminal Exercises", "Scenarios" section cards | PASS |
| Module view icon uses `data-lucide="BookOpen"` (PascalCase, not lowercase) | PASS |
| `renderModule({ moduleId: 'unknown-xyz' })` returns static fallback, no throw | PASS |
| Unknown module output does NOT contain "unknown-xyz" (XSS safe) | PASS |
| `renderNotFound()` contains "Page not found" heading | PASS |
| `renderNotFound()` contains "Use the sidebar to navigate to a module." | PASS |
| `grep -r "SD-02" src/views/` returns no output | PASS |
| `grep -r "innerHTML.*moduleId" src/` returns no output | PASS |
| `npx vitest run` — 11/11 tests green | PASS |
| `npm run build` exits 0 | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] renderModuleNotFound injected moduleId via inline `<script>` tag**
- **Found during:** Task 2 gap analysis
- **Issue:** Wave 0 implementation used a `<script>` block that passed `JSON.stringify(moduleId)` into the page. This is a hash-derived string reaching innerHTML via a script execution path — violating T-03-01. The plan explicitly requires: "SECURITY: do NOT inject moduleId into innerHTML — use a static 'Module not found.' message only, never `${moduleId}` in the returned string."
- **Fix:** Replaced with a fully static return string: `<p>Module not found.</p>`. The `moduleId` parameter was removed from the function signature entirely.
- **Files modified:** src/views/module-view.js
- **Commit:** fbfe95e

**2. [Rule 1 - Bug] Compliance coverage label was lowercase instead of all-caps**
- **Found during:** Task 2 gap analysis
- **Issue:** Label read "Compliance controls covered" — but copywriting contract specifies "COMPLIANCE CONTROLS COVERED" (all-caps, consistent with uppercase label treatment throughout the UI-SPEC).
- **Fix:** Updated label text to "COMPLIANCE CONTROLS COVERED".
- **Files modified:** src/views/module-view.js
- **Commit:** fbfe95e

**3. [Rule 1 - Bug] Lucide icon name was lowercased**
- **Found during:** Task 2 gap analysis
- **Issue:** `data-lucide="${mod.icon.toLowerCase()}"` converted PascalCase icon names (e.g., "BookOpen") to lowercase ("bookopen"). Lucide CDN resolves icon names case-insensitively for most icons, but the canonical attribute usage is PascalCase per the Lucide API and plan pattern.
- **Fix:** Changed to `data-lucide="${mod.icon}"` — uses the icon name exactly as stored in modules-config.js.
- **Files modified:** src/views/module-view.js
- **Commit:** fbfe95e

**4. [Deviation] badge.js import retained (not main.js)**
- **Context:** Plan 03 spec says `import { renderBadge } from '../main.js'`. Both view files import from `'../badge.js'` instead.
- **Reason:** Plan 02 moved renderBadge to badge.js to break a circular dependency (views → main.js → router.js → views). This was a correct architectural fix documented in the 01-02-SUMMARY.md. Reverting to main.js import would reintroduce the circular dep.
- **Action:** Retained badge.js import. No change needed.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All three views are pure HTML-string-returning functions with no side effects.

T-03-01 mitigation (moduleId XSS) was confirmed: moduleId is used only as MODULES.find() key. Module title, description, and icon come from the hardcoded MODULES config object — never from hash content.

T-03-02 mitigation confirmed: renderNotFound() is a fully static template literal with no dynamic values.

## Known Stubs

The following are intentional Phase 1 stubs documented in the copywriting contract:

| Stub | File | Reason |
|------|------|--------|
| "Lessons coming in Phase 2..." | src/views/module-view.js SECTION_CARDS | Phase 2 will populate lesson content |
| "Quizzes coming in Phase 2..." | src/views/module-view.js SECTION_CARDS | Phase 4 will populate quiz content |
| "Terminal exercises coming in Phase 5..." | src/views/module-view.js SECTION_CARDS | Phase 5 will add terminal engine |
| "Scenario exercises coming in Phase 6..." | src/views/module-view.js SECTION_CARDS | Phase 6 will add scenario engine |

These stubs are per-spec for Phase 1 — they communicate the module structure to the learner before content exists. They do not prevent the plan's goal (walking skeleton) from being achieved.

## Self-Check: PASSED

Files verified to exist:
- src/views/home-view.js: FOUND
- src/views/module-view.js: FOUND
- src/views/not-found-view.js: FOUND

Commits verified:
- fbfe95e: FOUND (fix(01-03): correct module-view XSS hygiene and copywriting)

Tests: 11/11 green
Build: pass
