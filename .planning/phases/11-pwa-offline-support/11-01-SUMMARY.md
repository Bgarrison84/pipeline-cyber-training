---
phase: 11-pwa-offline-support
plan: 01
subsystem: infra
tags: [pwa, vite-plugin-pwa, pureimage, png, icons, workbox]

# Dependency graph
requires:
  - phase: 10-fork-config
    provides: Completed static app foundation; all 205 tests passing; public/ directory established
provides:
  - vite-plugin-pwa@1.3.0 and pureimage@0.4.18 installed as devDependencies
  - public/pwa-192x192.png (192x192, 1792 bytes) — PWA icon for browser manifest
  - public/pwa-512x512.png (512x512, 5271 bytes) — PWA icon for splash screens
  - public/apple-touch-icon.png (180x180, 1641 bytes) — iOS Safari add-to-homescreen icon
  - scripts/generate-icons.js — reproducible dev-time icon generation script
affects:
  - 11-02 (vite.config.js VitePWA integration — needs icons in public/ before Workbox build runs)
  - 11-03 (offline-indicator.js — depends on vite-plugin-pwa being installed)

# Tech tracking
tech-stack:
  added:
    - vite-plugin-pwa@1.3.0 (Workbox-powered service worker generation for Vite)
    - pureimage@0.4.18 (pure JS Canvas 2D implementation for server-side PNG generation)
  patterns:
    - One-time dev script pattern: run-once Node.js scripts in scripts/ directory commit their output (no build pipeline integration)
    - Shapes-only icon design: pureimage requires font registration for text; shield polygon avoids the dependency

key-files:
  created:
    - scripts/generate-icons.js
    - public/pwa-192x192.png
    - public/pwa-512x512.png
    - public/apple-touch-icon.png
  modified:
    - package.json (devDependencies: vite-plugin-pwa, pureimage)
    - package-lock.json

key-decisions:
  - "Shapes-only icon design (shield polygon) — pureimage ctx.fillText requires registerFont() which adds complexity; polygon conveys security without text glyph dependency"
  - "PNG icons committed to git as static assets, not .gitignored build artifacts — Workbox precache manifest needs them present in dist/ at build time"
  - "scripts/generate-icons.js not added to package.json scripts — dev-time utility only; run once, commit PNGs"
  - "workbox-build and workbox-window NOT installed directly — they are peer deps of vite-plugin-pwa; direct install risks version mismatch"

patterns-established:
  - "scripts/ directory: home for dev-time Node.js utilities that are not part of the build pipeline"
  - "pureimage shapes-only pattern: use ctx.beginPath/moveTo/lineTo/closePath/fill for all icon graphics; avoid ctx.fillText without registerFont()"

requirements-completed:
  - PWA-01
  - PWA-02

# Metrics
duration: 8min
completed: 2026-05-18
---

# Phase 11 Plan 01: PWA Dependencies and Icon Assets Summary

**vite-plugin-pwa@1.3.0 and pureimage@0.4.18 installed; three PWA icon PNGs generated via shapes-only shield polygon script and committed to public/**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-18T18:44:00Z
- **Completed:** 2026-05-18T18:52:00Z
- **Tasks:** 2
- **Files modified:** 6 (package.json, package-lock.json, scripts/generate-icons.js, 3x PNG)

## Accomplishments
- Installed vite-plugin-pwa@1.3.0 and pureimage@0.4.18 as devDependencies with workbox peer deps pulled automatically
- Created scripts/generate-icons.js (ESM, shapes-only, no ctx.fillText) with dark navy + orange shield polygon design matching D-14
- Generated and committed all three required PNG icons: pwa-192x192.png (1792 bytes), pwa-512x512.png (5271 bytes), apple-touch-icon.png (1641 bytes)
- All 205 existing tests still pass after install and icon generation (verified twice)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install devDependencies** - `80849c5` (feat)
2. **Task 2: Write generate-icons.js and commit icon PNGs** - `1f63b37` (feat)

**Plan metadata (SUMMARY.md):** committed after self-check

## Files Created/Modified
- `package.json` - Added vite-plugin-pwa@^1.3.0 and pureimage@^0.4.18 to devDependencies
- `package-lock.json` - Updated after npm install (447 packages added)
- `scripts/generate-icons.js` - ESM script using pureimage to draw dark navy + orange shield polygon; shapes-only (no ctx.fillText)
- `public/pwa-192x192.png` - 192x192 PWA icon (1792 bytes)
- `public/pwa-512x512.png` - 512x512 PWA icon for splash screens (5271 bytes)
- `public/apple-touch-icon.png` - 180x180 iOS Safari homescreen icon (1641 bytes)

## Decisions Made
- Shapes-only icon design (shield polygon) chosen over lettermark "OT" text: pureimage requires `PImage.registerFont()` before `ctx.fillText()` — adding a font binary just for a dev-time script adds unnecessary complexity. The shield polygon visually communicates "security" without glyphs.
- PNG files committed to git (not .gitignored): Workbox traverses `dist/` at build time; if icons are absent during `npm run build`, they are silently omitted from the precache manifest causing PWA installability Lighthouse failure.
- `scripts/generate-icons.js` kept out of `package.json` scripts: dev-time only utility; run once, commit PNGs, never needs re-running unless icon design changes.

## Deviations from Plan

None - plan executed exactly as written. The RESEARCH.md Pattern 4 warning about `ctx.fillText` requiring `registerFont()` was heeded; the script uses only `beginPath/moveTo/lineTo/closePath/fill` as specified.

## Issues Encountered
None. npm install completed cleanly (1 moderate vulnerability in a transitive dep — pre-existing, unrelated to this plan). All 205 tests passed both before and after icon generation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three PNG icons are in `public/` and committed — Wave 0 blocker resolved
- vite-plugin-pwa is installed — Plan 11-02 can import VitePWA from 'vite-plugin-pwa' without install step
- Ready for Plan 11-02: Add VitePWA plugin to vite.config.js with correct scope, start_url, globPatterns
- No blockers or concerns

---
*Phase: 11-pwa-offline-support*
*Completed: 2026-05-18*
