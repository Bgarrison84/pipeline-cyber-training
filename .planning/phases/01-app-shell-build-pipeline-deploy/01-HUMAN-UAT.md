---
status: partial
phase: 01-app-shell-build-pipeline-deploy
source: [01-VERIFICATION.md]
started: 2026-05-11
updated: 2026-05-11
---

## Current Test

Awaiting human browser confirmation on live deployment: https://Bgarrison84.github.io/pipeline-cyber-training/

## Tests

### 1. Hash navigation without page reload
expected: Clicking each of the 5 sidebar modules changes the URL hash (e.g. #/module/logging-auditing) and updates the content area — no full page reload, no blank flash
result: [pending]

### 2. Bookmarkable URL direct load
expected: Pasting #/module/network-hardening (or any module URL) directly into the browser address bar renders the correct module placeholder view immediately on load
result: [pending]

### 3. Compliance badge text sourced from JSON
expected: Opening DevTools Network tab shows compliance-refs.json fetched with HTTP 200; TSA and NIST badges in the module views display "TSA SD-02F" and "NIST SP 800-82 Rev 3" (not raw keys "TSA"/"NIST")
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
