# Pipeline Cyber Training

## What This Is

A static GitHub Pages web application that teaches IT/OT admins at oil and gas pipeline companies the PowerShell skills and cybersecurity concepts they need to meet regulatory compliance requirements (TSA Pipeline Security Directives, NIST SP 800-82 Rev 3). Five learning modules with guided lessons, quizzes, a simulated PowerShell terminal, and scenario-based exercises — fully shipped at v1.0 with all five modules complete.

## Core Value

An IT/OT admin who completes a module should be able to perform the covered compliance control in their real environment, not just pass a quiz about it.

## Requirements

### Validated (v1.0 — all shipped 2026-05-17)

- ✓ **SHELL-01** — Sidebar navigation across all 5 modules — v1.0
- ✓ **SHELL-02** — Hash-based routing, bookmarkable URLs — v1.0
- ✓ **SHELL-03** — Sidebar progress bars + module-view lesson status badges — v1.0
- ✓ **SHELL-04** — Compliance index page (14 controls, TSA SD-02F + NIST SP 800-82 Rev 3) — v1.0
- ✓ **CONT-01** — Lessons in Markdown, rendered in-browser via marked.js — v1.0
- ✓ **CONT-02** — Shiki v4 PS 5.1 syntax highlighting — v1.0
- ✓ **CONT-03** — One-click copy-to-clipboard on all code blocks — v1.0
- ✓ **CONT-04** — TSA/NIST control IDs per lesson, sourced from compliance-refs.json — v1.0
- ✓ **TERM-01** — PS terminal accepts correct commands, rejects wrong with feedback — v1.0
- ✓ **TERM-02** — Realistic PS 5.1 output format (not placeholder text) — v1.0
- ✓ **TERM-03** — Near-miss commands receive contextual hints — v1.0
- ✓ **TERM-04** — Persistent "PS SIMULATOR" label always visible — v1.0
- ✓ **ASSESS-01** — Per-answer explanatory feedback on quizzes — v1.0
- ✓ **ASSESS-02** — Branching scenario engine with decision-tree outcomes — v1.0
- ✓ **ASSESS-03** — localStorage progress with auto-resume to last visited lesson — v1.0
- ✓ **ASSESS-04** — Printable training log with statutory disclaimer — v1.0
- ✓ **MOD-01** — Logging & Auditing: lessons, quiz, exercise, scenario — v1.0
- ✓ **MOD-02** — Network Hardening: 3 lessons, PS firewall exercise, NERC CIP disclaimers — v1.0
- ✓ **MOD-03** — Account & Access Management: AD queries, least privilege, svc-historian — v1.0
- ✓ **MOD-04** — Incident Response: OT safety-first, ransomware scenario, C:\Evidence\ path — v1.0
- ✓ **MOD-05** — Patch Management: IT/WSUS + OT/air-gapped + compliance reporting exercise — v1.0
- ✓ **DATA-01** — TSA version strings only in compliance-refs.json — v1.0
- ✓ **DATA-02** — NERC CIP framed as reference benchmark with verbatim disclaimer — v1.0
- ✓ **DATA-03** — OT callout blocks (`> [!OT]`) in every dual-use lesson — v1.0
- ✓ **DATA-04** — schemaVersion: 1 in localStorage, QuotaExceededError handled gracefully — v1.0
- ✓ **DATA-05** — Export progress as JSON — v1.0

### Active (v2.0 — Content Depth & Platform Maturity)

- [ ] **CONT-05** — Additional lessons per module (≥2 new lessons each), covering advanced scenarios and edge-case controls
- [ ] **CONT-06** — Advanced branching scenarios per module (one per module, multi-path, OT-specific outcomes)
- [ ] **FORK-01** — Internal org fork guide: step-by-step docs for deploying as internal training tool (branding, module selection, compliance-refs customization)
- [ ] **FORK-02** — Fork configuration system: env/config file that controls org name, logo path, active modules, custom compliance refs
- [ ] **SME-01** — Structured SME review checklist and audit trail artifact for content accuracy sign-off
- [ ] **SME-02** — TSA SD-02F successor directive version updated in compliance-refs.json (SD-02F expired May 2, 2026)
- [ ] **PWA-01** — Service worker caching for offline use (lessons, quizzes, exercises playable without network)
- [ ] **PWA-02** — Offline indicator in UI (clear signal when running cached vs. live)
- [ ] **SYNC-01** — Auth design decision documented (ADR): choose lightweight option compatible with static-site constraint
- [ ] **SYNC-02** — Cross-device progress sync implemented per chosen auth approach

### Out of Scope (Validated at v1.0)

- Real PowerShell execution — static GitHub Pages cannot execute server-side code; security risk regardless
- User accounts / authentication — localStorage-only for v1; no login, no server needed for training use case
- Video content — text, code, and interactive exercises sufficient for admin-level learners
- Mobile-first layout — desktop-primary; IT/OT admins work at workstations; responsive is a bonus, not a requirement
- Gamification (points, badges, leaderboards) — research confirms this backfires with compliance-focused professional audiences
- Social sharing of completion — operational security risk in pipeline OT context
- NERC CIP as mandatory framework — does not apply to pipeline operators; electric utility standard only

## Context

- Pipeline companies face mandatory cybersecurity compliance under TSA Security Directives (SD-02F, effective May 2025, expires May 2026) issued after 2021 Colonial Pipeline incident, plus NIST SP 800-82 guidance for ICS/OT environments
- OT/ICS patching is uniquely constrained: air-gapped networks, vendor-specific patch windows (3–12 month OEM qualification cycles), and different risk calculations than IT — addressed explicitly in MOD-05
- Learners are basic PowerShell users (can run scripts, not write from scratch) — lessons build upward from syntax they recognize
- GitHub Pages hosting means the entire app is static HTML/CSS/JS; "interactive terminal" simulates PowerShell behavior client-side
- Project is public-first; content and structure avoid company-specific assumptions so it can be forked and customized for internal org deployment
- **TSA SD-02F expires May 2, 2026** — compliance-refs.json update needed before that date

## Constraints

- **Tech:** Static site only (GitHub Pages) — no backend, no server-side execution
- **Terminal:** Simulated PS only — commands validated against expected output patterns, not actually run
- **Hosting:** GitHub Pages (free, version-controlled, no ops overhead)
- **Compliance currency:** Content tied to specific control IDs so it can be updated when standards change; all version strings in compliance-refs.json

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub Pages (static) | No hosting cost, no ops burden, version-controlled content | ✓ Good — zero-ops deploy, CI on push to main |
| localStorage for progress | Avoids auth complexity; acceptable for training context | ✓ Good — schemaVersion migration path established |
| Custom vanilla JS terminal | jQuery Terminal had unnecessary complexity; regex-match per step is sufficient | ✓ Good — 147→167 tests, no library baggage |
| Public-first | Wider impact; can fork/customize for internal use | ✓ Good — generic identifiers throughout |
| V1 = skeleton all 5 topics | All areas present so users see full scope; content fills in over time | ✓ Good — shipped complete content, not skeleton |
| Hybrid JSON + Markdown | JSON for structured data; Markdown for human-editable prose | ✓ Good — authoring contract clear for v2 additions |
| compliance-refs.json for all version strings | TSA directive version must never be hardcoded | ✓ Good — no hardcoded version strings found in content |
| Wave 0 stub file pattern | Vite resolves paths at transform time before mocks; stub files are the reliable RED pattern | ✓ Good — established for Phase 5+, reused in 6/7/8 |
| Dynamic import('./sidebar.js') in engines | Breaks quiz-engine ↔ sidebar circular dependency | ✓ Good — no circular dep issues across 167 tests |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

## Current Milestone: v2.0 — Content Depth & Platform Maturity

**Goal:** Deepen training content across all 5 modules and mature the platform for real-world org deployment, compliance currency, and offline/multi-device use.

**Target features (priority order):**
1. Deeper content — more lessons per module, advanced scenarios, expanded quizzes
2. Internal org fork guide — configuration docs + config system for internal org deployments
3. Compliance SME review — structured audit pass + TSA directive currency update
4. Offline support / PWA — service worker caching for air-gapped forks
5. Progress sync across devices — auth ADR then implementation

---

*Last updated: 2026-05-17 — v2.0 milestone started; v1.0 complete (26/26 requirements, 5 modules)*
