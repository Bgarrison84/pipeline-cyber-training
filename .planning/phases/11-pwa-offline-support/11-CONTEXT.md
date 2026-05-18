# Phase 11: PWA / Offline Support - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 makes the training platform fully usable offline after a single online visit. The mechanism is vite-plugin-pwa (Workbox under the hood) integrated into the Vite build. All static assets, lesson Markdown files, quiz/exercise/scenario JSON, compliance-refs.json, and fork.config.json are precached at install time so a learner on an air-gapped OT network can complete every lesson, quiz, exercise, and scenario.

Three concrete deliverables:
1. `vite-plugin-pwa` integrated into `vite.config.js` with correct `scope`, `start_url`, `globPatterns`, and update strategy
2. PWA icon assets in `public/` (192×192, 512×512, apple-touch-icon) generated from the app's color scheme
3. `src/offline-indicator.js` — always-visible online/offline status indicator in the top-bar

</domain>

<decisions>
## Implementation Decisions

### Online/Offline Indicator
- **D-01:** Indicator placement: **top-bar, right side**, alongside the existing Compliance Index and Training Log nav links.
- **D-02:** Visual design: **colored dot + short text label** — green dot + "Online" when connected, amber dot + "Offline" when not. Dot ≈ 8px, rendered inline with the other header links.
- **D-03:** Offline dot color: **amber** (matches the app's orange accent family, `#f97316` / `#d97706`). Rationale: offline is a neutral state on OT/air-gapped networks, not an error. Red would alarm users who are intentionally offline.
- **D-04:** Indicator must respond to **both** `window` online/offline events AND service worker lifecycle messages (not solely `navigator.onLine`) to satisfy PWA-03's "does not rely solely on navigator.onLine" requirement.
- **D-05:** The indicator DOM element is injected into the existing `#top-bar` `<div class="flex items-center gap-...">` alongside the existing nav links. No structural change to `index.html` required — `offline-indicator.js` programmatically appends the indicator element on init.

### Install Prompt
- **D-06:** Surface the browser's install prompt as an **opt-in "Install app" link** in the top-bar right side (next to the indicator). The app intercepts `beforeinstallprompt`, stores the deferred event, and renders a small link that triggers it when clicked.
- **D-07:** The "Install app" link is **always visible while installable** — shown from first visit whenever the browser considers the app installable. Disappears after the user accepts the install prompt.
- **D-08:** If the browser does not support `beforeinstallprompt` (Firefox, some mobile), the Install link simply does not appear — no fallback UI needed.
- **D-09:** Link label: "Install app" with a `download` Lucide icon (already in the project). Styled identically to the Compliance Index and Training Log nav links (muted color, accent on hover).

### Update Behavior
- **D-10:** Updates are **fully silent** — `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`. No toast, no notification, no forced reload prompt. Content updates take effect on next page load. Rationale: compliance training sessions should not be interrupted by update UI.

### Service Worker Config (LOCKED from ROADMAP.md plan notes)
- **D-11:** `scope` and `start_url` must both be explicitly set to `/pipeline-cyber-training/` — Vite defaults resolve incorrectly for the GitHub Pages subpath.
- **D-12:** `globPatterns` must include `**/*.{md,json}` in addition to the default `**/*.{js,css,html}` — without this, lesson content renders blank offline (fetchLesson() has a silent catch block).
- **D-13:** `registerType: 'autoUpdate'` with `skipWaiting: true` and `clientsClaim: true` — required for background-tab users to receive content updates.

### PWA Icons
- **D-14:** Icons generated programmatically from the app's color scheme: `#111827` background (near `--color-bg-secondary`), `#f97316` orange accent. Simple shield or "OT" lettermark — Claude's discretion on exact design.
- **D-15:** Required files: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`. All must exist before the Vite build runs.

### Claude's Discretion
- Exact icon design (shield vs. lettermark "OT" vs. initials) — keep it simple, dark background with orange element.
- Whether `offline-indicator.js` uses a `ServiceWorkerRegistration` message channel or just `navigator.serviceWorker.ready` to confirm SW is active before declaring "Online (cached)".
- Ordering of indicator and Install link in the header right group — indicator first (always present), Install link second (conditional).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Build Config
- `vite.config.js` — Current Vite config with `base: '/pipeline-cyber-training/'`. The PWA plugin is added here; `scope` and `start_url` must match the `base` value.
- `package.json` — Current dependencies. Add `vite-plugin-pwa` as a dev dependency.

### App Entry & Header Structure
- `index.html` — Top-bar `<header id="top-bar">` structure. The right-side `<div class="flex items-center gap-...">` is where the offline indicator and Install link are injected by `offline-indicator.js`.
- `src/main.js` — `init()` function. Call `initOfflineIndicator()` after `applyForkBranding()`, before `handleRoute()`.
- `src/fork-config.js` — Pattern for `loadForkConfig()` singleton and `applyForkBranding()`. `offline-indicator.js` follows the same module init pattern.

### Content Files (must be in globPatterns)
- `public/data/compliance-refs.json` — Must be offline-available for badge rendering.
- `public/fork.config.json` — Must be offline-available for fork branding. Confirmed present (Phase 10 complete).
- `public/data/modules/*/lessons/*.md` — Lesson content; fetchLesson() fetches at runtime — silent catch means blank content offline if not precached.
- `public/data/modules/*/*.json` (module.json, quizzes/, exercises/, scenarios/) — All runtime-fetched content.

### Design System
- `src/style.css` — CSS variables: `--color-accent: #f97316` (orange), `--color-text-muted: #737373`, `--color-border: #3a3a3a`. Indicator and Install link must use these variables, not hardcoded hex.
- `src/badge.js` — `setComplianceRefs()` / `getComplianceRefs()` singleton pattern. `offline-indicator.js` follows the same init/get pattern.

### Requirements
- `.planning/REQUIREMENTS.md` §PWA — PWA-01, PWA-02, PWA-03 are the three requirements for this phase.
- `.planning/ROADMAP.md` §Phase 11 — Plan notes contain locked implementation constraints (read before planning).

### CI/CD
- `.github/workflows/deploy.yml` — Confirmed: auto-deploys on push to main (runs `npm test` + `npm run build` + deploys dist/). No manual build step needed. Workbox manifest is generated at build time — all content must be finalized (Phase 9 + Phase 10 complete ✓) before PWA build runs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `loadForkConfig()` in `src/fork-config.js` — Direct pattern for `offline-indicator.js` init: module-level export, called once from `main.js init()`, side-effects applied immediately.
- Lucide icons (`data-lucide="..."`) — Already used throughout. `download` icon available for Install link; `wifi` / `wifi-off` available if icon-only variant is ever needed.
- `import.meta.env.BASE_URL` — Used for all public/ asset paths. Service worker `scope` and `start_url` must match this value.

### Established Patterns
- Top-bar nav links styled with `color: var(--color-text-muted)`, `text-decoration: none`, inline `onmouseover/onmouseout` for hover. Install link and indicator follow the same pattern.
- `setComplianceRefs()` / `getComplianceRefs()` in `badge.js` — Module-level singleton. `offline-indicator.js` follows this pattern (store state in module scope, expose getter).
- Lucide icons are initialized via `lucide.createIcons()` in `main.js` — any icons added by `offline-indicator.js` must be initialized separately (call `lucide.createIcons()` on the injected element, or use an inline SVG approach).

### Integration Points
- `main.js init()` — Add `initOfflineIndicator()` call after `applyForkBranding()` (branding is applied first so the header org name is already set before we append indicator elements).
- `index.html` top-bar right `<div>` — `offline-indicator.js` queries `#top-bar .flex` (or a more specific selector) and appends the indicator span and Install link span.
- `vite.config.js` — Add `VitePWA({ ... })` plugin. This is the primary integration point for Workbox.

</code_context>

<specifics>
## Specific Ideas

- **Indicator markup (rough):** `<span id="offline-indicator" style="display:flex;align-items:center;gap:4px;font-size:var(--text-body);color:var(--color-text-muted);">` containing a `<span id="status-dot" style="width:8px;height:8px;border-radius:50%;background:#22c55e;">` (green online / `#d97706` amber offline) and a `<span id="status-label">Online</span>`.
- **Install link markup:** Same flex row style as the existing Compliance Index and Training Log links. Label "Install app" with a `<i data-lucide="download">` icon.
- **Event sourcing for real-time:** Listen to `window.addEventListener('online', ...)` and `window.addEventListener('offline', ...)`. Additionally confirm SW registration state so the indicator can reflect "Online (no cache yet)" vs "Online (cached)" if needed — though PWA-03 only requires online/offline, not cache state.

</specifics>

<deferred>
## Deferred Ideas

- "Online (cached)" vs "Online (syncing)" distinction — distinguishing SW active from SW installing is a UI edge case; PWA-03 only requires online/offline. Deferred.
- Cache quota / storage warning — showing a notice when `navigator.storage.estimate()` approaches quota limits. Not in PWA-03 scope; deferred to a future improvement phase.
- Non-GitHub-Pages deployment notes (IIS, nginx with subpath) — the FORK-GUIDE.md already covers GitHub Pages; service worker scope considerations for other hosts are deferred.

</deferred>

---

*Phase: 11-PWA-Offline-Support*
*Context gathered: 2026-05-18*
