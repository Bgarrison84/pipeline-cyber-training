---
phase: 08-patch-management-module-mod-05
plan: "04"
subsystem: content
tags: [modules-config, compliance-index, patch-management, MOD-05, wiring]

# Dependency graph
requires:
  - phase: 08-01
    provides: wsus-patching and ot-patching lesson Markdown authored
  - phase: 08-02
    provides: scenarios/01, 02, 03 JSON + exercise/01.json + quiz/01.json authored
  - phase: 08-03
    provides: patch-policy lesson Markdown authored
provides:
  - patch-management module wired into app with 3 lessons and all content-type IDs
  - 3 new MOD-05 compliance control entries (TSA-PatchMgmt, NIST-SI-2, NIST-MA-2) in compliance-index.json
affects:
  - compliance-index-view (reads controls array for compliance page)
  - module-view (reads lessons array for sidebar and content-type link rendering)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual content-type lesson pattern: L2 (ot-patching) has both exerciseId and scenarioId"
    - "Dual content-type lesson pattern: L3 (patch-policy) has both quizId and scenarioId"

key-files:
  created: []
  modified:
    - src/modules-config.js
    - public/data/compliance-index.json

key-decisions:
  - "patch-management lessons array expanded from 2 to 3 entries; patch-policy added as L3 with quizId:'01' and scenarioId:'03'"
  - "ot-patching given both exerciseId:'01' and scenarioId:'02' (new dual content-type pattern per D-03)"
  - "compliance-refs.json left unmodified per D-09; new control IDs only in compliance-index.json"

patterns-established:
  - "Dual content-type lesson: a lesson config object may carry both exerciseId/quizId AND scenarioId simultaneously — module-view.js already renders all present content-type links without engine changes"

requirements-completed:
  - MOD-05

# Metrics
duration: 8min
completed: 2026-05-17
---

# Phase 8 Plan 04: Patch Management Module Wiring Summary

**patch-management module wired with 3 lessons (wsus-patching/ot-patching/patch-policy) and all content-type IDs; 3 new compliance controls (TSA-PatchMgmt, NIST-SI-2, NIST-MA-2) appended to compliance-index.json**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-17T16:46:00Z
- **Completed:** 2026-05-17T16:53:49Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Updated modules-config.js patch-management entry from a 2-lesson stub to the full 3-lesson array with all content-type IDs (scenarioId, exerciseId, quizId) correctly assigned per D-01/D-03
- Appended 3 new compliance control entries to compliance-index.json: TSA-PatchMgmt (7 items), NIST-SI-2 (4 items), NIST-MA-2 (3 items) — covering all MOD-05 content
- All 167 existing tests remain green with exit 0 after both config changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Update modules-config.js patch-management entry** - `c24f5c1` (feat)
2. **Task 2: Append 3 new MOD-05 compliance control entries** - `0966fe5` (feat)
3. **Task 3: Run test suite — 167 tests green** - no code change, no commit needed

## Files Created/Modified

- `src/modules-config.js` - patch-management lessons array updated from 2 to 3 entries; all content-type IDs wired (scenarioId on all 3 lessons, exerciseId on L2, quizId on L3)
- `public/data/compliance-index.json` - 3 new control entries appended after NIST-AU-12; total controls: 11 existing + 3 new = 14

## Decisions Made

- Dual content-type lesson pattern (exerciseId + scenarioId on same lesson object) confirmed working without engine changes — module-view.js renders all content-type links it finds in the lesson config object
- compliance-refs.json untouched per D-09; new specific control IDs (TSA-PatchMgmt, NIST-SI-2, NIST-MA-2) live only in compliance-index.json controls array

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The `ECONNREFUSED` message in npm test output is pre-existing (unrelated network check) and does not affect the test run — all 167 tests pass.

## Known Stubs

None — this plan wires real content authored in Plans 01-03 into the application. No placeholder or empty values remain in the modified config files.

## Threat Flags

No new security-relevant surface introduced beyond what the threat model already covers. Both modified files feed existing tested code paths (module-view.js sidebar rendering, compliance-index-view.js link construction via safePath()).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 8 Plans 01-04 are all complete:
- 3 lesson Markdown files authored (Plans 01, 03)
- 3 scenario JSON files, 1 exercise JSON, 1 quiz JSON authored (Plan 02)
- modules-config.js and compliance-index.json fully wired (this plan)
- All 167 tests green

The Patch Management module (MOD-05) is fully functional. Navigating to `#/module/patch-management` renders all 3 lessons in the sidebar; each lesson shows its correct content-type buttons (Scenario on L1, Exercise+Scenario on L2, Quiz+Scenario on L3). The compliance index page lists TSA-PatchMgmt, NIST-SI-2, and NIST-MA-2 with correct item links.

---
*Phase: 08-patch-management-module-mod-05*
*Completed: 2026-05-17*
