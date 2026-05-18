---
title: OT Patch Risk Assessment and Scheduling Strategy
lessonId: ot-patch-strategy
moduleId: patch-management
order: 4
complianceTags: [TSA, NIST]
complianceControls: [TSA-PatchMgmt, NIST-SI-2, NIST-MA-2]
scenarioId: '04'
lastReviewed: ''
reviewer: ''
---

## Why OT Patch Risk Assessment Differs from IT

When an IT security team receives a critical CVE advisory, standard practice is straightforward: consult the CVSS base score, apply the vendor patch within the required timeline, and close the ticket. For IT infrastructure — domain controllers, file servers, workstations — this risk-based approach works because operational disruption from a patch reboot is measured in minutes and the blast radius of a failed patch is recoverable.

OT systems in pipeline environments require a fundamentally different risk assessment framework. Three structural differences prevent the direct application of IT risk-scoring methods to OT patch decisions:

**1. Vendor certification requirements.** OT software vendors — including major pipeline automation vendors — must certify a Windows patch before it is applied to any system running their software. A patch to the OS hosting a DCS controller, SCADA historian, or flow computer management software may break proprietary OPC-UA communication libraries, real-time database services, or safety interlock logic that the vendor has not yet validated against the new patch state. Applying an uncertified patch without vendor approval voids the support agreement and puts the organization in an unqualified operational state.

**2. Operational continuity risk.** In pipeline OT environments, a failed patch that requires an unplanned rollback can take a SCADA server offline for hours. Unlike an IT system failure, a SCADA outage may interrupt regulatory flow reporting, lose historian data for the affected window, or — in worst cases — trigger process safety system responses. The CVSS score does not capture this operational risk dimension.

**3. Air-gap and maintenance window constraints.** OT systems on the air-gapped 10.0.0.0/24 segment cannot download patches over the network. Every patch application requires staging approved media, scheduling a maintenance window, and obtaining change management approval in advance. The scheduling lead time alone can exceed the IT patching deadline.

Under the current TSA pipeline security directive, pipeline operators must document their OT patch risk assessment process. A process that applies IT-only CVSS scoring to OT systems without an operational risk analysis does not satisfy this requirement. NIST SP 800-82 Rev 3 Chapter 6 (ICS security program components) explicitly addresses OT patch management as a distinct discipline requiring organization-specific risk assessment procedures.

> [!OT]
> OT vendors (including major DCS, historian, and SCADA software vendors) must certify patches before they are applied to ICS components. Applying an uncertified patch to a PLC, DCS controller, HMI, or historian may void the vendor support agreement and break the vendor's qualified software configuration. The practical consequence of an unsupported OT component in an active pipeline is that the vendor will not assist with troubleshooting or recovery until the system is restored to a supported state — which may require reverting the patch under emergency conditions. Wait for vendor certification before applying any patch to Levels 0–1 OT components. NIST SP 800-82 Rev 3 Section 6.3.6 acknowledges OT vendor patch certification requirements as a structural constraint on patch timelines.

## Risk Assessment Framework for OT Patches

Because CVSS score alone is insufficient for OT patch decisions, pipeline operators should use a composite risk assessment matrix that adds two OT-specific dimensions to the standard vulnerability score.

### The OT Patch Assessment Matrix

An effective OT patch risk assessment combines three independent scores:

| Dimension | Description | Score Range |
|-----------|-------------|-------------|
| **CVSS Base Score** | Standard vulnerability severity (exploitability, impact) | 0–10 |
| **Exploitability in OT Context** | Is the attack vector reachable from the OT network segment? Can an adversary actually exploit this CVE given your segmentation? | Low / Medium / High |
| **Operational Criticality** | What is the operational impact if the affected system goes offline during a patch reboot or rollback? | Low / Medium / High / Critical |

A CVE with CVSS 9.8 that is not reachable from the 10.0.0.0/24 OT segment (because the vulnerable port is blocked at the DMZ firewall and the system has no internet path) has a lower effective OT risk than a CVE with CVSS 7.2 affecting a SCADA historian that has no redundant path and directly feeds regulatory flow reporting.

### Compensating Controls for Patches That Cannot Be Immediately Applied

When an OT patch cannot be applied immediately — whether because the vendor has not yet certified it, the next maintenance window is 6 months away, or both — the organization must document a compensating control that actively reduces the risk of the unpatched vulnerability.

Acceptable compensating controls depend on the vulnerability type:

- **Network-reachability vulnerability** (e.g., unauthenticated RCE via a network service): Block the vulnerable port at the segment firewall. Create a firewall rule change record referencing the CVE number. This removes the network attack path while the patch is pending vendor certification.
- **Privilege escalation vulnerability** (e.g., local privilege escalation via a kernel driver): Restrict interactive logins to the affected system to named individuals with documented justification. Remove any generic or shared accounts.
- **Authentication bypass vulnerability**: Enforce multi-factor authentication where possible for the affected service; if MFA is not available, restrict service access to named source IPs only.

Each compensating control must be documented in writing, approved by a named individual, reviewed at defined intervals (at minimum every 30 days), and retired when the patch is applied. Open compensating control records after a patch has been applied are themselves a compliance finding.

## Scheduling OT Patches to Minimize Operational Impact

Once a vendor certifies a patch and the risk assessment is complete, the deployment must be scheduled. OT patch scheduling follows different constraints than IT patch scheduling:

**Align with pipeline maintenance windows.** Pipeline compressor stations and meter stations have planned maintenance windows — periods when the pipeline segment can be taken partially offline for equipment inspection and repair. These windows are the natural scheduling opportunity for OT patch deployments because the operational risk of an unplanned shutdown during patching is already accepted and managed. Coordinate with operations before adding patch activities to a maintenance window.

**Validate the test environment first.** If a test historian or non-production HMI is available, apply the patch there first and run the historian software through its normal operating cycle before scheduling the production deployment.

**Audit the current patch state before scheduling.** Before scheduling a deployment, establish a baseline of what is currently installed. PowerShell provides a direct way to query the local patch inventory:

```powershell
# TSA-PatchMgmt / NIST SI-2: Audit installed patches on PIPELINE-HIST01 before scheduling
# Run on the target OT workstation or historian server
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 20 |
    Format-Table HotFixID, Description, InstalledOn -AutoSize
```

This command returns the 20 most recently installed patches, sorted with the latest first. Review the output to confirm the system's current patch baseline before the maintenance window begins. Any patches that appear in the vendor-recommended patch list but are missing from this output are candidates for inclusion in the scheduled deployment.

For remote inventory across multiple OT workstations in the same network segment:

```powershell
# NIST SI-2: Remote patch audit — run from DMZ-connected admin workstation
# Target: OT workstations in the 10.0.0.0/24 segment reachable via WinRM
$targets = @('PIPELINE-HMI01', 'PIPELINE-EWS01', 'PIPELINE-HIST01')
foreach ($target in $targets) {
    Write-Output "=== $target ==="
    Invoke-Command -ComputerName $target -ScriptBlock {
        Get-HotFix | Sort-Object InstalledOn -Descending |
            Select-Object -First 5 HotFixID, InstalledOn
    }
}
```

**Document the pre-patch and post-patch baseline.** Run the patch inventory export before and after the maintenance window. Save both CSVs to the audit staging path with timestamps in the filename:

```powershell
# TSA-PatchMgmt: Pre-patch baseline snapshot — run before the maintenance window
$date = Get-Date -Format 'yyyyMMdd-HHmmss'
Get-HotFix | Export-Csv "C:\Audit\patch-baseline-pre-$date.csv" -NoTypeInformation
Write-Output "Pre-patch baseline saved: patch-baseline-pre-$date.csv"
```

The pre-patch and post-patch CSVs together form the change verification evidence for the maintenance window record — auditors can diff the two files to confirm exactly which KBs were applied.

The scenario exercise for this lesson walks through an OT patch risk assessment decision for a zero-day vulnerability affecting SCADA historian software. The scenario presents an OT/IT branching path: the correct path implements compensating controls immediately while awaiting vendor certification; the incorrect path defers all action until the vendor issues a patch, leaving the system unprotected.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. NERC CIP-007 R2 requires electric utility asset owners to have a defined security patch management program with documented patch review cadences. Pipeline operators follow equivalent requirements under the current TSA pipeline security directive's patch management mandate, with OT-specific extensions for vendor certification timelines.
