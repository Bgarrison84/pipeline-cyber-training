---
title: Managing Firewall Rules with PowerShell
lessonId: ps-firewall
moduleId: network-hardening
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-NetworkSeg, NIST-SC-7, NIST-SI-3]
lastReviewed: ''
reviewer: ''
---

## Checking Active Inbound Rules

Auditing the current inbound firewall rule set on PIPELINE-DC01 is the starting point for any network hardening review. Inbound allow rules are the paths that accept external connections — each one must be justified and documented.

```powershell
# NIST SC-7: Audit active inbound firewall rules on PIPELINE-DC01
# LocalPort is NOT a property of NetFirewallRule objects — it lives on the associated
# NetFirewallPortFilter object. Join both objects to see DisplayName, LocalPort, and Action together.
Get-NetFirewallRule -Enabled True | Where-Object {$_.Direction -eq 'Inbound'} |
    ForEach-Object {
        $filter = $_ | Get-NetFirewallPortFilter
        [PSCustomObject]@{
            DisplayName = $_.DisplayName
            LocalPort   = $filter.LocalPort
            Action      = $_.Action
        }
    }
```

Review the `Action` column: every entry showing `Allow` represents an open door into this host. The `LocalPort` column identifies which port is exposed — note that `LocalPort` comes from the associated `NetFirewallPortFilter` object, not from the rule object itself, which is why the `ForEach-Object` join with `Get-NetFirewallPortFilter` is required. Any port not required by a documented business need should be blocked.

## Testing Connectivity to Expected Hosts

Before auditing or changing firewall rules, verify that expected management connections are reachable. `Test-NetConnection` (PS 5.1) tests TCP connectivity to a specific port and returns a clear true/false result:

```powershell
# NIST SC-7: Verify expected connectivity to PIPELINE-DC01 on port 445
# TcpTestSucceeded: True confirms SMB is reachable — expected for domain-joined management
Test-NetConnection -ComputerName PIPELINE-DC01 -Port 445
```

The key field in the output is `TcpTestSucceeded`. A value of `True` confirms the TCP handshake completed — the port is open and the service is responding. A value of `False` indicates the connection was blocked by a firewall or the service is not listening. Use this command to verify expected paths are open before and after any firewall change.

## Blocking Unauthorized Ports

When an audit identifies an unauthorized inbound allow rule — such as RDP (port 3389) open on a boundary-facing interface — create an explicit block rule using `New-NetFirewallRule`:

```powershell
# NIST SC-7: Block inbound RDP on boundary firewall — unauthorized port identified in audit
# -Action Block overrides any existing Allow rule for the same port
New-NetFirewallRule -DisplayName 'Block RDP Inbound' -Direction Inbound -Protocol TCP -LocalPort 3389 -Action Block
```

Run PowerShell as Administrator on PIPELINE-DC01 before executing this command — `New-NetFirewallRule` requires elevated privileges. The new rule takes effect immediately. Document the rule name, creation timestamp, the audit finding that triggered the change, and the name of the approver in your change management system.

## Mapping Open Ports to Processes

Before blocking any port, determine which process opened it. Blocking a port used by a required service — such as the historian's data collection agent or an OT monitoring tool — can cause an unplanned outage. Use `Get-NetTCPConnection` to map listening ports to their owning process IDs:

```powershell
# NIST SI-3: Map all listening ports to owning processes to detect unauthorized services
# OwningProcess is the PID — use Get-Process -Id to resolve the process name
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | Sort-Object LocalPort
```

The `OwningProcess` column returns the process ID (PID). To identify the process name, pass that PID to `Get-Process`:

```powershell
# Substitute the PID from the OwningProcess column of the previous output
Get-Process -Id <OwningProcess>
```

This two-step approach ensures you know what owns every listening port before making any blocking decision. A port mapped to `svchost` or `System` (PID 4) is owned by Windows itself; a port mapped to an unknown executable warrants immediate investigation under NIST SI-3 malicious code protection controls.

> [!OT]
> In OT environments, running `New-NetFirewallRule` to block a port that turns out to be used by a historian data collection agent, DCS communication service, or SCADA polling process can cause loss of process data or loss of visibility into field devices — without any immediate error message on the workstation. Always verify what owns a port with `Get-NetTCPConnection` before blocking. In air-gapped network segments (10.0.0.0/24), coordinate with OT operations personnel before any firewall rule change and document every change with timestamp, justification, and approver name. The TSA network segmentation mandate requires that all boundary protection decisions are documented — a verbal approval is not sufficient.

The terminal exercise for this lesson lets you practice all four commands — `Get-NetFirewallRule`, `Test-NetConnection`, `New-NetFirewallRule`, and `Get-NetTCPConnection` — in a simulated environment against a realistic PIPELINE-DC01 configuration.
