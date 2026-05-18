---
title: Firewall Rule Auditing with PowerShell
lessonId: firewall-audit
moduleId: network-hardening
order: 5
complianceTags: [TSA, NIST]
complianceControls: [TSA-NetworkSeg, NIST-CM-7, NIST-SC-7]
quizId: '02'
lastReviewed: ''
reviewer: ''
---

## Why Firewall Rule Auditing Matters for Compliance

Firewall rules accumulate over time. A new application is deployed and someone adds an inbound allow rule. A vendor requests temporary remote access and a rule is opened for a maintenance window — then never removed. A legacy system is decommissioned but its associated firewall exceptions remain. Over months and years, a Windows Firewall policy that started as a well-documented minimal set becomes a collection of undocumented, potentially unauthorized rules with unknown owners.

The current TSA pipeline security directive requires pipeline operators to maintain documented, enforceable network access controls for all pipeline cybersecurity systems. NIST SP 800-82 Rev 3 Chapter 5 states that ICS network access policy must be reviewed periodically to ensure only required connections are permitted. Neither requirement can be met by firewall rules that exist without documentation — you need a structured audit process.

The specific risk of rule accumulation in pipeline OT environments is the "any-any" legacy rule: an inbound allow rule on a decommissioned system's IP range with `RemoteAddress: Any` and `LocalPort: Any`. These rules typically originate from initial deployment shortcuts or emergency changes that were never cleaned up. When the system they were built for no longer exists, the rule still permits inbound connections to whatever system now occupies that IP address.

## Enumerating Firewall Rules with PowerShell

The starting point for any firewall audit is a complete enumeration of all enabled rules, exported to a structured format for review. PowerShell's `Get-NetFirewallRule` returns rule objects that can be joined with filter objects for full detail:

```powershell
# TSA-NetworkSeg / NIST-CM-7: Full firewall rule enumeration for audit
# Joins port filters and address filters to produce a reviewable record
# Export to CSV for evidence retention
Get-NetFirewallRule -Enabled True |
    ForEach-Object {
        $rule    = $_
        $port    = $rule | Get-NetFirewallPortFilter
        $address = $rule | Get-NetFirewallAddressFilter
        [PSCustomObject]@{
            DisplayName    = $rule.DisplayName
            Direction      = $rule.Direction
            Action         = $rule.Action
            Profile        = $rule.Profile
            LocalPort      = $port.LocalPort
            RemoteAddress  = $address.RemoteAddress
            Enabled        = $rule.Enabled
        }
    } | Export-Csv -Path C:\Audit\firewall-rules.csv -NoTypeInformation
```

The exported CSV at `C:\Audit\firewall-rules.csv` becomes the evidence artifact for this audit cycle. Store it with the date in the filename for retention: use `"C:\Audit\firewall-rules-$(Get-Date -Format 'yyyyMMdd').csv"` in production.

To focus the audit on the highest-risk rules — inbound allow rules, which represent explicit exceptions to the deny-all-inbound baseline — filter by direction and action:

```powershell
# NIST-SC-7: Enumerate inbound ALLOW rules only
# These are the rules that permit external connections — every one requires documented justification
Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
    Select-Object DisplayName, Profile, @{N='LocalPort'; E={($_ | Get-NetFirewallPortFilter).LocalPort}}
```

Pipe this to `Format-Table -AutoSize` for readable terminal output or to `Export-Csv` for evidence documentation.

> [!OT]
> OT workstations (HMI, SCADA servers) often run Windows Firewall in the Public profile
> because they are not domain-joined. Run `Get-NetFirewallProfile` to confirm which
> profile is active before auditing rules. Rules configured under the Domain profile
> are not active on non-domain-joined systems — auditing the wrong profile produces
> a misleading result. NIST SP 800-82 Rev 3 Section 5.4.3 requires documenting
> firewall rule exceptions for OT devices; confirm you are auditing the correct
> active profile for each host before signing off on the audit evidence.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. NERC CIP-007 R1 ports and services requirements mandate that registered entities identify and document all enabled ports — the `Get-NetFirewallRule` enumeration above produces equivalent documentation for pipeline operators under the TSA network segmentation mandate.

## Identifying Rule Violations

After exporting all enabled inbound allow rules, review the output for the following violation patterns:

**Pattern 1 — Any-source, any-port allow rules:**

```powershell
# Flag rules where RemoteAddress is 'Any' AND LocalPort is 'Any'
# These permit inbound connections from any source to any local port — maximum risk
Import-Csv -Path C:\Audit\firewall-rules.csv |
    Where-Object {
        $_.Direction -eq 'Inbound' -and
        $_.Action    -eq 'Allow'   -and
        $_.RemoteAddress -eq 'Any' -and
        $_.LocalPort     -eq 'Any'
    }
```

Any result from this query is a potential violation. Each entry requires a documented owner and business justification — if none exists in the change management system, treat it as unauthorized and remediate.

**Pattern 2 — Rules allowing connections from the IT network to OT hosts:**

If you are auditing an OT workstation (e.g., PIPELINE-HMI01 on 10.0.0.0/24), check for rules that allow inbound connections from the IT network range. These rules indicate a cross-zone path that violates the segmentation policy:

```powershell
# Flag inbound allow rules with a RemoteAddress in the IT subnet range
# Replace 10.0.1. with the actual IT subnet prefix for your environment
Import-Csv -Path C:\Audit\firewall-rules.csv |
    Where-Object {
        $_.Direction -eq 'Inbound' -and
        $_.Action    -eq 'Allow'   -and
        $_.RemoteAddress -like '10.0.1.*'
    }
```

**Pattern 3 — RDP open without a documented change window:**

Port 3389 inbound on any OT host is high-risk. Check for active RDP allow rules and cross-reference with the change management system for open maintenance windows:

```powershell
# Identify any enabled inbound RDP rule — requires immediate verification
Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True |
    Where-Object { ($_ | Get-NetFirewallPortFilter).LocalPort -contains '3389' } |
    Select-Object DisplayName, Profile
```

Document all findings with the audit date, host name (e.g., PIPELINE-HMI01), and disposition (Authorized / Unauthorized / Pending Review). This documentation satisfies the current TSA pipeline security directive's requirement for evidence of network segmentation control effectiveness.
