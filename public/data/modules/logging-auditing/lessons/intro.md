---
title: Introduction to Windows Event Logs
lessonId: intro
moduleId: logging-auditing
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-2, NIST-AU-3]
---

## What Are Windows Event Logs?

Windows Event Logs are the primary audit trail for Windows-based systems in pipeline IT and OT environments. Every significant system action — user logons, privilege use, process launches, and policy changes — is recorded in the event log. The current TSA pipeline security directive requires pipeline operators to maintain audit logs for security-relevant events as part of a continuous cybersecurity monitoring program.

Windows organizes logs into separate channels, each covering a different area:

- **Security** — Authentication events, privilege use, object access, and account management. This is the most compliance-relevant channel.
- **System** — Operating system events: service starts and stops, driver loads, hardware errors.
- **Application** — Application-level events written by installed software.
- **Microsoft-Windows-PowerShell/Operational** — PowerShell script block activity. Required for detecting unauthorized code execution.

For compliance monitoring, the **Security** channel and the **PowerShell/Operational** channel are your primary sources. Both feed directly into TSA-Monitoring and NIST-AU-2 audit requirements.

## Querying the Security Event Log

Use `Get-WinEvent` (PS 5.1) to query event logs. This cmdlet supports both structured filtering and log-name targeting.

```powershell
# NIST AU-3: Retrieve recent authentication events from the Security log on PIPELINE-DC01
# AU-3 requires logs contain: what happened, when, who, and where
Get-WinEvent -LogName Security -MaxEvents 10
```

To focus on specific event types, filter by Event ID using `Where-Object` and select only the fields you need:

```powershell
# Filter for logon failures (Event ID 4625) — repeated 4625 events indicate potential brute-force
# Select-Object limits output to the three fields relevant to triage
Get-WinEvent -LogName Security -MaxEvents 100 |
    Where-Object { $_.Id -eq 4625 } |
    Select-Object TimeCreated, Id, Message
```

The legacy `Get-EventLog` cmdlet is also available in PS 5.1. It is deprecated in PS 7+ but remains functional on Windows systems that have not upgraded beyond PowerShell 5.1:

```powershell
# Legacy cmdlet — still works in PS 5.1; note: removed in PS 7+
# Use Get-WinEvent on systems where both are available
Get-EventLog -LogName Security -Newest 10
```

> [!OT]
> In OT environments — including HMI stations, SCADA servers, and engineering workstations — event log collection differs significantly from IT. Many OT systems lack domain connectivity and do not have Windows Event Log Forwarding (WELF) configured. In these environments, logs must be collected through alternate means: USB-based log export (using `wevtutil epl Security C:\export\security.evtx`) or a push-based SIEM agent installed directly on the OT host. Some older HMI platforms may not support SIEM agents at all. NIST AU-3 still applies regardless of collection method: every exported log must contain sufficient detail — event ID, timestamp, source, and message. Document your collection method in your security baseline.

## Key Event IDs for Compliance Monitoring

These Event IDs in the Security channel are directly relevant to TSA monitoring requirements:

| Event ID | Name | Compliance Relevance |
|----------|------|----------------------|
| 4624 | Logon Success | Establishes who is accessing which system and when |
| 4625 | Logon Failure | Repeated failures indicate brute-force attempts or unauthorized access |
| 4648 | Logon with Explicit Credentials | Detects credential pass-through and impersonation |
| 4672 | Special Privilege Logon | Fires on every admin logon — required for privileged account monitoring |
| 4688 | Process Creation | Records every process launch; required to detect unauthorized PowerShell execution |

Event ID 4688 is particularly important: when combined with PowerShell/Operational logging (covered in Lesson 2), it creates a complete chain of custody for any script execution on a monitored system.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. The NERC CIP-007 R5 requirement for event logging is structurally similar to the TSA continuous monitoring mandate and NIST AU-2. If your organization uses NERC CIP as a compliance benchmark, the Windows event IDs above satisfy CIP-007 R5 audit requirements as well.

## Next Steps

With the Security event log queryable, the next lesson covers enabling PowerShell Script Block Logging — which populates the PowerShell/Operational channel with full script content for every PS command executed on your systems.
