---
phase: 07-core-module-content-mod-02-mod-03-mod-04
plan: "01"
subsystem: content
tags: [network-hardening, lessons, quiz, exercise, scenario, MOD-02]
dependency_graph:
  requires: []
  provides:
    - public/data/modules/network-hardening/lessons/intro.md
    - public/data/modules/network-hardening/lessons/ps-firewall.md
    - public/data/modules/network-hardening/lessons/firewall-policy.md
    - public/data/modules/network-hardening/quizzes/01.json
    - public/data/modules/network-hardening/exercises/01.json
    - public/data/modules/network-hardening/scenarios/01.json
  affects: []
tech_stack:
  added: []
  patterns:
    - Pattern A lesson (scenario-host intro.md with NERC CIP disclaimer)
    - Pattern B lesson (exercise-host ps-*.md with OT callout)
    - Pattern C lesson (quiz-host policy.md with quizId frontmatter)
    - Quiz JSON 3-question schema with per-answer feedback
    - Exercise JSON 4-step schema with hintPatterns and successOutput
    - Scenario JSON 2-phase decision tree with isFinal and nextPhaseId
key_files:
  created:
    - public/data/modules/network-hardening/lessons/intro.md
    - public/data/modules/network-hardening/lessons/ps-firewall.md
    - public/data/modules/network-hardening/lessons/firewall-policy.md
    - public/data/modules/network-hardening/quizzes/01.json
    - public/data/modules/network-hardening/exercises/01.json
    - public/data/modules/network-hardening/scenarios/01.json
  modified: []
decisions:
  - quizId in firewall-policy.md frontmatter only; scenarioId and exerciseId live in modules-config.js only
  - NERC CIP disclaimer appears verbatim in intro.md (CIP-004) and firewall-policy.md (CIP-007) per D-12
  - All lesson prose uses generic identifiers (PIPELINE-DC01, ExampleCorp, 10.0.0.0/24) with no hardcoded SD-02F version strings
metrics:
  duration_minutes: 15
  completed: "2026-05-16"
  tasks_completed: 2
  files_created: 6
---

# Phase 07 Plan 01: Network Hardening Module Content (MOD-02) Summary

**One-liner:** Full vertical slice for MOD-02 — three lessons covering firewall auditing with Get-NetFirewallRule/New-NetFirewallRule/Get-NetTCPConnection, a 3-question quiz on SC-7 boundary protection, a 4-step firewall audit exercise, and a 2-phase unauthorized-port scenario.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author three Network Hardening lesson Markdown files | e7da6ff | intro.md, ps-firewall.md, firewall-policy.md |
| 2 | Author Network Hardening quiz, exercise, and scenario JSON files | b83598a | quizzes/01.json, exercises/01.json, scenarios/01.json |

## What Was Built

Six content files under `public/data/modules/network-hardening/` that deliver a complete Network Hardening learning experience:

**Lesson 1 (intro.md — Pattern A, scenario host):** Introduces network hardening concepts — firewall rules, network segmentation, and port control. Includes a Get-NetFirewallRule audit command, a segmentation principles table, an OT callout explaining safety-critical segmentation for SCADA/historian/HMI networks, and a NERC CIP-004 disclaimer.

**Lesson 2 (ps-firewall.md — Pattern B, exercise host):** Four hands-on PowerShell sections: auditing active inbound rules (Get-NetFirewallRule), testing connectivity (Test-NetConnection), blocking unauthorized ports (New-NetFirewallRule), and mapping listening ports to processes (Get-NetTCPConnection + Get-Process). OT callout warns about pre-change verification in air-gapped environments.

**Lesson 3 (firewall-policy.md — Pattern C, quiz host):** Windows Firewall profile structure (Domain/Private/Public), checking existing rules, Group Policy management for OT environments, and a firewall controls table. OT callout addresses standalone systems without domain connectivity. NERC CIP-007 disclaimer present. `quizId: '01'` in frontmatter triggers quiz rendering.

**Quiz (quizzes/01.json):** Three questions — Get-NetFirewallRule cmdlet identification (NIST-SC-7), investigate-before-blocking decision (TSA-NetworkSeg), Get-NetTCPConnection port-to-process mapping (NIST-SC-7 + TSA-NetworkSeg). Four answers each, exactly one correct per question with "Correct." feedback prefix.

**Exercise (exercises/01.json):** Four steps matching D-04 commands — Get-NetFirewallRule audit (step-1), Test-NetConnection verify (step-2), New-NetFirewallRule block (step-3), Get-NetTCPConnection + Get-Process map (step-4). Each step has hintPatterns for near-miss errors and PS-table-formatted successOutput.

**Scenario (scenarios/01.json):** "Unauthorized Access Point on the IT/OT Boundary" — 2-phase decision tree. Phase 1 (Discovery, isFinal:false): investigate-first vs. block-immediately. Phase 2 (Containment, isFinal:true): isolate+block+notify-TSA vs. quietly-close-without-reporting. Both phase-1 options lead to phase-2; both phase-2 options have nextPhaseId:null.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- node schema validation: All schema assertions passed
- npm test: 167 passed (0 failures, 1 todo)
- grep `[!OT]`: 3 matches — one per lesson file
- grep NERC CIP disclaimer: 2 matches — intro.md (CIP-004), firewall-policy.md (CIP-007)
- grep `scenarioId|exerciseId` in lessons: 0 matches (correct — these IDs live in modules-config.js only)
- JSON validity: all three JSON files parse without errors

## Known Stubs

None. All six files contain complete content with no placeholder text, no hardcoded empty arrays, and no "TODO" or "coming soon" text.

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. All content files are read-only static assets served via GitHub Pages CDN. T-07-01 through T-07-04 from the plan's threat model are addressed: files are version-controlled (T-07-01), identifiers are generic with no PII or secrets (T-07-02), esc() is applied at render time by existing engines (T-07-03), and NERC CIP verbatim disclaimer is present in both required lessons (T-07-04).

## Self-Check: PASSED

All 6 files exist on disk. Both commits (e7da6ff, b83598a) confirmed in git log.
