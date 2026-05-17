---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: MVP
status: complete
last_updated: "2026-05-17T00:00:00.000Z"
progress:
  total_phases: 8
  completed_phases: 8
  total_plans: 30
  completed_plans: 30
  percent: 100
---

# State — Pipeline Cyber Training

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** An IT/OT admin who completes a module can perform the covered compliance control in their real environment, not just pass a quiz about it.
**Current focus:** v1.0 milestone complete — planning next milestone (v2.0 or v1.1)

---

## v1.0 Milestone — COMPLETE

**Shipped:** 2026-05-17
**Requirements:** 26/26
**Plans:** 30/30
**Tests:** 167 passing

All 5 modules live on GitHub Pages. Archive: `.planning/milestones/v1.0-ROADMAP.md`

---

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| 1 | App Shell + Build Pipeline + Deploy | ✓ Complete (2026-05-11) |
| 2 | Content Loader + Lesson Rendering + Module 1 | ✓ Complete (2026-05-14) |
| 3 | Progress Store | ✓ Complete (2026-05-14) |
| 4 | Quiz Engine + Lesson Progress UI | ✓ Complete (2026-05-15) |
| 5 | Simulated PowerShell Terminal + Exercise View | ✓ Complete (2026-05-15) |
| 6 | Scenario Engine + Compliance Index + Completion Summary | ✓ Complete (2026-05-16) |
| 7 | Core Module Content (MOD-02, MOD-03, MOD-04) | ✓ Complete (2026-05-16) |
| 8 | Patch Management Module (MOD-05) | ✓ Complete (2026-05-17) |

---

## Critical Compliance Constraints (Carry Forward)

- **NERC CIP scope:** NERC CIP applies to electric utilities ONLY — never present as binding for pipeline operators; always add scope callout
- **TSA current version:** SD-02F (expires May 2, 2026) — stored in compliance-refs.json, never hardcoded; **update needed before May 2026**
- **OT/IT distinctions:** Every dual-use lesson requires explicit "In OT environments:" callout block
- **Terminal scope contract:** Pattern-matching exercise engine ONLY — not a PS interpreter; scope callout required in UI at all times

---

## Session Continuity

**Last updated:** 2026-05-17 — v1.0 milestone complete and archived
**Next action:** `/gsd-new-milestone` to plan v1.1 or v2.0

---

*State initialized: 2026-05-10*
*v1.0 archived: 2026-05-17*
