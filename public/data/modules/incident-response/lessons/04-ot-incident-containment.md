---
title: OT-Specific Incident Containment Procedures
lessonId: ot-incident-containment
moduleId: incident-response
order: 4
complianceTags: [TSA, NIST]
complianceControls: [TSA-IR, NIST-IR-4, NIST-IR-5]
lastReviewed: ''
reviewer: ''
---

## Why OT Containment Differs from IT Containment

In a traditional IT environment, isolating a compromised system is a straightforward first step: pull the network cable, run `Disable-NetAdapter`, or block the port at the switch level. The workstation goes dark, the threat is contained, and forensic analysis begins. The cost of a few minutes of downtime is acceptable.

In a pipeline OT environment, that same instinct can trigger a process safety event. PIPELINE-HMI01 may be actively issuing control commands to field devices. The historian on the 10.0.0.0/24 segment may be the only real-time record of pressure readings and flow rates. An SCADA server providing polling for remote terminal units (RTUs) cannot simply be isolated without confirming that failover or manual control is in place.

The current TSA pipeline security directive requires pipeline operators to establish documented containment procedures — not improvised responses — because undocumented, ad hoc containment actions in OT environments are how cyber incidents become operational safety incidents. NIST SP 800-82 Rev 3 Chapter 6 dedicates a full section to ICS-specific incident response and explicitly requires that containment procedures account for operational continuity and process safety constraints.

Key OT containment principles that differ from IT:

| Principle | IT Approach | OT Pipeline Approach |
|-----------|------------|----------------------|
| Isolation trigger | Immediate on confirmed threat | Only after operations team notification and coordination |
| Isolation method | Host-level NIC disable or port shutdown | Switch-level VLAN quarantine preferred; host-level only after operations confirms safety |
| Evidence vs. containment priority | Containment first, evidence second | Same — but OT adds a third variable: operational continuity |
| Recovery time objective | Hours to days acceptable | Pipeline control must be maintained; RTO measured in minutes for control systems |
| Authority to isolate | IT Security decides alone | Shared authority — IT Security + OT Operations Control Room Supervisor |

## OT-Safe Containment Techniques

### Switch-Level VLAN Quarantine

The preferred OT containment method is network isolation at the switch level — moving the compromised host's switch port into a quarantine VLAN rather than disabling the host's network adapter. This approach:

- Removes the host from the production OT network without shutting down the host process
- Preserves the host's ability to run local control logic during the investigation period (some RTU/HMI systems run locally when disconnected from the network)
- Allows a forensic copy of volatile state to be taken from the quarantine VLAN before the system is powered down
- Is reversible — restoring connectivity is a single switch port VLAN reassignment

Contact your OT network team or operations technology lead to identify which switches manage the SCADA, historian, and HMI VLANs before an incident occurs. Document the switch port assignment for each critical OT host in your IR plan now — during an active incident is not the time to be mapping the network.

### Coordination with the Operations Control Room

Before any OT host isolation — even a single HMI workstation — the incident response team must notify the operations control room supervisor. This is not bureaucratic delay. It serves three functions:

1. **Safety verification:** The supervisor confirms the host is not actively executing a safety-critical control command that cannot be interrupted
2. **Failover confirmation:** The supervisor confirms that manual or redundant control is available for the process segment the host manages
3. **Operational record:** The notification creates a documented handoff that becomes part of the TSA incident notification

This notification takes 30–60 seconds in a practiced IR plan. Build a direct radio or phone contact procedure to the control room supervisor into your IR plan. Test it during quarterly IR drills.

### PowerShell Network Adapter Isolation — IT Hosts Only

For workstations confirmed to be IT-only (no OT connectivity, not running any control or historian function), host-level isolation with PowerShell is appropriate:

```powershell
# TSA-IR / NIST-IR-4: Isolate a confirmed IT-only workstation from the network
# DO NOT run on OT-connected hosts without operations team coordination and approval
# PIPELINE-DC01 example — confirm this host has no OT function before running
Disable-NetAdapter -Name "*" -Confirm:$false
```

The `-Name "*"` wildcard disables all network adapters simultaneously, preventing the host from reconnecting to an alternate interface. Use `-Confirm:$false` to prevent the interactive prompt during automated response runbooks.

For OT-connected systems, do not run `Disable-NetAdapter` without explicit operations approval. Instead, document the affected host and coordinate with the switch team for VLAN-level quarantine.

> [!OT]
> In active pipeline OT environments, isolating a SCADA server or HMI without coordination with the operations control room may cause a process safety event. The incident response team must notify the control room supervisor before isolating any OT host. NIST SP 800-82 Rev 3 Section 6.4.3 requires a documented OT-specific IR plan that accounts for process safety constraints. The pipeline operations supervisor has the authority to delay OT host isolation if the alternative — a process safety incident — represents a higher risk than the ongoing cyber threat. Document every such decision in the incident log.

## Notifying TSA Within Required Timeframes

The current TSA pipeline security directive requires operators to report cybersecurity incidents to TSA within a specified timeframe after determining that a reportable incident has occurred. The notification requirement is not contingent on completing your investigation — it is triggered by detection of a confirmed incident affecting pipeline systems.

To meet notification requirements, you need:

- **Accurate detection timestamp** — from your SIEM or EDR alert, not from the time of manual discovery. Your SIEM alert timestamp is the official detection time.
- **A real-time incident log** — document every containment action with a timestamp as you take it. Do not reconstruct the timeline from memory after the fact.
- **Operational impact assessment** — did the incident affect SCADA, historian, safety instrumented systems, or pipeline control? Be specific.

Building the notification document from a live incident log is far faster than reconstructing it from notes. Start the incident log at the moment you confirm the incident is reportable:

```powershell
# TSA-IR: Start the incident log at the moment you confirm a reportable incident
# Captures the official detection timestamp and initial scope description
$detectionTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC'
$incidentScope = Read-Host 'Brief incident description (system, nature, initial scope)'
"INCIDENT OPENED: $detectionTime`nScope: $incidentScope" | Out-File -FilePath 'C:\Evidence\incident-log.txt'
```

Record every containment action as a new entry. The resulting `incident-log.txt` file is the source document for the TSA notification, not a post-incident reconstruction.

## Containment Decision Matrix

Use this matrix during the triage phase to determine the correct initial containment action for each affected host:

| Host Type | Confirmed IT Function Only | OT-Adjacent (shares VLAN) | Direct OT Role (HMI, SCADA, Historian) |
|-----------|---------------------------|--------------------------|----------------------------------------|
| Ransomware indicators only | Immediate `Disable-NetAdapter` | Switch VLAN quarantine; notify operations | Notify operations first; then switch VLAN quarantine |
| Active lateral movement toward OT VLANs | Immediate `Disable-NetAdapter` | Emergency switch VLAN quarantine; notify operations simultaneously | Safety assessment by operations before any isolation action |
| Confirmed C2 beaconing, no lateral movement | `Disable-NetAdapter` + forensic collection | Switch VLAN quarantine; begin forensic collection | Notify operations; collect volatile evidence first |

The key variable is not the threat type — it is the host's relationship to OT control functions. An IT host with ransomware is an IT problem. The same ransomware on an HMI is an operational safety problem.

## OT Containment Checklist

Attach this checklist to your incident record for every OT-relevant containment action:

| Step | Action | Verified By |
|------|--------|-------------|
| 1 | Confirm host's OT function (none / adjacent / critical) | IT Security |
| 2 | If OT function: notify control room supervisor before isolation | IR Lead |
| 3 | Document supervisor notification time in incident log | IR Lead |
| 4 | Execute containment (host-level or switch VLAN per matrix above) | Network/IT |
| 5 | Confirm host is isolated; verify on switch port monitoring | Network/IT |
| 6 | Collect volatile evidence from isolated host | IR Lead |
| 7 | Begin TSA notification package preparation | IR Lead |

Completing this checklist and logging each step in `C:\Evidence\incident-log.txt` gives you the documented evidence trail required for TSA notification and post-incident review under NIST IR-4.
