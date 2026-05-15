---
phase: 04-quiz-engine-lesson-progress-ui
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/utils/icons.js
  - src/modules-config.js
  - src/quiz-engine.js
  - src/views/lesson-view.js
  - src/sidebar.js
  - src/views/module-view.js
  - public/data/modules/logging-auditing/lessons/audit-policies.md
  - public/data/modules/logging-auditing/quizzes/01.json
  - tests/quiz-engine.test.js
  - tests/module-view.test.js
  - tests/sidebar.test.js
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 04 delivers the quiz engine, sidebar progress bars, module-view lesson status badges, and the lesson-view integration that ties them together. The architecture is generally sound — the dynamic import used to break the `quiz-engine` ↔ `sidebar` circular dependency is correct, `esc()` is applied consistently to all data that enters `innerHTML`, and the progress-store boundary is respected.

Two critical issues are present: an unguarded `null` dereference in `module-view.js` that crashes on first page load before `progressStore.init()` is called, and an unsanitised CSS color value injected directly into a `innerHTML` `style` attribute in `quiz-engine.js`. Five warnings cover behavioral correctness gaps (completion banner rendered into the wrong scope, revisit-mode quiz still firing the click handler, `icon` variable used after potential DOM replacement, stale `onmouseout` hover color, and a duplicate `font-size` / `padding-left` property clash). Three info items cover test reliability and a dead JSDoc return type.

---

## Critical Issues

### CR-01: Unguarded `lp.visited` access crashes when `_store` is null (module-view.js)

**File:** `src/views/module-view.js:22-29`

**Issue:** `lessonStatusBadge()` calls `progressStore.getLessonProgress()` and immediately accesses `.visited` on the returned value. The real `getLessonProgress()` implementation in `progress-store.js` reads from `_store.lessons[key]`, where `_store` starts as `null` until `progressStore.init()` is awaited. If `renderModule()` is called synchronously during router setup before `init()` resolves, `getLessonProgress()` will throw `TypeError: Cannot read properties of null (reading 'lessons')`, crashing the view. The mock in `module-view.test.js` hides this because it always returns a safe object; no test exercises the uninitialised code path.

This is a latent crash that surfaces under any race condition between router dispatch and async store initialisation — e.g. fast hash navigation on page load.

```js
// module-view.js line 22-29 — no null guard on lp
const lp = progressStore.getLessonProgress(mod.id, lesson.id);
if (lp.visited) {  // throws if _store is null
```

**Fix:** Either (a) ensure `renderModule` is never called before `progressStore.init()` resolves (enforced by the router, not currently guaranteed), or (b) add a null guard in `getLessonProgress` itself — the function already returns `{ visited: false, completed: false }` as the fallback via `?? {}` when the key is missing; extend that to guard against `_store === null`:

```js
// progress-store.js — add guard at top of getLessonProgress
function getLessonProgress(moduleId, lessonId) {
  if (!_store) return { visited: false, completed: false };
  return _store.lessons[moduleId + '/' + lessonId] ?? { visited: false, completed: false };
}
```

Apply the same guard to `getQuizScore`, `getExerciseCompletion`, and `getScenarioCompletion` for the same reason.

---

### CR-02: Unsanitised value interpolated into `style` attribute via `innerHTML` (quiz-engine.js)

**File:** `src/quiz-engine.js:232-236`

**Issue:** `bannerColor` is set to either the string literal `'#22c55e'` or the CSS variable string `'var(--color-text-muted)'` — both are controlled constants, so in this exact call path there is no injection risk today. However the value is then concatenated directly into an `innerHTML` string inside a `style="color: ${bannerColor}"` attribute with no escaping:

```js
completionBanner.innerHTML = `<p style="font-size: var(--text-body); font-weight: 600; color: ${bannerColor}; margin: 0;">Quiz complete — ${score}/${totalQuestions} correct</p>`;
```

`score` and `totalQuestions` are integers produced by the engine itself (not user input), so those are safe. But the pattern of raw interpolation into a `style` attribute is dangerous: if `bannerColor` ever becomes data-driven (e.g. read from quiz JSON to support per-module theming), this becomes a CSS injection vector that can exfiltrate data via `url()` calls or break layout with `</style>` sequences. The project's own convention is to use `esc()` or `style.cssText` assignments for all dynamic values.

**Fix:** Use a DOM property assignment instead of `innerHTML` for the banner:

```js
const p = document.createElement('p');
p.style.cssText = 'font-size: var(--text-body); font-weight: 600; margin: 0;';
p.style.color = score === totalQuestions ? '#22c55e' : 'var(--color-text-muted)';
p.textContent = `Quiz complete — ${score}/${totalQuestions} correct`;
completionBanner.appendChild(p);
```

---

## Warnings

### WR-01: Completion banner appended to `section` instead of `lessonColumn`, so it lands inside the quiz section (quiz-engine.js)

**File:** `src/quiz-engine.js:234-237`

**Issue:** After all questions are answered, the completion banner is appended to `section` (the `.quiz-section` element), placing it at the bottom of the quiz section itself. This is an intentional placement, but `section` is the element that already received `lessonColumn.appendChild(section)` — so the banner is visually correct. The concern is that `attachQuizHandlers` has no reference back to `lessonColumn`; if the design spec requires the banner to appear outside the quiz block (e.g., after the lesson nav footer), this is silently wrong. More concretely: the `.quiz-section` already has a `border-top` separator on it, and the banner's `margin-top: var(--spacing-lg)` pushes it below the last question card but still inside the bordered box. This contradicts standard "completion confirmation outside the form" UX — most quiz UIs render the score summary as a sibling of the quiz section, not a child.

The actual layout bug: the completion banner is a child of `.quiz-section`, which has `border-top` on the section itself. The banner ends up visually enclosed within the quiz box with no visual distinction from the question cards.

**Fix:** Append to `lessonColumn` (passed into `renderQuiz`) rather than to `section`. Since `attachQuizHandlers` only receives `section`, thread `lessonColumn` through:

```js
// attachQuizHandlers signature change
function attachQuizHandlers(section, moduleId, quizId, quiz, lessonId, lessonColumn) { ... }
// append banner outside quiz section
lessonColumn.appendChild(completionBanner);
```

---

### WR-02: Revisit-mode quiz card has `data-answered="true"` but click handler is still attached via the section-level event listener — double-click risk (quiz-engine.js)

**File:** `src/quiz-engine.js:57-59` and `quiz-engine.js:172-173`

**Issue:** In revisit mode (`prior !== null`), `buildRevisitHtml` sets `data-answered="true"` on all question cards, and `attachQuizHandlers` is not called. The buttons have `pointer-events: none` in the HTML. This appears safe. However: the `section` element itself has no click handler in revisit mode, so a programmatic `btn.click()` (as exercised by the revisit mode test at line 269 of the test file) correctly does nothing — the guard at line 173 (`questionCard.dataset.answered === 'true'`) fires and returns.

The actual bug is different: the `section` event listener is attached via `section.addEventListener('click', ...)` only when `prior === null` (line 57-59). This is correct. However, if a user somehow navigates away and back to the same lesson in the same browser session without a page reload, the module cache in `MODULES` is static, `progressStore.getQuizScore` will return a non-null value, `buildRevisitHtml` will be called, and `attachQuizHandlers` will NOT be called. So far so good. But `lessonColumn.appendChild(section)` is called unconditionally — if `renderQuiz` is called twice for the same quiz (e.g., rapid navigation back-and-forth), two `.quiz-section` elements will be appended to `lessonColumn` with no deduplication check.

**Fix:** Add a guard before appending:

```js
// Before lessonColumn.appendChild(section):
const existing = lessonColumn.querySelector('.quiz-section');
if (existing) existing.remove();
lessonColumn.appendChild(section);
```

---

### WR-03: `icon` variable captured in `setTimeout` closure may reference a replaced DOM node (lesson-view.js)

**File:** `src/views/lesson-view.js:210-229`

**Issue:** In `attachCopyHandlers`, `const icon = btn.querySelector('[data-lucide]')` is assigned before the `import('lucide').then(...)` call that runs `createIcons`. The `createIcons` function replaces `[data-lucide]` elements with fully-rendered `<svg>` nodes, which removes the original `<i>` element from the DOM and inserts a new `<svg>` in its place. The `icon` variable in the `setTimeout` callback at line 221 still points to the now-detached original `<i>` element. After 2 seconds, `icon.setAttribute('data-lucide', 'copy')` is called on a detached node — the icon reverts correctly in appearance because a new `createIcons` call re-renders it, but the intermediate state of `icon.style.color = ''` is applied to a detached node and has no visual effect, meaning the green color on the svg may persist.

**Fix:** Re-query the icon from `btn` inside the `setTimeout` callback:

```js
setTimeout(() => {
  const liveIcon = btn.querySelector('[data-lucide], svg[data-lucide]');
  if (liveIcon) {
    liveIcon.setAttribute('data-lucide', 'copy');
    liveIcon.style.color = '';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    import('lucide').then(({ createIcons, Copy }) => {
      createIcons({ icons: { Copy }, attrs: { 'stroke-width': 2 }, rootNode: btn });
    });
  }
}, 2000);
```

---

### WR-04: `onmouseout` inline handler does not reset color when the lesson changes away from a module (sidebar.js)

**File:** `src/sidebar.js:31`

**Issue:** The module title link uses an inline `onmouseout` handler:

```html
onmouseout="if(!this.closest('.sidebar-module--active'))this.style.color='var(--color-text-primary)'"
```

When `setActiveModule(moduleId)` is called for a different module, it sets `link.style.color = 'var(--color-text-primary)'` on all non-active links explicitly. However the `setActiveLesson` function (lines 193-211) does NOT call `setActiveModule`, so if a user clicks a lesson link directly (bypassing the module title), the `sidebar-module--active` class may not be set on the parent module, and if the user then hovers over the old module's title and moves away, the `onmouseout` branch `!this.closest('.sidebar-module--active')` will be truthy — which is the correct branch — and will reset the color. The real problem is the inverse: if `setActiveModule` is called on module A, setting `sidebar-module--active`, and the user then navigates to a lesson in module B via direct hash change without calling `setActiveModule`, the module A title retains the orange hover color permanently because `sidebar-module--active` is still set on it and `onmouseout` skips the reset.

This is a pre-existing coupling problem but it is worsened by the fact that the lesson route in the router calls `setActiveLesson` but may not guarantee a `setActiveModule` call first. The inline `onmouseout` handler creating an implicit dependency on DOM class state is the quality defect.

**Fix:** Replace the inline hover handlers with CSS (`:hover` on `.sidebar-module a`) or attach proper `mouseover`/`mouseout` listeners in `initSidebar` that check the programmatic active state from a data attribute rather than a class.

---

### WR-05: Duplicate `padding-left` and `font-size` declarations overwrite each other (module-view.js)

**File:** `src/views/module-view.js:57-58`

**Issue:** The "Module goal" `<div>` has both `padding-left: var(--spacing-md)` and `padding: var(--spacing-md)` in the same `style` attribute — the shorthand `padding` overrides the `padding-left` longhand preceding it, so `padding-left` has no effect:

```html
style="border-left: 3px solid var(--color-border); padding-left: var(--spacing-md);
       margin-bottom: var(--spacing-md); background: var(--color-bg-secondary);
       padding: var(--spacing-md);">
```

Separately, the inner `<p>` at line 58 has `font-size: var(--text-body)` followed by `font-size: 0.75rem` — the second value wins, making the first declaration dead.

Neither of these cause a crash, but `padding-left` was almost certainly intended to produce the left-indented-inside-border appearance; the shorthand silently removes that effect in CSS cascade order.

**Fix:**

```html
<!-- Remove the leading padding-left — the shorthand padding handles all sides -->
<div style="border-left: 3px solid var(--color-border); margin-bottom: var(--spacing-md);
            background: var(--color-bg-secondary); padding: var(--spacing-md);">
  <!-- Remove the first font-size from the inner p -->
  <p style="color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--spacing-xs);">
```

---

## Info

### IN-01: `sidebar.test.js` — `_computeModuleProgressMock` declared without `vi.hoisted()`, may be undefined inside `vi.mock()` factory (tests/sidebar.test.js)

**File:** `tests/sidebar.test.js:12` and `tests/sidebar.test.js:48-50`

**Issue:** `_computeModuleProgressMock` is declared as a plain `const` at the module top level (line 12). Vitest hoists `vi.mock()` calls to the top of the file at transform time, so the factory function at line 48-50 executes before the `const` at line 12 is reached. This means `_computeModuleProgressMock` is `undefined` when the factory runs, and `computeModuleProgress` in the mock resolves to `undefined` rather than the desired `vi.fn()`.

The contrast with `module-view.test.js` is instructive: that file correctly uses `vi.hoisted()` to ensure `_computeModuleProgressMock` is initialized before the factory (lines 14-16). The sidebar test file does not, making the mock unreliable. Tests may pass by accident if Vitest happens to evaluate the mock lazily, but the pattern is not guaranteed stable.

**Fix:** Wrap the declaration in `vi.hoisted()` as done in `module-view.test.js`:

```js
const { _computeModuleProgressMock } = vi.hoisted(() => ({
  _computeModuleProgressMock: vi.fn().mockReturnValue({ pct: 0, complete: false }),
}))
```

---

### IN-02: `renderLesson` JSDoc declares `@returns {Promise<string>}` but the function always returns `null` (lesson-view.js)

**File:** `src/views/lesson-view.js:24`

**Issue:** The JSDoc comment says `@returns {Promise<string>} Empty string — view takes DOM control itself` but every return path returns `null` (lines 29, 36, 53, 94), never an empty string. The contract documented in the comment and the actual return value are inconsistent. Any caller that tests for `=== ''` to detect the direct-write pattern will silently fail.

**Fix:** Update the JSDoc to match reality:

```js
* @returns {Promise<null>} null — view writes directly to #app
```

---

### IN-03: Quiz JSON `01.json` contains only one question, making it impossible for score < total (content data)

**File:** `public/data/modules/logging-auditing/quizzes/01.json`

**Issue:** The quiz has exactly one question. This means the only possible outcomes are 1/1 (all correct) or 0/1 (wrong). The completion banner color branch in `quiz-engine.js` (`score === totalQuestions ? '#22c55e' : 'var(--color-text-muted)'`) will never show the muted color on this quiz unless the wrong answer is selected. More importantly, the partial-completion path (e.g., 2/3 correct) is not exercised by any test because the test fixture mirrors the one-question production data. Any regression in the score-accumulation logic across multiple questions will not be caught by the current test suite.

**Fix (content):** Add at least two more questions to `01.json` to exercise the partial-credit path and make `score < totalQuestions` reachable.

**Fix (test):** Add a multi-question quiz fixture to `tests/quiz-engine.test.js` with a test that simulates answering only some questions correctly and asserts the correct score is passed to `saveQuiz`.

---

_Reviewed: 2026-05-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
