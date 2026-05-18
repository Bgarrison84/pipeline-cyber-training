# SME Review Checklist — Pipeline Cyber Training

> **Instructions:** After reviewing each file for control mapping accuracy, fill in
> the "Last Reviewed" date (YYYY-MM-DD) and your name/initials in the "Reviewer" column.
> This document covers all content artifacts in v2.0 Phase 9 final state.

---

## Module 1: Logging & Auditing

### Lessons

| File | Control Mapping | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| lessons/intro.md | TSA-Monitoring, NIST-AU-2, NIST-AU-3 | | |
| lessons/ps-logging.md | TSA-Monitoring, NIST-AU-12, NIST-CM-6 | | |
| lessons/audit-policies.md | TSA-Monitoring, NIST-AU-12, NIST-AU-2 | | |
| lessons/04-ot-logging-advanced.md | TSA-Monitoring, NIST-AU-9 | | |
| lessons/05-siem-integration.md | TSA-Monitoring, NIST-SI-4 | | |

### Quizzes

| File | Questions | Last Reviewed | Reviewer |
|------|-----------|---------------|----------|
| quizzes/01.json | 3 questions (Event IDs, log retention, policy) | | |
| quizzes/02.json | 3 questions (advanced topics — new in Phase 9) | | |

### Exercises

| File | Command Coverage | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| exercises/01.json | Enable-PSScriptBlockLogging, Get-WinEvent | | |

### Scenarios

| File | Decision Points | Last Reviewed | Reviewer |
|------|----------------|---------------|----------|
| scenarios/01.json | 2-phase: suspicious login investigation | | |
| scenarios/02.json | 2-phase: OT/IT log retention decision (new in Phase 9) | | |

---

## Module 2: Network Hardening

### Lessons

| File | Control Mapping | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| lessons/intro.md | TSA-NetworkSeg, NIST-SC-7 | | |
| lessons/ps-firewall.md | TSA-NetworkSeg, NIST-SC-7, NIST-SI-3 | | |
| lessons/firewall-policy.md | TSA-NetworkSeg, NIST-SC-7 | | |
| lessons/04-ot-network-zones.md | TSA-NetworkSeg, NIST-SC-7 | | |
| lessons/05-vpn-remote-access.md | TSA-NetworkSeg, NIST-SC-7, NIST-AC-17 | | |

### Quizzes

| File | Questions | Last Reviewed | Reviewer |
|------|-----------|---------------|----------|
| quizzes/01.json | 3 questions (firewall rules, segmentation, OT zones) | | |
| quizzes/02.json | 3 questions (advanced topics — new in Phase 9) | | |

### Exercises

| File | Command Coverage | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| exercises/01.json | Get-NetFirewallRule, New-NetFirewallRule, Test-NetConnection | | |

### Scenarios

| File | Decision Points | Last Reviewed | Reviewer |
|------|----------------|---------------|----------|
| scenarios/01.json | 2-phase: unauthorized inbound rule investigation | | |
| scenarios/02.json | 2-phase: OT network segmentation decision (new in Phase 9) | | |

---

## Module 3: Account & Access Management

### Lessons

| File | Control Mapping | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| lessons/intro.md | TSA-AccessControl, NIST-AC-2 | | |
| lessons/ps-ad.md | TSA-AccessControl, NIST-AC-2 | | |
| lessons/access-policy.md | TSA-AccessControl, NIST-AC-6 | | |
| lessons/04-service-accounts.md | TSA-AccessControl, NIST-AC-6, NIST-IA-5 | | |
| lessons/05-mfa-privileged.md | TSA-AccessControl, NIST-IA-2 | | |

### Quizzes

| File | Questions | Last Reviewed | Reviewer |
|------|-----------|---------------|----------|
| quizzes/01.json | 3 questions (least privilege, service accounts, password policy) | | |
| quizzes/02.json | 3 questions (advanced topics — new in Phase 9) | | |

### Exercises

| File | Command Coverage | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| exercises/01.json | Get-ADUser, Get-ADGroupMember, Set-ADAccountPassword | | |

### Scenarios

| File | Decision Points | Last Reviewed | Reviewer |
|------|----------------|---------------|----------|
| scenarios/01.json | 2-phase: overprivileged service account investigation | | |
| scenarios/02.json | 2-phase: contractor access provisioning decision (new in Phase 9) | | |

---

## Module 4: Incident Response

### Lessons

| File | Control Mapping | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| lessons/intro.md | TSA-IR, NIST-IR-4 | | |
| lessons/ps-ir.md | TSA-IR, NIST-AU-12 | | |
| lessons/ir-procedures.md | TSA-IR, NIST-IR-4 | | |
| lessons/04-containment-ot.md | TSA-IR, NIST-IR-4, NIST-CP-10 | | |
| lessons/05-post-incident.md | TSA-IR, NIST-IR-4, NIST-IR-5 | | |

### Quizzes

| File | Questions | Last Reviewed | Reviewer |
|------|-----------|---------------|----------|
| quizzes/01.json | 3 questions (incident classification, evidence, containment) | | |
| quizzes/02.json | 3 questions (advanced topics — new in Phase 9) | | |

### Exercises

| File | Command Coverage | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| exercises/01.json | Get-Process, Get-NetTCPConnection, Export-Csv | | |

### Scenarios

| File | Decision Points | Last Reviewed | Reviewer |
|------|----------------|---------------|----------|
| scenarios/01.json | 2-phase: active intrusion triage and isolation | | |
| scenarios/02.json | 2-phase: OT system isolation decision (new in Phase 9) | | |

---

## Module 5: Patch Management

### Lessons

| File | Control Mapping | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| lessons/wsus-patching.md | TSA-PatchMgmt, NIST-SI-2 | | |
| lessons/ot-patching.md | TSA-PatchMgmt, NIST-SI-2, NIST-MA-2 | | |
| lessons/patch-policy.md | TSA-PatchMgmt, NIST-SI-2, NIST-MA-2 | | |
| lessons/04-vulnerability-scanning.md | TSA-PatchMgmt, NIST-RA-5 | | |
| lessons/05-compensating-controls.md | TSA-PatchMgmt, NIST-SI-2, NIST-RA-3 | | |

### Quizzes

| File | Questions | Last Reviewed | Reviewer |
|------|-----------|---------------|----------|
| quizzes/01.json | 3 questions (WSUS, OT cadence, compensating controls) | | |
| quizzes/02.json | 3 questions (advanced topics — new in Phase 9) | | |

### Exercises

| File | Command Coverage | Last Reviewed | Reviewer |
|------|-----------------|---------------|----------|
| exercises/01.json | Get-Hotfix, Get-WmiObject Win32_QuickFixEngineering, Export-Csv | | |

### Scenarios

| File | Decision Points | Last Reviewed | Reviewer |
|------|----------------|---------------|----------|
| scenarios/01.json | 2-phase: WSUS deployment decision | | |
| scenarios/02.json | 2-phase: OT emergency patch workflow | | |
| scenarios/03.json | 2-phase: compensating controls documentation | | |
| scenarios/04.json | 2-phase: patch cycle audit preparation (new in Phase 9) | | |

---

*Checklist generated: 2026-05-17 | Phase 9 final artifact count: 52*
