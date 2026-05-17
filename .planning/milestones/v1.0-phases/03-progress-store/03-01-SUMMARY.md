---
phase: 03-progress-store
plan: "01"
subsystem: progress-store
tags: [localStorage, progress, tdd, migration, export, import, fallback]
dependency_graph:
  requires: []
  provides:
    - progressStore singleton (init, markVisited, markLessonCompleted, saveQuiz, saveExercise, saveScenario, all getters, exportProgress, importProgress, resetProgress)
    - _migrateForTesting named export
  affects:
    - src/main.js (will call progressStore.init() before handleRoute in Plan 03-02)
    - src/router.js (will call getLastVisited() in Plan 03-02)
    - src/sidebar.js (will wire export/import buttons in Plan 03-02)
    - src/views/lesson-view.js (will call markVisited + show storage warning in Plan 03-02)
tech_stack:
  added: []
  patterns:
    - Singleton module with closed-over private state (_store, _storageAvailable)
    - try-catch probe for localStorage availability (probeStorage)
    - Write-with-fallback pattern (_persist)
    - Deep-copy migration runner (JSON.parse/JSON.stringify)
    - URL.createObjectURL + anchor click for JSON file export
    - File.text() async API for JSON import
    - vi.stubGlobal for reliable localStorage fallback testing in happy-dom
key_files:
  created:
    - src/progress-store.js
    - tests/progress-store.test.js
  modified: []
decisions:
  - "Used vi.stubGlobal('localStorage', failingStorage) instead of vi.spyOn(Storage.prototype, 'setItem') — happy-dom does not properly restore instance spies via vi.restoreAllMocks(), causing subsequent tests to still throw"
  - "migrate() uses JSON.parse(JSON.stringify(data)) for deep copy instead of spread — prevents reference aliasing of nested lessons/quizzes/exercises/scenarios objects"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tests_added: 38
  files_created: 2
---

# Phase 3 Plan 01: Progress Store — Core Module Summary

localStorage abstraction singleton with in-memory fallback, schema migration runner, JSON export/import, and full Vitest test coverage (38 tests, all green).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write failing tests (RED) | e96da50 | tests/progress-store.test.js |
| 2 | Implement progress-store.js (GREEN) | 8c4fc36 | src/progress-store.js, tests/progress-store.test.js |

## What Was Built

`src/progress-store.js` is the single module that owns ALL localStorage access for the pipeline cyber training app. Key capabilities:

- **Storage probe**: `probeStorage()` tries `localStorage.setItem('__pct_probe__', '1')` + `removeItem` inside try-catch to detect Safari SecurityError and QuotaExceededError without trusting typeof checks
- **In-memory fallback**: `_storageAvailable` boolean gates all writes; `_store` is always updated so all get/set APIs work identically regardless of storage status (D-09, D-11)
- **Schema versioning**: `STORAGE_KEY = 'pipeline-cyber-training:progress'`, `CURRENT_VERSION = 1`. `_loadFromStorage()` checks `typeof parsed.schemaVersion === 'number'` and invokes `migrate()` for older versions
- **Migration runner**: `migrate()` does a deep copy via `JSON.parse(JSON.stringify(data))` and fills missing top-level keys from `_blankStore()`. Wired for future chains; no v1→v2 migration exists yet
- **Export**: `exportProgress()` serializes `_store` to JSON Blob, creates object URL, clicks a temporary anchor, revokes URL to prevent memory leak (DATA-05)
- **Import**: `importProgress(file)` reads via `File.prototype.text()`, validates `schemaVersion` is a number and at least one known key exists, runs migration if old version, replaces `_store` on success without overwriting on failure (DATA-05, T-03-01)
- **Reset**: `resetProgress()` replaces `_store` with blank schema and removes localStorage entry — used in test teardown

## TDD Gate Compliance

- RED commit: `e96da50` — `test(03-01)` — all 38 tests failed with "Failed to resolve import"
- GREEN commit: `8c4fc36` — `feat(03-01)` — all 38 tests pass
- REFACTOR: not needed — implementation was clean on first pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.spyOn(Storage.prototype, 'setItem') not intercepting localStorage after vi.restoreAllMocks() in happy-dom**

- **Found during:** Task 1 (test writing) / Task 2 (making tests green)
- **Issue:** happy-dom 20.x does not properly restore instance spies on `localStorage.setItem` via `vi.restoreAllMocks()`. After the first spy is restored, subsequent `vi.spyOn(Storage.prototype, 'setItem')` calls in later tests receive 0 calls — `probeStorage()` bypasses the spy. `vi.spyOn(localStorage, 'setItem')` also failed because `vi.restoreAllMocks()` leaves it permanently throwing after restore.
- **Fix:** Replaced `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(...)` with `vi.stubGlobal('localStorage', failingStorage)` + `vi.unstubAllGlobals()` in afterEach. This replaces the entire localStorage object with a controlled fake for the duration of fallback tests, which fully restores on `vi.unstubAllGlobals()`.
- **Files modified:** tests/progress-store.test.js (storage fallback describe block)
- **Commit:** 8c4fc36

**2. [Rule 1 - Bug] migrate() shallow spread caused reference aliasing of nested objects**

- **Found during:** Task 2 first test run
- **Issue:** `migrate()` used `{ ...blank, ...data }` which shared the `lessons`, `quizzes`, `exercises`, `scenarios` object references between the returned object and the input. Mutating `result.lessons` also mutated `input.lessons`.
- **Fix:** Changed to `JSON.parse(JSON.stringify(data))` deep copy plus key-fill loop from `_blankStore()`.
- **Files modified:** src/progress-store.js
- **Commit:** 8c4fc36

## Known Stubs

None — all public API methods are fully implemented and tested.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced beyond the plan's threat model. The `importProgress()` implementation satisfies T-03-01 (JSON.parse wrapped in try/catch + schemaVersion type check + known-keys check). T-03-04 (prototype pollution) is mitigated by `JSON.parse` safe defaults. T-03-02 mitigated via comment + consumers must use `esc()`.

## Self-Check: PASSED

- src/progress-store.js: FOUND
- tests/progress-store.test.js: FOUND
- .planning/phases/03-progress-store/03-01-SUMMARY.md: FOUND
- commit e96da50 (RED): FOUND
- commit 8c4fc36 (GREEN): FOUND
- commit 2dc02ae (SUMMARY): FOUND
- localStorage in main.js: 0
- localStorage in router.js: 0
- localStorage in sidebar.js: 0
- localStorage in lesson-view.js: 0
