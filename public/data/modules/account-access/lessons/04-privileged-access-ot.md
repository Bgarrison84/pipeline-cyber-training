---
title: Privileged Access Management for OT Environments
lessonId: privileged-access-ot
moduleId: account-access
order: 4
complianceTags: [TSA, NIST]
complianceControls: [TSA-Access, NIST-AC-2, NIST-AC-6]
lastReviewed: ''
reviewer: ''
---

## Why Privileged Access is Higher Risk in OT

Privileged accounts in IT environments are dangerous because they control infrastructure. In OT environments, privileged accounts are dangerous because they control physical processes. A Domain Admin account on PIPELINE-DC01 can reach historian servers, DCS polling agents, and SCADA HMI workstations — systems whose commands translate directly to valve positions, pump speeds, and compressor states. An attacker who elevates to a privileged account in an OT-adjacent network is not just stealing data; they are acquiring the ability to manipulate pipeline operations.

The current TSA pipeline security directive addresses this threat directly: pipeline operators must implement access controls that limit access to operational technology systems to authorized personnel only, with privileges scoped to what those personnel actually require for their assigned role. Standing privileged access — accounts that hold admin rights at all times regardless of whether an admin task is being performed — violates this requirement.

Two categories of privileged accounts create the most risk in pipeline OT environments:

**Shared generic accounts** — HMI workstations and SCADA engineering stations frequently ship with a built-in local `Administrator` account or a vendor-configured account like `admin` or `scada-admin` with a default or commonly-shared password. Multiple technicians and engineers log in with the same credentials, making it impossible to attribute actions to individuals. The current TSA access control mandate is explicit: access to OT systems must be individually attributed. Shared accounts violate this requirement and eliminate audit trail integrity.

**Standing Domain Admin accounts** — Technicians and engineers granted Domain Admin membership to simplify access to multiple OT-connected systems accumulate privileges that are never removed. NIST SP 800-82 Rev 3 Chapter 6 addresses ICS account management and requires that privileged access be regularly reviewed and revoked when no longer required. Accounts in Domain Admins that do not require that access for current operational duties are a standing violation of least-privilege principles.

## PAM Approaches for Pipeline OT

Two primary strategies address standing privileged accounts in pipeline OT environments:

**Just-in-time (JIT) access** elevates privileges only for the duration of a specific task. An engineer who needs to modify historian configuration receives temporary Domain Admin access for a two-hour window, with that access automatically revoked when the window expires. JIT access dramatically reduces the attack surface because elevated privileges exist for minutes or hours rather than permanently. JIT is the recommended approach for NIST SP 800-82 Rev 3 compliance — permanent standing access should be minimized and JIT workflows established for administrative tasks.

**Managed Service Accounts (MSA)** replace service accounts that require privileged permissions with automatically-managed accounts that have randomized, regularly-rotated passwords. An MSA for the historian service never exposes a human-readable password — the password is managed by Active Directory and rotated automatically.

Use PowerShell to enumerate all current members of Domain Admins on PIPELINE-DC01 as a starting point for your JIT migration assessment:

```powershell
# NIST AC-2, NIST AC-6: Enumerate Domain Admins membership on PIPELINE-DC01
# Goal: identify all standing Domain Admin accounts for JIT migration review
# Any account listed here should be justified by current operational requirements
Get-ADGroupMember -Identity 'Domain Admins' | Select-Object Name, SamAccountName, objectClass
```

Next, identify active user accounts and their last logon dates to prioritize stale privileged accounts:

```powershell
# NIST AC-2: Identify enabled user accounts and last logon date on PIPELINE-DC01
# Accounts not logged in for 90+ days are candidates for deprovisioning
# Run on PIPELINE-DC01 with RSAT Active Directory module
Get-ADUser -Filter { Enabled -eq $True } -Properties LastLogonDate |
  Select-Object SamAccountName, Name, LastLogonDate |
  Sort-Object LastLogonDate |
  Export-Csv -Path C:\Audit\active-accounts.csv -NoTypeInformation
```

Review the exported CSV and flag any account that has Domain Admin membership but has not logged in within the current review period. These are high-priority deprovisioning candidates.

> [!OT]
> In OT environments, HMI and SCADA workstations are often not domain-joined. Local administrator accounts on these systems must be managed via LAPS (Local Administrator Password Solution) or equivalent. Standing shared admin passwords violate NIST SP 800-82 Rev 3 Section 6.3.3 least-privilege requirements. LAPS rotates the local Administrator password on each workstation automatically on a configurable schedule (typically 30 days) and stores the current password in Active Directory — visible only to authorized admins. For OT workstations that cannot be domain-joined (air-gapped PLCs, embedded SCADA nodes), maintain a signed credential log in a physically secured PAM solution, and rotate those passwords on the same 30-day cadence. Verification that LAPS is deployed and configured for OT workstations must appear in quarterly access control reviews.

## Service Account Hygiene for OT Systems

OT software — historians, OPC servers, DCS communication adapters, SCADA data bridges — runs as Windows services under service accounts. These accounts were often configured during initial deployment with whatever permissions made the software work, then left untouched for years. NIST SP 800-82 Rev 3 Chapter 6 requires that account permissions be regularly reviewed and reduced to the minimum required for current operational function.

Migrate OT service accounts to Managed Service Accounts wherever the OT software supports Windows authentication:

```powershell
# NIST AC-2, NIST AC-6: Create a Group Managed Service Account for historian service on PIPELINE-DC01
# gMSA password is managed and rotated by Active Directory automatically
# The historian server PIPELINE-HIST01 is authorized to retrieve the gMSA password
New-ADServiceAccount -Name 'gMSA-historian' `
  -DNSHostName 'gMSA-historian.examplecorp.local' `
  -PrincipalsAllowedToRetrieveManagedPassword 'PIPELINE-HIST01$'
```

For OT software that does not support MSAs, create dedicated service accounts with the minimum permissions required and set 24-character randomized passwords stored in a PAM solution. Configure `Deny log on locally` via Group Policy so that service accounts cannot be used interactively — preventing an attacker who compromises the account from using it for lateral movement to OT workstations.

The quarterly access review must include all OT service accounts. Run this query on PIPELINE-DC01 to retrieve all accounts with a ServicePrincipalName (SPN), which identifies accounts registered as Kerberos service principals:

```powershell
# NIST AC-2: Enumerate all service accounts in ExampleCorp domain by SPN
# These accounts require individual review: check current permissions and last password reset date
Get-ADUser -Filter { ServicePrincipalName -like '*' } `
  -Properties ServicePrincipalName, PasswordLastSet, PasswordNeverExpires |
  Select-Object SamAccountName, ServicePrincipalName, PasswordLastSet, PasswordNeverExpires |
  Export-Csv -Path C:\Audit\service-accounts.csv -NoTypeInformation
```

Flag any service account where `PasswordNeverExpires` is `True` and `PasswordLastSet` is more than 90 days ago. These are the highest-priority accounts for password rotation and MSA migration.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-004 R4 requires that electronic access rights be reviewed at least every six months and that the principle of least privilege be applied when granting access to Bulk Electric System cyber assets. The access management controls in this lesson are structurally aligned with CIP-004 R4, applied to pipeline OT environments under TSA access control requirements and NIST SP 800-82 Rev 3 Chapter 6 guidance.
