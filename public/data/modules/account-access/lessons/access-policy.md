---
title: Least Privilege and Service Account Policy
lessonId: access-policy
moduleId: account-access
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-AccessControl, NIST-AC-6]
quizId: '01'
---

## Why Least Privilege Matters in OT Environments

The current TSA pipeline security directive requires access control that limits the blast radius of a compromised account. Least privilege — granting only the minimum permissions required for a specific role — is the foundational control for achieving this. In OT environments, a single overprivileged service account can give an attacker simultaneous access to historian data, SCADA HMI configuration, and pipeline control systems. The TSA access control mandate is explicit: access to OT systems must be limited to authorized personnel, and that authorization must be role-specific and time-bound.

NIST AC-6 defines the principle formally: organizations must employ the concept of least privilege, allowing only authorized accesses for users and processes acting on behalf of users that are necessary to accomplish assigned tasks. For service accounts, this means scoping permissions to the specific OUs, file shares, database tables, and services the account requires — nothing broader.

## Service Account Policy Framework

A consistent service account policy prevents privilege accumulation and reduces attack surface. Apply these four rules to every service account in the ExampleCorp domain:

1. **One service account per service** — svc-historian is for historian operations only, never reused for backup or other functions. svc-pipeline-backup is the dedicated backup service account. Shared credentials across services mean that compromising one service compromises all services that share the account.

2. **Minimum required permissions** — Grant access only to the specific OUs, shares, and services the account requires. If svc-historian needs read access to the pipeline database, grant read on that database only — not write, not admin, not access to other databases.

3. **No interactive logon** — Service accounts should have `Deny log on locally` set via Group Policy. Service accounts that can log on interactively are a lateral movement risk: an attacker who compromises the account can use it to log on to OT workstations directly. Configure this via GPO and verify it with `Get-GPResultantSetOfPolicy`.

4. **Password management** — Service accounts must use 24+ character random passwords stored in a privileged access management (PAM) solution or at minimum in an encrypted credential store. Shared or easily-guessable service account passwords are a critical vulnerability in pipeline environments.

## Checking Current Service Account Permissions

Verify that svc-historian is not a member of any privileged group on PIPELINE-DC01. This check should run as part of every quarterly access review:

```powershell
# NIST AC-6: Verify svc-historian is not a member of privileged groups on PIPELINE-DC01
# Expected: only Domain Users and Historian-DataReaders — any privileged group membership is a violation
Get-ADPrincipalGroupMembership -Identity svc-historian | Select-Object Name
```

If the output includes Domain Admins, Backup Operators, Remote Desktop Users, or any other privileged group, that is an immediate remediation item. Document the finding, investigate how the account gained the membership (Event ID 4728 in the Security log), remove the account from the unauthorized group, and restrict its permissions to only what is required for historian operation.

## Enforcing Least Privilege via Group Policy

The Resultant Set of Policy report shows what GPO settings are actively applied to a machine, including logon restrictions for service accounts. Generate this report on PIPELINE-DC01 to verify that service account logon restrictions are in effect:

```powershell
# NIST AC-6: Retrieve the GPO controlling service account logon rights on PIPELINE-DC01
# The HTML report includes Deny log on locally and Deny access from network settings
Get-GPResultantSetOfPolicy -ReportType Html -Path C:\Reports\rsop.html
```

Open the generated HTML report and search for "Deny log on locally" and "Deny access to this computer from the network" in the User Rights Assignment section. Service accounts should appear in both deny lists. If they do not, the GPO may not be applied or may be overridden by a higher-precedence policy.

## Quarterly Access Review Checklist

Use this checklist during every quarterly access review to verify least-privilege compliance on PIPELINE-DC01 and the ExampleCorp domain:

| Control Point | Target | Action if Violated |
|---------------|--------|--------------------|
| Domain Admins membership count | 3 or fewer members for pipeline environments | Remove unauthorized accounts immediately; investigate how they were added |
| Disabled accounts in privileged groups | 0 | Remove disabled accounts from all privileged groups — they are dormant attack vectors |
| Service accounts with Domain Admin rights | 0 | Investigate and remove immediately; scope permissions to minimum required |
| Service accounts with shared credentials | 0 | Create dedicated accounts per service; rotate all shared credentials |
| Local admin accounts with default vendor passwords | 0 | Reset all default passwords; document new credentials in PAM solution |

> [!OT]
> In OT environments without domain connectivity, service account hygiene must be managed locally on each host. Use `Set-LocalUser -Name 'scada-svc' -Password (Read-Host -AsSecureString)` to rotate local service account passwords on each OT workstation during the quarterly review. Maintain a signed access control record for each OT host documenting which accounts exist, their purpose, and the date of last password change. NIST AC-6 requires documentation of the least-privilege rationale — air-gapped systems are not exempt from the documentation requirement. Where OT systems cannot be domain-joined, apply the same policy framework manually and verify compliance during physical site audits.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-006 physical security requirements define the boundary of what constitutes a protected cyber asset — the access control principles in CIP-006 are structurally aligned with TSA's mandate to limit OT system access to authorized personnel only. CIP-006 R1 requires documented physical security plans that include access authorization procedures analogous to the logical access controls covered in this lesson.

## Key Least Privilege Controls to Enforce

For TSA pipeline security compliance, enforce these access controls at minimum on PIPELINE-DC01 and all OT-connected systems:

| Control | Implementation | Verification |
|---------|---------------|--------------|
| Restrict Domain Admins | 3 or fewer members | `Get-ADGroupMember -Identity 'Domain Admins'` quarterly |
| Block service account interactive logon | GPO: Deny log on locally | `Get-GPResultantSetOfPolicy` on affected systems |
| Remove expired service accounts | Disable within 24h of role end | Quarterly AD audit with `Get-ADUser -Filter {Enabled -eq $true}` |
| Enforce unique service account passwords | No shared credentials across services | PAM solution audit or credential store review |
| Audit privileged group changes | Event ID 4728 — member added to security-enabled global group | SIEM alert on 4728 events for Domain Admins and Backup Operators |
