---
title: Windows Firewall Policy for OT Networks
lessonId: firewall-policy
moduleId: network-hardening
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-NetworkSeg, NIST-SC-7]
quizId: '01'
---

## Why Windows Firewall Policy Matters for OT

The current TSA pipeline security directive requires documented, enforced network access control on all pipeline cybersecurity systems. Windows Firewall is the host-based enforcement layer that implements network segmentation policy on every endpoint — including OT workstations, engineering stations, and historian servers. A network that is logically segmented at the switch or router level can still be compromised if an endpoint has been misconfigured to allow unauthorized inbound connections. Host-based firewall policy closes that gap.

Without enforced Windows Firewall policy, a workstation on the OT VLAN may accept connections from any source — allowing a threat actor who has compromised an IT host to move laterally into the OT segment without crossing a network-layer boundary. The TSA network segmentation mandate requires that both network-layer and host-layer controls work together.

## Firewall Profile Structure

Windows Firewall with Advanced Security applies rules based on the active network profile. Three profiles exist:

- **Domain** — Active when the host is connected to its domain controller. Applies to PIPELINE-DC01 and all domain-joined systems in the ExampleCorp domain.
- **Private** — Active when the network is marked as a private (trusted) network. Applies to standalone OT systems on an isolated segment.
- **Public** — Active when the network is marked as public. Should have the most restrictive rules.

For OT systems on an isolated 10.0.0.0/24 segment that cannot reach a domain controller, the Private profile governs. For domain-joined OT workstations, the Domain profile applies. Verify which profile is active and what its default actions are:

```powershell
# NIST SC-7: Check which firewall profile is active on this system
# DefaultInboundAction and DefaultOutboundAction show the baseline behavior for unmatched traffic
Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction
```

Every profile should show `Enabled: True`. The `DefaultInboundAction` should be `Block` — this is the deny-all inbound baseline that all explicit allow rules layer on top of.

## Checking Existing Rules

To enumerate all inbound allow rules — the entries that require documented justification under TSA network segmentation requirements:

```powershell
# TSA-NetworkSeg: Enumerate all inbound ALLOW rules to find exceptions requiring justification
# LocalPort lives on the NetFirewallPortFilter object, not the rule object — join them via ForEach-Object
Get-NetFirewallRule -Direction Inbound -Action Allow |
    ForEach-Object {
        $filter = $_ | Get-NetFirewallPortFilter
        [PSCustomObject]@{
            DisplayName = $_.DisplayName
            LocalPort   = $filter.LocalPort
            Profile     = $_.Profile
            Enabled     = $_.Enabled
        }
    }
```

Review the output for rules that are enabled and active on the Domain or Private profile. Rules with `LocalPort: Any` are particularly high-risk — they allow connections to all ports from any source on the matched profile. Every entry should map to a documented business requirement.

## Managing Policy via Group Policy

In a domain environment, Windows Firewall policy can be distributed centrally via Group Policy. A GPO named `OT Firewall Baseline` applied to the ExampleCorp domain can enforce the same rule set across all domain-joined OT workstations without individual host configuration:

```powershell
# Requires GroupPolicy module (part of RSAT — Remote Server Administration Tools)
# Returns the GPO object for the baseline policy applied to PIPELINE-DC01
Get-GPO -Name 'OT Firewall Baseline' -Domain ExampleCorp.local
```

GPO-managed firewall rules take precedence over locally configured rules. Verify GPO-applied rules using `Get-NetFirewallRule -PolicyStore ActiveStore` — this shows all rules currently in effect, regardless of whether they came from Group Policy or local configuration.

> [!OT]
> For OT workstations on air-gapped networks without domain connectivity, Group Policy cannot be applied — the workstation cannot reach a domain controller to receive policy updates. Manage Windows Firewall directly on these systems using `netsh advfirewall` or the PowerShell equivalent: `Set-NetFirewallProfile -Profile Private -DefaultInboundAction Block`. Document manually-applied rules in each system's security baseline document, including the date configured, who applied it, and what rule set version it represents. NIST SC-7 requires that all boundary protection rules are documented — air-gapped systems are not exempt from this documentation requirement.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-007 R1 ports and services requirements mandate that only required ports, services, and protocols are enabled — structurally equivalent to the TSA network segmentation mandate for pipeline operators.

## Key Firewall Policy Controls to Enforce

For TSA network segmentation compliance, configure and verify these controls on all pipeline systems:

| Control | Required Setting | Notes |
|---------|-----------------|-------|
| Default inbound action | Block | All three profiles (Domain, Private, Public) |
| Default outbound action | Allow | Standard; restrict further for high-security OT endpoints |
| RDP (port 3389) inbound | Block | Unless an active, approved change-management window is open |
| SMB (port 445) inbound | Block from non-admin subnets | Restrict to management VLAN source only |
| WinRM (ports 5985/5986) inbound | Block on OT-facing interfaces | PS remoting should not be accessible from the OT segment without explicit authorization |
