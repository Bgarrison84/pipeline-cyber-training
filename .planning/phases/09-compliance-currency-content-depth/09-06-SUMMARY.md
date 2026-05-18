---
phase: 09-compliance-currency-content-depth
plan: 06
subsystem: network-hardening-content
tags: [wave-3, new-lessons, quiz, scenario, cont-05, cont-06, cont-07]
dependency_graph:
  requires: [09-03-hardcode-audit, 09-04-sme-review-tooling]
  provides: [network-hardening-5-lessons, quiz-02, scenario-02]
  affects:
    - public/data/modules/network-hardening/lessons/04-ot-network-segmentation.md
    - public/data/modules/network-hardening/lessons/05-firewall-audit.md
    - public/data/modules/network-hardening/quizzes/02.json
    - public/data/modules/network-hardening/scenarios/02.json
    - src/modules-config.js
tech_stack:
  added: []
  patterns: [generic-directive-phrasing, ot-callout-block, purdue-model-zones, dmz-jump-host-architecture, firewall-export-csv-evidence]
key_files:
  created:
    - public/data/modules/network-hardening/lessons/04-ot-network-segmentation.md
    - public/data/modules/network-hardening/lessons/05-firewall-audit.md
    - public/data/modules/network-hardening/quizzes/02.json
    - public/data/modules/network-hardening/scenarios/02.json
  modified:
    - src/modules-config.js
decisions:
  - "ot-network-segmentation lesson is a pure reading lesson (no quizId, exerciseId, or scenarioId) — completable on visit"
  - "scenario-02 uses three phases: phase-1 (decision), phase-2-ot (final, DMZ jump host path), phase-2-it (final, direct RDP violation path)"
  - "modules-config.js logging-auditing entries from plan 09-05 preserved; only network-hardening array extended"
metrics:
  duration: "15 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 06: New Network Hardening Content Summary

## Objective Achieved

Two new lessons, one new advanced quiz (3 questions), and one new multi-branch OT/IT scenario added to the network-hardening module. modules-config.js updated with logging-auditing entries from plan 09-05 preserved. All 177 tests GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author lessons 04-ot-network-segmentation and 05-firewall-audit | 8e7e833 | 04-ot-network-segmentation.md, 05-firewall-audit.md |
| 2 | Author quiz 02.json and scenario 02.json; update modules-config.js | 290626a | quizzes/02.json, scenarios/02.json, modules-config.js |

## Content Delivered

### Lesson 04: OT Network Segmentation and DMZ Architecture
- **File:** `public/data/modules/network-hardening/lessons/04-ot-network-segmentation.md`
- **Frontmatter:** `lessonId: ot-network-segmentation`, `order: 4`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** Control network (Level 2) isolation from corporate IT via DMZ; direct IT-to-OT connections prohibited; written risk acceptance required for exceptions
- **Compliance citations:** "current TSA pipeline security directive" (network segmentation requirement), NIST SP 800-82 Rev 3 Chapter 5 and Section 5.4
- **PowerShell:** `Test-NetConnection -ComputerName PIPELINE-HMI01 -Port 5985`, `Get-NetFirewallRule | Get-NetFirewallAddressFilter`, connectivity loop across OT host list
- **NERC CIP:** Framed as maturity benchmark per project rules (CIP-005 Electronic Security Perimeters)
- **Purdue Model:** Level 0–4 table; Level 2 isolation requirement explained in pipeline context

### Lesson 05: Firewall Rule Auditing with PowerShell
- **File:** `public/data/modules/network-hardening/lessons/05-firewall-audit.md`
- **Frontmatter:** `lessonId: firewall-audit`, `order: 5`, `quizId: '02'`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** Non-domain-joined OT workstations use Public profile; audit the correct active profile before signing off; NIST SP 800-82 Rev 3 Section 5.4.3 documentation requirement
- **Compliance citations:** "current TSA pipeline security directive" (network access control documentation), NIST SP 800-82 Rev 3 Chapter 5
- **PowerShell:** Full `Get-NetFirewallRule | ForEach-Object` with `Export-Csv` pattern; any-source violation query; cross-zone rule detection; RDP rule identification
- **NERC CIP:** Framed as maturity benchmark per project rules (CIP-007 R1 ports and services)

### Quiz 02.json
- **File:** `public/data/modules/network-hardening/quizzes/02.json`
- **id:** `network-hardening-quiz-02`
- **3 questions:**
  - q-01: Purdue Model zone for HMI workstations — Level 2 (Supervisory) is correct — `NIST-SC-7`
  - q-02: PowerShell sequence to export firewall rules to CSV — `Get-NetFirewallRule -Enabled True | Export-Csv` is correct — `NIST-CM-7`, `TSA-NetworkSeg`
  - q-03: TSA exception documentation when IT-to-OT connection cannot be avoided — written risk acceptance + compensating controls is correct — `TSA-NetworkSeg`, `NIST-RA-3`
- Each question: 4 answers, exactly 1 `"correct": true`, per-answer feedback, explanation
- No version-specific strings (no SD-02F anywhere)

### Scenario 02.json
- **File:** `public/data/modules/network-hardening/scenarios/02.json`
- **id:** `network-hardening-scenario-02`
- **3 phases:**
  - `phase-1` (decision, `isFinal: false`): Direct RDP to OT host (wrong) vs. DMZ jump host route (correct); nextPhaseIds: `phase-2-it` and `phase-2-ot` respectively
  - `phase-2-ot` (decision, `isFinal: true`): Correct path — terminate session, log details, revoke access; vs. leaving access open (non-compliant)
  - `phase-2-it` (decision, `isFinal: true`): Remediation path — remove rule, document exception with written risk acceptance, add compensating control; vs. leaving rule in place (violation)
- All `nextPhaseId` values verified: `phase-1` options point to `phase-2-ot` and `phase-2-it` (both real IDs); terminal phase options use `null`
- Narrative includes OT context, ExampleCorp and PIPELINE-HMI01 identifiers

### modules-config.js Update
- network-hardening lessons array extended from 3 to 5 entries:
  - Existing: intro, ps-firewall, firewall-policy
  - New: `{ id: 'ot-network-segmentation', title: 'OT Network Segmentation and DMZ Architecture' }`
  - New: `{ id: 'firewall-audit', title: 'Firewall Rule Auditing with PowerShell', quizId: '02' }`
- logging-auditing entries from plan 09-05 (ot-logging-advanced, siem-integration) confirmed preserved — T-09-13 mitigation verified

## Test Results

- **Final npm test result:** 177 passed | 1 todo (178 total) — EXIT 0
- 17 test files passed
- No test file changes required

## Key Decisions

**1. Pure reading lesson for ot-network-segmentation**
The `ot-network-segmentation` lesson has no `quizId`, `exerciseId`, or `scenarioId`. It is completable on visit (read completion), consistent with the `ot-logging-advanced` lesson pattern from plan 09-05. The quiz and scenario content are wired to the subsequent `firewall-audit` lesson.

**2. Three-phase branching scenario**
Scenario 02 uses a three-phase structure (phase-1 + two separate terminal phases) rather than the two-phase structure of scenario 01. This provides genuinely distinct OT-compliant and IT-violation resolution paths. The `phase-2-it` path is designed as a remediation scenario so learners who chose the wrong path still receive educational content about how to return to compliance.

**3. modules-config.js parallel-edit safety (T-09-13)**
Plan 09-05 ran before this plan and extended the logging-auditing lessons array. The current file was read before editing. Only the network-hardening lessons array was modified. All other module blocks (account-access, incident-response, patch-management, logging-auditing) are unchanged from the pre-edit state.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes were required. Test suite remained GREEN after both tasks without any test file modifications.

## Known Stubs

None — all lesson content is complete prose with real PowerShell examples. No placeholder text, no TODO markers, no empty sections.

## Threat Surface Scan

- **T-09-13 (Tampering — modules-config.js parallel edit):** Mitigated — read current file state before editing; only network-hardening array modified; logging-auditing entries from plan 09-05 preserved and verified.
- **T-09-14 (Spoofing — scenarios/02.json nextPhaseId):** Mitigated — all `nextPhaseId` values in scenario 02.json verified against real phase IDs. phase-1 options reference `phase-2-ot` and `phase-2-it` (both present). Terminal phase options use `null`.

No new network endpoints, auth paths, or trust boundaries introduced beyond those documented in the threat model.

## Self-Check

Files created:
- [x] `public/data/modules/network-hardening/lessons/04-ot-network-segmentation.md` — exists, OT callout present, TSA generic phrasing, NIST SP 800-82 citation, order: 4
- [x] `public/data/modules/network-hardening/lessons/05-firewall-audit.md` — exists, OT callout present, TSA generic phrasing, quizId: '02' in frontmatter, order: 5
- [x] `public/data/modules/network-hardening/quizzes/02.json` — exists, id: network-hardening-quiz-02, 3 questions, no SD-02F
- [x] `public/data/modules/network-hardening/scenarios/02.json` — exists, id: network-hardening-scenario-02, phase-2-ot and phase-2-it both isFinal: true

Files modified:
- [x] `src/modules-config.js` — network-hardening lessons array has 5 entries; firewall-audit has quizId: '02'; logging-auditing 5 entries preserved

Commits:
- [x] 8e7e833 — Task 1 lesson files
- [x] 290626a — Task 2 quiz, scenario, modules-config

npm test: 177 passed | 1 todo — EXIT 0 CONFIRMED

## Self-Check: PASSED
