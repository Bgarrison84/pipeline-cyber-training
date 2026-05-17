# Stack Research — v2.0

**Project:** Pipeline Cyber Training
**Researched:** 2026-05-17
**Scope:** Additions only — existing v1.0 stack is not re-researched here.

---

## Confirmed Existing Stack (Do Not Change)

From `package.json` at v1.0 archive:

| Package | Version in Use |
|---------|----------------|
| vite | 8.0.12 |
| @tailwindcss/vite | 4.3.0 |
| tailwindcss | 4.3.0 |
| marked | 18.0.3 |
| shiki | 4.0.2 |
| lucide | 1.14.0 |
| vitest | 4.1.6 |
| happy-dom | 20.9.0 |

Note: `marked` is already at v18 (not v17 as in v1.0 research — the package has continued to version). This is relevant because the v1.0 STACK.md referenced v17; actual installed version is 18.0.3.

---

## PWA / Service Worker

### Recommendation: `vite-plugin-pwa` v1.3.0

**Library:** `vite-plugin-pwa`
**Current version:** 1.3.0 (released May 5, 2026)
**Vite compatibility:** `^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0` — confirmed compatible with the project's Vite 8.0.12.
**Workbox version bundled:** Workbox 7.3.0+ (updated in v0.21.0, carried through v1.x).
**Confidence:** HIGH — official GitHub releases page confirmed.

**Why this library over alternatives:**

`vite-plugin-pwa` is the canonical PWA solution for the Vite ecosystem. It wraps Workbox (Google's service worker toolkit) behind a single Vite plugin registration — no separate service worker file to hand-maintain. The plugin handles manifest injection, asset precaching, and update registration automatically.

Alternatives rejected:
- **Manual service worker:** ~300+ lines of boilerplate to replicate what vite-plugin-pwa generates; maintenance burden with each content addition.
- **Workbox CLI directly:** Requires a separate build step outside Vite; plugin integration is cleaner.
- **Partytown / other exotic approaches:** Not relevant — the problem is caching, not thread offloading.

**Configuration for this project:**

The project serves lesson Markdown files and quiz/exercise JSON from the `data/` directory (copied to `dist/` by Vite). These are not emitted as Vite-transformed modules — they are static files. The critical configuration decision:

Use `generateSW` strategy (the default). Configure `workbox.globPatterns` to include JSON and Markdown alongside the default JS/CSS/HTML pattern. Per official docs, if you override `globPatterns` you **must** include all asset types or the service worker will miss resources.

```js
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json,md}'],
    // Cache lesson content and JSON data files
    runtimeCaching: [
      {
        urlPattern: /\/data\/.+\.(json|md)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'lesson-content',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }
        }
      }
    ]
  },
  manifest: {
    name: 'Pipeline Cyber Training',
    short_name: 'PipelineTrain',
    description: 'PowerShell & cybersecurity compliance training for pipeline IT/OT admins',
    theme_color: '#1e293b',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
})
```

**`registerType: 'autoUpdate'`** is correct for a training app: when a new version is deployed, the service worker updates silently on next navigation. There is no user-controlled content (no risk of losing unsaved state mid-lesson beyond what localStorage already persists).

**GitHub Pages compatibility:** Fully compatible. The generated service worker file (`sw.js`) is a static JS file in `dist/` — GitHub Pages serves it without issue. The only constraint is that `sw.js` must be at the root scope; Vite PWA handles this correctly when `base` is set in Vite config.

**Hash routing:** No special configuration needed. Hash-based URLs (`#/module/...`) are handled entirely client-side; the service worker precaches the single `index.html` entry point, which is all that is needed.

**Install command:**
```bash
npm install -D vite-plugin-pwa
```

**PWA asset generation:** The plugin requires icon files (192x192, 512x512 PNG minimum). Use `@vite-pwa/assets-generator` (separate package, optional) to generate icons from a single source SVG, or create icons manually.

---

## Fork Configuration System

### Recommendation: Runtime `fetch('/fork.config.json')` on startup, no new library

**Approach:** Place `fork.config.json` in `public/` (Vite copies it unchanged to `dist/`). Load it at application startup with a plain `fetch()` call before rendering the sidebar or header. Fall back to hardcoded defaults if the file does not exist (HTTP 404) or is malformed.

**Why no library is needed:**

The fork config problem is: "let an org that forks this repo replace org name, logo, active module list, and compliance-refs overrides without modifying source code." The solution is a JSON file in `public/` that Vite copies verbatim — no build-time baking, no environment variables, no server-side processing.

```js
// src/fork-config.js
const DEFAULTS = {
  orgName: 'Pipeline Cyber Training',
  logoPath: null,
  activeModules: ['logging-auditing', 'network-hardening', 'account-access', 'incident-response', 'patch-management'],
  complianceRefsOverride: null,
};

let config = { ...DEFAULTS };

export async function loadForkConfig() {
  try {
    const res = await fetch('./fork.config.json');
    if (!res.ok) return; // file absent = use defaults (public repo deployment)
    const data = await res.json();
    config = { ...DEFAULTS, ...data };
  } catch {
    // malformed JSON or network error — silently use defaults
  }
}

export function getForkConfig() { return config; }
```

**Integration with existing `content-loader.js` and `progress-store.js`:** Call `loadForkConfig()` once in `main.js` before the router initializes. Both modules then call `getForkConfig()` synchronously (since config is already loaded).

**`fork.config.json` example (public repo default — can be empty or absent):**
```json
{
  "orgName": "ExampleCorp Pipeline Safety",
  "logoPath": "/assets/examplecorp-logo.svg",
  "activeModules": ["logging-auditing", "incident-response", "patch-management"],
  "complianceRefsOverride": {
    "tsaDirective": "SD-03A"
  }
}
```

**GitHub Pages compatibility:** The file lives in `public/` and is served as a static file at the root URL. No server configuration required. `fetch('./fork.config.json')` works identically in development (`vite dev`) and production (GitHub Pages).

**Service worker interaction:** The fork config file must be included in the PWA precache (`globPatterns` already covers `.json`). When the service worker updates, it re-fetches the config — correct behavior since a fork deployment update would include config changes.

**No new npm dependency required.** This is ~30 lines of vanilla JS.

---

## Cross-Device Progress Sync

### Options Analysis

| Approach | Complexity | Static-site compatible | Auth required | Survives fork deployment | Recommended |
|----------|------------|----------------------|---------------|--------------------------|-------------|
| **Enhanced JSON export/import** (existing DATA-05 + QR/URL share) | Low | Yes | No | Yes | Tier 1 for MVP |
| **GitHub Gist API** (user provides own PAT) | Medium | Yes (CORS allowed) | Yes — GitHub PAT | Yes | Tier 2 |
| **Supabase anonymous auth** | High | Yes | No (anon) or Yes (permanent) | No — requires Supabase project setup | Tier 3 — major caveat |
| **Cloudflare Workers KV** | High | Yes | Optional | No — requires CF account | Rejected |
| **URL-encoded state (full progress in URL hash)** | Low-Medium | Yes | No | Yes | Edge case only — progress too large |

### SYNC-01 ADR Recommendation: Tiered approach

**Tier 1 (implement in v2.0): Enhanced export/import with shareable URL**

The existing JSON export (DATA-05) already produces a complete progress blob. Extend it with:
- **QR code generation** from the exported JSON (compressed with `lz-string` or similar). A QR code can encode ~2KB of alphanumeric data reliably; compressed progress for 5 modules with quiz scores is well within this limit.
- **Shareable URL**: Base64-encode the compressed JSON and append it as a URL fragment (`#sync=<data>`). On app load, detect this parameter, prompt the user to import, then strip it from the URL.

This requires one small library:

**`lz-string`** — LZ-based compression for strings (specifically designed for URL/localStorage use)
- npm: `lz-string`
- Version: 1.5.0 (current stable; actively maintained)
- Size: ~8KB minified
- Purpose: Compress progress JSON before Base64 encoding to keep QR codes and URLs scannable
- No auth, no external service, no backend
- Confidence: HIGH

For QR code generation (client-side):
**`qrcode`** — pure JS QR code generator
- npm: `qrcode`
- Version: 1.5.4 (current stable)
- Size: ~30KB minified
- Renders to canvas or SVG, no external dependencies
- Confidence: HIGH

**Tier 2 (optional, implement if Tier 1 proves insufficient): GitHub Gist API**

The GitHub REST API supports CORS from any browser origin (`Access-Control-Allow-Origin: *`). A user can provide their own GitHub PAT in the app UI (stored in localStorage, never transmitted to any server the project controls). The app uses it to create/update a Gist with the progress JSON.

Key constraints:
- PAT must be scoped to `gist` only — document this clearly in UI
- PAT exposure in browser localStorage is a known risk — acceptable for a training app with no sensitive data; document it
- GitHub API rate limit: 5,000 requests/hour for authenticated requests — no practical concern for this use case
- Reading a public gist requires no auth — only writing requires the PAT

This approach is viable but introduces UI complexity (PAT entry, explain what it is to non-developers) that may be too high a friction for the target audience (IT/OT admins, not GitHub users). Defer to post-SYNC-01 ADR decision.

**Tier 3 (rejected for v2.0): Supabase**

Supabase free tier pauses after **7 days of database inactivity**. For a training tool used episodically (e.g., a student completes modules over 2 weeks then stops), the project database would pause before the next cohort starts. Unpausing requires manual intervention or a heartbeat cron job — this is operational overhead incompatible with the zero-ops GitHub Pages philosophy.

Additionally: Supabase requires the project owner to maintain a Supabase project. A forked deployment would need its own Supabase project. This breaks the fork-and-deploy simplicity that is a core project goal (FORK-01 through FORK-03).

Anonymous Supabase auth creates database rows per anonymous user with no auto-cleanup. Preventing database bloat requires implementing cleanup jobs — more ops overhead.

**Verdict:** Supabase is architecturally incompatible with the project's zero-ops, forkable static site constraints. Do not add it in v2.0.

### Recommended Implementation for SYNC-01/SYNC-02

```bash
npm install lz-string qrcode
```

- `lz-string`: compress progress JSON before URL-encoding
- `qrcode`: generate scannable QR code in the export UI

The sync flow:

1. User clicks "Share Progress" in the existing export UI
2. App compresses progress JSON with `lz-string`, Base64-encodes it
3. App generates a QR code (canvas element shown inline) and a copyable URL with the data as a URL fragment
4. On a second device, user opens the URL or scans the QR code
5. App detects the sync fragment on load, decodes and decompresses, prompts "Import progress from another device?" with a preview (X modules completed, last visited Y)
6. User confirms → progress merged (completed lessons union, higher quiz scores win)

This is fully offline-capable (the QR code or URL works without any external service), requires no auth, survives any fork deployment, and complements the existing DATA-05 JSON export.

---

## No New Stack Needed

**Deeper content (CONT-05, CONT-06, CONT-07):** Adding more `.md` lesson files, `.json` quiz/exercise/scenario files, and frontmatter entries requires zero new tooling. The existing `content-loader.js` → `marked.js` + `shiki` pipeline handles any number of lesson files. The `data/` directory structure already accommodates additional files.

**SME review artifacts (SME-01, SME-02, SME-03):** Markdown documents in the repository. No tooling needed.

**Fork deployment guide (FORK-01):** A Markdown document. No tooling needed.

**TSA compliance-refs update (SME-01):** Edit `data/compliance-refs.json`. No tooling needed.

**Offline indicator (PWA-02, PWA-03):** The `navigator.onLine` property and `window` online/offline events are native browser APIs. A small vanilla JS module (~20 lines) that listens to these events and toggles a CSS class on a status badge covers PWA-03 with no library. The service worker sends a message to the main thread on activation (first install = now offline-capable), which can trigger the "offline ready" state in the UI.

---

## What NOT to Add

| Candidate | Why Not |
|-----------|---------|
| **Supabase** | Free tier pauses after 7 days inactivity — operational overhead incompatible with zero-ops static site philosophy. Breaks fork deployments (each fork needs its own Supabase project). Anonymous session cleanup requires ops work. Rejected for v2.0. |
| **Firebase / Firestore** | Same class of problem as Supabase — requires external service, billing account, and per-fork configuration. Zero-ops constraint eliminates it. |
| **Auth0 / Clerk / NextAuth** | Full auth is explicitly out of scope for v2.0. Progress sync does not require persistent user identity — a shareable token/QR approach avoids auth entirely. |
| **workbox (standalone)** | `vite-plugin-pwa` wraps Workbox with Vite integration. Using Workbox CLI directly adds a separate build step with no benefit. |
| **@vite-pwa/assets-generator** | Useful for icon generation but is a one-time tool, not a runtime dependency. Run it once during PWA setup, generate the PNG files, commit them. Don't add as a project dependency. |
| **Webpack / Parcel / Rollup directly** | Vite 8 already uses Rollup internally. No reason to replace the build tool for PWA support. |
| **`idb` (IndexedDB wrapper)** | localStorage at ~50KB for 5 modules stays well within the 5MB limit. IndexedDB adds complexity with no benefit at this data scale. Only relevant if storing binary blobs (lesson audio/video — explicitly out of scope). |
| **React Query / SWR for data fetching** | Lesson content is loaded once per navigation via a simple `fetch()` in `content-loader.js`. A reactive data fetching library is architectural overkill for this access pattern. |
| **Full text search (Lunr.js, FlexSearch)** | Not a v2.0 requirement. If search is added later, FlexSearch is the right choice (~30KB) — but do not pre-add it. |
| **`gray-matter` for frontmatter** | Was flagged as a gap in v1.0 research. Confirmed: v1.0 did not add it (content uses JSON sidecars, not Markdown frontmatter). Do not add unless the lesson authoring contract changes to frontmatter — evaluate in content phase. |

---

## Installation Summary (New v2.0 Additions Only)

```bash
# PWA support
npm install -D vite-plugin-pwa

# Progress sync (Tier 1: URL/QR share)
npm install lz-string qrcode
```

**Total new dependencies:** 3 packages (1 dev, 2 runtime)

---

## Sources

- vite-plugin-pwa GitHub releases: https://github.com/vite-pwa/vite-plugin-pwa/releases
- vite-plugin-pwa official docs (static assets): https://vite-pwa-org.netlify.app/guide/static-assets.html
- vite-plugin-pwa service worker strategies: https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors.html
- GitHub REST API CORS: https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests
- GitHub Gist API: https://docs.github.com/en/rest/gists/gists
- Supabase anonymous auth: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase free tier pause behavior: https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263
- MDN — offline PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- Workbox generateSW: https://developer.chrome.com/docs/workbox/modules/workbox-build#method-generateSW
