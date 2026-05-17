# Phase 8: Patch Management Module (MOD-05) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 08-patch-management-module-mod-05
**Areas discussed:** Lesson structure, Exercise commands, Scenario incident, Compliance control IDs

---

## Lesson Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Keep + add (wsus-patching → intro, ot-patching → exercise, new patch-policy → quiz) | Preserve existing wsus-patching and ot-patching IDs; add patch-policy as 3rd lesson | ✓ |
| Restructure (new intro, new ps-patch-audit, keep ot-patching as quiz) | Rename wsus-patching to intro; add ps-patch-audit for exercise; keep ot-patching as quiz | |

**User's choice:** Keep + add — preserve the existing lesson IDs and add patch-policy as the 3rd lesson.

---

| Option | Description | Selected |
|--------|-------------|----------|
| "Patch Management Policy and Compliance Documentation" | Covers policy side: compensating controls, risk-based deferral, TSA reporting, auditor expectations | ✓ |
| "Vulnerability Windows and Compensating Controls" | Narrower — specifically the risk calculation for deferred patches | |
| "OT Patch Governance and Vendor Coordination" | Focuses on OEM approval workflow, change management, maintenance windows | |

**User's choice:** "Patch Management Policy and Compliance Documentation" — covers the full policy side.

---

| Option | Description | Selected |
|--------|-------------|----------|
| CIP-007 in wsus-patching, CIP-010 in ot-patching | CIP-007 (patch management) in IT lesson; CIP-010 (change management) in OT lesson; both with verbatim disclaimer | ✓ |
| Both CIP-007 and CIP-010 in patch-policy only | Keep CIP refs in policy lesson only | |
| Claude decides | Follow prior module patterns organically | |

**User's choice:** CIP-007 in wsus-patching, CIP-010 in ot-patching — distributes NERC CIP refs where they contextually fit.

---

## Exercise Commands

| Option | Description | Selected |
|--------|-------------|----------|
| Full audit chain: inventory → filter → export → verify | Get-Hotfix (inventory), Get-WmiObject WQL filter (overdue patches), Export-Csv (evidence), Measure-Object (verify) | ✓ |
| WSUS-focused: check → report → export → verify | Get-Hotfix + Get-WsusServer (requires WSUS admin snap-in) + Export-Csv | |
| Simpler 4-step: two Get-Hotfix variants + export + verify | All steps use Get-Hotfix variants — simpler command set | |

**User's choice:** Full audit chain — covers the realistic workflow from inventory to evidence export.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 2-3 overdue patches including a critical CVE | Step 2 output reveals overdue KBs including one security/CVE update — reinforces documentation requirement | ✓ |
| No overdue patches (audit pass) | Step 2 returns empty — focus is on generating the clean evidence artifact | |
| Claude decides | Author whatever output best supports the OT teaching narrative | |

**User's choice:** 2-3 overdue patches including a critical CVE — creates a teaching moment about documentation obligations.

---

## Scenario Incident

| Option | Description | Selected |
|--------|-------------|----------|
| Critical CVE published, historian server affected | CVSS 9.8 CVE, PIPELINE-HIST01 affected, OEM qualification 3-6 months out | ✓ |
| Routine scan reveals 6-month-old unpatched SCADA workstation | No active exploit, public vulnerability | |
| IT-pushed WSUS update broke OT system | PLC polling service crash from unqualified IT update | |

**User's choice (initial):** "Let's do one of each" — freeform response.

**Clarification Q:** Should the main scenario use multiple triggers across its two phases, AND have three separate scenario files (one per lesson)?

**User confirmed:** Both — multi-phase scenario on wsus-patching (CVE Phase 1 + WSUS aftermath Phase 2) AND three separate scenario files (new pattern with scenarioId on all 3 lessons).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Skip the window vs. wait (change management) | Ops manager wants to skip scheduled maintenance window; patch failure mid-window | ✓ |
| Air-gap staging failure: USB media vs. network path | Wrong KB version staged on USB; hash verification failure | |

**User's choice (scenario-02):** Skip the window vs. wait — highlights OT change management discipline.

---

| Option | Description | Selected |
|--------|-------------|----------|
| TSA auditor requests docs, 1 of 3 missing | 1 undocumented deferred patch during real TSA audit; transparency vs. claiming forthcoming | ✓ |
| Internal audit finds gaps before TSA visit | Internal pre-audit catches 6 months of gaps; backfill vs. corrective action plan | |

**User's choice (scenario-03):** TSA auditor scenario — real audit stakes, transparency lesson.

---

## Compliance Control IDs

| Option | Description | Selected |
|--------|-------------|----------|
| One TSA ID (TSA-PatchMgmt) | Single TSA ID covering all patch management; matches TSA SD-02F Measure 4 structure | ✓ |
| Three TSA IDs (TSA-PatchIT, TSA-PatchOT, TSA-PatchAudit) | Granular editorial tagging — TSA doesn't formally separate these | |

**User's choice:** One TSA-PatchMgmt ID — reflects how TSA SD-02F is actually structured.

---

| Option | Description | Selected |
|--------|-------------|----------|
| SI-2 + MA-2 | SI-2 (Flaw Remediation) for all sub-areas; MA-2 (Controlled Maintenance) for OT patching specifics | ✓ |
| SI-2 only | Core patch management control only — MA-2 is a stretch | |
| SI-2 + MA-2 + CM-6 | Most comprehensive — adds CM-6 (Configuration Settings) for compliance reporting | |

**User's choice:** SI-2 + MA-2 — balances coverage without over-tagging.

---

## Claude's Discretion

- Exact lesson prose depth — use MOD-01 as benchmark
- Quiz question topics (must span all 3 sub-areas)
- Specific hintPatterns per exercise step
- Exact successOutput text (realistic KB numbers, dates)
- OT callout placement within lessons
- Narrative details within scenarios (KB numbers, timestamps, error messages)

## Deferred Ideas

None — discussion stayed within Phase 8 scope.
