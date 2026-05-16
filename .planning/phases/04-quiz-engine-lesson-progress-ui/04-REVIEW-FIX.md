---
phase: 04-quiz-engine-lesson-progress-ui
fixed_at: 2026-05-15T13:13:00Z
review_path: .planning/phases/04-quiz-engine-lesson-progress-ui/04-REVIEW.md
iteration: 2
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-05-15T13:13:00Z
**Source review:** `.planning/phases/04-quiz-engine-lesson-progress-ui/04-REVIEW.md`
**Iteration:** 2 (all 10 findings across both runs)

**Summary:**
- Findings in scope: 10 (2 Critical, 5 Warning, 3 Info)
- Fixed: 10
- Skipped: 0

## Fixed Issues

### CR-01: Null guard in progress-store.js getter functions

**Files modified:** `src/progress-store.js`
**Commit:** `f371540`
**Applied fix:** Added `if (!_store) return <safe-default>` null guards at the top of all four getter functions: `getLessonProgress` returns `{ visited: false, completed: false }`, and `getQuizScore`, `getExerciseCompletion`, `getScenarioCompletion` all return `null`. This prevents `TypeError: Cannot read properties of null` crashes when these functions are called before `progressStore.init()` resolves.

---

### CR-02: DOM createElement instead of innerHTML for completion banner (quiz-engine.js)

**Files modified:** `src/quiz-engine.js`
**Commit:** `6ad2edc`
**Applied fix:** Replaced `completionBanner.innerHTML = \`<p style="...color: ${bannerColor}...">\`` with explicit DOM creation: `document.createElement('p')` with `p.style.cssText` and `p.style.color` property assignments, and `p.textContent` for the message. Removed the `bannerColor` variable entirely. Eliminates the CSS injection risk pattern.

---

### WR-01: Thread lessonColumn into attachQuizHandlers for banner placement

**Files modified:** `src/quiz-engine.js`
**Commit:** `9af5e79`
**Applied fix:** Updated `attachQuizHandlers` signature to accept `lessonColumn` as a sixth parameter. Updated the call in `renderQuiz` to pass `lessonColumn`. Changed `section.appendChild(completionBanner)` to `lessonColumn.appendChild(completionBanner)` so the completion banner renders outside the bordered quiz section, as a sibling of it.

---

### WR-02: Deduplication guard before lessonColumn.appendChild (quiz-engine.js)

**Files modified:** `src/quiz-engine.js`
**Commit:** `db3db09`
**Applied fix:** Added guard `const existingQuiz = lessonColumn.querySelector('.quiz-section'); if (existingQuiz) existingQuiz.remove();` immediately before `lessonColumn.appendChild(section)`. Prevents duplicate `.quiz-section` elements from accumulating during rapid back-and-forth navigation.

---

### WR-03: Re-query live icon inside setTimeout callback (lesson-view.js)

**Files modified:** `src/views/lesson-view.js`
**Commit:** `3f7326f`
**Applied fix:** Inside the `setTimeout` callback in `attachCopyHandlers`, replaced use of the stale captured `icon` variable with a live re-query: `const liveIcon = btn.querySelector('[data-lucide], svg');` guarded with `if (liveIcon)`. All DOM mutations in the callback now target the actual rendered SVG element rather than the detached original `<i>` element.

---

### WR-04: Replace inline onmouseout handler in sidebar.js

**Files modified:** `src/sidebar.js`
**Commit:** `dd7b5bb`
**Applied fix:** Removed the inline `onmouseover` and `onmouseout` attributes from the module link HTML template. After building sidebar HTML, added proper `mouseover` and `mouseout` event listeners via `sidebarModules.querySelectorAll('.sidebar-module a').forEach(link => { ... })`. The `mouseout` handler checks `link.closest('.sidebar-module--active')` to preserve the orange accent color for active modules.

---

### WR-05: Remove duplicate padding-left and first font-size in module-view.js

**Files modified:** `src/views/module-view.js`
**Commit:** `27c96fe`
**Applied fix:** Removed `padding-left: var(--spacing-md);` from the goal blockquote div (the shorthand `padding` already covers all sides). Removed the first `font-size: var(--text-body);` declaration from the Module goal label `<p>` (the second `font-size: 0.75rem` was overriding it anyway).

---

## Test Results

All 11 test files passed with 117 passing tests after iteration 1 fixes (Critical + Warning).

---

## Iteration 2 — Info findings (2026-05-15)

### IN-01: sidebar.test.js — `_computeModuleProgressMock` needs `vi.hoisted()`

**Files modified:** `tests/sidebar.test.js`
**Commit:** `f758099`
**Applied fix:** Replaced the plain `const _computeModuleProgressMock = vi.fn()...` declaration with a `vi.hoisted()` wrapper, matching the pattern already used in `tests/module-view.test.js`. The mock function is now initialized before Vitest hoists `vi.mock()` factory closures to the top of the file at transform time, ensuring `computeModuleProgress` in the quiz-engine mock resolves to the `vi.fn()` rather than `undefined`.

### IN-02: `renderLesson` JSDoc `@returns` type mismatch

**Files modified:** `src/views/lesson-view.js`
**Commit:** `6274d38`
**Applied fix:** Changed the `@returns` JSDoc line from `{Promise<string>} Empty string — view takes DOM control itself` to `{Promise<null>} null — view writes directly to #app`. The function returns `null` on every code path (lines 29, 36, 53, 94), never an empty string. The corrected JSDoc now accurately documents the actual contract.

### IN-03: Add 2+ questions to 01.json and multi-question tests to quiz-engine.test.js

**Files modified:** `public/data/modules/logging-auditing/quizzes/01.json`, `tests/quiz-engine.test.js`
**Commit:** `2c92487`
**Applied fix:**

Part A — Extended `01.json` from 1 question to 3 questions by adding:
- `q-02`: "Which PowerShell cmdlet retrieves Windows Security event log entries filtered by Event ID?" (correct: `Get-WinEvent -FilterHashtable`, compliance: NIST-AU-6)
- `q-03`: "Under TSA SD-02F, what is the minimum retention period for cybersecurity event logs on pipeline OT systems?" (correct: 12 months, compliance: TSA-SD-02F)

Part B — Added a `describe('renderQuiz — partial credit with multi-question quiz (IN-03)')` block to `tests/quiz-engine.test.js` with a dedicated `QUIZ_3Q` 3-question fixture and two tests:
1. Verifies `progressStore.saveQuiz` is called with `{ score: 1, total: 3 }` when only q-01 is answered correctly and q-02/q-03 are answered incorrectly.
2. Verifies the completion banner text reads "Quiz complete — 1/3 correct" when `score < totalQuestions`.

## Final Test Results

All 11 test files pass with **119 passing tests | 1 todo** after all 10 findings fixed across both iterations.

---

_Fixed: 2026-05-15T13:13:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
