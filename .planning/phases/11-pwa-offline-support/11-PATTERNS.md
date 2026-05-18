# Phase 11: PWA / Offline Support - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 8 (3 new source, 2 modified source, 1 new test, 1 new script, 3 new static assets)
**Analogs found:** 6 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `vite.config.js` | config | build-transform | `vite.config.js` (current) | exact — same file, modified |
| `src/offline-indicator.js` | utility/module | event-driven | `src/fork-config.js` | role-match — same init pattern, DOM mutation |
| `src/main.js` | entry/orchestrator | request-response | `src/main.js` (current) | exact — same file, one-line modification |
| `scripts/generate-icons.js` | utility/script | file-I/O | none | no analog — first Node script in project |
| `public/pwa-192x192.png` | static asset | — | none | no analog — first PNG icon |
| `public/pwa-512x512.png` | static asset | — | none | no analog |
| `public/apple-touch-icon.png` | static asset | — | none | no analog |
| `tests/offline-indicator.test.js` | test | event-driven | `tests/fork-config.test.js` | exact — same DOM mutation + event dispatch pattern |

---

## Pattern Assignments

### `vite.config.js` (config, build-transform)

**Analog:** `vite.config.js` (current state — same file being modified)

**Current file** (lines 1–8):
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pipeline-cyber-training/',   // REQUIRED — project-scoped GitHub Pages URL
  plugins: [tailwindcss()],
})
```

**Modification pattern — add VitePWA to the plugins array, preserve `base` and existing plugin:**
```javascript
// vite.config.js — MODIFIED
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
        // DO NOT set navigateFallback — app uses hash-based routing, not HTML5 history
      },
      manifest: {
        name: 'OT Security Lab',
        short_name: 'OT Training',
        description: 'Pipeline cybersecurity training — TSA SD-02 series compliance',
        theme_color: '#111827',
        background_color: '#1a1a1a',
        display: 'standalone',
        // CRITICAL: must match base exactly — relative paths break GitHub Pages subpath SW scope
        scope: '/pipeline-cyber-training/',
        start_url: '/pipeline-cyber-training/',
        icons: [
          { src: 'pwa-192x192.png',      sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',      sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
    }),
  ],
})
```

**Key constraints:**
- `globPatterns` MUST include `md,json` — default is `js,css,html` only; omitting them causes blank offline lessons (fetchLesson() has a silent catch)
- `scope` and `start_url` MUST be absolute `/pipeline-cyber-training/` — Vite defaults produce `./` which breaks SW registration on GitHub Pages subpath
- Do NOT add `navigateFallback` — hash routing handles navigation client-side
- `injectRegister: 'script-defer'` means no import needed in `main.js` — SW registers via injected `<script defer>` in built HTML

---

### `src/offline-indicator.js` (utility/module, event-driven)

**Analog:** `src/fork-config.js`

**Module-level singleton pattern** (fork-config.js lines 1–17):
```javascript
// src/fork-config.js — module-level state, never re-initialized
import { esc } from './utils/escape.js';

let _forkConfig = null;   // ← module-level private state

export const DEFAULT_FORK_CONFIG = { ... };

export function getForkConfig() {         // ← getter, always returns non-null
  return _forkConfig ?? DEFAULT_FORK_CONFIG;
}
```

**Copy this pattern for offline-indicator.js:**
- Module-level `let` vars for all mutable state (`_dotEl`, `_labelEl`, `_installLinkEl`, `_deferredInstallPrompt`)
- Single exported init function (`initOfflineIndicator()`) — called once from `main.js`
- No class, no constructor — plain module scope
- Graceful early-return when DOM element absent (`if (!container) return`)

**DOM query pattern** (fork-config.js lines 52–54):
```javascript
export function applyForkBranding(config) {
  const span = document.querySelector('#top-bar > span');   // ← direct DOM query
  if (!span) return;                                         // ← guard, no throw
```

**Apply to offline-indicator.js:** Query `#top-bar > div.flex` (the right-side flex group visible in index.html line 19). Guard with `if (!container) return`.

**index.html top-bar structure** (index.html lines 16–35) — injection target:
```html
<header id="top-bar" class="col-span-2 flex items-center justify-between px-[var(--spacing-md)]"
        style="background: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border); ...">
  <span style="font-size: var(--text-display); font-weight: 600; color: var(--color-accent);">OT Security Lab</span>
  <div class="flex items-center gap-[var(--spacing-md)]">  <!-- ← INJECT HERE -->
    <a href="#/compliance-index"
       style="font-size: var(--text-body); color: var(--color-text-muted); text-decoration: none; display: flex; align-items: center; gap: 4px;"
       onmouseover="this.style.color='var(--color-accent)'"
       onmouseout="this.style.color='var(--color-text-muted)'">
      <i data-lucide="shield-check" style="width:15px;height:15px;"></i>
      Compliance Index
    </a>
    <a href="#/completion-summary" ...>
      <i data-lucide="printer" style="width:15px;height:15px;"></i>
      Training Log
    </a>
  </div>
</header>
```

**Nav link style pattern** (index.html lines 20–33) — Install link must match exactly:
- `font-size: var(--text-body)` — 14px
- `color: var(--color-text-muted)` — `#737373`
- `text-decoration: none`
- `display: flex; align-items: center; gap: 4px`
- `onmouseover="this.style.color='var(--color-accent)'"` / `onmouseout` restore
- Use inline SVG for the download icon (NOT `data-lucide`) — Lucide `createIcons()` runs at startup before this element is injected; inline SVG avoids the double-initialization pitfall

**CSS variables to use** (style.css lines 4–66):
- `--color-text-muted: #737373` — indicator and install link default color
- `--color-accent: #f97316` — hover color (matches existing nav links)
- `--text-body: 0.875rem` — font size for all top-bar links
- `--color-ot-border: #d97706` — amber for offline dot (already defined, matches D-03)
- Green for online dot: `#22c55e` (not in CSS vars — hardcode, consistent with RESEARCH.md spec)

**Event sourcing pattern for offline-indicator.js:**
```javascript
// Primary: window events — real-time network state
window.addEventListener('online',  () => _setState(true));
window.addEventListener('offline', () => _setState(false));

// Secondary: SW controller change — satisfies D-04 (not solely navigator.onLine)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    _setState(navigator.onLine);
  });
}

// Install prompt: intercept + defer
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  _installLinkEl.style.display = 'flex';
});

// Post-install: hide link
window.addEventListener('appinstalled', () => {
  _deferredInstallPrompt = null;
  _installLinkEl.style.display = 'none';
});
```

**No imports needed:** `offline-indicator.js` has no project dependencies — pure DOM API + window events. Do not import anything from the project. This keeps the module isolated and testable.

---

### `src/main.js` (entry/orchestrator, request-response)

**Analog:** `src/main.js` (current — same file, minimal modification)

**Current `init()` function** (main.js lines 30–38):
```javascript
async function init() {
  const forkConfig = await loadForkConfig();
  applyForkBranding(forkConfig);
  await loadComplianceRefs();
  await progressStore.init();
  await Promise.all([handleRoute(), initSidebar({ onImportSuccess: handleRoute })]);
}
```

**Modified `init()` — add import and one call:**
```javascript
// ADD to imports section (line ~6):
import { initOfflineIndicator } from './offline-indicator.js';

// MODIFIED init() — add initOfflineIndicator() after applyForkBranding(), before loadComplianceRefs():
async function init() {
  const forkConfig = await loadForkConfig();
  applyForkBranding(forkConfig);
  initOfflineIndicator();           // ← NEW (synchronous, non-blocking)
  await loadComplianceRefs();
  await progressStore.init();
  await Promise.all([handleRoute(), initSidebar({ onImportSuccess: handleRoute })]);
}
```

**Ordering rationale:** `applyForkBranding()` runs first so the header org name is set before the indicator appends to `#top-bar`. `initOfflineIndicator()` is synchronous — no `await`. Insert before `loadComplianceRefs()` (async) to get the indicator visible immediately.

---

### `scripts/generate-icons.js` (utility/script, file-I/O)

**Analog:** None — first Node.js script in this project.

**Follow these project conventions observed in source files:**
- ESM (`import`/`export`) — `package.json` has `"type": "module"`, so `scripts/generate-icons.js` will use `import` syntax
- Inline comments explaining non-obvious choices (observed throughout `src/`)
- `console.log(...)` for progress output (no logger abstraction needed for a one-shot script)

**Key API facts for pureimage (from RESEARCH.md):**
- `PImage.make(size, size)` — create canvas
- `img.getContext('2d')` — get 2D context
- `ctx.fillStyle`, `ctx.fillRect()`, `ctx.beginPath()`, `ctx.fill()` — confirmed supported
- `PImage.encodePNGToStream(img, fs.createWriteStream(path))` — write PNG
- Text rendering (`ctx.font`, `ctx.fillText`) requires `pureimage.registerFont()` — DO NOT use text; use shapes only (shield polygon) to avoid unregistered font failure (RESEARCH.md Open Questions #2)

**Output paths:**
```javascript
// All paths relative to project root — script run from project root:
// node scripts/generate-icons.js
'public/pwa-192x192.png'
'public/pwa-512x512.png'
'public/apple-touch-icon.png'    // 180×180
```

**Script is not part of the build.** Run once, commit the PNGs. Do not add to `package.json` scripts as a build step.

---

### `tests/offline-indicator.test.js` (test, event-driven)

**Analog:** `tests/fork-config.test.js`

**File header pattern** (fork-config.test.js lines 1–6):
```javascript
// tests/fork-config.test.js
// Phase 10 Plan 05 — Test suite for the fork configuration system.
// Covers: src/fork-config.js (unit), ...
// happy-dom environment (vitest.config.js: environment: 'happy-dom')
```

**vi.mock() block placement** (fork-config.test.js lines 7–89):
All `vi.mock()` calls go BEFORE imports — Vitest hoisting requirement. If `offline-indicator.js` has no imports, no mocks are needed. If it gains any, add mock blocks above the `import` statements.

**Import line** (fork-config.test.js line 93):
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
```

**DOM setup in beforeEach** (fork-config.test.js lines 262–269):
```javascript
beforeEach(async () => {
  vi.resetModules()
  ;({ applyForkBranding } = await import('../src/fork-config.js'))
  document.body.innerHTML = '<header id="top-bar"><span>OT Security Lab</span></header>'
})

afterEach(() => vi.restoreAllMocks())
```

**Apply to offline-indicator tests — beforeEach structure:**
```javascript
beforeEach(() => {
  // Set up the DOM structure that initOfflineIndicator() queries
  document.body.innerHTML = `
    <header id="top-bar">
      <span>OT Security Lab</span>
      <div class="flex items-center"></div>
    </header>
  `
  // Mock navigator.onLine (true by default — online state)
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => true,
  })
  // Mock navigator.serviceWorker to avoid "not in navigator" branch in CI
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { addEventListener: vi.fn() },
  })
})

afterEach(() => vi.restoreAllMocks())
```

**Event dispatch pattern** — dispatching window events to trigger listeners:
```javascript
// Offline state transition:
window.dispatchEvent(new Event('offline'))
expect(document.getElementById('offline-indicator').textContent).toContain('Offline')

// Online state transition:
window.dispatchEvent(new Event('online'))
expect(document.getElementById('offline-indicator').textContent).toContain('Online')
```

**navigator mock pattern with Object.defineProperty** (fork-config.test.js line 347):
```javascript
// Same pattern used in router tests:
Object.defineProperty(window, 'location', {
  writable: true,
  value: { hash: '#/module/patch-management' },
})
// Apply to navigator.onLine and navigator.serviceWorker:
Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
```

**vi.fn() mock for SW addEventListener** — verify it was called with 'controllerchange':
```javascript
const swAddListener = vi.fn()
Object.defineProperty(navigator, 'serviceWorker', {
  configurable: true,
  value: { addEventListener: swAddListener },
})
initOfflineIndicator()
expect(swAddListener).toHaveBeenCalledWith('controllerchange', expect.any(Function))
```

**describe block structure** (fork-config.test.js pattern — numbered sections):
```javascript
// ── 1. DOM injection ──────────────────────────────────────────────────────────
describe('initOfflineIndicator() — DOM injection', () => { ... })

// ── 2. Online/offline state transitions ──────────────────────────────────────
describe('initOfflineIndicator() — state transitions', () => { ... })

// ── 3. Install prompt ─────────────────────────────────────────────────────────
describe('initOfflineIndicator() — install prompt', () => { ... })

// ── 4. SW controllerchange listener ──────────────────────────────────────────
describe('initOfflineIndicator() — serviceWorker integration', () => { ... })

// ── 5. Guard: no container ────────────────────────────────────────────────────
describe('initOfflineIndicator() — no #top-bar container', () => { ... })
```

**beforeinstallprompt test note** (RESEARCH.md Open Questions #3):
The `beforeinstallprompt` event is non-standard. If happy-dom does not dispatch it correctly via `window.dispatchEvent(new Event('beforeinstallprompt'))`, test the listener registration only (`vi.fn()` stub on `window.addEventListener`). Mark full event dispatch tests as `// Integration: verify in browser` if they fail in CI.

---

## Shared Patterns

### Module-Level Singleton Init
**Source:** `src/fork-config.js` lines 1–17 and 52–67
**Apply to:** `src/offline-indicator.js`
```javascript
// Pattern: module-level private state + single exported init function
let _privateState = null;

export function initX() {
  const el = document.querySelector('#some-selector');
  if (!el) return;   // guard — no throw, graceful no-op
  // ... side effects
}
```

### CSS Variable Usage (not hardcoded hex)
**Source:** `src/style.css` lines 4–66, `index.html` lines 20–33
**Apply to:** `src/offline-indicator.js` (all inline styles)
- Use `var(--color-text-muted)`, `var(--text-body)`, `var(--color-accent)`, `var(--color-ot-border)` in `style.cssText` strings
- Only exception: `#22c55e` (online green) has no CSS var — hardcode it (consistent with RESEARCH.md spec)

### Inline Style on DOM Elements (not Tailwind classes)
**Source:** `index.html` lines 20–34, `src/fork-config.js` lines 56–64
**Apply to:** `src/offline-indicator.js`
```javascript
// Project pattern: dynamically created elements use inline styles, not Tailwind classes
el.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:var(--text-body);color:var(--color-text-muted);';
// NOT: el.className = 'flex items-center gap-1 text-sm text-muted'
// Reason: Tailwind v4 purges classes not present in source at build time
```

### Import Pattern in Tests
**Source:** `tests/fork-config.test.js` line 93, `tests/main-init.test.js` line 6
**Apply to:** `tests/offline-indicator.test.js`
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// Note: no 'test' in import — project uses 'it' consistently
```

### Dynamic Import with vi.resetModules()
**Source:** `tests/fork-config.test.js` lines 127–131
**Apply to:** `tests/offline-indicator.test.js` — only needed if module-level state must be reset between tests. Use `vi.resetModules()` + dynamic `import()` in `beforeEach` if `initOfflineIndicator()` must be called fresh for each test group.
```javascript
beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../src/offline-indicator.js')
  initOfflineIndicator = mod.initOfflineIndicator
})
```

### Test Setup File
**Source:** `tests/setup.js`
**Apply to:** `tests/offline-indicator.test.js` — if `beforeinstallprompt` or other non-standard events need global stubs, add them to `tests/setup.js` (not inline per test). Current setup.js only stubs `window.print` — no changes needed unless a new gap is discovered.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `scripts/generate-icons.js` | utility/script | file-I/O | No existing Node.js scripts in the project; `scripts/` directory does not exist yet |
| `public/pwa-192x192.png` | static asset | — | No PNG icons exist in `public/` currently |
| `public/pwa-512x512.png` | static asset | — | Same |
| `public/apple-touch-icon.png` | static asset | — | Same |

Planner should use RESEARCH.md Pattern 4 (lines 374–423) for the icon generation script — it provides the complete pureimage API usage. Use shapes only (no text rendering) per Open Questions #2.

---

## Critical Sequencing Note for Planner

**Wave 0 blocker:** `public/pwa-192x192.png`, `public/pwa-512x512.png`, and `public/apple-touch-icon.png` MUST exist before `npm run build` runs. The build plan must:
1. Install `vite-plugin-pwa` and `pureimage` as devDependencies first
2. Create and run `scripts/generate-icons.js` to generate PNGs into `public/`
3. Commit the generated PNG files
4. THEN modify `vite.config.js` to add VitePWA plugin
5. THEN write `src/offline-indicator.js`
6. THEN modify `src/main.js`
7. THEN write `tests/offline-indicator.test.js`

If icons are absent when `vite build` runs, Workbox silently omits them from the precache manifest (no build error — silent failure).

---

## Metadata

**Analog search scope:** `src/`, `tests/`, `vite.config.js`, `index.html`, `package.json`, `vitest.config.js`, `tests/setup.js`
**Files read:** 12
**Pattern extraction date:** 2026-05-18
