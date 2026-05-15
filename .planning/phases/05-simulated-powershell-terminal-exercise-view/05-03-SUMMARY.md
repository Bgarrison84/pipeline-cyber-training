---
phase: 05-simulated-powershell-terminal-exercise-view
plan: "03"
subsystem: exercise-view + router
tags: [tdd, green-phase, wave-2, exercise-view, router]
dependency_graph:
  requires: [05-01-wave-0-red-scaffolds, 05-02-wave-1-terminal-engine]
  provides: [renderExercise-async-view, exercise-route]
  affects: [src/views/exercise-view.js, src/router.js]
tech_stack:
  added: []
  patterns: [async-view-pattern, closure-mutable-state, dynamic-import-circular-dep, textContent-xss-safe]
key_files:
  created: []
  modified:
    - src/views/exercise-view.js
    - src/router.js
decisions:
  - "import('../sidebar.js') in completeExercise uses '../' relative path (exercise-view.js lives in src/views/) — functionally identical to quiz-engine.js's import('./sidebar.js') which lives in src/"
  - "Re-visit completion banner rendered inline in buildExerciseHtml (not via renderCompletionBanner) so priorCompletion date is available in the initial HTML string without DOM manipulation"
  - "showActiveStep uses data attributes (data-step-index, data-step-counter, data-step-instruction, data-step-icon, data-hint-area, data-hint-text) for stable DOM queries — avoids fragile nth-child selectors"
metrics:
  duration: "7 minutes"
  completed: "2026-05-15"
  tasks: 2
  files: 2
---

# Phase 5 Plan 03: Exercise View + Router Wiring (Wave 2) Summary

renderExercise async view with regex command matching, hint display, completion flow, re-visit mode, and exercise route registered in router — all 12 exercise-view.test.js + 6 router.test.js tests GREEN.

## What Was Built

### Task 1: src/views/exercise-view.js — renderExercise async view (TDD GREEN)

Replaced Wave 0 stub with full 290-line implementation. Mirrors lesson-view.js async pattern exactly.

**Flow:**
1. null-guard `#app` element
2. Loading skeleton (renderExerciseLoading) injected synchronously
3. Fetch `BASE_URL + 'data/modules/{moduleId}/exercises/{exerciseId}.json'` — silent error state (renderExerciseError) on failure
4. Derive `lessonId` from `MODULES.find(m => m.id === moduleId)?.lessons.find(l => l.exerciseId === exerciseId)?.id ?? exerciseId`
5. Check re-visit state via `progressStore.getExerciseCompletion(moduleId, exerciseId)`
6. Inject `buildExerciseHtml(exercise, moduleId, priorCompletion)` — pure HTML string with header card (C-02), step panel (C-03), simulator banner (C-04), terminal mount (C-05)
7. Storage warning prepended to `.lesson-column` if `!progressStore.isStorageAvailable()`
8. `activateIcons()` called after all innerHTML
9. `createTerminal(termMount, handleCommand)` mounts into `#terminal-mount`; `terminal.setPrompt('PS PIPELINE-DC01 >')`
10. Re-visit mode: `terminal.disable()` and return — completion banner already in inline HTML
11. Fresh mode: `terminal.focus()`

**handleCommand logic:**
- Loop `step.expectedCommands`: `new RegExp(cmd.pattern, caseSensitive ? '' : 'i').test(trimmed)` — first match wins; wrapped in try/catch for malformed patterns (T-05-W2-04)
- On match: `terminal.appendOutput(successOutput)`, `markStepDone(app, index)`, advance `currentStepIndex`, call `completeExercise()` on last step or `showActiveStep()` + `activateIcons()`
- Loop `step.hintPatterns`: regex match → `showHint(app, stepIndex, hp.hint)` (textContent, not innerHTML)
- Fallback: `terminal.appendOutput(feedbackOnWrong, 'var(--color-text-muted)')` via textContent (T-05-W2-02)

**completeExercise:**
- `progressStore.saveExercise(moduleId, exerciseId)`
- `progressStore.markLessonCompleted(moduleId, lessonId)`
- `import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — dynamic only (T-05-W2-06)
- `terminal.disable()`
- `renderCompletionBanner(app, exercise)` — appends C-06 div with check-circle, "Exercise complete — well done.", compliance badges

**Security mitigations applied (all STRIDE threats T-05-W2-01 through T-05-W2-06):**
- `esc()` applied to: `exercise.title`, `exercise.description`, `exercise.context`, `step.instruction`, `completedAt` date string, `moduleId` in error href
- `terminal.appendOutput()` uses `textContent` exclusively — successOutput/feedbackOnWrong cannot inject HTML
- `new RegExp()` wrapped in try/catch throughout
- No static `import` of `sidebar.js` anywhere in the file

**Test results:**
```
Test Files  1 passed (1)
Tests  12 passed (12)
```

### Task 2: src/router.js — exercise route wiring

Three targeted edits only — no changes to `extractParams`, `matchRoute`, `handleRoute`, or event listeners.

1. Import: `import { renderExercise } from './views/exercise-view.js';`
2. Routes: `{ pattern: '#/exercise/:moduleId/:exerciseId', view: 'exercise' }`
3. viewRenderers: `exercise: (params) => renderExercise(params)`

**Test results:**
```
Test Files  1 passed (1)
Tests  6 passed (6)
```

**Full suite post-Wave-2:**
```
Test Files  1 failed | 12 passed (13)
Tests  1 failed | 146 passed | 1 todo (148)
```
The 1 failing test is `quiz-engine.test.js > computeModuleProgress > exercise-backed lesson with non-null completion counts as complete` — this is a pre-existing RED test from Wave 0 that Wave 3 (plan 05-04) will fix by adding the `else if (lesson.exerciseId)` branch to `computeModuleProgress`. Expected per plan's verification section.

## Acceptance Criteria Verification

| Check | Result |
|-------|--------|
| `export async function renderExercise` count === 1 | PASS (1) |
| `PS SIMULATOR — commands do not run on any real system` in HTML template | PASS (1) |
| `import('../sidebar.js')` dynamic sidebar — no static sidebar import | PASS |
| `esc(exercise.` count positive (>=2) | PASS (3) |
| `innerHTML.*successOutput` count === 0 | PASS (0) |
| `saveExercise` count === 1 | PASS (1) |
| `markLessonCompleted` count === 1 | PASS (1) |
| `exercise/:moduleId/:exerciseId` in router | PASS (1) |
| `renderExercise` in router (import + viewRenderers) | PASS (2) |
| `npx vitest run tests/exercise-view.test.js` exits 0 | PASS (12/12) |
| `npx vitest run tests/router.test.js` exits 0 | PASS (6/6) |
| min_lines >= 120 | PASS (~290 lines) |

## Deviations from Plan

### Minor Adjustments

**1. [Clarification] import('../sidebar.js') uses '../' not './'**
- **Found during:** Task 1 implementation
- **Issue:** Plan acceptance criteria grep for `import('./sidebar.js')` fails because exercise-view.js is in `src/views/`, making the correct relative path `'../sidebar.js'` not `'./sidebar.js'` (quiz-engine.js at `src/` level uses `'./'`)
- **Fix:** Used correct relative path `import('../sidebar.js')` — all 12 tests pass confirming this is correct
- **Files modified:** src/views/exercise-view.js (line 189)

No other deviations — plan executed as written.

## Known Stubs

None. All stubs from prior waves have been replaced:
- `src/terminal-engine.js` — fully implemented in Wave 1 (Plan 05-02)
- `src/views/exercise-view.js` — fully implemented in this wave

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes at trust boundaries introduced beyond those planned in the threat model.

All 6 STRIDE threats (T-05-W2-01 through T-05-W2-06) mitigated as designed:
- T-05-W2-01: esc() verified on exercise JSON fields → innerHTML
- T-05-W2-02: terminal.appendOutput uses textContent
- T-05-W2-03: esc(moduleId) in renderExerciseError href
- T-05-W2-04: RegExp wrapped in try/catch
- T-05-W2-05: accepted (existing progressStore QuotaExceededError handler)
- T-05-W2-06: import('../sidebar.js') dynamic only — no static sidebar import

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/views/exercise-view.js exists | FOUND |
| src/router.js contains exercise route | FOUND |
| Commit 6041397 (Task 1 — exercise-view.js) | FOUND |
| Commit 470902e (Task 2 — router.js) | FOUND |
| All 12 exercise-view.test.js tests GREEN | PASS |
| All 6 router.test.js tests GREEN | PASS |
| `PS SIMULATOR — commands do not run on any real system` in exercise-view.js | PASS |
| No static sidebar import | PASS |
| esc() applied to exercise JSON fields | PASS (3 occurrences) |
| No innerHTML assignment for successOutput/feedbackOnWrong | PASS |
