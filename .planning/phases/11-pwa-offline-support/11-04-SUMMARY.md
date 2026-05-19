---
phase: 11-pwa-offline-support
plan: 04
subsystem: ui
tags: [pwa, offline, service-worker, dom, vitest]

requires:
  - phase: 11-02
    provides: failing offline-indicator tests (RED contract) that this plan turns GREEN
  - phase: 11-03
    provides: VitePWA plugin + Workbox SW already generating dist/sw.js

provides:
  - src/offline-indicator.js — always-visible online/offline dot+label in top-bar, install prompt handler
  - src/main.js — initOfflineIndicator() wired into init() after applyForkBranding()
  - PWA-03 fully delivered; all offline-indicator unit tests GREEN

affects: [phase-12-progress-sync, future-ui-phases]

tech-stack:
  added: []
  patterns:
    - "Pure DOM module pattern (zero project imports) — isolated, testable without mocks"
    - "Inline SVG for dynamically-injected icons (data-lucide unusable after Lucide createIcons() startup)"
    - "Module-level private state (_dotEl, _labelEl, etc.) with exported init function"
    - "vi.resetModules() + dynamic import in beforeEach for stateful module isolation in vitest"

key-files:
  created:
    - src/offline-indicator.js
  modified:
    - src/main.js

key-decisions:
  - "Inline SVG for install link icon — NOT data-lucide (Lucide runs at startup, dynamic elements missed)"
  - "initOfflineIndicator() called synchronously (no await) — indicator visible before async compliance ref fetch"
  - "Module-level private state reset via vi.resetModules() in tests — no explicit reset export needed"
  - "Both window events (online/offline) AND navigator.serviceWorker controllerchange — satisfies D-04"

patterns-established:
  - "Pure DOM module: export initX(), zero imports, module-level private vars — testable without mock setup"
  - "Inline style strings use var(--...) for design system tokens; hardcode only color constants"

requirements-completed:
  - PWA-03

duration: 30min
completed: 2026-05-18
---

# Phase 11-04: offline-indicator.js Summary

**Always-visible online/offline status dot + install prompt injected into top-bar; 13 TDD RED tests turned GREEN; human checkpoint approved**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-05-18
- **Tasks:** 3 (2 auto + 1 human verify checkpoint)
- **Files modified:** 2

## Accomplishments
- `src/offline-indicator.js` created (113 lines): green dot + "Online" / amber dot + "Offline" indicator in top-bar right side; transitions on `window online/offline` events AND `navigator.serviceWorker controllerchange` (D-04 satisfied)
- Install prompt: `beforeinstallprompt` intercepted, `#install-link` shown when browser offers install; hidden after `appinstalled` event; click calls `deferredPrompt.prompt()`
- `src/main.js` wired: `initOfflineIndicator()` called synchronously after `applyForkBranding()`, before `loadComplianceRefs()` — indicator visible immediately on startup
- All 13 offline-indicator unit tests turned GREEN (TDD RED → GREEN complete)
- Full 205+ test suite: all GREEN
- Human checkpoint approved: green dot visible in top-bar, offline transition works in DevTools, SW active in Application panel

## Task Commits

1. **Task 1: Implement src/offline-indicator.js** — `253a9cc` (feat)
2. **Task 2: Wire initOfflineIndicator() into src/main.js** — `5dacebd` (feat)
3. **Task 3: Human verification checkpoint** — approved by user

## Files Created/Modified
- `src/offline-indicator.js` — Pure DOM module, zero imports, exports `initOfflineIndicator()`, inline SVG install icon, ONLINE_COLOR `#22c55e`, OFFLINE_COLOR `#d97706`
- `src/main.js` — Added import + synchronous `initOfflineIndicator()` call in `init()`

## Decisions Made
- Inline SVG used for the install link download icon instead of `data-lucide="download"` — Lucide's `createIcons()` runs at app startup before the dynamically injected element exists; `data-lucide` on late-appended elements renders as empty text
- `initOfflineIndicator()` placed synchronously (no `await`) so the indicator is visible while async compliance ref fetch is in progress

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Phase 11 complete: PWA-01, PWA-02, PWA-03 all delivered
- Workbox SW active with 369 precache entries (dist/sw.js + dist/manifest.webmanifest)
- Online/offline indicator live in top-bar
- Phase 12 (Progress Sync) can start — no shared files with Phase 11

---
*Phase: 11-pwa-offline-support*
*Completed: 2026-05-18*
