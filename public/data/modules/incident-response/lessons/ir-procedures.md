---
title: Containment and Recovery Procedures
lessonId: ir-procedures
moduleId: incident-response
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-IR, NIST-IR-4]
quizId: '01'
---

## Why Containment Procedures Matter in OT

The current TSA pipeline security directive requires pipeline operators to establish documented containment procedures for cybersecurity incidents affecting pipeline systems. This is not optional — documented procedures are auditable; ad hoc responses are not.

In OT environments, containment without a procedure risks inadvertently taking down safety instrumented systems, blocking SCADA polling, or interrupting historian data collection that is legally required for operational continuity. Documented procedures ensure consistent, authorized, and reversible containment actions. Every containment action must be reversible — if you cannot restore a system to its pre-isolation state within your recovery time objective, you have a recovery planning gap.

## OT-Specific Containment Decision Tree

Different incident scenarios require different containment approaches. Use this table to match the scenario to the appropriate first action:

| Scenario | First Action | Rationale |
|----------|-------------|-----------|
| Workstation with ransomware indicators only (no OT connectivity) | Isolate immediately — `Disable-NetAdapter` | IT-only workstation; no operational impact from isolation |
| Workstation with ransomware indicators AND OT-critical functions | Collect evidence first, then isolate — coordinate with operations | OT impact of isolation may exceed operational risk of delayed containment |
| Ransomware spreading toward historian VLAN (lateral movement active) | Isolate boundary segment immediately regardless of evidence state | Safety first; active spread to SCADA/SIS outweighs any forensic loss |
| Compromised service account on domain | Disable in AD + force password reset + preserve logs before removing from domain | Account-level containment is reversible; domain removal is not |

The key OT-specific principle: when lateral movement toward safety-critical systems is the active threat, containment priority supersedes forensic completeness.

## Checking IR Plan Readiness

Run this during quarterly IR drills to verify that the evidence staging directory exists and is writable before an incident occurs:

```powershell
# NIST IR-4: Verify that the C:\Evidence\ evidence staging directory exists and is writable before an incident
# Create it during quarterly IR drills rather than during an actual incident
Test-Path 'C:\Evidence\' ; New-Item -ItemType Directory -Path 'C:\Evidence\' -Force
```

If `Test-Path` returns `False`, the directory does not exist. The `New-Item` command creates it with `-Force` (no error if it already exists). After creation, write a test file to confirm write permissions:

```powershell
# Confirm write access to C:\Evidence\ before the incident
'IR drill test' | Out-File -FilePath 'C:\Evidence\drill-test.txt'
```

Delete the test file after confirming write access. Document the readiness check in your quarterly IR drill record.

## Documenting the Incident Timeline

Every action during an incident response must be logged in real time. This simple approach creates a timestamped audit trail that can be incorporated directly into the TSA incident report:

```powershell
# TSA-IR: Append a timestamped entry to the incident log during response
# Run after each action taken — creates a chronological record for TSA notification
Add-Content -Path 'C:\Evidence\incident-log.txt' -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC') — $(Read-Host 'Action taken')"
```

The `Read-Host` prompt captures a one-line description of the action. Run this command after every containment step — isolating a system, disabling an account, blocking a firewall rule. The resulting log file is your incident timeline for the TSA notification.

## TSA Incident Notification Requirements

The current TSA pipeline security directive requires notification of cybersecurity incidents within specific timeframes. Notification must include:

- **What systems were affected** — hostname, role (OT/IT), function in pipeline operations
- **When the incident was detected** — timestamp from SIEM/EDR alert, not discovery during manual review
- **What containment actions were taken** — document every step from the incident log
- **The operational impact on pipeline operations** — whether pipeline control, safety systems, or data collection were affected

Notification goes to TSA's cybersecurity division. Contact information is in the operator's TSA-approved cybersecurity plan. Failure to notify within the required timeframe is itself a compliance violation — separate from and in addition to the underlying incident.

> [!OT]
> In OT environments, recovery requires verification that operational data integrity was not compromised before reconnecting to the control network. Run a data integrity check on historian records covering the incident window before declaring recovery complete. Verify that all SCADA setpoints and configuration files on restored workstations match the known-good baseline stored in the configuration management system. NIST IR-4 incident handling requires post-incident review — document what worked, what failed, and what process changes are needed before closing the incident record.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-008 requires that incident response plans be tested annually and that all incidents be documented and reported — the TSA pipeline security directive imposes structurally equivalent documentation and notification obligations for pipeline operators.

## IR Procedure Checklist

Use this checklist for every incident response. Document completion of each item in `C:\Evidence\incident-log.txt`:

| Checklist Item | Required? | Notes |
|----------------|-----------|-------|
| Evidence collection complete before isolation | Situational | Mandatory if operationally safe; skip only if active OT spread is imminent |
| OT operations notified before any network isolation | Mandatory | Even if only 30 seconds — no undisclosed OT network changes |
| `C:\Evidence\` directory pre-staged | Pre-incident | Create during quarterly IR drill, not during active response |
| TSA notification initiated within required timeframe | Mandatory | Use incident log timestamps to establish detection-to-notification interval |
| Incident log timestamped for every action | Mandatory | Required for TSA notification documentation |
| Post-incident review scheduled | Mandatory | Within 30 days of incident closure per NIST IR-4 |
