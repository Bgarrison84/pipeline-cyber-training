# Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04) — Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 23 (21 creates + 2 modifies)
**Analogs found:** 23 / 23

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `public/data/modules/network-hardening/lessons/intro.md` | lesson (scenario-host) | request-response | `public/data/modules/logging-auditing/lessons/intro.md` | exact |
| `public/data/modules/network-hardening/lessons/ps-firewall.md` | lesson (exercise-host) | request-response | `public/data/modules/logging-auditing/lessons/ps-logging.md` | exact |
| `public/data/modules/network-hardening/lessons/firewall-policy.md` | lesson (quiz-host) | request-response | `public/data/modules/logging-auditing/lessons/audit-policies.md` | exact |
| `public/data/modules/network-hardening/quizzes/01.json` | quiz data | request-response | `public/data/modules/logging-auditing/quizzes/01.json` | exact |
| `public/data/modules/network-hardening/exercises/01.json` | exercise data | request-response | `public/data/modules/logging-auditing/exercises/01.json` | exact |
| `public/data/modules/network-hardening/scenarios/01.json` | scenario data | event-driven | `public/data/modules/logging-auditing/scenarios/01.json` | exact |
| `public/data/modules/account-access/lessons/intro.md` | lesson (scenario-host) | request-response | `public/data/modules/logging-auditing/lessons/intro.md` | exact |
| `public/data/modules/account-access/lessons/ps-ad.md` | lesson (exercise-host) | request-response | `public/data/modules/logging-auditing/lessons/ps-logging.md` | exact |
| `public/data/modules/account-access/lessons/access-policy.md` | lesson (quiz-host) | request-response | `public/data/modules/logging-auditing/lessons/audit-policies.md` | exact |
| `public/data/modules/account-access/quizzes/01.json` | quiz data | request-response | `public/data/modules/logging-auditing/quizzes/01.json` | exact |
| `public/data/modules/account-access/exercises/01.json` | exercise data | request-response | `public/data/modules/logging-auditing/exercises/01.json` | exact |
| `public/data/modules/account-access/scenarios/01.json` | scenario data | event-driven | `public/data/modules/logging-auditing/scenarios/01.json` | exact |
| `public/data/modules/incident-response/lessons/intro.md` | lesson (scenario-host) | request-response | `public/data/modules/logging-auditing/lessons/intro.md` | exact |
| `public/data/modules/incident-response/lessons/ps-ir.md` | lesson (exercise-host) | request-response | `public/data/modules/logging-auditing/lessons/ps-logging.md` | exact |
| `public/data/modules/incident-response/lessons/ir-procedures.md` | lesson (quiz-host) | request-response | `public/data/modules/logging-auditing/lessons/audit-policies.md` | exact |
| `public/data/modules/incident-response/quizzes/01.json` | quiz data | request-response | `public/data/modules/logging-auditing/quizzes/01.json` | exact |
| `public/data/modules/incident-response/exercises/01.json` | exercise data | request-response | `public/data/modules/logging-auditing/exercises/01.json` | exact |
| `public/data/modules/incident-response/scenarios/01.json` | scenario data | event-driven | `public/data/modules/logging-auditing/scenarios/01.json` | exact |
| `src/modules-config.js` | config | — | `src/modules-config.js` lines 15-19 (logging-auditing lessons block) | exact |
| `public/data/compliance-index.json` | data | — | `public/data/compliance-index.json` lines 6-34 (TSA-Monitoring entry) | exact |

---

## Pattern Assignments

### Lesson Pattern A: Scenario-Host (intro.md) — all three modules

**Analog:** `public/data/modules/logging-auditing/lessons/intro.md`

**Frontmatter pattern** (lines 1-8):
```markdown
---
title: Introduction to Windows Event Logs
lessonId: intro
moduleId: logging-auditing
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-2, NIST-AU-3]
---
```

Rules for new intro.md files:
- NO `quizId`, `scenarioId`, or `exerciseId` in frontmatter (scenario/exercise IDs live only in modules-config.js)
- `order: 1`
- `complianceControls` lists the TSA-* and NIST-* control IDs for the module (from D-10)
  - MOD-02 intro: `[TSA-NetworkSeg, NIST-SC-7]`
  - MOD-03 intro: `[TSA-AccessControl, NIST-AC-2]`
  - MOD-04 intro: `[TSA-IR, NIST-IR-4]`

**OT callout pattern** (line 51-53):
```markdown
> [!OT]
> In OT environments — HMI stations, SCADA servers, engineering workstations — event log collection differs from IT. Many OT systems lack domain connectivity and do not have Windows Event Log Forwarding configured. Logs must be collected via USB export (`wevtutil epl Security C:\export\security.evtx`) or a push-based SIEM agent installed directly on the OT host. NIST AU-3 still applies: every exported log must contain sufficient detail — event ID, timestamp, source, and message. Document your collection method in your security baseline.
```

Pattern: `> [!OT]` on its own line, then `> In OT environments — {specific OT context for this module}`.

**NERC CIP disclaimer pattern** (line 68):
```markdown
> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-007 R5 event logging requirements are structurally similar to the TSA monitoring mandate and NIST AU-2.
```

For MOD-02 intro: CIP-004 (Personnel & Training) reference using this exact disclaimer structure.
For MOD-03 intro: CIP-004 reference.
For MOD-04 intro: CIP-008 (Incident Reporting) reference.

**Body structure** (lines 10-71):
- H2 section: "What Are {Topic}?" — conceptual overview paragraph, compliance hook referencing "the current TSA pipeline security directive"
- H2 section: PowerShell query or key concept with fenced ```powershell blocks (inline comment on first line stating NIST control + purpose)
- H2 section: key items table (Event IDs, rules, etc.) — formatted as markdown table
- `> [!OT]` callout block (placed after a major section)
- `> **NERC CIP scope note:**` block where CIP aligns (per D-12)
- Closing paragraph transitioning to Lesson 2

---

### Lesson Pattern B: Exercise-Host (ps-*.md) — all three modules

**Analog:** `public/data/modules/logging-auditing/lessons/ps-logging.md`

**Frontmatter pattern** (lines 1-8):
```markdown
---
title: Enabling PowerShell Script Block Logging
lessonId: ps-logging
moduleId: logging-auditing
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-CM-6]
---
```

Rules for new exercise-host lesson files:
- NO `quizId` in frontmatter
- `order: 2`
- `complianceControls` per module:
  - MOD-02 ps-firewall: `[TSA-NetworkSeg, NIST-SC-7, NIST-SI-3]`
  - MOD-03 ps-ad: `[TSA-AccessControl, NIST-AC-2]`
  - MOD-04 ps-ir: `[TSA-IR, NIST-AU-12]`

**Code block pattern** (lines 25-28):
```markdown
```powershell
# NIST CM-6: Verify current registry configuration state on PIPELINE-DC01
# If the key does not exist, the property returns an error — logging is disabled
Get-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -ErrorAction SilentlyContinue
```
```

Pattern: first line always a `# NIST {control}: {purpose}` comment. Second line an additional comment explaining the behavior. Then the PS 5.1 command.

**OT callout pattern** (lines 73-75):
```markdown
> [!OT]
> In air-gapped OT environments without a domain controller, Group Policy cannot distribute registry settings. Apply the registry changes manually on each OT workstation using the PS commands above. Where PowerShell remoting is available on the OT LAN (10.0.0.0/24), use `Invoke-Command -ComputerName <host> -ScriptBlock { ... }` from a jump server. On machines without PS remoting, deploy a startup script via the local machine's Group Policy Editor (`gpedit.msc`). NIST CM-6 requires documenting the registry state as a configuration baseline — record which hosts have Script Block Logging enabled and the date of configuration.
```

**Body structure** (lines 10-84):
- H2: "What Is {Topic}?" — concept paragraph tying to TSA mandate
- H2: "Checking Whether {Feature} Is {State}" — verification PS command first
- H2: "Creating/Enabling {Feature}" — creation/enable command
- H2: "Verifying {Feature} Is Active" — confirmation command
- `> [!OT]` block placed after verification section
- H2: "Additional {Context}" — supplementary information or related cmdlets

---

### Lesson Pattern C: Quiz-Host (policy/config lesson) — all three modules

**Analog:** `public/data/modules/logging-auditing/lessons/audit-policies.md`

**Frontmatter pattern** (lines 1-9):
```markdown
---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
quizId: '01'
---
```

Rules for quiz-host lesson files:
- `quizId: '01'` MUST be present — this is what triggers quiz rendering in lesson-view.js
- `order: 3`
- `complianceControls` per module:
  - MOD-02 firewall-policy: `[TSA-NetworkSeg, NIST-SC-7]` (CIP-007 referenced in body)
  - MOD-03 access-policy: `[TSA-AccessControl, NIST-AC-6]` (CIP-006 referenced in body)
  - MOD-04 ir-procedures: `[TSA-IR, NIST-IR-4]` (CIP-008 referenced in body)

**OT callout pattern** (lines 68-70):
```markdown
> [!OT]
> In isolated OT environments without domain connectivity — workgroup machines or OT systems on an air-gapped network — Group Policy does not apply. Configure audit policies directly with `auditpol` on each OT workstation. For OT domains on air-gapped networks, export policy from a connected system with `Backup-GPO -Name "Audit Policy" -Path C:\GPOBackups`, transfer via USB, then import with `Restore-GPO` on PIPELINE-DC01. NIST AU-2 applies regardless of connectivity — audit events must be generated on every monitored host.
```

**NERC CIP disclaimer pattern** (body, when CIP aligns per D-12):
```markdown
> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-007 R5 event logging requirements are structurally similar to the TSA monitoring mandate and NIST AU-2.
```

For MOD-02 firewall-policy: CIP-007 (Ports and Services).
For MOD-03 access-policy: CIP-006 (Physical Security, access boundary).
For MOD-04 ir-procedures: CIP-008 (Incident Reporting).

**Body structure** (lines 10-85):
- H2: "Why {Topic} Matters" — compliance rationale paragraph
- H2: "{Topic} Structure" — structural overview (categories, subcategories, components)
- H2: "Checking Current {State}" — audit/check PS command
- H2: "Enabling {Feature}" — enable/configure command
- H2: "Finding Existing {Objects}" — discovery/search command
- `> [!OT]` block
- H2: "Key {Items} to Enable/Configure" — table summarizing what to configure

---

### Quiz JSON Pattern — all three modules

**Analog:** `public/data/modules/logging-auditing/quizzes/01.json` (lines 1-112)

**Top-level structure** (lines 1-6):
```json
{
  "id": "logging-auditing-quiz-01",
  "moduleId": "logging-auditing",
  "title": "Logging & Auditing Knowledge Check",
  "questions": [
```

For new modules, substitute:
- `"id"`: `"{moduleId}-quiz-01"` — e.g., `"network-hardening-quiz-01"`
- `"moduleId"`: `"{moduleId}"` — e.g., `"network-hardening"`
- `"title"`: `"{Module Title} Knowledge Check"`

**Question object pattern** (lines 7-39):
```json
{
  "id": "q-01",
  "type": "multiple-choice",
  "stem": "Which PowerShell Event ID captures the full content of executed script blocks?",
  "complianceControls": [
    "NIST-AU-12"
  ],
  "answers": [
    {
      "id": "a",
      "text": "4624",
      "correct": false,
      "feedback": "Event ID 4624 is a successful logon event, not script block logging."
    },
    {
      "id": "b",
      "text": "4104",
      "correct": true,
      "feedback": "Correct. Event ID 4104 in the PowerShell/Operational log captures script block content when Script Block Logging is enabled."
    },
    {
      "id": "c",
      "text": "4688",
      "correct": false,
      "feedback": "Event ID 4688 logs process creation, not PowerShell script block content."
    },
    {
      "id": "d",
      "text": "7045",
      "correct": false,
      "feedback": "Event ID 7045 logs new service installation, not PowerShell activity."
    }
  ],
  "explanation": "Script Block Logging (Event ID 4104) captures the full text of all PowerShell script blocks to the Microsoft-Windows-PowerShell/Operational log."
}
```

**Hard constraints:**
- Exactly 3 questions: `q-01`, `q-02`, `q-03`
- Exactly 4 answers per question: `a`, `b`, `c`, `d`
- Exactly 1 `"correct": true` per question
- `"complianceControls"` array uses the new specific control IDs (e.g., `"NIST-SC-7"`, not `"NIST"`)
- Incorrect answer `"feedback"` explains WHY it is wrong
- Correct answer `"feedback"` starts with `"Correct."` and confirms why
- `"explanation"` is shown after answering — provides the teaching moment

---

### Exercise JSON Pattern — all three modules

**Analog:** `public/data/modules/logging-auditing/exercises/01.json` (lines 1-74)

**Top-level structure** (lines 1-8):
```json
{
  "id": "logging-auditing-ex-01",
  "moduleId": "logging-auditing",
  "title": "Enable Script Block Logging",
  "description": "Use PowerShell to enable Script Block Logging via the registry on PIPELINE-DC01.",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-12"],
  "context": "You are logged into PIPELINE-DC01 as a domain administrator. Script Block Logging is currently disabled.",
  "steps": [
```

For new modules, substitute:
- `"id"`: `"{moduleId}-ex-01"`
- `"moduleId"`: `"{moduleId}"`
- `"title"`: Short imperative title for the exercise
- `"description"`: One sentence stating what the learner will do
- `"complianceControls"`: TSA-* and NIST-* IDs from D-10 for the module
- `"context"`: Who you are, which system, current state (all generic identifiers)

**Step object pattern** (lines 9-32):
```json
{
  "id": "step-1",
  "instruction": "Check whether the ScriptBlockLogging registry key exists.",
  "hint": "Use Get-Item or Get-ItemProperty with the HKLM: path to check for the ScriptBlockLogging key.",
  "hintPatterns": [
    {
      "pattern": "Get-Item\\s+HKLM:\\\\SOFTWARE\\\\Policies|gci.*HKLM",
      "hint": "Close — try Get-ItemProperty instead of Get-Item for reading registry values."
    },
    {
      "pattern": "regedit|reg\\s+query",
      "hint": "In PowerShell, use Get-ItemProperty with the HKLM: provider path rather than regedit or reg.exe."
    }
  ],
  "expectedCommands": [
    {
      "pattern": "Get-ItemProperty.*ScriptBlockLogging|Get-Item.*ScriptBlockLogging",
      "matchType": "regex",
      "caseSensitive": false
    }
  ],
  "successOutput": "Get-ItemProperty : Cannot find path ...",
  "feedbackOnWrong": "Navigate to HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell and check for the ScriptBlockLogging subkey using Get-ItemProperty."
}
```

**Hard constraints:**
- 4 steps: `step-1` through `step-4` (D-04, D-05, D-06 specify the exact commands)
- `"matchType": "regex"` and `"caseSensitive": false` on all expectedCommands
- `"pattern"` in expectedCommands is a regex that accommodates parameter ordering variation — use `|` alternation for key variants
- `"hintPatterns"` contain 1-2 near-miss regexes per step; hint text starts with "Close —" or tool name
- `"successOutput"` uses `\n` for newlines; must look like realistic PS 5.1 tabular output (column headers, dashes separator line, data rows)
- `"feedbackOnWrong"` is a directive sentence telling the learner what cmdlet path to try

**successOutput formatting rule** (from step-2 lines 50-51):
```
"    Hive: HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\n\nName                           Property\n----                           --------\nScriptBlockLogging"
```
Pattern: leading spaces for `Hive:` line, blank line, then column headers in fixed-width, then `----` dashes, then data row(s).

---

### Scenario JSON Pattern — all three modules

**Analog:** `public/data/modules/logging-auditing/scenarios/01.json` (lines 1-55)

**Top-level structure** (lines 1-6):
```json
{
  "id": "logging-auditing-scenario-01",
  "moduleId": "logging-auditing",
  "title": "Investigating a Suspicious Login on PIPELINE-DC01",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-2"],
  "narrative": "Your SIEM alerts you to 47 failed logon attempts on PIPELINE-DC01 over the past 10 minutes, followed by one successful logon from an unknown workstation at 03:42 UTC. The account is a domain user account with access to both IT systems and the pipeline data historian.\n\nIn OT environments: pipeline control systems (SCADA, DCS) may share Active Directory with IT systems. A compromised domain account could pivot to OT historian or HMI systems — treat any credential-based alert as potentially OT-impacting until verified.",
```

For new modules, substitute:
- `"id"`: per D-07/D-08/D-09 — `"network-hardening-scenario-01"`, `"account-access-scenario-01"`, `"incident-response-scenario-01"`
- `"moduleId"`: `"{moduleId}"`
- `"title"`: per D-07/D-08/D-09 locked titles
- `"complianceControls"`: TSA-* and NIST-* IDs for the module
- `"narrative"`: multi-sentence setup. The narrative MUST contain an OT context paragraph (inline, not a separate field). Pattern: first paragraph sets the IT-level incident; second paragraph or sentence begins "In OT environments:" and explains the pipeline/SCADA safety dimension.

**Phase object pattern — non-final phase** (lines 7-29):
```json
{
  "id": "phase-1",
  "type": "decision",
  "title": "Initial Triage",
  "isFinal": false,
  "prompt": "Your SIEM shows 47 failed logon attempts followed by a successful logon from an unknown workstation at 03:42 UTC. What is your first action?",
  "options": [
    {
      "id": "opt-a",
      "text": "Immediately disable the account that successfully logged in.",
      "outcome": "Disabling the account stops the attacker but also alerts them and destroys evidence of ongoing activity. Taking containment action before establishing a timeline means you may not know what systems were accessed. Triage first — collect evidence, then contain.",
      "correct": false,
      "nextPhaseId": "phase-2"
    },
    {
      "id": "opt-b",
      "text": "Query the Security event log on PIPELINE-DC01 for Event IDs 4624 and 4625 around the incident window.",
      "outcome": "Correct. Reviewing the event log first establishes the timeline and source IP before you take any containment action. Event ID 4624 (successful logon) and 4625 (failed logon) together tell you who, when, and from where — giving you the context to make an informed containment decision.",
      "correct": true,
      "nextPhaseId": "phase-2"
    }
  ]
}
```

**Phase object pattern — final phase** (lines 30-54):
```json
{
  "id": "phase-2",
  "type": "decision",
  "title": "Containment Decision",
  "isFinal": true,
  "prompt": "You have confirmed the logon originated from a workstation outside the normal IT subnet (10.0.5.22). The account belongs to a service account used by the pipeline historian. What do you do?",
  "options": [
    {
      "id": "opt-a",
      "text": "Immediately disable the service account and notify OT operations that historian data collection may be interrupted.",
      "outcome": "Disabling the account stops the threat but historian data collection pauses. In a pipeline OT context, you must notify operations before disabling any account that may affect safety system logging. However, given the confirmed compromise, this is the correct priority order. TSA SD-02F requires prompt incident response and notification to relevant personnel.",
      "correct": true,
      "nextPhaseId": null
    },
    {
      "id": "opt-b",
      "text": "Reset the service account password only, without notifying OT operations, to avoid an alarm.",
      "outcome": "Resetting the password without notifying OT operations violates TSA SD-02F incident notification requirements and leaves OT operators unaware of a potential safety-relevant event. Notification is mandatory. Additionally, password reset alone may not stop an attacker who has established persistence through other means.",
      "correct": false,
      "nextPhaseId": null
    }
  ]
}
```

**Hard constraints:**
- Exactly 2 phases: `phase-1` (isFinal: false) and `phase-2` (isFinal: true)
- Phase-1 options: BOTH have `"nextPhaseId": "phase-2"` — regardless of correct/incorrect choice
- Phase-2 options: BOTH have `"nextPhaseId": null`
- Exactly 2 options per phase: `opt-a` and `opt-b`
- Exactly 1 `"correct": true` per phase
- Wrong answer `"outcome"` explains the consequence and why it violates TSA requirements
- Correct answer `"outcome"` explains why it is correct and names the TSA/NIST principle

---

### modules-config.js Pattern

**Analog:** `src/modules-config.js` lines 15-19 (logging-auditing lessons block)

**Exact current pattern to replicate** (lines 15-19):
```javascript
lessons: [
  { id: 'intro',          title: 'Introduction to Windows Event Logs', scenarioId: '01' },
  { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
  { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
],
```

**Replace lines 29-33** (current network-hardening placeholder) with:
```javascript
lessons: [
  { id: 'intro',           title: 'Network Hardening Overview',                  scenarioId: '01' },
  { id: 'ps-firewall',     title: 'Managing Firewall Rules with PowerShell',      exerciseId: '01' },
  { id: 'firewall-policy', title: 'Windows Firewall Policy for OT Networks',      quizId: '01' },
],
```

**Replace lines 43-46** (current account-access placeholder) with:
```javascript
lessons: [
  { id: 'intro',         title: 'Account and Access Control Overview',            scenarioId: '01' },
  { id: 'ps-ad',         title: 'Active Directory Queries with PowerShell',       exerciseId: '01' },
  { id: 'access-policy', title: 'Least Privilege and Service Account Policy',     quizId: '01' },
],
```

**Replace lines 55-58** (current incident-response placeholder) with:
```javascript
lessons: [
  { id: 'intro',         title: 'Incident Response Overview',                     scenarioId: '01' },
  { id: 'ps-ir',         title: 'Evidence Collection with PowerShell',            exerciseId: '01' },
  { id: 'ir-procedures', title: 'Containment and Recovery Procedures',            quizId: '01' },
],
```

**Rule:** `scenarioId`/`exerciseId`/`quizId` live ONLY in this config object — never in .md frontmatter (except `quizId` which ALSO goes in the quiz-hosting lesson's frontmatter).

---

### compliance-index.json Pattern

**Analog:** `public/data/compliance-index.json` lines 6-34 (TSA-Monitoring entry)

**Current file structure** (lines 1-5, 53-54):
```json
{
  "schemaVersion": 1,
  "_comment": "UPDATE CONTRACT: Add an entry to this file whenever a lesson, exercise, or scenario adds complianceControls. See CLAUDE.md.",
  "controls": [
    ... existing entries ...
  ]
}
```

**Existing control entry pattern to replicate** (lines 6-34):
```json
{
  "id": "TSA-Monitoring",
  "label": "TSA SD-02F — Continuous Monitoring",
  "items": [
    { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "intro",         "title": "Introduction to Windows Event Logs" },
    { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "ps-logging",    "title": "Enabling PowerShell Script Block Logging" },
    { "type": "exercise", "moduleId": "logging-auditing", "contentId": "01",            "title": "Enable Script Block Logging" },
    { "type": "scenario", "moduleId": "logging-auditing", "contentId": "01",            "title": "Investigating a Suspicious Login" }
  ]
}
```

**9 new entries to append inside `"controls": [...]`** — add after the existing NIST-AU-2 entry (after line 52):

| Control ID | Label | items[] content |
|------------|-------|-----------------|
| `TSA-NetworkSeg` | `TSA SD-02F — Network Segmentation and Access Control` | 3 lessons (intro, ps-firewall, firewall-policy) + exercise 01 + scenario 01 from network-hardening |
| `NIST-SC-7` | `NIST SP 800-82 Rev 3 — SC-7: Boundary Protection` | 2 lessons (intro, firewall-policy) from network-hardening |
| `NIST-SI-3` | `NIST SP 800-82 Rev 3 — SI-3: Malicious Code Protection` | 1 lesson (ps-firewall) from network-hardening |
| `TSA-AccessControl` | `TSA SD-02F — Access Control Management` | 3 lessons (intro, ps-ad, access-policy) + exercise 01 + scenario 01 from account-access |
| `NIST-AC-2` | `NIST SP 800-82 Rev 3 — AC-2: Account Management` | 2 lessons (intro, ps-ad) from account-access |
| `NIST-AC-6` | `NIST SP 800-82 Rev 3 — AC-6: Least Privilege` | 1 lesson (access-policy) from account-access |
| `TSA-IR` | `TSA SD-02F — Cybersecurity Incident Response` | 3 lessons (intro, ps-ir, ir-procedures) + exercise 01 + scenario 01 from incident-response |
| `NIST-IR-4` | `NIST SP 800-82 Rev 3 — IR-4: Incident Handling` | 2 lessons (intro, ir-procedures) from incident-response |
| `NIST-AU-12` | `NIST SP 800-82 Rev 3 — AU-12: Audit Record Generation` | 1 lesson (ps-ir) from incident-response |

**Item object format** (copy exactly):
```json
{ "type": "lesson",   "moduleId": "network-hardening", "contentId": "intro",           "title": "Network Hardening Overview" }
{ "type": "lesson",   "moduleId": "network-hardening", "contentId": "ps-firewall",     "title": "Managing Firewall Rules with PowerShell" }
{ "type": "lesson",   "moduleId": "network-hardening", "contentId": "firewall-policy", "title": "Windows Firewall Policy for OT Networks" }
{ "type": "exercise", "moduleId": "network-hardening", "contentId": "01",              "title": "Firewall Audit and Port Mapping" }
{ "type": "scenario", "moduleId": "network-hardening", "contentId": "01",              "title": "Unauthorized Access Point on the IT/OT Boundary" }
```

---

## Shared Patterns (apply to all new content files)

### Generic Identifier Rule
**Source:** `CLAUDE.md` and all three analog lesson files
**Apply to:** All lesson .md prose, all exercise JSON context/instruction/output fields, all scenario JSON narrative/outcome fields

Allowed identifiers:
- Hosts: `PIPELINE-DC01`
- Network: `10.0.0.0/24`, `10.0.5.22` (specific IPs as needed for scenario realism)
- Domain: `ExampleCorp` (as domain name where needed)
- Service accounts: `svc-historian`, `svc-pipeline-backup` (established lore from MOD-01/D-08)
- Evidence paths: `C:\Evidence\` (from D-06)

### OT Callout Rule
**Source:** `public/data/modules/logging-auditing/lessons/intro.md` line 51
**Apply to:** Every new lesson .md file (all 9 files)

Required syntax:
```markdown
> [!OT]
> In OT environments — {specific OT context for this module and lesson topic}.
```

Every lesson must have exactly one `> [!OT]` block. Placement is at Claude's discretion per D-Discretion.

### NERC CIP Disclaimer Rule
**Source:** `public/data/modules/logging-auditing/lessons/intro.md` line 68
**Apply to:** Specific lessons per D-12 only

Verbatim text required:
```markdown
> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark.
```

After the verbatim text, add the CIP-specific detail for the lesson (e.g., "CIP-007 R5 ports and services requirements align with the TSA network segmentation mandate.").

Applies to:
- MOD-02 `firewall-policy.md` — CIP-007
- MOD-03 `intro.md` — CIP-004; `access-policy.md` — CIP-006
- MOD-04 `intro.md` — CIP-008; `ir-procedures.md` — CIP-008

### PowerShell Code Block Rule
**Source:** `public/data/modules/logging-auditing/lessons/ps-logging.md` lines 25-28
**Apply to:** All lesson .md files with PS commands

Required format:
- Fence with ` ```powershell `
- First line: `# NIST {control}: {action description on PIPELINE-DC01}`
- Second line (optional): `# {behavior note — what happens, what to watch for}`
- PS 5.1 cmdlets only

### TSA Version String Rule
**Source:** `CLAUDE.md` critical facts
**Apply to:** All lesson prose

Do NOT write hardcoded TSA version strings in a way that requires multi-file updates. Lesson prose may say "the current TSA pipeline security directive" or use the control ID `TSA-NetworkSeg`. Frontmatter `complianceTags` uses `[TSA, NIST]` (tag only, no version). The label "TSA SD-02F" appears only in `compliance-index.json` `"label"` fields and `compliance-refs.json`.

---

## No Analog Found

None. All 23 files have exact analogs in the existing MOD-01 content set.

---

## Metadata

**Analog search scope:** `public/data/modules/logging-auditing/`, `src/modules-config.js`, `public/data/compliance-index.json`
**Files scanned:** 8 source files read directly
**Pattern extraction date:** 2026-05-16
**Analog file list:**
- `public/data/modules/logging-auditing/lessons/intro.md`
- `public/data/modules/logging-auditing/lessons/ps-logging.md`
- `public/data/modules/logging-auditing/lessons/audit-policies.md`
- `public/data/modules/logging-auditing/quizzes/01.json`
- `public/data/modules/logging-auditing/exercises/01.json`
- `public/data/modules/logging-auditing/scenarios/01.json`
- `src/modules-config.js`
- `public/data/compliance-index.json`
