---
phase: 04-quiz-engine-lesson-progress-ui
plan: 03
subsystem: progress-ui
tags: [progress-bars, sidebar, module-view, tdd, xss, shell-03]
dependency_graph:
  requires:
    - 04-01: Wave 0 prerequisites (test scaffolds, icons, quizId config)
    - 04-02: quiz-engine.js with computeModuleProgress() export
    - Phase 3: progress-store.js (getLessonProgress, getQuizScore APIs)
  provides:
    - Sidebar 4px progress bars injected after initSidebar()
    - refreshSidebarProgress(moduleId) live update after quiz submission
    - Module overview page: progress bar + per-lesson status badges
    - SHELL-03 fully implemented
  affects:
    - quiz-engine.js: calls refreshSidebarProgress() via dynamic import on quiz completion
tech_stack:
  added: []
  patterns:
    - DOM-walking post-build pattern (MODULES.forEach after innerHTML + activateIcons)
    - CSS.escape() for safe querySelector with module IDs
    - Synchronous progressStore API calls in renderModule() (router contract preserved)
    - lessonStatusBadge() local helper for quiz-passed/visited/unvisited state
    - vi.hoisted() fix for Vitest mock factory variable capture
key_files:
  created: []
  modified:
    - src/sidebar.js
    - src/views/module-view.js
    - tests/module-view.test.js
decisions:
  - "vi.hoisted() used for _computeModuleProgressMock in module-view.test.js — needed because module-view.js now imports quiz-engine.js, causing Vitest to hoist vi.mock() before the const declaration"
  - "lessonStatusBadge() badge text values are hard-coded string literals (T-04-W2-03: accept) — never passed through esc()"
  - "refreshSidebarProgress() does targeted DOM update only — no full initSidebar() re-render"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
  files_created: 0
---

# Phase 4 Plan 03: Sidebar Progress Bars + Module-View Lesson Status Summary

Sidebar 4px progress bars with live quiz-completion refresh, module-overview progress bar, and per-lesson status badges — delivering SHELL-03. All 117 automated tests GREEN. Human checkpoint pending.

## What Was Built

### Task 1: src/sidebar.js (modified)

Added `import { computeModuleProgress } from './quiz-engine.js'` at the top.

**Progress bar injection in `initSidebar()`** — after the existing `activateIcons()` call, a `MODULES.forEach` loop:
- Queries each `.sidebar-module[data-module-id="..."]` element using `CSS.escape(mod.id)`
- Calls `computeModuleProgress(mod)` to get `{pct, complete}`
- Creates `.sidebar-progress-bar` div: height 4px, `var(--color-bg-secondary)` track, inner fill div with `width:{pct}%` and `var(--color-accent)` background, 300ms ease transition
- Inserts the bar after the module title link via `titleLink.after(bar)`
- At 100%: injects `<i data-lucide="check-circle">` into the title span + sets title link color to `var(--color-accent)`
- Calls `activateIcons()` once more to render injected check-circle icons

**`refreshSidebarProgress(moduleId)` export** — targeted DOM update (no full re-render):
- Guards on `sidebarModules`, `mod`, and `moduleEl` null checks
- Calls `computeModuleProgress(mod)`, updates `.sidebar-progress-bar div` width
- At complete: injects check-circle icon (if not already present) + sets title link color

### Task 2: src/views/module-view.js (full content area rewrite)

Added imports: `computeModuleProgress` from `../quiz-engine.js` and `progressStore` from `../progress-store.js`.

**Removed:** `SECTION_CARDS` constant (4 placeholder cards: Lessons, Quizzes, Terminal Exercises, Scenarios) and the grid div that referenced it.

**Added in `renderModule()`:**
1. **Progress bar section:** `computeModuleProgress(mod)` → label "Module progress: {pct}%" in uppercase muted style + 4px track with `var(--color-accent)` fill
2. **Lesson list section:** "Lessons" heading + per-lesson rows with `display:flex` layout, lesson title link (`#/lesson/{esc(mod.id)}/{esc(lesson.id)}`), and status badge from `lessonStatusBadge()`

**`lessonStatusBadge(mod, lesson)` local helper:**
- If `lesson.quizId` and `getQuizScore()` non-null → green `quiz-passed` badge (`#22c55e`)
- If `lesson.quizId` and `getLessonProgress().visited` → muted `visited` badge
- If no `lesson.quizId` and `getLessonProgress().visited` → muted `visited` badge
- Default → semi-transparent `unvisited` badge
- All badge text values are hard-coded string literals (XSS: T-04-W2-03 accepted)
- `renderModule()` remains a synchronous function (router contract preserved)

### tests/module-view.test.js (bug fix)

**Auto-fixed (Rule 1):** `_computeModuleProgressMock` capture changed from top-level `const` to `vi.hoisted()`. When `module-view.js` now imports `quiz-engine.js` statically, Vitest hoists `vi.mock('../src/quiz-engine.js', ...)` to the top of the file — before the `const` declaration — causing "Cannot access before initialization". `vi.hoisted()` lifts the variable into the hoisting zone alongside the mock factory.

## Test Results

```
Test Files  11 passed (11)
Tests       117 passed | 1 todo (118)
```

Full suite GREEN — sidebar progress bar tests (5), module-view tests (6), plus all pre-existing tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted() fix for _computeModuleProgressMock in module-view.test.js**

- **Found during:** Task 2, initial test run
- **Issue:** `module-view.js` now imports `quiz-engine.js` statically. Vitest hoisted the `vi.mock('../src/quiz-engine.js', () => ({ computeModuleProgress: _computeModuleProgressMock }))` factory to the top of the file, before the `const _computeModuleProgressMock = vi.fn()...` declaration. Result: `ReferenceError: Cannot access '_computeModuleProgressMock' before initialization`.
- **Fix:** Wrapped the capture in `vi.hoisted()`: `const { _computeModuleProgressMock } = vi.hoisted(() => ({ _computeModuleProgressMock: vi.fn()... }))`. This moves the variable initialization into Vitest's hoisting zone alongside the mock factory calls.
- **Files modified:** `tests/module-view.test.js`
- **Commit:** 4f0cb92

## Verification Checks Passed

1. `npm test` exits 0 — 11 test files, 117 tests GREEN
2. `grep -c "export function refreshSidebarProgress" src/sidebar.js` → 1
3. `grep -c "computeModuleProgress" src/sidebar.js` → 3 (import + 2 usages)
4. `grep "SECTION_CARDS" src/views/module-view.js` → nothing (removed)
5. `grep -c "computeModuleProgress" src/views/module-view.js` → 2 (import + usage)
6. `grep "async.*renderModule\|renderModule.*async" src/views/module-view.js` → nothing (synchronous)
7. Human checkpoint Task 3: PENDING (not yet verified in browser)

## Known Stubs

None — lesson status is wired to live `progressStore` data. Progress bars use real `computeModuleProgress()` calculations.

## Threat Flags

None — T-04-W2-01 mitigated (esc() on lesson.title and lesson.id in module-view HTML). T-04-W2-02 mitigated (CSS.escape() used in sidebar querySelector). T-04-W2-03 accepted (badge text is hard-coded). T-04-W2-04 accepted (no PII).

## Self-Check: PASSED

Files exist:
- FOUND: src/sidebar.js (modified)
- FOUND: src/views/module-view.js (modified)
- FOUND: tests/module-view.test.js (updated)

Commits exist:
- e48a38c: feat(04-03): add sidebar progress bars and refreshSidebarProgress export
- 4f0cb92: feat(04-03): rewrite module-view.js with progress bar and lesson status list
