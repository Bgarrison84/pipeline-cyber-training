---
phase: 06-scenario-engine-compliance-index-completion-summary
reviewed: 2026-05-16T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/views/scenario-view.js
  - src/views/compliance-index-view.js
  - src/views/completion-summary-view.js
  - src/router.js
  - src/modules-config.js
  - src/views/module-view.js
  - src/quiz-engine.js
  - src/style.css
  - tests/setup.js
  - vitest.config.js
  - public/data/modules/logging-auditing/scenarios/01.json
  - public/data/compliance-index.json
  - tests/scenario-view.test.js
  - tests/compliance-index-view.test.js
  - tests/completion-summary-view.test.js
  - tests/router.test.js
  - tests/quiz-engine.test.js
findings:
  critical: 4
  warning: 5
  info: 3
  total: 12
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-05-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Phase 6 delivers scenario-view, compliance-index-view, completion-summary-view, router updates, and quiz-engine enhancements. The XSS hygiene is generally solid — `esc()` is applied consistently to developer-authored JSON strings, and the learner name input correctly uses `textContent`. Four critical issues were found:

1. `router.js` has a **static import of `sidebar.js`**, which is the circular-dependency rule violation flagged in CLAUDE.md and the phase brief.
2. The router's **resume-on-load redirect uses unvalidated `progressStore` data** directly in `window.location.hash` construction, bypassing `safePath()`.
3. `compliance-index-view.js`'s `buildControlSectionHtml` **does not guard against `control.items` being absent or undefined**, causing a runtime crash when malformed JSON is served.
4. `renderBadge` in `badge.js` only accepts one argument but `buildControlSectionHtml` passes **two arguments** (`control.id, control.label`) — the second argument is silently dropped, meaning the `label` parameter intended to override the display text has no effect; the section renders the wrong badge text in all cases.

Five warnings cover: quiz visual feedback showing all wrong answers with destructive red borders (including un-selected wrong options), missing `scenario.phases` length guard in `runScenarioFlow`, double-padding from nested `.lesson-wrapper`, unhandled rejection on `import('../sidebar.js')`, and missing `aria-live` on scenario completion banner.

---

## Critical Issues

### CR-01: Static import of `sidebar.js` in `router.js` — circular dependency violation

**File:** `src/router.js:10`
**Issue:** `router.js` uses a static top-level import of `sidebar.js`:
```js
import { setActiveModule, setActiveLesson } from './sidebar.js';
```
CLAUDE.md and the phase brief both state: *"No static import of sidebar.js (circular dependency — dynamic import only)"*. Every other file in this phase (scenario-view, quiz-engine) correctly uses `import('../sidebar.js').then(...)`. The router is the call-site for `setActiveModule` and `setActiveLesson` on every navigation, so the static import survives into production and creates the circular dependency chain that the project rule exists to prevent.

**Fix:**
```js
// Remove the static import at line 10.
// In handleRoute(), replace the two synchronous sidebar calls with:
import('./sidebar.js').then(m => {
  m.setActiveModule(params.moduleId ?? null);
  if (params.lessonId) m.setActiveLesson(params.moduleId, params.lessonId);
});
```

---

### CR-02: Unvalidated `progressStore` data injected into `window.location.hash` — path traversal risk

**File:** `src/router.js:74`
**Issue:** On the initial load redirect, `last.moduleId` and `last.lessonId` are taken directly from `progressStore.getLastVisited()` (which reads from localStorage) and concatenated into the URL:
```js
window.location.hash = '#/lesson/' + last.moduleId + '/' + last.lessonId;
```
`progressStore` does not sanitise values it returns from localStorage. An attacker who can write to the user's localStorage (e.g., via a different same-origin page, a browser extension, or a prior XSS) can inject arbitrary strings into `last.moduleId` / `last.lessonId`. While hash fragments are not sent to the server, they are immediately re-parsed by the router, which calls `decodeURIComponent` on segments (line 31) and then forwards the decoded value to view renderers. The downstream views do call `safePath()`, so fetch URLs are protected — but the crafted hash still controls which `view` branch executes (e.g., injecting `..%2F` sequences or additional slashes can confuse `extractParams`'s length check at line 27 and fall through to `not-found`, or in future routes could match unintended patterns).

The fix is to pass stored values through `safePath` before writing them back to the URL.

**Fix:**
```js
// src/router.js — handleRoute(), initial load block
function safeSegment(s) {
  return typeof s === 'string' && /^[a-zA-Z0-9_-]+$/.test(s) ? s : null;
}

const safeModuleId = safeSegment(last.moduleId);
const safeLessonId = safeSegment(last.lessonId);
if (safeModuleId && safeLessonId) {
  window.location.hash = '#/lesson/' + safeModuleId + '/' + safeLessonId;
  return;
}
```

---

### CR-03: `buildControlSectionHtml` crashes when `control.items` is missing or not an array

**File:** `src/views/compliance-index-view.js:89`
**Issue:** `buildControlSectionHtml` directly calls `.map()` on `control.items` with no guard:
```js
const itemsHtml = control.items.map(item => { ... }).join('');
```
If the fetched `compliance-index.json` contains a control entry without an `items` field (e.g., `"items": null`, or the field is simply absent due to a typo or partial edit), this throws `TypeError: Cannot read properties of undefined (reading 'map')`, which propagates uncaught out of `.map(buildControlSectionHtml)` at line 158 and leaves `#app` in the loading skeleton state permanently — no error message is shown to the user. The pattern used everywhere else in this codebase is `?? []`.

**Fix:**
```js
// compliance-index-view.js line 89
const itemsHtml = (control.items ?? []).map(item => {
```

---

### CR-04: `renderBadge` signature mismatch — `control.label` argument is silently dropped

**File:** `src/views/compliance-index-view.js:104`
**Issue:** `buildControlSectionHtml` calls `renderBadge` with two arguments:
```js
${renderBadge(control.id, control.label)}
```
But `badge.js` defines `renderBadge` with only one parameter (`directiveKey`). The second argument (`control.label`, e.g. `"TSA SD-02F — Continuous Monitoring"`) is silently ignored. The function then falls back to `_complianceRefs?.directives?.[directiveKey]?.shortName ?? directiveKey`, meaning the badge renders the raw ID string (e.g. `"TSA-Monitoring"`) rather than the human-readable label. This is wrong in every case where `compliance-index.json` controls have labels that differ from their shortNames — which is the entire compliance index.

This is a logic bug: the author clearly intended the label to be used, but the API was never updated to accept it.

**Fix — two options:**

Option A — pass only the key and fix `badge.js` to resolve label from `complianceRefs` (preferred, matches existing pattern):
```js
// compliance-index-view.js line 104 — drop second arg
${renderBadge(control.id)}
```
And ensure `setComplianceRefs` has been called before rendering (it is — `main.js` calls it at startup).

Option B — extend `renderBadge` to accept an optional override label:
```js
// badge.js
export function renderBadge(directiveKey, labelOverride) {
  const shortName = labelOverride
    ?? _complianceRefs?.directives?.[directiveKey]?.shortName
    ?? directiveKey;
  ...
}
```

---

## Warnings

### WR-01: Quiz visual feedback marks ALL non-correct answers with destructive red border

**File:** `src/quiz-engine.js:215-223`
**Issue:** In `attachQuizHandlers`, after an answer is clicked, the code applies `color-destructive` border to every non-correct button:
```js
} else {
  // Red border for wrong answers
  btn.style.borderColor = 'var(--color-destructive)';
  ...
}
```
This means un-selected wrong answers (options the user never chose) are also highlighted in red. The intended UX (per the scenario-view's own pattern at line 184-198) is: correct = green, user's wrong pick = red/destructive, other wrong options = muted. The quiz-engine implementation paints all distractors red, which reveals which options are wrong without the user having interacted with them — degrading learning efficacy for multi-question quizzes where the user may glance ahead. This is a behavioral correctness defect.

**Fix:**
```js
allBtns.forEach(btn => {
  btn.style.pointerEvents = 'none';
  btn.style.cursor = 'not-allowed';

  const btnCorrect = btn.dataset.correct === 'true';
  const isClickedBtn = btn === clickedBtn;

  if (btnCorrect) {
    btn.style.borderColor = '#22c55e';
    const checkIcon = btn.querySelector('[data-lucide="check-circle"]');
    const xIcon = btn.querySelector('[data-lucide="x-circle"]');
    if (checkIcon) checkIcon.style.display = '';
    if (xIcon) xIcon.style.display = 'none';
  } else if (isClickedBtn) {
    // User's wrong pick — destructive
    btn.style.borderColor = 'var(--color-destructive)';
    const checkIcon = btn.querySelector('[data-lucide="check-circle"]');
    const xIcon = btn.querySelector('[data-lucide="x-circle"]');
    if (checkIcon) checkIcon.style.display = 'none';
    if (xIcon) xIcon.style.display = '';
  } else {
    // Other wrong options — muted, no icon
    btn.style.borderColor = 'var(--color-border)';
    btn.style.opacity = '0.5';
  }
});
```

---

### WR-02: `runScenarioFlow` accesses `scenario.phases[0]` without length guard

**File:** `src/views/scenario-view.js:115`
**Issue:** `runScenarioFlow` is called only when `priorCompletion` is falsy and after `validateScenario` passes. However, `validateScenario` only checks that `nextPhaseId` references resolve — it does not reject a scenario with zero phases. A scenario JSON with `"phases": []` would pass validation and reach:
```js
let currentPhaseId = scenario.phases[0].id;  // TypeError: Cannot read properties of undefined
```
This crashes the entire interactive handler setup and leaves the first-phase card orphaned with no click listeners.

**Fix:**
```js
if (!scenario.phases || scenario.phases.length === 0) return;
let currentPhaseId = scenario.phases[0].id;
```

---

### WR-03: Nested `.lesson-wrapper` + `.lesson-column` creates double padding in scenario and completion-summary views

**File:** `src/views/scenario-view.js:302-303`, `src/views/completion-summary-view.js:203`
**Issue:** `buildScenarioHtml` wraps content in:
```html
<div class="lesson-wrapper">
  <div class="lesson-column" style="max-width:...; margin:0 auto; padding:var(--spacing-xl);">
```
`style.css` (lines 68-77) defines `.lesson-wrapper` with `padding: var(--spacing-xl)` and `.lesson-column` with `max-width` + `margin`. Then the inline style on the inner div also applies `padding:var(--spacing-xl)`. The result is `--spacing-xl` (32px) applied twice — once from the `.lesson-wrapper` class and once from the inline style on `.lesson-column`. The same pattern appears in completion-summary-view. The lesson-view and exercise-view rendered correctly in prior phases because they relied on the class padding, not an additional inline padding. This causes the reading column to appear narrower than intended on small viewports.

**Fix:** Remove the inline `padding` from the inner div and rely solely on `.lesson-wrapper`'s class-defined padding:
```html
<div class="lesson-wrapper">
  <div class="lesson-column">
    ...
  </div>
</div>
```

---

### WR-04: Unhandled promise rejection when `import('../sidebar.js')` fails

**File:** `src/views/scenario-view.js:222`, `src/quiz-engine.js:246`
**Issue:** Both files call:
```js
import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
```
There is no `.catch()` handler. If the dynamic import fails (network error, bundler chunk missing, sidebar module throws during evaluation), the resulting unhandled promise rejection is silently swallowed by the browser — but in Vitest the test environment surfaces it as an unhandled rejection warning that can fail CI depending on configuration. More importantly, in production an import failure here means `refreshSidebarProgress` never fires, and the sidebar progress bar is not updated after scenario/quiz completion.

**Fix:**
```js
import('../sidebar.js')
  .then(m => m.refreshSidebarProgress(moduleId))
  .catch(() => { /* sidebar refresh is best-effort; do not surface to user */ });
```

---

### WR-05: `completedAt` from `progressStore` rendered via `esc()` in HTML without validating it is a date string

**File:** `src/views/scenario-view.js:281-286`
**Issue:** `priorCompletion.completedAt` is sliced and injected via `esc()`:
```js
const completedDate = priorCompletion.completedAt ? priorCompletion.completedAt.slice(0, 10) : '';
// ...
<p ...>Scenario previously completed${completedDate ? ' — ' + esc(completedDate) : ''}</p>
```
`esc()` protects against XSS, so this is not an injection vulnerability. However, `completedAt` comes from localStorage via `progressStore` and is never validated to actually be a date string. If a user (or extension) writes `{"completedAt": {"toString": null}}` to localStorage, `String(str)` inside `esc()` would coerce it to `"[object Object]"`, producing misleading UI. Additionally, `.slice(0, 10)` on a non-string value that `progressStore` returns as-is would throw. The same risk exists in `completion-summary-view.js:61`.

**Fix:** Add a type check before slicing:
```js
const rawDate = priorCompletion.completedAt;
const completedDate = (typeof rawDate === 'string') ? rawDate.slice(0, 10) : '';
```

---

## Info

### IN-01: `scenario-view.js` re-declares `safePath` — should be shared utility

**File:** `src/views/scenario-view.js:17-19`, `src/views/compliance-index-view.js:16-18`, `src/quiz-engine.js:16-18`
**Issue:** `safePath` is copy-pasted identically across three files (and the comment in compliance-index-view even says "Copied verbatim from exercise-view.js"). This violates DRY and means any future change to the allowlist must be applied in at least four places. The `src/utils/` directory already exists for shared helpers (`escape.js`, `icons.js`).

**Fix:** Extract to `src/utils/safe-path.js` and import it in all consumers.

---

### IN-02: `buildPhaseNodeHtml` receives `priorPickedOptionId` parameter but never uses it

**File:** `src/views/scenario-view.js:321`
**Issue:** The function signature is `buildPhaseNodeHtml(phase, state, priorPickedOptionId)` but `priorPickedOptionId` is never referenced inside the function body. In revisit mode, the prior pick is not visually indicated — all options render identically with no highlighting to show which option was previously chosen. The parameter is dead code.

**Fix:** Either remove the parameter entirely (simplest), or implement the re-visit highlighting using it. If the progress store does not persist the picked option ID, remove the parameter and document that revisit mode does not show prior pick:
```js
function buildPhaseNodeHtml(phase, state) { ... }
```

---

### IN-03: `modules-config.js` comment says "Phase 2 replaces this" but Phase 2 shipped without doing so

**File:** `src/modules-config.js:3`
**Issue:** The file begins with:
```
// Phase 2 replaces this with: fetch(import.meta.env.BASE_URL + 'data/modules/index.json')
```
Phase 2 is long complete and the static config remains. The comment is stale and misleading — it implies this file is temporary scaffolding when it is in fact the production module registry used by quiz-engine, completion-summary, and module-view in Phase 6.

**Fix:** Remove or rewrite the stale comment:
```js
// src/modules-config.js — static module registry.
// All five modules. Add a new entry here whenever a new module is introduced.
```

---

_Reviewed: 2026-05-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
