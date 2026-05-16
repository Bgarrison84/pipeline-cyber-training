---
phase: 7
slug: core-module-content-mod-02-mod-03-mod-04
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.6 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

**Baseline:** 167 tests, 16 files, all GREEN (verified 2026-05-16)

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` — all 167 tests must stay GREEN
- **Before `/gsd-verify-work`:** Full suite must be green + manual browser verification of all 3 modules
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| MOD-02 lessons | 07-01 | 1 | MOD-02 | No raw HTML in JSON fields (esc() applied at render) | npm + manual | `npm test` | ⬜ pending |
| MOD-02 quiz | 07-01 | 1 | MOD-02 | 3 questions, 4 answers each, 1 correct | npm + manual | `npm test` | ⬜ pending |
| MOD-02 exercise | 07-01 | 1 | MOD-02 | 4 steps, regex patterns valid JSON | npm + manual | `npm test` | ⬜ pending |
| MOD-02 scenario | 07-01 | 1 | MOD-02 | Phase-1 nextPhaseId="phase-2", Phase-2 isFinal:true | npm + manual | `npm test` | ⬜ pending |
| MOD-03 lessons | 07-02 | 2 | MOD-03 | OT callout present in each dual-use lesson | npm + manual | `npm test` | ⬜ pending |
| MOD-03 quiz | 07-02 | 2 | MOD-03 | 3 questions, 4 answers each, 1 correct | npm + manual | `npm test` | ⬜ pending |
| MOD-03 exercise | 07-02 | 2 | MOD-03 | 4 steps, PS 5.1 cmdlets only | npm + manual | `npm test` | ⬜ pending |
| MOD-03 scenario | 07-02 | 2 | MOD-03 | Phase-1 nextPhaseId="phase-2", Phase-2 isFinal:true | npm + manual | `npm test` | ⬜ pending |
| MOD-04 lessons | 07-03 | 3 | MOD-04 | NERC CIP disclaimer verbatim where CIP referenced | npm + manual | `npm test` | ⬜ pending |
| MOD-04 quiz | 07-03 | 3 | MOD-04 | 3 questions, 4 answers each, 1 correct | npm + manual | `npm test` | ⬜ pending |
| MOD-04 exercise | 07-03 | 3 | MOD-04 | 4 steps, PS 5.1 cmdlets only | npm + manual | `npm test` | ⬜ pending |
| MOD-04 scenario | 07-03 | 3 | MOD-04 | Phase-1 nextPhaseId="phase-2", Phase-2 isFinal:true | npm + manual | `npm test` | ⬜ pending |
| modules-config.js | 07-04 | 4 | MOD-02/03/04 | scenarioId/exerciseId on correct lessons; quizId only on Lesson 3 | npm + manual | `npm test` | ⬜ pending |
| compliance-index.json | 07-04 | 4 | MOD-02/03/04 | 9 new control entries, items[] includes lessons+exercise+scenario | npm + manual | `npm test` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files are strictly required:

- Phase 7 is content-only authoring. All engines (quiz-engine, terminal-engine, scenario-view) are already tested by existing 167-test suite.
- JSON parse errors in content files surface at runtime (fetch + JSON.parse); the engines handle parse errors gracefully.
- `compliance-index-view.test.js` uses inline fixture — new entries in the real JSON file do not affect or break existing tests.

**Optional (recommended but not blocking):**
- `tests/content-schemas.test.js` — validate JSON schema shape for all 9 quiz/exercise/scenario files using `readFileSync` pattern from `compliance-refs.test.js`. If included, add as Wave 0.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MOD-02 module renders all 3 lessons in browser | MOD-02 | No automated browser test for lesson rendering | Navigate to `#/module/network-hardening`, verify sidebar shows 3 lessons; open each lesson |
| MOD-02 exercise works end-to-end (4 steps) | MOD-02 | Terminal interaction requires browser | Navigate to MOD-02 Lesson 2 > start exercise; type each command from D-04; verify step advancement |
| MOD-02 scenario branches correctly | MOD-02 | Scenario branching requires browser interaction | Navigate to MOD-02 Lesson 1 > start scenario; try both decisions in each phase |
| MOD-03 module renders all 3 lessons | MOD-03 | Same as MOD-02 | Navigate to `#/module/account-access` |
| MOD-03 exercise works end-to-end (4 steps) | MOD-03 | Same as MOD-02 | Navigate to MOD-03 Lesson 2 > exercise; verify D-05 commands accepted |
| MOD-03 scenario branches correctly | MOD-03 | Same as MOD-02 | Navigate to MOD-03 Lesson 1 > scenario |
| MOD-04 module renders all 3 lessons | MOD-04 | Same as MOD-02 | Navigate to `#/module/incident-response` |
| MOD-04 exercise works end-to-end (4 steps) | MOD-04 | Same as MOD-02 | Navigate to MOD-04 Lesson 2 > exercise; verify D-06 commands accepted |
| MOD-04 scenario branches correctly | MOD-04 | Same as MOD-02 | Navigate to MOD-04 Lesson 1 > scenario |
| Every dual-use lesson has "In OT environments:" callout | DATA-03 | Content review | Grep all 9 lesson .md files for `[!OT]` or `In OT environments` |
| NERC CIP references framed as benchmark | DATA-02 | Content review | Grep all 9 lesson .md files for CIP references; verify disclaimer present |
| All 9 new controls appear in compliance index page | MOD-02/03/04 | Browser rendering | Navigate to `#/compliance-index`; verify TSA-NetworkSeg, NIST-SC-7, NIST-SI-3, TSA-AccessControl, NIST-AC-2, NIST-AC-6, TSA-IR, NIST-IR-4, NIST-AU-12 appear |
| Quiz renders and saves score on all 3 modules | MOD-02/03/04 | Requires browser interaction | Complete each quiz; verify score persists after navigation |

---

## Validation Sign-Off

- [ ] All tasks have `npm test` as automated baseline verify
- [ ] Manual browser checkpoints at end of each content wave
- [ ] Wave 0 optional (no data validation tests required unless planner adds them)
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (npm test)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
