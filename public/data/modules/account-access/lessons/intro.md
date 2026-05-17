---
title: Account and Access Control Overview
lessonId: intro
moduleId: account-access
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-AccessControl, NIST-AC-2]
---

## Why Account and Access Control Matters

The current TSA pipeline security directive requires pipeline operators to implement access control measures that limit access to operational technology systems to authorized personnel only. Unauthorized or overprivileged accounts are one of the most common attack vectors in ICS/OT environments — a single service account with excess privileges can give an attacker unrestricted access to historian data, SCADA HMI, and pipeline control systems simultaneously. Active Directory is the authentication backbone for most Windows-based pipeline environments, making it the primary target for credential-based attacks and the primary tool for access control enforcement.

Access control failures in pipeline environments are not abstract risks. The Colonial Pipeline incident demonstrated that compromised credentials on a single account can result in operational shutdown. The TSA access control mandate is a direct regulatory response to that class of threat.

## Querying Active Directory for Privileged Accounts

The Active Directory module is available via RSAT (Remote Server Administration Tools) on domain-joined systems. Use `Get-ADGroupMember` to enumerate the members of privileged groups on PIPELINE-DC01:

```powershell
# NIST AC-2: Enumerate members of Domain Admins on PIPELINE-DC01 — verify only authorized personnel are listed
# Any account in Domain Admins has unrestricted access to all domain systems and should be minimized
Get-ADGroupMember -Identity 'Domain Admins' | Select-Object Name, SamAccountName, Enabled
```

Domain Admins is the highest-risk group in an Active Directory environment. Every member of this group can modify any object, access any system, and bypass most security controls. The current TSA access control mandate requires that privileged group membership be limited to the minimum required for operations and reviewed on a regular cadence.

## Identifying Service Accounts

Service accounts — accounts used by applications and services rather than humans — frequently accumulate privileges over time. They are often configured once and never revisited, making them a durable attack surface. Use `Get-ADUser` with a ServicePrincipalName filter to enumerate all service accounts in the ExampleCorp domain:

```powershell
# NIST AC-2: Find all accounts with a ServicePrincipalName — these are service accounts needing regular review
# SPN is not returned by default — the -Properties flag is required to include it in output
Get-ADUser -Filter {ServicePrincipalName -like '*'} -Properties ServicePrincipalName | Select-Object Name, Enabled, ServicePrincipalName
```

Service accounts often accumulate privileges over time as teams add access for convenience rather than operational need. Disabled accounts with SPNs should be removed — they are orphaned credentials that an attacker can target for Kerberoasting attacks without anyone noticing the account is no longer in use.

## Key Access Control Principles

Four principles govern effective access control in pipeline environments:

| Principle | Description |
|-----------|-------------|
| Least Privilege | Grant only the permissions required for the specific role — no more. A historian service account needs read access to its database, not Domain Admin rights. |
| Separation of Duties | No single account should handle both administrative functions and operational functions. Admin accounts for managing PIPELINE-DC01 should not also be used for routine operations. |
| Service Account Hygiene | Dedicated accounts per service, never shared credentials across services. svc-historian is for historian operations only — it should not be reused for backup operations. |
| Account Review Cadence | Quarterly review of privileged group membership is required by the TSA access control mandate. Reviews must include Domain Admins, local administrator groups on OT workstations, and any custom privileged groups. |

> [!OT]
> In OT environments, service accounts for historian data collection (svc-historian), DCS polling, and SCADA communication often run with elevated privileges because OT software vendors historically required domain admin rights for their software to function. Before accepting vendor requirements at face value, review whether admin rights can be scoped to specific OUs or local machine admin only. On OT workstations not joined to the ExampleCorp domain, audit local accounts with `Get-LocalUser | Select-Object Name, Enabled, LastLogon` directly on the host — domain-level queries will not reach air-gapped or workgroup-mode OT systems.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-004 personnel and training requirements mandate that only authorized and trained personnel hold access to critical cyber assets — the same principle governs TSA access control requirements for pipeline OT systems. CIP-004 R4 specifies access management procedures including the removal of access rights upon role change or termination — a directly analogous control to TSA's access control mandate.

The next lesson covers the PowerShell Active Directory cmdlets in detail: auditing Domain Admins membership, identifying service accounts by SPN, auditing a specific service account's group memberships, and checking the local administrator group on PIPELINE-DC01.
