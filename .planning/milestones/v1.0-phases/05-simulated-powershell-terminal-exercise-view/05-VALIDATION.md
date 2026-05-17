---
phase: 5
slug: simulated-powershell-terminal-exercise-view
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already installed) |
| **Config file** | `vitest.config.js` — `environment: 'happy-dom'`, `include: ['tests/**/*.test.js']` |
| **Quick run command** | `npx vitest run tests/terminal-engine.test.js tests/exercise-view.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/terminal-engine.test.js tests/exercise-view.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | TERM-01 | — | N/A | unit stub | `npx vitest run tests/terminal-engine.test.js` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | TERM-04 | — | N/A | unit stub | `npx vitest run tests/exercise-view.test.js` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 0 | TERM-01 | — | N/A | unit stub | `npx vitest run tests/router.test.js` | ✅ exists | ⬜ pending |
| 05-02-01 | 02 | 1 | TERM-01 | — | No uncaught exceptions on arbitrary input | unit | `npx vitest run tests/terminal-engine.test.js` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | TERM-02 | — | successOutput non-placeholder | unit | `npx vitest run tests/terminal-engine.test.js` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | TERM-01 | — | Correct command advances step | unit | `npx vitest run tests/exercise-view.test.js` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | TERM-03 | — | Near-miss → hint shown, not generic error | unit | `npx vitest run tests/exercise-view.test.js` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 2 | TERM-04 | — | Simulator label present in DOM with exact text | unit | `npx vitest run tests/exercise-view.test.js` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 3 | TERM-01 | — | saveExercise called only after last step | unit | `npx vitest run tests/exercise-view.test.js` | ❌ W0 | ⬜ pending |
| 05-04-02 | 04 | 3 | TERM-01 | — | computeModuleProgress counts exercise completion | unit | `npx vitest run tests/quiz-engine.test.js` | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/terminal-engine.test.js` — RED stubs for TERM-01, TERM-02 (command matching, history, disable, output appending)
- [ ] `tests/exercise-view.test.js` — RED stubs for TERM-01, TERM-03, TERM-04 (simulator label, step progression, hint display, completion flow, fetch error)
- [ ] `tests/router.test.js` — add exercise route match test (file exists, add 1 test)
- [ ] `tests/quiz-engine.test.js` — add computeModuleProgress exercise branch tests (file exists, add 2 tests)

*No framework install needed — Vitest already in use.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Terminal input receives focus on exercise load | TERM-01 | happy-dom does not dispatch real focus events | Load `#/exercise/logging-auditing/01`; confirm cursor is active in terminal input |
| Terminal input border color shifts to green on focus | UI-SPEC D-02 | happy-dom does not compute CSS pseudo-class styles | Focus terminal input; verify border becomes `#22c55e` |
| Scroll-to-bottom after output appended | TERM-01 | happy-dom `scrollHeight` always 0 | Type commands until output list overflows; confirm latest output is visible |
| Lucide icons render (check-circle on completed step) | UI-SPEC Dim 2 | `activateIcons()` requires real DOM SVG replacement | Complete a step; verify checkmark icon appears |
| Sidebar progress bar width after exercise completion | TERM-01 | Layout animation requires real browser | Complete exercise; verify sidebar bar width increases |
| Exercise link in module-view shows "Exercise complete" CTA after completion | TERM-01 | Full integration requires browser + progress store | Complete exercise; navigate to module view; verify button text changed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
