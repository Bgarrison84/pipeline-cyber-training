---
title: SIEM Integration for Pipeline OT Environments
lessonId: siem-integration
moduleId: logging-auditing
order: 5
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-SI-4, NIST-AU-12]
quizId: '02'
lastReviewed: ''
reviewer: ''
---

## What SIEM Receives from OT

A Security Information and Event Management (SIEM) platform aggregates logs from across your environment and applies correlation rules to detect threats. For OT environments, the path from source to SIEM is rarely direct and the choice of forwarding method significantly affects both data quality and operational risk.

Three common forwarding approaches exist for OT-sourced Windows logs:

| Method | Mechanism | OT Suitability |
|--------|-----------|----------------|
| **Windows Event Forwarding (WEF)** | Native WinRM-based push subscription | Preferred for Windows OT hosts; no agent required; manageable firewall footprint (port 5985/5986) |
| **Syslog forwarding** | UDP/TCP syslog from a collector host | Useful for non-Windows OT (PLCs with syslog support) or legacy systems; no per-event structure |
| **API/agent forwarding** | SIEM agent installed on OT host | High fidelity but introduces agent software on a validated OT platform — requires change-management review |

WEF is preferred for Windows-based OT because it requires no third-party software installed on the OT host, uses a well-defined transport (WinRM), and preserves the full Windows event schema in XML form. The current TSA pipeline security directive's continuous monitoring requirement applies to OT systems — your SIEM must receive OT events in near real-time, not via batch exports. NIST SP 800-82 Rev 3 Chapter 6 continuous monitoring guidance supports a collector-at-the-boundary architecture, where a DMZ WEC host aggregates OT events before forwarding to the enterprise SIEM (see Lesson 4 for that architecture).

## Normalizing OT Events

OT-sourced Windows events use the same Event IDs as IT systems but originate from different process contexts. A logon event (4624) from `PIPELINE-HMI01` carries a different meaning than the same event from an IT workstation — the account type, logon type, and process name help distinguish HMI operator sessions from potential lateral movement.

Key Event IDs for OT context monitoring:

| Event ID | Source Channel | OT Significance |
|----------|---------------|-----------------|
| 4624 | Security | Logon success — on HMI, filter to expected operator accounts; unexpected accounts are high-priority alerts |
| 4625 | Security | Logon failure — repeated failures on an air-gapped HMI can indicate physical access attempts or automated credential testing |
| 4688 | Security | Process creation — on locked-down OT systems, any process not in the approved baseline is an alert condition |
| 4104 | PowerShell/Operational | Script block content — PowerShell execution on a SCADA server warrants immediate investigation |

Use `Get-WinEvent` with a `Where-Object` filter to extract only critical-severity events for SIEM forwarding verification:

```powershell
# Retrieve critical and error events (Level 1 and 2) from PIPELINE-HMI01
# Level 1 = Critical, Level 2 = Error — events worth forwarding to SIEM immediately
# Run from the DMZ collector host with WinRM access to PIPELINE-HMI01
Get-WinEvent -ComputerName PIPELINE-HMI01 -LogName Security -MaxEvents 200 |
    Where-Object { $_.Level -le 2 } |
    Select-Object TimeCreated, Id, Level, LevelDisplayName, Message |
    Export-Csv -Path C:\Exports\hmi01-critical-$(Get-Date -Format 'yyyyMMdd').csv -NoTypeInformation
```

To filter for specific event IDs relevant to OT baseline anomaly detection:

```powershell
# Retrieve process creation events (4688) from PIPELINE-HMI01 — new processes on an HMI
# warrant review against the approved software baseline
Get-WinEvent -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4688
    StartTime = (Get-Date).AddHours(-24)
} -ComputerName PIPELINE-HMI01 |
    Select-Object TimeCreated, @{N='ProcessName'; E={$_.Properties[5].Value}},
                               @{N='CommandLine'; E={$_.Properties[8].Value}} |
    Format-Table -AutoSize
```

> [!OT]
> On HMI and SCADA workstations with older Windows versions (2012R2 or earlier),
> PowerShell Remoting may not be available. Use agentless WMI event subscription
> as a fallback. NIST SP 800-82 Rev 3 Section 6.3 addresses legacy OT platform constraints.
> Additionally, on some air-gapped OT networks, DNS resolution for hostnames like
> PIPELINE-HMI01 may not work from the DMZ collector. Use the OT segment IP address
> (e.g., 10.0.0.0/24 range host) as the `-ComputerName` value in that case.

## Alert Tuning for Pipeline Environments

Raw OT event forwarding generates significant false-positive volume in a SIEM. SCADA systems execute scheduled processes, historian agents, and polling services at regular intervals — these are legitimate OT operations that look like process-creation noise in a generic SIEM ruleset.

The most effective tuning strategy for OT alert reduction is **process hash whitelisting**: maintain a known-good inventory of approved OT application executables and create SIEM suppression rules for process creation events where the parent process hash matches the approved list. Any 4688 event with an unrecognized process hash is promoted to an alert.

To retrieve the hash of a known-good OT process for baselining:

```powershell
# Get the SHA256 hash of an approved OT application executable
# Record this hash in your approved-process baseline before suppressing alerts
Get-FileHash -Path "C:\Program Files\ExampleCorp\HistorianAgent\historian.exe" -Algorithm SHA256 |
    Select-Object Hash, Path
```

For scheduled SIEM baseline reviews, compare the current process list against the approved inventory:

```powershell
# Compare currently running processes on PIPELINE-HMI01 against a CSV baseline
# Baseline CSV must contain columns: ProcessName, Hash
# Requires Invoke-Command with WinRM access from the DMZ collector
$running = Invoke-Command -ComputerName PIPELINE-HMI01 -ScriptBlock {
    Get-Process | Select-Object Name,
        @{N='Hash'; E={ (Get-FileHash $_.Path -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash }}
}
$baseline = Import-Csv -Path C:\Baselines\hmi01-process-baseline.csv
$running | Where-Object { $_.Hash -notin $baseline.Hash } |
    Select-Object Name, Hash |
    Format-Table -AutoSize
```

NIST SP 800-82 Rev 3 Section 6.3 recommends maintaining an approved software list for all OT systems and reviewing it on a defined schedule. The current TSA pipeline security directive's continuous monitoring requirement supports automated comparison against this baseline as a detective control.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. NERC CIP-007 R4 software vulnerability management requirements are a useful maturity reference for building process baseline procedures.

This lesson concludes the Logging & Auditing module. Use the quiz below to verify your understanding of advanced OT log collection and SIEM integration concepts.
