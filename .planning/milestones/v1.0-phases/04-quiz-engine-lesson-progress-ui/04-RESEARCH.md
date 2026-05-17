# Phase 4: Quiz Engine + Lesson Progress UI - Research

**Researched:** 2026-05-14
**Domain:** Vanilla JS quiz engine, DOM-injection patterns, localStorage-backed progress bars
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Quiz renders inline at the bottom of the lesson page — no dedicated route, no route change.
- **D-02:** Any lesson can have a quiz. The lesson frontmatter declares `quizId: '01'` (or any other ID).
- **D-03:** Quiz JSON fetched from `public/data/modules/{moduleId}/quizzes/{quizId}.json` using the same `import.meta.env.BASE_URL + 'data/...'` fetch pattern.
- **D-04:** Click-to-reveal immediately — no submit button. Clicking an answer locks all options on that question. No retry.
- **D-05:** All questions visible at once. Each question card is independent. Score tallied and saved when the last unanswered question is answered.
- **D-06:** Correct: green border `#22c55e` + check icon. Wrong: `var(--color-destructive)` border + X icon. Per-answer `feedback` shown below selected answer. `explanation` shown below all answers after any selection.
- **D-07:** Completion logic: visiting a lesson alone does NOT count toward progress. Only passing a quiz counts. Lessons without a quiz count as complete when visited. Progress = (quizzes passed + quiz-less lessons visited) / (total quizzes + total quiz-less lessons).
- **D-08:** Sidebar: 4px thin horizontal progress bar below the module title link. `--color-accent` fill on `--color-bg-secondary` track.
- **D-09:** Module complete = `check-circle` Lucide icon next to module title in sidebar + accent color on title text. Triggered at 100%.
- **D-10:** Module overview page shows: progress bar at top + ordered list of lessons tagged `unvisited` / `visited` / `quiz-passed`.
- **D-11:** Revisit view: score banner at top of quiz section (`"Your last attempt: {score}/{total} correct — {date}"`). All question cards rendered locked. No re-submission.
- **D-12:** Revisit state restored from `progressStore.getQuizScore(moduleId, quizId)` → `{score, total, attemptedAt}`. Previously selected answer IDs are NOT stored, so individual answer highlighting is not possible on revisit.

### Claude's Discretion

- Exact CSS layout of the quiz section (padding, card gap, border radius) — follow established lesson-view inline style patterns.
- Whether to show a "Quiz complete — {score}/{total}" congratulations message after the last question is answered — use best judgment for UX.
- Whether to call `progressStore.markLessonCompleted(moduleId, lessonId)` when a quiz is passed — yes, do this.

### Deferred Ideas (OUT OF SCOPE)

- One question at a time / wizard flow
- Retry-until-correct mode
- Quiz score in lesson header (near compliance bar)
- "Complete" badge text in sidebar (check-circle icon alone is the completion signal)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ASSESS-01 | Each lesson includes multiple-choice quiz questions with per-answer explanatory feedback (not just correct/incorrect) | Quiz JSON schema is fully populated in `01.json`; per-answer `feedback` field is present and non-empty; `explanation` field also present for post-answer context |
| SHELL-03 | Visual progress bars show completion state at both lesson and module level | Progress Store API is complete and correct; sidebar and module-view are fully readable and have clear injection points |

</phase_requirements>

---

## Summary

Phase 4 creates one new file (`src/quiz-engine.js`) and modifies three existing files (`src/views/lesson-view.js`, `src/sidebar.js`, `src/views/module-view.js`). All upstream foundations are verified complete: the Progress Store exposes every API needed, the quiz JSON schema is fully populated (not a placeholder), and the lesson frontmatter pattern is clear.

The main design challenge is the **dual-mode quiz section**: a first-visit interactive mode (click to reveal answers, tally score, save to store) and a revisit read-only mode (score banner, locked cards showing prior score but not prior selections). These are structurally different HTML renders but share the same question card layout with different interaction states applied.

The second design challenge is **progress calculation for the sidebar and module-view**. D-07 defines a hybrid formula that mixes quiz results with visited-only state for quiz-less lessons. The `MODULES` array in `modules-config.js` provides the full lesson inventory, but there is no `quizId` field on lesson entries — the quiz association lives in the lesson frontmatter. For progress calculation, the planner must decide how the sidebar/module-view knows which lessons have quizzes without fetching all frontmatter. The recommended approach is to add an optional `quizId` field directly to `MODULES` lesson entries so progress calculation stays synchronous.

**Primary recommendation:** Add `quizId` to `MODULES` lesson entries for synchronous progress calculation; `quiz-engine.js` is a pure DOM-injection module with no router awareness; inject after the existing Step 5 post-render block in `renderLesson()`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Quiz fetch + parse | Browser / Client | — | Static JSON fetch from `public/data/` — no server |
| Quiz HTML render (first visit) | Browser / Client | — | DOM injection into `.lesson-column` after lesson render |
| Quiz HTML render (revisit) | Browser / Client | — | Read stored score from localStorage, render locked view |
| Answer click handling | Browser / Client | — | Event delegation on quiz container element |
| Score save | Browser / Client (via progress-store) | — | `progressStore.saveQuiz()` + `progressStore.markLessonCompleted()` |
| Progress calculation | Browser / Client | — | Synchronous read from `progressStore` + `MODULES` config |
| Sidebar progress bars | Browser / Client (sidebar.js) | — | DOM update in `initSidebar()` using calculated progress |
| Module overview status list | Browser / Client (module-view.js) | — | Sync progress read at render time |

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (ES modules) | — | Quiz engine logic | Project uses no framework; consistent with all existing source files |
| lucide | 1.14.0 | `check-circle`, `x-circle` icons for answer states | Already used throughout; `activateIcons()` pattern established |
| `src/utils/escape.js` `esc()` | — | XSS-safe innerHTML interpolation | Mandatory per CLAUDE.md and existing pattern |
| `src/progress-store.js` | — | All localStorage access | Single owner pattern — must not be bypassed |

### No New Packages Needed

All required capabilities are already present. No `npm install` step needed for this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
lesson-view.js renderLesson()
  |
  ├── [Step 1-4: existing — fetch, parse, render, inject HTML]
  |
  └── Step 5: post-render block
        ├── progressStore.markVisited()          [existing]
        ├── progressStore.setLastVisited()        [existing]
        ├── storage warning (if unavailable)      [existing]
        ├── setActiveLesson()                     [existing]
        ├── activateIcons()                       [existing]
        ├── attachCopyHandlers()                  [existing]
        └── IF meta.quizId:                       [NEW]
              quizEngine.renderQuiz(moduleId, meta.quizId, lessonColumn)
                 |
                 ├── fetch quiz JSON
                 ├── getQuizScore() → revisit mode OR first-visit mode
                 ├── inject quiz HTML into lessonColumn
                 └── attach click handlers (event delegation)

sidebar.js initSidebar()
  ├── [existing: build module/lesson HTML]
  ├── [existing: activateIcons()]
  ├── [existing: collapse toggle]
  ├── [existing: progress footer export/import]
  └── renderAllModuleProgress()   [NEW — called after HTML is built]
        └── for each .sidebar-module:
              computeModuleProgress(mod) → { pct, complete }
              inject 4px progress bar div after module title link
              if complete: update title link styles + inject check-circle icon

module-view.js renderModule()
  ├── [new: compute progress bar pct]
  ├── [new: render progress bar at top]
  └── [new: render ordered lesson list with status badges]
        getLessonProgress() + getQuizScore() per lesson → unvisited/visited/quiz-passed
```

### Recommended Project Structure

```
src/
  quiz-engine.js          ← NEW: all quiz fetch, render, and event logic
  views/
    lesson-view.js        ← MODIFY: call quizEngine.renderQuiz() in Step 5
    module-view.js        ← MODIFY: add progress bar + lesson status list
  sidebar.js              ← MODIFY: add progress bars + module-complete marking
  modules-config.js       ← MODIFY: add optional quizId to lesson entries
```

### Pattern 1: Quiz Engine Module Shape

The quiz engine is a module that exports a single async function. It owns all quiz-related DOM work.

```javascript
// src/quiz-engine.js — [VERIFIED: codebase inspection]
import { esc } from './utils/escape.js';
import { activateIcons } from './utils/icons.js';
import { progressStore } from './progress-store.js';

/**
 * Fetch quiz JSON and render the quiz section into the lesson column.
 * Returns null silently if fetch fails (quiz is supplementary).
 * @param {string} moduleId
 * @param {string} quizId
 * @param {Element} lessonColumn  — the .lesson-column DOM element
 */
export async function renderQuiz(moduleId, quizId, lessonColumn) {
  if (!lessonColumn) return null;

  const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/quizzes/' + quizId + '.json';
  let quiz;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    quiz = await res.json();
  } catch {
    return null;  // silent failure — quiz is supplementary
  }

  const prior = progressStore.getQuizScore(moduleId, quizId);
  const section = document.createElement('section');
  section.className = 'quiz-section';
  section.innerHTML = prior
    ? buildRevisitHtml(quiz, prior)
    : buildFirstVisitHtml(quiz);

  lessonColumn.appendChild(section);
  activateIcons();

  if (!prior) {
    attachQuizHandlers(section, moduleId, quizId, quiz);
  }
  return section;
}
```

**Key detail:** `renderQuiz` is called in Step 5 of `renderLesson()` AFTER `activateIcons()` and `attachCopyHandlers()` already run. However, `renderQuiz` appends to the DOM AFTER those calls, so it must call `activateIcons()` itself to render the `check-circle` / `x-circle` icons it injects.

### Pattern 2: Event Delegation for Answer Cards

Delegate clicks to the quiz section container rather than individual answer buttons — consistent with `.lesson-wrapper` delegation used in `attachCopyHandlers()`.

```javascript
// [VERIFIED: codebase inspection — lesson-view.js attachCopyHandlers() uses same pattern]
function attachQuizHandlers(section, moduleId, quizId, quiz) {
  let answeredCount = 0;
  const totalQuestions = quiz.questions.length;

  section.addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-answer-btn');
    if (!btn) return;
    const questionCard = btn.closest('.quiz-question-card');
    if (!questionCard || questionCard.dataset.answered === 'true') return;

    questionCard.dataset.answered = 'true';
    // ... reveal feedback, apply color states
    answeredCount++;
    if (answeredCount === totalQuestions) {
      // tally score, call progressStore.saveQuiz() + markLessonCompleted()
      // render completion banner
    }
  });
}
```

### Pattern 3: Progress Calculation Function

This function is reused by both `sidebar.js` and `module-view.js`. It belongs in `quiz-engine.js` or a shared helper. Given that sidebar.js and module-view.js both need it, and it depends only on `progressStore` and `MODULES`, it should be exported from `quiz-engine.js` or a new `src/utils/progress.js` helper.

```javascript
// [VERIFIED: codebase inspection — MODULES shape, progressStore APIs]
/**
 * Compute completion progress for a module.
 * D-07: progress = (quizzes passed + quiz-less lessons visited) /
 *                  (total quizzes + total quiz-less lessons)
 * @param {object} mod  — entry from MODULES array (must include lesson[].quizId optional field)
 * @returns {{ numerator: number, denominator: number, pct: number, complete: boolean }}
 */
export function computeModuleProgress(mod) {
  let numerator = 0;
  let denominator = 0;
  for (const lesson of mod.lessons) {
    if (lesson.quizId) {
      denominator++;
      const score = progressStore.getQuizScore(mod.id, lesson.quizId);
      if (score !== null) numerator++;  // any completion counts as "passed"
    } else {
      denominator++;
      const lp = progressStore.getLessonProgress(mod.id, lesson.id);
      if (lp.visited) numerator++;
    }
  }
  const pct = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
  return { numerator, denominator, pct, complete: pct === 100 };
}
```

**Critical dependency:** This function requires `lesson.quizId` to be present on MODULES lesson entries. Without it, ALL lessons would be counted as quiz-less (visited = complete). This means `modules-config.js` MUST be updated to add `quizId` to lessons that have quizzes.

### Pattern 4: Sidebar Progress Bar Injection

The sidebar HTML is built as an `innerHTML` string in `initSidebar()`. Progress bars cannot be injected into the template string (progressStore is not yet populated at string-build time for async availability checks). Instead, a post-build DOM-walking step injects them.

```javascript
// [VERIFIED: codebase inspection — sidebar.js initSidebar() structure]
// After sidebarModules.innerHTML = ... and activateIcons():
MODULES.forEach(mod => {
  const moduleEl = sidebarModules.querySelector(
    '.sidebar-module[data-module-id="' + CSS.escape(mod.id) + '"]'
  );
  if (!moduleEl) return;
  const { pct, complete } = computeModuleProgress(mod);
  const bar = document.createElement('div');
  bar.className = 'sidebar-progress-bar';
  bar.style.cssText = 'height:4px;background:var(--color-bg-secondary);margin:0 var(--spacing-md) var(--spacing-xs);border-radius:2px;overflow:hidden;';
  bar.innerHTML = '<div style="height:100%;width:' + pct + '%;background:var(--color-accent);transition:width 300ms ease;"></div>';
  const titleLink = moduleEl.querySelector('a');
  if (titleLink) titleLink.after(bar);

  if (complete) {
    // inject check-circle icon + apply accent color to title span
  }
});
```

**Important:** `CSS.escape()` is available in all modern browsers. For this project's target environment (desktop IT/OT admins), it is safe to use. [ASSUMED — no explicit browser support matrix in CLAUDE.md]

### Pattern 5: Module-View Progress Bar + Lesson Status List

`renderModule()` is synchronous and returns a string. It can call `progressStore` APIs synchronously because `progressStore.init()` is called in `main.js` before any route rendering.

```javascript
// [VERIFIED: codebase inspection — module-view.js renderModule() + progress-store.js getQuizScore()]
// Status badge helper:
function lessonStatusBadge(mod, lesson) {
  if (lesson.quizId) {
    const score = progressStore.getQuizScore(mod.id, lesson.quizId);
    if (score !== null) return '<span style="...">quiz-passed</span>';
    const lp = progressStore.getLessonProgress(mod.id, lesson.id);
    if (lp.visited) return '<span style="...">visited</span>';
    return '<span style="...">unvisited</span>';
  } else {
    const lp = progressStore.getLessonProgress(mod.id, lesson.id);
    if (lp.visited) return '<span style="...">visited</span>';
    return '<span style="...">unvisited</span>';
  }
}
```

### Anti-Patterns to Avoid

- **Fetching lesson frontmatter to discover quizIds at progress-calculation time:** This would make `computeModuleProgress()` async and require awaiting it in both sidebar.js and module-view.js. The sidebar already runs async availability checks on init — adding more async per-module fetches on every navigation event is expensive. Use `quizId` on MODULES entries instead.
- **Calling `activateIcons()` globally after quiz injection without scoping:** `activateIcons()` calls `createIcons()` which scans the full document. This is fine — consistent with the existing pattern. Do not try to scope it.
- **Storing selected answer IDs in progressStore:** D-12 explicitly locks this out. The revisit view shows the score summary and locked (neutral) cards — no per-answer highlighting on revisit.
- **Re-running `initSidebar()` to update progress bars:** Progress bars in the sidebar need to update when the learner completes a quiz (while remaining on the same lesson page). A `refreshSidebarProgress()` export from `sidebar.js` should be called from `quiz-engine.js` after saving the quiz result, rather than re-running the full `initSidebar()` (which would re-fetch lesson availability and re-create the entire sidebar DOM).
- **Setting `module-view.js` as async:** `renderModule()` is called by `router.js` synchronously. Changing it to async requires changes in the router. Keep it synchronous — `progressStore` APIs are already synchronous.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML escaping | Custom sanitizer | `esc()` from `src/utils/escape.js` | Already exists; covers `&`, `<`, `>`, `"`, `'` |
| Icon rendering | Manual SVG injection | `activateIcons()` + `data-lucide` attribute | Lucide already integrated; `activateIcons()` handles `createIcons()` |
| localStorage access | Direct `localStorage.setItem` | `progressStore` APIs only | Single-owner pattern is mandatory per CLAUDE.md |
| Score persistence | Custom localStorage key | `progressStore.saveQuiz(moduleId, quizId, {score, total})` | Already implemented; key format `"{moduleId}/{quizId}"` already locked |

**Key insight:** This phase is primarily DOM manipulation and integration work. The hardest part is the event delegation pattern for quiz answers (managing per-question answered state without a framework's reactivity).

---

## Common Pitfalls

### Pitfall 1: `activateIcons()` Does Not Include `check-circle` or `x-circle`

**What goes wrong:** After injecting quiz HTML with `data-lucide="check-circle"` or `data-lucide="x-circle"` attributes, `activateIcons()` is called but the icons do not render.

**Why it happens:** `src/utils/icons.js` `activateIcons()` only passes a specific set of icon names to `createIcons()`. `CheckCircle` and `XCircle` are not currently in that set. [VERIFIED: codebase inspection — icons.js imports and passes `BookOpen, Shield, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle` — no `CheckCircle` or `XCircle`]

**How to avoid:** Phase 4 Wave 0 MUST update `src/utils/icons.js` to add `CheckCircle` and `XCircle` to the import and the `createIcons()` call.

**Warning signs:** Icons appear as empty squares or raw attribute text in the DOM after quiz injection.

### Pitfall 2: `renderModule()` Calls `progressStore` Before `init()` Has Run

**What goes wrong:** `module-view.js` calls `progressStore.getLessonProgress()` synchronously at render time, but if the router somehow renders before `progressStore.init()` completes, `_store` is null and the call throws.

**Why it happens:** `progressStore.init()` is `async` and is awaited in `main.js`. The router does not render until `init()` is awaited. [VERIFIED: codebase inspection — lesson-view.js comment "progressStore.init() already called: quiz engine can call progressStore APIs directly; no re-init needed" from CONTEXT.md code_context]

**How to avoid:** No action needed. This is safe in the current architecture. But confirm that `renderModule()` is never called from a code path that bypasses the `main.js` init sequence.

### Pitfall 3: Sidebar Progress Bars Become Stale After Quiz Completion

**What goes wrong:** Learner completes a quiz, the score is saved to progressStore, but the sidebar progress bar still shows the old percentage.

**Why it happens:** `initSidebar()` only runs once on app load. Progress bars are injected at that time with the initial progress state. Completing a quiz does not trigger a sidebar re-render.

**How to avoid:** Export a `refreshSidebarProgress()` function from `sidebar.js`. Call it from `quiz-engine.js` after `progressStore.saveQuiz()` is called. This function re-computes `computeModuleProgress()` for the affected module and updates only the progress bar element in the DOM — no full re-render.

**Warning signs:** Progress bar shows 0% even after completing all quizzes in a session.

### Pitfall 4: `modules-config.js` Missing `quizId` on Lesson Entries

**What goes wrong:** `computeModuleProgress()` has no way to know which lessons have quizzes. It treats all lessons as quiz-less, so a learner who passes a quiz gets no credit in the progress bar.

**Why it happens:** The current MODULES shape has `lessons: [{id, title}]` with no `quizId` field. The quiz-lesson association exists only in frontmatter.

**How to avoid:** Add `quizId` to `modules-config.js` lesson entries where a quiz exists. Example: `{ id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' }`. Only the `logging-auditing` module has a quiz in Phase 4's scope; other modules have placeholder quiz JSON that should NOT be counted yet. [VERIFIED: codebase inspection — only `logging-auditing/quizzes/01.json` exists and is populated; other modules have no quiz files]

**Warning signs:** Module progress stays at 0% after quiz completion, or conversely shows 100% immediately after visiting all lessons without quizzes.

### Pitfall 5: Quiz Section Not Found After DOM Re-render

**What goes wrong:** `quizEngine.renderQuiz()` appends a `.quiz-section` to `.lesson-column`. If the learner navigates away and back, `renderLesson()` rebuilds `app.innerHTML` from scratch, destroying the quiz section. `renderQuiz()` is called again and injects a fresh section.

**Why it happens:** This is the correct behavior — lesson-view.js always does a full DOM rebuild on navigation. No caching of quiz DOM state is needed; the revisit mode reads from `progressStore`.

**How to avoid:** No action needed. Confirm that `renderQuiz()` is always called after `app.innerHTML` is set (i.e., after Step 4 in `renderLesson()`). This is already the design.

### Pitfall 6: Quiz HTML Uses Inline Onclick Handlers

**What goes wrong:** `onclick="..."` in innerHTML strings fails with Content Security Policy if the project adds a CSP header in the future. Also makes testing harder.

**Why it happens:** The lesson-view uses `onmouseover` inline handlers on sidebar module links. Quiz implementation might follow that pattern.

**How to avoid:** Use `section.addEventListener('click', ...)` event delegation instead of inline onclick. This is already the established pattern for copy buttons in `attachCopyHandlers()`. [VERIFIED: codebase inspection — lesson-view.js does use `onmouseover` inline on sidebar items, but `attachCopyHandlers()` uses event delegation — follow the event-delegation pattern for quiz answers]

---

## Code Examples

### Quiz JSON Schema (fully populated)

```json
// Source: public/data/modules/logging-auditing/quizzes/01.json [VERIFIED]
{
  "id": "logging-auditing-quiz-01",
  "moduleId": "logging-auditing",
  "title": "Logging & Auditing Knowledge Check",
  "questions": [
    {
      "id": "q-01",
      "type": "multiple-choice",
      "stem": "Which PowerShell Event ID captures the full content of executed script blocks?",
      "complianceControls": ["NIST-AU-12"],
      "answers": [
        { "id": "a", "text": "4624", "correct": false, "feedback": "Event ID 4624 is a successful logon event, not script block logging." },
        { "id": "b", "text": "4104", "correct": true,  "feedback": "Correct. Event ID 4104 in the PowerShell/Operational log captures script block content when Script Block Logging is enabled." },
        { "id": "c", "text": "4688", "correct": false, "feedback": "Event ID 4688 logs process creation, not PowerShell script block content." },
        { "id": "d", "text": "7045", "correct": false, "feedback": "Event ID 7045 logs new service installation, not PowerShell activity." }
      ],
      "explanation": "Script Block Logging (Event ID 4104) captures the full text of all PowerShell script blocks to the Microsoft-Windows-PowerShell/Operational log."
    }
  ]
}
```

Note: The `status: "placeholder"` field in the file is a stale annotation — the data is fully populated. Phase 4 should remove that field when updating the quiz file (or ignore it as it is not read by the engine).

### Frontmatter Extension for `quizId`

```markdown
---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
quizId: '01'
---
```

`parseFrontmatter()` in `content-loader.js` passes all frontmatter fields into `meta` — `meta.quizId` is available to `renderLesson()` without any changes to the parser. [VERIFIED: codebase inspection — lesson-view.js Step 3: `const { meta, body } = parseFrontmatter(raw)`]

### Progress Store API Reference (complete, verified)

```javascript
// [VERIFIED: codebase inspection — progress-store.js]
progressStore.saveQuiz(moduleId, quizId, { score: 3, total: 4 })
// Stores: { score, total, attemptedAt: ISO string }
// Key: moduleId + '/' + quizId

progressStore.getQuizScore(moduleId, quizId)
// Returns: { score, total, attemptedAt } | null

progressStore.markLessonCompleted(moduleId, lessonId)
// Sets lessons[key].completed = true

progressStore.getLessonProgress(moduleId, lessonId)
// Returns: { visited: boolean, completed: boolean }
```

### Lesson-View Step 5 Injection Point (exact)

```javascript
// [VERIFIED: codebase inspection — lesson-view.js lines 67-86]
// Step 5 — Post-render wiring (must happen AFTER innerHTML is set)
progressStore.markVisited(moduleId, lessonId);
progressStore.setLastVisited(moduleId, lessonId);

// ... storage warning block ...

setActiveLesson(moduleId, lessonId);
activateIcons();
attachCopyHandlers();

// ADD AFTER attachCopyHandlers():
if (meta.quizId) {
  const lessonColumn = document.querySelector('.lesson-column');
  if (lessonColumn) {
    await renderQuiz(moduleId, meta.quizId, lessonColumn);
    // renderQuiz calls activateIcons() internally for quiz-specific icons
  }
}
```

Note: `renderLesson()` is already `async` (uses `await fetchLesson()`, `await renderMarkdown()`), so adding `await renderQuiz()` requires no signature change.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `SECTION_CARDS` placeholder content in module-view.js | Replace "Quizzes coming in Phase 4" card with real progress bar + lesson list | Phase 4 | `module-view.js` renderModule() is a full rewrite of its content area |
| No `quizId` on MODULES lesson entries | Add optional `quizId` field | Phase 4 | Enables synchronous progress calculation |
| `activateIcons()` missing CheckCircle/XCircle | Add to icons.js | Phase 4 Wave 0 | Required for answer state icons |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CSS.escape()` is available in the target browser environment (modern desktop browsers used by IT/OT admins) | Pattern 4 — Sidebar Progress Bar Injection | If unavailable, module IDs with special characters would fail querySelector — substitute a manual escape for `[data-module-id]` attribute values |
| A2 | Removing `status: "placeholder"` from `01.json` is acceptable | Code Examples section | Low risk — field is not read by any existing code; purely cosmetic |
| A3 | The only quiz file in scope for Phase 4 is `logging-auditing/quizzes/01.json`; other modules' quiz placeholders (`exercises/01.json` etc.) are not activated | Pitfall 4 | If other module quiz files exist and should count, progress logic would undercount completions |

**A3 clarification:** [VERIFIED: glob scan] Only `logging-auditing/quizzes/01.json` exists. No quiz files exist for other modules. Other module lesson entries in `modules-config.js` should NOT receive `quizId` values in Phase 4.

---

## Open Questions

1. **Should `computeModuleProgress()` live in `quiz-engine.js` or a new `src/utils/progress.js`?**
   - What we know: Both `sidebar.js` and `module-view.js` need it; it depends on `progressStore` and `MODULES`.
   - What's unclear: Whether `quiz-engine.js` is the right home (it is primarily a render module) or whether a dedicated `progress.js` util is cleaner.
   - Recommendation: Put it in `quiz-engine.js` as a named export for Phase 4. If Phase 5/6 need similar computation, extract to `src/utils/progress.js` then.

2. **When should the sidebar progress bar update — only on init, or also after quiz completion?**
   - What we know: D-08 says sidebar shows completion percentage. After a quiz is submitted the percentage changes.
   - What's unclear: Whether the UX requires immediate sidebar update in the same session.
   - Recommendation: Yes, add a `refreshSidebarProgress(moduleId)` export from `sidebar.js`; call it from the quiz engine's score-save handler. This is necessary to meet SC-3 (progress bars reflect completion state).

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 has no external tool dependencies. All capabilities are vanilla JS + already-installed npm packages. No new `npm install` required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 with happy-dom 20.9.0 |
| Config file | `vitest.config.js` (root) |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSESS-01 | Quiz renders with per-answer feedback text | unit | `npm test -- --reporter=verbose tests/quiz-engine.test.js` | Wave 0 |
| ASSESS-01 | Clicking answer reveals feedback; all answers lock | unit | `npm test -- tests/quiz-engine.test.js` | Wave 0 |
| ASSESS-01 | Score saved to progressStore when last answer clicked | unit | `npm test -- tests/quiz-engine.test.js` | Wave 0 |
| ASSESS-01 | Revisit renders score banner, locked cards, no handlers | unit | `npm test -- tests/quiz-engine.test.js` | Wave 0 |
| SHELL-03 | `computeModuleProgress` returns correct pct for mixed quiz/quiz-less lessons | unit | `npm test -- tests/quiz-engine.test.js` | Wave 0 |
| SHELL-03 | Sidebar contains `.sidebar-progress-bar` elements after `initSidebar()` | unit | `npm test -- tests/sidebar.test.js` (extend existing) | Extend existing |
| SHELL-03 | `refreshSidebarProgress()` updates bar width after quiz completion | unit | `npm test -- tests/sidebar.test.js` | Extend existing |
| SHELL-03 | `renderModule()` includes progress bar and lesson status badges | unit | `npm test -- tests/module-view.test.js` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/quiz-engine.test.js` — covers ASSESS-01 (fetch, render, click handlers, revisit mode, score save, `computeModuleProgress`)
- [ ] `tests/module-view.test.js` — covers SHELL-03 module-view progress bar + lesson status list
- Vitest and happy-dom already installed — no framework install needed
- `tests/sidebar.test.js` — already exists; extend to cover progress bar injection and `refreshSidebarProgress()`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `esc()` on all quiz text (stem, answer text, feedback, explanation) before innerHTML injection |
| V6 Cryptography | no | — |

### Known Threat Patterns for Static DOM Injection

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via quiz JSON content | Tampering | `esc()` on every string from quiz JSON before innerHTML — stem, answer text, feedback, explanation, quiz title |
| Prototype pollution via quiz JSON | Tampering | Only access expected fields (`id`, `stem`, `answers`, `explanation`, `complianceControls`) — never use `JSON.parse` result keys as dynamic property names |
| Quiz ID path traversal in fetch URL | Tampering | `quizId` comes from lesson frontmatter (trusted authored content), not from URL hash. No sanitization needed beyond what `import.meta.env.BASE_URL` prefix provides |

**Note on quiz data trust:** Quiz JSON is static authored content served from `public/data/` — it is not user-generated. XSS escaping is still required as a defense-in-depth measure against accidental HTML in authored content. [VERIFIED: CLAUDE.md — "No backend, no real PowerShell execution. This is a static GitHub Pages site."]

---

## Sources

### Primary (HIGH confidence)
- `src/views/lesson-view.js` — exact Step 5 post-render block structure, async/await usage, `.lesson-column` selector, `parseFrontmatter()` return shape [VERIFIED: codebase read]
- `src/sidebar.js` — `initSidebar()` full structure, DOM injection approach, `insertBefore(footer, toggleBtn)` pattern [VERIFIED: codebase read]
- `src/views/module-view.js` — current synchronous render function, `SECTION_CARDS` placeholder structure [VERIFIED: codebase read]
- `src/progress-store.js` — complete API surface, all signatures and return types [VERIFIED: codebase read]
- `src/modules-config.js` — exact MODULES shape, lesson counts per module (3 + 2 + 2 + 2 + 2 = 11 lessons total across 5 modules) [VERIFIED: codebase read]
- `src/utils/icons.js` — current icon set (CheckCircle and XCircle NOT present — must be added) [VERIFIED: codebase read]
- `src/style.css` — all CSS custom properties, existing class names [VERIFIED: codebase read]
- `public/data/modules/logging-auditing/quizzes/01.json` — fully populated quiz schema [VERIFIED: codebase read]
- `public/data/modules/logging-auditing/lessons/audit-policies.md` — frontmatter structure, no `quizId` present yet [VERIFIED: codebase read]
- `vitest.config.js`, `package.json` — test infrastructure confirmed [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- None required — all research was codebase-based.

### Tertiary (LOW confidence)
- None — no unverified claims.

---

## Project Constraints (from CLAUDE.md)

All directives below must be honored by the planner:

1. **No backend** — all storage through `progressStore`, all data from static `public/data/` fetch
2. **All localStorage through `progress-store.js` exclusively** — no direct `localStorage` calls anywhere in new code
3. **`esc()` on all frontmatter/JSON values inserted into innerHTML** — applies to quiz stem, answer text, feedback, explanation, quiz title
4. **`import.meta.env.BASE_URL` prefix on all `public/data/` fetches** — applies to quiz JSON fetch
5. **Null-guard pattern (WR-04)** — `if (element && element.classList)` before any DOM manipulation
6. **Inline style pattern** — layout via inline `style="..."` attributes; no new CSS classes needed for layout
7. **Single-module ownership** — `quiz-engine.js` owns all quiz fetch + render logic; `lesson-view.js` calls it as a black box
8. **Hash-based routing** — no route changes for quiz; quiz is inline in lesson view
9. **PS version target: PS 5.1** — not directly relevant to this phase (no terminal work)
10. **TSA directive is SD-02F** — `complianceControls` in quiz JSON uses `compliance-refs.json` sourced IDs; quiz engine does not render compliance controls from quiz JSON (they are metadata only)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries and utilities verified by direct codebase inspection
- Architecture: HIGH — exact injection points verified by reading the source files
- Pitfalls: HIGH — Pitfalls 1 and 4 are verified facts (icons.js missing CheckCircle; MODULES missing quizId); others are verified by code structure
- Progress calculation: HIGH — progressStore API signatures verified; MODULES shape verified; D-07 formula from CONTEXT.md locked

**Research date:** 2026-05-14
**Valid until:** Stable — this research targets specific source files at a known commit state. Valid until any of the integration point files change.
