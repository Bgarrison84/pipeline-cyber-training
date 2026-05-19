---
phase: 11-pwa-offline-support
verified: 2026-05-19T00:23:18Z
status: human_needed
score: 5/6 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Offline content playability after first visit"
    expected: "After one online visit, setting Chrome DevTools Network to Offline and navigating to any lesson, quiz, exercise, or scenario produces readable content — no blank screen, no fetch error visible"
    why_human: "Requires running browser with DevTools Network offline toggle; service worker registration and cache hydration cannot be simulated in vitest/happy-dom"
---

# Phase 11: PWA / Offline Support — Verification Report

**Phase Goal:** A learner who has visited the site once can complete any lesson, quiz, exercise, or scenario without a network connection — including forks deployed on air-gapped OT networks

**Verified:** 2026-05-19T00:23:18Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                              | Status       | Evidence                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | After one online visit, offline navigation to any lesson/quiz/exercise/scenario produces readable content          | ? UNCERTAIN  | Workbox SW configured with globPatterns covering md/json/js/css/html/png/ico/svg — behavioral correctness requires browser + DevTools; human verification required         |
| 2   | compliance-refs.json and fork.config.json are precached and available offline after first load                     | ✓ VERIFIED   | `vite.config.js` line 14: `globPatterns: ['**/*.{js,css,html,md,json,png,ico,svg}']` — json extension covers both files; scope `/pipeline-cyber-training/` correctly set |
| 3   | A persistent online/offline status indicator is always visible; transitions in real time; not solely navigator.onLine | ✓ VERIFIED   | `src/offline-indicator.js` lines 91-98: both `window online/offline` events AND `navigator.serviceWorker controllerchange` listener registered; 13/13 unit tests GREEN    |
| 4   | vite-plugin-pwa is configured in vite.config.js with correct scope and no navigateFallback                        | ✓ VERIFIED   | `vite.config.js`: VitePWA imported, `registerType: 'autoUpdate'`, `injectRegister: 'script-defer'`, `scope: '/pipeline-cyber-training/'`, no navigateFallback present     |
| 5   | Three PWA icon PNGs exist in public/ (pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png)                     | ✓ VERIFIED   | Glob confirms: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png` — all three present                                                     |
| 6   | All 219+ tests pass (no regressions from PWA changes)                                                             | ✓ VERIFIED   | `npm test -- --reporter=dot`: 19 test files, 219 passed, 1 todo (220 total) — all offline-indicator 13 tests GREEN                                                       |

**Score:** 5/6 truths verified (1 requires human verification — browser behavior)

---

### Required Artifacts

| Artifact                                     | Expected                                              | Status      | Details                                                                                      |
| -------------------------------------------- | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `vite.config.js`                             | VitePWA plugin with globPatterns, scope, no navFallback | ✓ VERIFIED  | 35 lines; VitePWA configured; md+json in globPatterns; scope absolute; no navigateFallback  |
| `src/offline-indicator.js`                   | initOfflineIndicator() export; zero imports; ONLINE_COLOR; controllerchange; beforeinstallprompt | ✓ VERIFIED | 113 lines; pure DOM module; all required behaviors present |
| `src/main.js`                                | initOfflineIndicator() imported and called after applyForkBranding() | ✓ VERIFIED | Line 7: import; line 34: synchronous call after applyForkBranding() on line 33 |
| `tests/offline-indicator.test.js`            | 13+ tests covering DOM injection, transitions, install prompt, SW listener, guard | ✓ VERIFIED | 186 lines; 13 it() blocks across 5 describe blocks; all GREEN |
| `public/pwa-192x192.png`                     | 192x192 PWA icon                                      | ✓ VERIFIED  | File present in public/                                                                      |
| `public/pwa-512x512.png`                     | 512x512 PWA splash icon                               | ✓ VERIFIED  | File present in public/                                                                      |
| `public/apple-touch-icon.png`                | 180x180 iOS Safari icon                               | ✓ VERIFIED  | File present in public/                                                                      |
| `scripts/generate-icons.js`                  | Reproducible dev-time icon generation script          | ✓ VERIFIED  | File committed; shapes-only pureimage script                                                 |
| `package.json` devDependencies               | vite-plugin-pwa@^1.3.0 and pureimage@^0.4.18         | ✓ VERIFIED  | Both entries confirmed in devDependencies                                                    |

---

### Key Link Verification

| From                      | To                                 | Via                                          | Status     | Details                                                                                       |
| ------------------------- | ---------------------------------- | -------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `src/main.js`             | `src/offline-indicator.js`         | ES import + synchronous call in init()       | ✓ WIRED    | Line 7 imports; line 34 calls initOfflineIndicator() after applyForkBranding()               |
| `vite.config.js`          | `vite-plugin-pwa`                  | `import { VitePWA } from 'vite-plugin-pwa'` | ✓ WIRED    | Line 4 import; line 10 plugin instantiated in plugins array                                  |
| `VitePWA manifest`        | `public/pwa-192x192.png`           | `icons` array in manifest config            | ✓ WIRED    | Line 28: `{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }`                  |
| `VitePWA workbox`         | `.md` and `.json` lesson content   | `globPatterns: ['**/*.{js,css,html,md,json,png,ico,svg}']` | ✓ WIRED | Line 14 explicitly includes md and json                             |
| `offline-indicator.js`    | `navigator.serviceWorker`          | `addEventListener('controllerchange', ...)`  | ✓ WIRED    | Lines 95-98: guarded by `'serviceWorker' in navigator` check                                |
| `offline-indicator.js`    | `window online/offline events`     | `window.addEventListener`                    | ✓ WIRED    | Lines 91-92: both events registered                                                          |
| `offline-indicator.js`    | `beforeinstallprompt / appinstalled` | `window.addEventListener`                  | ✓ WIRED    | Lines 102-112: both events registered; deferred prompt stored; install link toggled         |

---

### Data-Flow Trace (Level 4)

| Artifact                  | Data Variable      | Source                                 | Produces Real Data         | Status       |
| ------------------------- | ------------------ | -------------------------------------- | -------------------------- | ------------ |
| `src/offline-indicator.js` | `navigator.onLine` | Browser native API                    | Yes — live network state   | ✓ FLOWING    |
| `src/offline-indicator.js` | `_deferredInstallPrompt` | `beforeinstallprompt` event      | Yes — browser-fired event  | ✓ FLOWING    |
| `src/offline-indicator.js` | SW controllerchange | `navigator.serviceWorker`            | Yes — SW lifecycle event   | ✓ FLOWING    |

---

### Behavioral Spot-Checks

| Behavior                                        | Command                                              | Result                             | Status    |
| ----------------------------------------------- | ---------------------------------------------------- | ---------------------------------- | --------- |
| All offline-indicator unit tests pass           | `npm test -- --reporter=dot`                         | 219 passed, 1 todo (220 total)     | ✓ PASS    |
| 13 offline-indicator tests all GREEN            | verbose reporter grep "offline"                      | 13 tests, all ✓                   | ✓ PASS    |
| vite-plugin-pwa installed                       | `cat package.json` devDependencies                   | `^1.3.0` present                  | ✓ PASS    |
| globPatterns includes md and json               | grep vite.config.js                                  | `**/*.{js,css,html,md,json,...}`   | ✓ PASS    |
| No navigateFallback in vite.config.js           | grep vite.config.js                                  | Only comment mentioning it absent  | ✓ PASS    |
| initOfflineIndicator() called after applyForkBranding() | grep src/main.js                          | Lines 33-34 confirm sequence       | ✓ PASS    |
| ONLINE_COLOR `#22c55e` present                  | grep src/offline-indicator.js                        | Line 12 confirmed                  | ✓ PASS    |
| Zero project imports in offline-indicator.js    | inspect src/offline-indicator.js                     | No import statements present       | ✓ PASS    |

---

### Requirements Coverage

| Requirement | Description                                                              | Status       | Evidence                                                                                  |
| ----------- | ------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------- |
| PWA-01      | Service worker installed; caches all static assets, .md, .json files    | ✓ SATISFIED  | vite.config.js VitePWA with autoUpdate + globPatterns covering md+json                  |
| PWA-02      | Lessons, quizzes, exercises, scenarios playable offline after first load | ? NEEDS HUMAN | Workbox config correct; actual offline playback requires browser DevTools verification   |
| PWA-03      | Always-visible UI indicator; real-time transitions; not solely navigator.onLine | ✓ SATISFIED | offline-indicator.js: controllerchange + online/offline events; 13 tests GREEN          |

---

### Anti-Patterns Found

| File                        | Line | Pattern      | Severity | Impact                                                        |
| --------------------------- | ---- | ------------ | -------- | ------------------------------------------------------------- |
| `src/main.js` line 18       | 18   | `return null` | Info     | Inside error handler (`if (!res.ok)`) — legitimate, not stub |
| `src/main.js` line 23       | 23   | `return null` | Info     | Inside catch block — legitimate error handling, not stub      |

No blockers. No TBD/FIXME/XXX markers in phase-modified files. No hardcoded empty arrays or stub returns in rendering paths.

---

### Human Verification Required

### 1. Offline Content Playability (PWA-02 / ROADMAP SC #1)

**Test:** Open the deployed site at `https://briston.github.io/pipeline-cyber-training/` (or local `npm run build && npm run preview`). Navigate to any lesson, quiz, exercise, and scenario so the service worker caches them. Open DevTools → Network tab → select "Offline". Reload the page and navigate to a different lesson.

**Expected:** Lesson prose renders from cache with no blank screen or fetch error. Quiz and scenario pages load their JSON content. The compliance badge renders (from cached compliance-refs.json). Fork branding (OkieOps.png) displays (from cached fork.config.json and PNG).

**Why human:** Service worker registration, cache hydration, and offline retrieval depend on browser SW lifecycle that vitest/happy-dom does not simulate. The Workbox config is correct but actual offline behavior must be confirmed with Chrome DevTools Network offline mode.

---

### Gaps Summary

No blocking gaps found. All programmatically verifiable requirements are met:

- PWA-01: vite-plugin-pwa installed and configured in vite.config.js with correct scope, start_url, globPatterns (md+json), and no navigateFallback
- PWA-03: offline-indicator.js implemented with zero imports, ONLINE_COLOR #22c55e, controllerchange listener, beforeinstallprompt/appinstalled handlers; wired into main.js synchronously after applyForkBranding(); 13/13 unit tests GREEN
- All 3 PWA icon PNGs exist in public/ with correct names
- 219 tests pass (no regressions)

The one item needing human verification (ROADMAP SC #1 / PWA-02) is the actual offline playback behavior — it requires a browser with DevTools Network offline mode, which cannot be automated. The underlying infrastructure (Workbox config, globPatterns, SW registration strategy) is correct and has been verified.

---

**Commit history confirms all 4 plans executed:**

| Commit    | Plan  | Description                                                             |
| --------- | ----- | ----------------------------------------------------------------------- |
| `80849c5` | 11-01 | feat: install vite-plugin-pwa + pureimage (devDependencies)            |
| `1f63b37` | 11-01 | feat: generate-icons.js + 3 PWA icon PNGs                              |
| `5b80e10` | 11-02 | test: 13 failing offline-indicator tests (TDD RED)                     |
| `4e85e3c` | 11-03 | feat: VitePWA plugin in vite.config.js — Workbox autoUpdate           |
| `253a9cc` | 11-04 | feat: implement offline-indicator.js                                    |
| `5dacebd` | 11-04 | feat: wire initOfflineIndicator() into main.js                          |

---

_Verified: 2026-05-19T00:23:18Z_
_Verifier: Claude (gsd-verifier)_
