---
status: partial
phase: 08-patch-management-module-mod-05
source: [08-VERIFICATION.md]
started: 2026-05-17T12:00:00Z
updated: 2026-05-17T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Patch Management module sidebar renders 3 lessons
expected: Navigate to #/module/patch-management — sidebar shows 3 lessons: "Windows Update and WSUS", "OT/ICS Patching in Air-Gapped Environments", "Patch Management Policy and Compliance Documentation"
result: [pending]

### 2. OT Patching lesson shows Exercise and Scenario buttons
expected: Click "OT/ICS Patching in Air-Gapped Environments" — lesson view shows both an Exercise button (linking to the 4-step compliance reporting exercise) and a Scenario button (linking to scenario-02)
result: [pending]

### 3. Patch Policy lesson shows Quiz and Scenario buttons
expected: Click "Patch Management Policy and Compliance Documentation" — lesson view shows both a Quiz button (linking to the 3-question quiz) and a Scenario button (linking to scenario-03)
result: [pending]

### 4. WSUS Patching lesson shows Scenario button only
expected: Click "Windows Update and WSUS" — lesson view shows a Scenario button (linking to scenario-01) but no Exercise or Quiz buttons
result: [pending]

### 5. Compliance index shows 3 new MOD-05 control entries
expected: Navigate to #/compliance — three new entries appear: "TSA — Patch Management" (7 items), "NIST SP 800-82 Rev 3 — SI-2: Flaw Remediation" (6 items), "NIST SP 800-82 Rev 3 — MA-2: Controlled Maintenance" (4 items)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
