---
phase: 03-progress-store
fixed_at: 2026-05-14T16:30:00Z
review_path: .planning/phases/03-progress-store/03-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-05-14T16:30:00Z
**Source review:** .planning/phases/03-progress-store/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (3 Critical + 5 Warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Circular import graph — `main.js` ↔ `router.js` ↔ `sidebar.js`

**Files modified:** `src/utils/icons.js` (new), `src/router.js`, `src/sidebar.js`, `src/main.js`, `src/views/lesson-view.js`, `tests/sidebar-progress.test.js`, `tests/router-resume.test.js`
**Commit:** 93dd78b
**Applied fix:**
- Created `src/utils/icons.js` with the `activateIcons` function (and all Lucide icon imports), breaking the cycle at its root.
- Updated `src/router.js` to import `activateIcons` from `./utils/icons.js` instead of `./main.js`.
- Updated `src/sidebar.js` to import `activateIcons` from `./utils/icons.js`, drop the `handleRoute` import from `./router.js`, and change `initSidebar()` signature to `initSidebar({ onImportSuccess } = {})`. The import success handler now calls `onImportSuccess()` if provided.
- Updated `src/main.js` to remove the `activateIcons` definition and export (no longer needed), and pass `handleRoute` as `{ onImportSuccess: handleRoute }` to `initSidebar`.
- Updated `src/views/lesson-view.js` to import `activateIcons` from `../utils/icons.js`.
- Updated `tests/sidebar-progress.test.js` to mock `utils/icons.js` instead of `main.js`, and updated the "successful import" test to pass `handleRouteMock` as `onImportSuccess`.
- Note: WR-02 and WR-04 were applied in the same commit since they modified the same files (router.js and sidebar.js respectively).

### CR-02: `importProgress` silently installs a future schema version

**Files modified:** `src/progress-store.js`, `tests/progress-store.test.js`
**Commit:** c15eb81
**Applied fix:**
- Added a `schemaVersion > CURRENT_VERSION` guard in `importProgress()` after the type check, returning `{ ok: false, error: 'This progress file was saved by a newer version of the app (schema vN). Please update the app before importing.' }`.
- Added the same guard in `_loadFromStorage()` to return `null` for future-version data before the `migrate()` call.

### CR-03: `resetProgress()` does not reset `_storageAvailable`

**Files modified:** `src/progress-store.js`
**Commit:** c15eb81
**Applied fix:**
- Added `_storageAvailable = probeStorage();` at the end of `resetProgress()`, so that removing the localStorage key (which may free quota) is reflected immediately in the storage-availability flag.

### WR-01: `exportProgress` revokes URL synchronously — download fails in Firefox

**Files modified:** `src/progress-store.js`, `tests/progress-store.test.js`
**Commit:** c15eb81
**Applied fix:**
- Changed `URL.revokeObjectURL(url)` to `setTimeout(() => URL.revokeObjectURL(url), 100)`.
- Updated the corresponding test to use `vi.useFakeTimers()`, assert that `revokeObjectURL` is NOT called synchronously, advance timers by 100ms with `vi.advanceTimersByTime(100)`, then assert it was called.

### WR-02: `isInitialLoad` fires on every nav to `#/`, not just startup

**Files modified:** `src/router.js`, `tests/router-resume.test.js`
**Commit:** 93dd78b (bundled with CR-01)
**Applied fix:**
- Added module-level `let _handledInitialLoad = false;` in `router.js`.
- Wrapped the resume-redirect block with `if (!_handledInitialLoad)` and set `_handledInitialLoad = true` at the top of that block.
- Exported `_resetInitialLoadForTesting()` function that resets the flag.
- Updated `tests/router-resume.test.js` to call `_resetInitialLoadForTesting()` in `beforeEach` to ensure each test starts with a fresh initial-load state.
- **Note:** Requires human verification — logic fix (WR-02 changes routing behavior).

### WR-04: Import error not cleared on successful re-import

**Files modified:** `src/sidebar.js`
**Commit:** 93dd78b (bundled with CR-01)
**Applied fix:**
- Added `const errEl = document.getElementById('import-error-msg'); if (errEl) errEl.textContent = '';` at the top of the file-input `change` event handler, before the `importProgress` call.

### WR-05: `_loadFromStorage` doesn't fill blank keys for current-version data

**Files modified:** `src/progress-store.js`
**Commit:** c15eb81
**Applied fix:**
- Changed `_loadFromStorage()` to always call `migrate(parsed)` for any schema version that is `<= CURRENT_VERSION`, removing the `return parsed` branch that skipped migration for exactly-current-version data. The `> CURRENT_VERSION` guard (added for CR-02) returns null before `migrate()` is reached.

---

_Fixed: 2026-05-14T16:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
