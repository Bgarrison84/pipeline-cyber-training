---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Content Depth & Platform Maturity
status: planning
last_updated: "2026-05-17T00:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State — Pipeline Cyber Training

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** An IT/OT admin who completes a module can perform the covered compliance control in their real environment, not just pass a quiz about it.
**Current focus:** v2.0 milestone — Content Depth & Platform Maturity

---

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-05-17 — Milestone v2.0 started

---

## v1.0 Milestone — COMPLETE

**Shipped:** 2026-05-17
**Requirements:** 26/26
**Plans:** 30/30
**Tests:** 167 passing

All 5 modules live on GitHub Pages. Archive: `.planning/milestones/v1.0-ROADMAP.md`

---

## Critical Compliance Constraints (Carry Forward)

- **NERC CIP scope:** NERC CIP applies to electric utilities ONLY — never present as binding for pipeline operators; always add scope callout
- **TSA current version:** SD-02F **EXPIRED May 2, 2026** — update compliance-refs.json to successor directive as early as Phase 1 of v2.0
- **OT/IT distinctions:** Every dual-use lesson requires explicit "In OT environments:" callout block
- **Terminal scope contract:** Pattern-matching exercise engine ONLY — not a PS interpreter; scope callout required in UI at all times

---

## Accumulated Context

**Decisions carried forward:**
- Custom vanilla JS terminal (no jQuery Terminal)
- localStorage-only progress for v1; v2.0 adds sync with auth decision
- GitHub Pages static site constraint applies to all v2 features (no server-side execution)
- Wave 0 stub file pattern established for Vite path resolution

---

*State initialized: 2026-05-10*
*v1.0 archived: 2026-05-17*
*v2.0 started: 2026-05-17*
