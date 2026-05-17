# Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04) — Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Author the full content for three modules — Network Hardening (MOD-02), Account & Access Management (MOD-03), and Incident Response (MOD-04). Each module requires: 3 lesson Markdown files, 1 quiz JSON, 1 terminal exercise JSON, 1 scenario JSON. All content must satisfy MOD-02, MOD-03, MOD-04, DATA-02, DATA-03 requirements. modules-config.js is updated to reflect the 3-lesson structure and content-type assignments.

This phase does NOT add new engine features, UI components, or routes — it is pure content authoring within the schemas locked in Phases 4–6.

</domain>

<decisions>
## Implementation Decisions

### Lesson Structure (all three modules)

- **D-01:** **3 lessons per module**, matching MOD-01's structure. The pattern is fixed across all three modules:
  - Lesson 1 (`intro`) → hosts the **scenario** (scenarioId: '01')
  - Lesson 2 (PS hands-on) → hosts the **terminal exercise** (exerciseId: '01')
  - Lesson 3 (policy/config) → hosts the **quiz** (quizId: '01')

- **D-02:** **Lesson IDs and titles per module:**

  **MOD-02 (network-hardening):**
  - `intro` — "Network Hardening Overview" (scenario host)
  - `ps-firewall` — "Managing Firewall Rules with PowerShell" (exercise host)
  - `firewall-policy` — "Windows Firewall Policy for OT Networks" (quiz host)

  **MOD-03 (account-access):**
  - `intro` — "Account and Access Control Overview" (scenario host)
  - `ps-ad` — "Active Directory Queries with PowerShell" (exercise host)
  - `access-policy` — "Least Privilege and Service Account Policy" (quiz host)

  **MOD-04 (incident-response):**
  - `intro` — "Incident Response Overview" (scenario host)
  - `ps-ir` — "Evidence Collection with PowerShell" (exercise host)
  - `ir-procedures` — "Containment and Recovery Procedures" (quiz host)

- **D-03:** modules-config.js must be updated to add the 3rd lesson per module and add the scenarioId/exerciseId/quizId fields matching the pattern above.

### PowerShell Command Focus (exercises)

- **D-04:** **MOD-02 exercise (4 steps)** — firewall audit + port-to-process mapping combined:
  1. `Get-NetFirewallRule -Enabled True | Where-Object {$_.Direction -eq 'Inbound'} | Select-Object DisplayName, LocalPort, Action` — audit active inbound rules
  2. `Test-NetConnection -ComputerName PIPELINE-DC01 -Port 445` — verify expected connectivity
  3. `New-NetFirewallRule -DisplayName 'Block RDP Inbound' -Direction Inbound -Protocol TCP -LocalPort 3389 -Action Block` — block unauthorized port
  4. `Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | Sort-Object LocalPort` then `Get-Process -Id <OwningProcess>` — map open ports to processes

- **D-05:** **MOD-03 exercise (4 steps)** — AD group audit + local admin audit combined:
  1. `Get-ADGroupMember -Identity 'Domain Admins' | Select-Object Name, SamAccountName` — enumerate privileged group
  2. `Get-ADUser -Filter {ServicePrincipalName -like '*'} -Properties ServicePrincipalName | Select-Object Name, Enabled, ServicePrincipalName` — identify service accounts
  3. `Get-ADPrincipalGroupMembership -Identity svc-historian | Select-Object Name` — audit specific service account membership
  4. `Get-LocalGroupMember -Group 'Administrators'` — check local admin group on this machine

- **D-06:** **MOD-04 exercise (4 steps)** — evidence collection + system isolation combined:
  1. `Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, CPU, Path` — identify high-CPU processes
  2. `Get-NetTCPConnection -State Established | Where-Object {$_.RemoteAddress -notlike '10.*'} | Select-Object LocalPort, RemoteAddress, RemotePort, OwningProcess` — find external connections
  3. `Get-WinEvent -LogName Security -MaxEvents 50 | Where-Object {$_.Id -eq 4624} | Select-Object TimeCreated, Message | Export-Csv 'C:\Evidence\logons.csv' -NoTypeInformation` — export evidence for chain of custody
  4. `Disable-NetAdapter -Name 'Ethernet' -Confirm:$false` — isolate system (teach: isolation only after evidence collected)

### Scenario Incident Design

- **D-07:** **MOD-02 scenario** — combines unauthorized port + rogue device:
  - id: `network-hardening-scenario-01`, title: "Unauthorized Access Point on the IT/OT Boundary"
  - Phase 1 ("Discovery"): Port 3389 inbound found open on boundary firewall by automated scan. Decision: investigate first (correct — may be authorized maintenance window) vs. block immediately (wrong — disrupts potentially authorized remote access without notification).
  - Phase 2 ("Containment"): Investigation reveals a rogue workstation opened the port outside any change window. Decision: isolate the device + block the port + notify TSA (correct) vs. quietly close the port and log it internally (wrong — TSA incident reporting is mandatory).

- **D-08:** **MOD-03 scenario** — combines mystery admin escalation + service account shared credentials:
  - id: `account-access-scenario-01`, title: "Unauthorized Privilege Escalation on PIPELINE-DC01"
  - Phase 1 ("Detection"): Automated audit reveals `svc-pipeline-backup` unexpectedly in Domain Admins, added 3 days ago. Decision: investigate origin before removing (correct — need to understand scope) vs. remove immediately (wrong — removal before investigation destroys forensic value).
  - Phase 2 ("Remediation"): Origin confirmed unauthorized; account was added by an insider. Decision: remove from group + force password reset + notify TSA + review all actions taken by account (correct) vs. just remove from group and reset password without notifying TSA (wrong — TSA reporting required when credential compromise is suspected).

- **D-09:** **MOD-04 scenario** — combines ransomware indicator + suspicious PS script:
  - id: `incident-response-scenario-01`, title: "Ransomware Indicator on Pipeline DMZ Workstation"
  - Phase 1 ("Triage"): EDR alert on DMZ workstation: unusual file encryption activity and lateral movement signatures toward historian VLAN. Decision: isolate the workstation immediately (correct — OT safety priority; potential spread to safety systems outweighs evidence loss) vs. collect full forensic evidence before isolation (wrong — in OT context, operational risk of spread is unacceptable).
  - Phase 2 ("Reporting"): Workstation isolated; script block logging reveals encoded PS command was the initial vector. Decision: notify TSA within 24 hours + preserve isolated workstation for forensics (correct — TSA SD-02F requires incident notification) vs. restore from backup immediately to minimize downtime (wrong — destroys evidence and violates reporting requirements).

### Compliance Control IDs

- **D-10:** Both specific NIST control numbers AND TSA category tags. Add new control IDs to compliance-index.json:
  - **MOD-02:** `TSA-NetworkSeg` (label: "TSA SD-02F — Network Segmentation and Access Control"), `NIST-SC-7` (label: "NIST SP 800-82 Rev 3 — SC-7: Boundary Protection"), `NIST-SI-3` (label: "NIST SP 800-82 Rev 3 — SI-3: Malicious Code Protection")
  - **MOD-03:** `TSA-AccessControl` (label: "TSA SD-02F — Access Control Management"), `NIST-AC-2` (label: "NIST SP 800-82 Rev 3 — AC-2: Account Management"), `NIST-AC-6` (label: "NIST SP 800-82 Rev 3 — AC-6: Least Privilege")
  - **MOD-04:** `TSA-IR` (label: "TSA SD-02F — Cybersecurity Incident Response"), `NIST-IR-4` (label: "NIST SP 800-82 Rev 3 — IR-4: Incident Handling"), `NIST-AU-12` (label: "NIST SP 800-82 Rev 3 — AU-12: Audit Record Generation")

- **D-11:** compliance-refs.json is NOT modified — it stays at framework level (TSA, NIST). New control IDs are only in compliance-index.json `controls[]` array. Each new control entry includes `items[]` linking to lessons, exercises, and scenarios from the three new modules.

- **D-12:** **NERC CIP references** appear **per-lesson where a CIP control aligns**, each with the required disclaimer: *"NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark."*
  - MOD-02: CIP-007 (Ports and Services) mentioned in `firewall-policy` lesson
  - MOD-03: CIP-006 (Physical Security, access boundary) mentioned in `access-policy` lesson; CIP-004 (Personnel & Training) in `intro`
  - MOD-04: CIP-008 (Incident Reporting) mentioned in `intro` and `ir-procedures` lessons

### Claude's Discretion

- Exact lesson prose depth (word count, number of code examples per lesson) — use MOD-01 lesson length as a benchmark
- Quiz question topics for each module's quiz JSON (3 questions per quiz matching the quiz schema already in use)
- Specific hintPatterns per exercise step — author realistic near-miss patterns for each cmdlet
- Exact success output text per exercise step — use realistic-looking PS output matching the command
- OT callout placement within each lesson — required but placement is at Claude's discretion
- Narrative details within each scenario (specific IP addresses, timestamps, event counts) — use generic identifiers per CLAUDE.md (PIPELINE-DC01, 10.0.0.0/24, ExampleCorp)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Authoring Contract
- `CLAUDE.md` — Content rules: NERC CIP framing, OT callout requirement, generic identifiers, PS 5.1 target, no hardcoded TSA version strings
- `.planning/REQUIREMENTS.md` — MOD-02, MOD-03, MOD-04, DATA-02, DATA-03 definitions
- `.planning/ROADMAP.md §Phase 7` — Success criteria, dependencies, content requirements

### Data Schemas (locked in prior phases)
- `public/data/modules/logging-auditing/lessons/intro.md` — Canonical lesson Markdown format with frontmatter
- `public/data/modules/logging-auditing/quizzes/01.json` — Quiz JSON schema (3 questions, per-answer feedback, complianceControls)
- `public/data/modules/logging-auditing/exercises/01.json` — Exercise JSON schema (steps, expectedCommands, hintPatterns, successOutput, feedbackOnWrong)
- `public/data/modules/logging-auditing/scenarios/01.json` — Scenario JSON schema (phases, options, nextPhaseId, isFinal, correct, outcome)

### Compliance Data
- `public/data/compliance-refs.json` — Framework-level TSA/NIST references (do not modify)
- `public/data/compliance-index.json` — Add new control entries for MOD-02/03/04 (update this file)

### Code Integration Points
- `src/modules-config.js` — Update lesson arrays: add 3rd lesson per module, add scenarioId/exerciseId/quizId fields
- `src/views/module-view.js` — Already renders scenario/exercise/quiz links from modules-config fields — no engine changes needed
- `src/quiz-engine.js computeModuleProgress()` — Already handles scenarioId, exerciseId, quizId branches — no changes needed

### Prior Phase Patterns
- `.planning/phases/05-simulated-powershell-terminal-exercise-view/05-CONTEXT.md` — Exercise JSON schema decisions, PS command matching rules, hintPatterns format
- `.planning/phases/06-scenario-engine-compliance-index-completion-summary/06-01-PLAN.md` — Scenario JSON authoring guidance (narrative structure, OT callout placement, phase decision tree)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Lesson Markdown + frontmatter format — `intro.md`, `ps-logging.md`, `audit-policies.md` in MOD-01 are the templates to follow verbatim
- Quiz schema (`quizzes/01.json`) — 3 questions, each with `answers[]` (correct boolean, feedback, complianceControls)
- Exercise schema (`exercises/01.json`) — steps with `expectedCommands[]` (pattern, caseSensitive), `hintPatterns[]`, `successOutput`, `feedbackOnWrong`
- Scenario schema (`scenarios/01.json`) — phases with `options[]` (text, outcome, correct, nextPhaseId), `isFinal`

### Established Patterns
- All environment identifiers generic: `PIPELINE-DC01`, `10.0.0.0/24`, `svc-historian`, `ExampleCorp` — no real hostnames or IPs
- "In OT environments:" callout block — required in every dual-use lesson; Markdown blockquote or bold paragraph
- NERC CIP disclaimer must appear verbatim when CIP is mentioned
- complianceControls in frontmatter are the NEW specific IDs (e.g., `TSA-NetworkSeg`) not the framework tags (`TSA`)
- PS 5.1 only — no PS 7 cmdlets, no PowerShell Core aliases

### Integration Points
- modules-config.js: add 3rd lesson to each module array; add `scenarioId: '01'`, `exerciseId: '01'`, `quizId: '01'` to appropriate lessons
- compliance-index.json: add 3 new control entries per module (9 total: TSA-NetworkSeg, NIST-SC-7, NIST-SI-3, TSA-AccessControl, NIST-AC-2, NIST-AC-6, TSA-IR, NIST-IR-4, NIST-AU-12), each with `items[]` listing all lessons, exercises, and scenarios that cover the control
- No new views, routes, or engine code needed — pure content + config authoring

</code_context>

<specifics>
## Specific Ideas

- MOD-02 exercise uses `ExampleCorp` as domain name where needed; PIPELINE-DC01 as the target host
- MOD-03 uses `svc-historian` as the compromised service account name (established in MOD-01's scenario — consistent lore)
- MOD-04 uses `C:\Evidence\` as the evidence staging path in the Export-Csv step — realistic Windows path for collection
- Each scenario's OT callout in the narrative should emphasize the operational safety dimension (historian data collection, SCADA visibility, pipeline control system impact)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 7 scope

</deferred>

---

*Phase: 07-core-module-content-mod-02-mod-03-mod-04*
*Context gathered: 2026-05-16*
