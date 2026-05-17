---
phase: 05-simulated-powershell-terminal-exercise-view
plan: "01"
subsystem: terminal-engine + exercise-view
tags: [tdd, red-phase, wave-0, exercise-json, modules-config]
dependency_graph:
  requires: [04-quiz-engine-lesson-progress-ui]
  provides: [wave-0-test-contracts, exercise-json-3-step-schema, modules-config-exerciseid]
  affects: [tests/terminal-engine.test.js, tests/exercise-view.test.js, tests/router.test.js, tests/quiz-engine.test.js, public/data/modules/logging-auditing/exercises/01.json, src/modules-config.js]
tech_stack:
  added: []
  patterns: [vitest-stub-file-pattern, wave-0-red-scaffolding, vite-import-analysis-workaround]
key_files:
  created:
    - tests/terminal-engine.test.js
    - tests/exercise-view.test.js
    - src/terminal-engine.js (Wave 0 stub)
    - src/views/exercise-view.js (Wave 0 stub)
  modified:
    - public/data/modules/logging-auditing/exercises/01.json
    - src/modules-config.js
    - tests/router.test.js
    - tests/quiz-engine.test.js
decisions:
  - "Stub file pattern for non-existent modules: create Wave 0 stubs (throw Error) instead of vi.mock() overrides — Vite's import-analysis plugin resolves paths at transform time before vi.mock() can intercept, so stub files are required for RED test scaffolding"
  - "exerciseId added to ps-logging lesson (not audit-policies) to avoid quizId conflict per RESEARCH.md Pitfall 6"
  - "2-step EXERCISE_JSON fixture in exercise-view.test.js for simpler step progression testing (real 01.json has 3 steps)"
metrics:
  duration: "13 minutes"
  completed: "2026-05-15"
  tasks: 2
  files: 8
---

# Phase 5 Plan 01: Wave 0 RED Test Scaffolds + Exercise Data Prerequisites Summary

Wave 0 establishes the TDD RED baseline: stub implementations for the two new modules, 25 failing tests defining exact contracts, the upgraded 3-step exercise JSON, and the exerciseId wiring in modules-config.js.

## What Was Built

### Task 1: RED Test Stubs

**tests/terminal-engine.test.js** (13 `it()` blocks):
- createTerminal API shape: returns { appendOutput, disable, setPrompt, focus }
- appendOutput: textContent assignment, color parameter support, angle-bracket safety
- disable: readonly attribute + pointerEvents:none on input element
- Enter key handler: empty string guard, trimmed value call, input cleared
- Command history: ArrowUp/ArrowDown cycling, boundary clearing

**tests/exercise-view.test.js** (12 `it()` blocks):
- Fetch error: "Exercise content could not be loaded" in DOM
- Initial render: title, simulator label (TERM-04), "Step 1 of 2" panel
- Step progression: saveExercise not called until last step, panel text advances
- Completion: saveExercise("logging-auditing","01") + markLessonCompleted("logging-auditing","ps-logging") on last step
- Hint display: near-miss command shows hintPatterns hint in DOM (TERM-03)
- Wrong command: terminal.appendOutput called with feedbackOnWrong
- Re-visit mode: terminal.disable() called, "previously completed" in DOM

**Stub implementation approach:** Vite's `import-analysis` plugin resolves import paths at transform time before vi.mock() factories run. Creating minimal stub files (`src/terminal-engine.js`, `src/views/exercise-view.js`) that throw `Error('not implemented')` allows Vite to resolve the paths while keeping all tests RED.

### Task 2: Data Prerequisites + Exercise Route/Progress RED Tests

**01.json upgraded** to 3-step schema:
- Step 1: Get-ItemProperty check — hintPatterns for Get-Item and regedit near-misses, full PS 5.1 error output
- Step 2: New-Item key creation — hintPattern for premature Set-ItemProperty, realistic registry table output
- Step 3: Set-ItemProperty EnableScriptBlockLogging=1 — hintPattern for New-ItemProperty, full PSPath/PSProvider output
- Removed `"status": "placeholder"` field (T-05-W0-01 addressed)

**modules-config.js**: Added `exerciseId: '01'` to ps-logging lesson (not audit-policies, which has quizId: '01' — avoids ambiguity in computeModuleProgress).

**tests/router.test.js**: Added RED test for `#/exercise/logging-auditing/01` → `{ view: 'exercise', params: { moduleId, exerciseId } }`.

**tests/quiz-engine.test.js**: Added 2 RED tests in `computeModuleProgress` describe block for exercise-backed lesson completion tracking.

## Test Results

```
Test Files  4 failed | 9 passed (13)
Tests       27 failed | 120 passed | 1 todo (148)
```

- **4 RED (expected):** terminal-engine.test.js (13 failing), exercise-view.test.js (12 failing), router.test.js (1 failing), quiz-engine.test.js (1 failing)
- **9 GREEN (pre-existing, no regressions)**

Note: The quiz-engine "null completion does not count" test passes coincidentally (the `else` visited-check branch also returns pct=0 for unvisited ps-logging). The "non-null completion counts as complete" test is correctly RED (pct=0 when 100% expected).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vite import-analysis prevents vi.mock() on non-existent paths**
- **Found during:** Task 1 verification
- **Issue:** Vite's `vite:import-analysis` plugin resolves all import paths at transform time, before vi.mock() factories are invoked. Dynamic `import()` and static `import` statements for non-existent modules both fail with "Failed to resolve import ... Does the file exist?"
- **Fix:** Created Wave 0 stub files (`src/terminal-engine.js`, `src/views/exercise-view.js`) that export functions throwing `Error('not implemented')`. Tests import these stubs (Vite resolves path), stubs throw on call (tests fail RED with assertion error, not parse error).
- **Files modified:** src/terminal-engine.js (new), src/views/exercise-view.js (new)
- **Commits:** 4db4e01

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `createTerminal` throws | src/terminal-engine.js | Wave 0 placeholder — real implementation in Wave 1 (Plan 05-02) |
| `renderExercise` throws | src/views/exercise-view.js | Wave 0 placeholder — real implementation in Wave 2 (Plan 05-03) |

These stubs are intentional and required for the RED testing phase. They will be replaced with real implementations in subsequent plans.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced. The JSON schema upgrade (hintPatterns) is consumed only by the frontend exercise-view — no backend surface.

T-05-W0-01 (backslash double-escaping in 01.json) addressed: all JSON string values use `\\` for literal backslashes, validated by node -e JSON.parse() in acceptance criteria.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| tests/terminal-engine.test.js exists | FOUND |
| tests/exercise-view.test.js exists | FOUND |
| src/terminal-engine.js exists | FOUND |
| src/views/exercise-view.js exists | FOUND |
| public/data/modules/logging-auditing/exercises/01.json exists | FOUND |
| src/modules-config.js exists | FOUND |
| Commit 4db4e01 (Task 1) | FOUND |
| Commit 47fc2bc (Task 2) | FOUND |
| 01.json steps count = 3 | PASS |
| 01.json no status field | PASS |
| 01.json step-1 hintPatterns count = 2 | PASS |
| modules-config has exerciseId: '01' | PASS |
