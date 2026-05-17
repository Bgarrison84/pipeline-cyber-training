---
phase: 03-progress-store
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/progress-store.js
  - tests/progress-store.test.js
  - tests/main-init.test.js
  - tests/router-resume.test.js
  - src/main.js
  - src/router.js
  - src/sidebar.js
  - src/views/lesson-view.js
  - tests/sidebar-progress.test.js
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-14  
**Depth:** standard  
**Files Reviewed:** 9  
**Status:** issues_found

## Summary

This phase delivers `src/progress-store.js` and wires it into `main.js`, `router.js`, `sidebar.js`, and `lesson-view.js`. The core store implementation is structurally sound: quota-error graceful degradation, deep-copy migration, and the export/import flow all work correctly. However, three correctness bugs surfaced that will cause real runtime failures:

1. A circular import between `main.js`, `router.js`, and `sidebar.js` that causes bundler-time breakage or stale-reference hangs at startup.
2. `importProgress` accepts a future-version schema silently and installs it as-is, with no guard, which means a downgraded v1 client will corrupt its store on the next `_persist()`.
3. `resetProgress()` does not reset `_storageAvailable`, so after a reset the store acts as if storage is available even when it was originally unavailable — a logic error that surfaces in test isolation and in "start over" flows.

Five warnings cover: `markVisited` writing `lastVisited` redundantly when `setLastVisited` is always also called by callers; `exportProgress` revoking the object URL synchronously (before the browser has time to act on the anchor click in Firefox); the `isInitialLoad` flag being permanently stuck once the `hashchange` listener fires because `handleRoute` was also designed for that case; an absent `_storageAvailable = false` reset in `resetProgress`; and the sidebar import-error message not clearing on the next successful import attempt.

---

## Critical Issues

### CR-01: Circular import graph — `main.js` ↔ `router.js` ↔ `sidebar.js`

**File:** `src/main.js:2-3`, `src/router.js:6-7`, `src/sidebar.js:5,7`

**Issue:**  
The three modules form a circular dependency triangle:

- `main.js` imports `handleRoute` from `router.js` and `initSidebar` from `sidebar.js`
- `router.js` imports `activateIcons` from `main.js` and `setActiveModule`/`setActiveLesson` from `sidebar.js`
- `sidebar.js` imports `activateIcons` from `main.js` and `handleRoute` from `router.js`

In ES module semantics, circular imports are not errors per se, but the binding each module receives at evaluation time may be `undefined` if the exporting module has not yet finished executing. Vite/Rollup will generally warn and may produce a live binding, but the runtime order is non-deterministic. In practice the most common symptom is `activateIcons is not a function` on first call, or `handleRoute is not a function` inside the sidebar's file-import handler — both of which are silent in production unless the user happens to trigger them.

The specific path that fails most easily: `sidebar.js` imports `handleRoute` at module evaluation time. If `router.js` hasn't finished evaluating yet (because it is waiting for `main.js`), `handleRoute` is `undefined` when the sidebar's `fileInput` change handler calls it.

**Fix:**  
Break the cycle by moving `activateIcons` out of `main.js` into a dedicated `src/icons.js` (or `src/utils/icons.js`) module that neither `router.js` nor `sidebar.js` depends on downstream. Then `router.js` and `sidebar.js` import from `icons.js` directly, and `main.js` imports from `icons.js` as well. The `handleRoute` import inside `sidebar.js` (needed only for the import-success callback) can be replaced with a passed-in callback or a custom event so that `sidebar.js` does not import from `router.js` at all.

```js
// src/utils/icons.js  (new file)
import { createIcons, BookOpen, Shield, /* ... */ } from 'lucide';
export function activateIcons() {
  createIcons({ icons: { BookOpen, Shield, /* ... */ } });
}

// src/router.js — replace main.js import
import { activateIcons } from './utils/icons.js';

// src/sidebar.js — replace main.js import; drop router.js import
import { activateIcons } from './utils/icons.js';
// Pass handleRoute as a callback from main.js or use a CustomEvent:
export async function initSidebar({ onImportSuccess } = {}) {
  // ...
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      // ...
      if (result.ok && onImportSuccess) await onImportSuccess();
      // ...
    });
  }
}
```

---

### CR-02: `importProgress` silently installs a future schema version, corrupting the store

**File:** `src/progress-store.js:302-303`

**Issue:**  
```js
const migrated = parsed.schemaVersion < CURRENT_VERSION ? migrate(parsed) : parsed;
_store = migrated;
_persist();
```

When `parsed.schemaVersion > CURRENT_VERSION` (a file exported by a future version of the app imported into this version), the condition `parsed.schemaVersion < CURRENT_VERSION` is false, so `parsed` is assigned directly to `_store` unvalidated. On the next `_persist()` call the foreign schema is written back to localStorage. If the foreign schema has additional or differently-structured keys, every subsequent `getLessonProgress`, `getQuizScore`, etc. call receives unexpected data shapes. This is a data-corruption vector: the user's older browser session irrecoverably overwrites valid progress with a future-format blob it does not understand.

The same gap exists in `_loadFromStorage` (line 106-107): future-version data loaded from localStorage is returned as-is without any guard.

**Fix:**  
Reject import files whose `schemaVersion > CURRENT_VERSION` with a user-visible error, the same way malformed files are rejected:

```js
if (parsed.schemaVersion > CURRENT_VERSION) {
  return {
    ok: false,
    error: `This progress file was saved by a newer version of the app (schema v${parsed.schemaVersion}). Please update the app before importing.`,
  };
}
```

Apply the same guard in `_loadFromStorage`:
```js
if (parsed.schemaVersion > CURRENT_VERSION) return null; // treat as unrecognizable
if (parsed.schemaVersion < CURRENT_VERSION) return migrate(parsed);
return parsed;
```

---

### CR-03: `resetProgress()` does not reset `_storageAvailable`, causing incorrect fallback state

**File:** `src/progress-store.js:315-322`

**Issue:**  
```js
function resetProgress() {
  _store = _blankStore();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore removal errors
  }
}
```

`resetProgress` resets `_store` but leaves `_storageAvailable` at whatever it was when `init()` last ran. Two concrete failure modes:

1. **Test isolation:** The `storage fallback` test suite stubs localStorage to throw, calls `progressStore.init()` (which sets `_storageAvailable = false`), then calls `resetProgress()`. When the *next* test suite calls `progressStore.init()` with real localStorage available, `_storageAvailable` may still be `false` from a prior reset if `vi.unstubAllGlobals()` hasn't fired yet — or vice versa if order differs. Several test suites call `resetProgress()` in `afterEach` without re-running `init()`, leaving `_storageAvailable` in a stale state that corrupts tests run in series.

2. **"Start over" UI flow:** If the app exposes a "start over" button that calls `resetProgress()` without re-calling `init()`, subsequent `_persist()` calls no-op silently because `_storageAvailable` is still `false` from a previous quota-error downgrade, even though storage is now available (the quota was freed by removing the key).

**Fix:**  
Either (a) reset `_storageAvailable` to `false` in `resetProgress` and re-probe in `init` (callers must re-`init`), or more pragmatically (b) re-probe storage inside `resetProgress` itself:

```js
function resetProgress() {
  _store = _blankStore();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore removal errors
  }
  // Re-probe: removing the key may have freed enough quota to re-enable storage.
  _storageAvailable = probeStorage();
}
```

---

## Warnings

### WR-01: `exportProgress` revokes the object URL synchronously — download fails in Firefox

**File:** `src/progress-store.js:269-275`

**Issue:**  
```js
a.click();
URL.revokeObjectURL(url);
```

`URL.revokeObjectURL` is called immediately after `a.click()`. In Chromium this works because the browser queues the download before the URL is revoked. In Firefox, the revocation races the navigation and the download is often cancelled before it starts. The WHATWG spec does not guarantee that a programmatic `.click()` on an anchor completes its network request before the next synchronous line executes.

**Fix:**  
Revoke inside a `setTimeout` to give the browser a tick to initiate the download:

```js
a.click();
setTimeout(() => URL.revokeObjectURL(url), 100);
```

---

### WR-02: `isInitialLoad` condition fires on every `hashchange` to `#/`, not just at startup

**File:** `src/router.js:50-56`

**Issue:**  
```js
const isInitialLoad = !window.location.hash || window.location.hash === '#/';
if (isInitialLoad) {
  const last = progressStore.getLastVisited();
  if (last?.moduleId && last?.lessonId) {
    window.location.hash = '#/lesson/' + last.moduleId + '/' + last.lessonId;
    return;
  }
}
```

The variable is named `isInitialLoad` but the condition is actually "hash is empty or `#/`." This means: if a user explicitly navigates back to the home page by clicking the site logo (which typically sets `location.hash = '#/'`), they are immediately redirected to their last lesson instead of seeing the home view. The redirect only stops if `lastVisited` is null (i.e., brand-new learner) or if they clear progress.

This is a navigation correctness bug: the "home" route is unreachable for any returning learner. It also means the `handleRoute()` tests in `router-resume.test.js` that test "non-initial load" are testing the wrong thing — the test on line 66 shows that navigating to a specific lesson is correctly not redirected, but does not test navigating to `#/` after a lesson.

**Fix:**  
Track true first-load with a module-level boolean:

```js
let _handledInitialLoad = false;

export async function handleRoute() {
  const app = document.getElementById('app');
  if (!app) return;
  if (!_handledInitialLoad) {
    _handledInitialLoad = true;
    const isEmpty = !window.location.hash || window.location.hash === '#/';
    if (isEmpty) {
      const last = progressStore.getLastVisited();
      if (last?.moduleId && last?.lessonId) {
        window.location.hash = '#/lesson/' + last.moduleId + '/' + last.lessonId;
        return;
      }
    }
  }
  // ... rest of route dispatch
}
```

---

### WR-03: `markVisited` writes `lastVisited` redundantly — double-persist on lesson open

**File:** `src/progress-store.js:157-165`, `src/views/lesson-view.js:69-70`

**Issue:**  
`markVisited` already sets `_store.lastVisited` internally (line 163) and calls `_persist()`. `lesson-view.js` then immediately calls `progressStore.setLastVisited()` (line 70), which sets the same value and calls `_persist()` again. This results in two serialization passes and two `localStorage.setItem` calls for every lesson render. While not a data-corruption bug, the `lastVisited` state written by `markVisited` is guaranteed to be overwritten by `setLastVisited` with identical data, making the write inside `markVisited` a dead code path that obscures intent.

If a future caller invokes only `markVisited` (not followed by `setLastVisited`), `lastVisited` will be set — which may or may not match intended semantics. The coupling between `markVisited` and `setLastVisited` is undocumented.

**Fix:**  
Remove the `_store.lastVisited` assignment from `markVisited` — callers that want to update `lastVisited` call `setLastVisited` explicitly:

```js
function markVisited(moduleId, lessonId) {
  const key = moduleId + '/' + lessonId;
  _store.lessons[key] = {
    ...(_store.lessons[key] ?? { visited: false, completed: false }),
    visited: true,
  };
  // Do NOT set lastVisited here — caller controls that via setLastVisited()
  _persist();
}
```

---

### WR-04: Import error message is never cleared on subsequent successful import

**File:** `src/sidebar.js:115-120`

**Issue:**  
```js
if (result.ok) {
  await handleRoute();
} else {
  const errEl = document.getElementById('import-error-msg');
  if (errEl) errEl.textContent = result.error ?? 'Import failed.';
}
```

If the first import attempt fails (e.g., malformed JSON), `import-error-msg` is populated with the error string. If the user then selects a valid file, the `result.ok` branch calls `handleRoute()` but never clears the error message. After a successful import, the old error message remains visible until the DOM is re-rendered by navigation.

**Fix:**  
Clear the error message at the top of the change handler regardless of outcome:

```js
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  // Clear any prior error message before attempting import
  const errEl = document.getElementById('import-error-msg');
  if (errEl) errEl.textContent = '';
  const result = await progressStore.importProgress(file);
  if (result.ok) {
    await handleRoute();
  } else {
    if (errEl) errEl.textContent = result.error ?? 'Import failed.';
  }
  e.target.value = '';
});
```

---

### WR-05: `_loadFromStorage` returns unvalidated data when `schemaVersion === CURRENT_VERSION`

**File:** `src/progress-store.js:100-111`

**Issue:**  
```js
if (typeof parsed.schemaVersion !== 'number') return null;
if (parsed.schemaVersion < CURRENT_VERSION) return migrate(parsed);
return parsed;
```

When `schemaVersion === 1` (current), `migrate()` is not called, so the "fill in blanks" logic that adds missing top-level keys does not run. If a user manually edits their localStorage entry and removes `lessons` or `quizzes`, `_store` will have `undefined` for those keys. Every subsequent call to `getLessonProgress`, `getQuizScore`, etc. will throw a `TypeError: Cannot read properties of undefined` when attempting to index into `_store.lessons[key]`.

The `migrate` function is explicitly designed to fill in blanks from `_blankStore()` (lines 87-93), but it is only invoked for older schema versions.

**Fix:**  
Always run `migrate` on loaded data, regardless of version equality:

```js
function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.schemaVersion !== 'number') return null;
    if (parsed.schemaVersion > CURRENT_VERSION) return null;
    return migrate(parsed); // always fill in missing keys
  } catch {
    return null;
  }
}
```

---

## Info

### IN-01: Dead import comment left in production source

**File:** `src/progress-store.js:8-10`

**Issue:**  
```js
// esc is consumed by progress-store.js consumers (lesson-view.js, sidebar.js)
// when they render progress values into innerHTML. Not used directly in this file.
// import { esc } from './utils/escape.js';
```

Commented-out import with an explanatory justification. The comment is developer-facing scaffolding that was useful during initial development but should not ship in production source. It may confuse future maintainers into thinking `esc` was intentionally removed rather than never needed.

**Fix:** Remove the three-line comment block entirely.

---

### IN-02: `console.warn` left in production path in `lesson-view.js`

**File:** `src/views/lesson-view.js:224`

**Issue:**  
```js
} catch {
  // Silent failure per CONTEXT.md — clipboard is optional convenience
  console.warn('Clipboard write failed');
}
```

The inline comment says "silent failure" but the code still emits a `console.warn`. These are contradictory. In a production build the `console.warn` will appear in end-user browser consoles. While low-severity, it is noise and inconsistent with the stated intent.

**Fix:** Remove the `console.warn` line to achieve actual silent failure, matching the comment's intent.

---

### IN-03: Test timing in `sidebar-progress.test.js` uses hard-coded `setTimeout(resolve, 20)`

**File:** `tests/sidebar-progress.test.js:185`, `tests/sidebar-progress.test.js:201`

**Issue:**  
```js
await new Promise(resolve => setTimeout(resolve, 20))
```

This pattern appears twice as a substitute for awaiting the async file-input handler. A 20ms delay is a magic number that passes under normal conditions but can flake on a slow CI machine. The idiomatic Vitest approach is to use `vi.waitFor` or flush microtasks rather than arbitrary wall-clock delays.

**Fix:**  
```js
// Replace the setTimeout flush with:
await vi.waitFor(() => {
  expect(progressStoreMock.importProgress).toHaveBeenCalledWith(fakeFile)
})
```
Or restructure the test to `await` the handler directly by extracting it.

---

_Reviewed: 2026-05-14_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_
