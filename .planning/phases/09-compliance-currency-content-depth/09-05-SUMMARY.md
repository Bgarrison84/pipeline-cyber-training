---
phase: 09-compliance-currency-content-depth
plan: 05
subsystem: logging-auditing-content
tags: [wave-3, new-lessons, quiz, scenario, cont-05, cont-06, cont-07]
dependency_graph:
  requires: [09-03-hardcode-audit, 09-04-sme-review-tooling]
  provides: [logging-auditing-5-lessons, quiz-02, scenario-02]
  affects:
    - public/data/modules/logging-auditing/lessons/04-ot-logging-advanced.md
    - public/data/modules/logging-auditing/lessons/05-siem-integration.md
    - public/data/modules/logging-auditing/quizzes/02.json
    - public/data/modules/logging-auditing/scenarios/02.json
    - src/modules-config.js
    - tests/content-loader.test.js
tech_stack:
  added: []
  patterns: [generic-directive-phrasing, ot-callout-block, process-hash-baselining, dmz-collector-architecture]
key_files:
  created:
    - public/data/modules/logging-auditing/lessons/04-ot-logging-advanced.md
    - public/data/modules/logging-auditing/lessons/05-siem-integration.md
    - public/data/modules/logging-auditing/quizzes/02.json
    - public/data/modules/logging-auditing/scenarios/02.json
  modified:
    - src/modules-config.js
    - tests/content-loader.test.js
decisions:
  - "ot-logging-advanced lesson is a pure reading lesson (no quizId, exerciseId, or scenarioId) — completable on visit"
  - "scenario-02 uses three phases: phase-1 (decision), phase-2-ot (final, OT-aware path), phase-2-it (final, IT standard path)"
  - "content-loader.test.js last-lesson nav test updated from audit-policies to siem-integration to reflect 5-lesson module state"
metrics:
  duration: "15 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 05: New Logging & Auditing Content Summary

## Objective Achieved

Two new lessons, one new advanced quiz (3 questions), and one new multi-branch OT/IT scenario added to the logging-auditing module. modules-config.js updated atomically. All 177 tests GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author lessons 04-ot-logging-advanced and 05-siem-integration | ca8d1f5 | 04-ot-logging-advanced.md, 05-siem-integration.md |
| 2 | Author quiz 02.json and scenario 02.json; update modules-config.js | c370321 | quizzes/02.json, scenarios/02.json, modules-config.js, content-loader.test.js |

## Content Delivered

### Lesson 04: Advanced OT Log Collection and Retention
- **File:** `public/data/modules/logging-auditing/lessons/04-ot-logging-advanced.md`
- **Frontmatter:** `lessonId: ot-logging-advanced`, `order: 4`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** WEF subscription limitations on air-gapped networks, DMZ collector pattern, ports 5985/5986
- **Compliance citations:** "current TSA pipeline security directive" (continuous monitoring mandate), NIST SP 800-82 Rev 3 Chapter 6 and Section 6.2
- **PowerShell:** `Get-WinEvent -ComputerName`, `wevtutil epl`, `Set-LogProperties`, `Get-LogProperties`
- **NERC CIP:** Framed as maturity benchmark per project rules

### Lesson 05: SIEM Integration for Pipeline OT Environments
- **File:** `public/data/modules/logging-auditing/lessons/05-siem-integration.md`
- **Frontmatter:** `lessonId: siem-integration`, `order: 5`, `quizId: '02'`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** Legacy Windows (2012R2) WMI fallback, DNS resolution in air-gapped environments
- **Compliance citations:** "current TSA pipeline security directive" (continuous monitoring requirement), NIST SP 800-82 Rev 3 Chapter 6 and Section 6.3
- **PowerShell:** `Get-WinEvent` with `-FilterHashtable`, `Where-Object { $_.Level -le 2 }`, process hash baseline comparison with `Get-FileHash` and `Invoke-Command`
- **NERC CIP:** Framed as maturity benchmark per project rules

### Quiz 02.json
- **File:** `public/data/modules/logging-auditing/quizzes/02.json`
- **id:** `logging-auditing-quiz-02`
- **3 questions:**
  - q-01: WEF subscription types (push vs. collector-initiated) — `NIST-AU-12`
  - q-02: OT SIEM event normalization — most significant alert indicator on locked-down OT host — `TSA-Monitoring`, `NIST-SI-4`
  - q-03: Log retention period under TSA directive — `TSA-Monitoring`, `NIST-AU-11`
- Each question: 4 answers, exactly 1 `"correct": true`, per-answer feedback, explanation
- No version-specific strings (no SD-02F anywhere)

### Scenario 02.json
- **File:** `public/data/modules/logging-auditing/scenarios/02.json`
- **id:** `logging-auditing-scenario-02`
- **3 phases:**
  - `phase-1` (decision, `isFinal: false`): Choose between OT-aware WEF DMZ collector vs. SIEM agent direct install
  - `phase-2-ot` (decision, `isFinal: true`): Correct path — verify 12-month retention on DMZ collector/SIEM (not local OT host)
  - `phase-2-it` (decision, `isFinal: true`): Incorrect path — agent install triggers vendor support void; correct answer is to pivot to WEF
- All `nextPhaseId` values verified: `phase-1` options point to `phase-2-ot` and `phase-2-it` (both real IDs); terminal phases use `null`
- Narrative includes OT context, ExampleCorp and PIPELINE-HMI01 identifiers

### modules-config.js Update
- logging-auditing lessons array extended from 3 to 5 entries:
  - Existing: intro, ps-logging, audit-policies
  - New: `{ id: 'ot-logging-advanced', title: 'Advanced OT Log Collection and Retention' }`
  - New: `{ id: 'siem-integration', title: 'SIEM Integration for Pipeline OT Environments', quizId: '02' }`

## Test Results

- **Final npm test result:** 177 passed | 1 todo (178 total) — EXIT 0
- 17 test files passed
- content-loader.test.js getLessonNav test GREEN with updated last-lesson reference

## Key Decisions

**1. Pure reading lesson for ot-logging-advanced**
The `ot-logging-advanced` lesson has no `quizId`, `exerciseId`, or `scenarioId`. It is completable on visit (read completion), consistent with other intro-style lessons in the module. The quiz and scenario content live in the subsequent siem-integration lesson and scenario-02.

**2. Scenario three-phase branching**
Scenario 02 uses a three-phase structure (phase-1 + two terminal phases) instead of the two-phase structure from scenario 01. This provides genuinely separate OT-aware and IT-standard resolution paths rather than merging them into a single final phase. Both terminal phases have `isFinal: true` and `nextPhaseId: null` — T-09-11 mitigation verified.

**3. content-loader.test.js nav test update (Rule 1 auto-fix)**
The test `returns null next for last lesson` hardcoded `audit-policies` as the last lesson. Adding two new lessons to the module made this test fail (correct behavior: `audit-policies` now has a `next` pointing to `ot-logging-advanced`). Updated the test to use `siem-integration` as the last lesson and `ot-logging-advanced` as its prev — this is the correct state for the 5-lesson module.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] content-loader.test.js last-lesson nav assertion**
- **Found during:** Task 2 npm test run
- **Issue:** Test `returns null next for last lesson` expected `getLessonNav('logging-auditing', 'audit-policies').next` to be null. After adding two lessons after `audit-policies`, the nav correctly returns `ot-logging-advanced` as next — the test was stale, not the code.
- **Fix:** Updated test to assert `getLessonNav('logging-auditing', 'siem-integration').next` is null and `.prev.lessonId` is `'ot-logging-advanced'`.
- **Files modified:** `tests/content-loader.test.js`
- **Commit:** c370321

## Known Stubs

None — all lesson content is complete prose with real PowerShell examples. No placeholder text, no TODO markers, no empty sections.

## Threat Surface Scan

- **T-09-11 (Spoofing — nextPhaseId resolution):** Mitigated — all `nextPhaseId` values in scenario 02.json verified against real phase IDs before commit. phase-1 options reference `phase-2-ot` and `phase-2-it` (both present). Terminal phases use `null`.
- **T-09-10 (Tampering — quiz correct fields):** Accepted — static JSON served from CDN; canonical answer key not user-modifiable.
- **T-09-12 (Information Disclosure — lesson .md content):** Accepted — public educational material; no PII or credentials.

No new network endpoints, auth paths, or trust boundaries introduced beyond those documented in the threat model.

## Self-Check

Files created:
- [x] `public/data/modules/logging-auditing/lessons/04-ot-logging-advanced.md` — exists, OT callout at line 49, TSA generic phrasing, NIST SP 800-82 citation
- [x] `public/data/modules/logging-auditing/lessons/05-siem-integration.md` — exists, OT callout at line 67, TSA generic phrasing, quizId: '02' in frontmatter
- [x] `public/data/modules/logging-auditing/quizzes/02.json` — exists, id: logging-auditing-quiz-02, 3 questions, no SD-02F
- [x] `public/data/modules/logging-auditing/scenarios/02.json` — exists, id: logging-auditing-scenario-02, phase-2-ot and phase-2-it both isFinal

Files modified:
- [x] `src/modules-config.js` — logging-auditing lessons array has 5 entries; siem-integration has quizId: '02'
- [x] `tests/content-loader.test.js` — last-lesson nav test updated to siem-integration

Commits:
- [x] ca8d1f5 — Task 1 lesson files
- [x] c370321 — Task 2 quiz, scenario, modules-config, test fix

npm test: 177 passed | 1 todo — EXIT 0 CONFIRMED

## Self-Check: PASSED
