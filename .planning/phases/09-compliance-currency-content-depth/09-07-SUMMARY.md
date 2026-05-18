---
phase: 09-compliance-currency-content-depth
plan: 07
subsystem: account-access-content
tags: [wave-4, new-lessons, quiz, scenario, cont-05, cont-06, cont-07]
dependency_graph:
  requires: [09-05-logging-content, 09-06-network-hardening-content]
  provides: [account-access-5-lessons, quiz-02, scenario-02]
  affects:
    - public/data/modules/account-access/lessons/04-privileged-access-ot.md
    - public/data/modules/account-access/lessons/05-ad-audit.md
    - public/data/modules/account-access/quizzes/02.json
    - public/data/modules/account-access/scenarios/02.json
    - src/modules-config.js
tech_stack:
  added: []
  patterns: [generic-directive-phrasing, ot-callout-block, jit-access-pattern, laps-ot-credential-management, ad-audit-csv-evidence, contractor-access-named-account]
key_files:
  created:
    - public/data/modules/account-access/lessons/04-privileged-access-ot.md
    - public/data/modules/account-access/lessons/05-ad-audit.md
    - public/data/modules/account-access/quizzes/02.json
    - public/data/modules/account-access/scenarios/02.json
  modified:
    - src/modules-config.js
decisions:
  - "privileged-access-ot lesson is a pure reading lesson (no quizId, exerciseId, or scenarioId) — completable on visit, consistent with ot-logging-advanced pattern"
  - "scenario-02 uses three phases: phase-1 (decision), phase-2-ot (final, named JIT account path), phase-2-it (final, shared account violation path with remediation)"
  - "phase-2-it is structured as a remediation scenario so learners who chose the wrong path still receive educational content about how to return to compliance"
  - "modules-config.js logging-auditing and network-hardening entries from plans 09-05 and 09-06 preserved — T-09-15 mitigation verified"
metrics:
  duration: "20 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 07: New Account Access Content Summary

## Objective Achieved

Two new lessons, one new advanced quiz (3 questions), and one new multi-branch OT/IT scenario added to the account-access module. modules-config.js updated with logging-auditing and network-hardening entries from plans 09-05 and 09-06 preserved. All 177 tests GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author lessons 04-privileged-access-ot and 05-ad-audit | 3f7fa15 | 04-privileged-access-ot.md, 05-ad-audit.md |
| 2 | Author quiz 02.json and scenario 02.json; update modules-config.js | 4042bf9 | quizzes/02.json, scenarios/02.json, modules-config.js |

## Content Delivered

### Lesson 04: Privileged Access Management for OT Environments
- **File:** `public/data/modules/account-access/lessons/04-privileged-access-ot.md`
- **Frontmatter:** `lessonId: privileged-access-ot`, `order: 4`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** LAPS requirement for non-domain-joined HMI/SCADA workstations; NIST SP 800-82 Rev 3 Section 6.3.3 least-privilege requirement; PAM solution for air-gapped systems with 30-day rotation cadence
- **Compliance citations:** "current TSA pipeline security directive" (access control mandate), NIST SP 800-82 Rev 3 Chapter 6 (ICS account management), Section 6.3.3
- **PowerShell:** `Get-ADGroupMember 'Domain Admins'`, `Get-ADUser -Filter { Enabled -eq $True } | Export-Csv`, `New-ADServiceAccount` for gMSA creation, SPN enumeration with `PasswordNeverExpires` flag
- **NERC CIP:** Framed as maturity benchmark per project rules (CIP-004 R4 access management)
- **Key patterns:** JIT access vs. standing privileged accounts; shared/generic account anti-pattern; MSA migration for OT service accounts

### Lesson 05: Auditing Active Directory with PowerShell
- **File:** `public/data/modules/account-access/lessons/05-ad-audit.md`
- **Frontmatter:** `lessonId: ad-audit`, `order: 5`, `quizId: '02'`, `lastReviewed: ''`, `reviewer: ''`
- **OT callout:** OT service accounts (historian, OPC DA, DCS) must appear in AD audit; PasswordNeverExpires + local Administrators cross-check; `Get-LocalUser` and `Get-LocalGroupMember` for non-domain-joined OT systems; NIST SP 800-82 Rev 3 Section 6.3
- **Compliance citations:** "current TSA pipeline security directive" (periodic access review), NIST SP 800-82 Rev 3 Chapter 6 and Section 6.3
- **PowerShell:** `Search-ADAccount -AccountDisabled | Export-Csv`, `Get-ADUser -Filter { PasswordNeverExpires -eq $True }`, stale account 90-day threshold query, `Get-ADGroupMember -Recursive` Domain Admins snapshot, full monthly automation script with timestamped folder output
- **NERC CIP:** Framed as maturity benchmark per project rules (CIP-004 R4 six-month minimum as maturity floor)

### Quiz 02.json
- **File:** `public/data/modules/account-access/quizzes/02.json`
- **id:** `account-access-quiz-02`
- **3 questions:**
  - q-01: Enumerate disabled AD accounts — `Search-ADAccount -AccountDisabled` is correct — `NIST-AC-2`
  - q-02: Account type prohibited for standing OT admin access — shared/generic accounts is correct — `TSA-Access`, `NIST-AC-6`
  - q-03: Managing local admin passwords on non-domain-joined OT workstations — LAPS or PAM solution is correct — `NIST-AC-2`, `NIST-IA-5`
- Each question: 4 answers, exactly 1 `"correct": true`, per-answer feedback, explanation
- No version-specific strings (no SD-02F anywhere)

### Scenario 02.json
- **File:** `public/data/modules/account-access/scenarios/02.json`
- **id:** `account-access-scenario-02`
- **3 phases:**
  - `phase-1` (decision, `isFinal: false`): Shared Administrator account (wrong) vs. named time-limited JIT account (correct); nextPhaseIds: `phase-2-it` and `phase-2-ot` respectively
  - `phase-2-ot` (decision, `isFinal: true`): Compliant path — review Security event log, export contractor logon events, document in contractor access register; vs. no action after account expiry (non-compliant)
  - `phase-2-it` (decision, `isFinal: true`): Remediation path — change Administrator password, document violation, implement contractor access procedure; vs. taking no action (ongoing violation)
- All `nextPhaseId` values verified: `phase-1` options point to `phase-2-it` and `phase-2-ot` (both real IDs); terminal phase options use `null`
- Narrative includes OT context, ExampleCorp and PIPELINE-HIST01 identifiers

### modules-config.js Update
- account-access lessons array extended from 3 to 5 entries:
  - Existing: intro, ps-ad, access-policy
  - New: `{ id: 'privileged-access-ot', title: 'Privileged Access Management for OT Environments' }`
  - New: `{ id: 'ad-audit', title: 'Auditing Active Directory with PowerShell', quizId: '02' }`
- logging-auditing entries from plan 09-05 (ot-logging-advanced, siem-integration) confirmed preserved — T-09-15 mitigation verified
- network-hardening entries from plan 09-06 (ot-network-segmentation, firewall-audit) confirmed preserved — T-09-15 mitigation verified

## Test Results

- **Final npm test result:** 177 passed | 1 todo (178 total) — EXIT 0
- 17 test files passed
- No test file changes required

## Key Decisions

**1. Pure reading lesson for privileged-access-ot**
The `privileged-access-ot` lesson has no `quizId`, `exerciseId`, or `scenarioId`. It is completable on visit (read completion), consistent with the `ot-logging-advanced` (plan 09-05) and `ot-network-segmentation` (plan 09-06) patterns. The quiz and scenario are wired to the subsequent `ad-audit` lesson.

**2. Three-phase branching scenario with educational remediation path**
Scenario 02 uses a three-phase structure (phase-1 + two separate terminal phases) providing genuinely distinct compliant and non-compliant resolution paths. The `phase-2-it` path is structured as a remediation scenario — learners who chose the wrong initial path receive actionable guidance on how to return to compliance rather than just a "you failed" message.

**3. modules-config.js parallel-edit safety (T-09-15)**
Plans 09-05 and 09-06 ran before this plan and extended the logging-auditing and network-hardening lessons arrays respectively. The current file was read before editing. Only the account-access lessons array was modified. All other module blocks (logging-auditing, network-hardening, incident-response, patch-management) are unchanged from the pre-edit state.

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes were required. Test suite remained GREEN after both tasks without any test file modifications.

## Known Stubs

None — all lesson content is complete prose with real PowerShell examples. No placeholder text, no TODO markers, no empty sections.

## Threat Surface Scan

- **T-09-15 (Tampering — modules-config.js parallel edit):** Mitigated — read current file state before editing; only account-access array modified; logging-auditing (5 entries) and network-hardening (5 entries) preserved and verified.
- **T-09-16 (Information Disclosure — AD audit lesson content):** Accepted — lesson uses generic identifiers (ExampleCorp, PIPELINE-DC01, PIPELINE-HIST01). No real org data, no real AD credentials referenced.

No new network endpoints, auth paths, or trust boundaries introduced beyond those documented in the threat model.

## Self-Check

Files created:
- [x] `public/data/modules/account-access/lessons/04-privileged-access-ot.md` — exists, OT callout present, TSA generic phrasing, NIST SP 800-82 citation, order: 4, lastReviewed: '', reviewer: ''
- [x] `public/data/modules/account-access/lessons/05-ad-audit.md` — exists, OT callout present, TSA generic phrasing, quizId: '02' in frontmatter, order: 5, lastReviewed: '', reviewer: ''
- [x] `public/data/modules/account-access/quizzes/02.json` — exists, id: account-access-quiz-02, 3 questions (4 answers each, 1 correct each), no SD-02F
- [x] `public/data/modules/account-access/scenarios/02.json` — exists, id: account-access-scenario-02, phase-2-ot and phase-2-it both isFinal: true, all nextPhaseIds verified

Files modified:
- [x] `src/modules-config.js` — account-access lessons array has 5 entries; ad-audit has quizId: '02'; logging-auditing 5 entries preserved; network-hardening 5 entries preserved

Commits:
- [x] 3f7fa15 — Task 1 lesson files
- [x] 4042bf9 — Task 2 quiz, scenario, modules-config

npm test: 177 passed | 1 todo — EXIT 0 CONFIRMED

## Self-Check: PASSED
