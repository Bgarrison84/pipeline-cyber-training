# Pipeline Cyber Training

## What This Is

A static GitHub Pages web application that teaches IT/OT admins at oil and gas pipeline companies the PowerShell skills and cybersecurity concepts they need to meet regulatory compliance requirements. Learners work through five topic modules using guided lessons, quizzes, a simulated PowerShell terminal, scenario-based exercises, and a searchable reference library — all without leaving the browser.

## Core Value

An IT/OT admin who completes a module should be able to perform the covered compliance control in their real environment, not just pass a quiz about it.

## Requirements

### Validated

- [x] **ASSESS-01** (Phase 4): Multiple-choice quizzes with per-answer explanatory feedback, score persistence, revisit mode — validated in production (GitHub Pages)
- [x] **SHELL-03** (Phase 4): Sidebar 4px progress bars with live update after quiz submission; module-view progress bar + lesson status badges (quiz-passed / visited / unvisited) — validated in production

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

Phase 4 complete (2026-05-15). Quiz engine and progress UI live on GitHub Pages. Next: Phase 5 — Simulated PowerShell Terminal + Exercise View.

---
*Last updated: 2026-05-15 after Phase 4 completion*
