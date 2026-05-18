---
title: Network Hardening Overview
lessonId: intro
moduleId: network-hardening
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-NetworkSeg, NIST-SC-7]
lastReviewed: ''
reviewer: ''
---

## What Is Network Hardening?

Network hardening is the process of reducing the attack surface of a network by restricting communications to only what is required for operations — disabling unauthorized ports, enforcing segmentation between network zones, and documenting every allowed path. The current TSA pipeline security directive requires pipeline operators to implement and enforce network segmentation controls as part of a documented cybersecurity program. These controls keep OT systems isolated from IT infrastructure and from internet-accessible systems.

Three primary controls make up network hardening on a Windows-based pipeline system:

- **Firewall rules** — Host-based rules on every endpoint (including OT workstations) controlling which inbound and outbound connections are permitted. Windows Firewall with Advanced Security is the built-in enforcement mechanism.
- **Network segmentation** — Physical or logical separation between IT, OT, and internet-facing zones. OT systems on the 10.0.0.0/24 segment should not have unrestricted paths to IT systems or the internet.
- **Port control** — Disabling or blocking network ports that are not needed for legitimate operations. Every open port is a potential attack path that must be justified and documented.

## Auditing Active Firewall Rules

Before making any changes, audit the current firewall rule set on PIPELINE-DC01 to understand what is already permitted:

```powershell
# NIST SC-7: Audit all enabled firewall rules on PIPELINE-DC01 to establish baseline
# Direction and Action fields show whether each rule permits or denies traffic
Get-NetFirewallRule -Enabled True | Select-Object DisplayName, Direction, Action, Profile
```

This command returns every rule currently active on the Windows Firewall — both inbound (traffic arriving at this host) and outbound (traffic leaving). The `Profile` column shows which network profile each rule applies to: Domain, Private, or Public.

Review the output for rules with `Direction: Inbound` and `Action: Allow` — these are the paths that accept incoming connections. Any inbound allow rule requires documented justification under TSA network segmentation requirements.

## Key Network Segmentation Principles

These principles form the foundation of compliant network segmentation for pipeline OT environments:

| Principle | Description |
|-----------|-------------|
| Least connectivity | Only required network paths are opened; all others are denied by default |
| DMZ placement | Systems that must communicate across IT/OT boundaries are placed in a DMZ segment, not directly on the OT VLAN |
| Deny-all inbound default | The default inbound action on every firewall profile is Block; individual services require explicit allow rules with documented justification |
| Documented exceptions | Every allow rule must be recorded in the system security baseline: port, protocol, source, destination, and business justification |

> [!OT]
> In OT environments — SCADA, historian, and HMI networks — segmentation is safety-critical, not just a compliance checkbox. A firewall misconfiguration that allows a connection from an IT workstation to the historian VLAN can expose real-time process data. A path from the IT network to a DCS workstation could allow an unauthorized user to send commands to field devices. Windows Firewall must be configured and verified on every host including those on air-gapped 10.0.0.0/24 segments. Run `Get-NetFirewallProfile | Select-Object Name, Enabled` on each OT workstation to confirm the firewall is active before assuming any rule applies.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-004 personnel training requirements emphasize that authorized personnel understand network access rules — the same principle applies to TSA network segmentation controls.

The next lesson covers the PowerShell cmdlets used to audit, create, and verify Windows Firewall rules — the hands-on controls that enforce the segmentation policy described here.
