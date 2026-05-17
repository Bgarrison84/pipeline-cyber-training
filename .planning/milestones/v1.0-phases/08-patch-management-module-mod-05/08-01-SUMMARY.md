---
phase: 08-patch-management-module-mod-05
plan: "01"
subsystem: content
tags: [patch-management, lessons, mod-05, OT, WSUS, compliance]
dependency_graph:
  requires:
    - Phase 7 lesson authoring patterns (MOD-02/03/04 established canonical formats)
    - logging-auditing lesson templates (intro.md, ps-logging.md, audit-policies.md)
  provides:
    - public/data/modules/patch-management/lessons/wsus-patching.md
    - public/data/modules/patch-management/lessons/ot-patching.md
    - public/data/modules/patch-management/lessons/patch-policy.md
  affects:
    - Plan 08-02 (quiz + exercise + scenarios reference these lesson IDs)
    - Plan 08-03 (modules-config.js will wire these lesson files)
tech_stack:
  added: []
  patterns:
    - Lesson Markdown frontmatter with complianceControls array
    - OT callout block syntax (> [!OT])
    - NERC CIP verbatim disclaimer in CIP-referencing lessons
    - PS 5.1 code blocks with NIST control comment header
key_files:
  created:
    - public/data/modules/patch-management/lessons/wsus-patching.md
    - public/data/modules/patch-management/lessons/ot-patching.md
    - public/data/modules/patch-management/lessons/patch-policy.md
  modified: []
decisions:
  - "CIP-007 placed in wsus-patching (L1) per D-02; CIP-010 placed in ot-patching (L2) per D-02; patch-policy (L3) has no NERC CIP disclaimer as specified"
  - "quizId: '01' appears only in patch-policy.md frontmatter; no scenarioId or exerciseId in any lesson .md (all content IDs live in modules-config.js only)"
  - "PIPELINE-HIST01 used consistently as the OT historian hostname for risk scenarios across all three lessons"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-17"
  tasks_completed: 3
  files_created: 3
  files_modified: 0
---

# Phase 8 Plan 01: Patch Management Lesson Content (MOD-05) Summary

**One-liner:** Three Patch Management lesson Markdown files authored — Windows/IT patching (WSUS), OT/ICS air-gapped patching (offline media, OEM qualification, 3-12 month cycles), and policy/compliance documentation (compensating controls, audit evidence, quiz host).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author wsus-patching.md — Windows Update and WSUS (L1) | 6050c17 | public/data/modules/patch-management/lessons/wsus-patching.md |
| 2 | Author ot-patching.md — OT/ICS Patching in Air-Gapped Environments (L2) | 9261e7c | public/data/modules/patch-management/lessons/ot-patching.md |
| 3 | Author patch-policy.md — Patch Management Policy and Compliance Documentation (L3) | a2501ee | public/data/modules/patch-management/lessons/patch-policy.md |

## Verification Results

All 6 plan-level checks passed:

1. OT callout count: **3** (one per file) — PASS
2. NERC CIP disclaimer count: **2** (wsus-patching + ot-patching) — PASS
3. SD-02F hardcoded string: **0** occurrences — PASS
4. scenarioId/exerciseId in .md frontmatter: **0** occurrences — PASS
5. quizId appears in patch-policy only: confirmed — PASS
6. All 3 lesson files exist under `public/data/modules/patch-management/lessons/` — PASS

Individual automated verify scripts (per-task `node -e` commands) all exited 0.

## File Details

### wsus-patching.md (L1 — scenario host)

- **lessonId:** wsus-patching | **order:** 1 | **complianceControls:** [TSA-PatchMgmt, NIST-SI-2]
- Sections: What Is Patch Management?, Windows Update and WSUS Basics, Identifying Overdue Patches, WSUS and IT/OT Segmentation
- PS 5.1 code blocks: `Get-Hotfix | Select-Object ... | Sort-Object InstalledOn -Descending`, `Get-WmiObject Win32_QuickFixEngineering` with date filter, `New-Object -ComObject Microsoft.Update.ServiceManager`
- OT callout: WSUS target group segmentation risk for PIPELINE-HIST01 with registry verification command
- NERC CIP disclaimer: CIP-007 R2 35-day patch assessment mandate
- Closes with preview of Lesson 2 (OT air-gapped workflow)

### ot-patching.md (L2 — exercise host)

- **lessonId:** ot-patching | **order:** 2 | **complianceControls:** [TSA-PatchMgmt, NIST-SI-2, NIST-MA-2]
- Sections: Why OT Patching Is Different, The OT Patch Approval Workflow, Offline Media Staging, Generating Patch Compliance Evidence with PowerShell
- Addresses all Roadmap §2 sub-items: offline media staging, OEM patch qualification requirements, 3-12 month vendor approval cycles, compensating controls documentation
- PS 5.1 code block: `Get-FileHash 'D:\OTPatchStaging\KB5034441.msu' -Algorithm SHA256` for hash verification before staging
- Exercise preview: all 4 compliance reporting commands (Get-Hotfix, Get-WmiObject, Export-Csv, Get-Content/Measure-Object)
- OT callout: air-gap integrity for C:\Audit\ export path (no UNC paths from OT hosts)
- NERC CIP disclaimer: CIP-010 R2 configuration change management

### patch-policy.md (L3 — quiz host)

- **lessonId:** patch-policy | **order:** 3 | **quizId:** '01' | **complianceControls:** [TSA-PatchMgmt, NIST-SI-2, NIST-MA-2]
- Sections: The Role of Patch Policy in Compliance, Compensating Controls Documentation, Audit Evidence Requirements, Policy Timelines and Escalation
- Policy timeline table: 5 scenarios spanning IT critical/high CVEs, OT CVEs, failed installs, and missed windows with TSA notification obligation
- PS 5.1 code blocks: `Get-Hotfix | Export-Csv` and `Get-Content ... | Measure-Object -Line` matching exercise step-3 and step-4 commands exactly
- Compensating controls: 4 required elements (written, named approver, review interval, retirement)
- OT callout: compensating controls as most-common TSA audit finding; ticketing system evidence chain
- No NERC CIP disclaimer (per D-02 decision — CIP references placed only in L1 and L2)

## Deviations from Plan

None — plan executed exactly as written. All content rules, frontmatter field requirements, identifier constraints, and NERC CIP placement decisions (D-02) followed without deviation.

## Known Stubs

None. All three lesson files are complete content — no placeholder text, no hardcoded empty values, no TODO markers.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Files are static Markdown served read-only via GitHub Pages CDN. Threat flags T-08-01 through T-08-04 (defined in plan frontmatter) verified:

- T-08-03 (NERC CIP spoofing): verbatim disclaimer present in wsus-patching.md and ot-patching.md — MITIGATED
- T-08-04 (TSA version hardcoding): no "SD-02F" string in any lesson prose — MITIGATED

## Self-Check: PASSED

- [x] `public/data/modules/patch-management/lessons/wsus-patching.md` exists — commit 6050c17
- [x] `public/data/modules/patch-management/lessons/ot-patching.md` exists — commit 9261e7c
- [x] `public/data/modules/patch-management/lessons/patch-policy.md` exists — commit a2501ee
- [x] All commits present in git log
