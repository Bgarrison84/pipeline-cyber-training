---
phase: 05-simulated-powershell-terminal-exercise-view
plan: "04"
subsystem: module-view + quiz-engine + style
tags: [tdd, green-phase, wave-3, module-view, quiz-engine, css-keyframe, human-verify]
dependency_graph:
  requires:
    - phase: 05-01-wave-0-red-scaffolds
      provides: RED quiz-engine.test.js computeModuleProgress exercise branch tests
    - phase: 05-02-wave-1-terminal-engine
      provides: createTerminal factory
    - phase: 05-03-wave-2-exercise-view
      provides: renderExercise async view + exercise route
  provides:
    - exercise link button in module-view for lessons with exerciseId
    - computeModuleProgress exerciseId branch counting exercise completion toward module progress
    - terminal-cursor-blink CSS keyframe in style.css
    - complete Phase 5 vertical slice (exercise → progress bar → sidebar)
  affects: [src/views/module-view.js, src/quiz-engine.js, src/style.css]
tech_stack:
  added: []
  patterns: [exerciseId-branch-in-progress-calc, template-conditional-on-completion-state, css-keyframe-addition]
key_files:
  created: []
  modified:
    - src/views/module-view.js
    - src/quiz-engine.js
    - src/style.css
key_decisions:
  - "exerciseDone computed before lessonRows template (not inline) so conditional color/icon logic stays readable"
  - "Exercise link wraps inner lesson-title row in a flex column div to stack below lesson <a> + badge row without breaking existing horizontal badge layout"
  - "esc() applied to mod.id and lesson.exerciseId in href per STRIDE T-05-W3-01 — acceptance criteria verifies count"
patterns-established:
  - "computeModuleProgress if/else-if/else chain: quizId → exerciseId → visited — extend in same pattern for any new lesson completion type"
  - "module-view lesson row: outer block div, inner flex row for title+badge, exercise <a> below — template conditional on exerciseDone boolean"
requirements-completed:
  - TERM-01
  - TERM-02
  - TERM-03
  - TERM-04
duration: "~15 minutes"
completed: "2026-05-15"
---

# Phase 5 Plan 04: Wave 3 Module-View Exercise Links + computeModuleProgress Exercise Branch Summary

**Exercise link buttons wired into module-view lesson rows, computeModuleProgress exerciseId branch closes the loop on progress accounting, and cursor blink keyframe added — full Phase 5 vertical slice complete with 147/147 tests GREEN and all 10 human verification steps approved.**

## Performance

- **Duration:** ~15 minutes
- **Started:** 2026-05-15T19:37Z
- **Completed:** 2026-05-15T20:06Z
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint, APPROVED)
- **Files modified:** 3

## Accomplishments

- `computeModuleProgress` in `src/quiz-engine.js` now counts exercise completion toward module progress percentage via `else if (lesson.exerciseId)` branch — the 2 RED quiz-engine.test.js exercise tests are GREEN
- `src/views/module-view.js` renders an exercise link button below the lesson title row for any lesson with an `exerciseId`; color/icon switches dynamically (orange "Start Exercise →" vs. green "Exercise complete — revisit →") based on `progressStore.getExerciseCompletion()` result
- `src/style.css` has the `@keyframes terminal-cursor-blink` block required by the terminal view CSS contract
- Full Vitest suite: 147 passed, 0 failed, 1 todo — zero regressions across all Phase 1–5 tests
- Human verify checkpoint: all 10 manual verification steps approved by user

## Task Commits

1. **Task 1: computeModuleProgress exerciseId branch + exercise link in module-view + cursor keyframe** - `f139383` (feat)
2. **Task 2: checkpoint:human-verify** - APPROVED (no commit — verification gate)

## Files Created/Modified

- `src/quiz-engine.js` — Added `else if (lesson.exerciseId)` branch in `computeModuleProgress` loop; updated JSDoc `@param` to include `exerciseId?` on lesson objects
- `src/views/module-view.js` — Added `exerciseDone` computation per lesson + exercise `<a>` link template below each lesson row that has `exerciseId`; `esc()` applied to `mod.id` and `lesson.exerciseId` in href
- `src/style.css` — Appended `/* Phase 5: Terminal cursor blink */` comment + `@keyframes terminal-cursor-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }` block

## Decisions Made

- `exerciseDone` computed as a boolean before the template literal (not inline) — avoids double-calling `getExerciseCompletion` for color and icon conditionals, and keeps the template readable
- Lesson row div restructured to block layout with an inner flex row for the title+badge pair; exercise link sits below on its own line — required to prevent the link from collapsing into the horizontal flex row
- `esc()` applied to both `mod.id` and `lesson.exerciseId` in the exercise href, satisfying STRIDE T-05-W3-01 and the acceptance criteria grep check (`esc(mod.id)` count >= 2)

## Deviations from Plan

None — plan executed exactly as written. All three edits (quiz-engine.js, module-view.js, style.css) matched the `<action>` blocks in the plan. All acceptance criteria met on first run.

## Issues Encountered

None. The 2 RED quiz-engine tests from Wave 0 turned GREEN on the first implementation pass. No fix attempts required.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced.

STRIDE threats addressed:
- T-05-W3-01 (Tampering — exercise link href): `esc(mod.id)` and `esc(lesson.exerciseId)` applied in href; verified by acceptance criteria grep
- T-05-W3-02 (Tampering — exerciseDone conditional): boolean derived from `progressStore` return; no user-controlled string injected into innerHTML
- T-05-W3-03 (DoS — computeModuleProgress exerciseId lookup): `getExerciseCompletion` is synchronous O(1) localStorage read; accepted

## Known Stubs

None. All Wave 0 stubs replaced across all four plans:
- `src/terminal-engine.js` — fully implemented in Wave 1 (05-02)
- `src/views/exercise-view.js` — fully implemented in Wave 2 (05-03)
- `computeModuleProgress exerciseId` branch — implemented in this wave (05-04)

## Next Phase Readiness

Phase 5 is complete. All TERM-01 through TERM-04 requirements met:
- TERM-01: Correct command advances step, saves exercise completion (exercise-view.js + human verify step 7)
- TERM-02: successOutput contains realistic PS 5.1 output with CategoryInfo/FullyQualifiedErrorId (01.json + human verify step 5)
- TERM-03: Near-miss shows contextual hint in step panel (exercise-view.js hintPatterns + human verify step 6)
- TERM-04: Persistent simulator label "PS SIMULATOR — commands do not run on any real system" always visible (human verify step 4)

Phase 6 (Scenario Engine + Compliance Index + Completion Summary) can begin. No blockers.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/quiz-engine.js contains exerciseId branch | FOUND |
| src/views/module-view.js contains exerciseId (>=2) | FOUND |
| src/style.css contains terminal-cursor-blink | FOUND |
| Commit f139383 (Task 1) exists | FOUND |
| npx vitest run — 147 passed, 0 failed | PASS |
| Human verify checkpoint — all 10 steps approved | APPROVED |

---
*Phase: 05-simulated-powershell-terminal-exercise-view*
*Completed: 2026-05-15*
