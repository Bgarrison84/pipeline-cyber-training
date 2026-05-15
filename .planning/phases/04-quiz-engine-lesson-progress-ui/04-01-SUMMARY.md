---
phase: 04-quiz-engine-lesson-progress-ui
plan: 01
subsystem: quiz-engine-prerequisites
tags: [wave-0, prerequisites, tdd-scaffolding, icons, config]
dependency_graph:
  requires:
    - Phase 3: progress-store.js (progressStore APIs: saveQuiz, getQuizScore, markLessonCompleted, getLessonProgress)
    - src/utils/icons.js (existing — modified)
    - src/modules-config.js (existing — modified)
    - public/data/modules/logging-auditing/quizzes/01.json (existing — modified)
    - public/data/modules/logging-auditing/lessons/audit-policies.md (existing — modified)
  provides:
    - CheckCircle and XCircle registered in activateIcons() for quiz answer state icons
    - quizId: '01' on audit-policies lesson entry in MODULES config (enables synchronous progress calculation)
    - quizId: '01' in audit-policies.md frontmatter (enables lesson-view.js quiz injection call)
    - Clean 01.json with no stale "status" field
    - RED test scaffolds in quiz-engine.test.js, module-view.test.js, sidebar.test.js
  affects:
    - Wave 1 plan (04-02): quiz-engine.js implementation; icons now register correctly
    - Wave 2 plan (04-03): sidebar and module-view progress bars; MODULES quizId field drives computeModuleProgress()
tech_stack:
  added: []
  patterns:
    - vi.fn() mock reference capture pattern (const _mock = vi.fn() before vi.mock()) for Vite static analysis compatibility
    - RED gate helper function (throw new Error('RED: ...')) for wave-0 test stubs
key_files:
  created:
    - tests/quiz-engine.test.js
    - tests/module-view.test.js
  modified:
    - src/utils/icons.js
    - src/modules-config.js
    - public/data/modules/logging-auditing/lessons/audit-policies.md
    - public/data/modules/logging-auditing/quizzes/01.json
    - tests/sidebar.test.js
decisions:
  - "Used vi.fn() mock reference capture pattern instead of top-level import of non-existent quiz-engine.js to avoid Vite vite:import-analysis static resolution failure"
  - "Used throw new Error('RED: ...') helper in quiz-engine.test.js instead of it.todo() to produce visible test failures (not skipped tests) in the RED state"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
  files_created: 2
---

# Phase 4 Plan 01: Wave 0 Prerequisites + RED Test Scaffolds Summary

Wave 0 prerequisite fixes for Phase 4: CheckCircle/XCircle icons registered, quizId config wired, audit-policies.md frontmatter extended, stale quiz JSON field removed, and RED test scaffolds created covering all ASSESS-01 and SHELL-03 behaviors.

## What Was Built

### Task 1: Source File Prerequisites (4 files modified)

**`src/utils/icons.js`** — Added `CheckCircle` and `XCircle` to the named import from `lucide` and to the `icons` object passed to `createIcons()`. Without this, quiz-engine.js would inject `data-lucide="check-circle"` and `data-lucide="x-circle"` attributes but `activateIcons()` would silently produce empty icon placeholders.

**`src/modules-config.js`** — Added `quizId: '01'` to the `audit-policies` lesson entry in the `logging-auditing` module. Only this one entry was modified; all other 10 lesson entries across 5 modules are unchanged. This field enables `computeModuleProgress()` (Wave 1) to distinguish quiz-backed lessons from quiz-less lessons without fetching all frontmatter.

**`public/data/modules/logging-auditing/lessons/audit-policies.md`** — Added `quizId: '01'` as a new YAML frontmatter line after `complianceControls`. `parseFrontmatter()` in content-loader.js passes all frontmatter fields to `meta` — no parser changes needed.

**`public/data/modules/logging-auditing/quizzes/01.json`** — Removed the stale top-level `"status": "placeholder"` field. All question/answer/feedback/explanation data is preserved exactly. The field was not read by any code.

### Task 2: RED Test Scaffolds (3 test files)

**`tests/quiz-engine.test.js`** (NEW) — 16 RED tests across 5 describe blocks:
- `renderQuiz — first-visit mode`: injection, stem text, answer buttons, activateIcons() call
- `renderQuiz — answer click behavior`: data-answered attribute, button disabling, feedback text, explanation text
- `renderQuiz — score save`: saveQuiz() called with correct args, markLessonCompleted() called
- `renderQuiz — revisit mode`: "Your last attempt:" banner, score display, no saveQuiz on click
- `computeModuleProgress`: pct:0 all-unvisited, pct:100 quiz-passed, pct:50 partial (D-07 formula)

All 16 tests throw `Error: RED: <description>` — they are visible failures (not skipped) that Wave 1 must turn green.

**`tests/module-view.test.js`** (NEW) — 7 tests across 3 describe blocks (6 RED, 1 passing):
- `renderModule — progress bar`: progress bar presence, computeModuleProgress called with correct arg
- `renderModule — lesson list`: lesson titles, quiz-passed badge, visited/unvisited states
- `renderModule — not found`: "Module not found" for unknown moduleId (PASSES — already implemented)

**`tests/sidebar.test.js`** (EXTENDED) — vi.mock declarations added at top of file; 2 new describe blocks appended at bottom:
- `sidebar progress bars — initSidebar() injection`: no-throw, .sidebar-progress-bar presence, width:0% for zero progress
- `sidebar progress bars — refreshSidebarProgress()`: function exported, no-throw call, width updates to 50%

3 pre-existing tests in sidebar.test.js continue to pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vite static import analysis prevents vi.mock() from intercepting non-existent module**

- **Found during:** Task 2, initial test run
- **Issue:** Top-level `import { computeModuleProgress } from '../src/quiz-engine.js'` in test files caused Vite's `vite:import-analysis` plugin to throw "Failed to resolve import" at transform time, before `vi.mock()` intercepted the module. This made `sidebar.test.js` and `module-view.test.js` fail as suite errors, which would have prevented the 3 pre-existing sidebar tests from running.
- **Fix:** Used a pre-captured mock reference pattern — `const _computeModuleProgressMock = vi.fn()` declared before `vi.mock('../src/quiz-engine.js', ...)` — and referenced this variable in the mock factory. Test bodies then use `_computeModuleProgressMock` directly instead of importing from `quiz-engine.js`. This satisfies Vite's static analysis (no import statement) while still providing a controlled mock.
- **Files modified:** `tests/sidebar.test.js`, `tests/module-view.test.js`
- **Commit:** e56aa96

**2. [Rule 2 - Missing critical functionality] quiz-engine.test.js uses throw instead of it.todo()**

- **Found during:** Task 2, reviewing RED state behavior
- **Issue:** Using `it.todo()` would make tests appear as "skipped" in the test runner, making them invisible in CI output. The plan requires tests to be in RED (failing) state to enforce the TDD gate — Wave 1 must see failing tests to know what to implement.
- **Fix:** Used a `RED(description)` helper function that throws `Error: RED: <description>`. Tests appear as failed (not skipped) with a clear message. This is more consistent with the "Nyquist contract" — tests must be failing, not absent.
- **Files modified:** `tests/quiz-engine.test.js`
- **Commit:** e56aa96

## Test Results

```
Test Files  3 failed | 8 passed (11)
Tests       27 failed | 90 passed | 1 todo (118)
```

- 8 pre-existing test files: all green (85 tests + 1 todo)
- tests/quiz-engine.test.js: 16/16 RED (throw Error('RED: ...'))
- tests/module-view.test.js: 6/7 RED (1 passing: "Module not found")
- tests/sidebar.test.js: 5/9 RED (4 passing: 3 pre-existing + "initSidebar() can be called without throwing")

## Verification Checks Passed

1. `grep -c "CheckCircle" src/utils/icons.js` → 2 (import + icons object)
2. `grep -c "quizId" src/modules-config.js` → 1 (audit-policies entry only)
3. `grep "quizId" audit-policies.md` → `quizId: '01'`
4. `grep "placeholder" 01.json` → not found
5. `tests/quiz-engine.test.js` exists with 5 describe blocks
6. `tests/module-view.test.js` exists with 3 describe blocks
7. `tests/sidebar.test.js` has vi.mock declarations at top and 2 new describe blocks

## Known Stubs

None — all changes in this plan are prerequisite fixes and test scaffolding. No UI-visible features were implemented.

## Threat Flags

None — all changes in this plan are authored static config, test files, and data cleanup. No new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

Files exist:
- FOUND: src/utils/icons.js
- FOUND: src/modules-config.js
- FOUND: public/data/modules/logging-auditing/lessons/audit-policies.md
- FOUND: public/data/modules/logging-auditing/quizzes/01.json
- FOUND: tests/quiz-engine.test.js
- FOUND: tests/module-view.test.js
- FOUND: tests/sidebar.test.js

Commits exist:
- ca35dce: feat(04-01): fix icons.js + modules-config.js + audit-policies prerequisites
- e56aa96: test(04-01): add RED test scaffolds for quiz-engine, module-view, and sidebar progress
