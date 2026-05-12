---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
---

## Why Audit Policies Matter

Windows audit policies control which security events are written to the Security event log. Without the correct audit subcategories configured, Event IDs 4624, 4625, 4688, and others will not be generated — leaving the Security log empty even if collection infrastructure is in place. Configuring audit policies correctly is required to satisfy the current TSA pipeline security directive's audit trail requirements and NIST SP 800-82 Rev 3 controls AU-2 (Event Logging) and AU-12 (Audit Record Generation).

## Audit Policy Structure

Windows organizes audit settings into 9 top-level categories, each with multiple subcategories:

- **Account Logon** — Kerberos ticket validation, credential validation
- **Logon/Logoff** — Interactive and network logon/logoff events (4624, 4625)
- **Object Access** — File, registry, and shared resource access
- **Privilege Use** — Use of user rights (4672)
- **Process Creation** — Process launch events (4688)
- **Policy Change** — Changes to audit policies themselves
- **Account Management** — User and group account changes
- **DS Access** — Active Directory object access (domain environments only)
- **System** — System startup, shutdown, and integrity events

Configure at the **subcategory level** using `auditpol` for precision. Category-level settings override all subcategories — avoid using `/category` when setting specific subcategories.

## Checking Current Audit Policy State

Run the following from PowerShell with Administrator privileges on PIPELINE-DC01 to see all categories and their current Success/Failure settings:

```powershell
# NIST AU-2: Review current audit policy configuration
# Shows all 9 categories and their subcategories with current Success/Failure enablement
auditpol /get /category:*
```

Review the output for any subcategory showing `No Auditing` in a category relevant to compliance monitoring. The key subcategories to check are Logon/Logoff, Process Creation, and Account Management.

## Enabling Logon/Logoff Auditing

The Logon subcategory captures Event IDs 4624 (success) and 4625 (failure) — required for detecting unauthorized access attempts under TSA-Monitoring:

```powershell
# NIST AU-12: Enable logon success and failure auditing
# 4624 (logon success) and 4625 (logon failure) require this subcategory to be enabled
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Logoff" /success:enable /failure:disable
```

Logon failure events (4625) with high frequency from a single source IP indicate brute-force activity. The TSA monitoring mandate requires this type of pattern to be detectable — enabling Logon/Logoff auditing is the prerequisite.

## Enabling Process Creation Auditing

Process Creation auditing captures Event ID 4688 — every process launch on the system, including PowerShell invocations. Combined with Script Block Logging, this creates a full execution chain:

```powershell
# NIST AU-12: Enable process creation auditing — Event ID 4688 records all process launches
# Required to detect unauthorized PowerShell use and lateral movement via scripting engines
auditpol /set /subcategory:"Process Creation" /success:enable /failure:disable
```

With Process Creation enabled, each `powershell.exe` or `pwsh.exe` launch generates a 4688 event containing the process name, parent process, and command line (if command-line logging is also enabled via Group Policy).

## Finding Audit Policy GPOs in a Domain Environment

In a domain environment, audit policies may already be defined via Group Policy. Use `Get-GPO` to find existing Audit Policy GPOs on PIPELINE-DC01:

```powershell
# Requires GroupPolicy module — part of RSAT (Remote Server Administration Tools)
# Install RSAT via: Add-WindowsFeature RSAT-AD-Tools (Server) or Settings > Optional Features (client)
# If RSAT is not available, use auditpol directly as shown above
Get-GPO -All | Where-Object { $_.DisplayName -like "*Audit*" }
```

The `GroupPolicy` module is not installed by default on workstations. If it is not available, all audit policy configuration must be done with `auditpol` directly. `auditpol` changes take effect immediately — no GPO processing delay.

> [!OT]
> In isolated OT environments without domain connectivity — workgroup machines or OT systems on an air-gapped network segment — Group Policy does not apply. Configure audit policies directly with `auditpol` on each OT workstation. For OT domains on air-gapped networks, use `Backup-GPO` on a connected management system to export the policy, transfer it via USB, then `Restore-GPO` on the air-gapped domain controller (PIPELINE-DC01) to import it: `Backup-GPO -Name "Audit Policy" -Path C:\GPOBackups` followed by `Restore-GPO -BackupId <guid> -TargetName "Audit Policy" -Path C:\GPOBackups`. NIST AU-2 applies regardless of connectivity — audit events must be generated on every monitored host whether or not a domain controller is reachable.

## Key Subcategories to Enable

For TSA pipeline security compliance, configure at minimum these subcategories:

| Subcategory | Success | Failure | Event IDs Generated |
|-------------|---------|---------|---------------------|
| Logon | Yes | Yes | 4624, 4625 |
| Logoff | Yes | No | 4634 |
| Kerberos Authentication Service | Yes | Yes | 4768, 4771 |
| Process Creation | Yes | No | 4688 |
| Audit Policy Change | Yes | Yes | 4719 |
| User Account Management | Yes | Yes | 4720, 4722, 4726 |
| Security Group Management | Yes | Yes | 4728, 4732, 4756 |

All `auditpol` commands require Administrator privileges. On PIPELINE-DC01, run PowerShell as Administrator or execute with a domain admin account via `Invoke-Command`.
