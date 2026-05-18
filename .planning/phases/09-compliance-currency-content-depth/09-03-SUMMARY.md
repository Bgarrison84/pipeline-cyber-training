---
phase: 09-compliance-currency-content-depth
plan: 03
subsystem: content-compliance-audit
tags: [wave-2, hardcode-audit, compliance-strings, sme-01]
dependency_graph:
  requires: [09-02-expired-badge]
  provides: [zero-hardcoded-sd02f-display-strings]
  affects:
    - public/data/modules/logging-auditing/quizzes/01.json
    - public/data/modules/logging-auditing/scenarios/01.json
    - src/views/compliance-index-view.js
    - CLAUDE.md
tech_stack:
  added: []
  patterns: [generic-directive-phrasing]
key_files:
  created: []
  modified:
    - public/data/modules/logging-auditing/quizzes/01.json
    - public/data/modules/logging-auditing/scenarios/01.json
    - src/views/compliance-index-view.js
    - CLAUDE.md
decisions:
  - "complianceControls ID 'TSA-SD-02F' preserved — structural JSON key used by quiz engine and test suite; only display strings replaced"
  - "CLAUDE.md Open Decisions section replaced with Resolved Decisions reflecting v1.0 outcomes"
metrics:
  duration: "8 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 03: Hardcode Audit — TSA SD-02F Display Strings Summary

## Objective Achieved

Wave 2 hardcode audit complete. All TSA SD-02F display strings in content files have been replaced with generic directive phrasing. compliance-refs.json is now the sole source of truth for the TSA version string. CLAUDE.md updated with correct marked.js version. All 177 tests GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remediate SD-02F in quiz and scenario JSON | 2d765c0 | quizzes/01.json, scenarios/01.json |
| 2 | Remediate SD-02F in compliance-index-view.js and update CLAUDE.md | 2d765c0 | compliance-index-view.js, CLAUDE.md |

## Strings Replaced

| File | Location | Before | After |
|------|----------|--------|-------|
| quizzes/01.json | q-03 stem | "Under TSA SD-02F, ..." | "Under the current TSA pipeline security directive, ..." |
| quizzes/01.json | q-03 answer a feedback | "TSA SD-02F requires a longer retention period..." | "The current TSA pipeline security directive requires a longer retention period..." |
| quizzes/01.json | q-03 answer b feedback | "...does not meet the TSA SD-02F requirement..." | "...does not meet the current TSA pipeline security directive requirement..." |
| quizzes/01.json | q-03 answer c feedback | "Correct. TSA SD-02F requires pipeline operators..." | "Correct. The current TSA pipeline security directive requires pipeline operators..." |
| quizzes/01.json | q-03 explanation | "TSA SD-02F mandates a 12-month minimum..." | "The current TSA pipeline security directive mandates a 12-month minimum..." |
| scenarios/01.json | phase-2 opt-a outcome | "TSA SD-02F requires prompt incident response..." | "The current TSA pipeline security directive requires prompt incident response..." |
| scenarios/01.json | phase-2 opt-b outcome | "...violates TSA SD-02F incident notification requirements..." | "...violates current TSA pipeline security directive incident notification requirements..." |
| compliance-index-view.js | line 123 | "Every TSA SD-02F and NIST SP 800-82 Rev 3 control..." | "Every TSA pipeline security directive and NIST SP 800-82 Rev 3 control..." |
| CLAUDE.md | Stack section | "marked.js v17" | "marked.js v18 (installed: v18.0.3)" |
| CLAUDE.md | Open Decisions section | 3-item open decisions list | Resolved Decisions section with v1.0 outcomes |

## Test Results

**Final npm test result:**
- 177 passed | 1 todo (178 total)
- 17 test files passed
- npm test exits 0

## Key Decisions

**1. complianceControls ID preserved**
The `"TSA-SD-02F"` value in the `complianceControls` array of q-03 is a structural JSON key used by quiz-engine.js for compliance mapping, and is hardcoded in `tests/quiz-engine.test.js` line 424. The plan explicitly states "Do NOT modify ... complianceControls". This ID is not a display string — it is a reference key. It remains unchanged. The final verification grep targeting `public/data/modules/` returns this one match; it is intentional and acceptable per plan constraints.

**2. CLAUDE.md Open Decisions replaced**
The three open decisions from Phase 5 planning (jQuery Terminal choice, parser approach, multi-line pipelines) were all resolved in v1.0. Replaced with a concise "Resolved Decisions (v1.0)" section to keep CLAUDE.md accurate for future contributors.

## Verification Results

- `grep SD-02F src/views/` — zero matches (CLEAN)
- `grep SD-02F public/data/modules/logging-auditing/quizzes/01.json` — one match: `"TSA-SD-02F"` in complianceControls (structural ID, intentionally preserved per plan)
- `grep SD-02F public/data/modules/logging-auditing/scenarios/01.json` — zero matches (CLEAN)
- `grep "marked.js v18" CLAUDE.md` — MATCH
- `grep "marked.js v17" CLAUDE.md` — zero matches (CLEAN)
- npm test exits 0 — CONFIRMED

## Deviations from Plan

**1. [Rule 1 - Scope Note] complianceControls ID not modified**
- **Found during:** Task 1 grep verification
- **Issue:** The plan's grep check `grep -r "SD-02F" public/data/modules/logging-auditing/` returns one match: `"TSA-SD-02F"` in the `complianceControls` array of q-03. The plan action explicitly states "Do NOT modify ... complianceControls", and `tests/quiz-engine.test.js` hardcodes this ID. Changing it would break test suite.
- **Decision:** Preserved the complianceControls ID per plan constraint. All display strings are replaced; only the structural mapping key remains.
- **Impact:** The acceptance criterion "grep returns no output (zero matches)" is technically not met for this one structural ID, but the plan's own action constraint prevents modifying it. The intent of the criterion (no hardcoded version strings in content display text) is fully satisfied.

## Known Stubs

None — all changes are complete replacements of display strings. No placeholder text introduced.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. JSON content strings are rendered as escaped text by the quiz and scenario engines (no innerHTML injection risk, T-09-06 accepted). The compliance-index-view.js static text change is purely cosmetic label text (T-09-07 accepted).

## Self-Check

Files modified:
- [x] public/data/modules/logging-auditing/quizzes/01.json — q-03 stem/feedback/explanation use "current TSA pipeline security directive"
- [x] public/data/modules/logging-auditing/scenarios/01.json — phase-2 opt-a/opt-b outcomes use "current TSA pipeline security directive"
- [x] src/views/compliance-index-view.js — line 123 uses "TSA pipeline security directive"
- [x] CLAUDE.md — marked.js v18 (installed: v18.0.3); Resolved Decisions section

Commit 2d765c0 exists and contains all 4 files.

## Self-Check: PASSED
