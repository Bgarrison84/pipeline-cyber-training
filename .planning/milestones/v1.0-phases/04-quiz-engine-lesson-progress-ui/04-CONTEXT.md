# Phase 4: Quiz Engine + Lesson Progress UI - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `src/quiz-engine.js` — a module that fetches quiz JSON, renders multiple-choice questions inline at the bottom of any lesson whose frontmatter declares a `quizId`, records scores to `progressStore`, and shows per-answer explanatory feedback. Also update `src/sidebar.js` and `src/views/module-view.js` to display thin progress bars, per-lesson completion status, and module-complete marking — all derived from `progressStore` state.

</domain>

<decisions>
## Implementation Decisions

### Quiz Placement & Routing

- **D-01:** Quiz renders **inline** at the bottom of the lesson page — no dedicated route, no route change. `quiz-engine.js` injects the quiz section into the existing `.lesson-column` below the article.
- **D-02:** Any lesson can have a quiz. The lesson's Markdown frontmatter declares `quizId: '01'` (or any other ID). `lesson-view.js` reads this field after parsing frontmatter and calls the quiz engine if present.
- **D-03:** Quiz JSON is fetched from `public/data/modules/{moduleId}/quizzes/{quizId}.json`. This follows the same `import.meta.env.BASE_URL + 'data/...'` fetch pattern as lessons.

### Answer Submission UX

- **D-04:** **Click-to-reveal immediately** — no submit button. Clicking an answer card immediately reveals that answer's state and feedback. All options lock after first click. No retry allowed (matches D-04 from Phase 3: last-attempt-only storage).
- **D-05:** **All questions visible at once** on a single page. Each question card is independent — clicking an answer on Q1 locks Q1 without affecting Q2. Score is tallied and saved to `progressStore` when the last unanswered question is answered.
- **D-06:** Visual answer states — **correct: green border (`#22c55e`) + check icon; wrong: red border (`var(--color-destructive)`) + X icon**. The per-answer `feedback` text is shown below the selected answer immediately. The overall `explanation` for the question is shown below all answer options after any answer is clicked.

### Progress Bar Design

- **D-07:** **Completion logic:** visiting a lesson alone does NOT count toward progress. Only passing a quiz counts. Lessons without a quiz count as complete when visited. Progress = (quizzes passed + quiz-less lessons visited) / (total quizzes + total quiz-less lessons).
- **D-08:** Sidebar: a **4px thin horizontal progress bar** below the module title link, filled to the completion percentage. Uses `--color-accent` fill color on `--color-bg-secondary` track.
- **D-09:** **Module complete** is marked by a `check-circle` Lucide icon appearing next to the module title in the sidebar + accent color applied to the module title text. Triggered when D-07 completion = 100%.
- **D-10:** Module overview page (`#/module/moduleId`) shows: progress bar at top + an ordered list of lessons, each tagged with its status: `unvisited` / `visited` / `quiz-passed`. Consistent with sidebar calculation.

### Score Display on Revisit

- **D-11:** When a learner revisits a lesson they previously quizzed: a **score banner** appears at the top of the quiz section — `"Your last attempt: {score}/{total} correct — {attemptedAt date}"`. Below it, all question cards render in their locked state with the learner's prior answer highlighted (correct/wrong state restored). No re-submission is possible.
- **D-12:** Score/state is restored from `progressStore.getQuizScore(moduleId, quizId)`. The stored object is `{score, total, attemptedAt}` — the previously selected answer IDs are NOT stored (Phase 3 decision D-04), so the revisit view shows the score summary + locked cards but cannot re-highlight which specific option was chosen.

### Claude's Discretion

- Exact CSS layout of the quiz section (padding, card gap, border radius) — follow established lesson-view inline style patterns.
- Whether to show a "Quiz complete — {score}/{total}" congratulations message after the last question is answered — use best judgment for UX.
- Whether to call `progressStore.markLessonCompleted(moduleId, lessonId)` when a quiz is passed — yes, do this (passes the quiz = lesson complete per D-07).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `CLAUDE.md` — No backend, static GitHub Pages, PS 5.1 target, all localStorage through progress-store.js exclusively
- `.planning/REQUIREMENTS.md` — ASSESS-01 (per-answer feedback), SHELL-03 (progress bars + module complete marking)
- `.planning/ROADMAP.md §Phase 4` — Success criteria and phase dependencies

### Existing Code (integration points)
- `src/views/lesson-view.js` — renderLesson() is the entry point; quiz injection happens in Step 5 (post-render block) after progressStore calls; `parseFrontmatter()` returns `meta` with `quizId` if declared
- `src/sidebar.js` — `initSidebar()` renders the module/lesson list; Phase 4 adds progress bars here and modifies `setActiveModule()` to reflect completion state
- `src/views/module-view.js` — current module overview view; Phase 4 replaces/updates it to show per-lesson progress status
- `src/progress-store.js` — `saveQuiz(moduleId, quizId, {score, total})`, `getQuizScore(moduleId, quizId)`, `markLessonCompleted(moduleId, lessonId)`, `getLessonProgress(moduleId, lessonId)` — all ready
- `src/modules-config.js` — `MODULES` array defines all moduleId/lessonId combinations and lesson counts

### Quiz Data Schema (already defined)
- `public/data/modules/logging-auditing/quizzes/01.json` — canonical quiz JSON structure: `{id, moduleId, title, questions[{id, type, stem, complianceControls, answers[{id, text, correct, feedback}], explanation}]}`

### Lesson Frontmatter (to be extended)
- `public/data/modules/logging-auditing/lessons/audit-policies.md` — example of adding `quizId: '01'` to frontmatter (this lesson currently lacks it — Phase 4 adds it)

### Phase Contracts (what later phases will call)
- Phase 5 (Terminal) calls: `progressStore.saveExercise(moduleId, exerciseId)` — not affected by Phase 4
- Phase 6 (Scenarios) calls: `progressStore.saveScenario(moduleId, scenarioId)` — not affected by Phase 4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/escape.js` `esc()` — must be applied to all quiz text (stem, answers, feedback) inserted into innerHTML
- `src/utils/icons.js` `activateIcons()` — call after injecting quiz HTML so check-circle / x-circle Lucide icons render
- `.lesson-error` CSS class in `src/style.css` — reusable for quiz-not-found error state
- `var(--color-accent)`, `var(--color-border)`, `var(--color-bg-secondary)`, `var(--color-text-muted)` CSS custom properties — established design tokens; use for all quiz styling

### Established Patterns
- **Inline style pattern:** lesson-view.js uses inline `style="..."` attributes throughout (no external CSS classes for layout). Quiz section follows this pattern — no new CSS classes needed for layout.
- **Single-module ownership:** quiz-engine.js owns all quiz fetch + render logic; lesson-view.js calls it as a black box.
- **Error boundary at module edge:** if quiz JSON fetch fails (404 or network error), quiz-engine returns null silently; lesson-view does not show an error (quiz is supplementary to the lesson content).
- **`import.meta.env.BASE_URL` prefix:** all `public/data/` fetches use this prefix — quiz fetch must too.
- **Null-guard pattern (WR-04):** `if (element && element.classList)` before any DOM manipulation.
- **`progressStore.init()` already called:** quiz engine can call progressStore APIs directly; no re-init needed.

### Integration Points
- `lesson-view.js` `renderLesson()` Step 5 post-render block: after `progressStore.markVisited()` and `progressStore.setLastVisited()`, call `await quizEngine.renderQuiz(moduleId, meta.quizId, lessonColumn)` if `meta.quizId` is defined.
- `sidebar.js` `initSidebar()` end: after building the module/lesson HTML, inject progress bars via a new `renderModuleProgress(mod)` helper that reads from `progressStore`.
- `module-view.js` render function: call `progressStore.getLessonProgress()` and `progressStore.getQuizScore()` for each lesson to populate the status list.

</code_context>

<specifics>
## Specific Ideas

- Correct answer color: **`#22c55e`** (green) — not `--color-accent` (which is orange and would be confusing for "correct")
- Wrong answer color: **`var(--color-destructive)`** (existing red token)
- Progress bar track height: **4px** — thin, unobtrusive, matches the sidebar's compact layout
- Score banner on revisit format: `"Your last attempt: {score}/{total} correct — {date}"` using `attemptedAt.slice(0, 10)` for the date
- The `quizId` stored in `progressStore.quizzes` key format: `"{moduleId}/{quizId}"` — already locked in Phase 3 (D-04)
- Lucide icons to use: `check-circle` (correct), `x-circle` (wrong), `check-circle` (module complete in sidebar)

</specifics>

<deferred>
## Deferred Ideas

- **One question at a time / wizard flow** — discussed and deferred; all-at-once is simpler for this scope
- **Retry-until-correct mode** — discussed and deferred; last-attempt-only storage already locked
- **Quiz score in lesson header** (near compliance bar) — discussed; score banner at top of quiz section is sufficient
- **"Complete" badge text in sidebar** — the check-circle icon alone is the completion signal; no badge text needed

</deferred>

---

*Phase: 4-quiz-engine-lesson-progress-ui*
*Context gathered: 2026-05-14*
