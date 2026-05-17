---
phase: 08-patch-management-module-mod-05
reviewed: 2026-05-17T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - public/data/compliance-index.json
  - public/data/modules/patch-management/exercises/01.json
  - public/data/modules/patch-management/lessons/ot-patching.md
  - public/data/modules/patch-management/lessons/patch-policy.md
  - public/data/modules/patch-management/lessons/wsus-patching.md
  - public/data/modules/patch-management/quizzes/01.json
  - public/data/modules/patch-management/scenarios/01.json
  - public/data/modules/patch-management/scenarios/02.json
  - public/data/modules/patch-management/scenarios/03.json
  - src/modules-config.js
findings:
  critical: 3
  warning: 3
  info: 1
  total: 7
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-05-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Phase 8 adds the Patch Management module (MOD-05): 3 lesson Markdown files, 1 quiz JSON, 1 exercise JSON, 3 scenario JSON files, a modules-config.js update, and 3 new entries appended to compliance-index.json.

The lesson prose, quiz, scenarios, and exercise structure are generally sound. NERC CIP verbatim disclaimers are present and correct in wsus-patching.md and ot-patching.md. Scenario schema (isFinal/nextPhaseId) is correct across all three scenarios. Exercise matchType/caseSensitive fields are correctly set. The NIST control labels in compliance-index.json are consistent with prior entries.

Three blockers were found: the TSA-PatchMgmt control label in compliance-index.json hardcodes "SD-02F" in violation of the project's single-source-of-truth rule and creates an inconsistency with all other TSA control labels; compliance-index.json is missing scenario entries for NIST-SI-2 (scenarios 01 and 03) and NIST-MA-2 (scenario 03), creating a broken cross-reference where scenario files declare controls that the index does not acknowledge; and ot-patching.md contains an incorrect cross-reference that calls the Incident Response module "Lesson 4" (it is Module 4, not a lesson within patch-management). Three warnings were also found: the step-4 exercise expectedCommands pattern accepts wrong files as success via an overly broad arm; step-3 shows the same false-positive risk; and the Wrench icon in modules-config.js uses PascalCase inconsistently with the naming convention fix applied in the immediately preceding commit.

---

## Critical Issues

### CR-01: Hardcoded "SD-02F" in compliance-index.json label

**File:** `public/data/compliance-index.json:265`
**Issue:** The `TSA-PatchMgmt` control label is `"TSA SD-02F — Patch Management"`. This hardcodes the directive version string in violation of CLAUDE.md's explicit rule: "All version strings live in `data/compliance-refs.json` — never hardcoded." Every other TSA control label omits the version string (e.g., `"TSA — Continuous Monitoring"`, `"TSA — Network Segmentation and Access Control"`). This entry is the only one that embeds the version, creating an inconsistency that will silently become incorrect when the directive version is updated in compliance-refs.json.

**Fix:**
```json
{
  "id": "TSA-PatchMgmt",
  "label": "TSA — Patch Management",
  ...
}
```

---

### CR-02: compliance-index.json missing scenario entries for NIST-SI-2 and NIST-MA-2

**File:** `public/data/compliance-index.json:311-364`
**Issue:** Scenario files declare `complianceControls` arrays that the compliance-index does not reflect:
- `scenarios/01.json` declares `NIST-SI-2` but `NIST-SI-2` in compliance-index has no scenario entries at all.
- `scenarios/03.json` declares `NIST-SI-2` and `NIST-MA-2` but neither control lists scenario 03.
- `NIST-MA-2` lists only scenario 02; scenarios 01 and 03 that reference it are absent.

The compliance index is the data source for the Compliance Index view (`/compliance-index`). Any compliance filter or coverage check driven by `compliance-index.json` will show scenarios 01 and 03 as unreachable from NIST-SI-2, and scenarios 01 and 03 as unreachable from NIST-MA-2 — meaning the compliance coverage for those controls appears lower than it actually is.

**Fix:** Add the missing items to `NIST-SI-2` and `NIST-MA-2` in compliance-index.json:

```json
{
  "id": "NIST-SI-2",
  "label": "NIST SP 800-82 Rev 3 — SI-2: Flaw Remediation",
  "items": [
    { "type": "lesson",    "moduleId": "patch-management", "contentId": "wsus-patching",  "title": "Windows Update and WSUS" },
    { "type": "lesson",    "moduleId": "patch-management", "contentId": "ot-patching",    "title": "OT/ICS Patching in Air-Gapped Environments" },
    { "type": "lesson",    "moduleId": "patch-management", "contentId": "patch-policy",   "title": "Patch Management Policy and Compliance Documentation" },
    { "type": "exercise",  "moduleId": "patch-management", "contentId": "01",             "title": "Patch Compliance Reporting" },
    { "type": "scenario",  "moduleId": "patch-management", "contentId": "01",             "title": "Critical CVE vs. OT Vendor Qualification Window" },
    { "type": "scenario",  "moduleId": "patch-management", "contentId": "03",             "title": "TSA Audit: Missing Compensating Controls Documentation" }
  ]
},
{
  "id": "NIST-MA-2",
  "label": "NIST SP 800-82 Rev 3 — MA-2: Controlled Maintenance",
  "items": [
    { "type": "lesson",   "moduleId": "patch-management", "contentId": "ot-patching",  "title": "OT/ICS Patching in Air-Gapped Environments" },
    { "type": "lesson",   "moduleId": "patch-management", "contentId": "patch-policy", "title": "Patch Management Policy and Compliance Documentation" },
    { "type": "scenario", "moduleId": "patch-management", "contentId": "02",           "title": "Maintenance Window vs. Ops Manager Pressure" },
    { "type": "scenario", "moduleId": "patch-management", "contentId": "03",           "title": "TSA Audit: Missing Compensating Controls Documentation" }
  ]
}
```

---

### CR-03: "Lesson 4" cross-reference in ot-patching.md is wrong

**File:** `public/data/modules/patch-management/lessons/ot-patching.md:58`
**Issue:** The prose reads: "The `C:\Audit\` directory is the standard audit evidence staging path established in this training environment, consistent with the incident response evidence path from **Lesson 4**."

The patch-management module has 3 lessons. There is no Lesson 4 within it. The intended reference is to the Incident Response **module** (Module 4 in the module sequence), not "Lesson 4". A learner reading this will look for a fourth lesson within patch-management and not find one. The confusion is compounded because "lesson" and "module" are both used as navigable units in the application.

**Fix:**
```markdown
consistent with the incident response evidence path from the Incident Response module (Module 4).
```

---

## Warnings

### WR-01: Exercise step-4 expectedCommands pattern accepts wrong files as success

**File:** `public/data/modules/patch-management/exercises/01.json:113`
**Issue:** The third arm of the step-4 regex pattern is `Get-Content.*Audit.*Measure`. This matches any `Get-Content` command with "Audit" anywhere in the path and "Measure" anywhere after it — for example, `Get-Content 'C:\AuditBackup\other.csv' | Measure-Object -Line` or `Get-Content 'C:\Audit\processes.csv' | Measure-Object -Word`. Both are accepted as success despite targeting the wrong file and potentially the wrong measurement. The exercise is specifically verifying that `C:\Audit\patch-status.csv` was created — accepting any Audit-path file bypasses that check entirely.

**Fix:** Tighten the pattern to require `patch-status`:
```json
"pattern": "Get-Content.*patch-status\\.csv.*Measure-Object|Measure-Object.*-Line.*patch-status|Get-Content.*patch-status.*Measure"
```

---

### WR-02: Exercise step-3 expectedCommands pattern accepts partial path as success

**File:** `public/data/modules/patch-management/exercises/01.json:85`
**Issue:** The second arm of the step-3 regex is `Export-Csv.*patch-status`. This matches any `Export-Csv` command that includes "patch-status" anywhere in it — including `Export-Csv 'patch-status-backup.csv'` or `Export-Csv patch-status` (without a path). The required command specifies `C:\Audit\patch-status.csv` and `-NoTypeInformation`. A learner who types `Export-Csv patch-status` without the correct path or the `-NoTypeInformation` flag will be marked successful.

**Fix:** Require both `Get-Hotfix` in the pipeline and the full `patch-status.csv` path:
```json
"pattern": "Get-Hotfix.*Export-Csv.*patch-status\\.csv|Export-Csv.*C:\\\\Audit\\\\patch-status\\.csv"
```

---

### WR-03: modules-config.js Wrench icon uses PascalCase inconsistent with recent fix

**File:** `src/modules-config.js:67`
**Issue:** Commit `cd75239` (immediately before Phase 8) fixed `BookOpen` and `AlertTriangle` to use kebab-case (`book-open`, `alert-triangle`) because Lucide requires kebab-case `data-lucide` attribute values. Phase 8 introduced the patch-management entry with `icon: 'Wrench'` in PascalCase. `sidebar.js` applies `.toLowerCase()` at line 30 (producing `'wrench'`), so rendering does not break — `Wrench` is registered in `src/utils/icons.js`. However this reintroduces the same inconsistency that the prior commit explicitly resolved; `Shield` and `Users` also remain PascalCase from before that fix. The shape contract comment on line 4 of modules-config.js says the icon field is a "Lucide name" without specifying casing, leaving casing undefined for future contributors.

**Fix:** Change `icon: 'Wrench'` to `icon: 'wrench'` to match the established kebab-case pattern. Also apply `shield` and `users` while there to complete the prior fix:
```js
{ id: 'network-hardening', ..., icon: 'shield', ... },
{ id: 'account-access',    ..., icon: 'users',  ... },
{ id: 'patch-management',  ..., icon: 'wrench', ... },
```
Update the shape contract comment to document that icon values must be kebab-case Lucide names.

---

## Info

### IN-01: Exercise step-4 hint-2 pattern has a bare `-Character` alternation arm

**File:** `public/data/modules/patch-management/exercises/01.json:103`
**Issue:** The hint pattern `Measure-Object(?!.*-Line)|Measure-Object\s+-Word|-Character` parses as three alternatives: `Measure-Object(?!.*-Line)`, `Measure-Object\s+-Word`, and the bare string `-Character`. The third arm matches any input containing the substring `-Character` anywhere — unrelated to `Measure-Object`. In a simulated terminal this is low-stakes, but the pattern is logically incorrect and will trigger the hint for any command that happens to contain the string `-Character`.

**Fix:**
```json
"pattern": "Measure-Object(?!.*-Line)|Measure-Object\\s+(-Word|-Character)"
```

---

_Reviewed: 2026-05-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
