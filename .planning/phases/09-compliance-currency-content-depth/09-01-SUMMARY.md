---
phase: 09-compliance-currency-content-depth
plan: 01
subsystem: test-scaffold
tags: [tdd, wave-0, badge, compliance-refs, quiz-engine, scenario-view]
dependency_graph:
  requires: []
  provides: [09-01-test-gates]
  affects: [badge.js, compliance-refs.json, quiz-engine.js, scenario-view.js]
tech_stack:
  added: []
  patterns: [vitest-red-green, tdd-wave-0]
key_files:
  created:
    - tests/badge-expired.test.js
  modified:
    - tests/compliance-refs.test.js
    - tests/quiz-engine.test.js
    - tests/scenario-view.test.js
    - src/views/scenario-view.js
decisions:
  - "validateScenario exported from scenario-view.js to enable direct test imports (Rule 2 auto-fix)"
  - "compliance-refs.json already had expiryDate field — only status field is missing (1 RED instead of 2)"
  - "quizId 02 URL resolution test is GREEN because quiz-engine already builds URLs generically from quizId param"
metrics:
  duration: "5 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 01: Wave 0 Test Scaffold Summary

## Objective Achieved

Wave 0 RED test scaffold complete. All Phase 9 behavior gates are now represented as Vitest test assertions. Tests that test currently-missing implementation are RED; tests that verify existing behavior pass immediately as regression guards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author badge-expired.test.js (new file, RED) | 7965e72 | tests/badge-expired.test.js, src/views/scenario-view.js |
| 2 | Extend compliance-refs, quiz-engine, scenario-view tests | 7965e72 | tests/compliance-refs.test.js, tests/quiz-engine.test.js, tests/scenario-view.test.js |

## Test Results

| Test File | New Tests | RED (failing) | GREEN (passing) | Notes |
|-----------|-----------|--------------|-----------------|-------|
| tests/badge-expired.test.js | 6 | 4 | 2 | Tests 1-4 gate expired badge rendering; tests 5-6 are NIST regression guards |
| tests/compliance-refs.test.js | 2 | 1 | 1 | status field missing (RED); expiryDate already present in JSON (GREEN) |
| tests/quiz-engine.test.js | 1 | 0 | 1 | URL construction already works generically — GREEN immediately |
| tests/scenario-view.test.js | 1 | 0 | 1 | validateScenario handles multi-branch — GREEN immediately |

**Total test run after plan 09-01:**
- 172 GREEN + 1 todo (existing) + 5 NEW GREEN = 172 passing
- 5 RED failures (4 badge expired + 1 compliance status)
- npm test exits non-zero (RED phase) as required by Wave 0 purpose

**Pre-existing tests:** All 167 original tests remain GREEN. No regressions.

## Key Decisions

**1. validateScenario export (Rule 2 auto-fix)**
The plan specifies importing `validateScenario` from `scenario-view.js` in tests, but the function was only locally scoped (`function validateScenario`). Added `export` keyword to make it importable. This is a non-breaking change — no runtime behavior affected. The function was never called externally before; existing tests mocked the module entirely.

**2. expiryDate already present**
`compliance-refs.json` already had `"expiryDate": "2026-05-02"`. The plan anticipated 2 RED compliance-refs tests; only 1 is RED (the `status` field test). The `expiryDate` assertion is GREEN immediately. This is correct — it means Wave 1 only needs to add `"status": "expired"` to the JSON, not `expiryDate`.

**3. quizId 02 test is GREEN**
`quiz-engine.js` already constructs fetch URLs from the quizId parameter generically (not hardcoded to '01'). Since the test mocks fetch, the URL construction assertion passes immediately. The actual quizzes/02.json data file doesn't exist yet — that's the Wave 2 task. The URL resolution gate is already satisfied.

## RED Gates Established (Phase 9 implementation targets)

| Gate | Test | Target Plan |
|------|------|-------------|
| badge.js expired branch | badge-expired.test.js tests 1-4 | 09-02 (Wave 1) |
| compliance-refs.json status field | compliance-refs.test.js line 38 | 09-02 (Wave 1) |

## Deviations from Plan

**1. [Rule 2 - Missing Export] validateScenario not exported from scenario-view.js**
- Found during: Task 2 pre-read of scenario-view.js
- Issue: Plan specified `import { validateScenario } from '../src/views/scenario-view.js'` but function lacked `export` keyword
- Fix: Added `export` to function declaration in src/views/scenario-view.js line 26
- Files modified: src/views/scenario-view.js
- Commit: 7965e72

**2. [Plan inconsistency resolved] compliance-refs.json expiryDate already present**
- Found during: Task 2 pre-read of public/data/compliance-refs.json
- Issue: Plan predicted 2 RED compliance-refs tests; `expiryDate` was already in the JSON
- Resolution: Test for expiryDate is GREEN (correct behavior — data exists). Only `status` test is RED.
- Impact: Wave 1 only needs to add `status: "expired"` to JSON, not expiryDate

**3. [Plan inconsistency resolved] quizId 02 URL test is GREEN**
- Found during: Task 2 execution
- Issue: Plan listed this as RED; quiz-engine URL construction is already generic
- Resolution: Test is GREEN (correct — URL construction works). No implementation needed in Wave 2 for URL logic. Wave 2 only needs the data file quizzes/02.json to exist.

## Known Stubs

None — this plan only creates/extends test files and exports one function.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Test files only. `validateScenario` export adds no runtime attack surface.

## Self-Check

Files created/modified:
- [x] tests/badge-expired.test.js EXISTS
- [x] tests/compliance-refs.test.js MODIFIED (2 new it() blocks)
- [x] tests/quiz-engine.test.js MODIFIED (1 new describe + it block)
- [x] tests/scenario-view.test.js MODIFIED (1 new describe + validateScenario import)
- [x] src/views/scenario-view.js MODIFIED (export added)

Commit 7965e72 exists and contains all 5 files.

## Self-Check: PASSED
