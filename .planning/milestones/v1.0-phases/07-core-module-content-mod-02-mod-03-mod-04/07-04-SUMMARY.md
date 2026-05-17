---
phase: 07-core-module-content-mod-02-mod-03-mod-04
plan: "04"
subsystem: config
tags: [integration, modules-config, compliance-index, MOD-02, MOD-03, MOD-04, DATA-02, DATA-03]
dependency_graph:
  requires: ["07-01", "07-02", "07-03"]
  provides:
    - src/modules-config.js (MOD-02/03/04 lesson arrays wired with correct IDs)
    - public/data/compliance-index.json (9 new compliance control entries)
  affects:
    - router.js (lesson routes now resolve for all three new modules)
    - module-view.js (scenario/exercise/quiz links now render for all three modules)
    - compliance-index-view.js (9 new controls now appear on compliance index page)
tech_stack:
  added: []
  patterns:
    - modules-config.js lesson object pattern (id + title + one of scenarioId/exerciseId/quizId)
    - compliance-index.json items[] pattern (type + moduleId + contentId + title)
    - MOD-01 backfill pattern for NIST-AU-12 (cross-module item aggregation)
key_files:
  created: []
  modified:
    - src/modules-config.js
    - public/data/compliance-index.json
decisions:
  - quizId included in modules-config.js lesson objects (quiz-engine.js reads both frontmatter and config) — confirmed intentional per plan acceptance criteria
  - NIST-AU-12 aggregates ps-ir from incident-response plus ps-logging lesson and exercise from logging-auditing as MOD-01 backfill — cross-module item pattern established
  - TSA-* controls get all 5 items (3 lessons + exercise + scenario); NIST-specific controls get only lessons that directly cover the control
metrics:
  duration_minutes: 10
  completed: "2026-05-16"
  tasks_completed: 2
  files_modified: 2
---

# Phase 07 Plan 04: Integration — modules-config.js and compliance-index.json Summary

**One-liner:** Integration wave wiring all 18 content files from MOD-02/03/04 into the application — replacing 6 placeholder lesson IDs in modules-config.js with correct 3-lesson arrays and adding 9 compliance control entries to compliance-index.json that link new module content to TSA and NIST controls.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update modules-config.js with 3-lesson arrays for MOD-02, MOD-03, MOD-04 | 4993c17 | src/modules-config.js |
| 2 | Add 9 new compliance control entries to compliance-index.json | c97ad24 | public/data/compliance-index.json |

## What Was Built

**Task 1 — modules-config.js:**

Replaced placeholder lesson arrays for all three new modules with the correct 3-lesson structures from D-02/D-03:

- `network-hardening`: `intro` (scenarioId:'01'), `ps-firewall` (exerciseId:'01'), `firewall-policy` (quizId:'01')
- `account-access`: `intro` (scenarioId:'01'), `ps-ad` (exerciseId:'01'), `access-policy` (quizId:'01')
- `incident-response`: `intro` (scenarioId:'01'), `ps-ir` (exerciseId:'01'), `ir-procedures` (quizId:'01')

Old placeholder IDs removed: `firewall-basics`, `network-segmentation`, `least-privilege`, `service-accounts`, `anomaly-detection`, `evidence-collection`. The `logging-auditing` and `patch-management` lesson arrays are unchanged.

**Task 2 — compliance-index.json:**

Added 9 new control entries after the existing NIST-AU-2 entry, bringing total controls to 11:

| Control | Items | Scope |
|---------|-------|-------|
| TSA-NetworkSeg | 5 | All network-hardening lessons + exercise + scenario |
| NIST-SC-7 | 2 | intro + firewall-policy from network-hardening |
| NIST-SI-3 | 1 | ps-firewall from network-hardening |
| TSA-AccessControl | 5 | All account-access lessons + exercise + scenario |
| NIST-AC-2 | 2 | intro + ps-ad from account-access |
| NIST-AC-6 | 1 | access-policy from account-access |
| TSA-IR | 5 | All incident-response lessons + exercise + scenario |
| NIST-IR-4 | 2 | intro + ir-procedures from incident-response |
| NIST-AU-12 | 3 | ps-ir (incident-response) + ps-logging lesson + exercise (logging-auditing MOD-01 backfill) |

NIST-AU-12 implements the MOD-01 backfill pattern — ps-logging.md already had `NIST-AU-12` in its `complianceControls` frontmatter but was not yet indexed; this plan adds the cross-module aggregation.

## Verification Results

- `node --input-type=module` modules-config.js assertions: PASSED — all 5 module lesson arrays verified, no old placeholders found
- `node -e` compliance-index.json assertions: PASSED — 11 controls, TSA-NetworkSeg/TSA-AccessControl/TSA-IR each have 5 items, NIST-AU-12 has 3 items
- `node -e "require('./public/data/compliance-index.json'); console.log('JSON valid')"`: PASSED
- Old placeholder check (`firewall-basics`, `anomaly-detection` etc.): PASSED — not found in modules-config.js
- `npm test`: 167/167 tests green (1 todo) — both before and after changes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both files contain complete, functional data. No placeholder text, no empty items arrays, no TODO markers.

## Threat Flags

None. Changes are purely to static configuration/data files served read-only via GitHub Pages CDN. T-07-13 (modules-config.js lesson IDs version-controlled), T-07-14 (compliance-index.json moduleId/contentId use existing safePath() validation), T-07-15 (control labels are intentionally public training content), T-07-16 (labels use "TSA SD-02F" as human-readable text per D-10, not as a dynamic version reference — lesson prose uses compliance-refs.json approach) — all accepted per plan's threat register.

## Self-Check: PASSED

Files verified:
- src/modules-config.js: FOUND (modified)
- public/data/compliance-index.json: FOUND (modified)

Commits verified:
- 4993c17: feat(07-04): wire MOD-02/03/04 lesson arrays in modules-config.js — FOUND
- c97ad24: feat(07-04): add 9 new compliance control entries to compliance-index.json — FOUND
