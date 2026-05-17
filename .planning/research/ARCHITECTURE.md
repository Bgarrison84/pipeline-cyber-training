# Architecture Research — v2.0

**Project:** Pipeline Cyber Training
**Researched:** 2026-05-17
**Milestone:** v2.0 — Content Depth & Platform Maturity
**Confidence:** HIGH (all key integration patterns verified against library docs and live codebase inspection)

> This file replaces the v1.0 architecture research. For historical reference, the v1.0 content
> is archived at `.planning/milestones/v1.0-phases/`.

---

## Existing Architecture Baseline (v1.0 — as shipped)

Key facts from the live codebase before detailing per-feature integration:

- **`src/main.js`** is the startup orchestrator: fetches `compliance-refs.json`, inits `progressStore`, then renders sidebar and initial route in parallel.
- **`src/modules-config.js`** is the single source of truth for module/lesson metadata — sidebar, content-loader, quiz-engine, and scenario-engine all import `MODULES` from it. It is a plain ES module with a static array export.
- **`src/progress-store.js`** owns ALL localStorage. `schemaVersion` is hardcoded `1`. Migration runner is a named chain already wired for future versions with a comment: `// When v1->v2 is needed, add: if (d.schemaVersion === 1) { d = migrateV1toV2(d); }`.
- **`public/data/`** is the static content tree. All files are fetched at runtime via `import.meta.env.BASE_URL` prefix.
- **Vite `base`** is `/pipeline-cyber-training/`. ALL asset and fetch URLs respect this prefix.
- **167 passing Vitest tests** with happy-dom. Test setup in `tests/setup.js`. The Wave-0 stub file pattern is established.
- **`src/sidebar.js`** runs `checkLessonAvailability()` (HEAD fetch) for every lesson in `MODULES` at init time — a lesson entry with no matching `.md` file renders as greyed-out automatically.
- **`parseFrontmatter()`** in `content-loader.js` handles arbitrary key-value pairs already; no parser change needed for new frontmatter fields.

---

## Feature: Deeper Content (CONT-05, CONT-06, CONT-07)

**New files:**
```
public/data/modules/<module>/lessons/<new-id>.md    (2+ per module × 5 modules = ≥10 files)
public/data/modules/<module>/scenarios/<new-id>.json (1 advanced scenario per module = 5 files)
```

**Modified files:**
- `public/data/modules/<module>/quizzes/<id>.json` — add ≥3 questions to each existing quiz file (5 files, data-only edits)
- `src/modules-config.js` — add new lesson entries to each module's `lessons[]` array; add `scenarioId` references for new advanced scenarios

**Integration point:** The sidebar calls `checkLessonAvailability()` for every entry in `MODULES`. A new lesson entry in `modules-config.js` with a corresponding `.md` file appears as an active link automatically; without the `.md` file it renders greyed-out. The `getLessonNav()` function in `content-loader.js` derives prev/next from `MODULES` array order — lesson ordering is purely positional in the array. No engine changes are required: content additions are data-only.

**Phase dependency:** None upstream. Can begin immediately. Finalizing content before the PWA phase is strongly preferable — the Workbox precache manifest is built from the `dist/` directory at build time, so any lesson files added after PWA is installed will not be cached until the next service worker update cycle.

**Schema impact:** None. Progress keys are `"moduleId/lessonId"` strings. New lessons generate new keys automatically within the existing schema.

---

## Feature: Fork Configuration System (FORK-01, FORK-02, FORK-03)

**New files:**
```
public/fork.config.json     (ships with repo; defaults match current public deployment)
src/fork-config.js          (loader module; returns resolved config object)
docs/FORK-GUIDE.md          (step-by-step internal deployment guide — FORK-01)
```

**Modified files:**
- `src/main.js` — add `await loadForkConfig()` as the FIRST async call in `init()`, before `loadComplianceRefs()`. Fork config may override compliance refs, so load order matters.
- `index.html` — replace the two hardcoded `"OT Security Lab"` strings (page `<title>` and the header `<span>`) with a placeholder that `main.js` fills in from fork config after load.
- `src/modules-config.js` — convert from a plain array export to a `getModules()` function that returns `MODULES` filtered/ordered by `forkConfig.activeModules` if set. All existing consumers (`sidebar.js`, `content-loader.js`, `quiz-engine.js`) switch from `import { MODULES }` to `import { getModules }` and call `getModules()`.
- `src/sidebar.js` — replace hardcoded compliance nav links with fork-config-aware rendering. Add optional logo injection if `forkConfig.logoPath` is set.
- `public/data/compliance-refs.json` — fork config may supply override values; the loader merges fork overrides on top of the canonical file values.

**`public/fork.config.json` schema (all fields optional; null = use defaults):**
```json
{
  "orgName": "OT Security Lab",
  "logoPath": null,
  "activeModules": null,
  "complianceRefsOverrides": {}
}
```

**`src/fork-config.js` pattern:**
```javascript
let _forkConfig = null;
export async function loadForkConfig() {
  const url = import.meta.env.BASE_URL + 'fork.config.json';
  try {
    const res = await fetch(url);
    if (res.ok) _forkConfig = await res.json();
  } catch { /* no fork config — use defaults */ }
  _forkConfig = _forkConfig ?? {};
}
export function getForkConfig() { return _forkConfig ?? {}; }
```

**Updated `main.js` init sequence:**
```
loadForkConfig()
  → loadComplianceRefs() (with fork overrides applied)
    → progressStore.init()
      → handleRoute() + initSidebar() [parallel]
```

**Integration point:** Fork config is a startup-only read. It is never persisted. All downstream modules that need config values call `getForkConfig()` synchronously after `loadForkConfig()` has resolved. The `activeModules` filter in `getModules()` is the only behavioral change — all other fork config values are cosmetic (name, logo).

**Phase dependency:** Must come after content additions (CONT-05/06) so the `activeModules` filter operates on a known final module list. Must come before PWA so `fork.config.json` is captured in the Workbox precache manifest.

**Schema impact:** None to progress store. Fork config is read-only runtime state.

---

## Feature: SME Review Artifacts (SME-01, SME-02, SME-03)

**New files:**
```
docs/SME-REVIEW-CHECKLIST.md    (printable checklist per lesson/control mapping — not served by the app)
```

**Modified files:**
- `public/data/compliance-refs.json` — update TSA directive from SD-02F to successor version strings (SME-01). This is a data-only change; all version string display reads from this file via `loadComplianceRefs()` and `getComplianceRefs()` / `setComplianceRefs()` in `badge.js`. No code changes needed.
- Lesson `.md` files — minor accuracy edits as SME review finds issues. Not a code change.
- `public/data/modules/<module>/quizzes/<id>.json` — answers may be corrected. Not a code change.
- Lesson frontmatter may gain `lastReviewed: YYYY-MM-DD` fields (SME-03). The `parseFrontmatter()` parser already handles arbitrary key-value pairs. The review date will be available in `meta` but no current view renders it — it is stored for future use without needing a parser change.

**Integration point:** No JS integration required. Updating `compliance-refs.json` is sufficient for compliance currency. The `lastReviewed` frontmatter field is a passive annotation.

**Phase dependency:** Should be Phase 9 (first phase of v2.0) due to the TSA SD-02F expiry on May 2, 2026 — this is a hard deadline. The compliance-refs update should be among the first commits in v2.0 work.

**Schema impact:** None.

---

## Feature: PWA / Service Worker (PWA-01, PWA-02, PWA-03)

**New dependency:** `vite-plugin-pwa` (wraps Workbox; maintained, HIGH confidence)

**New files:**
```
public/pwa-192x192.png          (required PWA icon)
public/pwa-512x512.png          (required PWA icon)
public/apple-touch-icon.png     (standard iOS PWA icon)
src/pwa-ui.js                   (offline indicator logic — PWA-03)
```

**Modified files:**
- `vite.config.js` — add `VitePWA()` plugin alongside existing `tailwindcss()`
- `index.html` — add `<div id="offline-banner">` element (hidden by default, shown by `pwa-ui.js`)
- `src/main.js` — import `pwa-ui.js` and call its `initOfflineIndicator()` at end of `init()`

**`vite.config.js` additions — critical configuration:**
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pipeline-cyber-training/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'OT Security Lab',
        short_name: 'OT Lab',
        scope: '/pipeline-cyber-training/',
        start_url: '/pipeline-cyber-training/',
        display: 'standalone',
        theme_color: '#111827',
        background_color: '#111827',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,md}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/pipeline-cyber-training/index.html',
      }
    })
  ]
})
```

**Key integration notes:**

1. **`scope` and `start_url` must be explicit.** vite-plugin-pwa defaults `start_url` to `./` which resolves incorrectly for a subpath deployment. Without explicit values, the service worker scope will not cover the GitHub Pages subpath and the PWA install will silently fail or behave incorrectly. Set both to `/pipeline-cyber-training/` exactly matching the Vite `base`. (Verified via vite-pwa/vite-plugin-pwa GitHub issue discussion and community deployment examples — MEDIUM confidence from multiple consistent sources.)

2. **`globPatterns` must include `json` and `md`.** The default covers only `js,css,html`. All lesson Markdown files (`public/data/modules/.../lessons/*.md`) and all JSON data files (quizzes, exercises, scenarios, `compliance-refs.json`, `fork.config.json`) must be explicitly included or offline playback fails for lesson and quiz content.

3. **`navigateFallback`** is required for the hash router. Without it, a hard refresh at any URL while offline will result in a service worker fetch failure. Set to the full base-prefixed path to the index.

4. **`registerType: 'autoUpdate'`** silently replaces the service worker on new deploy. This is correct for a training app where the audience is not expected to manage PWA installs. If a "new content available" toast is desired in a future phase, switch to `'prompt'`.

5. **Offline indicator (`src/pwa-ui.js`)** — listen to both `window.addEventListener('online')` / `window.addEventListener('offline')` and service worker `controllerchange` events. Do not rely on `navigator.onLine` alone (unreliable in some environments). Toggle a CSS class on `document.body` or the `#offline-banner` element. Keep the implementation under 50 lines.

6. **`fork.config.json` caching** — this file lives in `public/` and will be caught by `globPatterns: ['**/*.json']` automatically.

**Integration point:** The Vite build pipeline generates the service worker and injects the precache manifest into it. The app JS does not register the service worker manually — `vite-plugin-pwa` injects the registration script. The only app-level integration is the offline indicator in `pwa-ui.js`.

**Phase dependency:** MUST come after content additions (CONT-05/06) and fork config (FORK-02/03) are complete. The precache manifest is generated from the build output at build time — any files added after PWA is deployed require a new service worker activation cycle before they are cached. Installing PWA before content is stable means v2.0 users on cached content may miss new lessons until they are online and the SW updates.

**Schema impact:** None to progress store.

---

## Feature: Progress Sync (SYNC-01, SYNC-02)

**SYNC-01 is an Architecture Decision Record (ADR)** — a document that evaluates static-compatible sync options and records the decision. SYNC-02 implements the chosen approach.

**Static-compatible options (analysis for ADR):**

| Option | How it works | Auth required | Data size limit | External dependency | Complexity |
|--------|-------------|--------------|-----------------|---------------------|------------|
| File export/import (existing) | User downloads JSON, copies to other device | None | Unlimited | None | Done (DATA-05) |
| URL share link (recommended) | Encode progress JSON as base64 in URL hash; recipient pastes URL | None | ~8 KB URL limit (sufficient) | None | Low |
| QR code | Encode URL into QR image | None | ~2-3 KB (QR limit — tight) | QR library | Low-Medium |
| GitHub Gist | POST to Gist API; share Gist URL | GitHub OAuth or PAT | Unlimited | GitHub API | Medium |
| Supabase anonymous auth | `signInAnonymously()` → row per device ID | Supabase anon key | Unlimited | Supabase service | Medium-High |

**ADR recommendation:** The existing file export/import (DATA-05) already solves the use case for most IT/OT admin learners (moving between a workstation and a laptop). SYNC-01 should document this analysis and conclude that a **URL-share link** is the right v2.0 addition — it adds zero external dependencies, works for the "email my progress to my home laptop" use case, and stays within the static/no-backend constraint from `PROJECT.md`. Supabase introduces an external service that creates operational dependency contrary to the Key Decisions rationale.

A typical completed-5-module progress blob is ~1-2 KB JSON, base64-encoded to ~1.4-2.7 KB — well within URL limits and small enough that no QR library is needed (the URL is readable text, shareable by email or chat).

**New files:**
```
src/sync-share.js               (URL encode/decode for progress sharing)
docs/ADR-001-sync-approach.md   (decision record)
```

**Modified files:**
- `src/sidebar.js` — add "Copy share link" button in the progress footer section (alongside existing export/import buttons). On click, calls `sync-share.js` to generate URL and copies to clipboard.
- `src/router.js` — on initial load, check if hash contains `#/import?data=<base64>` and call the import flow before normal routing.

**`src/sync-share.js` contract:**
```javascript
export function generateShareUrl(progressStoreData) { /* → URL string */ }
export function decodeShareUrl(url) { /* → parsed progress object or null */ }
```

**`src/router.js` change** (Phase 12 only): add a pre-routing check in `handleRoute()` before the existing route-match logic:
```javascript
if (window.location.hash.startsWith('#/import?data=')) {
  await handleImportFromUrl(window.location.hash);
  return;
}
```

**Integration point:** `sync-share.js` reads from `progressStore.exportProgress()` (already returns the `_store` JSON) and writes via `progressStore.importProgress()`. The progress store API is unchanged.

**Phase dependency:** Can run concurrently with Phase 11 (PWA) — the two share no files. Router change is minimal and low-risk.

**Schema impact:** None. Share link encoding wraps the existing schema v1 JSON. No new fields added to the store.

---

## Schema Migration Notes

### Current state: schemaVersion 1

The `migrate()` function in `src/progress-store.js` is already a forward-compatible chain:
```javascript
// When v1->v2 is needed, add: if (d.schemaVersion === 1) { d = migrateV1toV2(d); }
const d = JSON.parse(JSON.stringify(data));
```

### v2.0 assessment: NO schema bump required

None of the v2.0 features add new structural fields to the progress store:

| Feature | Progress store impact |
|---------|----------------------|
| CONT-05/06/07 — new lessons, scenarios | New `lessons["moduleId/lessonId"]` and `scenarios["moduleId/scenarioId"]` keys — same structure, new keys, backward compatible |
| FORK-02/03 — fork config | Not persisted — read-only runtime state |
| PWA-01/02/03 — service worker | Does not touch localStorage |
| SYNC-01/02 — share link | Encodes/decodes existing schema; no new fields |

**`CURRENT_VERSION` stays at `1`** through all v2.0 work. Do not bump unless a structural change to the store object is made (e.g., adding a new top-level key like `syncToken` or changing key format).

### If a future feature does require a bump

The existing `migrate()` pattern handles this cleanly:

1. Increment `CURRENT_VERSION` to `2` in `progress-store.js`
2. Add `migrateV1toV2(d)` function that adds the new key with a safe default value
3. Chain it into `migrate()` before the existing fill-in-blanks loop
4. Update `_blankStore()` to include the new key
5. The existing `_loadFromStorage()` guard (`parsed.schemaVersion > CURRENT_VERSION → return null`) ensures a v1 export imported into a v2 app is migrated forward. A v2 export imported into a v1 app returns the "newer version" error — correct behavior.
6. Update `importProgress()` `hasKnownKeys` check to include the new key.

---

## Recommended Build Order

### Phase 9 — Compliance Currency + Content Depth

**Why first:** TSA SD-02F expired May 2, 2026 — an urgent correctness issue independent of all platform work. Content additions should land and be stable before the PWA phase builds its precache manifest. The SME checklist is a document deliverable with no technical dependencies.

Delivers: SME-01, SME-02, SME-03, CONT-05, CONT-06, CONT-07

Technical work:
- Edit `public/data/compliance-refs.json` with successor directive version
- Author and add lesson `.md` files (≥10 new files)
- Author and add scenario `.json` files (5 new files)
- Expand quiz `.json` files with new questions (5 existing files modified)
- Add new lesson entries to `src/modules-config.js` arrays
- Write `docs/SME-REVIEW-CHECKLIST.md`

### Phase 10 — Fork Configuration System

**Why second:** Fork config touches `main.js` startup sequence, `modules-config.js` export shape, `sidebar.js`, and `index.html` — four files that the PWA phase also touches. Doing fork config first means the PWA phase sees the final file structure. The `public/fork.config.json` file must also exist before PWA builds its precache manifest (or it will not be cached on first install).

Delivers: FORK-01, FORK-02, FORK-03

Technical work:
- Create `src/fork-config.js`
- Modify `src/main.js` init sequence to call `loadForkConfig()` first
- Convert `src/modules-config.js` to a `getModules()` function
- Update `index.html` to have a dynamic title/header filled by `main.js`
- Update `src/sidebar.js` for fork-config-aware rendering
- Create `public/fork.config.json` with defaults
- Write `docs/FORK-GUIDE.md`

### Phase 11 — PWA / Offline Support

**Why third:** Requires Phase 9 (final content set) and Phase 10 (fork config file) to be complete so the Workbox precache manifest captures all final static files. Installing the service worker before content is stable means the cache misses newly added lesson files until the SW updates.

Delivers: PWA-01, PWA-02, PWA-03

Technical work:
- `npm install vite-plugin-pwa`
- Configure `vite.config.js` with VitePWA plugin (explicit `scope`, `start_url`, `globPatterns`)
- Create PWA icons in `public/`
- Create `src/pwa-ui.js` with offline event listeners
- Add `<div id="offline-banner">` to `index.html`
- Wire `pwa-ui.js` in `src/main.js`

### Phase 12 — Progress Sync

**Why last:** No upstream dependencies beyond the existing progress store. Can technically run concurrently with Phase 11 (no shared files), but sequencing it last keeps the phase boundaries clean. The file export/import (DATA-05) already partially covers the use case, so this is the lowest-urgency v2.0 feature.

Delivers: SYNC-01 (ADR), SYNC-02 (URL share implementation)

Technical work:
- Write `docs/ADR-001-sync-approach.md`
- Create `src/sync-share.js`
- Add share button to progress footer in `src/sidebar.js`
- Add `#/import?data=` handling to `src/router.js` initial load check

---

## Dependency Graph Summary

```
Phase 9 (Compliance + Content)
  → Phase 10 (Fork Config)
    → Phase 11 (PWA)

Phase 12 (Sync) — can run in parallel with Phase 11; no shared files
```

The only hard sequential dependency is 9 → 10 → 11. Phase 12 is independent of Phase 11 and could be done in any slot after Phase 9 (it only needs the existing progress store API, which does not change).

---

## New vs. Modified Files Reference

| File | Status | Phase | Notes |
|------|--------|-------|-------|
| `public/data/compliance-refs.json` | Modified | 9 | TSA directive version update |
| `public/data/modules/<mod>/lessons/<new>.md` | New (×10+) | 9 | 2+ per module |
| `public/data/modules/<mod>/scenarios/<new>.json` | New (×5) | 9 | 1 advanced scenario per module |
| `public/data/modules/<mod>/quizzes/<id>.json` | Modified (×5) | 9 | Add ≥3 questions each |
| `src/modules-config.js` | Modified | 9+10 | Add lesson entries (Phase 9); make filterable via `getModules()` (Phase 10) |
| `docs/SME-REVIEW-CHECKLIST.md` | New | 9 | Not served by app; for compliance review |
| `public/fork.config.json` | New | 10 | Default empty-override config |
| `src/fork-config.js` | New | 10 | Loader module |
| `src/main.js` | Modified | 10+11 | Add fork config init (Phase 10); add pwa-ui init (Phase 11) |
| `index.html` | Modified | 10+11 | Dynamic title/header (Phase 10); offline banner (Phase 11) |
| `src/sidebar.js` | Modified | 10+12 | Fork-aware rendering (Phase 10); share button (Phase 12) |
| `docs/FORK-GUIDE.md` | New | 10 | Not served by app; deployment guide for internal orgs |
| `vite.config.js` | Modified | 11 | Add VitePWA plugin |
| `public/pwa-192x192.png` | New | 11 | Required PWA icon |
| `public/pwa-512x512.png` | New | 11 | Required PWA icon |
| `public/apple-touch-icon.png` | New | 11 | Standard iOS icon |
| `src/pwa-ui.js` | New | 11 | Offline indicator logic |
| `src/sync-share.js` | New | 12 | URL encode/decode |
| `src/router.js` | Modified | 12 | Handle `#/import?data=` on initial load |
| `docs/ADR-001-sync-approach.md` | New | 12 | Sync approach decision record |

**Files confirmed NOT changing in v2.0:**
- `src/progress-store.js` — no schema changes; `schemaVersion` stays 1
- `src/quiz-engine.js` — engines are data-driven; new content files invoke no engine changes
- `src/terminal-engine.js` — same; new exercises are data additions
- `src/scenario-engine.js` — same
- `src/content-loader.js` — `parseFrontmatter()` already handles new frontmatter keys; `fetchLesson()` already handles new lesson IDs via the URL pattern
- All `tests/` files — test the same public APIs; new content additions and the new modules (`fork-config.js`, `pwa-ui.js`, `sync-share.js`) will need new test files, but existing tests do not break

---

## Sources

- vite-plugin-pwa library documentation via Context7 (`/vite-pwa/vite-plugin-pwa`): `globPatterns`, VitePWA config shape, base/scope/start_url requirements for subpath deployments — HIGH confidence
- vite-pwa/vite-plugin-pwa GitHub issue #263 and community deployment examples: confirmed `scope`/`start_url` must be explicit for subdirectory deployments — MEDIUM confidence (multiple consistent sources)
- Supabase anonymous auth documentation: confirmed free-tier auth is static-compatible but introduces external dependency incompatible with project constraints — HIGH confidence
- Runtime config.json fetch-on-startup pattern: confirmed standard approach for static sites requiring org customization without rebuild — HIGH confidence (multiple independent sources)
- Existing codebase (inspected directly): `src/progress-store.js`, `src/main.js`, `src/modules-config.js`, `src/sidebar.js`, `src/router.js`, `src/content-loader.js`, `vite.config.js`, `package.json`, `index.html`
- PROJECT.md and REQUIREMENTS.md: v2.0 feature scope and constraint confirmation
