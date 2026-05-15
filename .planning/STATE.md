---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
last_updated: "2026-05-15T19:37:57.811Z"
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 18
  completed_plans: 15
  percent: 83
---

# State — Pipeline Cyber Training

## Project Reference

**Core value:** An IT/OT admin who completes a module can perform the covered compliance control in their real environment, not just pass a quiz about it.
**Mode:** mvp
**Milestone:** 1 (all phases)

---

## Current Position

**Phase:** 5 — Simulated PowerShell Terminal + Exercise View
**Plan:** 05-01 complete (1 of 4 plans — Wave 0 RED scaffolds + data prerequisites done)
**Status:** Executing
**Blocker:** None

```
Progress: [✓1][✓2][✓3][✓4][5→][ 6 ][ 7 ][ 8 ]
                               ^
                             Here
```

---

## Phase Summary

| Phase | Name | Status |
|-------|------|--------|
| 1 | App Shell + Build Pipeline + Deploy | ✓ Complete |
| 2 | Content Loader + Lesson Rendering + Module 1 | ✓ Complete |
| 3 | Progress Store | ✓ Complete |
| 4 | Quiz Engine + Lesson Progress UI | ✓ Complete (3 plans — checkpoint:human-verify approved) |
| 5 | Simulated PowerShell Terminal + Exercise View | In progress (Plan 01 of 4 done) |
| 6 | Scenario Engine + Compliance Index + Completion Summary | Not started |
| 7 | Core Module Content (MOD-02, MOD-03, MOD-04) | Not started |
| 8 | Patch Management Module (MOD-05) | Not started |

---

## Performance Metrics

**Phases complete:** 4/8
**Plans complete:** 15/18 (05-01 complete)
**Requirements shipped:** 13/26 (SHELL-01, SHELL-02, SHELL-03, DATA-01, CONT-01, CONT-02, CONT-03, CONT-04, MOD-01, ASSESS-03, DATA-04, DATA-05, ASSESS-01)
**Phase 5 progress:** TERM-01, TERM-02, TERM-03, TERM-04 — RED tests written; implementation in plans 02-04

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
| Vite mock pattern for non-existent modules in tests | Use pre-captured vi.fn() references before vi.mock() factories — avoids vite:import-analysis static resolution failure on non-existent files |
| Wave 0 stub file pattern (Phase 5) | Create stub files that throw Error('not implemented') instead of vi.mock() overrides — Vite resolves paths at transform time before mocks; stub files are the only reliable RED pattern |
| Dynamic import('./sidebar.js') in quiz-engine.js | Breaks the quiz-engine ↔ sidebar circular dependency at module evaluation time |
| vi.hoisted() required for Vitest mock variable captures | When the module under test has static imports of the mocked module, vi.hoisted() lifts the variable into the hoisting zone alongside the mock factory |

### Critical Compliance Constraints

- **NERC CIP scope:** NERC CIP applies to electric utilities ONLY — never present as binding for pipeline operators; always add scope callout
- **TSA current version:** SD-02F (effective May 3 2025, expires May 2 2026) — stored in compliance-refs.json, never hardcoded
- **OT/IT distinctions:** Every dual-use lesson requires explicit "In OT environments:" callout block
- **Terminal scope contract:** Pattern-matching exercise engine ONLY — not a PS interpreter; scope callout required in UI at all times

### Open Decisions

| Decision | Must resolve by |
|----------|----------------|
| jQuery Terminal vs custom vanilla JS (prototype one exercise) | ✓ Resolved: Custom vanilla JS (D-01 in 05-CONTEXT.md) |
| PS command parser approach (regex vs tokenized) — spike on 5-10 real commands | ✓ Resolved: Regex match per step (D-09 in 05-CONTEXT.md) |
| Compliance SME assignment for content review | Before Phase 7 begins |

### Todos

- [ ] Prototype jQuery Terminal against one PS exercise before Phase 5 plan is written
- [ ] Identify compliance SME (TSA/ICS background) before Phase 7
- [ ] Set calendar reminder for TSA SD-02F expiry: May 2, 2026

### Blockers

None currently.

---

## Session Continuity

**Last updated:** 2026-05-15 — Phase 5 Plan 01 complete (Wave 0 RED scaffolds, 01.json upgrade, modules-config exerciseId)
**Next action:** Execute 05-02-PLAN.md (Wave 1 — terminal-engine.js implementation)

---

*State initialized: 2026-05-10*
