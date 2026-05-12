---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
---

## Why Audit Policies Matter

Windows audit policies control which security events are written to the Security event log. Without the correct subcategories configured, Event IDs 4624, 4625, 4688, and others will not be generated — leaving the Security log empty even when collection infrastructure is in place. Configuring audit policies is required to satisfy the current TSA pipeline security directive's audit trail requirements and NIST SP 800-82 Rev 3 controls AU-2 and AU-12.

## Audit Policy Structure

Windows organizes audit settings into 9 categories (Account Logon, Logon/Logoff, Object Access, Privilege Use, Process Creation, Policy Change, Account Management, DS Access, System), each with multiple subcategories.

Configure at the **subcategory level** using `auditpol` for precision. Category-level settings override all subcategories — avoid `/category` when targeting specific subcategories.

## Checking Current Audit Policy State

Run from PowerShell with Administrator privileges on PIPELINE-DC01:

```powershell
# NIST AU-2: Review current audit policy — shows all 9 categories with Success/Failure status
auditpol /get /category:*
```

Look for subcategories showing `No Auditing` in the Logon/Logoff, Process Creation, and Account Management categories.

## Enabling Logon/Logoff Auditing

The Logon subcategory captures Event IDs 4624 (success) and 4625 (failure) — required for detecting unauthorized access attempts under TSA-Monitoring:

```powershell
# NIST AU-12: Enable logon success and failure auditing
# 4624 (logon success) and 4625 (logon failure) require this subcategory to be enabled
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Logoff" /success:enable /failure:disable
```

Repeated 4625 failures from a single source IP indicate brute-force activity — enabling Logon/Logoff auditing is the prerequisite for detecting this pattern.

## Enabling Process Creation Auditing

Process Creation auditing captures Event ID 4688 — every process launch including PowerShell invocations. Combined with Script Block Logging, this creates a full execution chain:

```powershell
# NIST AU-12: Enable process creation auditing — Event ID 4688 records all process launches
# Required to detect unauthorized PowerShell use and lateral movement via scripting engines
auditpol /set /subcategory:"Process Creation" /success:enable /failure:disable
```

Each `powershell.exe` launch then generates a 4688 event containing the process name, parent process, and command line (when command-line logging is also enabled via Group Policy).

## Finding Existing Audit Policy GPOs

In a domain environment, use `Get-GPO` to find existing Audit Policy GPOs on PIPELINE-DC01:

```powershell
# Requires GroupPolicy module (part of RSAT — Remote Server Administration Tools)
Get-GPO -All | Where-Object { $_.DisplayName -like "*Audit*" }
```

Without RSAT, use `auditpol` directly — changes take effect immediately with no GPO delay.

> [!OT]
> In isolated OT environments without domain connectivity — workgroup machines or OT systems on an air-gapped network — Group Policy does not apply. Configure audit policies directly with `auditpol` on each OT workstation. For OT domains on air-gapped networks, export policy from a connected system with `Backup-GPO -Name "Audit Policy" -Path C:\GPOBackups`, transfer via USB, then import with `Restore-GPO` on PIPELINE-DC01. NIST AU-2 applies regardless of connectivity — audit events must be generated on every monitored host.

## Key Subcategories to Enable

For TSA pipeline security compliance, configure at minimum:

| Subcategory | Success | Failure | Event IDs |
|-------------|---------|---------|-----------|
| Logon | Yes | Yes | 4624, 4625 |
| Logoff | Yes | No | 4634 |
| Kerberos Authentication Service | Yes | Yes | 4768, 4771 |
| Process Creation | Yes | No | 4688 |
| Audit Policy Change | Yes | Yes | 4719 |
| User Account Management | Yes | Yes | 4720, 4722, 4726 |

All `auditpol` commands require Administrator privileges on PIPELINE-DC01.
