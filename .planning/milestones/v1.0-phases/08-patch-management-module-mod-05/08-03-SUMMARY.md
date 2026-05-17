---
phase: 08-patch-management-module-mod-05
plan: "03"
subsystem: content/patch-management/scenarios
tags: [scenarios, patch-management, compliance, ot-security, tsa]
dependency_graph:
  requires: [08-01]
  provides: [patch-management-scenario-01, patch-management-scenario-02, patch-management-scenario-03]
  affects: [module-view, scenario-engine]
tech_stack:
  added: []
  patterns: [2-phase-decision-scenario, ot-callout, generic-identifiers]
key_files:
  created:
    - public/data/modules/patch-management/scenarios/01.json
    - public/data/modules/patch-management/scenarios/02.json
    - public/data/modules/patch-management/scenarios/03.json
  modified: []
decisions:
  - "Scenario narrative structure: main scene-setting prose + In OT environments paragraph in single narrative field, separated by double newline"
  - "scenario-02 phase-2 outcome includes OT environments mention inline (acceptable, narratives also have primary OT callout)"
  - "Merged master before creating scenarios to pull in patch-management/lessons/ from wave-1 plan 08-01"
metrics:
  duration: "15 minutes"
  completed: "2026-05-17T00:00:00Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 8 Plan 03: Patch Management Scenarios Summary

Three 2-phase compliance scenario JSON files authored for MOD-05 (patch-management), covering IT/OT patching tension with a WSUS segmentation fix, change management discipline under ops-manager pressure, and honest TSA audit disclosure vs. falsification risk.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author scenarios/01.json — Critical CVE vs. OT Vendor Qualification Window | f57488a | public/data/modules/patch-management/scenarios/01.json |
| 2 | Author scenarios/02.json and scenarios/03.json | 7da261e | public/data/modules/patch-management/scenarios/02.json, public/data/modules/patch-management/scenarios/03.json |

## What Was Built

### scenarios/01.json — Critical CVE vs. OT Vendor Qualification Window
- **id:** patch-management-scenario-01, on wsus-patching lesson
- **complianceControls:** TSA-PatchMgmt, NIST-SI-2
- **Phase 1 (Discovery):** Historian PIPELINE-HIST01 affected by critical CVE; OEM unqualified; correct answer is compensating controls + vendor notification (not immediate patching)
- **Phase 2 (Aftermath):** IT WSUS auto-pushed to OT workstation outside change window, causing PLC polling crash; correct answer is TSA notification + WSUS segmentation as architectural fix (per D-04)

### scenarios/02.json — Maintenance Window vs. Ops Manager Pressure
- **id:** patch-management-scenario-02, on ot-patching lesson
- **complianceControls:** TSA-PatchMgmt, NIST-MA-2
- **Phase 1 (Scheduling):** OEM-qualified patch available; ops manager wants to skip scheduled window; correct answer is maintaining the window with updated compensating controls documentation
- **Phase 2 (Maintenance Window):** Patch fails mid-install with frozen dialog; correct answer is roll back to clean state + document failure + reschedule with OEM vendor support engaged (per D-05)

### scenarios/03.json — TSA Audit: Missing Compensating Controls Documentation
- **id:** patch-management-scenario-03, on patch-policy lesson
- **complianceControls:** TSA-PatchMgmt, NIST-SI-2, NIST-MA-2
- **Phase 1 (Audit Request):** Auditor requests docs for 3 deferred patches; 1 missing; correct answer is transparency — present 2 complete records, acknowledge gap, commit to corrective action plan (per D-06)
- **Phase 2 (Remediation):** Incorrect option explicitly identifies back-dating as falsification of compliance records (more serious than the original finding); correct answer is contemporaneous post-audit docs with honest caveats + supervisor sign-off

## Verification Results

All automated verification scripts passed:

- `scenario-01: schema valid` — node validation exit 0
- `scenario-02: schema valid` — node validation exit 0
- `scenario-03: schema valid` — node validation exit 0
- `all 3 scenarios valid JSON` — JSON.parse exit 0 for all 3
- "In OT environments" present in all 3 narrative fields
- Generic identifiers confirmed: PIPELINE-HIST01, ExampleCorp throughout; no real hostnames or production IPs

## Deviations from Plan

None — plan executed exactly as written. Merged master branch before task execution to pull in wave-1 (08-01) lesson files and create the patch-management directory structure.

## Known Stubs

None.

## Threat Flags

None. All scenario content is static read-only JSON served over GitHub Pages CDN. No new network endpoints, auth paths, or trust boundaries introduced. All string fields use generic identifiers (no PII, no real credentials). XSS mitigated at render time by scenario-engine esc() wrapper (existing, pre-phase mitigation T-08-10).

## Self-Check: PASSED

- public/data/modules/patch-management/scenarios/01.json exists: FOUND
- public/data/modules/patch-management/scenarios/02.json exists: FOUND
- public/data/modules/patch-management/scenarios/03.json exists: FOUND
- Commit f57488a exists: FOUND
- Commit 7da261e exists: FOUND
