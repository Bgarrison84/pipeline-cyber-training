---
phase: 05-simulated-powershell-terminal-exercise-view
verified: 2026-05-15T20:15:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to #/exercise/logging-auditing/01 in a browser and exercise the full flow"
    expected: "Exercise view renders with header, 3-step panel, simulator banner; commands advance steps; wrong commands show feedback; completion disables terminal and shows banner; re-visit shows previously-completed state"
    why_human: "Full interactive user flow across all 3 exercise steps requires a browser with DOM rendering — cannot be verified by automated test or grep alone"
  - test: "Verify module-view exercise link button state"
    expected: "Logging & Auditing module page shows 'Start Exercise →' in orange for ps-logging lesson before completion; after completing the exercise, the link switches to 'Exercise complete — revisit →' in green"
    why_human: "State change depends on localStorage write from exercise completion and page re-render — requires browser interaction and session state"
---

# Phase 5: Simulated PowerShell Terminal + Exercise View — Verification Report

**Phase Goal:** Learners can practice PowerShell commands against realistic exercise prompts with meaningful feedback — the terminal scope contract and exercise JSON schema are finalized for all module authors
**Verified:** 2026-05-15T20:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Typing the correct command advances the learner to the next step with realistic PS output; completion is recorded | VERIFIED | `exercise-view.js` `handleCommand()` matches regex against `expectedCommands`, calls `markStepDone()` + `showActiveStep()`; `completeExercise()` calls `progressStore.saveExercise()` + `markLessonCompleted()`. 01.json has 3-step schema with full PS 5.1 error output including CategoryInfo/FullyQualifiedErrorId. Tests: 12/12 exercise-view.test.js pass including saveExercise+markLessonCompleted assertions. |
| 2 | Typing a near-miss command returns a contextual hint (not generic failure) | VERIFIED | `handleCommand()` iterates `step.hintPatterns[]` after expectedCommands fail; calls `showHint()` which sets `data-hint-text` via `textContent`. 01.json has 2 hintPatterns on step-1, 1 each on steps 2 and 3. Test: `near-miss command matching a hintPattern: hint area in DOM contains the hint text` passes. |
| 3 | Typing an unrecognized command returns helpful error; no uncaught JS exception | VERIFIED | `handleCommand()` has try/catch around `new RegExp()` for both expectedCommands and hintPatterns (swallows malformed patterns). Fallback path calls `terminal.appendOutput(step.feedbackOnWrong, 'var(--color-text-muted)')`. Test: `wrong command (no hint match): terminal.appendOutput called with feedbackOnWrong text` passes. |
| 4 | Terminal UI displays persistent simulator label "PS SIMULATOR — commands do not run on any real system" at all times | VERIFIED | Exact string hardcoded in `buildExerciseHtml()` at line 308 in `exercise-view.js`: `<span ...>PS SIMULATOR — commands do not run on any real system</span>`. Banner is rendered above `#terminal-mount` in the HTML string, not conditionally. Test: `simulator label text ... is present in #app innerHTML` passes. |
| 5 | Completing all steps records completion to Progress Store; re-opening shows prior completion state | VERIFIED | `completeExercise()` calls `progressStore.saveExercise(moduleId, exerciseId)` and `progressStore.markLessonCompleted(moduleId, lessonId)`. Re-visit check: `progressStore.getExerciseCompletion()` called before terminal mount; if non-null, `terminal.disable()` + returns. Revisit banner renders inline in `buildExerciseHtml` with "previously completed" text. Tests: saveExercise/markLessonCompleted called on last step; `terminal.disable() called` in re-visit; DOM contains "previously completed" — all pass. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/terminal-engine.js` | createTerminal factory (~120 lines) | VERIFIED | 202 lines, exports `createTerminal`, pure DOM module with no imports. Closure state: history[], historyIndex, disabled. API: appendOutput, disable, setPrompt, focus. |
| `src/views/exercise-view.js` | renderExercise async view (>=120 lines) | VERIFIED | 358 lines, exports `renderExercise`. Implements full flow: loading skeleton, fetch, lessonId derivation, priorCompletion check, buildExerciseHtml, activateIcons, createTerminal mount, handleCommand closure, completeExercise. |
| `src/router.js` | exercise route registered | VERIFIED | Line 15: `{ pattern: '#/exercise/:moduleId/:exerciseId', view: 'exercise' }`. Line 6: `import { renderExercise } from './views/exercise-view.js'`. Line 46: `exercise: (params) => renderExercise(params)`. |
| `src/views/module-view.js` | Exercise link button for lessons with exerciseId | VERIFIED | Lines 43-45: `exerciseDone` computed per lesson. Lines 53-60: conditional `<a>` link with color/icon toggle (orange "Start Exercise →" vs green "Exercise complete — revisit →"). esc() applied to mod.id and lesson.exerciseId in href. |
| `src/quiz-engine.js` | computeModuleProgress with exerciseId branch | VERIFIED | Lines 269-272: `else if (lesson.exerciseId) { const ex = progressStore.getExerciseCompletion(mod.id, lesson.exerciseId); if (ex !== null) numerator++; }` inserted between quizId branch and visited-check else. |
| `src/style.css` | terminal-cursor-blink keyframe | VERIFIED | Lines 288-292: `/* Phase 5: Terminal cursor blink */` + `@keyframes terminal-cursor-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }` |
| `public/data/modules/logging-auditing/exercises/01.json` | 3-step schema with hintPatterns, no status field | VERIFIED | 3 steps confirmed (node -e). step-1 has 2 hintPatterns. No "status" root field (grep returns 0). Realistic PS 5.1 successOutput with CategoryInfo and FullyQualifiedErrorId on step-1. |
| `src/modules-config.js` | ps-logging lesson has exerciseId: '01' | VERIFIED | Line 17: `{ id: 'ps-logging', title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' }` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/router.js` | `src/views/exercise-view.js` | `import { renderExercise }` | WIRED | Static import at line 6; used in viewRenderers at line 46 |
| `src/views/exercise-view.js` | `src/terminal-engine.js` | `import { createTerminal }` | WIRED | Static import at line 10; called at line 75 `createTerminal(termMount, handleCommand)` |
| `src/views/exercise-view.js` | `progressStore.saveExercise` | `completeExercise()` | WIRED | Line 187: `progressStore.saveExercise(moduleId, exerciseId)` inside completeExercise |
| `src/views/exercise-view.js` | `src/sidebar.js` | dynamic `import('../sidebar.js')` | WIRED | Line 189: `import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — dynamic only, no static import |
| `src/views/module-view.js` | `progressStore.getExerciseCompletion` | per-lesson exerciseDone check | WIRED | Line 44: `progressStore.getExerciseCompletion(mod.id, lesson.exerciseId) !== null` |
| `src/quiz-engine.js computeModuleProgress` | `progressStore.getExerciseCompletion` | else-if exerciseId branch | WIRED | Line 271: `progressStore.getExerciseCompletion(mod.id, lesson.exerciseId)` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `exercise-view.js` | `exercise` (exercise JSON) | `fetch(url)` where url = `BASE_URL + 'data/modules/{moduleId}/exercises/{exerciseId}.json'` | Yes — fetches real 01.json with 3 steps and hintPatterns | FLOWING |
| `exercise-view.js` | `priorCompletion` | `progressStore.getExerciseCompletion(moduleId, exerciseId)` | Yes — reads from localStorage via progressStore API | FLOWING |
| `exercise-view.js` | `steps` | `exercise.steps ?? []` from fetched JSON | Yes — 3 real steps with patterns and output | FLOWING |
| `module-view.js` | `exerciseDone` | `progressStore.getExerciseCompletion(mod.id, lesson.exerciseId) !== null` | Yes — reads localStorage synchronously | FLOWING |
| `quiz-engine.js computeModuleProgress` | `ex` (exercise completion) | `progressStore.getExerciseCompletion(mod.id, lesson.exerciseId)` | Yes — reads localStorage, returns {completed, completedAt} or null | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| createTerminal exports as function | `node --input-type=module --eval "import { createTerminal } from './src/terminal-engine.js'; console.log(typeof createTerminal)"` | "function" | PASS |
| 01.json has 3 steps, no status field, hintPatterns present | `node -e "const j=JSON.parse(...); console.log(j.steps.length, j.steps[0].hintPatterns.length, 'status' in j)"` | "3 2 false" | PASS |
| Full Vitest suite | `npx vitest run` | 147 passed, 0 failed, 1 todo | PASS |
| terminal-engine.test.js (13 tests) | `npx vitest run tests/terminal-engine.test.js` | 13 passed | PASS |
| exercise-view.test.js (12 tests) | `npx vitest run tests/exercise-view.test.js` | 12 passed | PASS |
| router.test.js exercise route test | `npx vitest run tests/router.test.js` | 6 passed (exercise route test included) | PASS |
| quiz-engine.test.js exercise branch (2 tests) | `npx vitest run tests/quiz-engine.test.js` | included in 51 passing | PASS |

### Probe Execution

Step 7c: SKIPPED — no probe scripts found in `scripts/*/tests/probe-*.sh` pattern. Phase does not declare any probes in plan frontmatter.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| TERM-01 | 05-01, 05-02, 05-03, 05-04 | Terminal accepts expected commands and returns helpful feedback for wrong commands | SATISFIED | `handleCommand()` in exercise-view.js validates each command against `expectedCommands[]` regex patterns; correct match → advance step; wrong → hintPatterns fallback → feedbackOnWrong. All 12 exercise-view tests pass. |
| TERM-02 | 05-01 | Accepted commands produce realistic-looking PowerShell output | SATISFIED | 01.json step-1 successOutput contains full PS 5.1 error format: `Get-ItemProperty : Cannot find path ... CategoryInfo : ObjectNotFound ... FullyQualifiedErrorId : PathNotFound,...`. Steps 2 and 3 have table-format registry output. |
| TERM-03 | 05-01, 05-03 | Plausible near-miss commands receive contextual hint rather than generic failure | SATISFIED | `hintPatterns[]` per step; `handleCommand()` tests near-miss patterns after expectedCommands fail; `showHint()` displays hint text in step panel (not terminal). Test: near-miss hint confirmed in DOM. |
| TERM-04 | 05-01, 05-03 | Terminal UI displays persistent simulator label | SATISFIED | Exact string "PS SIMULATOR — commands do not run on any real system" hardcoded at line 308 in exercise-view.js buildExerciseHtml. Rendered as non-dismissible banner above terminal mount. Test confirms presence in DOM. |

No orphaned requirements — all 4 TERM-* IDs mapped to phase 5 in REQUIREMENTS.md traceability table, all 4 accounted for by plan frontmatter and verified above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/terminal-engine.js` | 117, 159 | `innerHTML` keyword appears in comments only | Info | Both occurrences are in comment text explicitly noting "never innerHTML" — not code; confirmed grep shows no actual innerHTML DOM assignments on output lines |
| `src/views/exercise-view.js` | 27, 39, 44, 86, 194 | `return null` | Info | All are valid control-flow returns (null-guard, error state, re-visit early exit, normal completion) — not stubs. Pattern matches lesson-view.js contract where null = view owns DOM. |

No TBD, FIXME, or XXX markers found in any phase 5 modified files. No placeholder/stub patterns found.

### Human Verification Required

#### 1. Full Interactive Exercise Flow (10 steps)

**Test:** Run `npm run dev`, navigate to `#/exercise/logging-auditing/01` and complete the following sequence:
1. Confirm exercise header renders with "Enable Script Block Logging" title, "Step 1 of 3" panel, and simulator banner "PS SIMULATOR — commands do not run on any real system" visible in red above the terminal
2. Type: `Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging` — confirm step advances to "Step 2 of 3" and PS error output appears in terminal
3. Type `regedit` on step 1 — confirm hint text "In PowerShell, use Get-ItemProperty with the HKLM: provider path rather than regedit or reg.exe." appears in the step panel (not the terminal)
4. Complete steps 2 and 3 with correct commands — confirm completion banner "Exercise complete — well done." appears, terminal input is disabled (grayed out), and sidebar progress bar for Logging & Auditing module updates
5. Navigate to `#/module/logging-auditing` — confirm exercise link shows "Exercise complete — revisit →" in green (#22c55e)
6. Navigate back to `#/exercise/logging-auditing/01` — confirm all 3 steps shown in completed state, terminal disabled, banner shows "Exercise previously completed — {date}"
7. Confirm no JS exceptions appear in browser console during any step

**Expected:** All 7 steps above produce the described behavior
**Why human:** Full multi-step interactive user flow with DOM rendering, localStorage state transitions, sidebar re-render, and visual appearance checks require a browser session — automated tests cover the logic but not the integrated visual/interactive experience

#### 2. Module-View Exercise Link State Toggle

**Test:** Starting from a fresh localStorage state (clear site data), navigate to `#/module/logging-auditing` and observe the "Enabling PowerShell Script Block Logging" lesson row
**Expected:** Exercise link shows "Start Exercise →" in orange (var(--color-accent)) with terminal icon. After completing the exercise (step 7 above), re-navigate to the module page and confirm the link has switched to "Exercise complete — revisit →" in green (#22c55e) with check-circle icon
**Why human:** Color rendering and icon display require visual inspection in a browser; state transition requires the module page to re-render after localStorage write from a different route

### Gaps Summary

No gaps found. All 5 observable truths are VERIFIED, all 8 required artifacts exist and are substantive and wired, all 4 key links are confirmed active, data flows through all wired paths, and the full Vitest suite passes 147/147 tests (0 failures).

The status is `human_needed` solely because the phase involves interactive browser-based terminal behavior (visual rendering, multi-step user flow, localStorage state transitions, sidebar re-render) that cannot be fully verified without a browser session. The automated evidence is comprehensive and consistent.

---

_Verified: 2026-05-15T20:15:00Z_
_Verifier: Claude (gsd-verifier)_
