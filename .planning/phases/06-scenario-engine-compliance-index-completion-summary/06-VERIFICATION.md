---
phase: 06-scenario-engine-compliance-index-completion-summary
verified: 2026-05-16T15:42:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Scenario engine — end-to-end decision flow in browser"
    expected: "Navigate #/module/logging-auditing, click 'Start Scenario →', work through both phases, see completion banner, re-visit shows locked state"
    why_human: "Interactive multi-step DOM state machine with scrollIntoView, click events, visual state transitions cannot be verified without a running browser"
  - test: "Compliance index links navigate correctly"
    expected: "Navigate #/compliance-index, verify TSA-Monitoring and NIST-AU-2 control sections render, click a lesson link and arrive at the correct lesson page"
    why_human: "Navigation behavior and correct link resolution across routes requires a running browser"
  - test: "Completion summary print layout"
    expected: "Navigate #/completion-summary, type a name, verify it appears via textContent (not innerHTML), click 'Print Training Log', browser print dialog opens with sidebar/nav/print-button hidden in preview"
    why_human: "Print preview behavior (@media print CSS hiding sidebar/nav/.print-hide) cannot be verified without a real browser rendering engine"
  - test: "CR-04 renderBadge display text in compliance index"
    expected: "Badge text for TSA-Monitoring and NIST-AU-2 controls shows the correct shortName from compliance-refs.json (not the raw ID string 'TSA-Monitoring')"
    why_human: "badge.js renderBadge(directiveKey) ignores the second argument passed from compliance-index-view.js — whether _complianceRefs is set and resolves correctly at runtime needs browser verification. The review (CR-04) flagged this as a display logic bug."
gaps:
  - truth: "CR-03: compliance-index-view.js crashes when control.items is missing or not an array"
    status: failed
    reason: "buildControlSectionHtml calls control.items.map() with no null guard (line 89). A compliance-index.json with a missing or null items field would throw TypeError and leave #app in loading skeleton state. The fix is (control.items ?? []).map(). Flagged as Critical in 06-REVIEW.md but not yet fixed in a 06-REVIEW-FIX.md."
    artifacts:
      - path: "src/views/compliance-index-view.js"
        issue: "Line 89: `control.items.map(item => {` — no null/undefined guard"
    missing:
      - "Change `control.items.map(` to `(control.items ?? []).map(` at line 89"
---

# Phase 6: Scenario Engine + Compliance Index + Completion Summary — Verification Report

**Phase Goal:** Learners can work through decision-based compliance scenarios, look up which content covers a given control ID, and generate a printable training artifact
**Verified:** 2026-05-16T15:42:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | A scenario exercise presents a realistic compliance incident with at least two decision branches; choosing a path shows the consequence and explanation for that decision before advancing | VERIFIED | `src/views/scenario-view.js` implements full decision-tree state machine. `01.json` has 2 phases (phase-1 non-final, phase-2 isFinal:true). Option click reveals outcome block, locks all buttons, injects Continue button. Tests 5/5 GREEN. |
| SC-2 | Completing all branches of a scenario records completion and outcome data to the Progress Store | VERIFIED | `completeScenario()` closure calls `progressStore.saveScenario(moduleId, scenarioId)` at line 221, which stores `{completed:true, completedAt:ISO}`. Dynamic sidebar import follows at line 222. |
| SC-3 | The compliance index page lists every TSA SD-02F and NIST SP 800-82 Rev 3 control ID covered by the platform, with links to every lesson and exercise tagged to each control | VERIFIED | `compliance-index-view.js` fetches `compliance-index.json` with 2 controls (TSA-Monitoring: 4 items, NIST-AU-2: 2 items), builds href links using safePath(moduleId)+safePath(contentId). Route `#/compliance-index` wired in router.js. Tests 4/4 GREEN. Note: CR-03 (items guard) and CR-04 (badge text) are warnings/gaps — feature functions with real data. |
| SC-4 | A learner who has completed at least one module can open a printable completion summary that displays their name (self-entered), module name, date, quiz scores, and control IDs covered; the UI explicitly labels it a "training log artifact" not a compliance certification | VERIFIED | `completion-summary-view.js` renders: "TRAINING LOG ARTIFACT" label, h1 "Completion Summary", statutory disclaimer ("This is a training log artifact. It does not constitute a compliance certification or satisfy any regulatory filing requirement."), C-16 name input (textContent update, never innerHTML), C-17 progress table with computeModuleProgress + quiz scores + dates, C-19 print button (#print-summary-btn) calling window.print(). `@media print` block in style.css hides #sidebar/#nav/.print-hide. Tests 5/5 GREEN. |

**Score:** 4/4 truths verified

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ASSESS-02 | 06-01, 06-02, 06-03 | Scenario exercises with branching decision points and outcome explanations | SATISFIED | `scenario-view.js` exported, wired in router, `01.json` has full 2-phase scenario with OT callout |
| SHELL-04 | 06-01, 06-03 | Compliance index page mapping control IDs to lessons/exercises | SATISFIED | `compliance-index-view.js` exported, `#/compliance-index` route in router.js, `compliance-index.json` has 2 controls |
| ASSESS-04 | 06-04 | Printable completion summary labeled as training log artifact | SATISFIED | `completion-summary-view.js` exported, `#/completion-summary` route wired, statutory disclaimer present, print button present |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/views/scenario-view.js` | async renderScenario, decision-tree flow, completion saving | VERIFIED | 414 lines, full implementation. Exports `renderScenario`. safePath, validateScenario, runScenarioFlow, completeScenario all present. |
| `src/views/compliance-index-view.js` | async renderComplianceIndex, fetches manifest, renders control groups | VERIFIED | 169 lines, full implementation. Exports `renderComplianceIndex`. safePath, loading/error states, buildControlSectionHtml present. |
| `src/views/completion-summary-view.js` | sync renderCompletionSummary, progressStore reads, print layout | VERIFIED | 279 lines, full implementation. Exports `renderCompletionSummary`. computeModuleProgress, buildProgressTableHtml, window.print() wired. |
| `src/router.js` | 3 new routes: scenario, compliance-index, completion-summary | VERIFIED | Lines 19-21 confirm all 3 routes. Lines 53-55 confirm viewRenderers entries. Lines 7-9 confirm 3 static imports. |
| `src/modules-config.js` | intro lesson with `scenarioId: '01'` | VERIFIED | Line 16: `{ id: 'intro', title: 'Introduction to Windows Event Logs', scenarioId: '01' }` |
| `src/views/module-view.js` | Scenario link buttons rendered for lessons with scenarioId | VERIFIED | Lines 61-68 confirm IIFE-scoped scenarioId block calling `progressStore.getScenarioCompletion`. Renders "Start Scenario →" / "Scenario complete — revisit →". |
| `src/quiz-engine.js` | scenarioId else-if branch in computeModuleProgress | VERIFIED | Lines 288-291 confirm: `} else if (lesson.scenarioId) { const sc = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId); if (sc !== null) numerator++; }` |
| `public/data/modules/logging-auditing/scenarios/01.json` | Full 2-phase scenario (replaces placeholder) | VERIFIED | Node command confirms: `2 phase-2 true`. OT callout in narrative confirmed. No `status: placeholder` field. |
| `public/data/compliance-index.json` | 2 control entries with items | VERIFIED | Node command confirms: controls: 2, items[0]: 4. Schema: schemaVersion:1, `_comment` update contract field. |
| `src/style.css` | @media print block hiding sidebar/nav/.print-hide | VERIFIED | Lines 294-301 confirm `@media print { #sidebar, #nav, .print-hide { display: none !important; } ... }` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/views/scenario-view.js` | `progressStore.saveScenario` | `completeScenario()` at line 221 | WIRED | `progressStore.saveScenario(moduleId, scenarioId)` confirmed at line 221 |
| `src/views/scenario-view.js` | `sidebar.js` | dynamic import at line 222 | WIRED | `import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — no static import confirmed |
| `src/router.js` | `compliance-index-view.js` | import line 8 + viewRenderers line 54 | WIRED | `import { renderComplianceIndex } from './views/compliance-index-view.js'` present; viewRenderers entry present |
| `src/views/module-view.js` | `progressStore.getScenarioCompletion` | IIFE in lessonRows map line 62 | WIRED | `progressStore.getScenarioCompletion(mod.id, lesson.scenarioId) !== null` confirmed at line 62 |
| `src/quiz-engine.js computeModuleProgress` | `progressStore.getScenarioCompletion` | else-if branch line 290 | WIRED | `const sc = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId)` confirmed at line 290 |
| `src/style.css @media print` | `.lesson-wrapper / .lesson-column / #sidebar / #nav / .print-hide` | `@media print` block lines 295-301 | WIRED | All selectors present in the block |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `scenario-view.js` | `scenario` | `fetch(url)` where url is built from `import.meta.env.BASE_URL + 'data/modules/' + safePath(moduleId) + '/scenarios/' + safePath(scenarioId) + '.json'` | Yes — fetches real JSON from `01.json` which has 2 full phases | FLOWING |
| `compliance-index-view.js` | `data` | `fetch(import.meta.env.BASE_URL + 'data/compliance-index.json')` | Yes — fetches real JSON with 2 controls, 6 total items | FLOWING |
| `completion-summary-view.js` | progress data | `computeModuleProgress(mod)`, `progressStore.getQuizScore`, `progressStore.getExerciseCompletion`, `progressStore.getScenarioCompletion` per module | Yes — reads from real progressStore (localStorage-backed) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 16 test files pass | `npm test -- --reporter=dot` | `Test Files 16 passed (16), Tests 167 passed 1 todo (168)` | PASS |
| 01.json structure valid | `node -e "const d=JSON.parse(require('fs').readFileSync('public/data/modules/logging-auditing/scenarios/01.json','utf8')); console.log(d.phases.length, d.phases[0].options[0].nextPhaseId, d.phases[1].isFinal)"` | `2 phase-2 true` | PASS |
| compliance-index.json structure valid | `node -e "const d=JSON.parse(...); console.log('controls:', d.controls.length, 'items[0]:', d.controls[0].items.length)"` | `controls: 2 items[0]: 4` | PASS |
| Statutory disclaimer text present | `grep "training log artifact"` | Found at line 210 with exact required text | PASS |
| Print button id exists | `grep "print-summary-btn"` | Found at line 237 of completion-summary-view.js | PASS |
| No static sidebar import in scenario-view.js | `grep -c "^import.*sidebar" src/views/scenario-view.js` | `0` | PASS |
| esc() applied to scenario fields | `grep "esc(" src/views/scenario-view.js` | Confirmed on: title, narrative, phase.title, phase.prompt, option.text, option.id, phase.id, completedDate, moduleId, nextPhaseId, option.outcome | PASS |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/views/compliance-index-view.js` | 89 | `control.items.map(item => {` — no null guard | BLOCKER | Crashes compliance index view with TypeError if any control in compliance-index.json has a missing or null `items` field. Production JSON is valid, so no current user impact, but this is a defensive coding failure flagged as Critical in 06-REVIEW.md. |
| `src/router.js` | 10 | `import { setActiveModule, setActiveLesson } from './sidebar.js'` — static import (CLAUDE.md constraint) | WARNING | Pre-existing from Phase 3. CLAUDE.md and phase brief require dynamic import only. Not a phase 6 regression — flagged in 06-REVIEW.md (CR-01) but not yet remediated. |
| `src/router.js` | 74 | `window.location.hash = '#/lesson/' + last.moduleId + '/' + last.lessonId` — unvalidated localStorage data | WARNING | Pre-existing security concern flagged as CR-02 in 06-REVIEW.md. safePath not applied before hash construction. |
| `src/views/compliance-index-view.js` | 104 | `renderBadge(control.id, control.label)` — second argument silently dropped by badge.js | WARNING | badge.js only accepts one argument. Label override has no effect. Badge text falls back to raw ID string or shortName from complianceRefs. Display quality issue, not a crash. Flagged as CR-04 in 06-REVIEW.md. |
| `src/quiz-engine.js`, `src/views/scenario-view.js` | 246, 222 | `import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — no `.catch()` handler | INFO | Unhandled promise rejection if dynamic import fails. Sidebar progress would not update after completion. Flagged as WR-04 in 06-REVIEW.md. |

**Note:** The 06-REVIEW.md code review (4 critical, 5 warning, 3 info findings) was completed on 2026-05-16 but no 06-REVIEW-FIX.md exists yet. The critical items CR-01 and CR-02 are pre-existing before phase 6. CR-03 and CR-04 are phase 6 introductions.

### Human Verification Required

#### 1. Scenario Engine — End-to-End Decision Flow

**Test:** Run `npm run dev`, navigate to `#/module/logging-auditing`. Click "Start Scenario →" under "Introduction to Windows Event Logs".
**Expected:**
- URL changes to `#/scenario/logging-auditing/01`
- "SCENARIO" category label visible, title "Investigating a Suspicious Login on PIPELINE-DC01" visible
- Phase 1 "Initial Triage" card has orange left-border, help-circle icon, prompt text visible
- Click a wrong option: buttons lock (no pointer interaction), wrong pick gets red border + x-circle, correct option gets green border + check-circle, outcome text appears, "Continue →" button appears
- Click "Continue →": Phase 2 "Containment Decision" card injected and scrolled into view
- Complete Phase 2: completion banner appears ("Scenario complete — well done."), compliance badges visible
- Navigate to `#/module/logging-auditing`: lesson row shows "Scenario complete — revisit →" in green
- Navigate to `#/scenario/logging-auditing/01` again: re-visit mode — all phases locked (green border, opacity 0.8), completion banner shows date
**Why human:** Interactive multi-step DOM state machine with event delegation, scrollIntoView, visual state transitions require a running browser.

#### 2. Compliance Index — Links Navigate Correctly

**Test:** Navigate to `#/compliance-index`.
**Expected:**
- "COMPLIANCE INDEX" category label, "Compliance Control Coverage" h1, description text
- Two control sections: TSA SD-02F — Continuous Monitoring and NIST SP 800-82 Rev 3 — AU-2: Event Logging
- Each item shows type label ("lesson", "exercise", "scenario"), icon (book-open/terminal/git-branch), and link text
- Click the "Introduction to Windows Event Logs" lesson link: navigates to correct lesson
**Why human:** Route navigation correctness and correct badge text display (including CR-04 badge resolution from compliance-refs) requires a running browser.

#### 3. Completion Summary — Print Layout

**Test:** After completing at least one activity (quiz/exercise/scenario), navigate to `#/completion-summary`.
**Expected:**
- "TRAINING LOG ARTIFACT" monospace label, h1 "Completion Summary"
- Statutory disclaimer box with orange left border: "This is a training log artifact. It does not constitute a compliance certification or satisfy any regulatory filing requirement."
- Name input (id="learner-name-input"): type a name, verify it appears in DOM via textContent (not innerHTML)
- Progress table shows correct module rows with lesson counts, quiz scores, dates
- "Print Training Log" button present
- Click print button: browser print dialog opens. In print preview: sidebar hidden, nav hidden, print button hidden, content is full-width, background white, text black
**Why human:** @media print CSS rendering, textContent vs. innerHTML distinction, and progress data display from localStorage require a running browser.

#### 4. CR-04 Badge Text Verification

**Test:** Navigate to `#/compliance-index` in the running browser with network inspector open. Observe the badge text for "TSA-Monitoring" and "NIST-AU-2" controls.
**Expected:** Badge text should show the resolved shortName from compliance-refs.json (e.g., "TSA" or "NIST"), not the raw key string "TSA-Monitoring".
**Why human:** `renderBadge(control.id, control.label)` passes two args but badge.js accepts only one. Whether `_complianceRefs` is populated before rendering and the final displayed text requires browser observation.

### Gaps Summary

**1 gap blocking ideal quality (CR-03 — null guard missing):**

`src/views/compliance-index-view.js` line 89 calls `control.items.map(...)` without guarding against null/undefined. The current `compliance-index.json` is well-formed so no runtime crash occurs today. However, this is a defensive coding gap that would cause a silent failure if the JSON is ever edited with a missing items array.

Fix: `(control.items ?? []).map(item => {`

**Pre-existing issues documented in 06-REVIEW.md not yet remediated:**

- CR-01: Static sidebar import in router.js (pre-dates phase 6)
- CR-02: Unvalidated localStorage data in hash construction (pre-dates phase 6)
- CR-04: renderBadge second argument silently dropped (introduced in phase 6)

These are not in scope for phase 6 goal achievement but should be addressed in a REVIEW-FIX plan before phase 7.

---

## Final Assessment

The phase goal is **observably achieved** in the codebase:

1. **Decision-based scenarios:** `scenario-view.js` is fully implemented with a working decision-tree state machine, option locking, outcome reveal, Continue button, completion saving, and re-visit mode.
2. **Progress Store recording:** `saveScenario` is called on isFinal phase completion; `computeModuleProgress` counts scenario completions.
3. **Compliance index:** `compliance-index-view.js` fetches and renders the manifest with links to all tagged content.
4. **Printable training artifact:** `completion-summary-view.js` renders the statutory disclaimer, progress table, learner name input (textContent), and print button wired to `window.print()` with @media print CSS.

All 16 test files pass (167 tests). The 4 ROADMAP success criteria are all verified by code inspection and automated tests.

Status is `human_needed` (not `passed`) because:
- Human verification of the scenario decision flow, compliance index navigation, and print layout in a real browser is pending — the 06-04-PLAN.md explicitly includes a `checkpoint:human-verify` task
- CR-04 badge display text in the compliance index requires browser observation to confirm the display is correct
- CR-03 (items null guard) is a code quality gap that should be fixed before marking the phase fully clean

---

_Verified: 2026-05-16T15:42:00Z_
_Verifier: Claude (gsd-verifier)_
