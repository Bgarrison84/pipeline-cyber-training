---
phase: 04-quiz-engine-lesson-progress-ui
plan: 02
subsystem: quiz-engine
tags: [quiz, assessment, progress, tdd, xss, event-delegation]
dependency_graph:
  requires:
    - 04-01: Wave 0 prerequisites (CheckCircle/XCircle icons, quizId config, RED test scaffolds)
    - Phase 3: progress-store.js (saveQuiz, getQuizScore, markLessonCompleted, getLessonProgress APIs)
    - src/utils/escape.js (esc() for XSS mitigation)
    - src/utils/icons.js (activateIcons() for Lucide icon rendering)
    - public/data/modules/logging-auditing/quizzes/01.json (quiz data)
  provides:
    - renderQuiz(): async quiz renderer injected into lesson-view.js Step 5
    - computeModuleProgress(): synchronous D-07 progress formula for sidebar + module-view (Plan 03)
    - Quiz section inline below lesson article for audit-policies lesson
    - Score persistence via progressStore.saveQuiz() on last answer
    - Revisit mode with score banner when prior score exists
  affects:
    - 04-03 (Wave 2): sidebar.js progress bars call computeModuleProgress(); refreshSidebarProgress() call wired in quiz-engine
    - src/views/lesson-view.js: quiz section appended in Step 5 post-render block
tech_stack:
  added: []
  patterns:
    - Event delegation on section element (single click listener, e.target.closest())
    - Dynamic import('./sidebar.js') to break circular dependency at evaluation time
    - esc() applied to all quiz JSON strings before innerHTML insertion (XSS mitigation)
    - Try/catch fetch wrapper returning null on any failure (silent graceful degradation)
    - activateIcons() called after DOM append to render Lucide check-circle/x-circle icons
key_files:
  created:
    - src/quiz-engine.js
  modified:
    - src/views/lesson-view.js
    - tests/quiz-engine.test.js
decisions:
  - "Dynamic import('./sidebar.js') used instead of static top-level import to break the quiz-engine ↔ sidebar circular dependency"
  - "lessonId passed as fourth arg to renderQuiz() so markLessonCompleted() uses the correct lessonId in the attachment closure"
  - "Revisit mode renders question cards with data-answered=true and pointer-events:none — no click handlers attached since prior answer IDs are not stored (D-12)"
  - "quiz-engine.test.js RED stubs replaced with real assertions — sidebar.js mock added to vi.mock() declarations to intercept dynamic import"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 1
---

# Phase 4 Plan 02: Quiz Engine Implementation Summary

Full quiz engine with click-to-reveal feedback, XSS-safe HTML generation, score persistence via progressStore, and revisit mode — wired inline into the audit-policies lesson view.

## What Was Built

### Task 1: src/quiz-engine.js (new file)

**`renderQuiz(moduleId, quizId, lessonColumn, lessonId)`** — async function that:
- Fetches quiz JSON from `import.meta.env.BASE_URL + 'data/modules/{moduleId}/quizzes/{quizId}.json'`
- Returns null silently on fetch failure (quiz is supplementary to lesson content)
- Checks `progressStore.getQuizScore()` to determine first-visit vs revisit mode
- First-visit: renders interactive question cards with answer buttons and hidden feedback/explanation divs
- Revisit: renders score banner + locked cards (pointer-events:none, aria-disabled)
- Calls `activateIcons()` after DOM append to render check-circle/x-circle Lucide icons
- Attaches event delegation handler (first-visit only)

**`attachQuizHandlers(section, moduleId, quizId, quiz, lessonId)`** — single click listener on section:
- Guards with `e.target.closest('.quiz-answer-btn')` and `data-answered === 'true'` check (T-04-W1-04)
- Sets `data-answered="true"` on the question card to lock it
- Applies green border (`#22c55e`) + check-circle icon to the correct answer
- Applies red border (`var(--color-destructive)`) + x-circle icon to all wrong answers
- Shows per-answer feedback div for the clicked answer
- Shows question explanation div for all answers
- Calls `activateIcons()` to render newly visible icons
- On last answer: calls `progressStore.saveQuiz()`, `progressStore.markLessonCompleted()`, and `import('./sidebar.js').then(m => m.refreshSidebarProgress())` (dynamic import — circular dependency prevention)
- Appends completion banner with score text in green (#22c55e) or muted color

**`computeModuleProgress(mod)`** — synchronous D-07 formula:
- Lessons with `quizId`: count as complete when `getQuizScore()` returns non-null
- Lessons without `quizId`: count as complete when `getLessonProgress().visited` is true
- Returns `{numerator, denominator, pct, complete}` where `pct = Math.round(numerator/denominator * 100)`

**XSS mitigation (T-04-W1-01):** `esc()` applied to every quiz JSON string before innerHTML: `quiz.title`, `question.stem`, `answer.text`, `answer.feedback`, `question.explanation`, `answer.id`, `question.id`.

### Task 2: src/views/lesson-view.js (modified)

Added `import { renderQuiz } from '../quiz-engine.js'` at top of file.

In Step 5 post-render block, after `attachCopyHandlers()` and before `return null`:
```javascript
if (meta.quizId) {
  const lessonColumn = document.querySelector('.lesson-column');
  if (lessonColumn) {
    await renderQuiz(moduleId, meta.quizId, lessonColumn, lessonId);
  }
}
```

`renderLesson()` was already declared as `async function` — no signature change needed. The `lessonId` is already in scope within `renderLesson()`.

### tests/quiz-engine.test.js (updated)

Replaced all 16 `RED()` stub test bodies with real assertions. Added `vi.mock('../src/sidebar.js', ...)` to intercept the dynamic import inside `attachQuizHandlers`. All 16 tests are GREEN:

- `renderQuiz — first-visit mode` (4 tests): .quiz-section injection, stem text, answer buttons, activateIcons() call
- `renderQuiz — answer click behavior` (4 tests): data-answered set, pointer-events disabled, feedback visible, explanation visible
- `renderQuiz — score save` (2 tests): saveQuiz() called with correct args, markLessonCompleted() called
- `renderQuiz — revisit mode` (3 tests): "Your last attempt:" banner, score "1/1" displayed, no saveQuiz on click
- `computeModuleProgress` (3 tests): pct:0, pct:100, pct:50 cases

## Test Results

```
Test Files  9 passed | 2 failed (11)
Tests       16 passed (new GREEN) | 106 total passing | 11 still RED (Wave 0 scaffolds for Plan 03)
```

The 11 still-failing tests are Wave 0 RED scaffolds created in Plan 01 targeting Plan 03 functionality:
- `tests/sidebar.test.js`: 5 RED tests for sidebar progress bars + `refreshSidebarProgress()` export
- `tests/module-view.test.js`: 6 RED tests for module-view lesson status list + progress bar

These are intentionally RED and will be made GREEN by Plan 03 (Wave 2).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sidebar.js mock needed in quiz-engine.test.js for dynamic import**

- **Found during:** Task 1, initial test run
- **Issue:** `attachQuizHandlers` uses `import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId))`. In the test environment, Vitest intercepts static `vi.mock()` declarations but dynamic imports also get intercepted if the module is mocked. Without a sidebar.js mock, the dynamic import would attempt to load the real sidebar.js which imports `checkLessonAvailability` (requires DOM fetch setup) — causing test failures.
- **Fix:** Added `vi.mock('../src/sidebar.js', () => ({ initSidebar: vi.fn(), setActiveModule: vi.fn(), setActiveLesson: vi.fn(), refreshSidebarProgress: vi.fn() }))` to the top of `tests/quiz-engine.test.js`.
- **Files modified:** `tests/quiz-engine.test.js`
- **Commit:** 1e5e9ff

## Verification Checks Passed

1. `npm test -- tests/quiz-engine.test.js` exits 0 — all 16 tests GREEN
2. `grep "import.*quiz-engine" src/views/lesson-view.js` → match found
3. `grep "meta.quizId" src/views/lesson-view.js` → match found
4. `grep -c "renderQuiz\|computeModuleProgress" src/quiz-engine.js` → 5 occurrences
5. Static sidebar import check: no `import.*sidebar` in non-comment lines of quiz-engine.js

## Known Stubs

None — all quiz content renders from actual quiz JSON data. The quiz section is fully functional for the audit-policies lesson.

## Threat Flags

None — quiz fetch URL uses `import.meta.env.BASE_URL + 'data/...'` prefix (authored config, T-04-W1-03 accepted). All JSON strings escaped via `esc()` before innerHTML (T-04-W1-01 mitigated). Event delegation guards prevent double-submission (T-04-W1-04 mitigated).

## Self-Check: PASSED

Files exist:
- FOUND: src/quiz-engine.js
- FOUND: src/views/lesson-view.js (modified)
- FOUND: tests/quiz-engine.test.js (updated)

Commits exist:
- 1e5e9ff: feat(04-02): implement quiz-engine.js — renderQuiz, computeModuleProgress
- 1359201: feat(04-02): wire quiz engine into lesson-view.js
