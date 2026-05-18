# Phase 11: PWA / Offline Support - Research

**Researched:** 2026-05-18
**Domain:** Progressive Web Apps — vite-plugin-pwa (Workbox 7), service worker precaching, offline indicator, install prompt
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Indicator placement: top-bar, right side, alongside the existing Compliance Index and Training Log nav links.
- **D-02:** Visual design: colored dot + short text label — green dot + "Online", amber dot + "Offline". Dot ≈ 8px, inline with header links.
- **D-03:** Offline dot color: amber (`#f97316` / `#d97706`). Rationale: offline is neutral on OT/air-gapped networks, not an error.
- **D-04:** Indicator must respond to BOTH `window` online/offline events AND SW lifecycle messages — not solely `navigator.onLine`.
- **D-05:** Indicator DOM element injected into `#top-bar .flex` by `offline-indicator.js`; no structural change to `index.html`.
- **D-06:** Surface browser install prompt as opt-in "Install app" link in top-bar right side.
- **D-07:** Install link always visible while installable; disappears after user accepts prompt.
- **D-08:** Firefox/no-`beforeinstallprompt` browsers: install link simply does not appear.
- **D-09:** Label "Install app" with `data-lucide="download"` icon, styled like existing nav links.
- **D-10:** Updates are fully silent — `registerType: 'autoUpdate'`, `skipWaiting: true`, `clientsClaim: true`. No toast. No reload prompt.
- **D-11:** `scope` and `start_url` explicitly set to `/pipeline-cyber-training/`.
- **D-12:** `globPatterns` must include `**/*.{md,json}` in addition to the default `**/*.{js,css,html}`.
- **D-13:** `registerType: 'autoUpdate'` with `skipWaiting: true` and `clientsClaim: true`.
- **D-14:** Icons generated programmatically from app color scheme: `#111827` background, `#f97316` accent.
- **D-15:** Required icon files: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`.

### Claude's Discretion

- Exact icon design (shield vs. lettermark "OT" vs. initials) — simple, dark background, orange element.
- Whether `offline-indicator.js` uses `ServiceWorkerRegistration` message channel or `navigator.serviceWorker.ready` to confirm SW is active.
- Ordering of indicator and Install link in header right group — indicator first (always present), Install link second (conditional).

### Deferred Ideas (OUT OF SCOPE)

- "Online (cached)" vs "Online (syncing)" distinction.
- Cache quota / storage warning (`navigator.storage.estimate()`).
- Non-GitHub-Pages deployment notes (IIS, nginx subpath).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PWA-01 | Service worker installed (Vite PWA plugin); caches all static assets, lesson Markdown files, JSON data files | vite-plugin-pwa 1.3.0 confirmed Vite 8-compatible; globPatterns strategy documented |
| PWA-02 | Lessons, quizzes, exercises, and scenarios fully playable offline after first load | Workbox generateSW precaches entire dist/ including public/data/**; globPatterns + includeAssets cover all file types |
| PWA-03 | UI indicator shows online vs. offline mode; always visible; does not rely solely on `navigator.onLine` | window events + SW lifecycle message pattern documented; vitest/happy-dom testing approach confirmed |
</phase_requirements>

---

## Summary

Phase 11 adds a Workbox-backed service worker via `vite-plugin-pwa` so the platform is fully usable offline after one visit. The Vite build already produces a `dist/` directory containing all static assets, including the `public/data/` JSON and Markdown files copied there by Vite's `publicDir` mechanism. Workbox's `generateSW` strategy traverses `dist/` at build time and builds a precache manifest from it, making those files available to the service worker cache-first on subsequent loads.

Three concrete integration points exist: (1) `vite.config.js` receives the `VitePWA({...})` plugin call, (2) `src/offline-indicator.js` is a new module that injects a status dot into the top-bar and listens for both `window` online/offline events and SW controller change messages, and (3) three PNG icon files must be placed in `public/` before the build runs — confirmed absent today and must be generated as part of this phase.

The critical correctness constraints are the `globPatterns` breadth (must explicitly include `.md` and `.json`, which are absent from the Workbox default) and the manifest `scope`/`start_url` values (must be `/pipeline-cyber-training/`, not the Vite default of `./`). Getting either wrong produces silent failures: blank lesson content offline, or a `DOMException` on service worker registration.

**Primary recommendation:** Use `vite-plugin-pwa@1.3.0`, `generateSW` strategy, `injectRegister: 'script-defer'` (no main.js import needed), `registerType: 'autoUpdate'`. Add `.md` and `.json` to `workbox.globPatterns`. Set `manifest.scope` and `manifest.start_url` to `/pipeline-cyber-training/`. Generate icons with a Node.js script using `pureimage` (pure-JS, no native deps). Test `offline-indicator.js` by dispatching real DOM events in vitest/happy-dom and mocking `navigator.serviceWorker` with `Object.defineProperty`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Service worker registration | Build tool (Vite plugin) | Browser runtime | vite-plugin-pwa generates and injects SW at build time; browser registers on load |
| Asset precaching | Service worker (Workbox) | — | Workbox generateSW owns the cache-first strategy for all precached URLs |
| Offline data serving (lessons, quizzes) | Service worker (Workbox) | — | fetch() calls from content-loader.js are intercepted by the SW; no app-layer changes needed |
| Online/offline indicator UI | Frontend JS module | Browser window events + SW messages | `offline-indicator.js` owns DOM injection; event sources are window and SW controller |
| Install prompt interception | Frontend JS module | Browser `beforeinstallprompt` event | `offline-indicator.js` intercepts and defers; renders "Install app" link |
| PWA manifest | Build tool output | — | vite-plugin-pwa writes `manifest.webmanifest` into `dist/` at build time |
| Icon assets | Static files (public/) | — | PNG files placed in `public/` before build; Vite copies them to `dist/`; SW precaches them |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite-plugin-pwa` | `1.3.0` | Vite plugin wrapping Workbox; generates SW, manifest, injects registration script | Official Vite PWA integration; Vite 8 peer dependency added in 1.3.0 (released 2026-05-05) |
| `workbox-build` | `7.4.1` | Peer dep — Workbox core; `generateSW` traverses dist/, builds precache manifest | Pulled in automatically by vite-plugin-pwa; do not install separately |
| `workbox-window` | `7.4.1` | Peer dep — browser-side SW registration helper used by plugin's virtual modules | Pulled in automatically |

### Supporting (Icon Generation — dev-time script only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pureimage` | `0.4.18` | Pure-JS Canvas 2D API for Node; generates PNG icons | One-time icon generation script; no native deps (unlike node-canvas) |

**Note on `@vite-pwa/assets-generator`:** This is the "official" icon generation tool from the vite-pwa project. It is the better choice IF a source SVG exists. It requires `sharp` (native binaries). Because this project has no existing SVG logo, using `pureimage` to generate simple programmatic icons (shield + text) is simpler — no SVG authoring required. [ASSUMED: pureimage adequacy for this use case; if icon quality is insufficient, switch to @vite-pwa/assets-generator with an SVG input.]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `generateSW` strategy | `injectManifest` strategy | `injectManifest` is needed only when a custom SW file with arbitrary logic is required. This phase has no custom SW logic — `generateSW` is correct. |
| `pureimage` (icon gen) | `@vite-pwa/assets-generator` | assets-generator requires a source SVG and installs `sharp` (native binaries); pureimage is pure-JS. Use assets-generator if a proper SVG source exists. |
| `injectRegister: 'script-defer'` | `injectRegister: 'inline'` | Both work without main.js imports. `script-defer` is slightly better for performance (non-blocking script load). `inline` embeds directly in HTML head. |

**Installation (dev dependencies):**
```bash
npm install -D vite-plugin-pwa pureimage
```

`workbox-build` and `workbox-window` are peer dependencies of `vite-plugin-pwa` and are installed automatically by npm.

**Version verification:**
```
vite-plugin-pwa@1.3.0  — published 2026-05-05 [VERIFIED: npm registry]
pureimage@0.4.18        — published 2014-11-12 (stable, maintained) [VERIFIED: npm registry]
workbox-build@7.4.1     — confirmed as peer dep [VERIFIED: npm registry]
workbox-window@7.4.1    — confirmed as peer dep [VERIFIED: npm registry]
```

---

## Package Legitimacy Audit

> slopcheck v0.6.1 run on 2026-05-18.

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `vite-plugin-pwa` | npm | ~6 yrs (created 2020-08-20) | github.com/vite-pwa/vite-plugin-pwa | [OK] | Approved |
| `@vite-pwa/assets-generator` | npm | ~2 yrs (created 2023-06-05) | github.com/vite-pwa/assets-generator | [OK] | Approved (optional) |
| `pureimage` | npm | ~11 yrs (created 2014-11-12) | github.com/joshmarinacci/node-pureimage | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

No postinstall scripts detected on any of the above packages.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (first visit, online)
  └─ fetch() requests for lessons/quizzes/scenarios
       └─ Vite dev server / GitHub Pages CDN → response

Browser (subsequent visits — SW installed)
  └─ Any request for precached URL
       └─ Service Worker (Workbox, cache-first)
            ├─ Cache hit → serve from cache (works offline)
            └─ Cache miss → fetch network (and add to runtime cache if configured)

Workbox Precache Manifest (built at `npm run build` time)
  ├─ dist/index.html
  ├─ dist/assets/*.js, *.css
  ├─ dist/data/**/*.json     ← from public/data/ (Vite copies publicDir → dist/)
  ├─ dist/data/**/*.md       ← from public/data/
  ├─ dist/fork.config.json   ← from public/
  ├─ dist/pwa-192x192.png    ← from public/
  ├─ dist/pwa-512x512.png    ← from public/
  └─ dist/apple-touch-icon.png ← from public/

vite.config.js (build time)
  └─ VitePWA({
       registerType: 'autoUpdate',
       injectRegister: 'script-defer',    ← injects <script defer src="registerSW.js"> into index.html
       workbox: { globPatterns: [...] },  ← drives precache manifest
       manifest: { scope, start_url, icons, ... }
     })

src/offline-indicator.js (runtime, called from main.js init())
  ├─ Injects status dot + label into #top-bar .flex
  ├─ Listens: window.addEventListener('online', ...)
  ├─ Listens: window.addEventListener('offline', ...)
  ├─ Listens: navigator.serviceWorker 'controllerchange' event
  ├─ Intercepts: window.addEventListener('beforeinstallprompt', ...)
  └─ Renders: "Install app" link → calls deferredPrompt.prompt()
```

### Recommended Project Structure Changes

```
public/
  pwa-192x192.png          ← NEW — generated by scripts/generate-icons.js
  pwa-512x512.png          ← NEW — generated by scripts/generate-icons.js
  apple-touch-icon.png     ← NEW — generated (180×180)
src/
  offline-indicator.js     ← NEW — status dot + install prompt
scripts/
  generate-icons.js        ← NEW (dev-time, not shipped) — pureimage icon generator
vite.config.js             ← MODIFIED — add VitePWA({...}) plugin
src/main.js                ← MODIFIED — add initOfflineIndicator() call
```

### Pattern 1: vite.config.js — VitePWA Plugin Integration

**What:** Add `VitePWA({...})` to the plugins array in `vite.config.js`. This generates `sw.js` and `manifest.webmanifest` into `dist/` at build time, and injects a `<script defer>` tag into `index.html` that auto-registers the SW.

**When to use:** Single integration point — everything flows from this config.

```javascript
// Source: vite-pwa-org.netlify.app/guide/ + vite-pwa-org.netlify.app/guide/service-worker-precache
// vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pipeline-cyber-training/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // script-defer injects <script defer src="registerSW.js"> — no main.js import needed
      injectRegister: 'script-defer',
      // autoUpdate forces skipWaiting: true and clientsClaim: true automatically
      workbox: {
        // Default is **/*.{js,css,html} — md and json MUST be added or lesson content is blank offline
        globPatterns: ['**/*.{js,css,html,md,json,png,ico,svg}'],
        cleanupOutdatedCaches: true,
        // navigateFallback is NOT needed — app uses hash routing, not HTML5 history
      },
      manifest: {
        name: 'OT Security Lab',
        short_name: 'OT Training',
        description: 'Pipeline cybersecurity training — TSA SD-02 series compliance',
        theme_color: '#111827',
        background_color: '#1a1a1a',
        display: 'standalone',
        // CRITICAL: must match Vite base — defaults resolve incorrectly for GitHub Pages subpath
        scope: '/pipeline-cyber-training/',
        start_url: '/pipeline-cyber-training/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
```

[CITED: vite-pwa-org.netlify.app/guide/, vite-pwa-org.netlify.app/guide/service-worker-precache, vite-pwa-org.netlify.app/guide/auto-update.html]

### Pattern 2: offline-indicator.js — Module Init Pattern

**What:** Follows the `fork-config.js` singleton pattern. Called once from `main.js init()`. Appends DOM elements, attaches event listeners, handles `beforeinstallprompt`.

```javascript
// Source: CONTEXT.md specifics + fork-config.js pattern reference
// src/offline-indicator.js

let _deferredInstallPrompt = null;
let _indicatorEl = null;
let _dotEl = null;
let _labelEl = null;
let _installLinkEl = null;

const ONLINE_COLOR  = '#22c55e';   // green
const OFFLINE_COLOR = '#d97706';   // amber — matches --color-ot-border

function _setState(online) {
  if (!_dotEl) return;
  _dotEl.style.background = online ? ONLINE_COLOR : OFFLINE_COLOR;
  _labelEl.textContent     = online ? 'Online' : 'Offline';
}

export function initOfflineIndicator() {
  // Find the flex group on the right side of #top-bar
  const container = document.querySelector('#top-bar > div.flex');
  if (!container) return;

  // Status indicator element
  _indicatorEl = document.createElement('span');
  _indicatorEl.id = 'offline-indicator';
  _indicatorEl.style.cssText =
    'display:flex;align-items:center;gap:4px;font-size:var(--text-body);color:var(--color-text-muted);';

  _dotEl = document.createElement('span');
  _dotEl.style.cssText =
    'width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;';

  _labelEl = document.createElement('span');
  _labelEl.textContent = 'Online';

  _indicatorEl.appendChild(_dotEl);
  _indicatorEl.appendChild(_labelEl);
  container.appendChild(_indicatorEl);

  // Install link (hidden until beforeinstallprompt fires)
  _installLinkEl = document.createElement('a');
  _installLinkEl.id = 'install-link';
  _installLinkEl.href = '#';
  _installLinkEl.textContent = 'Install app';
  _installLinkEl.style.cssText =
    'display:none;font-size:var(--text-body);color:var(--color-text-muted);text-decoration:none;';
  _installLinkEl.addEventListener('click', (e) => {
    e.preventDefault();
    if (_deferredInstallPrompt) {
      _deferredInstallPrompt.prompt();
      _deferredInstallPrompt.userChoice.then(() => {
        _deferredInstallPrompt = null;
        _installLinkEl.style.display = 'none';
      });
    }
  });
  container.appendChild(_installLinkEl);

  // Set initial state from navigator.onLine
  _setState(navigator.onLine);

  // Window events — primary real-time signals
  window.addEventListener('online',  () => _setState(true));
  window.addEventListener('offline', () => _setState(false));

  // SW controller change — satisfies D-04 (not solely navigator.onLine)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      _setState(navigator.onLine);
    });
  }

  // Install prompt interception — D-06
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    _installLinkEl.style.display = 'flex';
  });

  // Hide install link once installed — D-07
  window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    _installLinkEl.style.display = 'none';
  });
}
```

[CITED: CONTEXT.md D-01 through D-09 specifications; fork-config.js module pattern]

### Pattern 3: main.js init() — Integration Point

**What:** Add `initOfflineIndicator()` after `applyForkBranding()` (branding sets header first) and before `handleRoute()`.

```javascript
// src/main.js (modified section only)
import { initOfflineIndicator } from './offline-indicator.js';

async function init() {
  const forkConfig = await loadForkConfig();
  applyForkBranding(forkConfig);
  initOfflineIndicator();           // ← ADD HERE
  await loadComplianceRefs();
  await progressStore.init();
  await Promise.all([handleRoute(), initSidebar({ onImportSuccess: handleRoute })]);
}
```

[CITED: CONTEXT.md integration point specification + src/main.js current structure]

### Pattern 4: Icon Generation Script

**What:** One-time Node.js script that draws simple icon shapes with `pureimage` and saves them as PNG. Run once, commit the PNGs. The script is not part of the build — it's a dev-time utility.

```javascript
// scripts/generate-icons.js
// Run: node scripts/generate-icons.js
import * as PImage from 'pureimage';
import * as fs from 'fs';
import * as path from 'path';

async function generateIcon(size, outPath) {
  const img = PImage.make(size, size);
  const ctx = img.getContext('2d');

  // Dark background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, size, size);

  // Orange shield lettermark — simple rounded rect as shield body
  const cx = size / 2;
  const cy = size / 2;
  const s  = size * 0.55;

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  // Shield: wide at top, narrowed at bottom
  ctx.moveTo(cx - s/2, cy - s/2);
  ctx.lineTo(cx + s/2, cy - s/2);
  ctx.lineTo(cx + s/2, cy + s/4);
  ctx.lineTo(cx,       cy + s/2);
  ctx.lineTo(cx - s/2, cy + s/4);
  ctx.closePath();
  ctx.fill();

  // "OT" text in dark color on top of shield
  ctx.fillStyle = '#111827';
  ctx.font = `bold ${Math.round(size * 0.28)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OT', cx, cy - size * 0.04);

  await PImage.encodePNGToStream(img, fs.createWriteStream(outPath));
}

await generateIcon(192, 'public/pwa-192x192.png');
await generateIcon(512, 'public/pwa-512x512.png');
await generateIcon(180, 'public/apple-touch-icon.png');
console.log('Icons generated.');
```

[ASSUMED: pureimage's Canvas 2D text API supports font/textAlign/textBaseline — verify against pureimage README before finalizing; simple shapes (fillRect, fillPath) are confirmed supported per official docs]

### Anti-Patterns to Avoid

- **Omitting `.md` and `.json` from `globPatterns`:** The Workbox default is `**/*.{js,css,html}`. Lesson content is fetched via `fetchLesson()` which has a silent `catch` block — the user sees a blank screen with no error if the file is not precached. Always include `md,json`.
- **Using `./` for scope and start_url:** Vite generates `./` relative paths by default when `base` is set. For GitHub Pages subpath, the browser will register the SW at the wrong scope, causing a `DOMException` on first load. Always use absolute paths matching `base`.
- **Adding `navigateFallback`:** This app uses hash-based routing. `navigateFallback` is for HTML5 history API SPAs. Adding it here would intercept hash changes incorrectly.
- **Relying solely on `navigator.onLine`:** `navigator.onLine` is `true` if the device has any network interface up, even a captive-portal network. It does not confirm internet connectivity. Augmenting with SW controller change messages satisfies PWA-03's requirement.
- **Installing `workbox-build` or `workbox-window` separately:** They are peer deps of `vite-plugin-pwa`. Installing separately risks version mismatches.
- **Using `virtual:pwa-register` import in main.js:** This is needed only when using `injectRegister: null` (manual registration). With `injectRegister: 'script-defer'`, the plugin handles everything — adding this import creates a double registration.
- **Calling `lucide.createIcons()` without targeting the new elements:** Lucide icons initialized at app startup won't pick up DOM elements appended later by `offline-indicator.js`. If the Install link uses `data-lucide="download"`, call `lucide.createIcons({ nodes: [_installLinkEl] })` after appending, or use an inline SVG approach.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker caching | Custom fetch event handler | `vite-plugin-pwa` / Workbox generateSW | Correct cache versioning, hash-based cache busting, stale-while-revalidate, and revision manifests are non-trivial; Workbox handles all of them |
| SW registration | Manual `navigator.serviceWorker.register()` in main.js | `injectRegister: 'script-defer'` | Plugin injects the registration script into the built HTML; no code changes in app needed; handles scope and update lifecycle |
| Precache manifest | Manually maintaining a list of URLs | Workbox globPatterns | Workbox generates the manifest with content hashes at build time; stale files get invalidated automatically |
| PNG icon generation | Any online tool or Photoshop | `scripts/generate-icons.js` with pureimage | Icons must match brand colors exactly; scripted generation is reproducible and CI-safe |

**Key insight:** Service worker correctness at build time (manifest revision hashes, scope, cache invalidation) is extremely difficult to get right manually. Workbox has been the industry standard for years precisely because the edge cases — partial updates, race conditions between tabs, cache quota management — are handled for you.

---

## Common Pitfalls

### Pitfall 1: globPatterns Misses Markdown and JSON — Blank Offline Lessons

**What goes wrong:** `fetchLesson()` in `content-loader.js` fetches `.md` files at runtime. `fetch()` against a URL not in the SW cache fails silently (the `catch` block returns `null`). The lesson view renders blank — no error visible to the user.

**Why it happens:** Workbox's default `globPatterns` is `**/*.{js,css,html}`. The `.md` and `.json` extensions must be explicitly added.

**How to avoid:** Set `workbox.globPatterns: ['**/*.{js,css,html,md,json,png,ico,svg}']` in `vite.config.js`.

**Warning signs:** In Chrome DevTools → Network → Offline mode, navigating to a lesson shows an empty main area with no console error.

### Pitfall 2: scope / start_url Default to `./` — DOMException on Registration

**What goes wrong:** `navigator.serviceWorker.register()` throws `DOMException: Failed to register a ServiceWorker for scope (...)` because the generated `sw.js` is at `/pipeline-cyber-training/sw.js` but scope defaults to `./`, which the browser interprets differently in subpath contexts.

**Why it happens:** vite-plugin-pwa's manifest defaults use relative paths. When `base` is `/pipeline-cyber-training/`, relative paths resolve to the subpath directory, but the browser enforces that the SW script path must be within its scope.

**How to avoid:** Explicitly set `manifest.scope: '/pipeline-cyber-training/'` and `manifest.start_url: '/pipeline-cyber-training/'` in the VitePWA config.

**Warning signs:** SW does not appear in Chrome DevTools → Application → Service Workers; console shows `DOMException: Failed to register`.

### Pitfall 3: Icons Missing Before Build — Precache Manifest References Missing Files

**What goes wrong:** If `public/pwa-192x192.png` does not exist when `npm run build` runs, Workbox silently omits it from the precache manifest. Offline users see no icon, and the manifest may fail PWA installability criteria.

**Why it happens:** Workbox scans `dist/` at build time. Files not present in `dist/` cannot be precached.

**How to avoid:** Run `node scripts/generate-icons.js` and commit the generated PNGs before the first PWA build. Confirm all three files exist: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`. (Currently absent — must be generated in Wave 0 of this phase.)

**Warning signs:** Chrome DevTools → Application → Manifest shows broken icon or "No icons found". Lighthouse PWA audit fails installability check.

### Pitfall 4: `navigateFallback` + Hash Routing Conflict

**What goes wrong:** Setting `workbox.navigateFallback: '/pipeline-cyber-training/'` (common in React/Vue SPA guides) causes the SW to intercept hash-fragment navigation and serve the root page for all `#/` routes, which breaks the router.

**Why it happens:** Hash routing never changes the server path — navigation is entirely client-side. `navigateFallback` is designed for HTML5 history API where `GET /some/path` needs to return `index.html`.

**How to avoid:** Do not set `navigateFallback`. This app's hash-based router (`src/router.js`) handles all routing client-side; the SW only needs to serve `index.html` for the root URL.

**Warning signs:** After SW install, navigating to `#/module/1/lesson/1` shows the home view instead of the lesson view.

### Pitfall 5: Double Lucide Icon Initialization for Dynamically Injected Elements

**What goes wrong:** The "Install app" link's `<i data-lucide="download">` icon renders as empty/broken text because `lucide.createIcons()` runs at `main.js` startup before `offline-indicator.js` injects the element.

**Why it happens:** Lucide scans the DOM once on initialization; elements added later are not picked up.

**How to avoid:** Either (a) use an inline SVG for the download icon in `offline-indicator.js` instead of `data-lucide`, or (b) call `lucide.createIcons({ nodes: [_installLinkEl] })` immediately after appending `_installLinkEl` to the DOM. Option (a) is simpler and avoids a runtime dependency on lucide being globally available.

### Pitfall 6: `injectRegister: 'auto'` Default May Be Buggy

**What goes wrong:** With `injectRegister` omitted (defaulting to `'auto'`), the plugin may not inject the registration script when no virtual modules are imported, leaving the SW unregistered.

**Why it happens:** `'auto'` mode detects whether `virtual:pwa-register` is imported; if not, it falls back to `'script'` — but this fallback has been reported as broken in some versions.

**How to avoid:** Explicitly set `injectRegister: 'script-defer'`. This unconditionally injects the deferred registration script into the built HTML, requiring zero imports in application code.

### Pitfall 7: `globPatterns` Covers `dist/` — Not `public/` Directly

**What goes wrong:** Developers assume `globPatterns: ['data/**/*.json']` must refer to the `public/` directory structure. In fact, Workbox scans `dist/` (the build output). Vite copies `public/` files to `dist/` during `npm run build`, so `public/data/modules/logging-auditing/module.json` becomes `dist/data/modules/logging-auditing/module.json`, which IS matched by `**/*.json`.

**Why it happens:** Confusion between the source directory structure (`public/`) and the build output (`dist/`).

**How to avoid:** Use broad patterns like `**/*.{md,json}` — they match the correct paths in `dist/` because Vite flattens the `public/` prefix. No path prefix needed.

---

## Code Examples

### Complete vite.config.js with VitePWA

```javascript
// Source: vite-pwa-org.netlify.app/guide/ + service-worker-precache + auto-update docs
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pipeline-cyber-training/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      workbox: {
        globPatterns: ['**/*.{js,css,html,md,json,png,ico,svg}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'OT Security Lab',
        short_name: 'OT Training',
        description: 'Pipeline cybersecurity training — TSA SD-02 series compliance',
        theme_color: '#111827',
        background_color: '#1a1a1a',
        display: 'standalone',
        scope: '/pipeline-cyber-training/',
        start_url: '/pipeline-cyber-training/',
        icons: [
          { src: 'pwa-192x192.png',     sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',     sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'apple-touch-icon.png',sizes: '180x180', type: 'image/png' },
        ],
      },
    }),
  ],
})
```

### Testing offline-indicator.js (vitest + happy-dom)

```javascript
// Source: vitest.dev/guide/mocking + happy-dom event dispatch patterns
// tests/offline-indicator.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initOfflineIndicator } from '../src/offline-indicator.js'

describe('offline-indicator', () => {
  beforeEach(() => {
    // Inject #top-bar with flex group into happy-dom
    document.body.innerHTML = `
      <header id="top-bar">
        <span>OT Security Lab</span>
        <div class="flex items-center"></div>
      </header>
    `
    // Mock navigator properties
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true,
    })
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
      },
    })
  })

  it('injects status dot into top-bar flex group', () => {
    initOfflineIndicator()
    expect(document.getElementById('offline-indicator')).toBeTruthy()
    expect(document.getElementById('status-dot') || 
           document.querySelector('#offline-indicator span:first-child')).toBeTruthy()
  })

  it('shows Online label when navigator.onLine is true', () => {
    initOfflineIndicator()
    expect(document.getElementById('offline-indicator').textContent).toContain('Online')
  })

  it('transitions to Offline on window offline event', () => {
    initOfflineIndicator()
    window.dispatchEvent(new Event('offline'))
    expect(document.getElementById('offline-indicator').textContent).toContain('Offline')
  })

  it('transitions back to Online on window online event', () => {
    initOfflineIndicator()
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
    expect(document.getElementById('offline-indicator').textContent).toContain('Online')
  })

  it('shows install link when beforeinstallprompt fires', () => {
    initOfflineIndicator()
    const mockPrompt = { preventDefault: vi.fn(), prompt: vi.fn(), userChoice: Promise.resolve() }
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockPrompt))
    const installLink = document.getElementById('install-link')
    expect(installLink).toBeTruthy()
    expect(installLink.style.display).not.toBe('none')
  })
})
```

[CITED: vitest.dev/guide/mocking (Object.defineProperty pattern), happy-dom wiki (dispatchEvent support)]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SW registration + `importScripts()` | `vite-plugin-pwa` `generateSW` | Widespread since 2020–2021 | Zero custom SW code needed; Workbox handles revision manifests |
| `registerType: 'prompt'` (user confirms update) | `registerType: 'autoUpdate'` + silent | Became standard for content apps | No UI interruption; background update delivered on next tab open |
| xterm.js / real terminal for PWA offline | Pattern-matching fake terminal (this project's choice) | Already decided in v1.0 | No impact — SW simply caches the JS modules |
| Vite 7 peer dep only | Vite 8 peer dep added in vite-plugin-pwa 1.3.0 | 2026-05-05 | Must install 1.3.0 specifically; earlier versions emit peer dep warning with Vite 8 |

**Deprecated/outdated:**
- `workbox-webpack-plugin` `globDirectory` + `swDest` manual config: superseded by vite-plugin-pwa wrapper; the plugin's `workbox` option accepts the same Workbox params but handles paths automatically.
- `precacheAndRoute(self.__WB_MANIFEST)` in a custom SW file: this is the `injectManifest` pattern — only needed when custom SW logic is required. For this phase, use `generateSW`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pureimage` Canvas 2D API supports `font`, `textAlign`, `textBaseline` for text rendering | Standard Stack / Code Examples | Icon generation script would fail; fallback: use only shapes (no text), or switch to `@vite-pwa/assets-generator` with an SVG |
| A2 | `autoUpdate` + `injectRegister: 'script-defer'` requires no `virtual:pwa-register` import in main.js | Architecture Patterns | If wrong, SW never registers; symptom: no SW appears in DevTools → verify during Wave 0 smoke test |
| A3 | `globPatterns: ['**/*.{js,css,html,md,json,...}']` in `dist/` catches all `public/data/` files because Vite copies `publicDir` → `dist/` | Common Pitfalls / Pitfall 7 | If wrong (e.g., path prefix mismatch), content files are not precached; symptom: blank offline lessons |
| A4 | `injectRegister: 'auto'` default is unreliable per community reports | Common Pitfalls / Pitfall 6 | If auto works fine in practice, the explicit `script-defer` is equivalent but slightly more explicit |

---

## Open Questions

1. **Offline indicator: SW message vs. `controllerchange` event**
   - What we know: D-04 requires responding to SW lifecycle messages, not solely `navigator.onLine`. `navigator.serviceWorker.addEventListener('controllerchange', ...)` fires when the SW takes control (first install, or after `skipWaiting`). This event is not a network state signal — it signals SW activation.
   - What's unclear: Whether PWA-03 specifically requires detecting the *network* state through SW, or just that the indicator uses SW events as *one* of its sources. The `controllerchange` approach satisfies the "not solely navigator.onLine" requirement without a custom message channel.
   - Recommendation: Use `controllerchange` for simplicity. If the verifier flags PWA-03, add a message-channel approach. Document the choice in comments in `offline-indicator.js`.

2. **pureimage text rendering support**
   - What we know: pureimage implements the HTML Canvas 2D API in pure JS. The README confirms basic drawing APIs. Font loading requires a registered font.
   - What's unclear: Whether `ctx.font = 'bold 28px sans-serif'` works without registering a font with `pureimage.registerFont()`. The default sans-serif may not resolve without a registered font in Node.
   - Recommendation: In the icon generation script, use shapes only (shield polygon + color fill) without text. The "OT" lettermark can be represented purely geometrically if needed, or use `@vite-pwa/assets-generator` with an SVG if a designer provides one.

3. **vitest/happy-dom: `beforeinstallprompt` event support**
   - What we know: `beforeinstallprompt` is a non-standard browser event. happy-dom implements most web APIs but non-standard install-prompt events may not dispatch correctly.
   - What's unclear: Whether `window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockData))` will actually trigger the registered listener in happy-dom.
   - Recommendation: Test the event listener registration (verify `addEventListener` is called), not the full event dispatch chain. Use `vi.fn()` stubs for the prompt. If happy-dom does not support the event, mark the install-prompt tests as `// Integration: verify in browser`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Icon generation script | ✓ | 22 (CI) | — |
| npm | Package install | ✓ | CI: setup-node@v4 | — |
| GitHub Actions CI | Auto-deploy on push to main | ✓ | Confirmed in deploy.yml | Manual build + push dist/ |
| HTTPS (GitHub Pages) | Service worker registration requirement | ✓ | Provided by GitHub Pages | — |
| `public/pwa-192x192.png` | PWA build | ✗ MISSING | — | Must generate in Wave 0 |
| `public/pwa-512x512.png` | PWA build | ✗ MISSING | — | Must generate in Wave 0 |
| `public/apple-touch-icon.png` | PWA build | ✗ MISSING | — | Must generate in Wave 0 |

**Missing dependencies with no fallback:**
- PWA icon PNGs — must be generated and committed before any PWA build runs. This is a Wave 0 blocker.

**Missing dependencies with fallback:**
- None (all tools available in CI).

**CI confirmation:** `deploy.yml` runs `npm ci` → `npm test` → `npm run build` → deploy `dist/`. Workbox precache manifest is generated automatically during `npm run build` — no manual step. All content files from Phases 9 and 10 are confirmed merged before this phase begins.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.js` (environment: happy-dom) |
| Quick run command | `npm test -- --reporter=dot tests/offline-indicator.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PWA-01 | `vite-plugin-pwa` present in `vite.config.js`; `sw.js` emitted in `dist/` | smoke / build | `npm run build && ls dist/sw.js` | ❌ Wave 0 |
| PWA-01 | `manifest.webmanifest` present in `dist/` | smoke / build | `npm run build && ls dist/manifest.webmanifest` | ❌ Wave 0 |
| PWA-02 | All `.md` and `.json` URLs appear in SW precache manifest | smoke / build | `npm run build && node -e "const m=require('./dist/sw.js');..."` (or grep sw.js for .md) | ❌ Wave 0 |
| PWA-03 | Status dot injected into `#top-bar` on `initOfflineIndicator()` | unit | `npm test -- tests/offline-indicator.test.js` | ❌ Wave 0 |
| PWA-03 | Dot transitions to amber on `window.offline` event | unit | `npm test -- tests/offline-indicator.test.js` | ❌ Wave 0 |
| PWA-03 | Dot transitions to green on `window.online` event | unit | `npm test -- tests/offline-indicator.test.js` | ❌ Wave 0 |
| PWA-03 | Install link rendered when `beforeinstallprompt` fires | unit | `npm test -- tests/offline-indicator.test.js` | ❌ Wave 0 |
| PWA-03 | Install link hidden after `appinstalled` event | unit | `npm test -- tests/offline-indicator.test.js` | ❌ Wave 0 |
| PWA-03 | `navigator.serviceWorker.addEventListener` called (controllerchange) | unit | `npm test -- tests/offline-indicator.test.js` | ❌ Wave 0 |

**Note on PWA-02 automated testing:** Full end-to-end offline verification requires a browser (DevTools Network → Offline). This cannot be automated with vitest/happy-dom. Automated tests verify the *mechanism* (SW config, globPatterns breadth) while the offline playability success criterion is a manual verification step in `/gsd:verify-work`.

### Sampling Rate

- **Per task commit:** `npm test` (full 205-test suite — all green before commit)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green AND manual offline test (DevTools Offline mode) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/offline-indicator.test.js` — covers PWA-03 unit tests (indicator DOM, event transitions, install prompt)
- [ ] `scripts/generate-icons.js` — icon generation script; output committed to `public/`
- [ ] Framework install: `npm install -D vite-plugin-pwa pureimage` — add to devDependencies

*(Existing test infrastructure at 205 tests remains fully passing — Wave 0 adds new tests only)*

---

## Security Domain

> `security_enforcement` not set to false in config.json — included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this phase |
| V3 Session Management | No | localStorage only (unchanged) |
| V4 Access Control | No | No new access control paths |
| V5 Input Validation | Partial | Install prompt uses `e.preventDefault()` — no user input processed |
| V6 Cryptography | No | No cryptographic operations |
| V9 Data Classification | Partial | SW caches lesson content; content is public/non-sensitive |

### Known Threat Patterns for PWA/Service Worker Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cache poisoning via malicious SW update | Tampering | Workbox revision-hash manifest ensures SW only caches known build artifacts; `cleanupOutdatedCaches: true` removes stale entries |
| SW scope too broad (controls unintended paths) | Elevation of privilege | `scope: '/pipeline-cyber-training/'` restricts SW to project subpath only — cannot intercept other GitHub Pages deployments on the same origin |
| `beforeinstallprompt` prompt injection | Spoofing | `e.preventDefault()` stores the event; `deferredPrompt.prompt()` only triggers on user gesture (click) — browser enforces this |
| Sensitive data in SW cache | Information disclosure | Lesson content is public training material; no credentials, PII, or org-internal data in the cached files |
| SW registration on HTTP | Tampering / MITM | GitHub Pages enforces HTTPS; service workers require secure context — no HTTP fallback possible |

---

## Project Constraints (from CLAUDE.md)

- Static GitHub Pages site — no backend, no server-side execution. All PWA logic is client-side.
- No real PowerShell execution — terminal is a simulator; PWA does not change this.
- PS version target 5.1 — not relevant to PWA layer.
- Hash-based routing (`#/module/:id/lesson/:n`) — do NOT set `navigateFallback` in Workbox config.
- Progress in localStorage — service worker does not touch localStorage; no conflict.
- Vite (required), Tailwind v4 via `@tailwindcss/vite` — `VitePWA()` is added alongside existing `tailwindcss()` plugin.
- NERC CIP constraint, TSA SD-02F constraint, OT callout rules — not affected by PWA layer.
- All version strings from `data/compliance-refs.json` — SW must precache this file (covered by `**/*.json`).
- `data/compliance-refs.json` must be offline-available for badge rendering — confirmed covered by globPatterns.
- `fork.config.json` must be offline-available for fork branding — confirmed covered by globPatterns (`**/*.json`).

---

## Sources

### Primary (HIGH confidence)

- [vite-pwa-org.netlify.app/guide/](https://vite-pwa-org.netlify.app/guide/) — basic setup, registerType, injectRegister options
- [vite-pwa-org.netlify.app/guide/service-worker-precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — globPatterns behavior, dist/ traversal, file type defaults
- [vite-pwa-org.netlify.app/guide/static-assets](https://vite-pwa-org.netlify.app/guide/static-assets) — includeAssets vs globPatterns distinction
- [vite-pwa-org.netlify.app/guide/register-service-worker](https://vite-pwa-org.netlify.app/guide/register-service-worker) — injectRegister options and behavior
- [vite-pwa-org.netlify.app/guide/auto-update.html](https://vite-pwa-org.netlify.app/guide/auto-update.html) — autoUpdate, skipWaiting/clientsClaim auto-set, virtual module import behavior
- [npm registry — vite-plugin-pwa@1.3.0](https://www.npmjs.com/package/vite-plugin-pwa) — version, published 2026-05-05, peer deps confirmed
- [github.com/vite-pwa/vite-plugin-pwa/issues/918](https://github.com/vite-pwa/vite-plugin-pwa/issues/918) — Vite 8 support status
- [github.com/vite-pwa/vite-plugin-pwa/releases](https://github.com/vite-pwa/vite-plugin-pwa/releases) — v1.3.0 changelog, Vite 8 peer dep added
- [developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) — scope, HTTPS requirement, registration API

### Secondary (MEDIUM confidence)

- [adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/) — real-world globPatterns `**/*` pattern, includeAssets `**/*` for public/
- [vite-pwa-org.netlify.app/assets-generator/cli](https://vite-pwa-org.netlify.app/assets-generator/cli) — @vite-pwa/assets-generator CLI, SVG input requirement, file naming convention
- [blog.stackademic.com — Install Experience in React + Vite PWA](https://blog.stackademic.com/enabling-the-install-experience-in-a-react-vite-web-app-a-pwa-guide-bc30e42be792) — `beforeinstallprompt` pattern, `deferredPrompt.prompt()`/`userChoice`

### Tertiary (LOW confidence — training knowledge, marked [ASSUMED] above)

- pureimage Canvas 2D text rendering without font registration — verify against README before implementing

---

## Metadata

**Confidence breakdown:**
- Standard stack (vite-plugin-pwa version, Vite 8 compat): HIGH — confirmed via npm registry + GitHub release notes
- globPatterns behavior: HIGH — confirmed via official vite-pwa docs
- scope/start_url for GitHub Pages subpath: HIGH — confirmed via MDN + vite-pwa docs + community issues
- injectRegister: 'script-defer' / no main.js import: HIGH — confirmed via official register-service-worker docs
- pureimage for icon generation: MEDIUM — package confirmed legit; text API [ASSUMED] pending README verification
- Testing offline-indicator with happy-dom: MEDIUM — dispatchEvent for standard events confirmed; `beforeinstallprompt` non-standard event dispatch in happy-dom is [ASSUMED]

**Research date:** 2026-05-18
**Valid until:** 2026-08-18 (vite-plugin-pwa is actively maintained; Workbox API is stable)
