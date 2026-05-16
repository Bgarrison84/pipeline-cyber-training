---
phase: 05-simulated-powershell-terminal-exercise-view
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/terminal-engine.js
  - src/views/exercise-view.js
  - src/router.js
  - src/modules-config.js
  - src/views/module-view.js
  - src/quiz-engine.js
  - src/style.css
  - src/utils/icons.js
  - public/data/modules/logging-auditing/exercises/01.json
  - tests/terminal-engine.test.js
  - tests/exercise-view.test.js
  - tests/router.test.js
  - tests/quiz-engine.test.js
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 05 delivers `createTerminal` (terminal-engine.js), `renderExercise` (exercise-view.js), and wires them into the router together with updates to `quiz-engine.js` (computeModuleProgress exercise branch) and `module-view.js`. The implementation is structurally sound — `esc()` is applied to all JSON values injected via `innerHTML`, `textContent` is correctly used for terminal output, localStorage access goes exclusively through `progressStore`, and `import.meta.env.BASE_URL` is applied to both fetch calls.

Two critical issues were found: an XSS vector in `badge.js` (`directiveKey` used unescaped in an HTML attribute), and a URL path-traversal risk where attacker-controlled route parameters are concatenated directly into fetch URLs without sanitisation. Four warnings cover logic gaps, a missing guard, and a test reliability issue.

---

## Critical Issues

### CR-01: Unsanitised `directiveKey` injected into HTML class attribute in `renderBadge`

**File:** `src/badge.js:20`
**Issue:** `directiveKey` is sourced from exercise/quiz JSON (`complianceControls` arrays) and passed to `renderBadge` without sanitisation. The value is interpolated directly into a Tailwind class string in the `<span>` element's `class` attribute — `${colorClasses[directiveKey] ?? ''}` — with no `esc()` call. Although the `colorClasses` lookup is a safe dictionary (only `TSA` and `NIST` produce output), the fallback `?? ''` means any value that fails the lookup still passes through. A crafted `directiveKey` such as `" onmouseover="alert(1)"` would break out of the class attribute and inject an event handler. The same `directiveKey` is also passed through `esc(shortName)` for the text node, but the class attribute itself is unprotected.

The exercise JSON is a static file served from `public/`, so exploitation requires an attacker to modify a served asset (e.g. via a compromised CDN or supply-chain issue). The vector still constitutes an XSS sink and violates the project's stated rule that all JSON strings injected via `innerHTML` must be escaped.

**Fix:**
```js
// src/badge.js line 20 — escape directiveKey before attribute injection
const safeClasses = colorClasses[directiveKey] ?? '';
return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${esc(safeClasses)}">${esc(shortName)}</span>`;
```

---

### CR-02: Route parameters concatenated directly into fetch URLs — path-traversal risk

**File:** `src/views/exercise-view.js:33`, `src/quiz-engine.js:30`
**Issue:** `moduleId` and `exerciseId` (or `quizId`) are extracted from the URL hash by the router via `decodeURIComponent`, then injected verbatim into fetch URLs:

```js
// exercise-view.js:33
const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/exercises/' + exerciseId + '.json';

// quiz-engine.js:30
const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/quizzes/' + quizId + '.json';
```

A crafted hash such as `#/exercise/../../etc/passwd/foo` would, after `decodeURIComponent`, produce a URL that traverses outside the `data/modules/` tree. While GitHub Pages serves static files and will simply 404 on any traversal attempt, the pattern is a concrete path-traversal sink: if hosting is ever changed (e.g. to an Express dev server or a proxy), arbitrary file reads become possible. The project's CLAUDE.md lists no backend, but the fetch call is the boundary — it should enforce that parameters are safe identifiers before they are used as path segments.

**Fix:** Sanitise both parameters before URL construction. A simple allowlist regex is sufficient given that valid IDs are slug-style strings:

```js
function safePath(segment) {
  // Only allow alphanumeric, hyphens, and underscores — no slashes, dots, or spaces
  if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('Invalid path segment: ' + segment);
  return segment;
}

// exercise-view.js
const url = import.meta.env.BASE_URL
  + 'data/modules/' + safePath(moduleId) + '/exercises/' + safePath(exerciseId) + '.json';

// quiz-engine.js
const url = import.meta.env.BASE_URL
  + 'data/modules/' + safePath(moduleId) + '/quizzes/' + safePath(quizId) + '.json';
```

If validation fails the view should render its existing error state rather than throw.

---

## Warnings

### WR-01: `handleCommand` continues matching after exercise is fully complete

**File:** `src/views/exercise-view.js:94`
**Issue:** `handleCommand` checks `if (currentStepIndex >= steps.length) return;` at the top, which is correct. However, `completeExercise()` calls `terminal.disable()` but the `disabled` flag lives inside `createTerminal`'s closure — the `input` element is set to `readonly` and `pointerEvents: none`. A user who manages to fire the keydown event via synthetic dispatch (test automation, accessibility tools, or browser extensions that bypass `pointerEvents`) after completion will find `handleCommand` returns early only because the outer guard is hit. This is correct, but `terminal.disable()` does not prevent the keydown listener in `terminal-engine.js` from calling `commandHandler` again because the `disabled` check only gates the keydown handler inside `createTerminal`, not any external call path.

The specific risk: `handleCommand` is closed over `currentStepIndex` which is already `>= steps.length` after completion, so the early return fires correctly. However `completeExercise()` does not set a local `exerciseCompleted` flag in `renderExercise`'s scope. If `steps` is empty (`steps.length === 0`), `currentStepIndex` starts at 0 and the guard `0 >= 0` is true, so `completeExercise()` would be called immediately on the first command, with no step ever being successfully matched. This is an off-by-one edge case when an exercise JSON has zero steps.

**Fix:** Add an explicit guard for the empty-steps case:

```js
// exercise-view.js — Step 13, top of handleCommand, after the existing guard
if (steps.length === 0) return; // no-op for exercises with no steps defined
```

Additionally, call `completeExercise()` unconditionally when steps is empty only if that is intentional — but it is safer to treat 0-step exercises as invalid and disable terminal immediately after mounting:

```js
// Step 10 — Step state
let currentStepIndex = 0;
const steps = exercise.steps ?? [];

if (steps.length === 0) {
  if (terminal) terminal.disable();
  return null;
}
```

---

### WR-02: `markLessonCompleted` not called in the `markVisited` path — visited-only lessons never gain `completed: true`

**File:** `src/progress-store.js:157-165` (cross-reference from `src/quiz-engine.js:275`)
**Issue:** `computeModuleProgress` treats quiz-less, exercise-less lessons as complete when `getLessonProgress().visited` is `true`. However, `markVisited` only sets `visited: true`, never `completed: true`. This is intentional by design. The issue is in the converse: `markLessonCompleted` sets `completed: true` but does NOT set `visited: true`. When `completeExercise()` in `exercise-view.js:187` calls `progressStore.markLessonCompleted(moduleId, lessonId)`, the lesson record gains `completed: true` but `visited` remains `false` if `markVisited` was never called first (e.g., the user navigated directly to the exercise URL without opening the lesson view). `lessonStatusBadge` in `module-view.js` only checks `getLessonProgress(mod.id, lesson.id).visited`, not `.completed` — so a completed exercise lesson that was never "visited" will display the `unvisited` badge on the module page, which is misleading.

**Fix:** In `module-view.js`, update `lessonStatusBadge` to also check `completed`:

```js
const lp = progressStore.getLessonProgress(mod.id, lesson.id);
if (lp.visited || lp.completed) {
  return '<span style="' + visitedStyle + '">visited</span>';
}
```

Or, in `progress-store.js`, have `markLessonCompleted` also set `visited: true`:

```js
function markLessonCompleted(moduleId, lessonId) {
  const key = moduleId + '/' + lessonId;
  _store.lessons[key] = {
    ...(_store.lessons[key] ?? { visited: false, completed: false }),
    visited: true,   // completing implies having been there
    completed: true,
  };
  _persist();
}
```

---

### WR-03: `renderCompletionBanner` injects `badges` HTML without a null/XSS guard on `renderBadge` return value

**File:** `src/views/exercise-view.js:219-229`
**Issue:** `renderCompletionBanner` builds `badges` by mapping `exercise.complianceControls` through `renderBadge(tag)`. `renderBadge` returns an HTML string and both usages `(badges ? ...)` guard against empty string. However, the `badges` string is injected via `banner.innerHTML = \`...\`` at line 219. This is safe only because `renderBadge` internally calls `esc()` on `shortName`. The critical path from badge.js line 20 is that `colorClasses[directiveKey] ?? ''` injects the Tailwind class string **unescaped** (as noted in CR-01). This compounds CR-01: the unescaped class string ends up in the `innerHTML` of the completion banner.

This is the same root cause as CR-01 — listed separately to flag that the injection site is in both the initial `buildExerciseHtml` (line 239, 280, 294) and in the dynamically-appended `renderCompletionBanner` (line 206).

**Fix:** Same as CR-01 — apply `esc()` to the class string inside `renderBadge`. No additional change needed in `exercise-view.js` once `badge.js` is fixed.

---

### WR-04: `exercise-view.test.js` mock for `sidebar.js` is a static `vi.mock` but `exercise-view.js` uses a dynamic `import('../sidebar.js')`

**File:** `tests/exercise-view.test.js:37-39`
**Issue:** The test file registers a static module mock:

```js
vi.mock('../src/sidebar.js', () => ({
  refreshSidebarProgress: vi.fn(),
}))
```

`exercise-view.js` line 189 calls `import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — a dynamic import. Vitest does intercept dynamic imports for `vi.mock`-registered modules, so this works in current Vitest versions, but it creates a subtle test-reliability risk: the `.then()` callback is asynchronous. In the test at line 199–206, `commandHandler` is called for the last step, which triggers `completeExercise()` synchronously, which calls the dynamic import. The test assertion (`expect(progressStoreMock.saveExercise).toHaveBeenCalledWith(...)`) runs on the next tick, but `refreshSidebarProgress` has not yet resolved. If Vitest ever changes dynamic-import mock resolution timing, the sidebar refresh assertion could race.

More concretely: no test asserts that `refreshSidebarProgress` is called on completion, which means this code path is entirely untested. Adding such a test would expose the timing issue.

**Fix:** Add `await Promise.resolve()` (or a `flushPromises` helper) after the last-step command in tests that verify side effects of `completeExercise()`:

```js
commandHandler('New-Item ...')
await Promise.resolve() // flush microtask queue so dynamic import resolves
expect(refreshSidebarProgressMock).toHaveBeenCalledWith('logging-auditing')
```

---

## Info

### IN-01: `modules-config.js` stale comment says "Phase 2 replaces this"

**File:** `src/modules-config.js:3`
**Issue:** The top-of-file comment reads "Phase 2 replaces this with: `fetch(import.meta.env.BASE_URL + 'data/modules/index.json')`". Phase 5 has shipped and the static config is still in use. The comment implies this is temporary technical debt but the replacement never happened. Module metadata (lesson titles, `exerciseId` bindings, `quizId` bindings) is now load-bearing in multiple views and tests. If the comment's intent was to make the list dynamic, it is now out of date and misleading. If the static config is the accepted long-term approach, the comment should be removed.

**Fix:** Remove the stale comment or replace it with a note documenting why the static config is intentional for this static-site architecture.

---

### IN-02: `router.js` calls `setActiveLesson` only when `params.lessonId` is present — exercise routes never update sidebar lesson highlight

**File:** `src/router.js:79-81`
**Issue:**

```js
if (params.lessonId) {
  setActiveLesson(params.moduleId, params.lessonId);
}
```

Exercise routes (`#/exercise/:moduleId/:exerciseId`) have `params.exerciseId` but no `params.lessonId`. Therefore navigating to an exercise never calls `setActiveLesson`, so the sidebar never highlights the associated lesson. A user completing the exercise from the sidebar will see the active highlight disappear when they land on the exercise page. This is a UX gap but it also creates an inconsistency: `module-view.js` renders lesson rows and exercise links side-by-side, implying a lesson-exercise association that the router does not track.

**Fix:** In `handleRoute`, after exercise routes are matched, look up the associated lessonId from MODULES config and call `setActiveLesson`:

```js
// After matchRoute, before activateIcons
if (params.exerciseId && params.moduleId) {
  const mod = MODULES.find(m => m.id === params.moduleId);
  const lesson = mod?.lessons.find(l => l.exerciseId === params.exerciseId);
  if (lesson) setActiveLesson(params.moduleId, lesson.id);
}
```

---

### IN-03: `terminal-engine.js` has no maximum history size — unbounded memory growth

**File:** `src/terminal-engine.js:121`
**Issue:** `history.unshift(trimmed)` appends to the history array on every Enter key press with no cap. A user (or automated test) pressing Enter thousands of times will grow the array without bound. In a training app session of reasonable length this is unlikely to matter, but there is no guard. The history array is held in the `createTerminal` closure for the lifetime of the exercise view and is not cleared between route navigations (each navigation recreates the terminal, so the old closure is GC'd — this mitigates the issue in practice).

**Fix:** Cap history at a reasonable size (e.g., 100 entries):

```js
history.unshift(trimmed);
if (history.length > 100) history.length = 100;
```

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
