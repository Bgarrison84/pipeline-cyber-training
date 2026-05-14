---
phase: 4
slug: quiz-engine-lesson-progress-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 with happy-dom 20.9.0 |
| **Config file** | `vitest.config.js` (root) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| icons-update | Wave 0 | 0 | ASSESS-01 | — | N/A | unit | `npm test` | ❌ W0 | ⬜ pending |
| quiz-engine-create | Wave 1 | 1 | ASSESS-01 | XSS via innerHTML | `esc()` on all quiz text (stem, answers, feedback, explanation) | unit | `npm test -- tests/quiz-engine.test.js` | ❌ W0 | ⬜ pending |
| quiz-render-first-visit | Wave 1 | 1 | ASSESS-01 | — | Click locks all answers; feedback shows immediately | unit | `npm test -- tests/quiz-engine.test.js` | ❌ W0 | ⬜ pending |
| quiz-score-save | Wave 1 | 1 | ASSESS-01 | — | `progressStore.saveQuiz()` called when last question answered | unit | `npm test -- tests/quiz-engine.test.js` | ❌ W0 | ⬜ pending |
| quiz-revisit-mode | Wave 1 | 1 | ASSESS-01 | — | Score banner shown; no click handlers attached; locked cards | unit | `npm test -- tests/quiz-engine.test.js` | ❌ W0 | ⬜ pending |
| compute-module-progress | Wave 1 | 1 | SHELL-03 | — | Mixed quiz/quiz-less formula correct per D-07 | unit | `npm test -- tests/quiz-engine.test.js` | ❌ W0 | ⬜ pending |
| lesson-view-wiring | Wave 1 | 1 | ASSESS-01 | — | `renderQuiz()` called when `meta.quizId` present | unit | `npm test -- tests/lesson-view.test.js` (extend) | ✅ | ⬜ pending |
| sidebar-progress-bars | Wave 2 | 2 | SHELL-03 | — | `.sidebar-progress-bar` elements injected after `initSidebar()` | unit | `npm test -- tests/sidebar.test.js` (extend) | ✅ | ⬜ pending |
| sidebar-refresh | Wave 2 | 2 | SHELL-03 | — | `refreshSidebarProgress()` updates bar width in DOM | unit | `npm test -- tests/sidebar.test.js` (extend) | ✅ | ⬜ pending |
| module-view-update | Wave 2 | 2 | SHELL-03 | — | Progress bar + lesson status list rendered in `renderModule()` | unit | `npm test -- tests/module-view.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/quiz-engine.test.js` — stubs covering ASSESS-01 (fetch, render, click-to-reveal, score save, revisit mode, `computeModuleProgress`)
- [ ] `tests/module-view.test.js` — stubs covering SHELL-03 module-view progress bar + lesson status list
- [ ] Extend `tests/sidebar.test.js` — add stubs for progress bar injection and `refreshSidebarProgress()`

*Vitest and happy-dom already installed — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar check-circle icon renders at 100% module completion | SHELL-03 | Lucide icon rendering requires visual inspection | Complete all lessons/quizzes in logging-auditing; confirm check-circle appears next to module title in sidebar |
| Score banner format ("Your last attempt: 3/4 correct — 2026-05-14") | ASSESS-01 | Date formatting correctness | Complete a quiz, navigate away, return to same lesson; confirm banner text format matches spec |
| Progress bar width visually updates immediately after quiz submission | SHELL-03 | DOM update timing | Submit a quiz; verify sidebar bar expands without page reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
