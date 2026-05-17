---
phase: 1
slug: app-shell-build-pipeline-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (to be installed in Wave 0) |
| **Config file** | `vitest.config.js` — does not exist yet (Wave 0 gap) |
| **Quick run command** | `npx vitest run tests/router.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds (unit/DOM tests only) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/router.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green + manual deploy smoke test
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| router-01 | router | 1 | SHELL-02 | — | `matchRoute` returns `not-found` for unmatched hashes; never `eval()` hash content | unit | `npx vitest run tests/router.test.js` | ❌ W0 | ⬜ pending |
| router-02 | router | 1 | SHELL-02 | — | Unknown hash returns not-found view, not uncaught error | unit | `npx vitest run tests/router.test.js` | ❌ W0 | ⬜ pending |
| sidebar-01 | shell | 1 | SHELL-01 | — | All 5 modules rendered in sidebar | unit (DOM) | `npx vitest run tests/sidebar.test.js` | ❌ W0 | ⬜ pending |
| sidebar-02 | shell | 1 | SHELL-01 | — | Clicking module link changes `location.hash` | unit | `npx vitest run tests/sidebar.test.js` | ❌ W0 | ⬜ pending |
| compliance-01 | data | 1 | DATA-01 | — | `compliance-refs.json` contains TSA and NIST keys; no literal version strings in `src/**` | smoke + grep | `npx vitest run tests/compliance-refs.test.js && grep -r "SD-02" src/ && exit 1 \|\| true` | ❌ W0 | ⬜ pending |
| deploy-01 | deploy | 2 | Phase SC-1 | — | GitHub Pages URL returns HTTP 200 | e2e/manual | `curl -s -o /dev/null -w "%{http_code}" https://Bgarrison84.github.io/pipeline-cyber-training/` | Manual | ⬜ pending |
| nojekyll-01 | deploy | 2 | Phase SC-5 | — | `dist/.nojekyll` exists after build | smoke | `test -f dist/.nojekyll` | Static check | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/router.test.js` — stubs covering SHELL-01, SHELL-02 (matchRoute, handleRoute, param extraction, unknown hash → not-found)
- [ ] `tests/sidebar.test.js` — stubs covering SHELL-01 (5 modules rendered, active state, collapse toggle)
- [ ] `tests/compliance-refs.test.js` — stubs covering DATA-01 (schema shape: TSA.shortName, NIST.shortName present)
- [ ] `vitest.config.js` — shared config pointing to `happy-dom` environment
- [ ] Framework install: `npm install -D vitest @vitest/ui happy-dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub Pages URL renders app (no 404, no blank, no Jekyll) | Phase SC-1 | Requires live deploy; no local equivalent | `curl -s -o /dev/null -w "%{http_code}" https://Bgarrison84.github.io/pipeline-cyber-training/` must return 200; then open URL in browser and confirm app renders |
| GitHub Actions deploy pipeline runs green on push to main | Phase SC-5 | Requires GitHub environment | Push a commit to main branch; verify Actions workflow run completes with green status |
| GitHub Pages source set to "GitHub Actions" in repo settings | Phase SC-5 | One-time manual step in GitHub UI | Settings → Pages → Source: GitHub Actions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
