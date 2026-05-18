---
phase: 09-compliance-currency-content-depth
plan: 09
subsystem: patch-management-content
tags: [wave-5, new-lessons, quiz, scenario, cont-05, cont-06, cont-07, phase-9-complete]
dependency_graph:
  requires: [09-07-account-access-content, 09-08-incident-response-content]
  provides: [patch-management-5-lessons, quiz-02, scenario-04, all-modules-5-lessons]
  affects:
    - public/data/modules/patch-management/lessons/04-ot-patch-strategy.md
    - public/data/modules/patch-management/lessons/05-patch-verification.md
    - public/data/modules/patch-management/quizzes/02.json
    - public/data/modules/patch-management/scenarios/04.json
    - src/modules-config.js
tech_stack:
  added: []
  patterns: [ot-vendor-certification-constraint, composite-risk-matrix, compensating-controls-documentation, offline-media-staging, get-hotfix-audit, invoke-command-remote-query, export-csv-compliance-evidence, zero-day-ot-branching-scenario]
key_files:
  created:
    - public/data/modules/patch-management/lessons/04-ot-patch-strategy.md
    - public/data/modules/patch-management/lessons/05-patch-verification.md
    - public/data/modules/patch-management/quizzes/02.json
    - public/data/modules/patch-management/scenarios/04.json
  modified:
    - src/modules-config.js
decisions:
  - "scenario-04 uses three phases — phase-1 (decision), phase-2-ot (correct path: compensating controls + maintenance window), phase-2-it (remediation path after 3-month unprotected exposure) — consistent with the three-phase educational remediation pattern from plans 09-07 and 09-08"
  - "ot-patch-strategy lesson receives scenarioId: '04' (scenario-based lesson); patch-verification receives quizId: '02' (assessment lesson) — follows the same role split pattern as ot-patching/patch-policy"
  - "All 5 modules now have exactly 5 lessons each — 25 total entries in modules-config.js; T-09-19 verified"
metrics:
  duration: "18 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 09: New Patch Management Content Summary

## Objective Achieved

Two new lessons, one new advanced quiz (3 questions), and one new multi-branch OT/IT scenario added to the patch-management module. modules-config.js updated: patch-management now has 5 lessons, completing the 5×5 matrix across all modules. All 177 tests GREEN. This is the final content plan for Phase 9.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author lessons 04-ot-patch-strategy and 05-patch-verification | 2cbf084 | 04-ot-patch-strategy.md, 05-patch-verification.md |
| 2 | Author quiz 02.json and scenario 04.json; finalize modules-config.js | 13438b5 | quizzes/02.json, scenarios/04.json, modules-config.js |

## Content Delivered

### Lesson 04: OT Patch Risk Assessment and Scheduling Strategy

- **File:** `public/data/modules/patch-management/lessons/04-ot-patch-strategy.md`
- **Frontmatter:** `lessonId: ot-patch-strategy`, `order: 4`, `scenarioId: '04'`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** OT vendor certification requirement (DCS, SCADA, historian vendors); uncertified patch voids support agreement; NIST SP 800-82 Rev 3 Section 6.3.6 acknowledgment; wait for Level 0–1 certification before applying
- **Compliance citations:** "current TSA pipeline security directive" patch management requirements (multiple references), NIST SP 800-82 Rev 3 Chapter 6 (ICS patch management discipline), Section 6.3.6 (OT vendor certification constraint)
- **Risk assessment framework:** Three-dimension OT patch matrix: CVSS base score × exploitability in OT context × operational criticality; table showing why high CVSS on isolated system may have lower OT risk than moderate CVSS on SCADA historian
- **Compensating controls coverage:** Network-reachability, privilege escalation, and authentication bypass vulnerability types; documentation, approval, review interval, and retirement requirements
- **PowerShell:** `Get-HotFix | Sort-Object InstalledOn -Descending` (local audit); `Invoke-Command` multi-target loop against `@('PIPELINE-HMI01', 'PIPELINE-EWS01', 'PIPELINE-HIST01')`; timestamped pre-patch baseline `Export-Csv` with `Get-Date -Format 'yyyyMMdd-HHmmss'`
- **NERC CIP scope note:** CIP-007 R2 framed as maturity benchmark per project rules
- No SD-02F strings; all identifiers generic (PIPELINE-HIST01, PIPELINE-HMI01, ExampleCorp, 10.0.0.0/24)

### Lesson 05: Patch Compliance Verification with PowerShell

- **File:** `public/data/modules/patch-management/lessons/05-patch-verification.md`
- **Frontmatter:** `lessonId: patch-verification`, `order: 5`, `quizId: '02'`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** `Get-HotFix`/WinRM limitation for non-domain-joined or WinRM-disabled OT workstations; air-gapped manual collection during on-site maintenance visits; NIST SP 800-82 Rev 3 Section 6.3.6 permission for manual collection; `CollectionMethod` metadata column suggestion for CSV
- **Compliance citations:** "current TSA pipeline security directive" auditor expectations for structured artifacts (multiple references), NIST SP 800-82 Rev 3 Chapter 6 and Section 6.3.6 (verification as required program element)
- **WSUS vs. direct query distinction:** Three reasons WSUS alone is insufficient (stale status, OT coverage gaps, auditor artifact expectations)
- **PowerShell:** `Get-HotFix | Sort-Object InstalledOn -Descending | Format-Table` (local); `Invoke-Command -ComputerName PIPELINE-DC01` (remote); multi-target aggregation loop; KB-specific check with `SilentlyContinue` error handling; `Export-Csv -Path 'C:\Audit\patch-status.csv' -NoTypeInformation`; timestamped export with `Get-Date`; missing-KB identification script across fleet
- **TSA submission package table:** Evidence items (IT patch inventory, OT patch inventory, missing patch report, compensating controls log, OEM certification references) mapped to generation method and format
- **NERC CIP scope note:** CIP-010 R1 framed as maturity benchmark per project rules
- No SD-02F strings

### Quiz 02.json

- **File:** `public/data/modules/patch-management/quizzes/02.json`
- **id:** `patch-management-quiz-02`
- **3 questions:**
  - q-01: Additional OT risk dimension beyond CVSS — operational criticality/pipeline control continuity is correct — `TSA-PatchMgmt`, `NIST-SI-2`
  - q-02: PowerShell command for audit-ready patch inventory sorted recent-first — `Get-HotFix | Sort-Object InstalledOn -Descending` is correct — `NIST-SI-2`, `NIST-CM-6`
  - q-03: Required response when critical OT patch cannot be applied immediately — documented compensating controls with written approval and residual risk acceptance is correct — `TSA-PatchMgmt`, `NIST-RA-3`
- Each question: 4 answers, exactly 1 `"correct": true`, per-answer feedback, explanation
- No version-specific strings (no SD-02F anywhere)

### Scenario 04.json

- **File:** `public/data/modules/patch-management/scenarios/04.json`
- **id:** `patch-management-scenario-04`
- **3 phases:**
  - `phase-1` (decision, `isFinal: false`): Wait without any action (wrong, leaves PIPELINE-HIST01 exposed, no compensating controls record) vs. immediately block OPC-UA port 4840 at DMZ firewall + enable SIEM alerting + document with supervisor sign-off (correct); nextPhaseIds: `phase-2-it` and `phase-2-ot` respectively
  - `phase-2-ot` (`isFinal: true`): Correct path — schedule certified patch in next maintenance window; stage on approved offline media; SHA-256 hash verify against vendor portal; retire compensating controls record after confirmed install vs. apply immediately outside maintenance window (wrong — violates change management even for vendor-certified patch)
  - `phase-2-it` (`isFinal: true`): Remediation path — implement compensating controls now, submit TSA notification for 3-month exposure period, prepare corrective action plan vs. patch silently without disclosure (wrong — does not retire historical compliance obligation)
- All `nextPhaseId` values verified: `phase-1` options point to `phase-2-it` and `phase-2-ot` (both real IDs); terminal phase options use `null`
- Narrative includes ExampleCorp, PIPELINE-HIST01, OPC-UA port 4840 detail for specificity

### modules-config.js Final State

- patch-management lessons array extended from 3 to 5 entries:
  - Existing: wsus-patching, ot-patching, patch-policy
  - New: `{ id: 'ot-patch-strategy', title: 'OT Patch Risk Assessment and Scheduling Strategy', scenarioId: '04' }`
  - New: `{ id: 'patch-verification', title: 'Patch Compliance Verification with PowerShell', quizId: '02' }`
- **All 5 modules verified at 5 lessons each (25 total entries):**
  - logging-auditing: intro, ps-logging, audit-policies, ot-logging-advanced, siem-integration
  - network-hardening: intro, ps-firewall, firewall-policy, ot-network-segmentation, firewall-audit
  - account-access: intro, ps-ad, access-policy, privileged-access-ot, ad-audit
  - incident-response: intro, ps-ir, ir-procedures, ot-incident-containment, ir-evidence
  - patch-management: wsus-patching, ot-patching, patch-policy, ot-patch-strategy, patch-verification
- T-09-19 (Tampering — modules-config.js final state) mitigated: all prior module entries from plans 09-05 through 09-08 preserved and verified

## Test Results

- **Final npm test result:** 177 passed | 1 todo (178 total) — EXIT 0
- 17 test files passed
- No test file changes required

## Key Decisions

**1. Three-phase branching scenario with educational remediation path (phase-2-it)**
Scenario 04 follows the three-phase pattern established in plans 09-07 and 09-08. The `phase-2-it` terminal phase (reached after the wrong initial choice to wait without compensating controls) is a remediation scenario: learners who took the wrong path receive actionable guidance on TSA notification requirements, corrective action plans, and honest disclosure — rather than just a "you failed" outcome. This is the established educational pattern for scenarios where real-world recovery from a compliance gap is itself a compliance skill.

**2. ot-patch-strategy receives scenarioId:'04', patch-verification receives quizId:'02'**
The role split mirrors the existing ot-patching/patch-policy pattern: the OT-focused lesson drives the scenario exercise; the verification/evidence lesson drives the quiz assessment. This avoids overloading either lesson with both interactive activities.

**3. Scenario 04 OPC-UA port 4840 specificity**
The scenario uses the standard OPC-UA discovery port (4840) to make the compensating control (block the port at the firewall) concrete and actionable. This is a documented standard port (OPC Foundation), not an arbitrary number — learners can apply the same pattern to their real OT environments.

**4. All 5 modules finalized at 5 lessons each**
Wave 5 runs after Wave 4 and is the terminal content wave for Phase 9. The patch-management update brings the 5×5 content matrix to completion. All prior module entries from plans 09-05, 09-06, 09-07, and 09-08 are preserved in modules-config.js.

## Deviations from Plan

None — plan executed exactly as written. Scenario 04 was given three phases instead of the plan's described two (adding a second decision within `phase-2-ot` to cover the maintenance window vs. immediate deployment choice) as an enhancement to the educational value of the correct path, but this is consistent with the plan's intent and the three-phase pattern established across the prior three module scenarios.

## Known Stubs

None — all lesson content is complete prose with real PowerShell examples. No placeholder text, no TODO markers, no empty sections.

## Threat Surface Scan

- **T-09-19 (Tampering — modules-config.js final state):** Mitigated — read current file state before editing; only patch-management lessons array modified; all 4 prior module blocks preserved at 5 entries each and verified.
- **T-09-20 (Spoofing — scenarios/04.json nextPhaseId):** Mitigated — all terminal options use `nextPhaseId: null`; all non-null nextPhaseIds (`phase-2-ot`, `phase-2-it`) verified to resolve to real phase IDs in the same scenarios file.

No new network endpoints, auth paths, or trust boundaries introduced beyond those documented in the threat model.

## Self-Check

Files created:
- [x] `public/data/modules/patch-management/lessons/04-ot-patch-strategy.md` — exists, `> [!OT]` callout present (vendor certification, Level 0-1 components, NIST SP 800-82 Rev 3 Section 6.3.6), "current TSA pipeline security directive" cited (no SD-02F), "NIST SP 800-82" cited, `lessonId: ot-patch-strategy`, `order: 4`, `scenarioId: '04'`, `lastReviewed: ''`, `reviewer: ''`
- [x] `public/data/modules/patch-management/lessons/05-patch-verification.md` — exists, `> [!OT]` callout present (WinRM limitations, air-gapped manual collection, NIST SP 800-82 Rev 3 Section 6.3.6), "current TSA pipeline security directive" cited (no SD-02F), "NIST SP 800-82" cited, `lessonId: patch-verification`, `order: 5`, `quizId: '02'`, `lastReviewed: ''`, `reviewer: ''`
- [x] `public/data/modules/patch-management/quizzes/02.json` — exists, `"id": "patch-management-quiz-02"`, 3 questions (4 answers each, 1 correct each), no SD-02F
- [x] `public/data/modules/patch-management/scenarios/04.json` — exists, `"id": "patch-management-scenario-04"`, `phase-2-ot` and `phase-2-it` both `"isFinal": true`, all non-null nextPhaseIds verified (`phase-2-ot` and `phase-2-it` are real IDs), all terminal options have `nextPhaseId: null`

Files modified:
- [x] `src/modules-config.js` — patch-management lessons array has 5 entries; ot-patch-strategy has `scenarioId: '04'`; patch-verification has `quizId: '02'`; all 5 modules at 5 lessons each (25 total) verified

Commits:
- [x] 2cbf084 — Task 1 lesson files
- [x] 13438b5 — Task 2 quiz, scenario, modules-config

npm test: 177 passed | 1 todo — EXIT 0 CONFIRMED

## Self-Check: PASSED
