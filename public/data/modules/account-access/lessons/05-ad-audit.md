---
title: Auditing Active Directory with PowerShell
lessonId: ad-audit
moduleId: account-access
order: 5
complianceTags: [TSA, NIST]
complianceControls: [TSA-Access, NIST-AC-2, NIST-AU-2]
quizId: '02'
lastReviewed: ''
reviewer: ''
---

## What to Audit in Active Directory

An Active Directory audit is a structured review of account state, group membership, and configuration that produces documented evidence of compliance. The current TSA pipeline security directive requires pipeline operators to periodically review access controls and verify that access is limited to authorized personnel — an AD audit is the primary mechanism for demonstrating that requirement is met. NIST SP 800-82 Rev 3 Chapter 6 specifies that account management procedures must include periodic reviews to detect dormant accounts, unauthorized privilege escalation, and policy violations.

Four categories of Active Directory findings require mandatory remediation for pipeline operators:

**Stale accounts** — Accounts that have not been used for 90 or more days represent dormant attack surface. An attacker with access to a stale account can use it indefinitely without triggering logon-pattern anomalies, because there is no established baseline to deviate from. The current TSA pipeline security directive requires access to be removed when it is no longer needed — a user who has left the organization or changed roles and has not logged in for 90 days is a strong candidate for deprovisioning.

**Non-expiring passwords** — Service accounts and some administrator accounts are frequently configured with `PasswordNeverExpires = True` to avoid service disruption from password expiration. However, a password that never expires is a password that is never rotated, which means a credential compromise from years ago may still be valid today. NIST SP 800-82 Rev 3 Chapter 6 requires that account passwords be rotated on a defined schedule. Accounts with `PasswordNeverExpires` must be individually justified and documented.

**Password age** — Accounts whose passwords have not changed in more than a year, even if they do expire in principle, represent delayed rotation risk. Export password age data as part of every quarterly audit.

**Group membership changes** — Unauthorized additions to Domain Admins, Backup Operators, or custom privileged groups are the most common early indicator of privilege escalation attacks. Event ID 4728 (member added to a security-enabled global group) should be queried after every audit period to detect changes that occurred since the last review.

## Querying AD for Compliance Evidence

The following PowerShell queries produce the primary evidence artifacts for a TSA access control audit. Run them on PIPELINE-DC01 with the RSAT Active Directory module installed.

**Disabled account inventory** — Disabled accounts that remain in AD are orphaned credentials. They should be removed within 30 days of disabling unless a documented hold is in place:

```powershell
# NIST AC-2: Export all disabled accounts in ExampleCorp domain to CSV
# Review for accounts that should be deleted rather than merely disabled
# Disabled accounts with group memberships remain a Kerberoasting target
Search-ADAccount -AccountDisabled |
  Select-Object SamAccountName, DistinguishedName, LastLogonDate |
  Export-Csv -Path C:\Audit\disabled-accounts.csv -NoTypeInformation
```

**Password-never-expires violations** — Any account with this flag set requires documented justification per the current TSA pipeline security directive:

```powershell
# NIST AC-2, NIST-AU-2: Find all accounts with PasswordNeverExpires = True in ExampleCorp domain
# Each result must have a documented exception or be flagged for MSA migration
Get-ADUser -Filter { PasswordNeverExpires -eq $True } -Properties PasswordNeverExpires, PasswordLastSet |
  Select-Object SamAccountName, PasswordLastSet, PasswordNeverExpires |
  Export-Csv -Path C:\Audit\password-never-expires.csv -NoTypeInformation
```

**Stale account identification** — Accounts inactive for 90 or more days:

```powershell
# NIST AC-2: Find enabled accounts with no logon activity in the past 90 days
# These are deprovisioning candidates under TSA access control requirements
$cutoffDate = (Get-Date).AddDays(-90)
Get-ADUser -Filter { Enabled -eq $True -and LastLogonDate -lt $cutoffDate } `
  -Properties LastLogonDate |
  Select-Object SamAccountName, Name, LastLogonDate |
  Sort-Object LastLogonDate |
  Export-Csv -Path C:\Audit\stale-accounts.csv -NoTypeInformation
```

**Privileged group membership snapshot** — Capture the current Domain Admins membership for comparison against the previous review's snapshot:

```powershell
# NIST AC-2, NIST AC-6: Snapshot Domain Admins membership on PIPELINE-DC01
# Compare output against prior review to detect unauthorized additions
Get-ADGroupMember -Identity 'Domain Admins' -Recursive |
  Select-Object Name, SamAccountName, objectClass |
  Export-Csv -Path C:\Audit\domain-admins-snapshot.csv -NoTypeInformation
```

> [!OT]
> OT service accounts (historian service, OPC DA server, DCS communication accounts) must appear in the AD audit — they are high-value targets because they often have elevated local permissions on OT workstations. Flag any account with PasswordNeverExpires that also appears in local Administrators. NIST SP 800-82 Rev 3 Section 6.3 applies. When auditing non-domain-joined OT systems such as standalone SCADA workstations or air-gapped PLCs, run a separate local account audit on each host: `Get-LocalUser | Select-Object Name, Enabled, LastLogon` and `Get-LocalGroupMember -Group Administrators` to enumerate local admin membership. These results must be added to the quarterly audit package alongside the AD query results — OT assets that cannot be reached by AD queries are not exempt from the access review requirement.

## Automating Monthly AD Audit Reports

A manually-triggered audit run once per quarter introduces risk of missed findings between review cycles. Automating monthly AD audit exports using a scheduled task on PIPELINE-DC01 ensures that the audit data is always current and reduces the effort required to prepare quarterly compliance packages.

The following script assembles all four primary audit artifacts in a single run and deposits them in a timestamped folder under `C:\Audit\`:

```powershell
# NIST AC-2, NIST AU-2: Automated monthly AD audit report for ExampleCorp
# Run as a scheduled task on PIPELINE-DC01 on the first day of each month
# Output: timestamped folder with CSV audit artifacts for quarterly review

$auditDate = Get-Date -Format 'yyyy-MM'
$auditPath = "C:\Audit\$auditDate"
New-Item -ItemType Directory -Path $auditPath -Force | Out-Null

# 1. Disabled accounts
Search-ADAccount -AccountDisabled |
  Select-Object SamAccountName, DistinguishedName, LastLogonDate |
  Export-Csv -Path "$auditPath\disabled-accounts.csv" -NoTypeInformation

# 2. Password-never-expires violations
Get-ADUser -Filter { PasswordNeverExpires -eq $True } `
  -Properties PasswordNeverExpires, PasswordLastSet |
  Select-Object SamAccountName, PasswordLastSet, PasswordNeverExpires |
  Export-Csv -Path "$auditPath\password-never-expires.csv" -NoTypeInformation

# 3. Stale accounts (90-day threshold)
$cutoff = (Get-Date).AddDays(-90)
Get-ADUser -Filter { Enabled -eq $True -and LastLogonDate -lt $cutoff } `
  -Properties LastLogonDate |
  Select-Object SamAccountName, Name, LastLogonDate |
  Sort-Object LastLogonDate |
  Export-Csv -Path "$auditPath\stale-accounts.csv" -NoTypeInformation

# 4. Domain Admins snapshot
Get-ADGroupMember -Identity 'Domain Admins' -Recursive |
  Select-Object Name, SamAccountName, objectClass |
  Export-Csv -Path "$auditPath\domain-admins-snapshot.csv" -NoTypeInformation

Write-Output "AD audit complete. Reports saved to $auditPath"
```

Schedule this script as a Task Scheduler job on PIPELINE-DC01 running under a dedicated `svc-ad-audit` managed service account with read-only Domain access. The monthly audit artifacts provide the primary evidence base for quarterly TSA access control reviews and NIST SP 800-82 compliance documentation.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-004 R4 specifies that electronic access rights must be reviewed at least every six months and revoked when no longer needed. The quarterly AD audit cadence required by the current TSA pipeline security directive exceeds CIP-004 R4's six-month minimum — treating the NERC CIP requirement as a maturity floor, pipeline operators should maintain the more frequent TSA-aligned cadence.
