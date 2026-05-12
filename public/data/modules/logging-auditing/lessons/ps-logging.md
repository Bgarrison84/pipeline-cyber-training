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

Script blocks are the fundamental unit of PowerShell execution. Every function, loop, conditional, and command is compiled into a script block before it runs. Enabling Script Block Logging means that complete, decoded script text is written to the **Microsoft-Windows-PowerShell/Operational** log as **Event ID 4104** — regardless of whether the script was obfuscated or base64-encoded before execution.

Adversaries frequently use PowerShell for lateral movement, privilege escalation, and data exfiltration in pipeline IT environments. Script Block Logging is the single highest-value control for detecting this activity post-compromise.

## Checking Whether Logging Is Enabled

Script Block Logging is configured via a registry key. Check whether the key exists before making changes:

```powershell
# NIST CM-6: Verify current registry configuration state on PIPELINE-DC01
# If the key does not exist, the property returns an error — logging is disabled
Get-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -ErrorAction SilentlyContinue
```

If the command returns no output or an error, the `ScriptBlockLogging` key does not exist and logging is off. If it returns a property named `EnableScriptBlockLogging` with a value of `1`, logging is already active.

## Creating the Registry Key

If the registry path does not exist, create it. The `-Force` flag creates all required parent keys automatically:

```powershell
# Create the ScriptBlockLogging registry key (and parent path if needed)
# -Force ensures parent keys HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell are created
New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -Force
```

This command requires Administrator privileges. Run PowerShell as Administrator on PIPELINE-DC01 before executing this and the next command.

## Enabling Logging

With the key in place, set the `EnableScriptBlockLogging` value to `1`:

```powershell
# NIST AU-12: Enable script block logging — all PS script blocks are now written to Event ID 4104
# Setting takes effect immediately for new PS sessions; existing sessions are unaffected until restart
Set-ItemProperty `
    -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' `
    -Name EnableScriptBlockLogging `
    -Value 1
```

The change takes effect for any new PowerShell session started after this command runs. Running PowerShell sessions — including the one you used to set the registry value — are not retroactively logged. Restart any long-running PS remoting sessions or scheduled task runners for coverage to be complete.

## Verifying Logging Is Active

Confirm logging is operational by querying the PowerShell/Operational log for Event ID 4104. After enabling the registry key, run any PS command in a new session, then query for it:

```powershell
# NIST AU-12: Confirm Event ID 4104 entries are being generated
# Each entry contains the full decoded script block content
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' -MaxEvents 5 |
    Where-Object { $_.Id -eq 4104 } |
    Select-Object TimeCreated, Id, Message
```

If Event ID 4104 entries appear, Script Block Logging is active and recording all PS activity on PIPELINE-DC01.

> [!OT]
> In air-gapped OT environments without a domain controller, Group Policy cannot distribute registry settings across workstations. Apply the registry changes manually on each OT workstation using the PS commands above. For environments where PowerShell remoting is available on the OT LAN (10.0.0.0/24), you can use `Invoke-Command -ComputerName <host> -ScriptBlock { ... }` to apply the registry change remotely from a jump server. On machines where PS remoting is not configured, deploy a startup script via the local machine's Group Policy Editor (`gpedit.msc`). NIST CM-6 (Configuration Settings) requires documenting the registry state as a configuration baseline — record which hosts have Script Block Logging enabled and the date of configuration.

## Additional Logging Types

Two other PS logging mechanisms exist alongside Script Block Logging:

- **Module Logging** (`EnableModuleLogging` in `HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging`): Logs pipeline output and module imports. Less targeted than Script Block Logging because it captures output rather than source code.
- **Transcription Logging** (`EnableTranscripting` in `HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription`): Writes input/output of each PS session to a text file. Useful for human review but creates large file volumes on busy systems.

Enable Script Block Logging first — it captures decoded payloads and is the highest-value control. Add Module Logging and Transcription Logging based on your SIEM capacity and storage budget.
