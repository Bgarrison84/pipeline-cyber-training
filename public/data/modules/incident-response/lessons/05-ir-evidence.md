---
title: Digital Forensics Evidence Collection in OT
lessonId: ir-evidence
moduleId: incident-response
order: 5
complianceTags: [TSA, NIST]
complianceControls: [TSA-IR, NIST-AU-9, NIST-IR-5]
quizId: '02'
lastReviewed: ''
reviewer: ''
---

## Evidence Integrity in OT Incident Response

Forensic evidence collected during a cybersecurity incident serves two purposes in a pipeline OT context: it supports the investigation to understand how the attack occurred, and it satisfies the documentation requirements of the current TSA pipeline security directive for incident notification and post-incident review.

Evidence that cannot be trusted is worse than no evidence. If your collection procedure allows evidence to be modified — by running additional processes on the affected host, by allowing remote connections to the host during collection, or by using a collection tool that writes to the same disk — you cannot establish chain of custody, and the evidence cannot be used to support TSA notification or potential enforcement defense.

The chain of custody requirements under the current TSA pipeline security directive and NIST SP 800-82 Rev 3 Chapter 6 require:

- **A documented collection sequence** — what was collected, in what order, by whom, and at what timestamp
- **Hash verification** — a cryptographic hash (SHA-256) of each collected artifact taken immediately after collection, before the file is moved or transmitted
- **Preservation of volatile state** — volatile evidence (running processes, network connections, memory) must be collected before any reboot or isolation that would destroy it

In pipeline OT incident response, "perfect" evidence often competes with operational continuity. NIST SP 800-82 Rev 3 Chapter 6 explicitly acknowledges that ICS forensic collection may need to be abbreviated when system availability is critical. When a full forensic image is operationally unsafe, collect volatile evidence first and document why a full image was not taken — the documented justification is itself part of the evidence record.

## Volatile Evidence Collection with PowerShell

Volatile evidence — data that exists only in memory or active system state and will be lost on reboot — must be collected first. Collect in this order: running processes, network connections, then event logs.

### Running Process Snapshot

```powershell
# NIST-IR-5 / TSA-IR: Capture running process state before isolation or reboot
# Run on PIPELINE-HMI01 or any compromised host during the evidence collection phase
# This snapshot captures the malicious process's PID, CPU, and start time for the TSA notification record
Get-Process | Select-Object Name, Id, CPU, StartTime, Path |
  Sort-Object CPU -Descending |
  Export-Csv -Path 'C:\Evidence\processes.csv' -NoTypeInformation
```

Cross-reference high-CPU processes with no `Path` value against the event log. A process without a path running at high CPU from a non-system directory is a primary malware indicator.

Immediately hash the output file to establish chain of custody:

```powershell
# NIST-AU-9: Hash the evidence file immediately after collection — before any copy or transmission
# The SHA-256 hash is the chain-of-custody anchor for this evidence artifact
Get-FileHash -Path 'C:\Evidence\processes.csv' -Algorithm SHA256 |
  Select-Object Hash, Path |
  Export-Csv -Path 'C:\Evidence\hashes.csv' -NoTypeInformation -Append
```

### Network Connection State

```powershell
# NIST-IR-5 / TSA-IR: Capture active network connections — volatile state lost on reboot
# Documents C2 connections, lateral movement targets, and listening ports at time of collection
Get-NetTCPConnection |
  Where-Object State -eq Established |
  Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess |
  Export-Csv -Path 'C:\Evidence\connections.csv' -NoTypeInformation
```

An established connection from PIPELINE-HMI01 to a non-RFC1918 address (not in `10.*`, `172.16–31.*`, or `192.168.*`) is a confirmed command-and-control indicator. Cross-reference the `OwningProcess` PID with the process snapshot.

### Security Event Log Export

```powershell
# NIST-AU-9 / TSA-IR: Export the Security event log as a binary .evtx file for chain-of-custody preservation
# wevtutil epl preserves the original binary format — hash immediately after export
wevtutil epl Security C:\Evidence\Security.evtx
```

The `.evtx` binary format preserves event timestamps and metadata exactly as written by the Windows event subsystem — no transformation that could be challenged in a post-incident review. Follow up with a hash:

```powershell
# Hash the exported Security event log immediately after wevtutil completes
Get-FileHash -Path 'C:\Evidence\Security.evtx' -Algorithm SHA256 |
  Select-Object Hash, Path |
  Export-Csv -Path 'C:\Evidence\hashes.csv' -NoTypeInformation -Append
```

### Creating a Timestamped Evidence Folder

Before collecting evidence, create a timestamped evidence folder so that multiple incident responses do not overwrite each other's evidence:

```powershell
# TSA-IR: Create a timestamped evidence folder at the start of each incident response
# The timestamp in the folder name is the official evidence collection start time
$date = Get-Date -Format yyyyMMdd-HHmmss
$evidencePath = "C:\Evidence\incident-$date"
New-Item -ItemType Directory -Path $evidencePath -Force
Write-Output "Evidence folder created: $evidencePath"
```

Use `$evidencePath` as the base path for all evidence files collected during this incident. The folder name timestamp becomes the official evidence collection start time for chain-of-custody documentation.

> [!OT]
> In OT environments, PowerShell may not be available on all HMI workstations. For legacy Windows XP or embedded systems, use built-in tools: `netstat -ano` for network connections, `tasklist /svc` for running processes and their associated services, and `ipconfig /all` for network configuration. Capture these outputs by redirecting to a USB drive: `netstat -ano > E:\Evidence\connections.txt`. NIST SP 800-82 Rev 3 Section 6.4.2 permits manual evidence collection when automated tools are unavailable — document the collection method used and apply SHA-256 verification via `certutil -hashfile E:\Evidence\connections.txt SHA256` (certutil is available on all Windows versions, including XP).

## Preserving OT Log Evidence Before System Restart

Before restarting or restoring any OT host, preserve all locally stored logs. This is especially critical for historian workstations and SCADA servers that aggregate OT log data not forwarded to a central SIEM.

### Historian Log Export

For historians running on Windows (OSIsoft PI, AVEVA, Wonderware), the historian database files may not be accessible during a live incident without stopping the historian service. Collect the application event log first — it records historian service starts, stops, and errors that may correlate with the attack timeline:

```powershell
# NIST-AU-9: Export the Application event log from a historian workstation before restart
# Historian service events (starts, stops, errors) are in the Application log, not Security
wevtutil epl Application C:\Evidence\Application.evtx
Get-FileHash -Path 'C:\Evidence\Application.evtx' -Algorithm SHA256 |
  Export-Csv -Path 'C:\Evidence\hashes.csv' -NoTypeInformation -Append
```

### PowerShell Operational Log Export

If the attack used an encoded or obfuscated PowerShell command (a common initial access technique), the PowerShell/Operational event log captures the decoded script block content — but only if script block logging is enabled. Export it before any restart:

```powershell
# NIST-IR-5: Export PowerShell/Operational log — contains decoded script blocks if ScriptBlockLogging is enabled
# This log may contain the full text of the attacker's initial access script
wevtutil epl "Microsoft-Windows-PowerShell/Operational" C:\Evidence\PowerShell-Operational.evtx
Get-FileHash -Path 'C:\Evidence\PowerShell-Operational.evtx' -Algorithm SHA256 |
  Export-Csv -Path 'C:\Evidence\hashes.csv' -NoTypeInformation -Append
```

### Full Evidence Package Verification

After collecting all evidence artifacts, verify the complete collection against the hash log before transmitting or packaging for TSA notification:

```powershell
# NIST-AU-9: Verify all collected evidence files against the hash record
# Run before packaging or transmitting — confirms no file was modified after collection
$evidenceFiles = Get-ChildItem -Path 'C:\Evidence\' -File -Exclude 'hashes.csv'
foreach ($file in $evidenceFiles) {
  $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
  Write-Output "$hash  $($file.Name)"
}
```

Compare this output to `hashes.csv` entries manually or via a diff tool. Any mismatch indicates the file was modified after the original hash was recorded — flag in the incident log before including in the TSA notification package.

## Evidence Collection Summary Checklist

Document completion of each step in `C:\Evidence\incident-$date\incident-log.txt`:

| Evidence Type | Command / Method | Hash Collected? | OT-Specific Notes |
|--------------|-----------------|-----------------|-------------------|
| Running processes | `Get-Process \| Export-Csv` (or `tasklist /svc`) | Required | Cross-reference high-CPU + no-path processes |
| Network connections | `Get-NetTCPConnection \| Export-Csv` (or `netstat -ano`) | Required | Flag non-RFC1918 established connections |
| Security event log | `wevtutil epl Security` | Required | Export before isolation changes log state |
| Application event log | `wevtutil epl Application` | Required | Historian service events |
| PowerShell Operational log | `wevtutil epl Microsoft-Windows-PowerShell/Operational` | Required | Only if ScriptBlockLogging was enabled |
| Historian database backup | Vendor-specific procedure | Required | Coordinate with operations before stopping historian service |

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-008 and CIP-011 require that security events be documented and that sensitive information (including forensic artifacts) be protected throughout the IR process — the TSA pipeline security directive has structurally equivalent chain-of-custody and notification documentation requirements for pipeline operators.
