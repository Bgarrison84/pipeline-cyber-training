---
phase: 9
slug: compliance-currency-content-depth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-17
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 + happy-dom 20.9.0 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

Baseline: 167 tests passing, 1 todo. [VERIFIED against live test run]

---

## Sampling Rate

- **After every task commit:** Run `npm test` (full suite runs in ~3s — no subset needed)
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| badge-expired | 01 | 1 | SME-01 | — | renderBadge('TSA') returns strikethrough + [EXPIRED] | unit | `npm test` | ⬜ pending |
| compliance-refs-expired | 01 | 1 | SME-01 | — | TSA entry has `"status":"expired"` and `"expiryDate"` | unit | `npm test` | ⬜ pending |
| hardcode-audit | 01 | 1 | SME-01 | — | No SD-02F hardcoded in content JSON | manual | grep public/data/ | ⬜ pending |
| sme-checklist | 02 | 2 | SME-02 | — | docs/SME-REVIEW-CHECKLIST.md exists with all 52 artifacts | manual | File existence check | ⬜ pending |
| lesson-frontmatter | 02 | 2 | SME-03 | — | Lesson .md files have lastReviewed/reviewer fields | unit | `npm test` | ⬜ pending |
| new-lessons | 03 | 2 | CONT-05 | — | 10 new lesson entries in MODULES (2 per module) | unit | `npm test` | ⬜ pending |
| new-scenarios | 04 | 3 | CONT-06 | — | 5 new scenario JSON files pass validateScenario() | unit | `npm test` | ⬜ pending |
| new-quizzes | 05 | 3 | CONT-07 | — | 5 new quiz 02.json files loadable by quiz engine | unit | `npm test` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/badge-expired.test.js` — NEW file; tests SME-01 expired badge rendering (badge.js currently has no test file)
- [ ] New tests in `tests/compliance-refs.test.js` — assert `"status": "expired"` field on TSA entry (file exists, needs new test cases)
- [ ] New tests in `tests/scenario-view.test.js` — validateScenario() called on new scenario fixtures
- [ ] New tests in `tests/quiz-engine.test.js` — quizId '02' URL resolution for all modules

*Existing test infrastructure (vitest + happy-dom) covers all other requirements. No new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No SD-02F hardcoded in content JSON post-remediation | SME-01 | grep check requires codebase access at execution time | `grep -r "SD-02F" public/data/ src/` — expect 0 hits in JSON files; compliance-index-view.js line 123 must be updated |
| docs/SME-REVIEW-CHECKLIST.md human-readable and printable | SME-02 | Visual/print inspection | Open in browser, use print preview; verify all 52 artifacts listed with blank "Last reviewed:" and "Reviewer:" fields |
| New lesson files fetchable via direct URL | CONT-05 | Network fetch from browser | Navigate to `#/module/logging-auditing/lesson/4` (and similar) in running dev server; verify lesson content loads |
| TSA.gov successor directive verification | SME-01 | Requires live internet access | Visit https://www.tsa.gov/for-industry/surface and check Pipeline Security Directives; if SD-02G or successor exists, add to compliance-refs.json; if not, leave expired state as-is |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
