# Requirements — Pipeline Cyber Training v2.0

**Milestone:** v2.0 — Content Depth & Platform Maturity
**Status:** Active
**Created:** 2026-05-17

> Previous milestone requirements archived at `.planning/milestones/v1.0-REQUIREMENTS.md`

---

## v2.0 Requirements

### CONT — Content Depth *(Priority 1)*

- [ ] **CONT-05** — Each of the 5 modules gets ≥2 new lessons covering advanced controls and OT-specific edge cases
- [ ] **CONT-06** — Each module gets one additional advanced branching scenario with multi-path OT-specific decision outcomes
- [ ] **CONT-07** — Quiz question banks expanded: ≥3 new questions added per module

### FORK — Internal Org Fork Guide *(Priority 2)*

- [ ] **FORK-01** — Step-by-step fork deployment guide (Markdown doc) for IT admins deploying as internal org training tool
- [ ] **FORK-02** — Configuration file (`fork.config.json`) allowing orgs to customize: org name, logo path, active modules, compliance-refs overrides
- [ ] **FORK-03** — App reads `fork.config.json` at startup and applies org customization to sidebar, header, and compliance refs display

### SME — Compliance Currency *(Priority 3)*

- [ ] **SME-01** — TSA SD-02F successor directive researched; `compliance-refs.json` updated with current version strings (SD-02F expired May 2, 2026)
- [ ] **SME-02** — Structured SME review checklist document (Markdown, printable) covering each lesson's control mapping accuracy
- [ ] **SME-03** — Each module's lesson-to-control mapping verified and annotated with "last reviewed" metadata

### PWA — Offline Support *(Priority 4)*

- [ ] **PWA-01** — Service worker installed (Vite PWA plugin or equivalent); caches all static assets, lesson Markdown files, JSON data files
- [ ] **PWA-02** — Lessons, quizzes, exercises, and scenarios fully playable without network connection after first load
- [ ] **PWA-03** — UI indicator shows online vs. cached/offline mode (banner or status badge, always visible)

### SYNC — Progress Sync *(Priority 5)*

- [ ] **SYNC-01** — ADR: auth/sync approach decision documented from static-compatible options (GitHub Gist, QR/URL share, enhanced import/export, or Supabase free tier)
- [ ] **SYNC-02** — Cross-device progress sync implemented per chosen approach; import flow complements existing JSON export (DATA-05)

---

## Future Requirements (Deferred from v2.0 Scoping)

- Video content — text + interactive exercises sufficient for admin-level learners at this stage
- Mobile-first layout — desktop-primary; revisit after org adoption data
- Gamification — confirmed anti-pattern for compliance-professional audience

---

## Out of Scope (Confirmed)

- Real PowerShell execution — static GitHub Pages cannot run server-side code; security risk regardless
- Full auth system / user accounts — v2.0 may add lightweight sync; full login deferred pending ADR
- NERC CIP as mandatory framework — does not apply to pipeline operators; electric utility standard only (reference use only with required disclaimer)

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| CONT-05 | Phase 9 | Pending |
| CONT-06 | Phase 9 | Pending |
| CONT-07 | Phase 9 | Pending |
| FORK-01 | Phase 10 | Pending |
| FORK-02 | Phase 10 | Pending |
| FORK-03 | Phase 10 | Pending |
| SME-01 | Phase 9 | Pending |
| SME-02 | Phase 9 | Pending |
| SME-03 | Phase 9 | Pending |
| PWA-01 | Phase 11 | Pending |
| PWA-02 | Phase 11 | Pending |
| PWA-03 | Phase 11 | Pending |
| SYNC-01 | Phase 12 | Pending |
| SYNC-02 | Phase 12 | Pending |
