---
title: OT Network Segmentation and DMZ Architecture
lessonId: ot-network-segmentation
moduleId: network-hardening
order: 4
complianceTags: [TSA, NIST]
complianceControls: [TSA-NetworkSeg, NIST-SC-7, NIST-SC-3]
lastReviewed: ''
reviewer: ''
---

## Why OT Requires Separate Network Zones

IT networks and OT networks are built on fundamentally different priorities. An IT network tolerates brief downtime for patching, software updates, and security scans. An OT control network — the network that runs SCADA systems, HMI stations, and field device controllers — cannot tolerate unexpected interruptions. A security scan that consumes bandwidth on a pipeline SCADA network can delay sensor polling, causing false alarms or missed process events. A network-level intrusion that pivots from IT to OT does not just compromise data: it can send unauthorized commands to physical equipment.

The Purdue Model (ISA-95) describes a reference architecture for industrial control networks using five levels:

| Level | Name | Typical Systems |
|-------|------|----------------|
| Level 0 | Process | Field devices: sensors, actuators, valves |
| Level 1 | Control | PLCs, RTUs, DCS controllers |
| Level 2 | Supervisory | SCADA servers, HMI workstations (e.g., PIPELINE-HMI01) |
| Level 3 | Manufacturing Operations | Historian servers, MES systems |
| Level 4 | Enterprise IT | Corporate network: PIPELINE-DC01, workstations |

For pipeline operators, Levels 0–3 comprise the OT environment and must be isolated from Level 4 (the corporate IT network). The current TSA pipeline security directive requires operators to implement network segmentation controls that prevent unauthorized electronic access between these zones. NIST SP 800-82 Rev 3 Chapter 5 (ICS network architecture) specifies that OT network boundaries must have boundary protection controls enforcing a deny-by-default access policy.

The most critical boundary is between Level 3 (historian, DMZ) and Level 4 (IT). Direct connections from the IT network to any Level 2 or lower system are prohibited. Historian servers in Level 3 are the controlled data exchange point; they receive data from Level 2 SCADA systems over a protected, unidirectional path and expose read-only data to IT systems through the DMZ — never the reverse.

## DMZ Architecture for IT/OT Data Exchange

A properly designed IT/OT DMZ contains the systems required for controlled data exchange while preventing direct network paths between IT and OT segments. Two common models exist:

**One-way data diodes** enforce a hardware-level unidirectional connection. Data flows from OT to IT across a diode — a device with a transmitter on the OT side and a receiver on the IT side and no bidirectional signaling capability. A compromised IT host cannot send network packets back through a data diode. This approach is appropriate for environments with the highest security requirements where any bidirectional risk is unacceptable.

**Jump host model** places an access-controlled Windows Server (or hardened Linux host) in the DMZ. Administrators must first authenticate to the jump host, then connect from the jump host to OT systems. Every session is logged at the jump host level before any OT-level connection is established. This model allows authorized operational access to OT systems while maintaining a clear audit boundary.

Regardless of model, verify that the DMZ host can reach the OT segment as expected — and that the IT network cannot bypass the DMZ to reach OT directly:

```powershell
# Test reachability from a DMZ host to the OT SCADA server
# Run this FROM the DMZ host — should succeed on WinRM port if configured
Test-NetConnection -ComputerName PIPELINE-HMI01 -Port 5985

# Verify that the IT segment cannot reach the OT segment directly
# Run this FROM an IT workstation — should FAIL (return TcpTestSucceeded: False)
# if segmentation is correctly enforced
Test-NetConnection -ComputerName 10.0.0.20 -Port 5985
```

A result of `TcpTestSucceeded: False` from the IT workstation to the OT segment confirms the network-layer boundary is in place. Document both results in the security baseline — the positive result from the DMZ host and the negative result from the IT host together constitute evidence of correct segmentation.

> [!OT]
> In pipeline OT environments, the control network (Level 2) must be isolated from
> the corporate IT network by a DMZ containing historian servers and data diodes.
> Direct IT-to-OT connections are prohibited under NIST SP 800-82 Rev 3 Section 5.4.
> Any exception requires written risk acceptance and compensating controls documented
> in the system security plan. Even authorized jump-host sessions must be individually
> logged and time-limited — persistent standing connections from IT to OT are not
> permitted under the segmentation requirement.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. NERC CIP-005 Electronic Security Perimeters require similar DMZ architecture for registered electric utility control systems — the Purdue model zones and DMZ-based data exchange pattern described above meet the structural intent of both frameworks.

## Verifying Segmentation via PowerShell

After configuring network segmentation, verify it using PowerShell on systems at each boundary. Audit enabled firewall rules on the OT segment host to confirm no rules create unauthorized paths back to the IT network:

```powershell
# NIST SC-7: Enumerate all enabled inbound rules on the OT host
# Look for rules that allow connections from the IT network range (e.g., 10.0.1.0/24)
# Any such rule requires a documented exception with written risk acceptance
Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
    ForEach-Object {
        $addr = $_ | Get-NetFirewallAddressFilter
        [PSCustomObject]@{
            DisplayName    = $_.DisplayName
            RemoteAddress  = $addr.RemoteAddress
            Profile        = $_.Profile
        }
    } | Where-Object { $_.RemoteAddress -ne 'Any' -and $_.RemoteAddress -ne 'LocalSubnet' }
```

This query returns inbound allow rules that specify a remote address — filtering out the "Any" catch-all rules that would be covered by separate host-level auditing. A rule allowing connections from an IT subnet address range indicates a cross-zone path that must be documented or removed.

For point-in-time connectivity verification across a defined set of OT hosts, run `Test-NetConnection` in a loop:

```powershell
# Verify that OT hosts on 10.0.0.0/24 cannot reach the corporate DNS server
# Replace 10.0.1.10 with the actual IT DNS server IP for your environment
$otHosts = @('PIPELINE-HMI01', '10.0.0.21', '10.0.0.22')
foreach ($host in $otHosts) {
    $result = Test-NetConnection -ComputerName 10.0.1.10 -Port 53 -WarningAction SilentlyContinue
    [PSCustomObject]@{
        OTHost          = $host
        CanReachIT_DNS  = $result.TcpTestSucceeded
    }
}
```

All results should return `CanReachIT_DNS: False` for a correctly segmented OT network. Document this verification output as evidence of segmentation compliance under the current TSA pipeline security directive's network segmentation requirement. Retain verification results for the minimum log retention period specified by the directive.
