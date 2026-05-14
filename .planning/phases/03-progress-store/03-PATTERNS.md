# Phase 3: Progress Store - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 6 new/modified files
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/progress-store.js` | service | CRUD | `src/content-loader.js` | role-match (singleton module, closed-over state, catch-returns-null pattern) |
| `tests/progress-store.test.js` | test | CRUD | `tests/content-loader.test.js` | exact (same describe/it/expect structure, vi.spyOn mocking) |
| `src/main.js` (modify) | config/init | request-response | `src/main.js` itself | exact (add one await before existing Promise.all) |
| `src/router.js` (modify) | route | request-response | `src/router.js` itself | exact (add getLastVisited() call inside handleRoute) |
| `src/sidebar.js` (modify) | component | event-driven | `src/sidebar.js` itself | exact (extend initSidebar with footer DOM insertion) |
| `src/views/lesson-view.js` (modify) | component | request-response | `src/views/lesson-view.js` itself | exact (add markVisited() call + storage warning in post-render block) |

---

## Pattern Assignments

### `src/progress-store.js` (service, CRUD)

**Analog:** `src/content-loader.js`

**Imports pattern** (`src/content-loader.js` lines 1-8):
```javascript
// No external imports needed for progress-store.js — all Web Platform APIs.
// badge.js shows the minimal named-export object pattern:
import { esc } from './utils/escape.js';
// progress-store.js will only need:
import { esc } from './utils/escape.js';
```

**Singleton / closed-over state pattern** (`src/content-loader.js` lines 14-24):
```javascript
// content-loader.js uses a module-level let for its singleton:
let _highlighterPromise = null;

export function getHighlighter() {
  if (!_highlighterPromise) {
    _highlighterPromise = createHighlighter({ ... });
  }
  return _highlighterPromise;
}
// progress-store.js mirrors this: two module-level lets, never exported directly.
// let _store = null;
// let _storageAvailable = false;
```

**Error-boundary / catch-returns-null pattern** (`src/content-loader.js` lines 200-215):
```javascript
export async function fetchLesson(moduleId, lessonId) {
  const key = `${moduleId}/${lessonId}`;
  if (_lessonCache.has(key)) return _lessonCache.get(key);
  const url = import.meta.env.BASE_URL + `data/modules/${moduleId}/lessons/${lessonId}.md`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    _lessonCache.set(key, text);
    return text;
  } catch {
    return null;   // ← never throws to callers; absorbs all errors internally
  }
}
// progress-store.js applies the SAME pattern to every localStorage operation:
// try { localStorage.setItem(...) } catch { _storageAvailable = false; }
// callers never see a thrown exception.
```

**Named export object pattern** (`src/badge.js` lines 1-21):
```javascript
// badge.js exports a plain object with closed-over state — the exact shape
// progress-store.js should follow:
let _complianceRefs = null;               // ← closed-over state

export function setComplianceRefs(refs) { // ← setter
  _complianceRefs = refs;
}

export function renderBadge(directiveKey) { // ← reader; never throws
  const shortName = _complianceRefs?.directives?.[directiveKey]?.shortName
    ?? directiveKey;
  ...
}
// progress-store.js uses the same closed-over let pattern but exports a single
// named object: export const progressStore = { init, markVisited, ... }
```

**Core storage probe pattern** (RESEARCH.md Pattern 1):
```javascript
// Run ONCE in init(); result cached as _storageAvailable boolean.
function probeStorage() {
  try {
    const KEY = '__pct_probe__';
    localStorage.setItem(KEY, '1');
    localStorage.removeItem(KEY);
    return true;
  } catch {
    // SecurityError (Safari private), QuotaExceededError (full), or any DOMException
    return false;
  }
}
```

**Write-with-fallback pattern** (RESEARCH.md Pattern 2):
```javascript
// Every write goes through _persist(); callers never call localStorage directly.
function _persist() {
  if (!_storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_store));
  } catch {
    _storageAvailable = false;   // quota filled mid-session (D-09)
  }
}
// _store (in-memory) is ALWAYS updated regardless of _storageAvailable.
```

**Chained migration runner** (RESEARCH.md Pattern 3):
```javascript
// Returns a NEW object (never mutates in place) so migration is independently testable.
function migrate(data) {
  let d = { ...data };
  // Phase 3: no migrations yet; chain wired for future use:
  // if (d.schemaVersion === 1) { d = migrateV1toV2(d); }
  return d;
}

function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.schemaVersion !== 'number') return null;
    if (parsed.schemaVersion < CURRENT_VERSION) return migrate(parsed);
    return parsed;
  } catch {
    return null;
  }
}
```

**Export via Blob + createObjectURL** (RESEARCH.md Pattern 4):
```javascript
function exportProgress() {
  const json = JSON.stringify(_store, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
  a.href     = url;
  a.download = `pipeline-cyber-training-progress-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);   // MUST revoke immediately to avoid memory leak
}
```

**Import via File.text() + validation** (RESEARCH.md Pattern 5):
```javascript
async function _handleImportFile(file) {
  try {
    const text   = await file.text();          // modern promise API; no FileReader
    const parsed = JSON.parse(text);
    if (typeof parsed.schemaVersion !== 'number') {
      return { ok: false, error: 'Not a valid progress file (missing schemaVersion).' };
    }
    const hasKnownKeys = ['lessons','quizzes','exercises','scenarios']
      .some(k => k in parsed);
    if (!hasKnownKeys) {
      return { ok: false, error: 'File structure unrecognizable.' };
    }
    const migrated = parsed.schemaVersion < CURRENT_VERSION ? migrate(parsed) : parsed;
    _store = migrated;
    _persist();
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not parse file as JSON.' };
  }
}
```

---

### `tests/progress-store.test.js` (test, CRUD)

**Analog:** `tests/content-loader.test.js`

**File header + import pattern** (`tests/content-loader.test.js` lines 1-6):
```javascript
// tests/progress-store.test.js
// Wave 0 — covers ASSESS-03, DATA-04, DATA-05
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { progressStore } from '../src/progress-store.js'
```

**describe/it/expect structure** (`tests/content-loader.test.js` lines 8-50):
```javascript
// Pattern: one describe block per logical feature; each it() tests one assertion.
describe('featureName', () => {
  it('describes expected behavior in plain English', () => {
    // arrange
    // act
    // assert with expect(actual).toBe(expected)
  })
})
```

**beforeEach + afterEach cleanup pattern** (`tests/lesson-view.test.js` lines 44-49):
```javascript
// Used wherever global state must be reset between tests.
beforeEach(() => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
  })
})
// For progress-store: afterEach resets _store and clears localStorage:
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})
```

**vi.spyOn pattern for forcing storage errors** (RESEARCH.md — Vitest Pattern):
```javascript
// happy-dom provides a real localStorage — spy on the prototype to force error path.
it('falls back to in-memory when setItem throws', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('QuotaExceededError', 'QuotaExceededError')
  })
  await progressStore.init()
  progressStore.markVisited('logging-auditing', 'intro')
  expect(progressStore.getLessonProgress('logging-auditing', 'intro').visited).toBe(true)
  expect(progressStore.isStorageAvailable()).toBe(false)
})
```

**it.todo for deferred E2E coverage** (`tests/lesson-view.test.js` line 55):
```javascript
it.todo('click on .code-copy-btn calls clipboard.writeText with data-code value')
// Use same pattern for DOM-heavy progress-store tests if needed.
```

---

### `src/main.js` (modify — add progressStore.init() before Promise.all)

**Analog:** `src/main.js` itself

**Current init() pattern** (`src/main.js` lines 35-40):
```javascript
async function init() {
  await loadComplianceRefs();
  await Promise.all([handleRoute(), initSidebar()]);
}
```

**Modified init() — add one await before Promise.all** (RESEARCH.md Pitfall 6):
```javascript
async function init() {
  await loadComplianceRefs();
  await progressStore.init();          // MUST complete before handleRoute reads lastVisited
  await Promise.all([handleRoute(), initSidebar()]);
}
// Import to add at top of file:
// import { progressStore } from './progress-store.js';
```

**Why sequential (not parallel):** If `progressStore.init()` is added to the `Promise.all`,
`handleRoute()` fires before `getLastVisited()` is populated and auto-resume silently fails.
The existing `loadComplianceRefs()` already demonstrates this sequential-then-parallel pattern.

---

### `src/router.js` (modify — read lastVisited on first load)

**Analog:** `src/router.js` itself

**Current handleRoute pattern** (`src/router.js` lines 46-68):
```javascript
export async function handleRoute() {
  const app = document.getElementById('app');
  if (!app) return;
  const { view, params } = matchRoute(window.location.hash);
  const renderer = viewRenderers[view] ?? viewRenderers['not-found'];
  const viewHtml = await renderer(params);
  if (viewHtml !== null) {
    app.innerHTML = viewHtml;
  }
  setActiveModule(params.moduleId ?? null);
  if (params.lessonId) {
    setActiveLesson(params.moduleId, params.lessonId);
  }
  activateIcons();
}
```

**Modification point — initial load redirect** (insert before matchRoute call):
```javascript
// At the TOP of handleRoute(), before matchRoute():
const isInitialLoad = !window.location.hash || window.location.hash === '#/';
if (isInitialLoad) {
  const last = progressStore.getLastVisited();
  if (last?.moduleId && last?.lessonId) {
    window.location.hash = `#/lesson/${last.moduleId}/${last.lessonId}`;
    return;   // hashchange event will fire handleRoute() again with the new hash
  }
}
// Import to add at top of file:
// import { progressStore } from './progress-store.js';
```

**Null-guard pattern (WR-04)** (`src/sidebar.js` line 9):
```javascript
// Apply same guard before any DOM element access:
if (!sidebarModules) return;
// In router.js: the existing `if (!app) return;` already demonstrates this pattern.
```

---

### `src/sidebar.js` (modify — append export/import footer in initSidebar)

**Analog:** `src/sidebar.js` itself

**Existing initSidebar() structure** (`src/sidebar.js` lines 7-68):
```javascript
export async function initSidebar() {
  const sidebarModules = document.getElementById('sidebar-modules');
  if (!sidebarModules) return;                    // ← null-guard pattern

  // ... availability checks + innerHTML build ...

  // Collapse toggle
  const shell     = document.getElementById('shell');
  const toggleBtn = document.getElementById('sidebar-toggle');
  let isCollapsed = false;

  if (toggleBtn && shell) {                       // ← null-guard pattern for DOM elements
    toggleBtn.addEventListener('click', () => { ... });
  }
}
```

**Footer insertion point** (RESEARCH.md Pitfall 5 + `src/sidebar.js` lines 50-51):
```javascript
// The sidebar has: #sidebar-modules (flex: 1) → #sidebar-toggle (button at bottom).
// Footer must be inserted BETWEEN them via insertBefore, NOT appended after toggleBtn.
const sidebar    = document.getElementById('sidebar');
const toggleBtn  = document.getElementById('sidebar-toggle');
if (!sidebar || !toggleBtn) return;              // ← null-guard (WR-04)

const footer = document.createElement('div');
footer.id = 'sidebar-progress-footer';
footer.innerHTML = `
  <div style="padding: var(--spacing-sm) var(--spacing-md); border-top: 1px solid var(--color-border);">
    <button id="btn-export-progress"
            style="font-size: var(--text-body); color: var(--color-text-muted); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 3px;">
      Export my progress
    </button>
    <span style="color: var(--color-text-muted); margin: 0 var(--spacing-xs);">·</span>
    <button id="btn-import-progress"
            style="font-size: var(--text-body); color: var(--color-text-muted); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 3px;">
      Import progress
    </button>
    <input id="import-file-input" type="file" accept=".json" style="display: none;" />
  </div>
`;
sidebar.insertBefore(footer, toggleBtn);         // ← insertBefore, NOT appendChild
```

**esc() usage for innerHTML** (`src/sidebar.js` lines 24, 31):
```javascript
// All dynamic values going into innerHTML use esc():
`data-module-id="${esc(mod.id)}"`
`${esc(mod.title)}`
// In footer: no user-controlled values injected at build time;
// but if import error messages are shown inline, esc() is required.
```

**Event listener wiring pattern** (`src/sidebar.js` lines 54-66):
```javascript
// Pattern for wiring button click events after DOM is built:
if (toggleBtn && shell) {
  toggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    shell.classList.toggle('sidebar-collapsed', isCollapsed);
    ...
  });
}
// Apply same pattern for export/import buttons:
const exportBtn = document.getElementById('btn-export-progress');
const importBtn = document.getElementById('btn-import-progress');
const fileInput = document.getElementById('import-file-input');
if (exportBtn) exportBtn.addEventListener('click', () => progressStore.exportProgress());
if (importBtn) importBtn.addEventListener('click', () => fileInput?.click());
if (fileInput) fileInput.addEventListener('change', async (e) => { ... });
```

---

### `src/views/lesson-view.js` (modify — markVisited + storage warning)

**Analog:** `src/views/lesson-view.js` itself

**Post-render wiring block** (`src/views/lesson-view.js` lines 66-71):
```javascript
// Step 5 — Post-render wiring (must happen AFTER innerHTML is set)
setActiveLesson(moduleId, lessonId);
activateIcons();
attachCopyHandlers();
// Phase 3 adds TWO more calls here:
// progressStore.markVisited(moduleId, lessonId);
// progressStore.setLastVisited(moduleId, lessonId);
// if (!progressStore.isStorageAvailable()) { ... inject warning ... }
```

**Inline error/warning DOM injection pattern** (`src/views/lesson-view.js` lines 226-249):
```javascript
// Existing .lesson-error pattern (renderLessonError) shows the exact
// structure to reuse for the storage warning:
return `<section style="padding: var(--spacing-xl);">
  <div class="lesson-error" role="alert"
       style="background: var(--color-bg-secondary); border: 1px solid var(--color-destructive);
              border-radius: 6px; padding: var(--spacing-lg); ...">
    <p style="font-size: var(--text-body); color: var(--color-text-muted);">
      ${message}
    </p>
  </div>
</section>`;
// Storage warning follows same structure but uses .storage-warning class and
// is prepended to .lesson-column (not replacing app), and uses muted style
// (not destructive) since it's informational, not a hard failure.
```

**Storage warning injection** (RESEARCH.md Code Examples):
```javascript
// Insert AFTER app.innerHTML = lessonHtml, before return null
if (!progressStore.isStorageAvailable()) {
  const warningDiv = document.createElement('div');
  warningDiv.className = 'storage-warning';
  warningDiv.setAttribute('role', 'alert');
  warningDiv.innerHTML = `
    <p style="font-size: var(--text-body); color: var(--color-text-muted);">
      Progress cannot be saved — storage is unavailable (private browsing or quota full).
      Your progress this session will be lost when you close the tab.
    </p>
  `;
  const lessonColumn = document.querySelector('.lesson-column');
  if (lessonColumn) lessonColumn.prepend(warningDiv);  // ← null-guard (WR-04)
}
// Import to add at top of file:
// import { progressStore } from '../progress-store.js';
```

**esc() import already present** (`src/views/lesson-view.js` line 11):
```javascript
import { esc } from '../utils/escape.js';
// Already imported — use for any stored value injected into innerHTML.
```

---

## Shared Patterns

### Null-Guard Before DOM Manipulation (WR-04)
**Source:** `src/sidebar.js` line 9, `src/views/lesson-view.js` lines 24-28
**Apply to:** All DOM element reads in sidebar footer wiring and storage warning injection
```javascript
// Always check element exists before accessing properties or calling methods:
if (!sidebarModules) return;
if (toggleBtn && shell) { ... }
if (lessonColumn) lessonColumn.prepend(warningDiv);
```

### HTML Escaping for innerHTML
**Source:** `src/utils/escape.js` lines 1-9, used throughout `src/sidebar.js` and `src/views/lesson-view.js`
**Apply to:** Any value from progress store rendered into `innerHTML` (import error messages, warning text containing dynamic content)
```javascript
import { esc } from './utils/escape.js';
// or (from views/):
import { esc } from '../utils/escape.js';

// Usage:
element.innerHTML = `<p>${esc(someStoredValue)}</p>`;
```

### Error Boundary — Never Throw to Callers
**Source:** `src/content-loader.js` lines 200-215 (`fetchLesson`), `src/badge.js` lines 11-20 (`renderBadge`)
**Apply to:** All `progressStore` public API methods; all localStorage access in `_persist()`
```javascript
// Pattern: wrap risky operations in try/catch; return null or fallback value; never throw.
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  ...
} catch {
  return null;
}
```

### Module-Level Singleton State
**Source:** `src/content-loader.js` lines 14-15, `src/badge.js` lines 5-6
**Apply to:** `progress-store.js` — `_store` and `_storageAvailable` as module-level `let`
```javascript
// Pattern: module-level private state, never exported directly, accessed only via API methods.
let _store = null;
let _storageAvailable = false;
```

### Async Init Before Dependent Calls
**Source:** `src/main.js` lines 35-38 (`loadComplianceRefs` awaited before `handleRoute`)
**Apply to:** `progressStore.init()` in `main.js` — must be awaited before `handleRoute()`
```javascript
async function init() {
  await loadComplianceRefs();
  await progressStore.init();          // sequential: populates lastVisited
  await Promise.all([handleRoute(), initSidebar()]);  // then parallel
}
```

### Test File Structure
**Source:** `tests/content-loader.test.js` lines 1-6, `tests/lesson-view.test.js` lines 1-7
**Apply to:** `tests/progress-store.test.js`
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// One describe block per feature area.
// afterEach: vi.restoreAllMocks() + localStorage.clear()
// vi.spyOn(Storage.prototype, 'setItem') to force error path (not global stub).
```

---

## No Analog Found

All files in this phase have close analogs in the codebase. No entries needed here.

---

## Metadata

**Analog search scope:** `src/`, `tests/`, root config files
**Files scanned:** 9 source files + 2 config files + 5 test files
**Pattern extraction date:** 2026-05-14
