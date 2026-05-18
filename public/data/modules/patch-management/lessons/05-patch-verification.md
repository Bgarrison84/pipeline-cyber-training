---
title: Patch Compliance Verification with PowerShell
lessonId: patch-verification
moduleId: patch-management
order: 5
complianceTags: [TSA, NIST]
complianceControls: [TSA-PatchMgmt, NIST-SI-2, NIST-CM-6]
quizId: '02'
lastReviewed: ''
reviewer: ''
---

## Verifying Patch Compliance Across the Fleet

WSUS (Windows Server Update Services) provides a centralized console for viewing patch deployment status across domain-joined systems. For IT systems in a standard domain environment, WSUS reporting is often sufficient to demonstrate patch compliance to an internal IT security team. However, WSUS reports are not the same as direct evidence of installed patches — and TSA auditors frequently request the direct evidence rather than the WSUS dashboard screenshot.

The difference matters for three reasons:

**1. WSUS shows deployment status, not installation confirmation.** A WSUS report may show a patch as "Installed" based on the client agent's last status report. If the client agent reported success before a subsequent rollback or failed installation, the WSUS status is stale. Direct PowerShell query against the WMI patch database returns the actual installed state at the time of the query.

**2. WSUS does not cover all OT systems.** OT workstations and servers in the air-gapped 10.0.0.0/24 segment typically do not have a network path to the WSUS server. These systems receive patches via approved offline media (as covered in Lesson 2) and may never appear in WSUS inventory. For OT systems, the only way to generate patch compliance evidence is a direct query on the system itself.

**3. Auditor expectations under the current TSA pipeline security directive.** TSA auditors reviewing a pipeline operator's patch management program expect evidence in the form of structured, queryable artifacts — CSV exports that can be imported into a compliance tracking system, not screenshots. NIST SP 800-82 Rev 3 Chapter 6 (ICS patch management) and NIST SP 800-82 Rev 3 Section 6.3.6 identify patch compliance verification as a required element of the ICS security program. Verification means proving installed state, not just deployment intent.

## Querying Installed Patches with PowerShell

PowerShell provides several ways to query the installed patch inventory. The most reliable method for compliance evidence generation uses `Get-HotFix`, which reads directly from the WMI `Win32_QuickFixEngineering` class — the same data source that patch management tools use for inventory.

### Local Query on the Target System

Run the following on the target system (or via Invoke-Command for remote targets):

```powershell
# TSA-PatchMgmt / NIST SI-2: Local patch inventory — full history with dates
Get-HotFix | Sort-Object InstalledOn -Descending |
    Select-Object HotFixID, Description, InstalledOn, InstalledBy |
    Format-Table -AutoSize
```

This returns all installed QFE patches sorted with the most recent first. The `InstalledBy` field shows which account applied each patch — useful for confirming that OT patches were applied by an authorized administrator account, not an unexpected service account.

### Remote Query via Invoke-Command

For domain-joined IT systems and OT workstations with WinRM enabled, query the patch inventory remotely from an admin workstation:

```powershell
# NIST SI-2: Remote patch compliance query — run from admin workstation
Invoke-Command -ComputerName PIPELINE-DC01 -ScriptBlock {
    Get-HotFix | Sort-Object InstalledOn -Descending |
        Select-Object HotFixID, InstalledOn, InstalledBy
} | Format-Table -AutoSize
```

For multiple targets, wrap in a loop and aggregate results:

```powershell
# TSA-PatchMgmt: Fleet-wide patch audit — aggregate results from all IT systems
$systems = @('PIPELINE-DC01', 'PIPELINE-FS01', 'PIPELINE-MGMT01')
$results = foreach ($sys in $systems) {
    Invoke-Command -ComputerName $sys -ScriptBlock {
        Get-HotFix | Select-Object @{N='System';E={$env:COMPUTERNAME}},
            HotFixID, Description, InstalledOn
    }
}
$results | Sort-Object System, InstalledOn -Descending
```

The aggregated result set shows the patch state across all queried systems in a single view — the starting point for identifying which systems are missing a specific KB.

### Checking for a Specific Patch by KB Number

When a specific vulnerability disclosure requires verifying whether a particular KB is installed:

```powershell
# NIST SI-2: Verify specific KB patch installation
$kbNumber = 'KB5034441'
$installed = Get-HotFix -Id $kbNumber -ErrorAction SilentlyContinue
if ($installed) {
    Write-Output "$kbNumber is installed. Date: $($installed.InstalledOn)"
} else {
    Write-Warning "$kbNumber is NOT installed on $env:COMPUTERNAME"
}
```

Run this against every in-scope system when a CVE advisory specifies a required KB number.

### Exporting Patch Inventory to CSV for Compliance Evidence

The audit evidence format required for TSA compliance submissions is a CSV export:

```powershell
# TSA-PatchMgmt: Export patch inventory as compliance evidence artifact
# C:\Audit\ is the standard evidence staging path for this training environment
Get-HotFix | Export-Csv -Path 'C:\Audit\patch-status.csv' -NoTypeInformation
Write-Output "Export complete. Verify record count:"
Get-Content 'C:\Audit\patch-status.csv' | Measure-Object -Line
```

The `Measure-Object -Line` output confirms the file has data rows. A count of 1 (header only) means the export ran but captured nothing — investigate WMI connectivity before submitting. A missing file is a finding on its own.

For a time-stamped evidence file that does not overwrite previous exports:

```powershell
# TSA-PatchMgmt / NIST CM-6: Timestamped patch evidence — preserves audit trail
$date = Get-Date -Format 'yyyyMMdd-HHmmss'
$path = "C:\Audit\patch-status-$date.csv"
Get-HotFix | Export-Csv -Path $path -NoTypeInformation
Write-Output "Patch inventory saved to: $path"
```

> [!OT]
> `Get-HotFix` and `Invoke-Command` work on domain-joined Windows systems with WinRM enabled. OT workstations that are not domain-joined or have WinRM disabled (a common security hardening step in ICS environments) require local queries only — remote `Invoke-Command` will fail with an access denied or connection error. For air-gapped OT systems, collect patch evidence during scheduled on-site maintenance visits: run `Get-HotFix | Export-Csv` locally and transfer the CSV to the audit staging share from the DMZ-connected intermediate system after the maintenance window. NIST SP 800-82 Rev 3 Section 6.3.6 permits manual evidence collection when remote management is unavailable for OT/ICS assets. Document the collection method in the evidence metadata (e.g., add a `CollectionMethod` column to the CSV with value "local-manual-maintenance-window" for air-gapped OT systems).

## Generating Patch Compliance Reports for TSA Submissions

TSA auditors reviewing a pipeline operator's patch management program will request structured compliance reports that demonstrate three things:

1. **Installed patch inventory** — Which patches are installed on all in-scope systems (both IT and OT)
2. **Overdue patch identification** — Which systems are missing patches beyond the policy deadline
3. **Compensating controls linkage** — For every overdue patch, evidence that a compensating control was documented and approved

The first deliverable is generated by `Get-HotFix | Export-Csv` as described above. The second requires comparing the installed inventory against a required patch list.

### Identifying Systems Missing a Required Patch Set

When a TSA audit requires demonstrating patch coverage for a set of required KBs:

```powershell
# TSA-PatchMgmt: Identify systems missing required patches
# Define required KB numbers from your patch management policy
$requiredKBs = @('KB5034441', 'KB5033372', 'KB5032189')
$targets = @('PIPELINE-DC01', 'PIPELINE-FS01', 'PIPELINE-MGMT01')

foreach ($sys in $targets) {
    $installed = Invoke-Command -ComputerName $sys -ScriptBlock {
        Get-HotFix | Select-Object -ExpandProperty HotFixID
    }
    foreach ($kb in $requiredKBs) {
        if ($installed -notcontains $kb) {
            Write-Warning "$sys: MISSING $kb"
        }
    }
}
```

Systems with missing required KBs require a compensating controls record in the patch management compliance log. The output of this script is the starting point for that record.

### Preparing the TSA Submission Package

A complete patch compliance submission to TSA auditors includes:

| Evidence Item | Generated By | File Format |
|---------------|-------------|-------------|
| Patch inventory — IT systems | `Get-HotFix \| Export-Csv` (per system or aggregated) | CSV |
| Patch inventory — OT systems | Local `Get-HotFix \| Export-Csv` collected during maintenance | CSV |
| Missing patch report | Comparison script output | CSV or TXT |
| Compensating controls log | Maintained in compliance tracking system | PDF or signed DOCX |
| OEM certification references | Vendor portal printouts or emails | PDF |

Submit these as a package with a cover memo that identifies each file, the system it covers, the query date, and the responsible administrator who ran the export. The query date matters — a patch inventory that is 6 months old does not demonstrate current compliance.

The quiz for this lesson tests understanding of patch compliance verification across the full Patch Management module: OT risk assessment (Lesson 4), remote query methods, evidence export, and TSA submission requirements.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. NERC CIP-010 R1 requires electric utility operators to document software (including security patches) installed on cyber assets. Pipeline operators follow equivalent requirements under the current TSA pipeline security directive and must demonstrate patch compliance through direct evidence — installed patch inventories, compensating controls logs, and OEM certification references — rather than WSUS dashboard status alone.
