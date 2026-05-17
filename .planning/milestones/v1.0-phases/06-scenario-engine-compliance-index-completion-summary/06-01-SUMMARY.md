---
phase: 06
plan: 01
subsystem: scenario-engine
tags: [tdd, red-phase, data-files, wave-0]
dependency_graph:
  requires: [05-04-SUMMARY.md]
  provides: [tests/scenario-view.test.js, tests/compliance-index-view.test.js, tests/completion-summary-view.test.js, public/data/modules/logging-auditing/scenarios/01.json, public/data/compliance-index.json]
  affects: [Wave 1 implementation plans 06-02+]
tech_stack:
  added: []
  patterns: [TDD RED stubs with vi.mock hoisting, 2-phase branching scenario JSON schema, compliance index manifest schema]
key_files:
  created:
    - tests/scenario-view.test.js
    - tests/compliance-index-view.test.js
    - tests/completion-summary-view.test.js
    - public/data/compliance-index.json
  modified:
    - public/data/modules/logging-auditing/scenarios/01.json
decisions:
  - "Wave 0 RED pattern: tests import from non-existent source files to fail at Vite import-analysis (consistent with Phase 5 approach)"
  - "compliance-index.json uses _comment key for update contract (JSON has no native comment syntax)"
  - "scenario 01.json narrative expanded with OT callout paragraph per CLAUDE.md Content Rule #1"
metrics:
  duration: 311s
  completed: "2026-05-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 6 Plan 01: RED Test Stubs + Data Files Summary

**One-liner:** Wave 0 TDD RED stubs locking behavioral contracts for scenario-view, compliance-index-view, and completion-summary-view, plus full 2-phase scenario decision tree and compliance index manifest.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED test stubs for 3 view files | 2e31e6d | tests/scenario-view.test.js, tests/compliance-index-view.test.js, tests/completion-summary-view.test.js |
| 2 | Author 01.json and compliance-index.json | 02ae36b | public/data/modules/logging-auditing/scenarios/01.json, public/data/compliance-index.json |

## What Was Built

### Task 1: RED Test Stubs

Three test files created following the exact vi.mock-before-imports hoisting pattern from exercise-view.test.js:

**tests/scenario-view.test.js** (4 stubs):
- Failed fetch renders "Scenario content could not be loaded"
- Successful fetch renders scenario title
- Phase-1 prompt appears on initial render
- Re-visit mode (getScenarioCompletion non-null) renders "previously completed"

**tests/compliance-index-view.test.js** (4 stubs):
- Successful fetch renders "Compliance Control Coverage"
- Renders lesson link `href="#/lesson/logging-auditing/intro"`
- `renderBadge` called with "TSA-Monitoring"
- Failed fetch renders "Compliance index unavailable"

**tests/completion-summary-view.test.js** (5 stubs):
- Renders "Completion Summary" heading
- Contains "training log artifact" text
- `#print-summary-btn` element exists
- Clicking print button calls `window.print()`
- Storage unavailable triggers DOM warning

All 3 files fail at Vite import-analysis (correct RED state — source files do not exist yet).

### Task 2: Data Files

**public/data/modules/logging-auditing/scenarios/01.json** (replaced placeholder):
- 2-phase decision tree: phase-1 (Initial Triage, isFinal:false), phase-2 (Containment Decision, isFinal:true)
- Both phase-1 options have `nextPhaseId: "phase-2"`; phase-2 options have `nextPhaseId: null`
- OT callout in narrative: "In OT environments: pipeline control systems (SCADA, DCS) may share Active Directory..."
- No `status: "placeholder"` field

**public/data/compliance-index.json** (new file):
- schemaVersion: 1, `_comment` update contract field
- TSA-Monitoring control: 4 items (intro lesson, ps-logging lesson, exercise 01, scenario 01)
- NIST-AU-2 control: 2 items (intro lesson, audit-policies lesson)

## Verification Results

```
Test Files  3 failed | 13 passed (16)
Tests       148 passed | 1 todo (149)
```

- 3 new files RED (fail at "Failed to resolve import" — source files absent, correct)
- 13 existing files GREEN — no regressions
- node verify: `2 phase-2 true` (phases.length=2, options[0].nextPhaseId="phase-2", phase[1].isFinal=true)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The data files are complete. Test stubs are intentionally incomplete (RED state is the goal of this plan).

## Threat Flags

None. Both new files are static data authored by developer — no runtime user input surface introduced. Consistent with T-06-W0-01 and T-06-W0-02 in plan threat register (disposition: accept).

## Self-Check: PASSED

- tests/scenario-view.test.js: FOUND
- tests/compliance-index-view.test.js: FOUND
- tests/completion-summary-view.test.js: FOUND
- public/data/modules/logging-auditing/scenarios/01.json: FOUND (modified)
- public/data/compliance-index.json: FOUND
- Commit 2e31e6d: FOUND
- Commit 02ae36b: FOUND
