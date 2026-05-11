---
phase: 01-app-shell-build-pipeline-deploy
verified: 2026-05-11T21:20:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to the live URL (https://bgarrison84.github.io/pipeline-cyber-training/) in a browser and click each of the 5 sidebar module links in sequence"
    expected: "URL hash changes (e.g. #/module/logging-auditing), main content area updates showing module title + goal + badges + 4 section cards, no full page reload occurs (browser back button returns to previous view)"
    why_human: "hashchange + innerHTML rendering is a browser behavior; cannot be verified by grep or node execution alone"
  - test: "Open one of the five bookmarkable module URLs directly in a fresh browser tab: https://bgarrison84.github.io/pipeline-cyber-training/#/module/account-access"
    expected: "Page loads and renders 'Account & Access Management' module view (title, goal, compliance badges, section cards) without showing a 404 or blank screen"
    why_human: "Requires a real browser load of a hash URL on the live deployment; cannot be verified by curl (curl strips hash fragments)"
  - test: "Open DevTools Network tab while loading https://bgarrison84.github.io/pipeline-cyber-training/ and filter for compliance-refs.json"
    expected: "File fetches with HTTP 200; the TSA and NIST badge text visible in the home view and module views matches the shortName values in data/compliance-refs.json (TSA SD-02F and NIST SP 800-82 Rev 3)"
    why_human: "Verifies the fetch-to-badge rendering pipeline end-to-end in a live browser; programmatic curl of the asset only proves the file exists, not that renderBadge() produces correct text in the DOM"
---

# Phase 1: App Shell + Build Pipeline + Deploy — Verification Report

**Phase Goal:** A navigable, deployed static site skeleton exists that all subsequent work mounts into
**Verified:** 2026-05-11T21:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Visiting the GitHub Pages URL renders the app — no 404, no blank screen, no Jekyll interference | VERIFIED | `curl -s -o /dev/null -w "%{http_code}" https://bgarrison84.github.io/pipeline-cyber-training/` returns `200`; GitHub Pages API confirms `build_type: workflow`, `public: true`; `.nojekyll` present in `dist/` after build |
| SC-2 | Navigating between all five module placeholders via sidebar changes the URL hash and renders the corresponding empty view without a full page reload | VERIFIED (human confirm needed) | `hashchange` listener wired in `src/router.js:58`; sidebar `<a href="#/module/{id}">` links trigger hash change; `handleRoute()` writes to `#app` via `innerHTML` — no `location.reload()` or `pushState`; visual confirmation in live browser needed |
| SC-3 | Each module and lesson placeholder has a unique hash URL that is bookmarkable and returns the same view on reload | VERIFIED (human confirm needed) | `init()` in `src/main.js` calls `handleRoute()` after `loadComplianceRefs()` resolves, reading `window.location.hash` — any bookmarked hash URL renders the correct view on load; all 5 module IDs present in `MODULES` and in router patterns; live URL confirmation needed |
| SC-4 | `data/compliance-refs.json` exists with TSA SD-02F as canonical reference — no version string hardcoded anywhere else | VERIFIED | File confirmed at `data/compliance-refs.json` with `shortName: "TSA SD-02F"`; `grep -r "SD-02" src/` returns no matches; badge rendering delegates to `renderBadge()` from `badge.js` which reads from `_complianceRefs`; home-view subheading uses HTML entity `SD&#8209;02F` (not literal `SD-02F`) per explicit plan exception |
| SC-5 | Running `vite build` locally produces a deployable `dist/`; GitHub Actions deploys on push to main; `.nojekyll` is present | VERIFIED | `npm run build` exits 0 producing `dist/` with `dist/.nojekyll`; `dist/index.html` asset paths contain `/pipeline-cyber-training/assets/`; GitHub Actions run `25697827366` completed with status `success` in 28s; `deploy.yml` contains `actions/deploy-pages@v5`, `npm ci`, `npm test`, `npm run build` |

**Score:** 5/5 truths verified (3 fully programmatic, 2 with residual browser-only confirmation needed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Project manifest with vite, tailwindcss, vitest, happy-dom; build script | VERIFIED | `vite@^8.0.12`, `tailwindcss@^4.3.0`, `@tailwindcss/vite@^4.3.0`, `vitest@^4.1.6`, `happy-dom`, `"build": "vite build"`, `"test": "vitest run"` — all present |
| `vite.config.js` | Vite build config with base `/pipeline-cyber-training/` and Tailwind plugin | VERIFIED | `base: '/pipeline-cyber-training/'`, `plugins: [tailwindcss()]` confirmed |
| `src/style.css` | Tailwind v4 `@theme` design token declarations | VERIFIED | Begins with `@import "tailwindcss";`, `@theme` block contains all required tokens: 10 color tokens, 4 badge tokens, 4 typography tokens, 7 spacing tokens, 3 layout dimension tokens, sidebar collapse CSS, focus ring |
| `data/compliance-refs.json` | Single source of truth for TSA/NIST version strings | VERIFIED | `schemaVersion: 1`, `directives.TSA.shortName: "TSA SD-02F"`, `directives.NIST.shortName: "NIST SP 800-82 Rev 3"`, `lastVerified: "2026-05-11"` |
| `src/modules-config.js` | MODULES array with all 5 module definitions | VERIFIED | Exports `MODULES` constant with exactly 5 entries: logging-auditing, network-hardening, account-access, incident-response, patch-management; each has id, title, icon, description, order, estimatedMinutes, lessons[], complianceTags[] |
| `vitest.config.js` | Vitest config with happy-dom environment | VERIFIED | `environment: 'happy-dom'`, `include: ['tests/**/*.test.js']` confirmed |
| `tests/router.test.js` | 4 matchRoute tests (green) | VERIFIED | 4/4 tests pass: home view, module extraction, not-found, empty hash |
| `tests/sidebar.test.js` | Sidebar MODULES tests (green) | VERIFIED | 3/3 tests pass (note: test 3 is a tautology stub — documented in REVIEW.md IN-03; not a blocker) |
| `tests/compliance-refs.test.js` | 4 DATA-01 tests (green) | VERIFIED | 4/4 tests pass: schemaVersion, TSA shortName, NIST shortName, directives object |
| `public/.nojekyll` | Jekyll suppression in public/ | VERIFIED | File exists at `public/.nojekyll`; Vite copies to `dist/.nojekyll` at build time — confirmed |
| `src/router.js` | Hash router with matchRoute, handleRoute | VERIFIED | Exports `matchRoute` and `handleRoute`; `extractParams` implemented; `viewRenderers` object; `hashchange` listener; no `eval()`, no `pushState` |
| `src/main.js` | App entry point — fetches compliance-refs, calls handleRoute | VERIFIED | Exports `loadComplianceRefs`, `getComplianceRefs`, `renderBadge`; uses `import.meta.env.BASE_URL`; no literal "SD-02F" or "SP 800-82 Rev 3" strings |
| `src/sidebar.js` | Sidebar collapse toggle and active module | VERIFIED | Exports `initSidebar` and `setActiveModule`; renders 5 module items with `data-module-id`; collapse toggle switches aria-label; `setActiveModule` handles active state transitions |
| `index.html` | App shell HTML — #shell grid, #top-bar, #sidebar, #app | VERIFIED | Contains `id="shell"`, `id="top-bar"`, `id="sidebar"`, `id="sidebar-toggle"`, `id="app"`, `<title>OT Security Lab</title>`, `<script type="module" src="/src/main.js">` |
| `src/views/home-view.js` | 5 module cards with compliance badges | VERIFIED | Exports `renderHome`; 5 `<article>` elements, each with onclick/onkeydown hash navigation; `renderBadge()` called for each tag |
| `src/views/module-view.js` | Module placeholder with goal, badges, 4 section cards | VERIFIED | Exports `renderModule`; SECTION_CARDS array with 4 entries; "COMPLIANCE CONTROLS COVERED" label; `renderModuleNotFound` is fully static (no moduleId injection) |
| `src/views/not-found-view.js` | Static 404 view | VERIFIED | Exports `renderNotFound`; fully static string "Page not found" + sidebar guidance; no hash content injected |
| `src/badge.js` | Badge renderer (extracted from main.js to break circular dep) | VERIFIED | Exports `renderBadge` and `setComplianceRefs`; reads from `_complianceRefs`; no hardcoded version strings |
| `.github/workflows/deploy.yml` | GitHub Actions workflow for Pages deployment | VERIFIED | Contains `actions/deploy-pages@v5`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v5`, `actions/setup-node@v4` with `node-version: 22`, `npm ci`, `npm test`, `npm run build` |
| `package-lock.json` | Committed for deterministic CI installs | VERIFIED | File exists in repo root |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `vite.config.js` | `dist/` | `npm run build` | VERIFIED | Build exits 0; `dist/index.html` asset paths contain `/pipeline-cyber-training/assets/` |
| `src/style.css` | compiled CSS | `@tailwindcss/vite` plugin | VERIFIED | `@import "tailwindcss"` present; plugin in `vite.config.js`; `dist/assets/index-Cm15RbKH.css` (13.57 kB) produced |
| `data/compliance-refs.json` | `badge.js renderBadge()` | `fetch(import.meta.env.BASE_URL + ...)` → `setComplianceRefs()` | VERIFIED | `main.js` fetches JSON via `import.meta.env.BASE_URL + 'data/compliance-refs.json'`; calls `setComplianceRefs()`; `badge.js` reads `_complianceRefs?.directives?.[key]?.shortName` |
| `index.html` | `src/main.js` | `<script type="module" src="/src/main.js">` | VERIFIED | Confirmed in `index.html:37` |
| `src/main.js` | `src/router.js handleRoute` | `import { handleRoute } from './router.js'` | VERIFIED | Import confirmed; `handleRoute()` called in `init()` after `loadComplianceRefs()` |
| `src/router.js` | `document.getElementById('app')` | `app.innerHTML = renderer(params)` | VERIFIED | `handleRoute()` in router.js line 47 sets `app.innerHTML` |
| `.github/workflows/deploy.yml` | GitHub Pages | `actions/deploy-pages@v5` | VERIFIED | Actions run `25697827366` completed success; GitHub Pages `build_type: workflow`; live URL returns HTTP 200 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/badge.js renderBadge()` | `_complianceRefs` | `setComplianceRefs()` called by `main.js` after fetch from `data/compliance-refs.json` | Yes — file contains real TSA/NIST version strings | FLOWING |
| `src/views/home-view.js` | `MODULES` array | `src/modules-config.js` hardcoded export | Yes — 5 real module definitions | FLOWING |
| `src/views/module-view.js` | `mod` object | `MODULES.find(m => m.id === moduleId)` | Yes — data from hardcoded modules-config | FLOWING |
| `src/sidebar.js` | `MODULES` | `import { MODULES } from './modules-config.js'` | Yes — 5 modules rendered as `<div class="sidebar-module">` | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 11 Vitest tests pass | `npx vitest run --reporter=verbose` | 11/11 tests passed (3 files), 0 errors | PASS |
| `vite build` produces dist/ with .nojekyll | `npm run build` | exits 0; `dist/index.html` (2.73 kB), `dist/assets/index-Cm15RbKH.css` (13.57 kB), `dist/assets/index-C51dRSBS.js` (11.02 kB); `dist/.nojekyll` present | PASS |
| Asset paths contain base URL | `grep pipeline-cyber-training dist/index.html` | `/pipeline-cyber-training/assets/index-C51dRSBS.js` and `/pipeline-cyber-training/assets/index-Cm15RbKH.css` | PASS |
| Live URL returns HTTP 200 | `curl -s -o /dev/null -w "%{http_code}" https://bgarrison84.github.io/pipeline-cyber-training/` | `200` | PASS |
| No version strings hardcoded in src/ | `grep -r "SD-02" src/` | No matches (exit 1) | PASS |
| No eval/pushState in router | `grep "eval\|pushState" src/router.js` | No matches | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SHELL-01 | 01-01, 01-02, 01-03, 01-04 | User can navigate between all 5 modules via a persistent sidebar | SATISFIED | Sidebar renders 5 modules with `href="#/module/{id}"` links; `hashchange` listener dispatches to correct view; all 5 module IDs in MODULES array and confirmed in sidebar.test.js |
| SHELL-02 | 01-01, 01-02, 01-03, 01-04 | Every module has a unique, linkable hash URL | SATISFIED | `matchRoute` correctly handles `#/module/:moduleId`; 5 module hash URLs confirmed in MODULES; bookmarkable via `init()` initial render path |
| DATA-01 | 01-01, 01-03, 01-04 | TSA directive version strings stored only in `data/compliance-refs.json` | SATISFIED | `data/compliance-refs.json` confirmed with `shortName: "TSA SD-02F"`; `grep -r "SD-02" src/` returns no matches; renderBadge reads from loaded JSON |

**Orphaned requirements check:** REQUIREMENTS.md maps SHELL-01, SHELL-02, DATA-01 to Phase 1. All three are claimed by the Phase 1 plans and verified above. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/sidebar.js` | 9 | `aria-current="false"` set on all non-active modules initially | Warning (from REVIEW.md WR-04) | Screen reader noise; not a functional blocker |
| `src/sidebar.js` | 15 | `mod.icon.toLowerCase()` inconsistent with module-view.js which uses `mod.icon` directly | Warning (from REVIEW.md WR-02) | Cosmetic; Lucide CDN accepts both; may cause issues if Lucide npm package used in Phase 2 |
| `tests/sidebar.test.js` | 25-31 | Test 3 is a tautology — tests a string constant, not real code | Info (from REVIEW.md IN-03) | False coverage confidence; not a Phase 1 blocker |
| `src/views/home-view.js` | 27 | `TSA SD&#8209;02F` and `NIST SP&nbsp;800&#8209;82 Rev&nbsp;3` in descriptive subheading prose | Info | Intentional — explicitly permitted by the plan as descriptive prose (not a compliance badge); HTML entities prevent literal `SD-02` grep match |
| `.gitignore` | — | Missing `.env.local`, `.env.*.local` patterns | Warning (from REVIEW.md WR-05) | Low risk for static site; no backend secrets currently present |

**No blockers found.** All TBD/FIXME/XXX markers: none present in any source file.

**Resolved critical issues (from code review):**
- CR-02: `load` event listener removed from `router.js` (commit `f12bb28`) — double-render on page load fixed
- CR-04: `npm test` step added to `deploy.yml` before build (commit `f12bb28`) — test failures now block deploy

**Open issues from code review (not phase-goal blockers):**
- CR-01: XSS via unescaped mod.* fields — currently low risk because MODULES is hardcoded; becomes important in Phase 2 when fetch replaces static config
- CR-03: Unpinned `lucide@latest` CDN tag — plan note acknowledges this; swap to npm bundle planned for Phase 2

### Human Verification Required

The following items require a human with a browser on the live deployment. All automated checks passed.

#### 1. Hash Navigation Without Page Reload

**Test:** Open https://bgarrison84.github.io/pipeline-cyber-training/ in a browser. Click each of the 5 module items in the left sidebar in sequence.
**Expected:** The URL hash in the address bar changes (e.g., `#/module/logging-auditing`); the main content area updates with the module title, goal statement, TSA/NIST badges, and 4 section skeleton cards; the browser's back button returns to the previous module view. No full-page reload occurs (tab title stays "OT Security Lab" without flashing).
**Why human:** This is a browser-side DOM behavior. Curl confirms the site returns HTML; it cannot confirm that `hashchange` events fire, `innerHTML` updates render, and page reload does not occur.

#### 2. Bookmarkable Hash URLs Reload Correctly

**Test:** Open any of these URLs directly in a new browser tab (paste into address bar):
- `https://bgarrison84.github.io/pipeline-cyber-training/#/module/network-hardening`
- `https://bgarrison84.github.io/pipeline-cyber-training/#/module/incident-response`

**Expected:** Page loads and immediately renders the correct module view (title "Network Hardening" or "Incident Response", respectively) — not the home catalog and not a 404.
**Why human:** Curl strips hash fragments — it always fetches the root HTML regardless of hash. Only a real browser sends the hash to the client-side router. Hash handling on direct load requires visual browser confirmation.

#### 3. Compliance Badge Text Sourced from JSON

**Test:** Open https://bgarrison84.github.io/pipeline-cyber-training/ in a browser, then open DevTools (F12) → Network tab → filter for `compliance-refs.json`.
**Expected:** The file is fetched with HTTP 200. The blue badge in any module view reads "TSA SD-02F" and the green badge reads "NIST SP 800-82 Rev 3" — matching the shortName values in the JSON response visible in the Network preview panel.
**Why human:** Confirms the fetch-to-badge-render pipeline works in a live browser. Code analysis verifies the wiring is correct; this confirms no fetch error silently falls through to the `directiveKey` fallback.

### Gaps Summary

No gaps. All 5 phase success criteria are verified. The three human verification items above are confirmation steps for behavior that automated code analysis has already verified is correctly wired — they are not expected to reveal failures.

---

_Verified: 2026-05-11T21:20:00Z_
_Verifier: Claude (gsd-verifier)_
