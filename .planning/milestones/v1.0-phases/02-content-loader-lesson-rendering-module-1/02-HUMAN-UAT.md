---
status: partial
phase: 02-content-loader-lesson-rendering-module-1
source: [02-VERIFICATION.md]
started: 2026-05-14T13:05:00Z
updated: 2026-05-14T13:05:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Syntax highlighting visual appearance

**Setup:** `npm run dev`, navigate to `http://localhost:5173/#/lesson/logging-auditing/intro`
expected: PowerShell code blocks display with visually distinct colors — keywords (Get-WinEvent, Where-Object), string literals, and parameters in different hues using the github-dark Shiki theme; code is NOT displayed as plain unstyled text
result: [pending]

---

### 2. OT callout body text visible (CR-02 fix)

**Setup:** Same lesson page — scroll to the amber-bordered callout block
expected: The "IN OT ENVIRONMENTS" label appears, followed by the full body text of the OT callout (body is NOT empty or truncated); the CR-02 fix stripped only the `[!OT]` marker line and preserved the body
result: [pending]

---

### 3. Copy-to-clipboard round-trip

**Setup:** Click the copy icon button on any code block, then paste into Notepad or a text editor
expected: Pasted text matches the raw PowerShell code exactly — no HTML entities (&amp;, &lt;, &#96;) appear in the pasted text
result: [pending]

---

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
