# State — Pipeline Cyber Training

## Project Reference

**Core value:** An IT/OT admin who completes a module can perform the covered compliance control in their real environment, not just pass a quiz about it.
**Mode:** mvp
**Milestone:** 1 (all phases)

---

## Current Position

**Phase:** 3 — Progress Store
**Plan:** TBD
**Status:** Ready to plan
**Blocker:** None

```
Progress: [✓1][✓2][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
                     ^
                   Here
```

---

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| 1 | App Shell + Build Pipeline + Deploy | ✓ Complete |
| 2 | Content Loader + Lesson Rendering + Module 1 | ✓ Complete |
| 3 | Progress Store | Not started |
| 4 | Quiz Engine + Lesson Progress UI | Not started |
| 5 | Simulated PowerShell Terminal + Exercise View | Not started |
| 6 | Scenario Engine + Compliance Index + Completion Summary | Not started |
| 7 | Core Module Content (MOD-02, MOD-03, MOD-04) | Not started |
| 8 | Patch Management Module (MOD-05) | Not started |

---

## Performance Metrics

**Phases complete:** 2/8
**Plans complete:** 8/8
**Requirements shipped:** 8/26 (SHELL-01, SHELL-02, DATA-01, CONT-01, CONT-02, CONT-03, CONT-04, MOD-01)

---

## Accumulated Context

### Key Decisions (locked)

| Decision | Rationale |
|----------|-----------|
| Vanilla JS + Vite + Tailwind CSS v4 | No framework needed for bounded content site; Tailwind v4 requires build step |
| Hash-based routing (#/module/:id) | Eliminates GitHub Pages SPA 404 problem; no server config needed |
| jQuery Terminal (default) vs custom vanilla JS fallback | jQuery Terminal is built for whitelist-only fake terminals; xterm.js is wrong tool |
| localStorage for progress | Only viable option for no-auth static site; wrap in single progressStore.js |
| Hybrid JSON + Markdown content | JSON for metadata/quiz/exercises; Markdown for lesson bodies (human-editable in GitHub browser) |
| data/compliance-refs.json for all version strings | TSA directive version strings must never be hardcoded; one-line edit on revision |
| schemaVersion: 1 in localStorage from day one | Migration runner depends on this key always being present |

### Critical Compliance Constraints

- **NERC CIP scope:** NERC CIP applies to electric utilities ONLY — never present as binding for pipeline operators; always add scope callout
- **TSA current version:** SD-02F (effective May 3 2025, expires May 2 2026) — stored in compliance-refs.json, never hardcoded
- **OT/IT distinctions:** Every dual-use lesson requires explicit "In OT environments:" callout block
- **Terminal scope contract:** Pattern-matching exercise engine ONLY — not a PS interpreter; scope callout required in UI at all times

### Open Decisions

| Decision | Must resolve by |
|----------|----------------|
| jQuery Terminal vs custom vanilla JS (prototype one exercise) | Phase 5 kickoff |
| PS command parser approach (regex vs tokenized) — spike on 5-10 real commands | Phase 5 kickoff |
| Compliance SME assignment for content review | Before Phase 7 begins |

### Todos

- [ ] Prototype jQuery Terminal against one PS exercise before Phase 5 plan is written
- [ ] Identify compliance SME (TSA/ICS background) before Phase 7
- [ ] Set calendar reminder for TSA SD-02F expiry: May 2, 2026

### Blockers

None currently.

---

## Session Continuity

**Last updated:** 2026-05-14 — Phase 2 complete (4/4 plans, content loader + Module 1 authored)
**Next action:** Run `/gsd-discuss-phase 3` to discuss Phase 3 (Progress Store)

---

*State initialized: 2026-05-10*
