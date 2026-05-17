---
phase: 02-content-loader-lesson-rendering-module-1
reviewed: 2026-05-12T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - index.html
  - package.json
  - public/data/modules/logging-auditing/exercises/01.json
  - public/data/modules/logging-auditing/lessons/audit-policies.md
  - public/data/modules/logging-auditing/lessons/intro.md
  - public/data/modules/logging-auditing/lessons/ps-logging.md
  - public/data/modules/logging-auditing/module.json
  - public/data/modules/logging-auditing/quizzes/01.json
  - public/data/modules/logging-auditing/scenarios/01.json
  - src/content-loader.js
  - src/main.js
  - src/router.js
  - src/sidebar.js
  - src/style.css
  - src/views/lesson-view.js
  - tests/content-loader.test.js
  - tests/lesson-view.test.js
  - tests/router.test.js
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-12T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

This review covers the content-loader pipeline, lesson view renderer, router, sidebar, and all Module 1 data files produced in Phase 2. The Markdown parsing, frontmatter extraction, `esc()` usage on frontmatter values, and Shiki integration are generally well-structured. Two blockers were found:

1. The router unconditionally overwrites `app.innerHTML` with the return value of every view renderer — but `renderLesson` writes the DOM itself and returns `''`, so the router immediately wipes every rendered lesson page with an empty string.
2. The OT callout filter logic assumes a two-paragraph blockquote structure (marker paragraph + body paragraph), but all three lesson files write `> [!OT]\n> body text` as a single merged paragraph. The filter removes the single paragraph as the marker, leaving an empty callout body.

Both bugs are invisible to the current test suite because no test exercises the full `renderLesson` DOM path, and the OT callout tests use a format (`> [!OT]\n> Some OT text`) that also hits the bug and produces an empty-body result — the test only checks that `ot-callout` appears in the output, not that body content is present.

---

## Critical Issues

### CR-01: Router Wipes Lesson Content — `app.innerHTML = ''` on Every Lesson Navigation

**File:** `src/router.js:51`

**Issue:** `handleRoute` always executes `app.innerHTML = await renderer(params)`. The lesson renderer (`renderLesson`) writes full lesson HTML directly to `app.innerHTML` before returning, then returns the empty string `''`. `handleRoute` receives `''` from `await renderer(params)` and sets `app.innerHTML = ''`, erasing every lesson page immediately after it is rendered. No lesson content is ever visible to the user. Every code path in `renderLesson` returns `''` (lines 27, 34, 51, 71), so all four states (no params, module not found, fetch error, success) are wiped.

The loading skeleton is also erased: the skeleton is written synchronously, then the lesson writes its own innerHTML, then the router overwrites with empty. The post-render steps (`setActiveLesson`, `activateIcons`, `attachCopyHandlers`) run on content that is then immediately destroyed.

**Fix:** `handleRoute` must not overwrite the DOM when the renderer takes DOM control itself. The simplest fix is a sentinel return value:

```js
// src/router.js — replace the innerHTML assignment
const result = await renderer(params);
if (result !== null) {
  // null = renderer already owns the DOM; '' = empty page; string = router sets innerHTML
  app.innerHTML = result;
}
```

Then change all `return '';` in `renderLesson` to `return null;` so the router skips the overwrite. Alternatively, restructure all views to return HTML strings and let the router set innerHTML consistently — but that requires refactoring `renderLesson`'s async loading skeleton approach.

---

### CR-02: OT Callout Body Is Always Empty — Filter Removes Entire Content Paragraph

**File:** `src/content-loader.js:80-84`

**Issue:** The blockquote renderer filters out the `[!OT]` marker using:

```js
const bodyTokens = (token.tokens ?? []).filter(
  t => !(t.type === 'paragraph' && (t.raw ?? '').trim().startsWith('[!OT]'))
);
const inner = marked.parser(bodyTokens);
```

This assumes `[!OT]` appears alone in its own paragraph token, with the callout body in subsequent tokens. However, marked lexes `> [!OT]\n> body text` as a **single paragraph** whose `raw` value is `"[!OT]\nbody text"`. Because `.trim().startsWith('[!OT]')` is true, the entire paragraph — including the body — is filtered out. `bodyTokens` is always `[]`, `marked.parser([])` returns `''`, and every OT callout in all three lesson files renders an empty body.

Verified against the exact content of `intro.md`, `ps-logging.md`, and `audit-policies.md` — all use the single-line blockquote continuation format.

**Fix:** Strip only the first line of the paragraph's raw text rather than dropping the entire token:

```js
// Replace the filter approach with a raw-text strip on the single merged paragraph
const bodyTokens = (token.tokens ?? []).map(t => {
  if (t.type === 'paragraph' && (t.raw ?? '').trim().startsWith('[!OT]')) {
    // Strip the [!OT] marker line; re-lex the remainder as inline tokens
    const stripped = t.raw.replace(/^\[!OT\]\s*\n?/, '').trim();
    if (!stripped) return null; // pure marker with no body
    return { ...t, raw: stripped, text: stripped, tokens: marked.Lexer.lexInline(stripped) };
  }
  return t;
}).filter(Boolean);
```

Alternatively, restructure lesson Markdown to use a blank line after the marker (`> [!OT]\n>\n> body`) — marked then produces separate paragraph tokens and the existing filter works. However, fixing the code is preferable to constraining the content format.

---

## Warnings

### WR-01: `parseFrontmatter` Crashes on `undefined` Input

**File:** `src/content-loader.js:106`

**Issue:** `parseFrontmatter(raw)` calls `raw.split('\n')` on line 106 without guarding against `undefined` or `null`. This throws `TypeError: Cannot read properties of null (reading 'split')`. The current call site in `lesson-view.js` guards against `null` from `fetchLesson`, but the function has no documented contract and could throw if called from a future code path that passes a non-string.

**Fix:**
```js
export function parseFrontmatter(raw) {
  if (typeof raw !== 'string') return { meta: {}, body: String(raw ?? '') };
  // ... rest of function
```

---

### WR-02: `parseFrontmatter` Parses Empty YAML Array `[]` as `['']`

**File:** `src/content-loader.js:127-131`

**Issue:** When a YAML value is `[]` (empty array), the parser does:
```js
val.slice(1, -1)       // => ''
  .split(',')          // => ['']
  .map(s => s.trim())  // => ['']
```
This returns an array containing one empty string rather than an empty array. If a future lesson frontmatter has `complianceTags: []`, the compliance bar will attempt to render a badge for `''`, and `renderBadge('')` will call `esc('')` which is safe but will insert an empty-text styled badge element into the DOM.

**Fix:**
```js
if (val.startsWith('[') && val.endsWith(']')) {
  const inner = val.slice(1, -1).trim();
  meta[key] = inner === ''
    ? []
    : inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
}
```

---

### WR-03: Shiki Singleton Has a Double-Initialization Race Condition

**File:** `src/content-loader.js:16-23`

**Issue:** `getHighlighter()` checks `if (_highlighter) return _highlighter` before the `await`. If two code tokens are processed concurrently (possible when `marked.use({ async: true, walkTokens })` processes a document with multiple code blocks), both calls read `_highlighter = null` and both proceed to `createHighlighter(...)`. Two Shiki instances are created; `_highlighter` is assigned twice. The functional impact is low (both instances use identical config), but this wastes memory and Shiki initialization time and signals a broken singleton pattern.

**Fix:** Cache the in-flight Promise rather than the resolved value:
```js
let _highlighterPromise = null;

export function getHighlighter() {
  if (!_highlighterPromise) {
    _highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['powershell'],
    });
  }
  return _highlighterPromise;
}
```

---

### WR-04: `sidebar.js` Accesses `shell.classList` Without a Null Guard

**File:** `src/sidebar.js:56`

**Issue:** The collapse toggle handler does `shell.classList.toggle(...)` where `shell` is `document.getElementById('shell')` captured at line 50. If `initSidebar()` is ever called in a context where `#shell` does not exist (e.g., test environment, server-side rendering), `getElementById` returns `null` and `shell.classList` throws `TypeError: Cannot read properties of null`. The `toggleBtn` null check on line 54 is present, but the `shell` variable has no such guard.

**Fix:**
```js
if (toggleBtn && shell) {
  toggleBtn.addEventListener('click', () => { /* ... */ });
}
```

---

## Info

### IN-01: Expired TSA Directive Date in `compliance-refs.json`

**File:** `public/data/compliance-refs.json:9`

**Issue:** The `expiryDate` for TSA SD-02F is `"2026-05-02"`. As of the current date (2026-05-12), this directive has lapsed. The UI will continue to display the badge and reference text as current. Per `CLAUDE.md`, the TSA directive version string lives in this file specifically to avoid hardcoding — the data is correct to centralise here, but the value needs updating to the current active directive.

**Fix:** Update `expiryDate` and confirm the current active directive version. If SD-02F has been superseded, update `name`, `shortName`, `effectiveDate`, and `expiryDate` accordingly.

---

### IN-02: No Integration Test Covers `renderLesson` DOM Output

**File:** `tests/lesson-view.test.js`

**Issue:** The test file explicitly notes "Full renderLesson() DOM tests are appropriate for E2E." As a result, the CR-01 blocker (router wipes lesson content) and CR-02 blocker (empty OT callout body) are both undetected by the test suite. The OT callout test in `tests/content-loader.test.js:89-94` passes because it only asserts `result.includes('ot-callout')` — the callout container is present even when the body is empty.

**Fix:** Add at minimum one happy-path integration test for `renderLesson` using a DOM environment (happy-dom is already configured in vitest). The test should assert that `#app` contains the lesson title, the lesson body content, and that OT callout divs contain non-empty body text after rendering a known fixture.

---

_Reviewed: 2026-05-12T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
