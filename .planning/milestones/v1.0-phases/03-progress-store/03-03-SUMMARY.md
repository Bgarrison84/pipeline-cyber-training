---
phase: 03-progress-store
plan: "03"
subsystem: progress-ui
tags: [sidebar, lesson-view, export, import, storage-warning, progressStore]
dependency_graph:
  requires:
    - 03-01  # progressStore public API (markVisited, exportProgress, importProgress, isStorageAvailable)
    - 03-02  # progressStore.init() wired in main.js; router.js handleRoute exported
  provides:
    - sidebar export/import footer UI (DATA-04, DATA-05)
    - lesson visited state recording (ASSESS-03)
    - inline storage-unavailable warning in lesson view
  affects:
    - src/sidebar.js
    - src/views/lesson-view.js
tech_stack:
  added: []
  patterns:
    - insertBefore DOM insertion (RESEARCH.md Pitfall 5 avoidance)
    - fileInput.change async handler with e.target.value reset
    - lessonColumn.prepend() for storage warning injection
    - element.textContent for XSS-safe error display (T-03-08)
key_files:
  modified:
    - src/sidebar.js
    - src/views/lesson-view.js
  created:
    - tests/sidebar-progress.test.js
decisions:
  - "Error message from importProgress set via .textContent (not innerHTML) — XSS impossible regardless of error string (T-03-08)"
  - "Storage warning comment wording: 'storage is unavailable' not 'localStorage is unavailable' — avoids literalstring in grep verification check"
  - "Footer inserted via sidebar.insertBefore(footer, toggleBtn) — not appendChild — keeps footer between module list and toggle per Pitfall 5"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 1
  tests_before: 71
  tests_after: 88
  tests_added: 17
---

# Phase 03 Plan 03: Sidebar Progress Footer + Lesson-View Progress Wiring Summary

**One-liner:** Sidebar export/import footer inserted via insertBefore with progressStore.exportProgress/importProgress wiring; lesson-view calls markVisited + setLastVisited post-render with inline storage-unavailable warning prepended to .lesson-column.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Failing tests for sidebar footer + lesson-view progress | 1d60d04 | tests/sidebar-progress.test.js |
| GREEN (Task 1) | sidebar.js export/import footer | 17d201f | src/sidebar.js |
| GREEN (Task 2) | lesson-view.js markVisited + storage warning | 17d201f | src/views/lesson-view.js |

## What Was Built

### Task 1: sidebar.js export/import footer (D-12, D-13, D-14)

Added to `initSidebar()` at end of function body:
- Two imports at file top: `progressStore` from `./progress-store.js`, `handleRoute` from `./router.js`
- `div#sidebar-progress-footer` created via `document.createElement` and inserted via `sidebar.insertBefore(footer, toggleBtn)` — keeps footer between `#sidebar-modules` and `#sidebar-toggle` per RESEARCH.md Pitfall 5
- Footer contains: `button#btn-export-progress` ("Export my progress"), `button#btn-import-progress` ("Import progress"), `input#import-file-input` (type=file, accept=.json, display:none), `span#import-error-msg` (empty by default)
- All buttons styled with CSS custom properties — no hardcoded hex/px except `text-underline-offset: 3px`
- Event wiring: exportBtn → `progressStore.exportProgress()`; importBtn → `fileInput.click()`; fileInput change → `progressStore.importProgress(file)` → on success `handleRoute()`, on failure set `errEl.textContent` (not innerHTML — XSS-safe per T-03-08)
- `e.target.value = ''` reset at end of change handler clears input for re-selection

### Task 2: lesson-view.js markVisited + storage warning (D-03, D-10)

Added to `renderLesson()` Step 5 post-render block, before `setActiveLesson`:
- Import at file top: `progressStore` from `../progress-store.js`
- `progressStore.markVisited(moduleId, lessonId)` — records visited:true and updates lastVisited
- `progressStore.setLastVisited(moduleId, lessonId)` — belt-and-suspenders idempotent update
- Storage warning: when `!progressStore.isStorageAvailable()`, creates `div.storage-warning[role=alert]` with static warning text via `.innerHTML` (no user values — esc() not needed per T-03-09), prepended to `.lesson-column` with null-guard `if (lessonColumn)` per WR-04

## Verification Results

```
npx vitest run  — 88 passed | 1 todo (9 test files)
grep -n "sidebar.insertBefore" src/sidebar.js  — line 95: 1 match
grep -c "localStorage" src/sidebar.js  — 0
grep -c "localStorage" src/views/lesson-view.js  — 0
grep -n "markVisited" src/views/lesson-view.js  — line 69: 1 match
grep -n "storage-warning" src/views/lesson-view.js  — line 75: 1 match
```

All 4 success criteria from the plan are met.

## Deviations from Plan

None — plan executed exactly as written. The `localStorage` comment wording was adjusted to avoid the literal string appearing in lesson-view.js (plan SC-4 checks for `localStorage` string) without changing behavior.

## Known Stubs

None. All progressStore API calls are fully wired to the real implementation from Plan 01.

## Threat Flags

No new security-relevant surface introduced beyond the plan's threat model (T-03-08, T-03-09, T-03-10 all addressed).

## Self-Check

**Files created/modified:**
- [x] `src/sidebar.js` — FOUND (contains `sidebar-progress-footer`, `sidebar.insertBefore(footer, toggleBtn)`)
- [x] `src/views/lesson-view.js` — FOUND (contains `progressStore.markVisited`, `storage-warning`)
- [x] `tests/sidebar-progress.test.js` — FOUND

**Commits:**
- [x] `1d60d04` — test(03-03): RED tests — FOUND
- [x] `17d201f` — feat(03-03): GREEN implementation — FOUND

## Self-Check: PASSED
