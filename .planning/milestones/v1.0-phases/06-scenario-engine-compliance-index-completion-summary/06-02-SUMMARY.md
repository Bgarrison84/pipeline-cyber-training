---
phase: 06
plan: 02
subsystem: scenario-engine
tags: [tdd, green-phase, scenario-view, wave-1]
dependency_graph:
  requires: [06-01-SUMMARY.md]
  provides: [src/views/scenario-view.js]
  affects: [src/router.js (wave 2+), src/views/module-view.js (wave 2+)]
tech_stack:
  added: []
  patterns: [decision-tree state machine, event delegation on app container, dynamic sidebar import, safePath allowlist guard, validateScenario reference-integrity check]
key_files:
  created:
    - src/views/scenario-view.js
  modified: []
decisions:
  - "Event delegation on app container (single listener) rather than per-button listeners — matches exercise-view.js pattern and avoids stale references when new phase cards are injected"
  - "validateScenario runs immediately after fetch resolves — broken nextPhaseId references show error state rather than silently ignoring bad data"
  - "completeScenario scoped as closure inside runScenarioFlow to capture moduleId/scenarioId without passing through event delegation chain"
metrics:
  duration: 420s
  completed: "2026-05-16"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 6 Plan 02: Scenario View Implementation Summary

**One-liner:** Decision-tree scenario renderer with phase-by-phase option selection, outcome reveal, Continue button advancement, and completion saving using saveScenario + dynamic sidebar import.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement src/views/scenario-view.js | 015bbee | src/views/scenario-view.js |

## What Was Built

### Task 1: src/views/scenario-view.js

New file implementing the async scenario renderer. Mirrors exercise-view.js exactly, replacing terminal interaction with phase-by-phase option selection.

**Architecture:**

- `renderScenario({ moduleId, scenarioId })` — exported async renderer, writes to #app, returns null
- `safePath(segment)` — allowlist validator `/^[a-zA-Z0-9_-]+$/` on both URL segments
- `validateScenario(scenario)` — checks all `option.nextPhaseId` values resolve to real phase IDs
- `buildScenarioHtml(scenario, moduleId, priorCompletion)` — pure HTML builder for full layout
- `buildPhaseNodeHtml(phase, state, priorPickedOptionId)` — C-03 card renderer for 'active'|'locked'|'revisit-locked' states
- `runScenarioFlow(app, scenario, moduleId, scenarioId)` — interactive state machine wired only in fresh mode
- `renderScenarioLoading()` — C-08 loading skeleton (80%/65%/45% widths)
- `renderScenarioError(moduleId)` — C-07 error state

**Flow (fresh mode):**
1. Sync loading skeleton → fetch JSON → validateScenario → getScenarioCompletion check
2. Build HTML: header card (C-02) + first phase active, remaining phases NOT yet injected
3. Wire event delegation on app container
4. Option click: lock all buttons (pointer-events:none), apply C-04 visual states (correct: #22c55e border/bg; user's wrong: destructive border; other wrong: 0.5 opacity), inject outcome block + Continue button
5. Continue click (non-final): inject next phase card, scrollIntoView, activateIcons
6. Continue click (isFinal): progressStore.saveScenario + dynamic sidebar import + C-05 banner appendChild

**Flow (re-visit mode):**
- All phases rendered as locked (revisit-locked state), completion banner injected inline
- No event handlers wired (priorCompletion early return)

**Security (threat model mitigations):**

| Threat | Mitigation |
|--------|-----------|
| T-06-W1-01: URL segment injection | safePath allowlist throws on invalid moduleId/scenarioId before fetch |
| T-06-W1-02: JSON fields in innerHTML | esc() applied to title, narrative, phase.title, phase.prompt, option.text, option.outcome, phase.id, option.id |
| T-06-W1-03: Circular dep with sidebar | Dynamic import('../sidebar.js') — no static import |
| T-06-W1-04: Broken nextPhaseId | validateScenario() returns false → error state |

## Verification Results

```
Test Files  2 failed | 14 passed (16)
Tests       153 passed | 1 todo (154)
```

- scenario-view.test.js: 5/5 GREEN (all stubs pass)
- 13 prior test files: still GREEN (no regressions)
- 2 files still RED: compliance-index-view.test.js, completion-summary-view.test.js (expected — source files absent)
- Static sidebar import count: 0 (confirmed via grep)
- esc() applied to all JSON string fields (confirmed via grep)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. scenario-view.js is fully implemented. The 2 remaining RED test files (compliance-index-view, completion-summary-view) are expected — they are implemented in wave 2+ plans.

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns introduced beyond what was specified in the plan's threat model. All four T-06-W1-* threats mitigated per plan.

## Self-Check: PASSED

- src/views/scenario-view.js: FOUND
- Commit 015bbee: FOUND
- Static sidebar import count = 0: CONFIRMED
- esc() applied to all JSON fields: CONFIRMED (title, narrative, phase.title, phase.prompt, option.text, option.outcome, option.id, phase.id, moduleId)
- scenario-view.test.js 5/5 GREEN: CONFIRMED
- No regressions in 13 prior test files: CONFIRMED
