---
title: Windows Update and WSUS
lessonId: wsus-patching
moduleId: patch-management
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-PatchMgmt, NIST-SI-2]
lastReviewed: ''
reviewer: ''
---

## What Is Patch Management?

Patch management is the disciplined process of identifying, testing, approving, deploying, and documenting software patches across IT and OT systems. The current TSA pipeline security directive requires pipeline operators to establish a patch management program that addresses both IT and OT/ICS environments. A functioning patch management program is not optional — unpatched known vulnerabilities are the most common initial access vector documented in pipeline infrastructure incidents.

IT and OT patching are distinct disciplines. On the IT side, patches can often be deployed on a standard 30-day cadence through automated distribution tools. On the OT side, every patch must be qualified by the system's original equipment manufacturer (OEM) before it can be safely applied — a process that typically takes 3 to 12 months. Lesson 2 covers the OT/ICS patching workflow in full detail. This lesson focuses on Windows Update and WSUS in the IT environment, and on why the IT/OT boundary matters for patch distribution.

## Windows Update and WSUS Basics

Windows Server Update Services (WSUS) is the Microsoft enterprise tool for managing Windows Update distribution across a domain. Instead of each machine pulling updates directly from Microsoft's servers, WSUS acts as an internal distribution point: patches are downloaded once to the WSUS server, reviewed by administrators, and then selectively approved for deployment to client machines.

Key WSUS concepts for pipeline IT administrators:

- **Approval workflow** — A patch must be approved in WSUS before it is deployed to client machines. Unapproved patches remain downloaded but are not pushed out. This approval step is where the organization exercises its risk-based judgment about which patches to apply and when.
- **Computer target groups** — WSUS organizes client machines into target groups. Different groups can receive different approved patch sets. This is the mechanism for separating IT systems from OT-adjacent systems in the patch distribution pipeline.
- **Approved patch catalog** — The set of patches approved for a given target group constitutes the organization's approved-patch catalog for that system class. Auditors may ask to review this catalog to verify the organization's patch approval decisions.

To verify which patches are currently installed on PIPELINE-DC01, use `Get-Hotfix`:

```powershell
# NIST SI-2: Query installed hotfixes on PIPELINE-DC01 sorted by most recent
Get-Hotfix | Select-Object HotFixID, Description, InstalledOn | Sort-Object InstalledOn -Descending
```

`Get-Hotfix` returns all installed Windows Update packages. Output includes the KB number (`HotFixID`), the type of update (`Description` — Security Update, Update, Hotfix, or Service Pack), and the installation date (`InstalledOn`). Use this to verify that required security patches have been applied and to identify which KB numbers are present on a given system.

## Identifying Overdue Patches

The current TSA pipeline security directive requires timely patching of known vulnerabilities. For IT systems, organizations typically target a 30-day patch cycle for critical CVEs (Common Vulnerabilities and Exposures). The following query surfaces patches installed more than 90 days ago — any missing security updates in this window require documented justification or a compensating control:

```powershell
# NIST SI-2: Identify patches older than 90 days — review candidates for overdue classification
Get-WmiObject Win32_QuickFixEngineering | Where-Object {$_.InstalledOn} | Where-Object {[datetime]$_.InstalledOn -lt (Get-Date).AddDays(-90)}
```

`Win32_QuickFixEngineering` is the WMI class backing Windows Update history. This query returns all patches installed more than 90 days ago. Any security update appearing in this list without a corresponding compensating controls record is a potential audit finding. The 90-day threshold used here is illustrative — your organization's patch management policy must define the actual thresholds and document decisions for any patch that exceeds them.

## WSUS and IT/OT Segmentation

A WSUS server on the IT network must NOT automatically push patches to OT workstations without a separate OT approval workflow. The same WSUS target group used for general IT systems cannot be used for historian servers, HMI workstations, or engineering workstations connected to the SCADA environment on the OT network (10.0.0.0/24).

The risks of an unsegmented WSUS configuration:

- A patch approved for the IT general target group is automatically pushed to PIPELINE-HIST01 (the pipeline historian), without any OEM vendor qualification review
- The historian's proprietary OPC server software has a dependency on a specific Windows DLL version; the patch updates that DLL and breaks the OPC polling service
- SCADA data collection from field devices stops; no alarms are generated because the historian appears healthy from the network perspective

To prevent this, configure a dedicated OT WSUS target group with **manual approval only**. No patch reaches an OT system automatically. Approval for an OT-group patch requires the OEM vendor qualification reference documented in the change record.

Check which update server this machine is pointed at:

```powershell
# TSA-PatchMgmt: Check Windows Update configuration source on this machine (IT or WSUS)
(New-Object -ComObject Microsoft.Update.ServiceManager).Services | Select-Object Name, IsDefaultAUService
```

This shows whether the machine gets updates from Windows Update directly (Microsoft's cloud service) or a configured WSUS server. OT workstations should point to the OT-specific WSUS target group — not the general IT group. If the output shows `IsDefaultAUService: True` for `Windows Update` on an OT system, that system is bypassing WSUS entirely and pulling patches directly from Microsoft without any approval workflow.

> [!OT]
> In OT environments — historian servers (PIPELINE-HIST01), HMI workstations, and engineering workstations connected to the SCADA system must NOT be in the same WSUS target group as general IT systems. An auto-approved WSUS patch pushed to PIPELINE-HIST01 without OEM vendor qualification can corrupt historian data collection or interrupt SCADA polling. Configure a dedicated OT WSUS target group with manual approval only, and validate with: `Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate -Name WUServer -ErrorAction SilentlyContinue` — this shows whether the system is pointed at the correct WSUS server.

> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-007 R2 patch management requirements mandate that applicable cyber assets have security patches assessed and applied within 35 days of release — the same risk-based urgency applies to pipeline OT systems under the TSA patch management mandate, though the approval and testing cycle for OT may extend beyond 35 days when OEM qualification is required.

The air-gapped nature of most OT environments means that standard WSUS-based patching cannot be applied to PLCs, RTUs, or DCS systems directly — these systems often have no network connectivity to the IT WSUS server and no Windows Update client at all. The next lesson covers the OT/ICS patching workflow for systems that are fully isolated from the IT network, including offline media staging, OEM qualification cycles, and compensating controls documentation for deferred patches.
