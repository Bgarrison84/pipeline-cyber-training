---
phase: 6
slug: scenario-engine-compliance-index-completion-summary
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-16
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | ASSESS-02 | — | scenario test stubs created | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 0 | ASSESS-02 | — | scenario JSON schema validated | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | ASSESS-02 | T-XSS | all scenario JSON injected via esc() | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | ASSESS-02 | — | branching logic navigates correct nextPhaseId | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | ASSESS-02 | — | progressStore.saveScenario called on completion | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | SHELL-04 | — | compliance index renders all control IDs | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 3 | ASSESS-04 | — | completion summary displays progress data | unit | `npm test` | ❌ W0 | ⬜ pending |
| 06-04-02 | 04 | 3 | ASSESS-04 | — | print trigger calls window.print() | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/scenario-engine.test.js` — stubs for ASSESS-02 (branching, completion, XSS guards)
- [ ] `tests/compliance-index.test.js` — stubs for SHELL-04 (manifest fetch, rendering)
- [ ] `tests/completion-summary.test.js` — stubs for ASSESS-04 (progress aggregation, print trigger)
- [ ] `public/data/modules/logging-auditing/scenarios/01.json` — full scenario data file replacing placeholder

*Existing Vitest infrastructure covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Print layout renders correctly in browser print dialog | ASSESS-04 | `window.print()` is a side effect that cannot be unit-tested | Open completion summary, click Print, verify layout in print preview |
| Scenario branch text displays correct OT callouts | ASSESS-02 | Prose quality check — automated test checks presence, not OT correctness | Read each scenario branch and verify OT-relevant content |
| Compliance index links navigate to correct hash routes | SHELL-04 | Full navigation flow requires live browser | Click each control ID link and verify correct lesson/exercise loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
