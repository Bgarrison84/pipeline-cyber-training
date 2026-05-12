---
phase: 01-app-shell-build-pipeline-deploy
fixed_at: 2026-05-11T16:49:00Z
review_path: .planning/phases/01-app-shell-build-pipeline-deploy/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-05-11T16:49:00Z
**Source review:** `.planning/phases/01-app-shell-build-pipeline-deploy/01-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, CR-03, WR-01, WR-02, WR-03, WR-04, WR-05)
- Fixed: 7
- Skipped: 0

Note: CR-02 and CR-04 were already fixed prior to this run (confirmed by reading files before starting). WR-02 was folded into the CR-01 commit since both changes touched `module-view.js`. WR-03 was folded into the CR-01 commit since it required the same `esc()` import in `badge.js`. IN-01 (yarn.lock/pnpm patterns) was folded into WR-05 since both changes applied to `.gitignore`.

Post-fix verification: `npx vitest run` — 11/11 tests pass. `npm run build` — exits 0, 13 modules transformed.

---

## Fixed Issues

### CR-01: XSS via unescaped module fields injected into innerHTML attributes

**Files modified:** `src/utils/escape.js` (created), `src/sidebar.js`, `src/views/home-view.js`, `src/views/module-view.js`, `src/badge.js`
**Commit:** `0a6118a`
**Applied fix:** Created `src/utils/escape.js` exporting `esc()` helper that escapes `&`, `<`, `>`, `"`, `'` characters. Imported and applied `esc()` to every `mod.*` and `lesson.*` interpolation in all four files. Also addresses WR-03 (badge.js `shortName` escaping).

---

### CR-03: Unpinned CDN script tag — supply-chain attack vector

**Files modified:** `index.html`
**Commit:** `73abd3b`
**Applied fix:** Replaced `lucide@latest` with `lucide@0.511.0/dist/umd/lucide.min.js` and added SRI integrity hash (`sha384-YCxwI7HW+hlnktW3yOnKN44k9F/E859McBSCz+NoK45Sww88vGY9Kqfdo794td6J`) computed via `curl | openssl dgst -sha384`. Added `crossorigin="anonymous"` required for SRI enforcement.

---

### WR-01: `handleRoute` called with uninitialized `#app` element

**Files modified:** `src/router.js`
**Commit:** `33f2288`
**Applied fix:** Moved `document.getElementById('app')` to top of `handleRoute()` and added `if (!app) return;` guard before any DOM access. `matchRoute` call moved after the null check.

---

### WR-02: `mod.icon` case inconsistency between sidebar and module-view

**Files modified:** `src/views/module-view.js`
**Commit:** `0a6118a` (folded into CR-01 commit)
**Applied fix:** Changed `${mod.icon}` to `${esc(mod.icon.toLowerCase())}` in `module-view.js` line 38, matching the pattern already used in `sidebar.js`. Applied alongside CR-01 since both changes touched the same file.

---

### WR-03: `badge.js` interpolates `shortName` without HTML-escaping

**Files modified:** `src/badge.js`
**Commit:** `0a6118a` (folded into CR-01 commit)
**Applied fix:** Added `import { esc } from './utils/escape.js'` and wrapped `shortName` in `esc()` in the return statement template literal. Applied alongside CR-01 since both required the `esc` import.

---

### WR-04: `aria-current="false"` is incorrect ARIA usage

**Files modified:** `src/sidebar.js`
**Commit:** `f9c678e`
**Applied fix:** Removed `aria-current="false"` from initial template in `initSidebar()` (attribute now omitted from the initial HTML entirely). In `setActiveModule()`, replaced `el.setAttribute('aria-current', isActive ? 'page' : 'false')` with `if (isActive) { el.setAttribute('aria-current', 'page'); } else { el.removeAttribute('aria-current'); }`.

---

### WR-05: `.gitignore` does not ignore `.env` files

**Files modified:** `.gitignore`
**Commit:** `2d094dd`
**Applied fix:** Added `.env.local`, `.env.*.local`, `*.env` patterns under a "Vite .env files" comment section. Also added `yarn.lock` and `pnpm-lock.yaml` (IN-01 finding) under an "Alternative package manager lock files" comment, since both changes applied to the same file.

---

_Fixed: 2026-05-11T16:49:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
