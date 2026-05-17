---
phase: 03-progress-store
plan: "02"
subsystem: progress-store
tags: [localStorage, progress, router, main, auto-resume, tdd, init-sequence]
dependency_graph:
  requires:
    - progressStore singleton (from 03-01)
  provides:
    - progressStore.init() called before handleRoute() in app startup sequence
    - isInitialLoad auto-resume redirect in router.js handleRoute()
  affects:
    - src/main.js (progressStore.init() now in sequential init chain)
    - src/router.js (isInitialLoad redirect reads getLastVisited())
tech_stack:
  added: []
  patterns:
    - Sequential async init: loadComplianceRefs -> progressStore.init() -> Promise.all([...])
    - isInitialLoad redirect pattern: set window.location.hash then return early; hashchange fires handleRoute() again
    - D-06 pattern: router reads lastVisited only after init() has hydrated store from localStorage
key_files:
  created:
    - tests/main-init.test.js
    - tests/router-resume.test.js
  modified:
    - src/main.js
    - src/router.js
decisions:
  - "progressStore.init() is awaited alone (not in Promise.all) to guarantee getLastVisited() reads hydrated localStorage before handleRoute() runs (D-06 + RESEARCH.md Pitfall 6)"
  - "isInitialLoad block placed AFTER app null-guard and BEFORE matchRoute() call per plan spec — redirect returns early and relies on hashchange event to re-enter handleRoute()"
  - "setLastVisited is called by markVisited in lesson-view.js (not router.js) per plan open question 3 — router only reads lastVisited, never writes it"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tests_added: 7
  files_modified: 2
---

# Phase 3 Plan 02: Progress Store Wiring — App Init + Auto-Resume Summary

Wire progressStore into the sequential init chain of main.js and add the isInitialLoad redirect to router.js handleRoute(), delivering the D-06 auto-resume behavior: returning learners land directly on their last visited lesson.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Add failing tests for progressStore wiring and isInitialLoad redirect | 3f31b67 | tests/main-init.test.js, tests/router-resume.test.js |
| GREEN (Task 1 + 2) | Wire progressStore.init() in main.js; add isInitialLoad redirect in router.js | 597708e | src/main.js, src/router.js |

## What Was Built

**src/main.js changes:**
- Added `import { progressStore } from './progress-store.js'` after existing named imports
- Inserted `await progressStore.init()` as the second statement in `init()`, between `await loadComplianceRefs()` and `await Promise.all([handleRoute(), initSidebar()])`. This guarantees that all progress state (including lastVisited) is hydrated from localStorage before the first route render runs.

**src/router.js changes:**
- Added `import { progressStore } from './progress-store.js'` after existing imports
- Inserted the isInitialLoad block at the top of `handleRoute()` (after the `if (!app) return` guard, before `matchRoute`):
  ```javascript
  const isInitialLoad = !window.location.hash || window.location.hash === '#/';
  if (isInitialLoad) {
    const last = progressStore.getLastVisited();
    if (last?.moduleId && last?.lessonId) {
      window.location.hash = '#/lesson/' + last.moduleId + '/' + last.lessonId;
      return;
    }
  }
  ```
  When a returning learner opens the app with no hash or `#/`, this block fires and redirects the hash. The `return` causes the subsequent `hashchange` event to call `handleRoute()` again with the new hash — which then passes through matchRoute and renders the lesson.

**Tests added (7 total):**
- `tests/main-init.test.js`: 3 tests verifying progressStore state after init(), including persisted lastVisited loading
- `tests/router-resume.test.js`: 4 tests — 2 for redirect behavior (RED then GREEN), 1 for non-redirect on explicit hash, 1 for null lastVisited fallthrough

## TDD Gate Compliance

- RED commit: `3f31b67` — `test(03-02)` — 2 router-resume tests failed (redirect not yet implemented)
- GREEN commit: `597708e` — `feat(03-02)` — all 71 tests pass (was 64 before this plan)
- REFACTOR: not needed — implementation is minimal and clean

## Deviations from Plan

None — plan executed exactly as written. Both files modified with precisely the changes specified. No additional logic was needed beyond the isInitialLoad block and the init() call.

## Known Stubs

None — the auto-resume behavior is fully wired end-to-end. progressStore.init() is awaited before handleRoute(), and handleRoute() reads getLastVisited() before rendering.

## Threat Surface Scan

- **T-03-06 (Tampering — hash construction):** The hash is built as `'#/lesson/' + last.moduleId + '/' + last.lessonId`. These values come from localStorage via `progressStore.getLastVisited()`. The hash router's `matchRoute()` → `extractParams()` validates that the path has exactly 3 segments matching the `:moduleId/:lessonId` pattern — injected extra segments produce a segment count mismatch and fall to 'not-found'. No innerHTML injection occurs from these values.
- **T-03-07 (Spoofing — nonexistent lesson):** If the stored lesson doesn't exist, `renderLesson()` calls `fetchLesson()` which returns null, rendering the lesson error view. Graceful failure, no security impact.

No new threat surface introduced beyond the plan's registered threats.

## Self-Check: PASSED

- src/main.js: contains "await progressStore.init()" at line 38
- src/router.js: contains "progressStore.getLastVisited()" at line 52
- src/main.js: 0 direct localStorage references
- src/router.js: 0 direct localStorage references
- tests/main-init.test.js: FOUND
- tests/router-resume.test.js: FOUND
- commit 3f31b67 (RED): FOUND
- commit 597708e (GREEN): FOUND
- Full test suite: 71 tests, 0 failures
