---
phase: 11-pwa-offline-support
plan: "02"
subsystem: testing
tags: [vitest, happy-dom, tdd, pwa, offline-indicator, service-worker]

requires:
  - phase: 11-pwa-offline-support/11-01
    provides: vite-plugin-pwa installed and vitest + happy-dom test infrastructure in place

provides:
  - TDD RED test file for src/offline-indicator.js with 13 failing tests locking the API contract
  - Failing tests covering DOM injection, online/offline transitions, install prompt, SW listener, guard

affects:
  - 11-04 (implements src/offline-indicator.js to satisfy these tests — GREEN phase)

tech-stack:
  added: []
  patterns:
    - "vi.resetModules() + dynamic import in beforeEach to reset module-level singleton state between tests"
    - "Object.defineProperty with configurable:true for navigator.onLine and navigator.serviceWorker mocks"
    - "afterEach(() => vi.restoreAllMocks()) for clean teardown of all spies and property mocks"

key-files:
  created:
    - tests/offline-indicator.test.js
  modified: []

key-decisions:
  - "Used dynamic import in beforeEach (not static top-level import) to enable vi.resetModules() to reset singleton state between tests"
  - "No vi.mock() blocks — offline-indicator.js has no project-local imports to mock"
  - "beforeinstallprompt test uses vi.spyOn(window, 'addEventListener') for listener registration check plus dispatchEvent for full event path; commented integration note for happy-dom non-standard event caveat"

patterns-established:
  - "TDD RED pattern: test file references non-existent src module to produce 'Cannot find module' failure"
  - "Navigator mock pattern: Object.defineProperty with configurable:true allows afterEach restoreAllMocks to clean up"

requirements-completed:
  - PWA-03

duration: 8min
completed: 2026-05-18
---

# Phase 11 Plan 02: offline-indicator.js — TDD RED Phase Summary

**13 failing tests across 5 describe blocks lock the initOfflineIndicator() API contract before implementation exists**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-18T23:45:48Z
- **Completed:** 2026-05-18T23:54:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created tests/offline-indicator.test.js with 13 it() blocks covering all PWA-03 behaviors
- Confirmed RED state: all new tests fail with "Failed to resolve import" (src/offline-indicator.js does not exist)
- Confirmed zero regressions: existing 205 tests remain GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for offline-indicator.js (RED)** - `5b80e10` (test)

## Files Created/Modified
- `tests/offline-indicator.test.js` - 13 failing unit tests covering DOM injection, state transitions, install prompt, SW integration, and missing-container guard

## Decisions Made
- Used dynamic import in beforeEach rather than static import to allow vi.resetModules() to reset any module-level singleton state that the implementation will likely use
- Tested beforeinstallprompt via both vi.spyOn(window, 'addEventListener') (reliable in happy-dom) and window.dispatchEvent (full path, may not fire in CI for non-standard events)
- No vi.mock() blocks because offline-indicator.js will have no project-local imports

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - test file written, RED state confirmed on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- tests/offline-indicator.test.js is committed and RED — ready for Plan 11-04 (GREEN implementation)
- API contract locked: initOfflineIndicator() must inject #offline-indicator and #install-link into #top-bar > div.flex, handle online/offline events, beforeinstallprompt/appinstalled events, and register SW controllerchange listener

---
*Phase: 11-pwa-offline-support*
*Completed: 2026-05-18*
