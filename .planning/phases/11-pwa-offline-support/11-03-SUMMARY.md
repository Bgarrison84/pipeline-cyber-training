---
phase: 11-pwa-offline-support
plan: 03
subsystem: infra
tags: [pwa, vite-plugin-pwa, workbox, service-worker, manifest, offline, precache]

# Dependency graph
requires:
  - phase: 11-01
    provides: vite-plugin-pwa@1.3.0 installed as devDependency; pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png committed to public/

provides:
  - vite.config.js updated with VitePWA plugin (registerType: autoUpdate, injectRegister: script-defer)
  - Workbox generateSW configuration with globPatterns covering js, css, html, md, json, png, ico, svg
  - dist/sw.js — Workbox service worker with 369 precached entries (10564 KiB)
  - dist/manifest.webmanifest — Web app manifest with scope and start_url set to /pipeline-cyber-training/
  - No navigateFallback (hash router compatibility preserved)

affects:
  - 11-04 (offline-indicator.js — depends on VitePWA workbox-window being registered via autoUpdate)
  - 11-05 (PWA deployment verification — sw.js and manifest.webmanifest must be in dist/)

# Tech tracking
tech-stack:
  added: []  # vite-plugin-pwa already installed in 11-01; no new packages
  patterns:
    - "VitePWA autoUpdate pattern: registerType: 'autoUpdate' forces skipWaiting:true and clientsClaim:true without explicit workbox config"
    - "injectRegister: 'script-defer' injects <script defer src='registerSW.js'> into built index.html — no main.js import needed"
    - "globPatterns must explicitly include 'md' and 'json' — Workbox defaults omit them; lesson/quiz content requires explicit inclusion for offline functionality"
    - "No navigateFallback rule: hash-based routing (#/module/:id/lesson/:n) conflicts with navigateFallback's SPA HTML5-history behavior"
    - "Absolute scope/start_url rule: relative './' causes DOMException on SW registration; must be '/pipeline-cyber-training/'"

key-files:
  created: []
  modified:
    - vite.config.js (VitePWA plugin added to plugins array with full Workbox + manifest config)

key-decisions:
  - "globPatterns includes md and json explicitly — absent from Workbox defaults; fetchLesson() has silent catch so blank offline lessons would fail silently without this"
  - "No navigateFallback — this app uses hash-based routing; navigateFallback would intercept hash navigation incorrectly (hash requests are local-only, never hit the network)"
  - "scope and start_url set to absolute '/pipeline-cyber-training/' — relative './' causes DOMException on GitHub Pages subpath deployment"
  - "npm install run in main repo to sync node_modules with package.json changes from Plan 11-01 (worktree shares node_modules with main repo)"

patterns-established:
  - "VitePWA with hash router: omit navigateFallback, use globPatterns for static content precaching only"
  - "PWA scope/start_url must be absolute paths matching Vite base config for GitHub Pages subpath deployments"

requirements-completed:
  - PWA-01
  - PWA-02

# Metrics
duration: 10min
completed: 2026-05-18
---

# Phase 11 Plan 03: Add VitePWA Plugin to vite.config.js Summary

**VitePWA plugin integrated into Vite config with autoUpdate strategy, Workbox generateSW precaching 369 entries including .md/.json lesson content, and manifest with correct absolute scope for GitHub Pages subpath**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-18T19:00:00Z
- **Completed:** 2026-05-18T19:10:00Z
- **Tasks:** 1
- **Files modified:** 1 (vite.config.js)

## Accomplishments
- Added VitePWA plugin to vite.config.js with registerType: 'autoUpdate' and injectRegister: 'script-defer'
- Configured Workbox globPatterns to include md and json extensions for offline lesson/quiz/scenario coverage
- Set manifest scope and start_url to absolute '/pipeline-cyber-training/' (required for GitHub Pages subpath deployment)
- Excluded navigateFallback to preserve hash-router compatibility
- Build produces dist/sw.js (369 precached entries, 10564 KiB) and dist/manifest.webmanifest
- All 205 existing tests still pass after vite.config.js change

## Task Commits

Each task was committed atomically:

1. **Task 1: Add VitePWA plugin to vite.config.js** - `4e85e3c` (feat)

**Plan metadata (SUMMARY.md):** committed after self-check

## Files Created/Modified
- `vite.config.js` - Added VitePWA import and plugin with autoUpdate, script-defer, globPatterns, manifest config, and three icon entries

## Decisions Made
- Used `injectRegister: 'script-defer'` rather than relying on `'auto'` default: explicit is more reliable per RESEARCH.md Pitfall 6
- globPatterns set to `['**/*.{js,css,html,md,json,png,ico,svg}']` explicitly including md and json: Workbox defaults to js/css/html only, which would silently omit lesson Markdown and JSON quiz/scenario files from the precache manifest
- No `navigateFallback` anywhere in config: hash-based routing handles its own navigation via `hashchange` events — `navigateFallback` is designed for HTML5 History API SPAs and would incorrectly intercept hash navigations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ran npm install in main repo to sync node_modules with package.json**
- **Found during:** Task 1 (first build attempt)
- **Issue:** Plan 11-01 added vite-plugin-pwa to package.json in its worktree, but the main repo's node_modules was not updated. Build failed with `Cannot find package 'vite-plugin-pwa'`
- **Fix:** Ran `npm install` in the main repo directory (`C:\Users\psyco\Claude CLI\pipeline-cyber-training`). Added 322 packages including vite-plugin-pwa and Workbox peer deps.
- **Files modified:** node_modules/ (main repo — not committed; package-lock.json already had the correct entries from 11-01)
- **Verification:** `npm run build` succeeded after install; dist/sw.js and dist/manifest.webmanifest generated
- **Committed in:** n/a (node_modules/ is gitignored; package-lock.json already correct)

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking — node_modules sync)
**Impact on plan:** Required fix to unblock the build. No scope changes. The package-lock.json from Plan 11-01 already had correct entries; only the physical installation step was missing in the main repo.

## Issues Encountered
- First build attempt failed because the main repo's node_modules was out of sync with package.json (vite-plugin-pwa listed in package.json but not physically installed). Running `npm install` in the main repo resolved this. This is a common worktree issue when packages are installed from a sibling worktree rather than the main checkout.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- dist/sw.js exists and precaches 369 entries including .md and .json files
- dist/manifest.webmanifest exists with correct scope '/pipeline-cyber-training/'
- registerSW.js injected into dist/index.html via 'script-defer' strategy
- autoUpdate strategy means the SW will silently update and take control on next page reload — no `workbox-window` update prompt required
- Ready for Plan 11-04: offline-indicator.js implementation (src/offline-indicator.js is the missing file that unblocks the TDD RED tests from 11-02)

---
*Phase: 11-pwa-offline-support*
*Completed: 2026-05-18*
