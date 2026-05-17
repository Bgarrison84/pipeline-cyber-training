---
title: Evidence Collection with PowerShell
lessonId: ps-ir
moduleId: incident-response
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-IR, NIST-AU-12]
---

## Evidence Collection Principles

The fundamental rule of incident response is: collect before you contain, where operationally safe. Evidence collected after containment is still valuable, but evidence that was overwritten during containment is gone permanently.

PowerShell provides three key evidence collection capabilities that satisfy NIST AU-12 audit record generation requirements:

1. **Process snapshot** — captures which processes are running and their CPU activity at the time of the incident
2. **Network connection snapshot** — captures all active TCP connections and the processes that own them
3. **Security event log export** — exports logon events to a portable CSV for chain-of-custody documentation

All collections should be timestamped and saved to a dedicated evidence path (`C:\Evidence\`). Create this directory during quarterly IR drills — not during an actual incident.

## Capturing a Process Snapshot

Run this at the first sign of anomaly on PIPELINE-DC01. The output represents system state at the time of the snapshot:

```powershell
# NIST AU-12: Capture a timestamped process snapshot as evidence — run at first sign of anomaly on PIPELINE-DC01
# A high-CPU process with no Path or running from C:\Users\*\AppData\Local\Temp\ is a strong ransomware indicator
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, CPU, Path
```

Document the PID (`Id`) of any suspicious process for correlation with network connection data. A process with anomalous CPU consumption and no recognizable path is the primary forensic target. Note that `CPU` values in PS represent cumulative processor seconds, not a percentage — a high value indicates the process has been consuming significant CPU time since it started.

## Capturing Network Connection State

Cross-reference the suspicious PID with external TCP connections to identify command-and-control activity:

```powershell
# NIST IR-4: Capture external TCP connections at time of incident — connection to non-internal IP is an anomaly in this environment
# OwningProcess links each connection back to a PID from the Get-Process output
Get-NetTCPConnection -State Established | Where-Object {$_.RemoteAddress -notlike '10.*'} | Select-Object LocalPort, RemoteAddress, RemotePort, OwningProcess
```

If `OwningProcess` matches the PID of a process with no legitimate path, you have corroborated evidence of a command-and-control connection. Record the remote IP, remote port, and owning PID before running any containment action.

## Exporting Security Event Logs as Evidence

Export recent logon events to CSV before isolation. The `-NoTypeInformation` flag removes the PowerShell type header row from the CSV, making it readable by investigators who do not have PowerShell:

```powershell
# NIST AU-12: Export recent logon events to CSV for chain-of-custody evidence — run before isolation
# -NoTypeInformation removes the PS type header, making the CSV readable by non-PowerShell investigators
Get-WinEvent -LogName Security -MaxEvents 50 | Where-Object {$_.Id -eq 4624} | Select-Object TimeCreated, Message | Export-Csv 'C:\Evidence\logons.csv' -NoTypeInformation
```

`C:\Evidence\` must exist before running this command. After the file is written, hash it immediately to establish chain-of-custody integrity:

```powershell
Get-FileHash 'C:\Evidence\logons.csv' -Algorithm SHA256
```

Record the SHA256 hash in your incident log. Any future modification to the file will produce a different hash, proving tampering.

## Isolating the System

After all three evidence collection steps are complete, isolate the system by disabling its network adapter. This is a containment step — not an evidence step:

```powershell
# TSA-IR: Isolate network adapter after evidence collection is complete — coordination with OT operations required
# WARNING: Run ONLY after process snapshot, network connection snapshot, and log export are complete
Disable-NetAdapter -Name 'Ethernet' -Confirm:$false
```

Before running this command, notify OT operations. On PIPELINE-DC01, disabling the Ethernet adapter will immediately stop any data collection, polling, or control commands flowing through that interface. Use `Get-NetAdapter` to identify the correct adapter name for your environment — the adapter name may differ from 'Ethernet'.

> [!OT]
> In OT environments, `Disable-NetAdapter` on the wrong interface can immediately stop SCADA data collection, historian writes, or DCS polling — causing loss of operational visibility. Before running any isolation command, run `Get-NetAdapter` to identify all adapters and their connection states. On multi-homed OT systems (one IT-facing NIC and one OT-facing NIC), disable only the IT-facing adapter to preserve OT network connectivity. Always coordinate with operations: confirm that disabling the interface will not affect pipeline control before executing. NIST AU-12 audit record generation requirements still apply during an incident — every command you run during response should be logged in your incident record.

The terminal exercise for this lesson lets you practice all four evidence collection and isolation steps in the simulator before performing them on a live system. Work through each step in order — the teaching point is the sequence: snapshot, connections, logs, then isolate.
