# Pipeline Cyber Training

## What This Is

A static GitHub Pages web application that teaches IT/OT admins at oil and gas pipeline companies the PowerShell skills and cybersecurity concepts they need to meet regulatory compliance requirements. Learners work through five topic modules using guided lessons, quizzes, a simulated PowerShell terminal, scenario-based exercises, and a searchable reference library — all without leaving the browser.

## Core Value

An IT/OT admin who completes a module should be able to perform the covered compliance control in their real environment, not just pass a quiz about it.

## Requirements

### Validated

- [x] **ASSESS-01** (Phase 4): Multiple-choice quizzes with per-answer explanatory feedback, score persistence, revisit mode — validated in production (GitHub Pages)
- [x] **SHELL-03** (Phase 4): Sidebar 4px progress bars with live update after quiz submission; module-view progress bar + lesson status badges (quiz-passed / visited / unvisited) — validated in production
- [x] **MOD-02** (Phase 7): Network Hardening module complete — 3 lessons (OT callouts, CIP-004/CIP-007 NERC disclaimers), PS firewall quiz/exercise/scenario — validated in browser 2026-05-16
- [x] **MOD-03** (Phase 7): Account & Access Management module complete — 3 lessons (AD queries, least privilege, svc-historian lore), CIP-004/CIP-006 NERC disclaimers, quiz/exercise/scenario — validated 2026-05-16
- [x] **MOD-04** (Phase 7): Incident Response module complete — 3 lessons (OT safety-first IR, C:\Evidence\ path, CIP-008 ×2), quiz/exercise/scenario with ransomware decision tree — validated 2026-05-16
- [x] **DATA-02** (Phase 7): NERC CIP framed as reference benchmark with verbatim disclaimer in all 6 new NERC-referencing lessons — validated 2026-05-16
- [x] **DATA-03** (Phase 7): OT callout blocks present in all 9 new lessons (one per lesson); explicit OT context throughout — validated 2026-05-16

### Active

- [ ] Five learning modules: Logging & Auditing, Network Hardening, Account & Access Management, Incident Response, Patch Management
- [ ] Each module contains: guided lessons, knowledge-check quizzes, simulated PS terminal exercises, scenario-based exercises, and reference examples
- [ ] Simulated PowerShell terminal that validates commands and gives feedback (no real execution)
- [ ] Compliance tagging: lessons and exercises map to specific TSA, NERC CIP, and NIST controls
- [ ] Progress tracking saved to localStorage (no login required)
- [ ] Patch management module covers Windows/IT patching, OT/ICS patching in restricted environments, and compliance reporting
- [ ] Content is accurate to 2024+ compliance requirements (TSA SD-02C series, NERC CIP-005/007/010, NIST CSF/SP 800-82)
- [ ] Public site, designed to generalize to an internal company deployment later

### Out of Scope

- Real PowerShell execution — security risk and GitHub Pages cannot run server-side code
- User authentication / accounts — progress stays local in the browser
- Video content — text, code, and interactive exercises only for v1
- Mobile-first — desktop-primary (IT/OT admins work at workstations); responsive is a bonus, not a requirement

## Context

- Pipeline companies face mandatory cybersecurity compliance under TSA Security Directives (SD-02C and successors) issued after 2021 Colonial Pipeline incident, plus longstanding NERC CIP standards for critical infrastructure and NIST SP 800-82 guidance for ICS/OT environments
- OT/ICS patching is uniquely constrained: air-gapped networks, vendor-specific patch windows, longer patch cycles, and different risk calculations than IT — the patch management module must address this distinction explicitly
- Learners are basic PowerShell users (can run scripts, not write them from scratch) — lessons should build upward from syntax they recognize, not assume zero knowledge
- GitHub Pages hosting means the entire app is static HTML/CSS/JS; any "interactive terminal" must simulate PowerShell behavior client-side
- Project starts public; content and structure should avoid company-specific assumptions so it can be forked and customized for an internal org deployment

## Constraints

- **Tech**: Static site only (GitHub Pages) — no backend, no server-side execution
- **Terminal**: Simulated PS only — commands validated against expected output patterns, not actually run
- **Hosting**: GitHub Pages (free, version-controlled, no ops overhead)
- **Compliance currency**: Content must be tied to specific control IDs so it can be updated when standards change

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub Pages (static) | No hosting cost, no ops burden, version-controlled content | — Pending |
| localStorage for progress | Avoids auth complexity; acceptable for training context | — Pending |
| Simulated PS terminal | Real execution impossible on static host; simulation still teaches syntax and command patterns | — Pending |
| Public-first | Wider impact; can fork/customize for internal use | — Pending |
| V1 = skeleton all 5 topics | All areas present so users see full scope; content fills in over time | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

## Current State

Phase 7 complete (2026-05-16). All 5 modules now have full content: Logging & Auditing (Phase 2), Network Hardening, Account & Access Management, and Incident Response (Phase 7). Patch Management (Phase 8) is next — the final module. 25/26 requirements shipped; only MOD-05 remains. Compliance index has 11 controls. Sidebar bug fixed (all 5 modules now visible).

---
*Last updated: 2026-05-16 after Phase 7 completion*
