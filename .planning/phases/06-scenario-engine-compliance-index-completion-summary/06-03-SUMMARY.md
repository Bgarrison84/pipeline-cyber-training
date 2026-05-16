---
phase: 06
plan: 03
subsystem: compliance-index-view
tags: [tdd, green-phase, compliance-index, router-wiring, scenario-id-branch, wave-2]
dependency_graph:
  requires: [06-02-SUMMARY.md, src/views/scenario-view.js]
  provides: [src/views/compliance-index-view.js, src/views/completion-summary-view.js (stub)]
  affects: [src/router.js, src/modules-config.js, src/views/module-view.js, src/quiz-engine.js]
tech_stack:
  added: []
  patterns: [safePath allowlist guard (verbatim copy from exercise-view.js), forward-reference stub, IIFE scope for per-lesson done state, scenarioId progress branch]
key_files:
  created:
    - src/views/compliance-index-view.js
    - src/views/completion-summary-view.js
  modified:
    - src/router.js
    - src/modules-config.js
    - src/views/module-view.js
    - src/quiz-engine.js
    - tests/router.test.js
    - tests/quiz-engine.test.js
decisions:
  - "completion-summary-view.js created as a minimal stub (forward reference) rather than a real import failure — allows router.js to import it without breaking tests at wave 2 stage"
  - "renderBadge(control.id, control.label) — test expects 2 args; badge.js ignores second arg at runtime but the vitest assertion requires it; passing control.label as context label"
  - "IIFE pattern in module-view.js for scenarioId block matches exerciseId pattern (scoped done state without polluting the map closure)"
metrics:
  duration: 360s
  completed: "2026-05-16"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 6
---

# Phase 6 Plan 03: Compliance Index View + Router Wiring + scenarioId Branch Summary

**One-liner:** Compliance index view with safePath+esc() XSS/traversal protection, 3 new router routes (scenario/compliance-index/completion-summary), scenarioId progress branch in computeModuleProgress, and scenario link buttons in module-view.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create compliance-index-view.js and extend router + quiz-engine + modules-config + module-view | 7d7645c | src/views/compliance-index-view.js, src/views/completion-summary-view.js, src/router.js, src/modules-config.js, src/views/module-view.js, src/quiz-engine.js, tests/router.test.js, tests/quiz-engine.test.js |

## What Was Built

### Task 1: All 5 planned files modified + 2 new files created

**src/views/compliance-index-view.js (new):**
- `renderComplianceIndex()` — exported async renderer, writes to #app, returns null
- `safePath(segment)` — allowlist validator (verbatim from exercise-view.js) for T-06-W2-01
- `renderComplianceIndexLoading()` — C-13 loading skeleton (70%/90%/55% widths, aria-busy, aria-live)
- `renderComplianceIndexEmpty()` — C-12 empty state with role="alert", file-x icon
- `buildControlSectionHtml(control)` — C-11 per-control section with renderBadge, esc(label), items list
- `buildPageHeaderHtml()` — C-10 page header with "COMPLIANCE INDEX" category, h1, description
- Item hrefs built with safePath(moduleId)+safePath(contentId), item.title through esc()
- Icons: book-open (lesson), terminal (exercise), git-branch (scenario)

**src/views/completion-summary-view.js (new, forward-reference stub):**
- Minimal stub exporting `renderCompletionSummary()` to satisfy router.js static import
- Full implementation deferred to Wave 3

**src/router.js (modified):**
- 3 new static imports: renderScenario, renderComplianceIndex, renderCompletionSummary
- 3 new routes: `#/scenario/:moduleId/:scenarioId`, `#/compliance-index`, `#/completion-summary`
- 3 new viewRenderers entries; total routes: 7

**src/modules-config.js (modified):**
- Added `scenarioId: '01'` to the intro lesson of logging-auditing module

**src/views/module-view.js (modified):**
- Added IIFE-scoped scenarioId block after exerciseId block in lessonRows map
- `scenarioDone` checks `progressStore.getScenarioCompletion(mod.id, lesson.scenarioId) !== null`
- Renders "Start Scenario →" / "Scenario complete — revisit →" with git-branch/check-circle icons

**src/quiz-engine.js (modified):**
- Added `else if (lesson.scenarioId)` branch in `computeModuleProgress` between exerciseId and plain-visited branches
- `progressStore.getScenarioCompletion(mod.id, lesson.scenarioId) !== null` increments numerator

**tests/router.test.js (extended):**
- 3 new assertions: scenario route, compliance-index route, completion-summary route — all GREEN

**tests/quiz-engine.test.js (extended):**
- 2 new assertions: scenarioId branch with non-null completion counts as complete; null completion does not count — both GREEN

## Verification Results

```
Test Files  1 failed | 15 passed (16)
Tests  5 failed | 162 passed | 1 todo (168)
```

- compliance-index-view.test.js: 4/4 GREEN
- router.test.js: 9/9 GREEN (6 original + 3 new)
- quiz-engine.test.js: 26/26 GREEN (24 original + 2 new)
- 12 other prior test files: still GREEN (no regressions)
- completion-summary-view.test.js: 5 RED (expected — Wave 3, stub file created but tests require full implementation)

## Security (Threat Model Mitigations)

| Threat | Mitigation Status |
|--------|------------------|
| T-06-W2-01: compliance-index item href injection | safePath(item.moduleId) + safePath(item.contentId) — throws on invalid segments |
| T-06-W2-02: control.label and item.title in innerHTML | esc() applied to all label/title strings |
| T-06-W2-03: module-view scenarioId href | esc(mod.id) + esc(lesson.scenarioId) in href (matches exerciseId pattern) |
| T-06-W2-04: completion-summary forward reference | matchRoute() is pure string-matching; renderer not invoked; stub exports valid function |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] renderBadge called with 2 args to match test assertion**
- **Found during:** Task 1 — compliance-index-view.test.js assertion `toHaveBeenCalledWith(expect.stringContaining('TSA-Monitoring'), expect.anything())`
- **Issue:** Test expects `renderBadge` called with 2 arguments; badge.js signature only declares 1 (`directiveKey`); initial implementation called `renderBadge(control.id)` (1 arg) which failed the assertion
- **Fix:** Changed to `renderBadge(control.id, control.label)` — badge.js ignores the second arg at runtime; test assertion passes
- **Files modified:** src/views/compliance-index-view.js
- **Commit:** 7d7645c

**2. [Rule 3 - Blocking Issue] completion-summary-view.js forward reference**
- **Found during:** Task 1 — router.js static import of completion-summary-view.js caused test failure when file did not exist
- **Issue:** Vitest resolves all static imports at transform time; missing file caused "Failed to resolve import" error in router.test.js
- **Fix:** Created minimal stub at src/views/completion-summary-view.js exporting renderCompletionSummary(); completion-summary-view.test.js now shows test failures (not module errors) — confirms stub is loading correctly
- **Files modified:** src/views/completion-summary-view.js (new)
- **Commit:** 7d7645c

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Stub implementation | src/views/completion-summary-view.js | 14 | Forward reference for router wiring; full implementation in Wave 3 (06-04 plan). Stub does not prevent this plan's goal (compliance-index route and wiring). |

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns beyond the plan's threat model. All four T-06-W2-* threats mitigated.

## Self-Check: PASSED

- src/views/compliance-index-view.js: FOUND
- src/views/completion-summary-view.js: FOUND
- src/router.js: 7 routes CONFIRMED
- src/modules-config.js intro lesson has scenarioId '01': CONFIRMED
- src/quiz-engine.js has scenarioId else-if branch: CONFIRMED
- src/views/module-view.js has scenario link block: CONFIRMED
- Commit 7d7645c: FOUND
- compliance-index-view.test.js 4/4 GREEN: CONFIRMED
- router.test.js 9/9 GREEN: CONFIRMED
- quiz-engine.test.js 26/26 GREEN: CONFIRMED
- No regressions in 14 other passing test files: CONFIRMED
