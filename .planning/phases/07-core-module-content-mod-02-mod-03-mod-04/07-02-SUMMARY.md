---
phase: 07-core-module-content-mod-02-mod-03-mod-04
plan: "02"
subsystem: content
tags: [content, account-access, MOD-03, active-directory, least-privilege]
dependency_graph:
  requires: ["07-01"]
  provides: ["account-access module — 6 content files (3 lessons + quiz + exercise + scenario)"]
  affects: ["modules-config.js account-access lessons array", "compliance-index.json (updated in 07-04)"]
tech_stack:
  added: []
  patterns: ["Pattern A lesson (scenario-host)", "Pattern B lesson (exercise-host)", "Pattern C lesson (quiz-host)", "Quiz JSON schema", "Exercise JSON schema", "Scenario JSON schema"]
key_files:
  created:
    - public/data/modules/account-access/lessons/intro.md
    - public/data/modules/account-access/lessons/ps-ad.md
    - public/data/modules/account-access/lessons/access-policy.md
    - public/data/modules/account-access/quizzes/01.json
    - public/data/modules/account-access/exercises/01.json
    - public/data/modules/account-access/scenarios/01.json
  modified: []
decisions:
  - "CIP-004 disclaimer in intro.md (per D-12): personnel and training access mandate aligns with TSA access control"
  - "CIP-006 disclaimer in access-policy.md (per D-12): physical security boundary aligns with logical access restrictions"
  - "svc-pipeline-backup as Domain Admins insider escalation actor (per D-08 scenario design)"
  - "Lesson prose uses 'the current TSA pipeline security directive' — no hardcoded SD-02F version strings"
metrics:
  duration_minutes: 18
  completed_date: "2026-05-16"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 7 Plan 02: Account & Access Management Module Content Summary

**One-liner:** Full vertical slice for MOD-03 — three AD/access-policy lessons, a 4-step AD audit exercise (Get-ADGroupMember through Get-LocalGroupMember), 3-question least-privilege quiz, and a 2-phase insider privilege escalation scenario using svc-pipeline-backup.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author three Account & Access Management lesson Markdown files | be96fa3 | intro.md, ps-ad.md, access-policy.md |
| 2 | Author quiz, exercise, and scenario JSON files | a44cfae | quizzes/01.json, exercises/01.json, scenarios/01.json |

## What Was Built

**Lesson 1 — intro.md (Pattern A, scenario-host):**
Covers why account and access control matters in pipeline OT environments, how to query AD for privileged accounts (Get-ADGroupMember, Get-ADUser SPN filter), key access control principles table, an OT callout on air-gapped service account auditing, and the CIP-004 NERC CIP disclaimer per D-12.

**Lesson 2 — ps-ad.md (Pattern B, exercise-host):**
Four dedicated sections matching the D-05 exercise commands: auditing Domain Admins (Get-ADGroupMember), finding service accounts by SPN (Get-ADUser -Filter ServicePrincipalName), checking svc-historian's group memberships (Get-ADPrincipalGroupMembership), and auditing local Administrators (Get-LocalGroupMember). OT callout covers vendor default accounts and air-gapped local admin auditing.

**Lesson 3 — access-policy.md (Pattern C, quiz-host, quizId: '01'):**
Service account policy framework (one account per service, minimum permissions, no interactive logon, PAM password management), quarterly access review checklist table, GPO enforcement (Get-GPResultantSetOfPolicy), OT callout on air-gapped local account password rotation, and CIP-006 NERC CIP disclaimer per D-12.

**Quiz — quizzes/01.json (account-access-quiz-01):**
- q-01 (NIST-AC-2): Which cmdlet retrieves Domain Admins members — correct: Get-ADGroupMember
- q-02 (NIST-AC-6): svc-historian found in Domain Admins — correct: investigate then remove and restrict
- q-03 (TSA-AccessControl, NIST-AC-2): Which cmdlet finds SPN service accounts — correct: Get-ADUser -Filter {ServicePrincipalName -like '*'}

**Exercise — exercises/01.json (account-access-ex-01):**
Four steps following D-05 exactly:
1. Get-ADGroupMember -Identity 'Domain Admins' — success output shows Administrator and svc-pipeline-backup
2. Get-ADUser -Filter {ServicePrincipalName -like '*'} — success output shows SVC-Historian and SVC-Pipeline-Backup with their SPNs
3. Get-ADPrincipalGroupMembership -Identity svc-historian — success output shows Domain Users and Historian-DataReaders only (correct, no privilege violation)
4. Get-LocalGroupMember -Group 'Administrators' — success output shows PIPELINE-DC01\Administrator, EXAMPLECORP\Domain Admins, EXAMPLECORP\svc-pipeline-backup

**Scenario — scenarios/01.json (account-access-scenario-01):**
"Unauthorized Privilege Escalation on PIPELINE-DC01" — D-08 design exactly:
- Narrative: svc-pipeline-backup found in Domain Admins, added 3 days ago, no change request; OT paragraph on domain-wide exposure risk
- Phase 1 "Detection": opt-a (wrong: remove immediately — destroys forensic value), opt-b (correct: investigate via Event ID 4728 first)
- Phase 2 "Remediation": opt-a (correct: remove + password reset + preserve evidence + notify TSA), opt-b (wrong: remove + reset but no TSA notification — compliance violation)

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met.

## Verification Results

All verification checks passed:
- `node -e` lesson OT callout check: 3/3 lessons OK
- `node -e` schema validation script: "All schema assertions passed"
- `grep [!OT]`: 3 matches (one per lesson)
- `grep "NERC CIP governs electric utilities"`: 2 matches (intro CIP-004, access-policy CIP-006)
- `grep "scenarioId\|exerciseId"` in lessons/: 0 matches (correct — not in .md frontmatter)
- JSON parse check: all 3 JSON files valid
- `npm test`: 167/167 tests green (1 todo)

## Known Stubs

None. All 6 files are fully authored with realistic content — no placeholder text, no empty fields, no TODO markers.

## Threat Flags

None. Content files introduce no new network endpoints, auth paths, or schema changes. All fictional identifiers (svc-historian, svc-pipeline-backup, PIPELINE-DC01, ExampleCorp) are generic per CLAUDE.md. T-07-08 (NERC CIP framing spoofing) mitigated by verbatim disclaimer in both intro.md (CIP-004) and access-policy.md (CIP-006) as required by the plan's threat register.

## Self-Check: PASSED

- public/data/modules/account-access/lessons/intro.md: FOUND
- public/data/modules/account-access/lessons/ps-ad.md: FOUND
- public/data/modules/account-access/lessons/access-policy.md: FOUND
- public/data/modules/account-access/quizzes/01.json: FOUND
- public/data/modules/account-access/exercises/01.json: FOUND
- public/data/modules/account-access/scenarios/01.json: FOUND
- Commit be96fa3: FOUND
- Commit a44cfae: FOUND
