# Phase 10: Fork Configuration System - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 10 delivers a runtime fork configuration system: an IT admin at another pipeline company can clone this repo, edit `public/fork.config.json` in the GitHub web UI, drop in a logo image, and deploy a fully branded copy of the training platform — with only their selected modules visible — using GitHub Pages. No source code edits. No rebuild. No Node.js required.

Three deliverables:
1. `public/fork.config.json` — runtime config (ships with OkieOps example)
2. `src/fork-config.js` — loadForkConfig(), DEFAULT_FORK_CONFIG, applyForkBranding()
3. `docs/FORK-GUIDE.md` — step-by-step GitHub web UI deployment guide for IT admins

</domain>

<decisions>
## Implementation Decisions

### Config Schema
- **D-01:** Exactly three fields: `orgName` (string), `logoPath` (string | null), `activeModules` (string[] of module IDs). No additional fields.
- **D-02:** `activeModules` = array of module ID strings matching `modules-config.js` IDs (e.g., `["logging-auditing", "network-hardening"]`). Explicit inclusion — omit an ID to hide that module.
- **D-03:** `DEFAULT_FORK_CONFIG = { orgName: 'OT Security Lab', logoPath: null, activeModules: ['logging-auditing', 'network-hardening', 'account-access-management', 'incident-response', 'patch-management'] }`. App behavior unchanged when `fork.config.json` is missing or invalid.
- **D-04:** `logoPath` is optional — `null` means text-only header. No default placeholder logo shipped.
- **D-05:** The COMMITTED `public/fork.config.json` ships as the OkieOps example: `{ "orgName": "OkieOps", "logoPath": "OkieOps.png", "activeModules": [all 5] }`. `OkieOps.png` must be moved from the project root to `public/OkieOps.png`.

### Init Order (LOCKED)
- **D-06:** `loadForkConfig()` is the FIRST async call in `main.js init()`, before `loadComplianceRefs()`. Fork config may affect what compliance refs are needed.
- **D-07:** `loadForkConfig()` uses `fetch(import.meta.env.BASE_URL + 'fork.config.json')` and returns `DEFAULT_FORK_CONFIG` on ANY failure (404, parse error, network error) — never `null`. A `null` return causes TypeErrors that view renderers silently swallow, producing a white screen.

### Branding Surfaces
- **D-08:** `orgName` appears in two places: (1) the top-bar `<span>` replacing "OT Security Lab", (2) `document.title` set dynamically in `init()`.
- **D-09:** When `logoPath` is set: render `<img src="${BASE_URL + logoPath}">` + orgName text side by side in the top-bar span. Logo height capped at ~32px. When `logoPath` is null: text-only.

### Module Filtering
- **D-10:** Inactive modules (not in `activeModules`) are **completely hidden** — no sidebar entry, no home page card. They do not appear greyed out or locked.
- **D-11:** The `activeModules` filter applies at the **render layer only** — `sidebar.js` and `home-view.js` receive or derive the filtered list. `computeModuleProgress()` in `quiz-engine.js` always operates on the FULL `MODULES` array.
- **D-12:** Completion summary denominator = active modules count. A 2-module fork reaches 100% when both active modules are complete. The render layer in `completion-summary-view.js` filters to active modules when computing the overall progress percentage.
- **D-13:** Direct URL navigation to an inactive module (e.g. `#/module/patch-management` when it's not active) renders a "not available in your training" message — not a redirect to home.

### Fork Guide
- **D-14:** `docs/FORK-GUIDE.md` covers GitHub Pages only via the GitHub web UI. Zero git CLI required. Primary audience: IT admins with no development toolchain.
- **D-15:** Format: step-by-step numbered list with exact UI paths (e.g., "In GitHub, click Settings → Pages → Source: Deploy from branch").
- **D-16:** Includes a config field reference table: Field | Type | Example | Effect for all three fields.

### Claude's Discretion
- The exact module IDs for `DEFAULT_FORK_CONFIG.activeModules` — use all 5: `logging-auditing`, `network-hardening`, `account-access-management`, `incident-response`, `patch-management` (match `modules-config.js` exactly).
- How `forkConfig` is shared between `sidebar.js`, `home-view.js`, and `completion-summary-view.js` — recommend a module-level export from `src/fork-config.js` (a singleton getter) so downstream views don't need main.js re-exports.
- Logo `alt` attribute text — use `orgName` value.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Startup & Config Pattern
- `src/main.js` — Current `init()` and `loadComplianceRefs()` pattern. `loadForkConfig()` follows the same fetch-with-BASE_URL-prefix pattern. Add as FIRST await in `init()`.
- `index.html` — Top-bar `<span>` ("OT Security Lab") and `<title>` are the two hardcoded branding strings to replace at runtime.

### Module System
- `src/modules-config.js` — `MODULES` array with canonical module IDs. All `activeModules` values must match these IDs exactly.
- `src/sidebar.js` — Renders from `MODULES` directly; needs filtering to `activeModules` at render time.
- `src/views/home-view.js` — Same pattern as sidebar; renders all `MODULES` as cards; needs filtering.
- `src/views/completion-summary-view.js` — Imports `MODULES` and `computeModuleProgress()`; overall percentage must filter to active modules.
- `src/quiz-engine.js` — `computeModuleProgress()` must NOT be filtered — always operates on full module list.

### New Files to Create
- `public/fork.config.json` — Runtime config. Ships with OkieOps example (must exist before Phase 11 — Workbox precache manifest).
- `public/OkieOps.png` — Moved from project root. The example logo for the shipped config.
- `src/fork-config.js` — New module: `loadForkConfig()`, `DEFAULT_FORK_CONFIG`, `getForkConfig()`, `applyForkBranding()`.
- `docs/FORK-GUIDE.md` — IT admin deployment guide (GitHub Pages, web UI, no CLI).

### Requirements
- `.planning/REQUIREMENTS.md` §FORK — FORK-01, FORK-02, FORK-03 are the three requirements for this phase.
- `.planning/ROADMAP.md` §Phase 10 — Plan notes contain locked implementation constraints (read before planning).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `loadComplianceRefs()` in `src/main.js` — Direct model for `loadForkConfig()`. Same fetch pattern with `import.meta.env.BASE_URL` prefix, same graceful-null return on failure. Adapt: return `DEFAULT_FORK_CONFIG` instead of `null`.
- `import.meta.env.BASE_URL` pattern — Used throughout for public/ asset paths. Logo path must use this too or it breaks at the GitHub Pages `/pipeline-cyber-training/` subpath.

### Established Patterns
- Static `MODULES` array (`modules-config.js`) — Source of truth for module IDs. `activeModules` strings must match these IDs exactly.
- Dynamic `import('./sidebar.js')` pattern — Used in quiz-engine to break circular deps. Not needed here but available if fork-config.js introduces a dependency cycle.
- `setComplianceRefs()` / `getComplianceRefs()` pattern in `badge.js` — Module-level singleton. `getForkConfig()` should follow the same pattern for sharing config across views.

### Integration Points
- `main.js init()` — Add `loadForkConfig()` as first await; store result; call `applyForkBranding()` (updates top-bar span + document.title) before `handleRoute()`.
- `sidebar.js initSidebar()` — Needs access to `activeModules` filter. Recommend: read `getForkConfig().activeModules` inside `initSidebar()` and filter `MODULES` before rendering.
- `home-view.js renderHome()` — Same; filter `MODULES` by `getForkConfig().activeModules` before building cards.
- `completion-summary-view.js` — Filter module list to active modules for the overall percentage, while keeping `computeModuleProgress()` calls on individual modules unchanged.
- `router.js` — Route handler for `#/module/:id` needs to check if the module ID is in `activeModules`; if not, render the "not available in your training" message.

</code_context>

<specifics>
## Specific Ideas

- **OkieOps.png as shipped example**: The file exists at the project root. Move it to `public/OkieOps.png`. The committed `public/fork.config.json` ships with `orgName: "OkieOps"` and `logoPath: "OkieOps.png"` as a real working demonstration.
- **Logo rendering**: `<img src="${import.meta.env.BASE_URL}${forkConfig.logoPath}" alt="${esc(forkConfig.orgName)}" style="height:32px;width:auto;">` alongside the org name text span.
- **"Not available in your training" message**: Simple inline message in the module view, not a full error page. Text: "This module is not enabled for your organization's training program."

</specifics>

<deferred>
## Deferred Ideas

- Additional fork.config.json fields (contact URL, custom description, compliance-refs override) — user explicitly chose minimal three-field schema; revisit in a future phase if org adoption warrants it.
- Non-GitHub-Pages deployment options (Azure Static Web Apps, internal IIS, nginx) — user chose GitHub Pages web UI only for FORK-GUIDE.md; a future phase could add a generic static hosting appendix.
- Git CLI workflow section in FORK-GUIDE.md — deferred; IT admin audience doesn't need it.

</deferred>

---

*Phase: 10-Fork Configuration System*
*Context gathered: 2026-05-18*
