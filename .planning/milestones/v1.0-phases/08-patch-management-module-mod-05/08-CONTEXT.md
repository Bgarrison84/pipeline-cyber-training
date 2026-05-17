# Phase 8: Patch Management Module (MOD-05) — Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Author the full Patch Management module (MOD-05) — the final module of the platform. Requires: 3 lesson Markdown files, 3 scenario JSON files (new pattern — one per lesson), 1 quiz JSON, 1 terminal exercise JSON, modules-config.js update, and compliance-index.json update. All content must satisfy MOD-05 requirements.

This phase does NOT add new engine features, UI components, or routes — it is pure content authoring within the schemas locked in Phases 4–6. The only new pattern introduced is multiple scenario files per module (scenarioId on all 3 lessons instead of just L1).

</domain>

<decisions>
## Implementation Decisions

### Lesson Structure

- **D-01:** **3 lessons for patch-management module**, matching the established pattern from prior modules:
  - `wsus-patching` (L1) — "Windows Update and WSUS" — **scenario host** (`scenarioId: '01'`)
  - `ot-patching` (L2) — "OT/ICS Patching in Air-Gapped Environments" — **exercise host** (`exerciseId: '01'`, `scenarioId: '02'`)
  - `patch-policy` (L3) — "Patch Management Policy and Compliance Documentation" — **quiz host** (`quizId: '01'`, `scenarioId: '03'`)

  The `wsus-patching` and `ot-patching` IDs already exist in modules-config.js. `patch-policy` is new and must be added as the 3rd lesson.

- **D-02:** **NERC CIP references per-lesson:**
  - **CIP-007** (Systems Security Management — patch management section) referenced in `wsus-patching`, with the required verbatim disclaimer: *"NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark."*
  - **CIP-010** (Configuration Change Management and Vulnerability Assessments) referenced in `ot-patching`, with the same verbatim disclaimer.

- **D-03:** **modules-config.js update** for the `patch-management` entry:
  - Add `patch-policy` as the 3rd lesson
  - Add `scenarioId: '01'` to `wsus-patching`
  - Add `scenarioId: '02'` to `ot-patching` — **NEW pattern**: L2 has both `exerciseId` and `scenarioId`
  - Add `quizId: '01'` and `scenarioId: '03'` to `patch-policy` — **NEW pattern**: L3 has both `quizId` and `scenarioId`
  - The existing engine (module-view.js) already renders scenario/exercise/quiz links per-lesson config field — no engine changes needed

### Scenario Design (3 scenarios — new pattern for MOD-05)

- **D-04:** **`scenarios/01.json`** on `wsus-patching`:
  - id: `patch-management-scenario-01`, title: "Critical CVE vs. OT Vendor Qualification Window"
  - Phase 1 ("Discovery"): Critical CVE published targeting Windows Server 2019 — PIPELINE-HIST01 (the historian) is affected. Microsoft's patch is available immediately. OEM vendor qualification is 3–6 months out. Active pipeline operations.
    - Decision: Patch PIPELINE-HIST01 immediately from Microsoft's catalog (wrong — no OEM qualification; risk of OT service instability, unplanned SCADA disruption) vs. Implement compensating controls (network isolation, enhanced monitoring) and await vendor qualification (correct — risk-based deferral with documentation is TSA-compliant)
  - Phase 2 ("Aftermath"): Investigation reveals IT's WSUS server also pushed the same update to an OT workstation outside any change window, causing a PLC polling service crash.
    - Decision: Quietly fix the OT workstation and log it in the internal ticketing system (wrong — TSA reporting is mandatory when unauthorized changes affect OT; root cause analysis is required) vs. Notify TSA, document the incident, and implement WSUS segmentation to isolate OT systems from the IT patch feed (correct)

- **D-05:** **`scenarios/02.json`** on `ot-patching`:
  - id: `patch-management-scenario-02`, title: "Maintenance Window vs. Ops Manager Pressure"
  - Phase 1 ("Scheduling"): OEM has finally qualified the CVE patch for PIPELINE-HIST01. Scheduled maintenance window is 3 weeks away. Ops manager requests skipping the window and patching now to close the CVE faster.
    - Decision: Skip the scheduled maintenance window and patch immediately (wrong — unplanned OT changes risk operational disruption; change management process exists for safety reasons) vs. Wait for the scheduled maintenance window and document the interim compensating controls (correct — change management protects OT operational continuity)
  - Phase 2 ("Window"): During the scheduled maintenance window, the patch fails to install mid-process. A dialog box is frozen on the historian screen.
    - Decision: Force-retry the installation without rolling back (wrong — risk of partial install corruption in OT environment; historian data collection may be degraded) vs. Roll back to the previous clean state, document the failure with exact error details, and reschedule with OEM vendor support engaged (correct)

- **D-06:** **`scenarios/03.json`** on `patch-policy`:
  - id: `patch-management-scenario-03`, title: "TSA Audit: Missing Compensating Controls Documentation"
  - Phase 1 ("Audit request"): TSA auditor requests compensating controls documentation for 3 OT patches that were deferred beyond the standard 30-day IT patch window. Documentation exists for 2 of the 3; the third deferred patch has no documented compensating control.
    - Decision: Tell the auditor the missing documentation is forthcoming and will be provided within a week (wrong — TSA treats incomplete or promised-later documentation as a compliance gap; claiming forthcoming docs signals systemic process failure) vs. Be transparent with the auditor: present the 2 documented patches, acknowledge the gap for the third, and commit to a specific remediation timeline (correct — TSA auditors expect honesty; gaps with plans fare better than missing documentation or false assurances)
  - Phase 2 ("Remediation"): After the audit, the team needs to catch up the third patch's documentation.
    - Decision: Retroactively reconstruct the compensating controls documentation based on what the team believes was done at the time (wrong — retroactive documentation without contemporaneous evidence is suspect; TSA may view it as fabricated records) vs. Implement a formal compensating controls process going forward, document what can be verified now with caveats, and include a corrective action plan with supervisor sign-off (correct)

### Exercise Commands (on `ot-patching`, L2)

- **D-07:** **4-step compliance reporting exercise** — generates patch status evidence for an OT audit:
  1. `Get-Hotfix | Select-Object HotFixID, Description, InstalledOn | Sort-Object InstalledOn -Descending` — inventory of installed patches on this machine, most recent first
  2. `Get-WmiObject Win32_QuickFixEngineering | Where-Object {$_.InstalledOn} | Where-Object {[datetime]$_.InstalledOn -lt (Get-Date).AddDays(-90)}` — identify patches older than 90 days; **canned output reveals 2–3 overdue KBs, including one security update tagged as a critical CVE** (teaches: this evidence must be documented and justified for auditors)
  3. `Get-Hotfix | Export-Csv 'C:\Audit\patch-status.csv' -NoTypeInformation` — export full patch inventory as audit evidence file
  4. `Get-Content 'C:\Audit\patch-status.csv' | Measure-Object -Line` — verify the export file contains rows (confirms artifact was created)

### Compliance Control IDs

- **D-08:** **3 new control IDs** added to compliance-index.json for MOD-05:
  - `TSA-PatchMgmt` → label: "TSA SD-02F — Patch Management" — items: all 3 lessons, the exercise, and all 3 scenarios
  - `NIST-SI-2` → label: "NIST SP 800-82 Rev 3 — SI-2: Flaw Remediation" — items: all 3 lessons + exercise
  - `NIST-MA-2` → label: "NIST SP 800-82 Rev 3 — MA-2: Controlled Maintenance" — items: `ot-patching` lesson, `patch-policy` lesson, scenario-02

- **D-09:** `compliance-refs.json` is NOT modified — it stays at framework level (TSA, NIST). New control IDs are only in compliance-index.json `controls[]` array. Each new entry includes `items[]` linking to all MOD-05 lessons, exercises, and scenarios that cover the control.

### Claude's Discretion

- Exact lesson prose depth (word count, code examples per lesson) — use MOD-01 lesson length as benchmark
- Quiz question topics for the `patch-policy` quiz (3 questions; must span all 3 sub-areas: Windows/IT patching, OT/ICS patching, compliance reporting)
- Specific hintPatterns per exercise step — author realistic near-miss patterns for Get-Hotfix, Get-WmiObject, Export-Csv
- Exact successOutput per exercise step — use realistic-looking PS output with plausible KB numbers (e.g., KB5034441, KB5035849), realistic dates
- OT callout placement within each lesson — required but placement is at Claude's discretion
- Narrative details within scenarios (specific KB numbers, timestamps, error messages) — use generic identifiers: PIPELINE-HIST01 (historian), PIPELINE-DC01 (domain controller), ExampleCorp

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content Authoring Contract
- `CLAUDE.md` — Content rules: NERC CIP framing, OT callout requirement, generic identifiers (PIPELINE-DC01, PIPELINE-HIST01, ExampleCorp), PS 5.1 target, no hardcoded TSA version strings
- `.planning/REQUIREMENTS.md` §MOD-05 — Exact MOD-05 requirement definition (three sub-areas, compliance reporting, quiz coverage)
- `.planning/ROADMAP.md §Phase 8` — Success criteria (4 criteria), dependencies, content requirements including "offline media staging, OEM patch qualification, 3–12 month vendor approval cycles, compensating controls documentation"

### Data Schemas (locked in prior phases — use as templates)
- `public/data/modules/logging-auditing/lessons/intro.md` — Canonical lesson Markdown format with frontmatter (`title`, `complianceControls[]`, `estimatedMinutes`)
- `public/data/modules/logging-auditing/quizzes/01.json` — Quiz JSON schema (3 questions, per-answer `feedback`, `complianceControls[]`)
- `public/data/modules/logging-auditing/exercises/01.json` — Exercise JSON schema (steps with `expectedCommands[]`, `hintPatterns[]`, `successOutput`, `feedbackOnWrong`)
- `public/data/modules/logging-auditing/scenarios/01.json` — Scenario JSON schema (phases with `options[]`, `nextPhaseId`, `isFinal`, `correct`, `outcome`)

### Compliance Data
- `public/data/compliance-refs.json` — Framework-level TSA/NIST references (do NOT modify in Phase 8)
- `public/data/compliance-index.json` — Add 3 new control entries: TSA-PatchMgmt, NIST-SI-2, NIST-MA-2

### Code Integration Points
- `src/modules-config.js` — Update the `patch-management` entry: add `patch-policy` as 3rd lesson; add `scenarioId` fields to all 3 lessons; add `exerciseId: '01'` to `ot-patching`; add `quizId: '01'` to `patch-policy`

### Prior Phase Patterns
- `.planning/phases/07-core-module-content-mod-02-mod-03-mod-04/07-CONTEXT.md` — Full Phase 7 content authoring patterns: PS command matching rules, hintPatterns format, scenario narrative structure, compliance ID patterns. MOD-05 follows these same conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Lesson Markdown + frontmatter format — `public/data/modules/logging-auditing/lessons/intro.md`, `ps-logging.md`, `audit-policies.md` are the canonical templates
- Quiz schema — `public/data/modules/logging-auditing/quizzes/01.json` — 3 questions, each with `answers[]` (correct boolean, feedback, complianceControls)
- Exercise schema — `public/data/modules/logging-auditing/exercises/01.json` — steps with `expectedCommands[]` (pattern, caseSensitive), `hintPatterns[]`, `successOutput`, `feedbackOnWrong`
- Scenario schema — `public/data/modules/logging-auditing/scenarios/01.json` — phases with `options[]` (text, outcome, correct, nextPhaseId), `isFinal`

### Established Patterns
- All environment identifiers generic: `PIPELINE-DC01`, `PIPELINE-HIST01`, `10.0.0.0/24`, `ExampleCorp` — no real hostnames, IPs, or KB numbers that imply specific environments
- "In OT environments:" callout block required in every dual-use lesson
- NERC CIP disclaimer verbatim when CIP is mentioned: *"NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark."*
- `complianceControls` in frontmatter use the new specific IDs (e.g., `TSA-PatchMgmt`) — not generic tags (`TSA`)
- PS 5.1 only — no PS 7 cmdlets, no PowerShell Core aliases
- Exercise `expectedCommands[].pattern` uses regex — pipe characters need escaping; caseSensitive: false for most commands

### Integration Points
- `src/modules-config.js`: patch-management entry has 2 lessons — add `patch-policy` (3rd), add all scenarioId/exerciseId/quizId fields. Engine already handles per-lesson content type rendering.
- `public/data/compliance-index.json`: add 3 new control entries at end of `controls[]` array
- No new views, routes, engine code, or test files needed — pure content + config authoring
- NEW pattern note: `ot-patching` and `patch-policy` will have `scenarioId` alongside their `exerciseId`/`quizId` — module-view.js already renders all content type links it finds, so this will work without code changes

</code_context>

<specifics>
## Specific Ideas

- PIPELINE-HIST01 is the historian server name introduced in this module's scenarios (consistent with PIPELINE-DC01 established lore from prior modules)
- Exercise path `C:\Audit\patch-status.csv` mirrors `C:\Evidence\` path established in MOD-04 — consistent OT audit staging directory lore
- Plausible KB numbers for exercise canned output: KB5034441, KB5035849 (realistic Windows Server 2019 KB formats — use for fictional output only)
- Scenario-01's Phase 2 introduces WSUS segmentation as a remediation action — this ties the IT/OT patching split to a concrete architectural response learners can implement

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 8 scope

</deferred>

---

*Phase: 08-patch-management-module-mod-05*
*Context gathered: 2026-05-17*
