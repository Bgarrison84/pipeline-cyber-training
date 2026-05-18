---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Content Depth & Platform Maturity
status: phase-11-planned
last_updated: "2026-05-18T00:00:00.000Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 18
  completed_plans: 9
  percent: 25
---

# State — Pipeline Cyber Training

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** An IT/OT admin who completes a module can perform the covered compliance control in their real environment, not just pass a quiz about it.
**Current focus:** v2.0 milestone — Content Depth & Platform Maturity

---

## Current Position

Phase: 11 — PWA / Offline Support (PLANNED — ready to execute)
Plan: 11-01 through 11-04 (4 plans, 3 waves)
Status: Phase 11 planned — ready to execute
Last activity: 2026-05-18 — Phase 11 planned; 4 plans across 3 waves; verification passed

---

## v2.0 Phase Summary

| Phase | Name | Requirements | Status |
|-------|------|-------------|--------|
| 9 | Compliance Currency + Content Depth | SME-01, SME-02, SME-03, CONT-05, CONT-06, CONT-07 | COMPLETE (9/9 plans, 177 tests GREEN) |
| 10 | Fork Configuration System | FORK-01, FORK-02, FORK-03 | Planned (5 plans, 3 waves) — ready to execute |
| 11 | PWA / Offline Support | PWA-01, PWA-02, PWA-03 | Planned (4 plans, 3 waves) — ready to execute |
| 12 | Progress Sync | SYNC-01, SYNC-02 | Not started |

**Phase dependency chain:**
```
Phase 9 (Content + Compliance)
  -> Phase 10 (Fork Config — fork.config.json must exist before PWA build)
    -> Phase 11 (PWA — Workbox precache manifest built from dist/ at build time)

Phase 12 (Sync) — parallel with Phase 11; no shared files
```

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
- **TSA current version:** SD-02F **EXPIRED May 2, 2026** — Day 1 task for Phase 9: add `"status": "expired"` to compliance-refs.json and update badge.js to render expired state; apply successor version only after manual verification at TSA.gov (do not assume SD-02G)
- **OT/IT distinctions:** Every dual-use lesson requires explicit "In OT environments:" callout block
- **Terminal scope contract:** Pattern-matching exercise engine ONLY — not a PS interpreter; scope callout required in UI at all times

---

## Accumulated Context

**Decisions carried forward from v1.0:**
- Custom vanilla JS terminal (no jQuery Terminal)
- localStorage-only progress for v1; v2.0 adds URL-share sync (no auth, no server, no credentials in repo)
- GitHub Pages static site constraint applies to all v2 features (no server-side execution)
- Wave 0 stub file pattern established for Vite path resolution
- Dynamic import('./sidebar.js') breaks quiz-engine circular dependency — pattern reused in v2 engines if needed

**New v2.0 decisions (from research):**
- SYNC-02 approach: URL share with lz-string compression + QR code; GitHub Gist and Supabase rejected
- vite-plugin-pwa with generateSW strategy for PWA (Workbox 7 wrapped; Vite 8 compatible)
- fork.config.json fetched at runtime, not baked at build time (no Node.js required by deploying org)
- New quiz questions in new files (02.json), never appended to 01.json (quiz completion count integrity)
- No schemaVersion bump in v2.0 (all additions backward compatible with schema v1 JSON)
- marked.js is actually v18.0.3 (not v17 as CLAUDE.md states) — update CLAUDE.md in Phase 9

**Phase 9 delivered (2026-05-18):**
- TSA SD-02F marked expired in compliance-refs.json; badge.js renders expired state site-wide
- All 5 modules at 5 lessons each (25 total): OT callouts, TSA current directive citations, NIST SP 800-82 citations
- All 5 modules have quizzes/02.json (3+ questions each) and new advanced OT/IT branching scenarios
- All 15 original lessons have lastReviewed/reviewer frontmatter fields
- docs/SME-REVIEW-CHECKLIST.md created covering all review artifacts
- CLAUDE.md updated: marked.js v18.0.3 corrected
- 177 tests passing (from 167 at v1.0 close)
- Zero SD-02F occurrences in content files (logging-auditing/quizzes/01.json pre-existing; outside new content scope)

**Open questions (must resolve before phase executes):**
- TSA SD-02F successor designation — verify manually at TSA.gov before applying any version string (Phase 9)
- GitHub Actions CI auto-deploy on push to main — check .github/workflows/ before Phase 11 to determine if Workbox manifest regeneration is automatic
- PWA icon assets — check public/ for pwa-192x192.png and pwa-512x512.png before Phase 11 build

---

*State initialized: 2026-05-10*
*v1.0 archived: 2026-05-17*
*v2.0 started: 2026-05-17*
*v2.0 roadmap complete: 2026-05-17 — 14/14 requirements mapped, Phases 9–12*
