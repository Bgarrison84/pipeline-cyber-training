---
title: Enabling PowerShell Script Block Logging
lessonId: ps-logging
moduleId: logging-auditing
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-CM-6]
---

## What Is Script Block Logging?

PowerShell Script Block Logging captures the full content of every PowerShell script block executed on the system — including commands entered interactively, scripts loaded from disk, and encoded or obfuscated commands after they are decoded. This is critical for detecting unauthorized code execution, a requirement under the current TSA pipeline security directive's cybersecurity monitoring mandate.

Every function, loop, and command is compiled into a script block before it runs. Enabling Script Block Logging writes complete, decoded script text to the **Microsoft-Windows-PowerShell/Operational** log as **Event ID 4104** — regardless of whether the script was obfuscated or base64-encoded.

Adversaries frequently use PowerShell for lateral movement and privilege escalation in pipeline IT environments. Script Block Logging is the single highest-value control for detecting this activity post-compromise.

## Checking Whether Logging Is Enabled

Script Block Logging is configured via a registry key. Check its current state on PIPELINE-DC01 before making changes:

```powershell
# NIST CM-6: Verify current registry configuration state on PIPELINE-DC01
# If the key does not exist, the property returns an error — logging is disabled
Get-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -ErrorAction SilentlyContinue
```

No output or an error means the `ScriptBlockLogging` key does not exist and logging is off. A returned `EnableScriptBlockLogging` value of `1` means logging is already active.

## Creating the Registry Key

If the path does not exist, create it with `-Force` (creates all parent keys automatically):

```powershell
# Create the ScriptBlockLogging registry key (and parent path if needed)
# -Force ensures parent keys HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell are created
New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -Force
```

Run PowerShell as Administrator on PIPELINE-DC01 before executing this and the following command.

## Enabling Logging

With the key in place, set `EnableScriptBlockLogging` to `1`:

```powershell
# NIST AU-12: Enable script block logging — all PS script blocks are now written to Event ID 4104
# Setting takes effect for new PS sessions; existing sessions are unaffected until restarted
Set-ItemProperty `
    -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -Name EnableScriptBlockLogging `
    -Value 1
```

The change applies to new PowerShell sessions only. Restart any long-running PS remoting sessions or scheduled task runners for complete coverage.

## Verifying Logging Is Active

After enabling the registry key, run any PS command in a new session, then query for Event ID 4104:

```powershell
# NIST AU-12: Confirm Event ID 4104 entries are being generated
# Each entry contains the full decoded script block content
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' -MaxEvents 5 |
    Where-Object { $_.Id -eq 4104 } |
    Select-Object TimeCreated, Id, Message
```

If Event ID 4104 entries appear, Script Block Logging is active and recording all PS activity on PIPELINE-DC01.

> [!OT]
> In air-gapped OT environments without a domain controller, Group Policy cannot distribute registry settings. Apply the registry changes manually on each OT workstation using the PS commands above. Where PowerShell remoting is available on the OT LAN (10.0.0.0/24), use `Invoke-Command -ComputerName <host> -ScriptBlock { ... }` from a jump server. On machines without PS remoting, deploy a startup script via the local machine's Group Policy Editor (`gpedit.msc`). NIST CM-6 requires documenting the registry state as a configuration baseline — record which hosts have Script Block Logging enabled and the date of configuration.

## Additional Logging Types

Two other PS logging mechanisms complement Script Block Logging:

- **Module Logging** (`EnableModuleLogging`): Logs pipeline output and module imports. Lower value than Script Block Logging for detection purposes.
- **Transcription Logging** (`EnableTranscripting`): Writes PS session input/output to a text file. High volume on busy systems.

Enable Script Block Logging first — it captures decoded payloads and provides the highest detection value. Add the others based on SIEM capacity.
