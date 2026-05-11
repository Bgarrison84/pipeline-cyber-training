# Requirements — Pipeline Cyber Training

## v1 Requirements

### App Shell

- [ ] **SHELL-01**: User can navigate between all 5 modules and their lessons via a persistent sidebar or top navigation menu
- [ ] **SHELL-02**: Every module and lesson has a unique, linkable URL using hash-based routing (e.g. `#/module/logging-auditing/lesson/1`)
- [ ] **SHELL-03**: Visual progress bars show completion state at both lesson and module level
- [ ] **SHELL-04**: Compliance index page maps control IDs (TSA SD-02F, NIST SP 800-82 Rev 3) to every lesson and exercise that covers them

### Content & Lessons

- [ ] **CONT-01**: Lessons are authored in Markdown files and rendered in-browser without a build step
- [ ] **CONT-02**: PowerShell code blocks render with full Shiki syntax highlighting (PS 5.1 grammar)
- [ ] **CONT-03**: Every code block has a one-click copy-to-clipboard button
- [ ] **CONT-04**: Each lesson displays the TSA and/or NIST control IDs it covers, sourced from a shared compliance-refs data file

### Simulated PowerShell Terminal

- [ ] **TERM-01**: Terminal accepts expected commands per exercise and returns helpful error feedback for wrong commands
- [ ] **TERM-02**: Accepted commands produce realistic-looking PowerShell output (not placeholder or lorem text)
- [ ] **TERM-03**: Plausible near-miss commands (e.g. wrong parameter name) receive a contextual hint rather than generic failure
- [ ] **TERM-04**: Terminal UI displays a persistent label making clear it is a simulator — commands do not run on any real system

### Assessment & Progress

- [ ] **ASSESS-01**: Each lesson includes multiple-choice quiz questions with per-answer explanatory feedback (not just correct/incorrect)
- [ ] **ASSESS-02**: Scenario exercises walk learners through realistic compliance incidents with branching decision points and outcome explanations
- [ ] **ASSESS-03**: LocalStorage saves the learner's exact progress; returning learners resume at the lesson and step they left
- [ ] **ASSESS-04**: Learner can generate a printable completion summary labeled as a training log artifact (explicitly not a compliance certification)

### Modules (v1 Skeleton — all 5 present)

- [ ] **MOD-01**: Logging & Auditing — core lessons, at least one quiz, one terminal exercise, one scenario; maps to TSA and NIST logging controls
- [ ] **MOD-02**: Network Hardening — core lessons, at least one quiz, one terminal exercise, one scenario; covers firewall rules, network segmentation, port scanning via PS
- [ ] **MOD-03**: Account & Access Management — core lessons, at least one quiz, one terminal exercise, one scenario; covers AD, least privilege, service accounts, password policies
- [ ] **MOD-04**: Incident Response — core lessons, at least one quiz, one terminal exercise, one scenario; covers anomaly detection, system isolation, evidence collection via PS
- [ ] **MOD-05**: Patch Management — three sub-areas all represented: Windows/IT patching via PS (WSUS, PSWindowsUpdate), OT/ICS patching workflow (air-gapped, vendor coordination, risk-based deferral), and compliance reporting (generating patch status evidence for audits)

### Data Integrity & Compliance Accuracy

- [ ] **DATA-01**: TSA directive version strings (e.g. "SD-02F") are stored in a single `data/compliance-refs.json` file — never hardcoded in lesson content
- [ ] **DATA-02**: NERC CIP content is framed explicitly as a reference benchmark for pipeline operators, not a binding requirement (NERC CIP is an electric utility standard)
- [ ] **DATA-03**: OT/IT distinctions are explicitly called out in every dual-use lesson, particularly in Patch Management (OT patch SLAs differ fundamentally from IT)
- [ ] **DATA-04**: LocalStorage schema includes a `schemaVersion` key; app handles `QuotaExceededError` gracefully without silent data loss
- [ ] **DATA-05**: Learner can export their progress data as a JSON file for backup or self-hosted migration

---

## v2 Requirements (Deferred)

- Progress sync across devices (requires authentication)
- Full content for all 5 modules (v1 delivers skeleton; v2 fills in depth)
- Reference library / searchable knowledge base
- Offline support (service worker / PWA) — important for self-hosted internal forks in air-gapped environments
- Internal org fork guide and configuration documentation

---

## Out of Scope

- **Real PowerShell execution** — impossible on a static host; security risk regardless
- **User accounts / authentication** — localStorage only for v1; no login, no server
- **Video content** — text, code, and interactive exercises only
- **Mobile-first layout** — desktop-primary; IT/OT admins work at workstations
- **Gamification (points, badges, leaderboards)** — research confirms this backfires with compliance-focused professional audiences
- **Social sharing of completion** — operational security risk in pipeline OT context
- **NERC CIP as a mandatory framework for pipeline operators** — it does not apply; electric utility standard only

---

## Traceability

*Filled in by roadmap agent — 2026-05-10.*

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SHELL-01 | Phase 1 | Pending |
| SHELL-02 | Phase 1 | Pending |
| SHELL-03 | Phase 4 | Pending |
| SHELL-04 | Phase 6 | Pending |
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 2 | Pending |
| CONT-04 | Phase 2 | Pending |
| TERM-01 | Phase 5 | Pending |
| TERM-02 | Phase 5 | Pending |
| TERM-03 | Phase 5 | Pending |
| TERM-04 | Phase 5 | Pending |
| ASSESS-01 | Phase 4 | Pending |
| ASSESS-02 | Phase 6 | Pending |
| ASSESS-03 | Phase 3 | Pending |
| ASSESS-04 | Phase 6 | Pending |
| MOD-01 | Phase 2 | Pending |
| MOD-02 | Phase 7 | Pending |
| MOD-03 | Phase 7 | Pending |
| MOD-04 | Phase 7 | Pending |
| MOD-05 | Phase 8 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 7 | Pending |
| DATA-03 | Phase 7 | Pending |
| DATA-04 | Phase 3 | Pending |
| DATA-05 | Phase 3 | Pending |
