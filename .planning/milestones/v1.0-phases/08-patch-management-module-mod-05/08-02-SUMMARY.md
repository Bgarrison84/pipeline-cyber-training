---
phase: 08-patch-management-module-mod-05
plan: "02"
subsystem: content-data
tags: [patch-management, quiz, exercise, assessment, compliance-reporting]
dependency_graph:
  requires: [08-01]
  provides: [patch-management-quiz-01, patch-management-ex-01]
  affects: [quiz-engine.js, terminal-engine.js]
tech_stack:
  added: []
  patterns: [quiz-json-schema, exercise-json-schema, regex-expectedCommands]
key_files:
  created:
    - public/data/modules/patch-management/quizzes/01.json
    - public/data/modules/patch-management/exercises/01.json
  modified: []
decisions:
  - "Used Get-WmiObject Win32_QuickFixEngineering (not Get-Hotfix) for step-2 date filtering because its InstalledOn is a string allowing [datetime] cast, matching D-07 verbatim"
  - "step-2 expectedCommands pattern accepts both QuickFixEngineering.*AddDays(-90) and QuickFixEngineering.*-90 to handle users who omit the outer ()"
  - "hintPatterns use regex anchoring where needed (e.g. \\s*$ for bare commands) to give context-sensitive hints without false positives"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-17"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 08 Plan 02: Patch Management Quiz and Exercise Summary

## One-liner

3-question quiz spanning Windows/IT patching, OT/ICS patching, and compliance reporting sub-areas; plus 4-step terminal exercise for patch compliance reporting using Get-Hotfix, Win32_QuickFixEngineering, Export-Csv, and Measure-Object.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author quizzes/01.json — Patch Management Knowledge Check | a68563c | public/data/modules/patch-management/quizzes/01.json |
| 2 | Author exercises/01.json — 4-step Patch Compliance Reporting Exercise | a3d92a5 | public/data/modules/patch-management/exercises/01.json |

## Artifacts Created

### public/data/modules/patch-management/quizzes/01.json

- id: `patch-management-quiz-01`, moduleId: `patch-management`
- 3 questions, 4 answers each, 1 correct per question
- q-01 (NIST-SI-2): Get-Hotfix vs PSWindowsUpdate module cmdlets — tests Windows/IT patching knowledge
- q-02 (TSA-PatchMgmt, NIST-MA-2): OEM vendor qualification workflow for PIPELINE-HIST01 historian — tests OT/ICS patching sub-area
- q-03 (TSA-PatchMgmt, NIST-SI-2): Get-Hotfix | Export-Csv audit artifact generation — tests compliance reporting sub-area
- All correct answer feedbacks start with "Correct." per schema convention
- Distractors include plausible-but-wrong alternatives (PSWindowsUpdate module cmdlets, WinEvent Event ID 19, Get-Process)

### public/data/modules/patch-management/exercises/01.json

- id: `patch-management-ex-01`, moduleId: `patch-management`
- 4 steps matching D-07 commands exactly
- step-1: Get-Hotfix | Select-Object HotFixID, Description, InstalledOn | Sort-Object InstalledOn -Descending
- step-2: Get-WmiObject Win32_QuickFixEngineering | Where-Object {$_.InstalledOn} | Where-Object {[datetime]$_.InstalledOn -lt (Get-Date).AddDays(-90)}
- step-3: Get-Hotfix | Export-Csv 'C:\Audit\patch-status.csv' -NoTypeInformation
- step-4: Get-Content 'C:\Audit\patch-status.csv' | Measure-Object -Line
- Canned output uses KB5035849, KB5034441, KB5031364, KB5028997, KB5026368 (plausible Windows Server 2019 KB formats)
- step-2 successOutput shows KB5028997 and KB5026368 as overdue security updates requiring compensating controls documentation
- step-3 successOutput includes the "Verify with:" hint to reinforce step-4 workflow
- step-4 successOutput shows line count of 6 (1 header + 5 patch records) confirming audit artifact integrity
- All expectedCommands: matchType "regex", caseSensitive false
- 3 hintPatterns per step covering near-miss commands and common wrong paths

## Verification Results

All verification scripts passed:

1. Quiz validation: `quiz schema valid — 3 questions, 4 answers each, 1 correct per question`
2. Exercise validation: `exercise schema valid — 4 steps, all required fields present, D-07 command patterns verified`
3. JSON.parse: `JSON valid`
4. Grep check quiz: `1` (patch-management-quiz-01 found exactly once)
5. Grep check exercise: `1` (patch-management-ex-01 found exactly once)

## Compliance Coverage

| Control ID | Label | Coverage in this plan |
|------------|-------|----------------------|
| TSA-PatchMgmt | TSA SD-02F — Patch Management | q-02, q-03 (quiz); all 4 exercise steps |
| NIST-SI-2 | NIST SP 800-82 Rev 3 — SI-2: Flaw Remediation | q-01, q-03 (quiz); all 4 exercise steps |
| NIST-MA-2 | NIST SP 800-82 Rev 3 — MA-2: Controlled Maintenance | q-02 (quiz) |

## Deviations from Plan

None — plan executed exactly as written. Both JSON files match the schemas, all D-07 commands are represented, compliance controls span all 3 MOD-05 sub-areas as specified.

## Known Stubs

None — both files are fully wired content consumed directly by quiz-engine.js and terminal-engine.js with no placeholder values.

## Threat Flags

No new threat surface introduced. Files are static JSON served read-only via GitHub Pages CDN, consumed by existing quiz-engine.js and terminal-engine.js with esc() applied to all string fields at render time per the threat model (T-08-05, T-08-06, T-08-07).

## Self-Check

File existence:
- public/data/modules/patch-management/quizzes/01.json: FOUND
- public/data/modules/patch-management/exercises/01.json: FOUND

Commits:
- a68563c: FOUND (feat(08-02): author patch-management quiz)
- a3d92a5: FOUND (feat(08-02): author patch-management 4-step compliance reporting exercise)

## Self-Check: PASSED
