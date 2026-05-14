# Phase 3: Progress Store — Research

**Researched:** 2026-05-14
**Domain:** localStorage persistence, schema migration, file download/import, Vitest mocking
**Confidence:** HIGH

## Summary

Phase 3 builds `src/progress-store.js` — the single module that owns all localStorage
access for the application. The implementation is a well-understood pattern (wrapper
module + in-memory fallback + schema versioning) with a few non-obvious edge cases in
how browsers signal storage unavailability and how tests can force those failure paths
in Vitest with happy-dom.

The primary technical risk is localStorage availability detection: Safari's private
browsing throws `SecurityError` (not `QuotaExceededError`) when localStorage is
accessed, and some browsers throw on `window.localStorage` itself before `setItem` is
called. The correct detection pattern is a try-catch probe that both sets and removes a
test value — verifying write capability, not just existence. This probe runs once in
`init()`, and the result is cached as a boolean flag; all subsequent read/write calls
branch on that flag without re-probing.

The export (JSON file download) and import (file input + parse + validate + migrate)
paths are straightforward in a GitHub Pages static context. The modern
`URL.createObjectURL + anchor.click + revokeObjectURL` pattern is the correct approach
for export. The modern `File.prototype.text()` async method (promise-based, available
since April 2021 across all modern browsers) is preferred over `FileReader.readAsText`
for import. Both work with no server required.

**Primary recommendation:** Implement `progress-store.js` as a pure ES module with a
single exported `progressStore` object. No class needed — a plain object with a closed-
over state variable (`let _store` and `let _storageAvailable`) is simpler and equally
testable. The Vitest test suite should avoid stubbing `localStorage` globally and
instead use `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(...)` to force
the error path, because happy-dom provides a real localStorage implementation.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** localStorage key: `pipeline-cyber-training:progress`
- **D-02:** Schema shape with `schemaVersion: 1`:
  ```json
  {
    "schemaVersion": 1,
    "lastVisited": { "moduleId": "logging-auditing", "lessonId": "intro" },
    "lessons": {
      "logging-auditing/intro": { "visited": true, "completed": false }
    },
    "quizzes": {
      "logging-auditing/01": { "score": 3, "total": 4, "attemptedAt": "ISO" }
    },
    "exercises": {
      "logging-auditing/01": { "completed": true, "completedAt": "ISO" }
    },
    "scenarios": {
      "logging-auditing/01": { "completed": true, "completedAt": "ISO" }
    }
  }
  ```
- **D-03:** Two-flag lesson tracking: `visited` (first open) + `completed` (quiz passed or lesson finished)
- **D-04:** Quiz scores: last attempt only — `{score, total, attemptedAt}`. No history array.
- **D-05:** Exercise and scenario tracking: `completed` flag + `completedAt` timestamp only. No step-resume in Phase 3.
- **D-06:** `lastVisited: {moduleId, lessonId}` stored; router reads on app load for auto-resume.
- **D-07:** Version mismatch: best-effort migration — keep what maps, drop what does not.
- **D-08:** Migration runner: chained upgrade pattern (`migrateV1toV2`, etc.). Phase 3 ships v1 only; runner wired and tested.
- **D-09:** `localStorage.setItem` failures + unavailability caught; in-memory fallback, app remains functional.
- **D-10:** When fallback active, inline warning injected in current lesson view (not global banner).
- **D-11:** In-memory fallback transparent to callers — all get/set APIs work identically.
- **D-12:** Export + import controls in sidebar footer, always reachable.
- **D-13:** Export format: raw progress object (including `schemaVersion`). Filename: `pipeline-cyber-training-progress-{ISO-date}.json`.
- **D-14:** Import: hidden `<input type="file" accept=".json">`. Validate JSON + `schemaVersion` + run migration if old. On success: replace localStorage + in-memory + re-render. On failure: inline error, no overwrite.

### Claude's Discretion

None listed — all implementation decisions are locked in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- Step-level resume for terminal exercises (`stepReached`) — Phase 5 decision.
- Progress sync across devices — requires authentication; noted as v2.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ASSESS-03 | LocalStorage saves exact progress; returning learners resume at lesson and step they left | `lastVisited` + router integration on init; probe pattern ensures availability before write |
| DATA-04 | LocalStorage schema includes `schemaVersion` key; app handles `QuotaExceededError` gracefully without silent data loss | Schema shape locked in D-02; try-catch pattern with in-memory fallback covers QuotaExceededError AND SecurityError |
| DATA-05 | Learner can export progress data as a JSON file for backup or self-hosted migration | `URL.createObjectURL` + anchor download pattern; no server required on GitHub Pages static host |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| localStorage read/write | Browser (module) | — | All storage access in `progress-store.js`; no server, no CDN layer |
| In-memory fallback | Browser (module) | — | Closed-over `_store` object; same API surface as localStorage path |
| Schema migration runner | Browser (module) | — | Pure function, runs at `init()` after read; no DOM needed |
| Export file download | Browser (DOM) | — | `URL.createObjectURL` + anchor click; client-only, static-host safe |
| Import file read + validate | Browser (DOM) | — | File input element + `File.text()` + JSON.parse; all client-side |
| Inline storage warning | Browser (view) | — | `lesson-view.js` calls `progressStore.isStorageAvailable()` post-render |
| Sidebar footer buttons | Browser (DOM) | — | `initSidebar()` in `sidebar.js` appends footer after `sidebar-modules` |
| lastVisited restore | Browser (router) | — | `main.js` calls `progressStore.init()` before `handleRoute()` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none) | — | All functionality is built on Web Platform APIs (localStorage, Blob, File, URL) | No library needed; the wrapper module IS the abstraction |

### Web Platform APIs Used

| API | Purpose | Notes |
|-----|---------|-------|
| `localStorage` | Persistence | Synchronous; requires try-catch on all writes |
| `URL.createObjectURL` | Export file URL | Creates blob: URL for anchor download trigger |
| `URL.revokeObjectURL` | Memory cleanup | Must call after click to release blob URL |
| `Blob` | Export data container | `new Blob([JSON.stringify(data)], { type: 'application/json' })` |
| `File.prototype.text()` | Import: read file as string | Promise-based; available across all modern browsers since April 2021 [CITED: developer.mozilla.org/en-US/docs/Web/API/Blob/text] |
| `JSON.parse` / `JSON.stringify` | Serialize/deserialize | Wrapped in try-catch for import validation |

**Version verification:** No npm packages to verify. All APIs are standard browser Web Platform APIs available in every browser that supports ES modules (which Vite already requires). [VERIFIED: codebase — package.json shows no storage library dependency needed]

---

## Architecture Patterns

### System Architecture Diagram

```
App Load (main.js init())
    │
    ▼
progressStore.init()
    │── reads localStorage[key]
    │── catches SecurityError / access error → sets _storageAvailable = false
    │── if data present: validate schemaVersion → run migration chain if needed
    │── if data absent: write blank schema with schemaVersion:1
    │── stores parsed data in _store (in-memory shadow)
    │
    ▼
handleRoute() ← reads progressStore.getLastVisited()
    │── if lastVisited present: navigate to #/lesson/{moduleId}/{lessonId}
    │── otherwise: render home
    │
    ▼
renderLesson() ← calls progressStore.markVisited(moduleId, lessonId)
    │── updates _store.lessons[key].visited = true
    │── attempts localStorage write (try-catch)
    │── if StorageError on write: sets _storageAvailable = false
    │── if !isStorageAvailable(): lesson-view injects inline warning
    │
    ▼
Quiz/Exercise/Scenario complete (Phases 4/5/6)
    │── progressStore.saveQuiz / saveExercise / saveScenario
    │── same try-catch write pattern

Sidebar Footer
    │── "Export my progress" → exportProgress()
    │        │── JSON.stringify(_store)
    │        │── Blob → createObjectURL → anchor.click → revokeObjectURL
    │
    │── "Import progress" → triggers hidden file input
             │── File.text() → JSON.parse → validateImport()
             │── if valid: run migration if needed → overwrite _store → write localStorage → re-render
             │── if invalid: inject inline error, leave _store untouched
```

### Recommended Project Structure

```
src/
├── progress-store.js      # new — single localStorage owner (Phase 3)
├── main.js                # modified — add progressStore.init() before handleRoute()
├── router.js              # modified — read progressStore.getLastVisited() on init load
├── sidebar.js             # modified — append export/import footer in initSidebar()
├── views/
│   └── lesson-view.js     # modified — call markVisited() + show storage warning
└── utils/
    └── escape.js          # existing — reuse esc() in warning HTML

tests/
└── progress-store.test.js  # new — covers all public API + migration + fallback
```

### Pattern 1: localStorage Availability Probe

**What:** Run a write-and-remove test to detect whether localStorage is actually writable
(not just defined). Catches both `SecurityError` (Safari private browsing) and
`QuotaExceededError` (quota pre-filled). Cache the result; do not re-probe on every write.

**When to use:** Once in `init()`. Individual write calls also wrap in try-catch to
downgrade to fallback if quota fills up mid-session.

```javascript
// Source: MDN Web Storage API + store.js issue #42 (Safari private browsing)
// [CITED: https://github.com/marcuswestin/store.js/issues/42]
function probeStorage() {
  try {
    const KEY = '__pct_probe__';
    localStorage.setItem(KEY, '1');
    localStorage.removeItem(KEY);
    return true;
  } catch {
    // SecurityError (Safari private), QuotaExceededError (full), or
    // any other DOMException from a restrictive environment
    return false;
  }
}
```

**Critical note:** In Chrome and Firefox, private browsing does NOT disable localStorage
— it simply scopes it to the session. So the probe returns `true` in Chrome/Firefox
private mode (data is available for the session, just not persisted after tab close).
Only Safari throws `SecurityError` on access. This is the correct behavior for this
use case — if writes succeed, we use them. [CITED: https://trackjs.com/javascript-errors/the-operation-is-insecure/]

### Pattern 2: Write with Fallback on Failure

**What:** Every write to localStorage wraps in try-catch. On error, downgrade
`_storageAvailable` flag. The in-memory `_store` is always updated regardless.

```javascript
// Source: [ASSUMED] — standard pattern, confirmed by multiple sources
function _persist() {
  if (!_storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_store));
  } catch {
    // Quota filled mid-session (D-09)
    _storageAvailable = false;
  }
}
```

### Pattern 3: Chained Migration Runner

**What:** The migration runner checks stored `schemaVersion` and chains upgrade
functions until current version is reached. Phase 3 ships v1 only — the runner exists
but there are no upgrade functions yet. The runner is still tested (with a fake v0 → v1
migration) so future developers know the pattern.

```javascript
// Source: [ASSUMED] — standard migration chain pattern
function migrate(data) {
  let d = { ...data };
  // When v1→v2 is needed:
  // if (d.schemaVersion === 1) { d = migrateV1toV2(d); }
  // if (d.schemaVersion === 2) { d = migrateV2toV3(d); }
  return d;
}

function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.schemaVersion !== 'number') return null; // unrecognizable
    if (parsed.schemaVersion < CURRENT_VERSION) return migrate(parsed);
    return parsed;
  } catch {
    return null;
  }
}
```

**Key insight:** The migration function must return a new object (not mutate in place)
so tests can pass a plain object without a real localStorage. This makes the migration
runner independently unit-testable without any DOM/storage setup.

### Pattern 4: Export via Blob + createObjectURL

**What:** Serialize `_store` to JSON, wrap in a Blob, create a temporary anchor element,
trigger a click, then immediately revoke the URL to free memory.

```javascript
// Source: [CITED: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static]
function exportProgress() {
  const json = JSON.stringify(_store, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  a.href     = url;
  a.download = `pipeline-cyber-training-progress-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**GitHub Pages note:** This pattern works on any static host — no server interaction.
The blob: URL is resolved entirely by the browser.

**Note on `showSaveFilePicker`:** The File System Access API (`showSaveFilePicker`) is
NOT appropriate here. It requires HTTPS (fine for GitHub Pages) but is not yet
universally supported (Firefox has limited support as of 2024) and is overkill for a
simple JSON download. [ASSUMED — based on training knowledge of browser support matrix]

### Pattern 5: Import via Hidden File Input + File.text()

**What:** A visually hidden `<input type="file" accept=".json">` is triggered by the
"Import progress" link click. On file selection, read with `File.text()` (modern
promise API), parse and validate, then replace store state.

```javascript
// Source: [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Blob/text]
async function _handleImportFile(file) {
  try {
    const text   = await file.text();
    const parsed = JSON.parse(text);
    if (typeof parsed.schemaVersion !== 'number') {
      return { ok: false, error: 'Not a valid progress file (missing schemaVersion).' };
    }
    // Check for at least one of the known top-level keys
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

**On success:** caller calls `window.location.reload()` or `handleRoute()` to re-render.
The CONTEXT.md says "triggers a page re-render" — `handleRoute()` is preferred over
`reload()` to avoid losing in-memory state; however since the store is now in localStorage,
`handleRoute()` is sufficient. [ASSUMED — minor implementation detail for planner to decide]

### Anti-Patterns to Avoid

- **Direct localStorage access outside progress-store.js:** Every other module in the
  project must import from `progress-store.js`. Router, lesson-view, quiz-engine all
  use the API — never `localStorage.getItem(...)` directly.
- **No `schemaVersion` check on init:** Without the version check, a schema change in
  a future release would corrupt older stored data silently.
- **Calling `JSON.parse` without try-catch:** localStorage can hold any string — a
  corrupted or manually-edited value will throw. Always wrap in try-catch.
- **Not revoking the blob URL:** Failing to call `URL.revokeObjectURL` after export
  creates a memory leak (blob stays alive until page unload).
- **Checking `typeof localStorage !== 'undefined'`:** Not sufficient — Safari private
  mode has `localStorage` defined but throws on any write attempt.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download | Custom server endpoint | `URL.createObjectURL` + anchor pattern | No server needed; works on GitHub Pages |
| File reading | `FileReader` event listener pattern | `File.prototype.text()` | Simpler async/await; same result for JSON text |
| Schema migration | Ad-hoc version checks in every getter | Chained migration runner in `init()` | Single upgrade point; easy to add v2→v3 later |
| Storage detection | `typeof window.localStorage !== 'undefined'` | try-catch probe with a real setItem | Catches Safari SecurityError which passes typeof check |
| HTML escaping in warnings | Manual string replace | `esc()` from `src/utils/escape.js` | Already exists, already handles all 5 characters |

**Key insight:** localStorage abstraction is simple but the edge cases (Safari,
cross-tab, quota mid-session) are subtle. The value of the wrapper module is not
complexity reduction — it is that every caller is isolated from these edge cases by
a clean API that never throws.

---

## Common Pitfalls

### Pitfall 1: Safari SecurityError on localStorage Access (not just setItem)

**What goes wrong:** In Safari private browsing, accessing `window.localStorage` itself
throws a `SecurityError` before any method is called. Code that does
`if (window.localStorage)` or `typeof localStorage !== 'undefined'` will either throw
or return `true` — neither safely detects unavailability.

**Why it happens:** Safari's private browsing mode blocks storage access at the object
reference level, not at the method level.

**How to avoid:** The probe wraps `localStorage.setItem(testKey, ...)` in a try-catch
(not an existence check). The catch handles any exception type. [CITED: https://bugzilla.mozilla.org/show_bug.cgi?id=1381307]

**Warning signs:** "The operation is insecure" in Safari console. App throws uncaught
exception on load in private browsing.

### Pitfall 2: Chrome/Firefox Private Mode DOES Allow localStorage

**What goes wrong:** Assuming private/incognito mode always prevents localStorage.
Chrome and Firefox scope localStorage to the session in private mode — writes succeed
and the probe returns `true`. Data is lost when the tab closes, but for the session
the store works normally.

**Why it happens:** Only Safari throws on storage access in private mode.

**How to avoid:** No action needed. The behavior is correct for this use case — if
writes succeed, use them. Do NOT add special-case private-mode detection.

**Warning signs:** Over-engineering detection code; adding `navigator.webdriver` checks
or storage quota heuristics unnecessarily.

### Pitfall 3: Migration Mutating Stored Data Before Writing

**What goes wrong:** Migration function mutates the parsed object in place, then
writes it back. If migration throws partway through, the partially-migrated object
is written to localStorage and the original is lost.

**Why it happens:** JavaScript objects are mutable; shallow spread (`{ ...data }`) only
protects top level.

**How to avoid:** Migration functions must build and return a new object. Use spread or
`JSON.parse(JSON.stringify(data))` for a deep copy at the start of migration. Write to
localStorage only after migration returns successfully (in the caller, not inside
`migrate()`). [ASSUMED — standard defensive migration pattern]

### Pitfall 4: Re-rendering on Import Using window.location.reload()

**What goes wrong:** After successful import, calling `window.location.reload()` works
but loses the current in-memory `_store` state momentarily (reload fetches from
localStorage). If the write to localStorage failed (fallback mode), reload shows
old data.

**Why it happens:** The store's in-memory shadow is rebuilt on reload from the
localStorage write. In fallback mode, the write never happened.

**How to avoid:** After import, check if `_storageAvailable` is true before deciding
how to re-render. If storage is available: `window.location.reload()` is fine (data
is now in localStorage). If storage is in fallback mode: call `handleRoute()` directly
(the in-memory `_store` is already updated). [ASSUMED — implementation detail for executor]

### Pitfall 5: sidebar-toggle Button Is the Last Element in #sidebar

**What goes wrong:** The export/import footer is injected at the bottom of the
sidebar. The existing `#sidebar` layout has `#sidebar-modules` (flex: 1) and
`#sidebar-toggle` (fixed height at bottom). Appending after `#sidebar-toggle` places
the footer outside the sidebar's visual bounds.

**Why it happens:** The sidebar uses `flex-direction: column; overflow: hidden`. The
toggle button is positioned using `border-top` as a visual separator.

**How to avoid:** The export/import footer must be inserted BETWEEN `#sidebar-modules`
and `#sidebar-toggle`, not after. The correct DOM insertion is
`sidebar.insertBefore(footer, toggleBtn)`. Check `index.html` layout: `#sidebar-modules`
(div) → `#sidebar-toggle` (button) — insert footer between them. [VERIFIED: codebase — index.html read directly]

### Pitfall 6: Blank lesson-view Wiring on First Load

**What goes wrong:** `progressStore.init()` must complete and set `lastVisited` before
`handleRoute()` runs. If `init()` is async and `handleRoute()` fires before it
resolves, `getLastVisited()` returns null and the auto-resume feature silently fails.

**Why it happens:** The current `main.js` runs `handleRoute()` and `initSidebar()` in
`Promise.all` — they run concurrently. Adding `progressStore.init()` to that
`Promise.all` would be wrong; it must be `await`-ed before both.

**How to avoid:** In `main.js`, change the init sequence to:
```javascript
async function init() {
  await loadComplianceRefs();
  await progressStore.init();          // must complete before handleRoute
  await Promise.all([handleRoute(), initSidebar()]);
}
```
[VERIFIED: codebase — src/main.js read directly; current Promise.all pattern confirmed]

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Public API Surface (minimum required)

```javascript
// Source: Derived from CONTEXT.md locked decisions D-01 through D-14 [VERIFIED: 03-CONTEXT.md]
export const progressStore = {
  init(),                              // async; probes storage, loads + migrates data
  isStorageAvailable(),                // boolean; lesson-view checks this post-render
  getLastVisited(),                    // returns { moduleId, lessonId } or null
  setLastVisited(moduleId, lessonId),  // called by router on each lesson render

  // Lesson tracking
  markVisited(moduleId, lessonId),     // sets lessons[key].visited = true
  markLessonCompleted(moduleId, lessonId), // sets lessons[key].completed = true

  // Quiz / exercise / scenario
  saveQuiz(moduleId, quizId, { score, total }),
  saveExercise(moduleId, exerciseId),
  saveScenario(moduleId, scenarioId),

  // Getters for progress display (Phase 4 will call these)
  getLessonProgress(moduleId, lessonId), // returns {visited, completed} or defaults
  getQuizScore(moduleId, quizId),        // returns {score, total, attemptedAt} or null
  getExerciseCompletion(moduleId, exerciseId), // returns {completed, completedAt} or null
  getScenarioCompletion(moduleId, scenarioId), // returns {completed, completedAt} or null

  // Data portability
  exportProgress(),    // triggers file download
  importProgress(file), // async; validates + migrates + replaces store; returns {ok, error?}

  // For testing / internal wiring
  resetProgress(),    // clears _store and localStorage; useful for test setup
};
```

### Vitest Pattern: Forcing the Fallback Path

```javascript
// Source: [CITED: https://dylanbritz.dev/writing/mocking-local-storage-vitest/]
// happy-dom provides a real localStorage — spy on the prototype to force errors

import { vi, describe, it, expect, afterEach } from 'vitest'
import { progressStore } from '../src/progress-store.js'

describe('storage fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('falls back to in-memory when setItem throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError')
    })
    await progressStore.init()
    // Should not throw
    progressStore.markVisited('logging-auditing', 'intro')
    // In-memory state should still be updated
    expect(progressStore.getLessonProgress('logging-auditing', 'intro').visited).toBe(true)
    // Storage availability flag should be false
    expect(progressStore.isStorageAvailable()).toBe(false)
  })
})
```

### Vitest Pattern: Testing Migration Runner in Isolation

```javascript
// Source: [ASSUMED] — migration runner should be an exportable pure function
// Export _migrateForTesting (or make migrate() a named export) for unit tests

import { _migrate } from '../src/progress-store.js' // named export for testing

it('migrate noop when schemaVersion equals current', () => {
  const input = { schemaVersion: 1, lessons: {}, quizzes: {}, exercises: {}, scenarios: {} }
  const result = _migrate({ ...input })
  expect(result.schemaVersion).toBe(1)
  expect(result).toMatchObject(input)
})
```

### Sidebar Footer DOM Insertion

```javascript
// Source: [VERIFIED: index.html — sidebar structure confirmed]
// Insert between #sidebar-modules and #sidebar-toggle

function appendProgressFooter(sidebar) {
  const toggleBtn = document.getElementById('sidebar-toggle')
  if (!sidebar || !toggleBtn) return

  const footer = document.createElement('div')
  footer.id = 'sidebar-progress-footer'
  // small text link style per D-12
  footer.innerHTML = `
    <div style="padding: var(--spacing-sm) var(--spacing-md); border-top: 1px solid var(--color-border);">
      <button id="btn-export-progress" style="...small link style...">Export my progress</button>
      <button id="btn-import-progress" style="...small link style...">Import progress</button>
      <input id="import-file-input" type="file" accept=".json" style="display: none;" />
    </div>
  `
  sidebar.insertBefore(footer, toggleBtn)
}
```

### Storage Warning in lesson-view.js

```javascript
// Source: [VERIFIED: src/views/lesson-view.js and src/utils/escape.js]
// Inject after lesson HTML is inserted into DOM; reuses existing .lesson-error CSS class

import { progressStore } from '../progress-store.js'
import { esc } from '../utils/escape.js'

// In renderLesson(), after app.innerHTML = lessonHtml and before return null:
if (!progressStore.isStorageAvailable()) {
  const warningDiv = document.createElement('div')
  warningDiv.className = 'storage-warning'
  warningDiv.setAttribute('role', 'alert')
  warningDiv.innerHTML = `
    <p style="font-size: var(--text-body); color: var(--color-text-muted);">
      Progress cannot be saved — storage is unavailable (private browsing or quota full).
      Your progress this session will be lost when you close the tab.
    </p>
  `
  // Insert at top of .lesson-column
  const lessonColumn = document.querySelector('.lesson-column')
  if (lessonColumn) lessonColumn.prepend(warningDiv)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `FileReader.readAsText` (event-based) | `File.prototype.text()` (promise) | April 2021 (MDN) | Cleaner async/await for import flow |
| `window.localStorage !== null` check | try-catch probe with `setItem` | N/A (always correct) | Handles Safari SecurityError |
| Separate export library (FileSaver.js) | Native `URL.createObjectURL` + anchor | Browser baseline stabilized ~2019 | No additional dependency needed |

**Deprecated/outdated:**
- `FileSaver.js`: Replaced by native Blob + createObjectURL. [ASSUMED — widespread consensus]
- `FileReader` for simple text reads: Still works, but `File.text()` is the modern path. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Blob/text]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `showSaveFilePicker` not appropriate (Firefox support gaps) | Architecture Patterns — Pattern 4 | Low risk — `createObjectURL` pattern is universally supported; even if showSaveFilePicker is now well-supported, the simpler pattern is still correct |
| A2 | After import success, `handleRoute()` preferred over `window.location.reload()` in fallback mode | Pitfall 4 | Low risk — both work when storage is available; reload is simpler and widely used |
| A3 | `_migrate()` should be a named export for testing | Code Examples — Testing Migration | Low risk — can also be tested through `init()` by pre-seeding localStorage with old schema data |
| A4 | `window.location.reload()` is acceptable for re-render after import when storage is available | Pattern 5 | Low risk — both approaches work; reload is the simplest path to a clean state |

---

## Open Questions

1. **Re-render mechanism after import**
   - What we know: CONTEXT.md says "triggers a page re-render" without specifying `reload()` vs `handleRoute()`
   - What's unclear: In fallback mode (storage unavailable), `reload()` would lose the just-imported in-memory state
   - Recommendation: Use `handleRoute()` by default; the planner should make this explicit in the task

2. **`_migrate` export for testing**
   - What we know: The migration runner needs to be testable without a real localStorage
   - What's unclear: Whether to export it as `_migrate` (underscore-prefixed semi-private) or via a separate `migrateForTesting` name
   - Recommendation: Export as `export { migrate as _migrateForTesting }` — documents its test-only intent

3. **`setLastVisited` caller**
   - What we know: CONTEXT.md says router reads `lastVisited` on load; `markVisited` is called by lesson-view
   - What's unclear: Whether `setLastVisited` is called by lesson-view (alongside `markVisited`) or by the router (after route match)
   - Recommendation: lesson-view calls both `markVisited` AND `setLastVisited` — keeps all progress writes in one place

---

## Environment Availability

All functionality is client-side Web Platform APIs. No external tools, CLIs, databases, or services required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev + test | ✓ | v24.15.0 | — |
| Vitest | Test runner | ✓ | 4.1.6 | — |
| happy-dom | Test DOM environment | ✓ | 20.9.0 | — |
| localStorage (browser) | Progress persistence | ✓ (runtime) | Web Platform | In-memory fallback (D-09) |

**No missing dependencies.** [VERIFIED: codebase — npm run test passes 26/26 tests]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.js` (environment: happy-dom) |
| Quick run command | `npx vitest run tests/progress-store.test.js` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSESS-03 | `getLastVisited()` returns stored moduleId/lessonId after `init()` | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| ASSESS-03 | `markVisited()` persists to localStorage and returns correct value via getter | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-04 | `init()` with `setItem` throwing falls back to in-memory (isStorageAvailable = false) | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-04 | Schema with old `schemaVersion` is migrated on `init()` | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-04 | Corrupt localStorage data (invalid JSON) is recovered gracefully | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-05 | `exportProgress()` triggers download (Blob created, anchor clicked) | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-05 | `importProgress(file)` with valid JSON replaces store and writes localStorage | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-05 | `importProgress(file)` with missing `schemaVersion` returns `{ ok: false }` | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/progress-store.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/progress-store.test.js` — covers all items above (ASSESS-03, DATA-04, DATA-05)
- No new framework config needed — existing `vitest.config.js` with `happy-dom` environment covers all storage and DOM tests

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not applicable — no auth in Phase 3 |
| V3 Session Management | no | Progress is not a session token |
| V4 Access Control | no | Single-user, single-origin localStorage |
| V5 Input Validation | yes | `JSON.parse` wrapped in try-catch; `schemaVersion` type check; known-keys check before accepting import |
| V6 Cryptography | no | Progress data is non-sensitive training state; no encryption needed |

### Known Threat Patterns for localStorage + File Import

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious JSON import (prototype pollution via `__proto__` key) | Tampering | Use `JSON.parse` (safe by default — does not assign to prototype chain); additionally validate only known top-level keys are processed |
| XSS via injected progress data rendered to DOM | Tampering | `esc()` from `src/utils/escape.js` applied to all values rendered to innerHTML; do not render raw stored strings without escaping |
| Quota exhaustion by oversized import file | Denial of Service | File size check before parse (optional: reject if > 1MB); localStorage write wrapped in try-catch |

**Note:** Progress data (lesson IDs, quiz scores, timestamps) is not sensitive. No PII
is stored. NERC CIP data-at-rest controls do not apply here. [VERIFIED: CLAUDE.md — "No backend, no real PowerShell execution"; no user credentials stored]

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` are mandatory and must be honored in all plans:

1. **All localStorage access goes through `progress-store.js` exclusively.** No other
   module may call `localStorage.getItem/setItem/removeItem` directly.
2. **No backend, no real PowerShell execution.** Progress store is client-only.
3. **Static GitHub Pages hosting.** Export/import must use client-only browser APIs
   (`URL.createObjectURL`, `File.text()`); no server endpoints.
4. **PS version target: 5.1.** Not relevant to progress store directly, but the training
   context must not be corrupted by incorrect data.
5. **TSA directive version strings in `data/compliance-refs.json`.** Progress store does
   not store compliance version strings — those remain in `compliance-refs.json`. The
   progress store schema must not duplicate compliance metadata.
6. **`esc()` from `src/utils/escape.js`** must be applied to any value from the progress
   store inserted into `innerHTML` (inline warning, any future progress display).
7. **Null-guard pattern (WR-04):** `if (element && element.classList)` before DOM
   manipulation — apply in sidebar footer button wiring and storage warning injection.

---

## Sources

### Primary (HIGH confidence)
- CONTEXT.md (03-CONTEXT.md) — all locked decisions D-01 through D-14 [VERIFIED: file read directly]
- `src/main.js`, `src/sidebar.js`, `src/router.js`, `src/views/lesson-view.js` — integration points [VERIFIED: files read directly]
- `index.html` — sidebar DOM structure; toggle button position confirmed [VERIFIED: file read directly]
- `vitest.config.js` — happy-dom environment confirmed [VERIFIED: file read directly]
- `package.json` — Vitest 4.1.6, happy-dom 20.9.0 [VERIFIED: file + npm view]
- MDN Web Docs — URL.createObjectURL [CITED: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static]
- MDN Web Docs — Blob.text() [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Blob/text]
- Mozilla Bugzilla — Safari SecurityError [CITED: https://bugzilla.mozilla.org/show_bug.cgi?id=1381307]

### Secondary (MEDIUM confidence)
- store.js issue #42 — Safari private browsing behavior [CITED: https://github.com/marcuswestin/store.js/issues/42]
- TrackJS — "The operation is insecure" patterns [CITED: https://trackjs.com/javascript-errors/the-operation-is-insecure/]
- Dylan Britz — Vitest localStorage mocking [CITED: https://dylanbritz.dev/writing/mocking-local-storage-vitest/]
- Run That Line — Vitest localStorage mocking [CITED: https://runthatline.com/vitest-mock-localstorage/]

### Tertiary (LOW confidence — see Assumptions Log)
- `showSaveFilePicker` Firefox support gaps — marked [ASSUMED] in text

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; Web Platform APIs only, all verified against MDN
- Architecture: HIGH — all integration points read from actual source files
- Pitfalls: HIGH — localStorage edge cases verified against bug reports and MDN; sidebar insertion point verified from index.html
- Migration pattern: MEDIUM — standard pattern, not verified against a library; tagged [ASSUMED] where specific
- Test patterns: MEDIUM — happy-dom + vi.spyOn confirmed from community sources

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable Web Platform APIs; Vitest API is stable at 4.x)
