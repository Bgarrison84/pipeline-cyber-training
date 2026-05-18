---
title: Advanced OT Log Collection and Retention
lessonId: ot-logging-advanced
moduleId: logging-auditing
order: 4
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-9, NIST-AU-11]
lastReviewed: ''
reviewer: ''
---

## Why OT Log Collection Differs from IT

Collecting security event logs from IT systems is straightforward: domain-joined hosts participate in Windows Event Forwarding (WEF) subscriptions, route logs to a Windows Event Collector (WEC), and forward consolidated events to a central SIEM. OT environments break nearly every assumption that WEF makes.

Pipeline OT segments typically include HMI stations, SCADA servers, engineering workstations, and data historians. These systems often run older Windows versions, reside on air-gapped or firewall-restricted network segments, and cannot communicate directly with enterprise collection infrastructure. WEF subscriptions rely on WinRM (ports 5985 and 5986); a single misconfigured firewall rule or an air-gap policy blocks the entire subscription. The current TSA pipeline security directive requires pipeline operators to implement continuous cybersecurity monitoring, which explicitly includes OT systems — but the directive does not prescribe a specific collection architecture. You must design one that works within your OT constraints.

NIST SP 800-82 Rev 3 Chapter 6 (OT security architecture) addresses this problem directly: it recommends a tiered collection model where OT-native log sources are collected at the OT/DMZ boundary before forwarding to enterprise infrastructure, ensuring that air-gap policies are not compromised to satisfy monitoring requirements.

## Collector Architecture for Isolated OT Segments

The recommended pattern for air-gapped OT segments is a **DMZ-resident collector** with one-way data transfer:

1. An OT DMZ host (running Windows Server) acts as the WEC for the OT segment
2. OT systems push logs to the DMZ collector via WEF subscriptions over the internal OT LAN (no internet or IT network access required at the OT level)
3. The DMZ collector forwards consolidated logs to the enterprise SIEM over a separate, unidirectional interface or a strictly controlled firewall policy

This architecture satisfies the current TSA pipeline security directive's continuous monitoring mandate without placing OT systems in direct network contact with enterprise systems.

To query event logs from an OT host via the DMZ collector, use `Get-WinEvent` with the `-ComputerName` parameter from the DMZ WEC host (requires WinRM connectivity to the OT segment):

```powershell
# Run from the OT DMZ collector host, targeting PIPELINE-HMI01 on the OT LAN
# Retrieves the last 50 Security events from the HMI station
# Requires WinRM enabled on PIPELINE-HMI01 and firewall allow-rule for port 5985
Get-WinEvent -ComputerName PIPELINE-HMI01 -LogName Security -MaxEvents 50 |
    Select-Object TimeCreated, Id, LevelDisplayName, Message |
    Format-List
```

For systems where WinRM is unavailable (legacy OT, workgroup machines), use `wevtutil` over a UNC path or transfer `.evtx` files manually:

```powershell
# Export Security log from PIPELINE-HMI01 to a network share on the DMZ collector
# Run this from a host with file share access to PIPELINE-HMI01
wevtutil epl Security \\PIPELINE-HMI01\C$\LogExports\security-$(Get-Date -Format 'yyyyMMdd').evtx
```

> [!OT]
> In HMI stations and SCADA servers on air-gapped OT networks, Windows Event Forwarding
> subscriptions cannot traverse the DMZ without explicit firewall rules on ports 5985/5986.
> Use a collector host in the OT DMZ and forward consolidated logs to the enterprise SIEM.
> NIST SP 800-82 Rev 3 Section 6.2 specifies event collection architecture for ICS.
> Additionally, many legacy HMI systems run Windows Embedded or Server 2008R2 — versions
> that may not support modern WEF subscription types. Test your subscription type
> (source-initiated vs. collector-initiated) against your actual HMI OS version before
> deploying at scale.

## Retention Policy for OT Logs

Log retention is a distinct compliance requirement from log collection. The current TSA pipeline security directive mandates a minimum retention period for cybersecurity event logs, and this applies equally to OT-sourced logs once collected. OT system local disks are often small — retaining 12 months of logs locally on a SCADA server is not practical. The correct approach is to retain logs on the DMZ collector or enterprise SIEM, not on the OT host itself.

Use `Set-LogProperties` to configure the maximum on-disk log size on the OT host to buffer recent events for local query, while relying on the SIEM for long-term retention:

```powershell
# Set the Security log maximum size to 512 MB on the local system
# This provides ~30 days of buffering for moderate-activity OT systems
# Long-term retention must occur at the SIEM or DMZ collector
Set-LogProperties -LogName Security -MaximumSizeInBytes (512MB)
```

To verify the current maximum size on a remote OT host:

```powershell
# Query current log size limits on PIPELINE-HMI01
Get-LogProperties -LogName Security -ComputerName PIPELINE-HMI01 |
    Select-Object MaximumSizeInBytes, IsEnabled, LogMode
```

`LogMode` should be `Circular` on most OT systems (overwrites oldest events when full). If `LogMode` is `AutoBackup` or `Retain`, configure a WEF subscription to forward events before they are overwritten — otherwise events are silently discarded when the log fills. NIST SP 800-82 Rev 3 Section 6.2 requires that audit records not be lost due to log overflow.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. NERC CIP-007 R5 requires similar retention periods for registered electric utility assets — pipeline operators should use this as a maturity reference when designing OT log retention policies.

The next lesson covers integrating these collected OT logs into a SIEM and normalizing OT-specific event patterns for alert creation.
