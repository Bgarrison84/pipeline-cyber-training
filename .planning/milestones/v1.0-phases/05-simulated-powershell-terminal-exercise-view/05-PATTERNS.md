# Phase 5: Simulated PowerShell Terminal + Exercise View — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 10 (4 new, 6 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/terminal-engine.js` | utility/factory | event-driven | `src/quiz-engine.js` (event delegation, DOM factory) | role-partial |
| `src/views/exercise-view.js` | view | request-response | `src/views/lesson-view.js` | exact |
| `tests/terminal-engine.test.js` | test | — | `tests/quiz-engine.test.js` | exact |
| `tests/exercise-view.test.js` | test | — | `tests/quiz-engine.test.js` | exact |
| `src/router.js` | router | request-response | `src/router.js` (self — add one route) | exact |
| `src/modules-config.js` | config | — | `src/modules-config.js` (self — add exerciseId field) | exact |
| `src/views/module-view.js` | view | request-response | `src/views/module-view.js` (self — extend lessonRows) | exact |
| `src/quiz-engine.js` | service | CRUD | `src/quiz-engine.js` (self — extend computeModuleProgress) | exact |
| `public/data/modules/logging-auditing/exercises/01.json` | config/data | — | existing file (self — schema upgrade) | exact |
| `tests/router.test.js` | test | — | `tests/router.test.js` (self — add exercise route test) | exact |

---

## Pattern Assignments

### `src/terminal-engine.js` (utility/factory, event-driven)

**Analog:** `src/quiz-engine.js` — DOM factory pattern with event listeners, state enclosure

**No direct analog** for a vanilla terminal factory exists in the codebase. This is the sole greenfield module. The closest structural analog is quiz-engine's closure over mutable state (answeredCount, score) and event delegation attachment pattern. The RESEARCH.md Pattern 1 is the authoritative spec.

**Factory closure pattern** (from `src/quiz-engine.js` lines 165–244 — attachQuizHandlers):
```javascript
// Closure over mutable state — copy this pattern for terminal state (history, historyIndex, disabled)
function attachQuizHandlers(section, moduleId, quizId, quiz, lessonId, lessonColumn) {
  const totalQuestions = quiz.questions.length;
  let answeredCount = 0;
  let score = 0;
  section.addEventListener('click', (e) => { /* ... */ });
}
```

**DOM element creation pattern** (from `src/quiz-engine.js` lines 234–243):
```javascript
const completionBanner = document.createElement('div');
completionBanner.className = 'quiz-completion-banner';
completionBanner.style.cssText = 'padding: var(--spacing-md); margin-top: var(--spacing-lg); text-align: center;';
const completionP = document.createElement('p');
completionP.style.cssText = 'font-size: var(--text-body); font-weight: 600; margin: 0;';
completionP.style.color = score === totalQuestions ? '#22c55e' : 'var(--color-text-muted)';
completionP.textContent = `Quiz complete — ${score}/${totalQuestions} correct`;
completionBanner.appendChild(completionP);
lessonColumn.appendChild(completionBanner);
```

**Key rules for terminal-engine.js:**
- Use `textContent` assignment on all output lines — never `innerHTML`. `successOutput` strings contain `<` chars from PS error messages.
- `history.unshift(trimmed)` (not push) so `history[0]` is always most recent command.
- Expose API object: `{ appendOutput, disable, setPrompt, focus }` — no class, pure factory.
- Wrap `new RegExp(cmd.pattern, flags)` in try/catch in `handleCommand` (exercise-view), not in terminal-engine itself.
- Terminal body click → `input.focus()` (guarded by `!disabled` check).

**Inline style pattern** (all prior views use this — no new CSS classes for layout):
```javascript
// From quiz-engine.js line 43 — follow this exact pattern
section.style.cssText = 'padding-top: var(--spacing-2xl); border-top: 1px solid var(--color-border); margin-top: var(--spacing-xl);';
```

---

### `src/views/exercise-view.js` (view, request-response)

**Analog:** `src/views/lesson-view.js` — async view that fetches JSON, writes to #app, calls progressStore, returns null

**Full async view pattern** (lesson-view.js lines 25–95):
```javascript
export async function renderLesson({ moduleId, lessonId }) {
  // null-guard params first
  if (!moduleId || !lessonId) {
    const app = document.getElementById('app');
    if (app) app.innerHTML = renderLessonNotFound();
    return null;
  }
  // null-guard app
  const app = document.getElementById('app');
  if (app) {
    app.setAttribute('aria-busy', 'true');
    app.innerHTML = renderLessonLoading();           // Step 1: loading skeleton immediately
  }
  // Step 2: async fetch
  const raw = await fetchLesson(moduleId, lessonId);
  if (raw === null) {
    if (app) { app.innerHTML = renderLessonError('not-found'); app.removeAttribute('aria-busy'); }
    return null;
  }
  // Step 3: build + inject HTML
  if (app) { app.innerHTML = lessonHtml; app.removeAttribute('aria-busy'); }
  // Step 4: post-render wiring AFTER innerHTML is set
  progressStore.markVisited(moduleId, lessonId);
  if (!progressStore.isStorageAvailable()) { /* prepend warning to .lesson-column */ }
  activateIcons();
  return null;
}
```

**Fetch with BASE_URL + silent null return on failure** (quiz-engine.js lines 29–38):
```javascript
const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/quizzes/' + quizId + '.json';
let quiz;
try {
  const res = await fetch(url);
  if (!res.ok) return null;
  quiz = await res.json();
} catch {
  return null;
}
```
Apply verbatim for exercise-view, changing `quizzes` to `exercises`.

**null-guard on container before proceeding** (quiz-engine.js line 23):
```javascript
export async function renderQuiz(moduleId, quizId, lessonColumn, lessonId) {
  if (!lessonColumn) return null;
```

**Dynamic import for sidebar (circular dep avoidance)** (quiz-engine.js line 231):
```javascript
import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
```
Use identically in `completeExercise()`.

**progressStore calls at completion** (quiz-engine.js lines 227–231):
```javascript
progressStore.saveQuiz(moduleId, quizId, { score, total: totalQuestions });
progressStore.markLessonCompleted(moduleId, lessonId);
import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
```
Exercise equivalent (in completeExercise()):
```javascript
progressStore.saveExercise(moduleId, exerciseId);
progressStore.markLessonCompleted(moduleId, lessonId);
import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
terminal.disable();
```

**lessonId derivation from MODULES config** (CONTEXT.md Claude's Discretion):
```javascript
const mod = MODULES.find(m => m.id === moduleId);
const lesson = mod?.lessons.find(l => l.exerciseId === exerciseId);
const lessonId = lesson?.id ?? exerciseId;  // fallback: use exerciseId as lessonId string
```

**esc() on all JSON strings before innerHTML** (quiz-engine.js lines 76–93):
```javascript
<p class="quiz-stem" style="...">${esc(q.stem)}</p>
<button data-answer-id="${esc(a.id)}">${esc(a.text)}</button>
<div class="quiz-answer-feedback" style="...">${esc(a.feedback)}</div>
```
Apply `esc()` to: exercise `title`, `description`, `context`, `instruction`, `hint`, `feedbackOnWrong`. Do NOT use `esc()` on `successOutput` — it is rendered via `textContent`, not innerHTML.

**Storage warning pattern** (lesson-view.js lines 74–81):
```javascript
if (!progressStore.isStorageAvailable()) {
  const warningDiv = document.createElement('div');
  warningDiv.className = 'storage-warning';
  warningDiv.setAttribute('role', 'alert');
  warningDiv.innerHTML = '<p style="font-size: var(--text-body); color: var(--color-text-muted); margin: 0 0 var(--spacing-sm) 0;">Progress cannot be saved...</p>';
  const lessonColumn = document.querySelector('.lesson-column');
  if (lessonColumn) lessonColumn.prepend(warningDiv);
}
```

**activateIcons() call after DOM injection** (lesson-view.js line 84, quiz-engine.js line 57):
```javascript
lessonColumn.appendChild(section);
activateIcons();
```

**Import block pattern for a view file** (lesson-view.js lines 1–14):
```javascript
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../badge.js';
import { activateIcons } from '../utils/icons.js';
import { esc } from '../utils/escape.js';
import { progressStore } from '../progress-store.js';
```
exercise-view.js adds:
```javascript
import { createTerminal } from '../terminal-engine.js';
```
No static import of `sidebar.js` — always dynamic.

**Column width** (lesson-view.js line 104):
```javascript
style="max-width: var(--lesson-reading-width, 720px); margin: 0 auto; padding: var(--spacing-xl);"
```
Use same wrapper/column pattern in exercise-view (D-06).

**Error state pattern** (lesson-view.js lines 250–273):
```javascript
function renderLessonError(type) {
  return `<section style="padding: var(--spacing-xl);">
    <div class="lesson-error" role="alert"
         style="background: var(--color-bg-secondary); border: 1px solid var(--color-destructive);
                border-radius: 6px; padding: var(--spacing-lg); max-width: var(--lesson-reading-width, 720px); margin: 0 auto;">
      <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
        <i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--color-destructive);flex-shrink:0;"></i>
        <p style="font-size: var(--text-body); font-weight: 600; color: var(--color-text-primary); margin: 0;">
          Lesson content could not be loaded
        </p>
      </div>
      ...
    </div>
  </section>`;
}
```
Rename to `renderExerciseError`, change text to "Exercise content could not be loaded".

**Compliance badge rendering** (lesson-view.js lines 121–127, module-view.js lines 64–67):
```javascript
const badges = complianceTags.map(tag => renderBadge(tag)).join('');
```
Use for exercise `complianceControls[]` array in the exercise header.

---

### `src/router.js` (router, request-response — modify)

**Analog:** `src/router.js` — self (two-line addition)

**Existing routes array pattern** (router.js lines 10–14):
```javascript
const routes = [
  { pattern: '#/',                              view: 'home' },
  { pattern: '#/module/:moduleId',              view: 'module' },
  { pattern: '#/lesson/:moduleId/:lessonId',    view: 'lesson' },
];
```
Add after lesson route:
```javascript
  { pattern: '#/exercise/:moduleId/:exerciseId', view: 'exercise' },
```

**Existing viewRenderers pattern** (router.js lines 40–45):
```javascript
const viewRenderers = {
  home:        (params) => renderHome(params),
  module:      (params) => renderModule(params),
  lesson:      (params) => renderLesson(params),
  'not-found': (params) => renderNotFound(params),
};
```
Add:
```javascript
  exercise:    (params) => renderExercise(params),
```

**Import to add** (router.js lines 1–8 — mirror existing import style):
```javascript
import { renderExercise } from './views/exercise-view.js';
```

**`handleRoute` requires NO changes.** `setActiveModule(params.moduleId)` already works since exercise params include `moduleId`. The `if (params.lessonId)` guard on line 76 already prevents `setActiveLesson` from being called for exercise routes (no `lessonId` in exercise params).

**`extractParams` requires NO changes.** It iterates parts positionally and handles any N-segment patterns (verified: lines 16–29).

---

### `src/modules-config.js` (config — modify)

**Analog:** `src/modules-config.js` — self

**Existing lesson shape with quizId** (modules-config.js line 18):
```javascript
{ id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
```

**Target change** — add `exerciseId` to `ps-logging` (NOT `audit-policies` which already has `quizId: '01'`):
```javascript
{ id: 'ps-logging', title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
```

`exerciseId` is optional on lesson shape — lessons without it are unaffected throughout the codebase.

---

### `src/views/module-view.js` (view — modify)

**Analog:** `src/views/module-view.js` — self

**Existing lessonRows map pattern** (module-view.js lines 42–48):
```javascript
const lessonRows = mod.lessons.map(lesson => `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--spacing-sm) var(--spacing-md);border:1px solid var(--color-border);border-radius:4px;margin-bottom:var(--spacing-xs);background:var(--color-bg-secondary);">
    <a href="#/lesson/${esc(mod.id)}/${esc(lesson.id)}"
       style="color:var(--color-text-primary);text-decoration:none;font-size:var(--text-body);">${esc(lesson.title)}</a>
    ${lessonStatusBadge(mod, lesson)}
  </div>
`).join('');
```
Extend to render an exercise link below the lesson row when `lesson.exerciseId` exists. Compute `exerciseDone` before the template:
```javascript
const exerciseDone = lesson.exerciseId
  ? progressStore.getExerciseCompletion(mod.id, lesson.exerciseId) !== null
  : false;
```

**lessonStatusBadge pattern** (module-view.js lines 12–33) — for exercise-backed lessons (no quizId), follow the existing `else` branch behavior: show visited/unvisited badge based on `getLessonProgress`. No change needed to `lessonStatusBadge` for Phase 5 since `ps-logging` has `exerciseId` but no `quizId`.

**Existing link style for reference** (module-view.js line 44–45):
```javascript
<a href="#/lesson/${esc(mod.id)}/${esc(lesson.id)}"
   style="color:var(--color-text-primary);text-decoration:none;font-size:var(--text-body);">
```

---

### `src/quiz-engine.js` — `computeModuleProgress` (service — modify)

**Analog:** `src/quiz-engine.js` — self

**Current lesson loop** (quiz-engine.js lines 262–272):
```javascript
for (const lesson of mod.lessons) {
  denominator++;
  if (lesson.quizId) {
    // Quiz-backed lesson: counts as complete only when quiz is passed
    const quizScore = progressStore.getQuizScore(mod.id, lesson.quizId);
    if (quizScore !== null) numerator++;
  } else {
    // Quiz-less lesson: counts as complete when visited
    const progress = progressStore.getLessonProgress(mod.id, lesson.id);
    if (progress && progress.visited) numerator++;
  }
}
```

**Required change** — insert `else if (lesson.exerciseId)` between the quizId branch and the else branch:
```javascript
for (const lesson of mod.lessons) {
  denominator++;
  if (lesson.quizId) {
    const quizScore = progressStore.getQuizScore(mod.id, lesson.quizId);
    if (quizScore !== null) numerator++;
  } else if (lesson.exerciseId) {
    // Exercise-backed: counts as complete when exercise saved
    const ex = progressStore.getExerciseCompletion(mod.id, lesson.exerciseId);
    if (ex !== null) numerator++;
  } else {
    const progress = progressStore.getLessonProgress(mod.id, lesson.id);
    if (progress && progress.visited) numerator++;
  }
}
```

**JSDoc update** (quiz-engine.js lines 253–257) — extend the `@param` lessons array type to include `exerciseId?`:
```javascript
 * @param {{ id: string, lessons: Array<{id: string, quizId?: string, exerciseId?: string}> }} mod
```

---

### `public/data/modules/logging-auditing/exercises/01.json` (data — modify)

**Analog:** existing file + RESEARCH.md schema spec

**Current state** (01.json — 25 lines):
- 1 step only, `"status": "placeholder"` field present, no `hintPatterns`.

**Required changes:**
1. Remove `"status": "placeholder"` field (root level).
2. Add `hintPatterns[]` array to step-1 (optional field per D-13 schema).
3. Add steps 2 and 3 with realistic PS 5.1 output (for TERM-02).
4. Upgrade step-1 `successOutput` to match real PS 5.1 `Get-ItemProperty` error format (RESEARCH.md Realistic PS Output section).

**Existing step schema shape** (01.json lines 10–24):
```json
{
  "id": "step-1",
  "instruction": "...",
  "hint": "...",
  "expectedCommands": [
    { "pattern": "...", "matchType": "regex", "caseSensitive": false }
  ],
  "successOutput": "...",
  "feedbackOnWrong": "..."
}
```
Add `hintPatterns` between `hint` and `expectedCommands`:
```json
"hintPatterns": [
  { "pattern": "...", "hint": "..." }
]
```

The full 3-step target schema is documented verbatim in RESEARCH.md lines 641–716.

---

### `tests/terminal-engine.test.js` (test — new)

**Analog:** `tests/quiz-engine.test.js` — full pattern match

**Mock block pattern** (quiz-engine.test.js lines 9–55 — place ALL vi.mock() calls before any imports):
```javascript
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    saveExercise: vi.fn(),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    markLessonCompleted: vi.fn(),
    isStorageAvailable: vi.fn().mockReturnValue(true),
  },
}))
vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))
```
terminal-engine.test.js has NO circular deps — no sidebar mock needed. Only mock DOM globals not provided by happy-dom.

**Import pattern** (quiz-engine.test.js lines 57–113):
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let createTerminal

beforeEach(async () => {
  document.body.innerHTML = '<div id="terminal-container"></div>'
  const module = await import('../src/terminal-engine.js')
  createTerminal = module.createTerminal
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
```

**DOM query pattern for assertions** (quiz-engine.test.js lines 125–150):
```javascript
it('injects a .quiz-section element into .lesson-column', async () => {
  const lessonColumn = document.querySelector('.lesson-column')
  await renderQuiz('logging-auditing', '01', lessonColumn, 'audit-policies')
  const section = lessonColumn.querySelector('.quiz-section')
  expect(section).not.toBeNull()
})
```

**KeyboardEvent dispatch for Enter/ArrowUp/ArrowDown testing:**
```javascript
// happy-dom supports dispatchEvent with KeyboardEvent
input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
```

**Test cases to implement** (from RESEARCH.md Validation Architecture):
- `createTerminal` returns object with `appendOutput`, `disable`, `setPrompt`, `focus` methods
- `appendOutput(text)` → DOM element with `textContent === text` in output list
- `appendOutput(text, color)` → output element `style.color === color`
- `disable()` → input has `readonly` attribute; input `style.pointerEvents === 'none'`
- Enter with empty trimmed input → `commandHandler` NOT called
- Enter with non-empty input → `commandHandler` called with trimmed value
- Submit command → input cleared after commandHandler call
- ArrowUp → input value = last submitted command
- ArrowUp twice → input value = second-to-last command
- ArrowDown after ArrowUp → input value advances forward
- ArrowDown at history start → input cleared

---

### `tests/exercise-view.test.js` (test — new)

**Analog:** `tests/quiz-engine.test.js` — exact mock structure + fetch stub pattern

**Full mock block** (copy structure from quiz-engine.test.js lines 9–55, adapt for exercise-view):
```javascript
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    saveExercise: vi.fn(),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    markLessonCompleted: vi.fn(),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
  },
}))
vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))
vi.mock('../src/modules-config.js', () => ({
  MODULES: [{
    id: 'logging-auditing',
    lessons: [
      { id: 'ps-logging', title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
    ],
  }],
}))
// sidebar.js — dynamic import used in exercise-view; mock to prevent real module load
vi.mock('../src/sidebar.js', () => ({
  refreshSidebarProgress: vi.fn(),
}))
// terminal-engine.js — mock to decouple from DOM complexity in exercise-view tests
vi.mock('../src/terminal-engine.js', () => ({
  createTerminal: vi.fn().mockReturnValue({
    appendOutput: vi.fn(),
    disable: vi.fn(),
    setPrompt: vi.fn(),
    focus: vi.fn(),
  }),
}))
```

**Fetch stub pattern** (quiz-engine.test.js lines 97–100):
```javascript
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue(EXERCISE_JSON),
}))
```

**DOM setup for exercise-view** (mirrors quiz-engine.test.js lines 90–96):
```javascript
beforeEach(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  // stub fetch with EXERCISE_JSON fixture
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(EXERCISE_JSON) }))
})
```

**Test fixture shape** — 2-step exercise for testing step progression without 3-step overhead:
```javascript
const EXERCISE_JSON = {
  id: 'logging-auditing-ex-01',
  moduleId: 'logging-auditing',
  title: 'Enable Script Block Logging',
  description: 'Use PowerShell to enable Script Block Logging.',
  complianceControls: ['TSA-Monitoring', 'NIST-AU-12'],
  context: 'You are logged into PIPELINE-DC01.',
  steps: [
    {
      id: 'step-1',
      instruction: 'Check whether the ScriptBlockLogging registry key exists.',
      hint: 'Use Get-ItemProperty with the HKLM: path.',
      hintPatterns: [{ pattern: 'Get-Item\\s+HKLM', hint: 'Close — try Get-ItemProperty.' }],
      expectedCommands: [{ pattern: 'Get-ItemProperty.*ScriptBlockLogging', matchType: 'regex', caseSensitive: false }],
      successOutput: 'Cannot find path...',
      feedbackOnWrong: 'Navigate to HKLM:\\...',
    },
    {
      id: 'step-2',
      instruction: 'Create the ScriptBlockLogging registry key.',
      hint: 'Use New-Item.',
      hintPatterns: [],
      expectedCommands: [{ pattern: 'New-Item.*ScriptBlockLogging', matchType: 'regex', caseSensitive: false }],
      successOutput: 'ScriptBlockLogging created.',
      feedbackOnWrong: 'Use New-Item to create the key.',
    },
  ],
}
```

**Test cases to implement** (from RESEARCH.md Validation Architecture):
- Failed fetch → DOM contains "Exercise content could not be loaded" (mirrors renderLessonError text)
- Valid JSON → exercise `title` in DOM
- Valid JSON → simulator label text present: "PS SIMULATOR — commands do not run on any real system" (TERM-04)
- Step panel shows "Step 1 of 2" on load
- Correct command on step 1 of 2 → `progressStore.saveExercise` NOT called (not last step)
- Correct command on step 1 → step panel advances to "Step 2 of 2"
- Correct command on last step → `progressStore.saveExercise(moduleId, exerciseId)` called
- Correct command on last step → `progressStore.markLessonCompleted` called
- Near-miss command matching a hintPattern → hint area contains correct hint text (TERM-03)
- Wrong command (no hint match) → `terminal.appendOutput` called with `feedbackOnWrong` text
- Re-visit (priorCompletion non-null) → `terminal.disable()` called
- Re-visit → completion banner contains "previously completed" or "well done"

---

### `tests/router.test.js` (test — modify)

**Analog:** `tests/router.test.js` — self (add one `it` block)

**Existing test style** (router.test.js lines 23–28):
```javascript
it('matches lesson route and extracts moduleId and lessonId', () => {
  expect(matchRoute('#/lesson/logging-auditing/intro')).toEqual({
    view: 'lesson',
    params: { moduleId: 'logging-auditing', lessonId: 'intro' }
  })
})
```

**New test to add** (same style):
```javascript
it('matches exercise route and extracts moduleId and exerciseId', () => {
  expect(matchRoute('#/exercise/logging-auditing/01')).toEqual({
    view: 'exercise',
    params: { moduleId: 'logging-auditing', exerciseId: '01' }
  })
})
```

---

### `tests/quiz-engine.test.js` — `computeModuleProgress` exercise branch (test — modify)

**Analog:** `tests/quiz-engine.test.js` — self (add tests to existing `computeModuleProgress` describe block, lines 279–329)

**Existing test style** (quiz-engine.test.js lines 280–293):
```javascript
describe('computeModuleProgress', () => {
  it('returns {pct:0, complete:false} when all lessons are unvisited and no quiz score exists', async () => {
    const mod = {
      id: 'logging-auditing',
      lessons: [
        { id: 'intro' },
        { id: 'audit-policies', quizId: '01' },
      ],
    }
    const result = computeModuleProgress(mod)
    expect(result.pct).toBe(0)
    expect(result.complete).toBe(false)
  })
```

**New tests to add** inside the same `describe('computeModuleProgress')` block:
```javascript
it('exercise-backed lesson with non-null completion counts as complete', async () => {
  progressStoreMock.getExerciseCompletion.mockReturnValue({ completed: true, completedAt: '2026-05-15T10:00:00Z' })
  const mod = {
    id: 'logging-auditing',
    lessons: [
      { id: 'ps-logging', exerciseId: '01' },
    ],
  }
  const result = computeModuleProgress(mod)
  expect(result.pct).toBe(100)
  expect(result.complete).toBe(true)
})

it('exercise-backed lesson with null completion does not count', async () => {
  progressStoreMock.getExerciseCompletion.mockReturnValue(null)
  const mod = {
    id: 'logging-auditing',
    lessons: [
      { id: 'ps-logging', exerciseId: '01' },
    ],
  }
  const result = computeModuleProgress(mod)
  expect(result.pct).toBe(0)
  expect(result.complete).toBe(false)
})
```

**Note:** The existing MODULES mock in quiz-engine.test.js (lines 33–47) only has `intro` and `audit-policies`. For the new exercise tests, pass the `mod` object directly to `computeModuleProgress` (as existing tests already do) — no need to update the mock.

---

## Shared Patterns

### HTML Escape (esc)
**Source:** `src/utils/escape.js` lines 1–9
**Apply to:** All exercise JSON strings inserted via innerHTML in exercise-view.js: `title`, `description`, `context`, `instruction`, `hint`, `feedbackOnWrong`. Do NOT apply to `successOutput` — rendered via `textContent`.
```javascript
import { esc } from '../utils/escape.js';
// Usage: ${esc(exercise.title)}
```

### Icon Activation
**Source:** `src/utils/icons.js` `activateIcons()` — called after any DOM injection containing `data-lucide` attributes
**Apply to:** exercise-view.js after `app.innerHTML = buildExerciseHtml(...)` and after rendering completion banner
**Pattern** (quiz-engine.js line 57, lesson-view.js line 84):
```javascript
activateIcons();  // always after innerHTML injection that may contain data-lucide attrs
```

### Compliance Badge Rendering
**Source:** `src/badge.js` `renderBadge(tag)` — handles TSA/NIST badge colors
**Apply to:** exercise-view.js exercise header — `exercise.complianceControls.map(tag => renderBadge(tag)).join('')`
**Pattern** (lesson-view.js lines 121–123):
```javascript
const badges = complianceTags.map(tag => renderBadge(tag)).join('');
```

### Dynamic Sidebar Import (circular dep prevention)
**Source:** `src/quiz-engine.js` line 231
**Apply to:** `completeExercise()` in exercise-view.js — never static import sidebar.js
```javascript
import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
```

### BASE_URL Prefix on Fetch
**Source:** `src/quiz-engine.js` line 30
**Apply to:** exercise-view.js fetch call
```javascript
const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/exercises/' + exerciseId + '.json';
```

### Inline Style Layout (no new CSS classes)
**Source:** All existing views (lesson-view.js, module-view.js, quiz-engine.js)
**Apply to:** All DOM construction in exercise-view.js and terminal-engine.js
```javascript
// All layout via style="..." attributes — this is a project-wide convention
element.style.cssText = 'display:flex;align-items:center;gap:var(--spacing-sm);';
```

### Design Tokens Reference
**Source:** `src/style.css` (established in prior phases)
- `var(--color-bg-secondary)` — terminal body background track
- `var(--color-text-primary)` — default text color
- `var(--color-text-muted)` — muted/dimmed text (feedbackOnWrong, wrong answer text)
- `var(--color-border)` — default border color
- `var(--color-accent)` — accent/link color
- `var(--color-destructive)` — simulator label warning text
- `var(--lesson-reading-width, 720px)` — column max-width
- `#22c55e` — green (PS prompt color, correct answer border, check icons) — hardcoded per existing quiz-engine.js pattern

---

## No Analog Found

All files have analogs within the codebase. `src/terminal-engine.js` is the only fully greenfield module — no terminal factory pattern exists yet. The RESEARCH.md Pattern 1 (lines 159–270) serves as its authoritative specification in lieu of a codebase analog.

---

## Metadata

**Analog search scope:** `src/`, `src/views/`, `src/utils/`, `tests/`, `public/data/modules/`
**Files read:** 14 source files (router.js, quiz-engine.js, lesson-view.js, module-view.js, modules-config.js, progress-store.js, sidebar.js, escape.js, vitest.config.js, 01.json, quiz-engine.test.js, router.test.js, 05-CONTEXT.md, 05-RESEARCH.md)
**Pattern extraction date:** 2026-05-15
