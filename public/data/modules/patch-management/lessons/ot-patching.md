---
title: OT/ICS Patching in Air-Gapped Environments
lessonId: ot-patching
moduleId: patch-management
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-PatchMgmt, NIST-SI-2, NIST-MA-2]
---

## Why OT Patching Is Different

OT systems — PLCs, RTUs, DCS controllers, historian servers like PIPELINE-HIST01 — cannot follow the same patch cadences as IT systems. Three structural differences make OT patching a separate discipline:

**1. OEM qualification requirement.** A security patch for Windows Server running on a historian must be tested and approved by the historian's original equipment manufacturer (OEM) before it can be safely applied. The OEM maintains its own software stack on top of the operating system — OPC server communication libraries, proprietary data collection services, and real-time database engines. Applying an unqualified patch can corrupt these dependencies, interrupt SCADA data collection, or cause the historian to lose synchronization with field devices. This is not a theoretical risk; it is a documented failure mode in pipeline OT environments.

**2. 3-12 month vendor approval cycles.** OT vendors typically take 3 to 12 months to qualify a security patch. This timeline is not negligence — it reflects the testing required to verify that a patch does not break safety-critical OT software dependencies. Organizations that pressure OEM vendors to shorten this cycle, or that apply patches without waiting for qualification, accept the full risk of OT service instability. The current TSA pipeline security directive acknowledges this constraint and requires compensating controls documentation for the duration of the unpatched window.

**3. Uptime requirements.** Most pipeline OT systems have planned maintenance windows measured in weeks or months — not days. A SCADA historian or DCS controller cannot be rebooted outside a scheduled maintenance window without change management approval. Even a short-duration patch reboot can disrupt flow computer synchronization or cause a gap in regulatory audit data. Patch deployment for OT systems must be scheduled and approved in advance.

## The OT Patch Approval Workflow

When a vulnerability advisory affects a pipeline OT system, the required workflow under the current TSA pipeline security directive is:

1. **Advisory published** — CISA or the OEM vendor publishes a CVE advisory for a relevant OT asset version.
2. **Assessment** — The organization determines whether its specific asset version is affected. Not every CVE applies to every version; do not assume applicability without checking.
3. **OEM contact** — Contact the OEM vendor to request patch qualification status and estimated timeline. Log the contact date and vendor response in the patch tracking record.
4. **Compensating controls (if unqualified)** — If the patch is not yet OEM-qualified, document the compensating controls implemented to reduce the risk of the unpatched vulnerability during the qualification window. Compensating controls require supervisor sign-off and must be reviewed at a defined interval (minimum every 30 days). See Lesson 3 for compensating controls documentation requirements.
5. **Schedule deployment** — When the OEM qualifies the patch, schedule deployment in the next available maintenance window. Do not deploy outside the scheduled window.
6. **Deploy via approved offline media** — Apply the patch using approved removable media (USB drive or internal media staging server). OT systems on the air-gapped 10.0.0.0/24 segment have no internet access; direct download is not possible.
7. **Document** — Record the patch KB number, OEM qualification reference number, deployment date, maintenance window ID, and approver name. This documentation is the audit evidence required by TSA auditors.

Steps cannot be skipped even when CVE severity is critical. A critical CVE on an OT system that has not yet received OEM qualification requires documented compensating controls — not an unqualified patch deployment.

## Offline Media Staging

Most OT systems on the air-gapped 10.0.0.0/24 segment have no internet connectivity. Patches must be staged on approved removable media — USB drives approved under the organization's removable media control policy — or on an internal media staging server located in the DMZ that OT administrators can access from the OT side.

Before copying a patch to removable media, always verify its cryptographic hash against the hash published by Microsoft or the OEM vendor. A corrupted or tampered patch file can cause worse damage than the vulnerability it was meant to fix:

```powershell
# NIST MA-2: Verify the patch file hash before installing on an air-gapped OT system
# Run this on the staging machine before copying to removable media
Get-FileHash 'D:\OTPatchStaging\KB5034441.msu' -Algorithm SHA256
```

Compare the `Hash` value in the output against the SHA-256 hash published on Microsoft's Update Catalog or the OEM vendor portal. If the hashes do not match, discard the file and re-download from the authoritative source. Hash verification is part of the controlled maintenance (NIST MA-2) requirement — it ensures that the patch being installed is exactly what the vendor qualified and tested.

After verification, copy to the approved USB drive using standard file copy operations. Label the USB with the KB number, the target system, and the date staged. Do not reuse staging USB drives across different target systems without a documented wipe and re-approval step.

## Generating Patch Compliance Evidence with PowerShell

Audit evidence must be generated to prove patch compliance status. TSA auditors reviewing a pipeline operator's patch management program will request a patch inventory showing which patches are installed, which are overdue, and how deferred patches are documented with compensating controls.

The terminal exercise in this lesson walks through four compliance reporting commands that produce the audit evidence artifact:

- **`Get-Hotfix | Select-Object HotFixID, Description, InstalledOn | Sort-Object InstalledOn -Descending`** — Generates a complete inventory of installed patches on the target system, sorted with the most recent first. This is the baseline patch inventory required by TSA auditors.
- **`Get-WmiObject Win32_QuickFixEngineering | Where-Object {$_.InstalledOn} | Where-Object {[datetime]$_.InstalledOn -lt (Get-Date).AddDays(-90)}`** — Identifies patches installed more than 90 days ago. Any security updates in this list that lack a compensating controls record are a compliance gap.
- **`Get-Hotfix | Export-Csv 'C:\Audit\patch-status.csv' -NoTypeInformation`** — Exports the full patch inventory as a CSV file for auditor submission. The `C:\Audit\` directory is the standard audit evidence staging path established in this training environment, consistent with the incident response evidence path from Lesson 4.
- **`Get-Content 'C:\Audit\patch-status.csv' | Measure-Object -Line`** — Verifies that the export file was created and contains data rows. A line count of 1 (header only) means the export ran but captured no patches — investigate before submitting.

The exercise simulates running these four commands on PIPELINE-DC01 and generates a `patch-status.csv` artifact that represents the type of evidence a TSA auditor would review.

> [!OT]
> In OT environments — the `C:\Audit\` directory used in this lesson's exercise mirrors the `C:\Evidence\` path established in the Incident Response module. For OT systems in air-gapped environments, audit artifact directories must be on local disks only — do not configure a UNC path (`\\PIPELINE-DC01\audit\`) as the `Export-Csv` destination for an OT workstation; the OT system may lack domain connectivity and the export will fail silently. After exporting, transfer the CSV to the auditor staging share from the DMZ-connected intermediate system, not directly from the OT host. This preserves air-gap integrity while satisfying the TSA documentation requirement.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-010 R2 configuration change management and vulnerability assessment requirements cover patch management as a configuration change — any patch applied to a cyber asset must be documented as a baseline change. Pipeline operators follow equivalent documentation requirements under the TSA patch management mandate.

The terminal exercise for this lesson walks through all four compliance reporting commands in a simulated environment on PIPELINE-DC01. Completing the exercise generates a `patch-status.csv` artifact that represents the type of evidence required for a TSA audit submission. Lesson 3 covers the policy documentation layer — compensating controls records, audit evidence requirements, and policy timelines for IT versus OT systems.
