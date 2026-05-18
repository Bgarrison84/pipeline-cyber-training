---
title: Incident Response Overview
lessonId: intro
moduleId: incident-response
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-IR, NIST-IR-4]
lastReviewed: ''
reviewer: ''
---

## What Is Incident Response in a Pipeline Context?

The current TSA pipeline security directive requires pipeline operators to establish and implement a cybersecurity incident response plan. In a pipeline OT environment, an incident is any cybersecurity event that affects or could affect the availability, integrity, or confidentiality of operational technology systems — including SCADA, DCS, historian servers, and HMI workstations.

Incident response in OT differs fundamentally from IT: OT incidents carry operational safety implications. A delayed or incorrect response can affect pipeline pressure control, leak detection, or safety instrumented systems. Every response action must be coordinated with operations to avoid creating a second incident in the process of containing the first.

## The Four IR Phases in Pipeline OT

A structured incident response approach follows four phases. In OT environments, the order matters more than in IT — containment before recovery, and evidence before containment where operationally safe:

| Phase | Actions | NIST Control |
|-------|---------|--------------|
| Detection | SIEM/EDR alert fires; monitoring logs reviewed for indicators of compromise | NIST IR-4 |
| Triage | Scope the incident; determine OT vs. IT impact; identify affected systems | NIST IR-4 |
| Containment | Isolate affected systems; coordinate with OT operations before any network changes | NIST IR-4 |
| Recovery | Restore from verified backup; re-verify operational integrity before reconnecting to the control network | NIST IR-4 |

The triage phase is the most critical decision point for pipeline operators: if the incident shows signs of lateral movement toward safety instrumented systems or SCADA, containment priority overrides forensic completeness.

## Identifying Suspicious Processes with PowerShell

High-CPU processes with no known path or running from temporary directories are an early ransomware indicator. PowerShell provides direct visibility into process state on PIPELINE-DC01:

```powershell
# NIST IR-4: Identify high-CPU processes that may indicate ransomware or cryptomining activity on PIPELINE-DC01
# Processes without a Path value or running from C:\Users\*\AppData\Local\Temp\ are strong ransomware indicators
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, CPU, Path
```

Review the output for processes with anomalously high CPU values and missing or suspicious paths. A legitimate Windows process will have a `Path` value under `C:\Windows\System32\` or a known application directory. A process running from a temp directory or with no path is a priority investigation target.

## Detecting Unauthorized External Connections

In an OT environment, any established TCP connection from a pipeline workstation to a non-RFC1918 address is a critical anomaly requiring immediate investigation. Pipeline workstations should only communicate with internal systems on the 10.0.0.0/24 network:

```powershell
# NIST IR-4: Identify established TCP connections to external IPs (not in 10.0.0.0/8 range)
# An established connection to a non-internal IP from a pipeline workstation is a command-and-control indicator
Get-NetTCPConnection -State Established | Where-Object {$_.RemoteAddress -notlike '10.*'} | Select-Object LocalPort, RemoteAddress, RemotePort, OwningProcess
```

The `OwningProcess` field contains the PID — cross-reference with the process snapshot from `Get-Process` to identify which application is maintaining the external connection. A high-CPU process with no legitimate path that also has an external TCP connection is a confirmed ransomware indicator.

> [!OT]
> In OT environments, ransomware that reaches the historian VLAN can corrupt or encrypt time-series process data, affecting operational visibility for hours or days. The primary OT incident response principle is safety first — if a threat shows signs of lateral movement toward safety instrumented systems (SIS) or SCADA, isolate before collecting complete forensic evidence. Partial forensic evidence from an isolated system is better than a complete forensic dataset from a system that has spread malware to the control network. Coordinate all isolation decisions with the operations team before disconnecting any system that may affect pipeline control.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-008 incident reporting requirements mandate that cybersecurity incidents affecting critical cyber assets are reported and tracked — the TSA pipeline security directive has structurally equivalent incident notification requirements for pipeline operators.

The next lesson covers evidence collection with PowerShell — how to capture process state, network connection snapshots, and Security event log exports before isolating a compromised system.
