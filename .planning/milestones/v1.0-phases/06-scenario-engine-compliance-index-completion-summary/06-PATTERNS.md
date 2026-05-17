# Phase 6: Scenario Engine + Compliance Index + Completion Summary — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 13 new/modified files
**Analogs found:** 11 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/views/scenario-view.js` | view | request-response (fetch + DOM write) | `src/views/exercise-view.js` | exact |
| `src/views/compliance-index-view.js` | view | request-response (fetch + render) | `src/views/exercise-view.js` | role-match |
| `src/views/completion-summary-view.js` | view | CRUD (progressStore read + print) | `src/quiz-engine.js` (result display section) | role-match |
| `src/scenario-engine.js` | utility/validator | transform | `src/quiz-engine.js` (computeModuleProgress) | role-match |
| `src/router.js` | config | request-response | `src/router.js` (self — extend existing) | exact |
| `src/modules-config.js` | config | — | `src/modules-config.js` (self — extend existing) | exact |
| `src/views/module-view.js` | view | CRUD | `src/views/module-view.js` (self — extend existing) | exact |
| `src/progress-store.js` | service | CRUD | `src/progress-store.js` (self — no change needed) | exact |
| `public/data/modules/logging-auditing/scenarios/01.json` | data | — | existing placeholder `scenarios/01.json` | exact |
| `public/data/compliance-index.json` | data | — | `public/data/compliance-refs.json` (JSON manifest shape) | partial |
| `src/style.css` | config | — | `src/style.css` (self — append `@media print` block) | exact |
| `tests/scenario-view.test.js` | test | — | `tests/exercise-view.test.js` | exact |
| `tests/compliance-index-view.test.js` | test | — | `tests/exercise-view.test.js` | role-match |
| `tests/completion-summary-view.test.js` | test | — | `tests/quiz-engine.test.js` | role-match |

---

## Pattern Assignments

### `src/views/scenario-view.js` (view, request-response)

**Analog:** `src/views/exercise-view.js`

**Imports pattern** (exercise-view.js lines 6–12):
```javascript
import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { progressStore } from '../progress-store.js';
import { renderBadge } from '../badge.js';
// NOTE: sidebar.js is always imported dynamically (never static) — prevents circular dep.
```

For scenario-view.js, drop `createTerminal` and `MODULES` imports; they are not needed. Keep all four above.

**safePath guard** (exercise-view.js lines 19–22):
```javascript
function safePath(segment) {
  if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('Invalid path segment: ' + segment);
  return segment;
}
```

Copy verbatim into scenario-view.js. Apply to both `moduleId` and `scenarioId` params.

**Core async renderer pattern** (exercise-view.js lines 34–61):
```javascript
export async function renderExercise({ moduleId, exerciseId }) {
  const app = document.getElementById('app');
  if (!app) return null;

  app.innerHTML = renderExerciseLoading();       // sync skeleton write

  let url;
  try {
    url = import.meta.env.BASE_URL + 'data/modules/' + safePath(moduleId)
      + '/exercises/' + safePath(exerciseId) + '.json';
  } catch {
    app.innerHTML = renderExerciseError(moduleId);
    return null;
  }
  let exercise;
  try {
    const res = await fetch(url);
    if (!res.ok) { app.innerHTML = renderExerciseError(moduleId); return null; }
    exercise = await res.json();
  } catch {
    app.innerHTML = renderExerciseError(moduleId);
    return null;
  }

  const priorCompletion = progressStore.getExerciseCompletion(moduleId, exerciseId);
  app.innerHTML = buildExerciseHtml(exercise, moduleId, priorCompletion);
  activateIcons();

  if (priorCompletion) return null;  // re-visit: locked, no event wiring
  // ... wire interactive handlers ...
  return null;
}
```

For `renderScenario`, substitute:
- `exerciseId` → `scenarioId`
- `getExerciseCompletion` → `getScenarioCompletion`
- fetch path: `.../scenarios/${safePath(scenarioId)}.json`
- Add `validateScenario(data)` check before using the fetched JSON (see scenario-specific pattern below)
- Replace terminal mount logic with `runScenarioFlow(app, scenario, moduleId, scenarioId)`

**Storage warning pattern** (exercise-view.js lines 75–82):
```javascript
if (!progressStore.isStorageAvailable()) {
  const warningDiv = document.createElement('div');
  warningDiv.setAttribute('role', 'alert');
  warningDiv.innerHTML = '<p style="...color: var(--color-text-muted)...">Progress cannot be saved...</p>';
  const lessonColumn = app.querySelector('.lesson-column');
  if (lessonColumn) lessonColumn.prepend(warningDiv);
}
```

**Completion banner pattern** (exercise-view.js lines 208–214):
```javascript
function completeExercise() {
  progressStore.saveExercise(moduleId, exerciseId);
  progressStore.markLessonCompleted(moduleId, lessonId);
  import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
  if (terminal) terminal.disable();
  renderCompletionBanner(app, exercise);
}
```

For `completeScenario`:
- Call `progressStore.saveScenario(moduleId, scenarioId)` (no `markLessonCompleted` needed — scenarioId branch in computeModuleProgress handles it)
- `import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — copy exactly
- Inject C-05 completion banner (see UI-SPEC.md) instead of exercise banner

**Completion banner DOM write** (exercise-view.js lines 223–252):
```javascript
function renderCompletionBanner(appEl, exercise) {
  const lessonColumn = appEl.querySelector('.lesson-column');
  if (!lessonColumn) return;
  const controls = Array.isArray(exercise.complianceControls) ? exercise.complianceControls : [];
  const badges = controls.map(tag => renderBadge(tag)).join('');
  const banner = document.createElement('div');
  banner.setAttribute('data-completion-banner', '');
  banner.style.cssText = [
    'background: var(--color-bg-secondary);',
    'border: 1px solid #22c55e;',
    'border-radius: 6px;',
    'padding: var(--spacing-lg);',
    'margin-top: var(--spacing-lg);',
    'text-align: center;',
  ].join('');
  banner.innerHTML = `...check-circle icon + "complete — well done." + badges + nav hint...`;
  lessonColumn.appendChild(banner);
  activateIcons();
}
```

Copy this exact structure for the scenario completion banner. Change text to "Scenario complete — well done." (C-05 in UI-SPEC.md).

**Loading skeleton pattern** (exercise-view.js lines 344–354):
```javascript
function renderExerciseLoading() {
  return `<div class="lesson-wrapper" aria-busy="true">
    <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">
      <div class="lesson-skeleton-line" style="width:90%;...animation:lesson-pulse 1.5s ease-in-out infinite;"></div>
      <div class="lesson-skeleton-line" style="width:75%;..."></div>
      <div class="lesson-skeleton-line" style="width:55%;..."></div>
    </div>
    <div aria-live="polite" class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;">Loading exercise...</div>
  </div>`;
}
```

For scenario loading: change widths to 80%, 65%, 45% and aria-live text to "Loading scenario..." (C-08 in UI-SPEC.md).

**Error state pattern** (exercise-view.js lines 360–379):
```javascript
function renderExerciseError(moduleId) {
  return `<section style="padding:var(--spacing-xl);">
    <div class="lesson-error" role="alert"
         style="background:var(--color-bg-secondary);border:1px solid var(--color-destructive);border-radius:6px;padding:var(--spacing-lg);max-width:var(--lesson-reading-width,720px);margin:0 auto;">
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);margin-bottom:var(--spacing-sm);">
        <i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--color-destructive);flex-shrink:0;"></i>
        <p style="font-size:var(--text-body);font-weight:600;color:var(--color-text-primary);margin:0;">
          Exercise content could not be loaded
        </p>
      </div>
      <p style="font-size:var(--text-body);color:var(--color-text-muted);margin-bottom:var(--spacing-sm);">
        This exercise may still be in development.
      </p>
      <a href="#/module/${esc(moduleId)}" style="font-size:var(--text-body);font-weight:600;color:var(--color-accent);text-underline-offset:3px;">
        Return to module
      </a>
    </div>
  </section>`;
}
```

For scenario error: change "Exercise content could not be loaded" → "Scenario content could not be loaded" and detail text → "This scenario may still be in development." (C-07 in UI-SPEC.md). Keep `esc(moduleId)` in the href.

**Scenario-specific: JSON validator** (no existing analog — derived from RESEARCH.md Pattern 4):
```javascript
function validateScenario(scenario) {
  const phaseIds = new Set((scenario.phases ?? []).map(p => p.id));
  for (const phase of scenario.phases ?? []) {
    for (const option of phase.options ?? []) {
      if (option.nextPhaseId && !phaseIds.has(option.nextPhaseId)) {
        return false;
      }
    }
  }
  return true;
}
```

Call this immediately after `await res.json()`. If it returns `false`, call `renderScenarioError(moduleId)` and return null.

**HTML wrapper pattern** (exercise-view.js lines 307–309):
```javascript
return `
  <div class="lesson-wrapper">
    <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">
      ...
    </div>
  </div>
`;
```

Reuse `.lesson-wrapper` and `.lesson-column` CSS classes. Same max-width and padding.

---

### `src/views/compliance-index-view.js` (view, request-response)

**Analog:** `src/views/exercise-view.js` (fetch + DOM write pattern)

**Imports pattern:**
```javascript
import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { renderBadge } from '../badge.js';
// No progressStore needed — compliance index is read-only
// No sidebar dynamic import needed — no completion to save
```

**safePath** — copy verbatim from exercise-view.js lines 19–22. Apply to `moduleId` and `contentId` before building hash href strings.

**Core async renderer pattern** — same three-phase structure as exercise-view.js:
1. `app.innerHTML = renderComplianceIndexLoading()` — sync skeleton
2. `fetch(import.meta.env.BASE_URL + 'data/compliance-index.json')` — note: no `safePath` needed, path is a hardcoded string
3. On fail: `app.innerHTML = renderComplianceIndexEmpty()` (C-12)
4. On success: `app.innerHTML = buildComplianceIndexHtml(data)` then `activateIcons()`

**Fetch pattern** (exercise-view.js lines 43–60 — adapt for non-parameterized URL):
```javascript
let data;
try {
  const url = import.meta.env.BASE_URL + 'data/compliance-index.json';
  const res = await fetch(url);
  if (!res.ok) { app.innerHTML = renderComplianceIndexEmpty(); return null; }
  data = await res.json();
} catch {
  app.innerHTML = renderComplianceIndexEmpty();
  return null;
}
```

**esc() on all JSON fields before innerHTML** — apply to `control.label` and `item.title` everywhere. Apply `safePath()` to `item.moduleId` and `item.contentId` before building `href` attribute strings.

**Hash link construction pattern** (module-view.js lines 49–54):
```javascript
// exercise-view analog uses same BASE_URL + esc pattern:
<a href="#/lesson/${esc(mod.id)}/${esc(lesson.id)}"...>
// For compliance index — use safePath not esc for href path segments:
<a href="#/lesson/${safePath(item.moduleId)}/${safePath(item.contentId)}"...>
<a href="#/exercise/${safePath(item.moduleId)}/${safePath(item.contentId)}"...>
<a href="#/scenario/${safePath(item.moduleId)}/${safePath(item.contentId)}"...>
```

**renderBadge usage** (exercise-view.js lines 227–228, module-view.js lines 80–82):
```javascript
// exercise-view.js — badge rendering for complianceControls array:
const controls = Array.isArray(exercise.complianceControls) ? exercise.complianceControls : [];
const badges = controls.map(tag => renderBadge(tag)).join('');
```

In compliance-index-view.js: call `renderBadge(control.id)` per control section heading.

**Loading skeleton** — same `.lesson-skeleton-line` pattern as exercise-view.js lines 344–354. Change widths to 70%, 90%, 55%. Set `aria-live` text to "Loading compliance index..."

---

### `src/views/completion-summary-view.js` (view, CRUD)

**Analog:** `src/quiz-engine.js` (result display) + `src/views/exercise-view.js` (DOM write pattern)

**Imports pattern:**
```javascript
import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { progressStore } from '../progress-store.js';
import { renderBadge } from '../badge.js';
import { MODULES } from '../modules-config.js';
// No sidebar import — no completion to save; no fetch — data comes from progressStore only
```

**Core renderer pattern** (exercise-view.js lines 36–37 — sync not async):
```javascript
export function renderCompletionSummary() {   // synchronous — no fetch needed
  const app = document.getElementById('app');
  if (!app) return null;
  // ...
  app.innerHTML = buildSummaryHtml();
  activateIcons();
  // Wire name input and print button
  app.querySelector('#learner-name-input')?.addEventListener('input', (e) => {
    learnerName = esc(e.target.value);
  });
  app.querySelector('#print-summary-btn')?.addEventListener('click', () => window.print());
  return null;
}
```

Note: returns `null` so the router does NOT overwrite `app.innerHTML` (same contract as exercise-view.js).

**progressStore read calls** (progress-store.js lines 240–265 — all read-only):
```javascript
// Available reads for the summary:
progressStore.getQuizScore(moduleId, quizId)
  // Returns { score, total, attemptedAt } or null
progressStore.getExerciseCompletion(moduleId, exerciseId)
  // Returns { completed, completedAt } or null
progressStore.getScenarioCompletion(moduleId, scenarioId)
  // Returns { completed, completedAt } or null
progressStore.getLessonProgress(moduleId, lessonId)
  // Returns { visited, completed }
```

Iterate `MODULES` (from modules-config.js) to build the progress table. For each module, call `computeModuleProgress(mod)` from quiz-engine.js to get `{ numerator, denominator, pct }`.

**Storage warning pattern** (exercise-view.js lines 75–82):
```javascript
if (!progressStore.isStorageAvailable()) {
  // Prepend warning to .lesson-column
  // Copy: "No saved progress found — storage is unavailable. Progress data cannot be displayed."
}
```

**Quiz completion banner style** (quiz-engine.js lines 249–258 — for score display reference):
```javascript
const completionP = document.createElement('p');
completionP.style.color = score === totalQuestions ? '#22c55e' : 'var(--color-text-muted)';
completionP.textContent = `Quiz complete — ${score}/${totalQuestions} correct`;
```

Use this score format ("N/M") in the progress table Quiz Score column.

**Print button wiring:**
```javascript
app.querySelector('#print-summary-btn')?.addEventListener('click', () => window.print());
// No state change around window.print() — button stays enabled before and after (RESEARCH.md Pitfall 2)
```

**HTML wrapper** — reuse `.lesson-wrapper` and `.lesson-column` classes (same as exercise-view.js line 308). Add `print-hide` class to print button element and name input section for `@media print` suppression.

**esc() on learner name** — apply before any innerHTML injection. Preferred: use `textContent` assignment for the name display element to avoid needing `esc()` there entirely.

---

### `src/scenario-engine.js` — `computeModuleProgress` scenarioId branch (utility/transform)

**Analog:** `src/quiz-engine.js` — `computeModuleProgress` function (lines 274–301)

**Existing branch pattern** (quiz-engine.js lines 278–293):
```javascript
export function computeModuleProgress(mod) {
  let numerator = 0;
  let denominator = 0;

  for (const lesson of mod.lessons) {
    denominator++;
    if (lesson.quizId) {
      const quizScore = progressStore.getQuizScore(mod.id, lesson.quizId);
      if (quizScore !== null) numerator++;
    } else if (lesson.exerciseId) {
      const ex = progressStore.getExerciseCompletion(mod.id, lesson.exerciseId);
      if (ex !== null) numerator++;
    } else {
      const progress = progressStore.getLessonProgress(mod.id, lesson.id);
      if (progress && progress.visited) numerator++;
    }
  }
  ...
}
```

**New scenarioId branch to splice in** (after `exerciseId` branch, before the final `else`):
```javascript
} else if (lesson.scenarioId) {
  const sc = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId);
  if (sc !== null) numerator++;
}
```

Note: this is a modification to `quiz-engine.js`, not a new file. `src/scenario-engine.js` listed in CLAUDE.md is a separate file — it may be a future expansion hook or the scenario validation logic. Per RESEARCH.md, the computeModuleProgress branch lives in quiz-engine.js. If `src/scenario-engine.js` is created as a separate module, it should export `validateScenario()` from the pattern above, importable by scenario-view.js.

---

### `src/router.js` (modify — add 3 new routes)

**Analog:** `src/router.js` itself — extend existing pattern

**Existing routes array** (router.js lines 11–16):
```javascript
const routes = [
  { pattern: '#/',                              view: 'home' },
  { pattern: '#/module/:moduleId',              view: 'module' },
  { pattern: '#/lesson/:moduleId/:lessonId',    view: 'lesson' },
  { pattern: '#/exercise/:moduleId/:exerciseId', view: 'exercise' },
];
```

**Add 3 entries:**
```javascript
{ pattern: '#/scenario/:moduleId/:scenarioId', view: 'scenario' },
{ pattern: '#/compliance-index',               view: 'compliance-index' },
{ pattern: '#/completion-summary',             view: 'completion-summary' },
```

**Existing viewRenderers object** (router.js lines 42–48):
```javascript
const viewRenderers = {
  home:        (params) => renderHome(params),
  module:      (params) => renderModule(params),
  lesson:      (params) => renderLesson(params),
  exercise:    (params) => renderExercise(params),
  'not-found': (params) => renderNotFound(params),
};
```

**Add 3 entries:**
```javascript
'scenario':           (params) => renderScenario(params),
'compliance-index':   (params) => renderComplianceIndex(params),
'completion-summary': (params) => renderCompletionSummary(params),
```

**Add 3 static imports** at top of router.js (after existing imports, lines 1–9):
```javascript
import { renderScenario }          from './views/scenario-view.js';
import { renderComplianceIndex }   from './views/compliance-index-view.js';
import { renderCompletionSummary } from './views/completion-summary-view.js';
```

**handleRoute null-contract** (router.js lines 72–77) — all three new views must return `null` to signal they own the DOM:
```javascript
const viewHtml = await renderer(params);
if (viewHtml !== null) {
  app.innerHTML = viewHtml;
}
```

`renderScenario`, `renderComplianceIndex`, and `renderCompletionSummary` must all return `null` (matching exercise-view.js convention).

---

### `src/modules-config.js` (modify — add scenarioId field)

**Analog:** `src/modules-config.js` itself — extend existing lesson object shape

**Existing lesson object shape** (modules-config.js lines 16–19):
```javascript
lessons: [
  { id: 'intro',          title: 'Introduction to Windows Event Logs' },
  { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
  { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
],
```

**Add `scenarioId` to the `intro` lesson** (no quizId, no exerciseId — safest host):
```javascript
{ id: 'intro', title: 'Introduction to Windows Event Logs', scenarioId: '01' },
```

**Contract:** A lesson may have at most one of `quizId`, `exerciseId`, `scenarioId`. The `else if` chain in `computeModuleProgress` enforces this — first match wins.

---

### `src/views/module-view.js` (modify — add scenario link buttons)

**Analog:** `src/views/module-view.js` itself — extend existing `lessonRows` map

**Existing exercise link button** (module-view.js lines 53–60):
```javascript
${lesson.exerciseId ? `
  <a href="#/exercise/${esc(mod.id)}/${esc(lesson.exerciseId)}"
     style="display:inline-flex;align-items:center;gap:var(--spacing-xs);font-size:var(--text-body);font-weight:600;text-decoration:none;padding:var(--spacing-xs) 0;color:${exerciseDone ? '#22c55e' : 'var(--color-accent)'};">
    <i data-lucide="${exerciseDone ? 'check-circle' : 'terminal'}"
       style="width:14px;height:14px;color:${exerciseDone ? '#22c55e' : 'var(--color-accent)'};flex-shrink:0;"></i>
    ${exerciseDone ? 'Exercise complete — revisit →' : 'Start Exercise →'}
  </a>
` : ''}
```

**Add scenario link button** — same structure, after the exercise block:
```javascript
${lesson.scenarioId ? (() => {
  const scenarioDone = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId) !== null;
  return `
    <a href="#/scenario/${esc(mod.id)}/${esc(lesson.scenarioId)}"
       style="display:inline-flex;align-items:center;gap:var(--spacing-xs);font-size:var(--text-body);font-weight:600;text-decoration:none;padding:var(--spacing-xs) 0;color:${scenarioDone ? '#22c55e' : 'var(--color-accent)'};">
      <i data-lucide="${scenarioDone ? 'check-circle' : 'git-branch'}"
         style="width:14px;height:14px;color:${scenarioDone ? '#22c55e' : 'var(--color-accent)'};flex-shrink:0;"></i>
      ${scenarioDone ? 'Scenario complete — revisit →' : 'Start Scenario →'}
    </a>
  `;
})() : ''}
```

Note: the IIFE pattern is used to scope `scenarioDone` without extracting a helper — consistent with the `exerciseDone` variable already declared in the map closure.

---

### `src/progress-store.js` (no change)

**Analog:** `src/progress-store.js` itself — no modification needed

`saveScenario` (lines 215–221) and `getScenarioCompletion` (lines 262–265) are already implemented and tested. No new API surface needed for Phase 6.

**Relevant existing API** (progress-store.js lines 215–265):
```javascript
function saveScenario(moduleId, scenarioId) {
  _store.scenarios[moduleId + '/' + scenarioId] = {
    completed: true,
    completedAt: new Date().toISOString(),
  };
  _persist();
}

function getScenarioCompletion(moduleId, scenarioId) {
  if (!_store) return null;
  return _store.scenarios[moduleId + '/' + scenarioId] ?? null;
}
```

Returns `{ completed: boolean, completedAt: string }` or `null`. The `completedAt` field drives the "Scenario previously completed — YYYY-MM-DD" display in re-visit mode (slice to 10 chars: `priorCompletion.completedAt.slice(0, 10)`).

---

### `public/data/modules/logging-auditing/scenarios/01.json` (upgrade from placeholder)

**Analog:** existing placeholder `scenarios/01.json`

**Existing placeholder shape** (full file as read):
```json
{
  "id": "logging-auditing-scenario-01",
  "moduleId": "logging-auditing",
  "title": "Investigating a Suspicious Login on PIPELINE-DC01",
  "status": "placeholder",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-2"],
  "narrative": "Your SIEM alerts you to 47 failed logon attempts...",
  "phases": [
    {
      "id": "phase-1",
      "title": "Initial Triage",
      "type": "decision",
      "prompt": "What is your first action?",
      "options": [
        { "id": "opt-a", "text": "...", "outcome": "...", "correct": false },
        { "id": "opt-b", "text": "...", "outcome": "...", "correct": true }
      ]
    }
  ]
}
```

**Required upgrades:**
1. Remove `"status": "placeholder"`
2. Add `"nextPhaseId"` field to each option pointing to the next phase id (or omit if `isFinal: true` on that phase)
3. Add a second phase with `"isFinal": true`
4. Ensure all option objects have both `"correct"` and `"nextPhaseId"` fields
5. Add OT callout content in narrative per CLAUDE.md content rules

**Full schema shape to target** (from RESEARCH.md Pattern 1):
```json
{
  "id": "logging-auditing-scenario-01",
  "moduleId": "logging-auditing",
  "title": "Investigating a Suspicious Login on PIPELINE-DC01",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-2"],
  "narrative": "...",
  "phases": [
    {
      "id": "phase-1",
      "title": "Initial Triage",
      "type": "decision",
      "prompt": "...",
      "options": [
        { "id": "opt-a", "text": "...", "outcome": "...", "correct": false, "nextPhaseId": "phase-2" },
        { "id": "opt-b", "text": "...", "outcome": "...", "correct": true,  "nextPhaseId": "phase-2" }
      ]
    },
    {
      "id": "phase-2",
      "title": "Containment",
      "type": "decision",
      "prompt": "...",
      "isFinal": true,
      "options": [
        { "id": "opt-a", "text": "...", "outcome": "...", "correct": false, "nextPhaseId": null },
        { "id": "opt-b", "text": "...", "outcome": "...", "correct": true,  "nextPhaseId": null }
      ]
    }
  ]
}
```

---

### `public/data/compliance-index.json` (new manifest)

**Analog:** `public/data/compliance-refs.json` (JSON manifest with schemaVersion)

**compliance-refs.json shape reference** — uses top-level `schemaVersion` key (pattern confirmed by badge.js and content-loader.js reads).

**Target shape** (from RESEARCH.md Pattern 3):
```json
{
  "schemaVersion": 1,
  "controls": [
    {
      "id": "TSA-Monitoring",
      "label": "TSA SD-02F — Continuous Monitoring",
      "items": [
        { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "intro",      "title": "Introduction to Windows Event Logs" },
        { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "ps-logging", "title": "Enabling PowerShell Script Block Logging" },
        { "type": "exercise", "moduleId": "logging-auditing", "contentId": "01",         "title": "Enable Script Block Logging" },
        { "type": "scenario", "moduleId": "logging-auditing", "contentId": "01",         "title": "Investigating a Suspicious Login" }
      ]
    }
  ]
}
```

All `label` strings are human-readable but must NOT hardcode "SD-02F" in a way that can drift — reference RESEARCH.md Pitfall 3 and add a comment in the file documenting the update contract.

---

### `src/style.css` (modify — append `@media print` block)

**Analog:** `src/style.css` itself — append after Phase 5 terminal cursor block

**Existing CSS structure** (style.css lines 1–50 — Phase 2 block pattern):
```css
/* Phase 2: Typography additions */
--text-prose-body: 1rem; ...

/* Phase 2: Code block colors */
--color-code-bg: #0d1117; ...
```

Each phase adds a clearly labeled comment block. Append after the last existing phase block:

**New block to append** (from UI-SPEC.md New CSS Additions section):
```css
/* Phase 6: Print layout for completion summary */
@media print {
  #sidebar,
  #nav,
  .print-hide {
    display: none !important;
  }
  .lesson-wrapper {
    max-width: 100% !important;
    padding: 32px !important;
  }
  .lesson-column {
    max-width: 100% !important;
  }
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
  a {
    color: #000000 !important;
    text-decoration: underline !important;
  }
}
```

No new `@theme` tokens needed — all Phase 6 design tokens are already declared in the existing `@theme` block.

---

### `tests/scenario-view.test.js` (new)

**Analog:** `tests/exercise-view.test.js` — copy structure exactly

**Mock pattern** (exercise-view.test.js lines 11–48):
```javascript
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    saveScenario: vi.fn(),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    // No saveExercise, getExerciseCompletion — not needed for scenario
  },
}))

vi.mock('../src/utils/icons.js', () => ({ activateIcons: vi.fn() }))
vi.mock('../src/badge.js', () => ({ renderBadge: vi.fn().mockReturnValue('') }))
vi.mock('../src/sidebar.js', () => ({ refreshSidebarProgress: vi.fn() }))
// No terminal-engine.js mock needed
```

**Test fixture shape** — scenario JSON fixture must match the full 2-phase schema (see scenarios/01.json upgrade above).

**beforeEach pattern** (exercise-view.test.js lines 110–129):
```javascript
beforeEach(async () => {
  document.body.innerHTML = '<div id="app"></div>'
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(SCENARIO_JSON),
  }))
  progressStoreMock.getScenarioCompletion.mockReturnValue(null)  // first-visit default
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
```

**Test cases to cover** (from RESEARCH.md Validation Architecture):
- Failed fetch → "Scenario content could not be loaded" in DOM
- Valid JSON → title and narrative appear in `#app`
- Phase-1 prompt appears on initial render
- Click option → option buttons locked (pointer-events), outcome text visible in DOM
- Reaching `isFinal` phase → `progressStore.saveScenario` called with correct args
- Reaching `isFinal` phase → `refreshSidebarProgress` called with moduleId
- Re-visit mode (getScenarioCompletion non-null) → "previously completed" in DOM, no interactive handlers

---

### `tests/compliance-index-view.test.js` (new)

**Analog:** `tests/exercise-view.test.js` — same structure; simpler fixture

**Mock pattern** (no progressStore needed — compliance index is read-only):
```javascript
vi.mock('../src/utils/icons.js', () => ({ activateIcons: vi.fn() }))
vi.mock('../src/badge.js', () => ({ renderBadge: vi.fn().mockReturnValue('<span>TSA</span>') }))
```

**Fetch fixture:**
```javascript
const COMPLIANCE_INDEX_JSON = {
  schemaVersion: 1,
  controls: [
    {
      id: 'TSA-Monitoring',
      label: 'TSA SD-02F — Continuous Monitoring',
      items: [
        { type: 'lesson', moduleId: 'logging-auditing', contentId: 'intro', title: 'Introduction to Windows Event Logs' },
      ],
    },
  ],
}
```

**Test cases:**
- Successful fetch → "Compliance Control Coverage" title in DOM
- Successful fetch → link with `href="#/lesson/logging-auditing/intro"` present in DOM
- Failed fetch → "Compliance index unavailable" in DOM
- `renderBadge('TSA-Monitoring')` called for each control

---

### `tests/completion-summary-view.test.js` (new)

**Analog:** `tests/quiz-engine.test.js` — mock structure for progressStore

**Mock pattern** (quiz-engine.test.js lines 9–27):
```javascript
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    isStorageAvailable: vi.fn().mockReturnValue(true),
    getQuizScore: vi.fn().mockReturnValue(null),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
  },
}))
vi.mock('../src/utils/icons.js', () => ({ activateIcons: vi.fn() }))
vi.mock('../src/badge.js', () => ({ renderBadge: vi.fn().mockReturnValue('') }))
vi.mock('../src/modules-config.js', () => ({
  MODULES: [{ id: 'logging-auditing', title: 'Logging & Auditing',
    lessons: [{ id: 'intro' }, { id: 'ps-logging', exerciseId: '01' }] }],
}))
```

**Test cases:**
- Summary renders "Completion Summary" title in DOM (ASSESS-04)
- Summary HTML contains "training log artifact" (ASSESS-04 statutory disclaimer)
- Print button `#print-summary-btn` exists in DOM
- Print button click calls `window.print()` — stub `vi.stubGlobal('window', { print: vi.fn() })` or `vi.spyOn(window, 'print')`
- Storage unavailable → warning message in DOM

**window.print() spy pattern:**
```javascript
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'
  vi.spyOn(window, 'print').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

it('print button calls window.print()', () => {
  renderCompletionSummary()
  document.getElementById('print-summary-btn').click()
  expect(window.print).toHaveBeenCalledOnce()
})
```

---

## Shared Patterns

### Dynamic Sidebar Import (anti-circular-dep)

**Source:** `src/views/exercise-view.js` lines 211, `src/quiz-engine.js` lines 246
**Apply to:** `scenario-view.js` `completeScenario()` function only

```javascript
import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
```

Never use a static `import` of `sidebar.js` in any new view file.

### XSS Prevention via `esc()`

**Source:** `src/utils/escape.js` (imported in exercise-view.js line 6, quiz-engine.js line 6)
**Apply to:** All new view files — every JSON-derived string before `innerHTML` insertion

Pattern (quiz-engine.js lines 92, 100, 108):
```javascript
${esc(q.stem)}
${esc(a.text)}
${esc(a.feedback)}
```

In scenario-view.js: apply to `scenario.title`, `scenario.narrative`, `phase.title`, `phase.prompt`, `option.text`, `option.outcome`.
In compliance-index-view.js: apply to `control.label`, `item.title`.
In completion-summary-view.js: apply to learner name if used in innerHTML; prefer `textContent` for name display.

### safePath() — Path Traversal Guard

**Source:** `src/views/exercise-view.js` lines 19–22 (identical copy in quiz-engine.js lines 16–18)
**Apply to:** `scenario-view.js` (on `moduleId` and `scenarioId`), `compliance-index-view.js` (on `moduleId` and `contentId` when building hash hrefs)

```javascript
function safePath(segment) {
  if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error('Invalid path segment: ' + segment);
  return segment;
}
```

### `import.meta.env.BASE_URL` Fetch Prefix

**Source:** `src/views/exercise-view.js` line 45, `src/quiz-engine.js` line 42
**Apply to:** All fetch calls in new view files

```javascript
const url = import.meta.env.BASE_URL + 'data/modules/' + safePath(moduleId) + '/...';
```

### `.lesson-wrapper` / `.lesson-column` Layout Classes

**Source:** `src/views/exercise-view.js` lines 307–309, `src/style.css`
**Apply to:** All three new view wrappers (scenario-view, compliance-index-view, completion-summary-view)

```javascript
`<div class="lesson-wrapper">
  <div class="lesson-column" style="max-width:var(--lesson-reading-width,720px);margin:0 auto;padding:var(--spacing-xl);">
    ...
  </div>
</div>`
```

### `activateIcons()` After All innerHTML Writes

**Source:** `src/views/exercise-view.js` line 85, line 251
**Apply to:** Every new view after the final `app.innerHTML = ...` assignment, and after any `appendChild` that contains `data-lucide` attributes

### `progressStore` — No Direct localStorage

**Source:** `src/progress-store.js` lines 1–5 (module contract)
**Apply to:** All new view files — never call `localStorage` directly

### `print-hide` CSS Class

**Source:** `src/style.css` new `@media print` block (Phase 6)
**Apply to:** `completion-summary-view.js` — add `class="print-hide"` to print button (`#print-summary-btn`) and the learner name input section

### Vitest Mock Ordering

**Source:** `tests/exercise-view.test.js` lines 11–54
**Apply to:** All new test files — `vi.mock()` calls MUST appear before any `import` statements due to Vitest hoisting

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/scenario-engine.js` (as standalone) | utility | transform | If created as a separate file rather than an extension to quiz-engine.js, it has no direct analog — the `validateScenario()` function has no prior pattern in the codebase. However, its export contract mirrors quiz-engine.js's `computeModuleProgress` export pattern |

---

## Metadata

**Analog search scope:** `src/`, `src/views/`, `tests/`, `public/data/`
**Files read:** exercise-view.js, quiz-engine.js, router.js, progress-store.js, modules-config.js, module-view.js, exercise-view.test.js, quiz-engine.test.js, router.test.js, style.css (lines 1–50), scenarios/01.json
**Pattern extraction date:** 2026-05-15
