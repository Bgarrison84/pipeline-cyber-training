---
title: Active Directory Queries with PowerShell
lessonId: ps-ad
moduleId: account-access
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-AccessControl, NIST-AC-2]
lastReviewed: ''
reviewer: ''
---

## Auditing Domain Admin Group Membership

Any account in Domain Admins has unrestricted access to PIPELINE-DC01 and every domain-joined system in the ExampleCorp environment. This group must be kept to the absolute minimum required for domain administration — a common benchmark for pipeline environments is three or fewer accounts. Use `Get-ADGroupMember` to enumerate current membership for quarterly access reviews:

```powershell
# NIST AC-2: Enumerate Domain Admins group membership for quarterly access review on PIPELINE-DC01
# Domain Admins must be reviewed regularly — unexpected members are an immediate remediation priority
Get-ADGroupMember -Identity 'Domain Admins' | Select-Object Name, SamAccountName
```

Any service account appearing in this output — for example, a backup or historian service account — is a misconfiguration that must be remediated. Service accounts should never be members of Domain Admins. Verify the expected members against your approved access list and document any discrepancies in your incident log.

## Finding Service Accounts via ServicePrincipalName

SPNs (Service Principal Names) identify accounts registered for Kerberos service authentication. Every account with an SPN is, by definition, a service account. Use `Get-ADUser` with an SPN filter to build a complete inventory of all service accounts in the ExampleCorp domain:

```powershell
# NIST AC-2: Identify all service accounts in ExampleCorp domain by filtering on ServicePrincipalName
# -Properties ServicePrincipalName is required — SPN is not returned in the default property set
Get-ADUser -Filter {ServicePrincipalName -like '*'} -Properties ServicePrincipalName | Select-Object Name, Enabled, ServicePrincipalName
```

An account that is `Enabled: True` but whose SPN points to a decommissioned service is an orphan account. Orphan service accounts are a Kerberoasting risk: an attacker who obtains a Kerberos service ticket for the account's SPN can attempt offline password cracking without any logon attempt being logged. Disable or remove orphan service accounts within 24 hours of identifying them.

## Auditing a Specific Service Account's Group Memberships

Once you have identified service accounts, verify that each one belongs only to the groups required for its function. The historian service account svc-historian should never appear in Domain Admins or any other privileged group. Use `Get-ADPrincipalGroupMembership` to list all groups that a specific account belongs to:

```powershell
# NIST AC-6: Verify that svc-historian belongs only to authorized groups — no privileged group membership
# Expected output: Domain Users and Historian-DataReaders only — any privileged group is a violation
Get-ADPrincipalGroupMembership -Identity svc-historian | Select-Object Name
```

If svc-historian appears in Domain Admins, Remote Desktop Users, or any other privileged group, that is an immediate remediation priority under the current TSA access control mandate. Investigate how the account gained that membership before removing it — Event ID 4728 in the Security event log records when a member is added to a security-enabled global group and will show who made the change and from which workstation.

## Checking Local Administrator Group

Domain group membership is only half the picture. OT workstations and domain controllers also have local administrator groups that are independent of Active Directory. Local admin rights on an OT workstation allow bypass of domain policy and can persist even after domain account remediation. Use `Get-LocalGroupMember` (PS 5.1) to enumerate the local Administrators group:

```powershell
# NIST AC-2: Enumerate local Administrators group on this machine — verifies no unauthorized local admin accounts
# PS 5.1 required — Get-LocalGroupMember is not available in older Windows versions
Get-LocalGroupMember -Group 'Administrators'
```

The local Administrators group should contain only the domain admin service account and approved break-glass accounts. Any unexpected entry — particularly a domain service account or a user account that has no operational reason for local admin rights — must be removed. On systems without PS 5.1, use the legacy command: `net localgroup administrators`.

> [!OT]
> In OT environments, many workstations have local administrator accounts with shared or default passwords set by OEM vendors during system commissioning. Run `Get-LocalUser | Where-Object {$_.Enabled -eq $true}` on every OT host to discover all active local accounts. Default vendor accounts like 'scada-admin' or 'operator' with known passwords are a critical risk — change or disable them and document the change in the system baseline. Note that `Get-ADPrincipalGroupMembership` requires domain connectivity — on air-gapped OT systems that are not domain-joined, use `Get-LocalGroupMember` instead to audit local account privileges.

The terminal exercise for this lesson lets you practice all four AD and local admin queries in the simulator: enumerating Domain Admins, finding service accounts by SPN, checking svc-historian's group memberships, and auditing the local Administrators group on PIPELINE-DC01.
