---
phase: 07-core-module-content-mod-02-mod-03-mod-04
reviewed: 2026-05-16T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - public/data/compliance-index.json
  - public/data/modules/account-access/exercises/01.json
  - public/data/modules/account-access/lessons/access-policy.md
  - public/data/modules/account-access/lessons/intro.md
  - public/data/modules/account-access/lessons/ps-ad.md
  - public/data/modules/account-access/quizzes/01.json
  - public/data/modules/account-access/scenarios/01.json
  - public/data/modules/incident-response/exercises/01.json
  - public/data/modules/incident-response/lessons/intro.md
  - public/data/modules/incident-response/lessons/ir-procedures.md
  - public/data/modules/incident-response/lessons/ps-ir.md
  - public/data/modules/incident-response/quizzes/01.json
  - public/data/modules/incident-response/scenarios/01.json
  - public/data/modules/network-hardening/exercises/01.json
  - public/data/modules/network-hardening/lessons/firewall-policy.md
  - public/data/modules/network-hardening/lessons/intro.md
  - public/data/modules/network-hardening/lessons/ps-firewall.md
  - public/data/modules/network-hardening/quizzes/01.json
  - public/data/modules/network-hardening/scenarios/01.json
  - src/modules-config.js
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-05-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

This phase authors three complete training modules (MOD-02 Network Hardening, MOD-03 Account & Access Management, MOD-04 Incident Response) as static content files. The structural requirements — frontmatter fields, OT callout blocks, NERC CIP disclaimers, quiz/exercise/scenario shape constraints — are met across all three modules. No hardcoded TSA version strings appear in lesson prose for the new modules. All generic identifier rules (PIPELINE-DC01, ExampleCorp, 10.0.0.0/24) are followed. All scenarios have the correct two-phase structure. All quizzes have exactly 3 questions with 4 answers each and exactly 1 correct answer per question.

Two blockers were found. First, `compliance-index.json` hardcodes the TSA directive version string "SD-02F" directly in its `label` fields, violating the DATA-01 single-source requirement. Second, the `Get-NetFirewallRule ... | Select-Object LocalPort` command pattern used throughout the network-hardening module is technically incorrect — `LocalPort` is not a direct property on firewall rule objects in PowerShell, meaning the column will be empty on any real system where a learner tries it.

Two warnings were found: a factually wrong process path in the incident-response exercise simulated output (a `.dll` shown as a process Path, which cannot happen), and the account-access exercise step-1 silently presenting a compromised Domain Admins state (svc-pipeline-backup as a member) with no instructional framing — a learner running the quarterly review exercise would see a misconfigured output with no explanation that this is a deliberate "bad state to find."

---

## Critical Issues

### CR-01: `Get-NetFirewallRule` Does Not Expose `LocalPort` as a Direct Property

**File:** `public/data/modules/network-hardening/lessons/ps-firewall.md:17`
**Also affects:** `public/data/modules/network-hardening/lessons/firewall-policy.md:42`, `public/data/modules/network-hardening/exercises/01.json:31` (feedbackOnWrong)

**Issue:** `Get-NetFirewallRule` returns `NetFirewallRule` objects. `LocalPort` is NOT a property of these objects — it belongs to the associated `NetFirewallPortFilter` object, which must be retrieved separately via `Get-NetFirewallPortFilter` (or its alias pipeline `Get-NetFirewallRule | Get-NetFirewallPortFilter`). Piping to `Select-Object DisplayName, LocalPort, Action` will produce a table where the `LocalPort` column is entirely blank for every rule. The lesson teaches this as the authoritative command for auditing inbound allow rules, so a learner who tries it on a real system will see empty LocalPort values and either conclude their system has no port filters, or that the command is broken. The exercise `feedbackOnWrong` at line 31 repeats the same incorrect command.

The exercise `successOutput` at step-1 shows `LocalPort` values (445, 5985, 3389, etc.) because it is canned output — the simulator hides the bug. The lesson prose at line 20 then explicitly says "The `LocalPort` column identifies which port is exposed," reinforcing the false expectation.

**Fix:**
```powershell
# Correct approach to get firewall rules WITH their associated port numbers:
Get-NetFirewallRule -Enabled True | Where-Object {$_.Direction -eq 'Inbound'} |
    Get-NetFirewallPortFilter |
    Select-Object -Property InstanceID, LocalPort, Protocol

# Or join them for DisplayName + LocalPort together:
Get-NetFirewallRule -Enabled True | Where-Object {$_.Direction -eq 'Inbound'} |
    ForEach-Object {
        $filter = $_ | Get-NetFirewallPortFilter
        [PSCustomObject]@{
            DisplayName = $_.DisplayName
            LocalPort   = $filter.LocalPort
            Action      = $_.Action
            Profile     = $_.Profile
        }
    }
```

Update the following locations:
- `ps-firewall.md` line 17: replace single-pipe pattern with the joined approach above
- `ps-firewall.md` line 20: update prose to explain the two-object model
- `firewall-policy.md` line 42: same correction
- `exercises/01.json` line 31 (`feedbackOnWrong`): update the remediation command

---

### CR-02: `compliance-index.json` Hardcodes TSA Version String in Label Fields

**File:** `public/data/compliance-index.json:7,55,121,187`

**Issue:** Four `"label"` fields contain the literal string `"TSA SD-02F"`:
- Line 7: `"label": "TSA SD-02F — Continuous Monitoring"`
- Line 55: `"label": "TSA SD-02F — Network Segmentation and Access Control"`
- Line 121: `"label": "TSA SD-02F — Access Control Management"`
- Line 187: `"label": "TSA SD-02F — Cybersecurity Incident Response"`

REQUIREMENTS.md DATA-01 states: *"TSA directive version strings (e.g. 'SD-02F') are stored in a single `data/compliance-refs.json` file — never hardcoded in lesson content."* CLAUDE.md critical facts state: *"TSA directive is currently SD-02F (not SD-02C). All version strings live in `data/compliance-refs.json` — never hardcoded."*

When the TSA directive version changes (e.g., SD-02G), these four labels must be manually updated in `compliance-index.json` in addition to `compliance-refs.json`. The single-source guarantee is broken. These labels are rendered directly in the compliance index page UI, so users would see a stale version string.

**Fix:** Read the TSA directive version from `compliance-refs.json` at render time rather than embedding it in `compliance-index.json`. Two viable approaches:

Option A — remove the version from label fields and compose it at render time:
```json
{ "id": "TSA-NetworkSeg", "label": "TSA — Network Segmentation and Access Control", ... }
```
Then in the compliance-index-view renderer, look up the TSA directive version from `compliance-refs.json` and prepend it when displaying labels for TSA controls.

Option B — replace the literal version string with a token:
```json
{ "id": "TSA-NetworkSeg", "label": "{TSA_VERSION} — Network Segmentation and Access Control", ... }
```
And substitute the token at render time using the value from `compliance-refs.json`.

Option A is simpler. The key constraint is that `compliance-index.json` label fields must not contain the literal `SD-02F` string.

---

## Warnings

### WR-01: Simulated Process Output Shows a DLL as a Process Executable Path

**File:** `public/data/modules/incident-response/exercises/01.json:30`

**Issue:** The `successOutput` for step-1 includes this row:
```
RdpCoreTS              3120     0.50 C:\Windows\System32\RdpCoreTS.dll
```

On Windows, `Get-Process` returns the `Path` of the host executable, not a DLL. `RdpCoreTS.dll` is the Remote Desktop core transport DLL loaded by `svchost.exe` or `TermService`. The process would appear as `svchost` with `Path: C:\Windows\System32\svchost.exe`, not as `RdpCoreTS` with a `.dll` path. A `.dll` file cannot be a process image — Windows requires an `.exe` as the process host. A learner who knows Windows internals will identify this as incorrect, undermining trust in the lesson's technical accuracy.

The exercise teaches how to identify ransomware via suspicious process paths (processes in temp directories, processes with no path). Having a technically impossible path in the "normal" process list erodes the teaching example.

**Fix:** Replace the `RdpCoreTS` row with a real Windows process path:
```
svchost                3120     0.50 C:\Windows\System32\svchost.exe
```
Or, if RDP-related context is desired, use the actual host: `TermService` runs inside `svchost.exe`.

---

### WR-02: Exercise Step-1 Silently Presents a Compromised Domain Admins State Without Instructional Framing

**File:** `public/data/modules/account-access/exercises/01.json:30`

**Issue:** Step-1 (`successOutput`) shows `SVC-Pipeline-Backup` as a member of Domain Admins:
```
name              : SVC-Pipeline-Backup
objectClass       : user
SamAccountName    : svc-pipeline-backup
```

The exercise `context` field (line 6-7) describes this as a "quarterly access review" on a system where you are a domain administrator. There is no instruction, hint, or feedback text indicating that finding `svc-pipeline-backup` in Domain Admins is the anomaly to detect. The `instruction` for step-1 simply says "Enumerate all members of the Domain Admins group. List their Name and SamAccountName." — it does not prompt the learner to assess whether the result is compliant.

A learner completing this exercise as a rote command-practice task will type the command, see the output, get the "success" response, and move on without registering that `svc-pipeline-backup` should not be in Domain Admins. This matters because step-1 is supposed to build the learner's ability to identify privileged group anomalies — but the exercise design only rewards command execution, not interpretation.

By contrast, the scenario (scenarios/01.json) correctly frames this same finding as an anomaly requiring investigation.

**Fix:** Add an instructional note in the `instruction` or `feedbackOnWrong` field to prompt interpretation:
```json
"instruction": "Enumerate all members of the Domain Admins group. List their Name and SamAccountName. Review the output: which accounts are expected, and which appear anomalous?",
```
Or add a `successFeedback` field (if the engine supports it) explaining what the output reveals:
```
"Review the output: SVC-Pipeline-Backup appears in Domain Admins. A backup service account has no legitimate reason for Domain Admin membership — this is the finding a quarterly review should surface."
```

---

## Info

### IN-01: `modules-config.js` Comment Describes the File as a "Phase 1 Placeholder" — Now Inaccurate

**File:** `src/modules-config.js:2-3`

**Issue:** Lines 2-3 read:
```javascript
// Static module metadata for Phase 1 placeholder views.
// Phase 2 replaces this with: fetch(import.meta.env.BASE_URL + 'data/modules/index.json')
```

The file is now the active module registry for all five modules through Phase 7, with real lesson IDs. The "Phase 1 placeholder" description and the "Phase 2 replaces this" comment are stale. Phase 2 did not replace this file — it remains the source of truth for lesson routing. This comment will mislead anyone maintaining the file about whether the content here is authoritative or temporary.

**Fix:** Update the header comment to reflect the current role:
```javascript
// src/modules-config.js
// Active module registry — lesson IDs, titles, and activity associations (scenarioId/exerciseId/quizId).
// Shape contract: id, title, icon (Lucide name), description, order,
//                 estimatedMinutes, lessons[]{id, title}, complianceTags[]
```

---

_Reviewed: 2026-05-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
