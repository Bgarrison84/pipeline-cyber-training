# Phase 5: Simulated PowerShell Terminal + Exercise View — Research

**Researched:** 2026-05-15
**Domain:** Vanilla JS terminal simulation, exercise validation engine, multi-step progression
**Confidence:** HIGH — all findings verified directly against the project codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Custom vanilla JS terminal factory (`src/terminal-engine.js`) ~120 lines. No jQuery Terminal.
- D-02: Prompt format `PS PIPELINE-DC01 >` (green `#22c55e`), pulled from exercise JSON `context` field or defaulted.
- D-03: Simulator label always-visible above terminal: "PS SIMULATOR — commands do not run on any real system" — `var(--color-destructive)` text, muted background, never dismissible.
- D-04: Route `#/exercise/{moduleId}/{exerciseId}` dispatches to `src/views/exercise-view.js`.
- D-05: `modules-config.js` lesson entries gain optional `exerciseId` field (parallel to `quizId`). Exercise links in module-view, not a dedicated exercise list page.
- D-06: Stacked layout — exercise header → step panel → simulator banner → terminal element. Column width = `var(--lesson-reading-width)` 720px (same as lesson-view).
- D-07: Step progression: correct command → print `successOutput`, mark step done (checkmark), advance to next step. Wrong → check `hintPatterns[]` → show hint or `feedbackOnWrong`. No attempt counter.
- D-08: Completion: `progressStore.saveExercise()` called, completion banner appears, terminal input disabled (readonly), sidebar updates. No redirect.
- D-09: RegExp matching: `new RegExp(pattern, caseSensitive ? '' : 'i').test(input.trim())`. First matching pattern wins. Multiple `expectedCommands` per step allowed.
- D-10: `hintPatterns[]` array per step — each entry `{ pattern, hint }`. Hint shown in step panel, not terminal.
- D-11: Single-line pipelines work naturally (whole string passed to RegExp.test).
- D-12: No attempt counter.
- D-13: Extended exercise JSON schema with `hintPatterns` (optional). Remove stale `"status": "placeholder"` field.

### Claude's Discretion
- Exact CSS styling of terminal (monospace, `var(--color-bg-secondary)` track, `var(--color-text-primary)` text).
- Step progress indicator ("Step 2 of 3") — use best judgment; include it.
- `progressStore.markLessonCompleted()` should also be called when exercise completes (parallel to quiz).
- Error handling if exercise JSON fetch fails — show "Exercise unavailable", no uncaught exception.

### Deferred Ideas (OUT OF SCOPE)
- Multi-line PS continuation prompt (`>>` prompt on Enter after `|`)
- Step-level resume (`stepReached` in progressStore)
- PS alias expansion table (gci→Get-ChildItem etc.) — use per-step `hintPatterns` instead
- Color-coded terminal output (green/red per line type)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TERM-01 | Terminal accepts expected commands per exercise and returns helpful error feedback for wrong commands | Regex matching engine in terminal-engine.js; `expectedCommands[]` per step; `feedbackOnWrong` as fallback |
| TERM-02 | Accepted commands produce realistic-looking PowerShell output (not placeholder or lorem text) | `successOutput` field in exercise JSON; existing 01.json needs upgrade; realistic PS 5.1 output format documented below |
| TERM-03 | Plausible near-miss commands receive a contextual hint rather than generic failure | `hintPatterns[]` per step (D-10/D-13); hint shown in step panel (I-06 from UI-SPEC) |
| TERM-04 | Terminal UI displays a persistent label making clear it is a simulator | C-04 Simulator Label Banner (always-visible, non-dismissible, exact copy locked in D-03) |
</phase_requirements>

---

## Summary

Phase 5 is a well-bounded implementation problem. All user decisions are locked from CONTEXT.md and the UI-SPEC provides pixel-level component specifications. The research task is to (1) map the exact code changes needed to integrate with existing infrastructure, (2) document realistic PS 5.1 output formats for TERM-02 compliance, (3) specify the vanilla JS terminal factory architecture, and (4) identify what needs to change in `computeModuleProgress` to include exercises.

The codebase is in excellent condition. The quiz-engine.js from Phase 4 provides a direct template for the exercise-view's fetch, render, and progress-save patterns. The progress-store.js already has `saveExercise()` and `getExerciseCompletion()` fully implemented. The router already has `extractParams()` for parameterized routes. The terminal-engine has no existing code — it is a greenfield ~120-line module. The exercise-view has no existing code — it is a greenfield async view following the lesson-view pattern.

**Primary recommendation:** Build terminal-engine.js as a pure factory function (no class, no library), exercise-view.js as an async view mirroring lesson-view.js, then wire the three integration points (router, modules-config, module-view) and update computeModuleProgress for exercise awareness.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Command regex matching | Frontend (terminal-engine.js) | — | Pure string→RegExp matching; no server needed; all data is static exercise JSON |
| Exercise step progression | Frontend (exercise-view.js) | terminal-engine.js | View owns step state (currentStep index, DOM updates); terminal engine calls commandHandler |
| Progress persistence | Frontend (progress-store.js) | — | localStorage, already implemented; saveExercise() / getExerciseCompletion() exist |
| Route dispatch | Frontend (router.js) | — | Hash routing; add one entry to routes[] array and one entry to viewRenderers{} |
| Exercise data | Static file (public/data/) | — | JSON fetched via BASE_URL + path; no backend |
| Sidebar progress refresh | Frontend (sidebar.js) | — | refreshSidebarProgress() already implemented; called via dynamic import to break circular dep |
| Module progress calculation | Frontend (quiz-engine.js) | — | computeModuleProgress() needs exercise awareness added (see Integration Points) |

---

## Standard Stack

### Core (all already installed — no new packages needed)

[VERIFIED: direct file inspection of package.json and src/ files]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | existing | Build pipeline | Project constraint (CLAUDE.md) |
| Vitest | existing | Unit tests | Already in use for Phases 1–4 |
| happy-dom | existing | DOM environment for Vitest | vitest.config.js: `environment: 'happy-dom'` |
| Lucide icons | existing | UI icons (activateIcons()) | All prior phases use this pattern |

### No New Dependencies

Phase 5 intentionally uses zero new npm packages. D-01 locks out jQuery Terminal (v5.3.0 on npm). The vanilla JS terminal factory is ~120 lines of DOM manipulation. All utilities (`esc()`, `activateIcons()`, `renderBadge()`, `progressStore`) are already in the project.

**Installation:** None required.

---

## Architecture Patterns

### System Architecture Diagram

```
User types command + Enter
        │
        ▼
terminal-engine.js
  createTerminal(container, commandHandler)
  ├── renders: output list + prompt row + input element
  ├── captures: keydown Enter → commandHandler(rawInput)
  ├── history: ↑/↓ keys cycle command history array
  └── exposes: appendOutput(text), disable(), getInput()
        │
        │ calls commandHandler(rawInput)
        ▼
exercise-view.js  ← owns step state (currentStep index)
  handleCommand(rawInput)
  ├── step.expectedCommands[] → RegExp.test(input.trim())
  │     ├── MATCH → terminal.appendOutput(successOutput)
  │     │         → advanceStep()
  │     │           ├── updateStepPanel(nextStep)
  │     │           └── if last step → completeExercise()
  │     └── NO MATCH → step.hintPatterns[] → RegExp.test()
  │               ├── HINT MATCH → showHintInPanel(hint)
  │               └── NO HINT → terminal.appendOutput(feedbackOnWrong)
        │
        ▼
completeExercise()
  ├── progressStore.saveExercise(moduleId, exerciseId)
  ├── progressStore.markLessonCompleted(moduleId, lessonId)
  ├── import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId))
  ├── terminal.disable()
  └── renderCompletionBanner()
        │
        ▼
public/data/modules/{moduleId}/exercises/{exerciseId}.json
  (static JSON — fetched via BASE_URL prefix)
```

### Recommended Project Structure (additions only)

```
src/
  terminal-engine.js           ← NEW: createTerminal() factory (~120 lines)
  views/
    exercise-view.js           ← NEW: renderExercise() async view

public/data/modules/
  logging-auditing/
    exercises/
      01.json                  ← MODIFY: add hintPatterns, remove "status", upgrade successOutput

tests/
  terminal-engine.test.js      ← NEW: unit tests for command matching logic
  exercise-view.test.js        ← NEW: integration tests for step progression, completion
```

### Pattern 1: Terminal Factory Function (createTerminal)

**What:** A pure DOM factory that creates a terminal UI and returns an API object. The caller (exercise-view.js) provides the `commandHandler` callback.

**When to use:** Once per exercise load. Called inside `renderExercise()` after the exercise JSON is fetched.

```javascript
// src/terminal-engine.js
// Source: [VERIFIED: derived from D-01, D-02, UI-SPEC C-05, I-01, I-07, I-08]

export function createTerminal(container, commandHandler) {
  // State
  const history = [];
  let historyIndex = -1;
  let disabled = false;

  // Build DOM
  const termBody = document.createElement('div');
  // termBody styles: background #1a1a1a, font Courier New 13px, min-height 320px,
  //   max-height 480px, overflow-y auto, padding var(--spacing-md), color var(--color-text-primary)

  const outputList = document.createElement('div');
  termBody.appendChild(outputList);

  const promptRow = document.createElement('div');
  // promptRow: display flex, align-items baseline, gap var(--spacing-xs)

  const promptSpan = document.createElement('span');
  // promptSpan: color #22c55e, font Courier New 13px, white-space nowrap, user-select none

  const input = document.createElement('input');
  // input: type text, background transparent, border none, outline none,
  //   color var(--color-text-primary), font Courier New 13px, flex 1,
  //   min-height 44px, caret-color #22c55e,
  //   autocomplete off, autocorrect off, autocapitalize off, spellcheck false

  promptRow.appendChild(promptSpan);
  promptRow.appendChild(input);
  termBody.appendChild(promptRow);
  container.appendChild(termBody);

  // Focus input when clicking terminal body
  termBody.addEventListener('click', () => { if (!disabled) input.focus(); });

  // Terminal border turns green on input focus (I-08)
  const wrapper = container.closest('[data-terminal-wrapper]') || container;
  input.addEventListener('focus', () => { /* set wrapper border to #22c55e */ });
  input.addEventListener('blur', () => { /* reset wrapper border to var(--color-border) */ });

  // Key handler: Enter, ↑, ↓
  input.addEventListener('keydown', (e) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      const raw = input.value;
      const trimmed = raw.trim();
      if (!trimmed) return;
      // Echo command
      appendOutput('PS PIPELINE-DC01 > ' + raw);
      history.unshift(trimmed);
      historyIndex = -1;
      input.value = '';
      commandHandler(trimmed);
      scrollToBottom();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        input.value = '';
      }
    }
  });

  function appendOutput(text, color) {
    const line = document.createElement('div');
    line.style.cssText = 'display:block;white-space:pre-wrap;word-break:break-all;';
    if (color) line.style.color = color;
    line.textContent = text;  // textContent, never innerHTML — successOutput may have angle brackets
    outputList.appendChild(line);
    scrollToBottom();
  }

  function scrollToBottom() {
    termBody.scrollTop = termBody.scrollHeight;
  }

  function disable() {
    disabled = true;
    input.setAttribute('readonly', '');
    input.style.pointerEvents = 'none';
    input.style.opacity = '0.4';
    promptSpan.style.opacity = '0.4';
  }

  function setPrompt(text) {
    promptSpan.textContent = text;
  }

  function focus() {
    input.focus();
  }

  return { appendOutput, disable, setPrompt, focus };
}
```

**Key design choices:**
- `textContent` assignment on output lines — never `innerHTML`. `successOutput` strings from exercise JSON can contain `<` characters (PS error messages show `At line:1 char:1`).
- `history.unshift()` not `push()` so `history[0]` is always the most recent command (simpler `ArrowUp` logic).
- RegExp construction in try/catch (in exercise-view, not terminal-engine) so a malformed pattern in JSON does not throw.

### Pattern 2: Exercise View Async Renderer (renderExercise)

**What:** An async view function that fetches exercise JSON, renders the stacked layout, mounts the terminal, and manages step state. Mirrors `renderLesson` from lesson-view.js exactly.

**When to use:** Called by the router when the `#/exercise/:moduleId/:exerciseId` route matches.

```javascript
// src/views/exercise-view.js
// Source: [VERIFIED: derived from lesson-view.js pattern + UI-SPEC C-01 through C-09]

import { esc } from '../utils/escape.js';
import { activateIcons } from '../utils/icons.js';
import { progressStore } from '../progress-store.js';
import { renderBadge } from '../badge.js';
import { createTerminal } from '../terminal-engine.js';
import { MODULES } from '../modules-config.js';

export async function renderExercise({ moduleId, exerciseId }) {
  const app = document.getElementById('app');
  if (!app) return null;

  // Loading skeleton immediately (mirrors renderLesson step 1)
  app.innerHTML = renderExerciseLoading();

  // Fetch exercise JSON
  const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/exercises/' + exerciseId + '.json';
  let exercise;
  try {
    const res = await fetch(url);
    if (!res.ok) { app.innerHTML = renderExerciseError(moduleId); return null; }
    exercise = await res.json();
  } catch {
    app.innerHTML = renderExerciseError(moduleId); return null;
  }

  // Find lessonId for markLessonCompleted (from modules-config)
  const mod = MODULES.find(m => m.id === moduleId);
  const lesson = mod?.lessons.find(l => l.exerciseId === exerciseId);
  const lessonId = lesson?.id ?? exerciseId;

  // Check revisit state
  const priorCompletion = progressStore.getExerciseCompletion(moduleId, exerciseId);

  // Build view HTML and inject
  app.innerHTML = buildExerciseHtml(exercise, moduleId, exerciseId);

  // Storage warning (mirrors lesson-view pattern, I-09)
  if (!progressStore.isStorageAvailable()) {
    const col = app.querySelector('.lesson-column');
    if (col) {
      const warn = document.createElement('div');
      warn.setAttribute('role', 'alert');
      warn.innerHTML = '<p style="...">Progress cannot be saved — storage unavailable. Your exercise completion will not be recorded.</p>';
      col.prepend(warn);
    }
  }

  activateIcons();

  // Mount terminal into #terminal-mount
  const termMount = app.querySelector('#terminal-mount');
  let terminal = null;
  if (termMount) {
    terminal = createTerminal(termMount, (rawInput) => handleCommand(rawInput));
    const promptText = exercise.context ? 'PS PIPELINE-DC01 >' : 'PS PIPELINE-DC01 >';
    terminal.setPrompt(promptText);
  }

  // Step state management
  let currentStepIndex = 0;
  const steps = exercise.steps ?? [];

  // Re-visit mode: render all steps done, disable terminal immediately
  if (priorCompletion) {
    renderAllStepsDone(app, steps, priorCompletion);
    if (terminal) terminal.disable();
    renderCompletionBanner(app, exercise, priorCompletion, /* isRevisit */ true);
    return null;
  }

  // Fresh mode: show step 0 as active
  showActiveStep(app, 0, steps);
  if (terminal) terminal.focus();

  function handleCommand(trimmed) {
    if (currentStepIndex >= steps.length) return;
    const step = steps[currentStepIndex];

    // 1. Test against expectedCommands
    for (const cmd of (step.expectedCommands ?? [])) {
      let matched = false;
      try {
        const flags = cmd.caseSensitive ? '' : 'i';
        matched = new RegExp(cmd.pattern, flags).test(trimmed);
      } catch { /* malformed pattern — treat as no match */ }
      if (matched) {
        // Success path
        if (terminal) terminal.appendOutput(step.successOutput ?? '');
        markStepDone(app, currentStepIndex);
        currentStepIndex++;
        if (currentStepIndex >= steps.length) {
          completeExercise();
        } else {
          showActiveStep(app, currentStepIndex, steps);
        }
        return;
      }
    }

    // 2. Test against hintPatterns
    for (const hp of (step.hintPatterns ?? [])) {
      let matched = false;
      try { matched = new RegExp(hp.pattern, 'i').test(trimmed); } catch {}
      if (matched) {
        showHint(app, hp.hint);
        return;
      }
    }

    // 3. feedbackOnWrong — shown in terminal as muted-color text
    if (terminal) terminal.appendOutput(step.feedbackOnWrong ?? 'Try a different command.', 'var(--color-text-muted)');
  }

  function completeExercise() {
    progressStore.saveExercise(moduleId, exerciseId);
    progressStore.markLessonCompleted(moduleId, lessonId);
    import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
    if (terminal) terminal.disable();
    renderCompletionBanner(app, exercise, null, /* isRevisit */ false);
  }

  return null;
}
```

### Pattern 3: Router Integration (add exercise route)

**What:** Two-line change to router.js — add to `routes[]` and `viewRenderers{}`.

**When to use:** Wave 1 or Wave 2 (before exercise-view is needed).

```javascript
// src/router.js — diff
// Source: [VERIFIED: inspected router.js extractParams and routes pattern]

// Add to routes array:
{ pattern: '#/exercise/:moduleId/:exerciseId', view: 'exercise' },

// Add to viewRenderers:
exercise: (params) => renderExercise(params),

// Add to imports:
import { renderExercise } from './views/exercise-view.js';
```

`extractParams` already handles 3-segment patterns — `#/exercise/logging-auditing/01` will parse as `{ moduleId: 'logging-auditing', exerciseId: '01' }` with no changes to that function. [VERIFIED: inspected extractParams logic — it iterates parts positionally, handles any number of segments.]

### Pattern 4: computeModuleProgress Exercise Awareness

**What:** Extend `computeModuleProgress` in quiz-engine.js to count exercise completion as part of the module denominator/numerator when a lesson has an `exerciseId`.

**Current behavior (VERIFIED: quiz-engine.js lines 258–281):**
```javascript
for (const lesson of mod.lessons) {
  denominator++;
  if (lesson.quizId) {
    const quizScore = progressStore.getQuizScore(mod.id, lesson.quizId);
    if (quizScore !== null) numerator++;
  } else {
    const progress = progressStore.getLessonProgress(mod.id, lesson.id);
    if (progress && progress.visited) numerator++;
  }
}
```

**Required change:** When a lesson has `exerciseId`, completion of the exercise (not just visiting the lesson) is the gate. The CONTEXT.md D-07 note says "exercise completion contributes to module progress via `computeModuleProgress`."

**Proposed logic (Claude's discretion on exact formula):**
```javascript
for (const lesson of mod.lessons) {
  denominator++;
  if (lesson.quizId) {
    // Quiz-backed: complete when quiz score exists
    if (progressStore.getQuizScore(mod.id, lesson.quizId) !== null) numerator++;
  } else if (lesson.exerciseId) {
    // Exercise-backed: complete when exercise saved
    const ex = progressStore.getExerciseCompletion(mod.id, lesson.exerciseId);
    if (ex !== null) numerator++;
  } else {
    // No assessment: complete when visited
    const progress = progressStore.getLessonProgress(mod.id, lesson.id);
    if (progress && progress.visited) numerator++;
  }
}
```

**Impact:** This is a backward-compatible change. Existing lessons with `quizId` are unaffected. Adding `exerciseId: '01'` to the `audit-policies` lesson in modules-config.js will add it to the denominator — so that lesson then requires exercise completion (not just quiz) to count as complete. **Important:** If both `quizId` AND `exerciseId` appear on the same lesson, a priority rule is needed. CONTEXT.md D-05 says `exerciseId` is parallel to `quizId` — in the current Logging & Auditing module the `audit-policies` lesson already has `quizId: '01'`. Adding `exerciseId: '01'` to the same lesson creates ambiguity. Resolution: add `exerciseId` to a different lesson (e.g., `ps-logging`) OR treat the lesson as complete when EITHER quiz OR exercise is done.

**Recommended resolution (Claude's discretion):** Add `exerciseId: '01'` to the `ps-logging` lesson, not `audit-policies` (which already has `quizId: '01'`). This avoids the ambiguity entirely and keeps the denominator accurate. The planner should make this call explicit.

### Anti-Patterns to Avoid

- **innerHTML for terminal output:** `successOutput` from exercise JSON can contain `<`, `>`, `&` characters (real PS error messages include XML-like paths). Use `textContent` assignment always on terminal output lines.
- **Static import of sidebar.js:** sidebar.js imports quiz-engine.js (computeModuleProgress), which if it imports sidebar.js creates a circular dep. Use `import('./sidebar.js').then(...)` exactly as quiz-engine.js does.
- **Importing exercise-view.js at top of router.js:** Causes the exercise-view module to load even when not visiting an exercise route. Use lazy loading or accept static import (quiz-engine uses static import from lesson-view with no issue — this is fine for a small app).
- **Throwing on malformed JSON patterns:** Wrap `new RegExp(pattern, flags)` in try/catch inside `handleCommand`. A typo in exercise JSON must not crash the terminal.
- **Forgetting null-guard on `app` before innerHTML:** Router calls `renderExercise(params)` before checking if `app` exists. Both `renderLesson` and `renderModule` null-guard on `app` — follow same pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Escaping HTML for terminal output | Custom string replace | `textContent = text` (no innerHTML) | Correct by construction — no HTML injection possible |
| Compliance control badge rendering | Inline span HTML | `renderBadge(tag)` from `src/badge.js` | Already in use in module-view.js, lesson-view.js — handles TSA/NIST badge colors |
| Sidebar progress refresh | Direct DOM query | `refreshSidebarProgress(moduleId)` from `src/sidebar.js` | Already handles computeModuleProgress + bar update + complete check + icon injection |
| localStorage writes | Direct `localStorage.setItem()` | `progressStore.saveExercise()` | Project constraint from CLAUDE.md; violation of single-owner rule |
| Icon rendering | SVG strings | `activateIcons()` from `src/utils/icons.js` | Pattern used across all views; call after any DOM injection that includes `data-lucide` attributes |
| Progress formula | New function | Extend `computeModuleProgress()` in quiz-engine.js | Already handles module-level progress for sidebar and module-view; avoid duplicate logic |

**Key insight:** The exercise-view has less original code than it appears. It is wiring: fetch JSON → createTerminal → handleCommand → progressStore calls → sidebar refresh. Each of those is already solved.

---

## Integration Points (exact file changes required)

### 1. `src/router.js` [VERIFIED: inspected full file]

**Change:** Add exercise route to `routes[]` array and `viewRenderers{}` object.

```javascript
// routes array — add after lesson route:
{ pattern: '#/exercise/:moduleId/:exerciseId', view: 'exercise' },

// viewRenderers — add:
exercise: (params) => renderExercise(params),

// imports — add:
import { renderExercise } from './views/exercise-view.js';
```

`extractParams` requires no changes — already handles N-part patterns.
`handleRoute` requires no changes — `setActiveModule` is called with `params.moduleId` which will be present. `setActiveLesson` is not called for exercise routes (no `params.lessonId`) — the `if (params.lessonId)` guard already handles this.

### 2. `src/modules-config.js` [VERIFIED: inspected full file]

**Change:** Add optional `exerciseId: '01'` field to the lesson that owns the exercise. Decision: add to `ps-logging` (to avoid conflict with `audit-policies` which has `quizId: '01'`).

```javascript
{ id: 'ps-logging', title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
```

No other changes needed to MODULES shape.

### 3. `src/views/module-view.js` [VERIFIED: inspected full file]

**Change:** In `lessonStatusBadge()` and the `lessonRows` map, add exercise link rendering for lessons with `exerciseId`.

The lesson row currently renders:
```javascript
<a href="#/lesson/${esc(mod.id)}/${esc(lesson.id)}"...>${esc(lesson.title)}</a>
${lessonStatusBadge(mod, lesson)}
```

Add below each lesson row (for lessons with `exerciseId`):
```javascript
${lesson.exerciseId ? `
  <a href="#/exercise/${esc(mod.id)}/${esc(lesson.exerciseId)}"
     style="display:inline-flex;align-items:center;gap:var(--spacing-xs);
            font-size:var(--text-body);font-weight:600;text-decoration:none;
            padding:var(--spacing-xs) 0;
            color:${exerciseDone ? '#22c55e' : 'var(--color-accent)'}">
    <i data-lucide="${exerciseDone ? 'check-circle' : 'terminal'}"
       style="width:14px;height:14px;color:${exerciseDone ? '#22c55e' : 'var(--color-accent)'}"></i>
    ${exerciseDone ? 'Exercise complete — revisit →' : 'Start Exercise →'}
  </a>
` : ''}
```

Where `exerciseDone = progressStore.getExerciseCompletion(mod.id, lesson.exerciseId) !== null`.

**Note:** `lessonStatusBadge` may also need exercise-awareness if a lesson has `exerciseId` but no `quizId` — currently falls through to the visited/unvisited check, which is acceptable.

### 4. `src/quiz-engine.js` `computeModuleProgress` [VERIFIED: inspected lines 258–281]

**Change:** Add `exerciseId` branch to the lesson loop (as documented in Pattern 4 above). This is a single `else if (lesson.exerciseId)` block.

### 5. `public/data/modules/logging-auditing/exercises/01.json` [VERIFIED: inspected]

**Current state:** 1 step, `"status": "placeholder"` field, `successOutput` is a reasonable Get-Item error output but lacks multi-step richness.

**Required changes:**
- Remove `"status": "placeholder"`
- Add `hintPatterns[]` to step-1
- Add at least 1–2 more steps with realistic PS 5.1 output (for TERM-02: "realistic-looking PS output, not placeholder text")
- Upgrade `successOutput` values to match real PS 5.1 format

---

## Realistic PS 5.1 Output Reference

[ASSUMED: PS 5.1 output format — based on training knowledge of PowerShell 5.1 behavior. Not executed against a live PS instance in this session.]

### Get-Item / Get-ItemProperty (Registry)

```
Get-ItemProperty : Cannot find path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging' because it does not exist.
At line:1 char:1
+ Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (HKLM:\SOFTWARE\P...kBlockLogging:String) [Get-ItemProperty], ItemNotFoundException
    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetItemPropertyCommand
```

```
EnableScriptBlockLogging : 1
PSPath                   : Microsoft.PowerShell.Core\Registry::HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging
PSParentPath             : Microsoft.PowerShell.Core\Registry::HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell
PSChildName              : ScriptBlockLogging
PSDrive                  : HKLM
PSProvider               : Microsoft.PowerShell.Core\Registry
```

### New-Item (Registry key creation)

```
    Hive: HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell

Name                           Property
----                           --------
ScriptBlockLogging
```

### Set-ItemProperty (confirm no output — then Get-ItemProperty to verify)

PS `Set-ItemProperty` returns nothing on success. The exercise step would use `Get-ItemProperty` as confirmation:

```
EnableScriptBlockLogging : 1
```

### Get-WinEvent

```
TimeCreated  Id    LevelDisplayName Message
-----------  --    ---------------- -------
5/15/2026 14:32:01 4104 Information  Creating Scriptblock text (1 of 1):...
5/15/2026 14:31:58 4104 Information  Creating Scriptblock text (1 of 1):...
5/15/2026 14:30:12 4104 Information  Creating Scriptblock text (1 of 1):...
```

### Get-EventLog (legacy — still valid in PS 5.1)

```
   Index Time          EntryType   Source                 InstanceID Message
   ----- ----          ---------   ------                 ---------- -------
   18432 May 15 14:32  Information Microsoft-Windows-P...       4104 Creating Scriptblock text (1 of 1):...
   18431 May 15 14:31  Information Microsoft-Windows-P...       4104 Creating Scriptblock text (1 of 1):...
```

### Recommended 3-Step Exercise Schema for 01.json (upgrade)

```json
{
  "id": "logging-auditing-ex-01",
  "moduleId": "logging-auditing",
  "title": "Enable Script Block Logging",
  "description": "Use PowerShell to enable Script Block Logging via the registry on PIPELINE-DC01.",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-12"],
  "context": "You are logged into PIPELINE-DC01 as a domain administrator. Script Block Logging is currently disabled.",
  "steps": [
    {
      "id": "step-1",
      "instruction": "Check whether the ScriptBlockLogging registry key exists.",
      "hint": "Use Get-Item or Get-ItemProperty with the HKLM: path to check for the ScriptBlockLogging key.",
      "hintPatterns": [
        {
          "pattern": "Get-Item\\s+HKLM:\\\\SOFTWARE\\\\Policies|gci.*HKLM",
          "hint": "Close — try Get-ItemProperty to read registry values rather than Get-Item."
        },
        {
          "pattern": "regedit|reg\\s+query",
          "hint": "In PowerShell, use Get-ItemProperty with the HKLM: provider path rather than regedit or reg.exe."
        }
      ],
      "expectedCommands": [
        {
          "pattern": "Get-ItemProperty.*ScriptBlockLogging|Get-Item.*ScriptBlockLogging",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "Get-ItemProperty : Cannot find path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging' because it does not exist.\nAt line:1 char:1\n+ Get-ItemProperty HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging\n    + CategoryInfo          : ObjectNotFound: (...) [Get-ItemProperty], ItemNotFoundException\n    + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetItemPropertyCommand",
      "feedbackOnWrong": "Navigate to HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell and check for the ScriptBlockLogging subkey using Get-ItemProperty."
    },
    {
      "id": "step-2",
      "instruction": "Create the ScriptBlockLogging registry key under the PowerShell policy path.",
      "hint": "Use New-Item to create the registry key at HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging.",
      "hintPatterns": [
        {
          "pattern": "Set-ItemProperty.*ScriptBlockLogging",
          "hint": "The key does not exist yet — use New-Item to create it first, then Set-ItemProperty to set the value."
        }
      ],
      "expectedCommands": [
        {
          "pattern": "New-Item.*ScriptBlockLogging",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "    Hive: HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\n\nName                           Property\n----                           --------\nScriptBlockLogging",
      "feedbackOnWrong": "Use New-Item -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging' -Force to create the key."
    },
    {
      "id": "step-3",
      "instruction": "Enable Script Block Logging by setting EnableScriptBlockLogging to 1.",
      "hint": "Use Set-ItemProperty with -Name EnableScriptBlockLogging -Value 1 on the key you just created.",
      "hintPatterns": [
        {
          "pattern": "New-ItemProperty.*EnableScriptBlockLogging",
          "hint": "Close — Set-ItemProperty works on existing registry keys. Since you just created the key, use Set-ItemProperty -Name EnableScriptBlockLogging -Value 1."
        }
      ],
      "expectedCommands": [
        {
          "pattern": "Set-ItemProperty.*EnableScriptBlockLogging.*1|Set-ItemProperty.*1.*EnableScriptBlockLogging",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "EnableScriptBlockLogging : 1\nPSPath                   : Microsoft.PowerShell.Core\\Registry::HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging\nPSParentPath             : Microsoft.PowerShell.Core\\Registry::HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\nPSChildName              : ScriptBlockLogging\nPSDrive                  : HKLM\nPSProvider               : Microsoft.PowerShell.Core\\Registry",
      "feedbackOnWrong": "Use Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging' -Name 'EnableScriptBlockLogging' -Value 1."
    }
  ]
}
```

---

## Common Pitfalls

### Pitfall 1: innerHTML for Terminal Output Lines
**What goes wrong:** Using `div.innerHTML = esc(text)` for `successOutput` renders `\n` as literal backslash-n (esc() does not convert `\n` to `<br>`). Using raw `innerHTML = text` creates XSS risk from PS output strings.
**Why it happens:** The instinct is to use innerHTML everywhere with esc() as quiz-engine does for structured HTML. But terminal output is plain text.
**How to avoid:** Use `div.textContent = text` for all terminal output lines. Pair with `white-space: pre-wrap` CSS so `\n` in the string renders as newlines.
**Warning signs:** Backslash-n appearing literally in terminal output; or the exercise JSON containing `<` that produces garbled terminal output.

### Pitfall 2: Missing null-guard on termMount or app
**What goes wrong:** If `renderExercise` is called while the DOM is in a transition (e.g., rapid navigation), `document.getElementById('app')` or `app.querySelector('#terminal-mount')` can return null, causing a TypeError on `.appendChild()`.
**Why it happens:** The async view pattern writes to the DOM after an await. Multiple navigations can race.
**How to avoid:** Null-guard `app` at the top of `renderExercise` (mirror of renderLesson). Null-guard `termMount` before calling `createTerminal`. Return `null` early if either is absent.
**Warning signs:** Uncaught TypeError in console on rapid hash changes.

### Pitfall 3: computeModuleProgress not updated for exercises
**What goes wrong:** Adding `exerciseId` to a lesson in modules-config.js but not updating `computeModuleProgress` means the progress bar in sidebar never reflects exercise completion.
**Why it happens:** `computeModuleProgress` only knows `quizId` and visited state. `exerciseId` is a new field it ignores unless explicitly branched.
**How to avoid:** Update the lesson loop in `computeModuleProgress` as documented in Pattern 4 before testing progress bar behavior.
**Warning signs:** Completing the exercise but sidebar progress bar stays at the same value.

### Pitfall 4: RegExp special characters in exercise patterns
**What goes wrong:** Pattern `Get-Item.*HKLM:\SOFTWARE` contains `\` (backslash) — in a JSON string this must be `\\`. In a RegExp, `\\` matches a literal backslash. If the author writes `\` in the pattern, the JSON parser may silently strip it (`\S` becomes `S`).
**Why it happens:** Triple escaping: JSON string escaping + RegExp escaping + actual content.
**How to avoid:** In exercise JSON, always double-escape backslashes: `"HKLM:\\\\SOFTWARE"` → JSON parses to `HKLM:\\SOFTWARE` → RegExp matches literal `HKLM:\SOFTWARE`. Test patterns with `new RegExp(pattern).test(sampleInput)` in browser console.
**Warning signs:** A correct command like `Get-ItemProperty HKLM:\SOFTWARE\...` doesn't match the expected pattern; the pattern silently matches everything or nothing.

### Pitfall 5: D-02 prompt text comes from exercise JSON context field
**What goes wrong:** Hard-coding `"PS PIPELINE-DC01 >"` in terminal-engine.js means the prompt cannot be customized per exercise.
**Why it happens:** D-02 says "Exact prompt text is static per exercise — pulled from exercise JSON `context` field or defaulted to `PS PIPELINE-DC01 >`."
**How to avoid:** Pass prompt text as a parameter to `createTerminal` or expose `setPrompt()` and call it from exercise-view after mounting. The factory's `setPrompt()` method handles this.
**Warning signs:** Future exercises with a different context (logged into a different host) still show PIPELINE-DC01.

### Pitfall 6: `exerciseId` on `audit-policies` lesson conflicts with existing `quizId`
**What goes wrong:** `audit-policies` already has `quizId: '01'`. Adding `exerciseId: '01'` to the same lesson creates ambiguity in `computeModuleProgress` — does the lesson require both quiz AND exercise to count as complete, or either?
**Why it happens:** The existing exercise JSON `01.json` describes "Enable Script Block Logging" which conceptually belongs to the `ps-logging` lesson, not `audit-policies`.
**How to avoid:** Assign `exerciseId: '01'` to the `ps-logging` lesson instead. `audit-policies` keeps `quizId: '01'`. No lesson has both `quizId` and `exerciseId`.
**Warning signs:** `computeModuleProgress` denominator counts `audit-policies` as requiring quiz OR exercise — logic becomes unnecessarily complex.

---

## Code Examples

### Verified Patterns from Existing Codebase

#### Dynamic import for sidebar (circular dep avoidance)
```javascript
// Source: [VERIFIED: quiz-engine.js line 231]
import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
```

#### Silent null return on fetch failure
```javascript
// Source: [VERIFIED: quiz-engine.js lines 31–37]
try {
  const res = await fetch(url);
  if (!res.ok) return null;
  exercise = await res.json();
} catch {
  return null;  // no error thrown; show "unavailable" message instead
}
```

#### esc() usage on JSON strings before innerHTML
```javascript
// Source: [VERIFIED: quiz-engine.js buildFirstVisitHtml]
<p>${esc(q.stem)}</p>
<button data-answer-id="${esc(a.id)}">${esc(a.text)}</button>
```

#### activateIcons() call after DOM injection
```javascript
// Source: [VERIFIED: quiz-engine.js line 57, lesson-view.js line 84]
lessonColumn.appendChild(section);
activateIcons();
```

#### null-guard on container before append
```javascript
// Source: [VERIFIED: quiz-engine.js line 23]
export async function renderQuiz(moduleId, quizId, lessonColumn, lessonId) {
  if (!lessonColumn) return null;
  // ...
}
```

#### BASE_URL prefix on all fetch calls
```javascript
// Source: [VERIFIED: quiz-engine.js line 30]
const url = import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/quizzes/' + quizId + '.json';
```

#### lessonId derivation from exerciseId (existing exercise-view discretion)
```javascript
// Source: [VERIFIED: CONTEXT.md Claude's Discretion — "completing an exercise should mark the associated lesson completed"]
// Derive lessonId from MODULES config, not from exerciseId string:
const mod = MODULES.find(m => m.id === moduleId);
const lesson = mod?.lessons.find(l => l.exerciseId === exerciseId);
const lessonId = lesson?.id ?? exerciseId;  // fallback: use exerciseId as lessonId
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery Terminal for PS simulation | Custom vanilla JS factory (D-01) | Phase 5 decision | No jQuery dep; full control over prompt format; ~120 lines vs. 150KB library |
| `Get-EventLog` (deprecated in PS 7+) | `Get-WinEvent` preferred | PS 5.1 target unchanged | For TERM-02 realism: both work in PS 5.1; include both in exercises for awareness |

**No deprecated patterns in scope.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PS 5.1 Get-ItemProperty, New-Item, Set-ItemProperty output format in 01.json upgrade | Realistic PS Output Reference | Output formatting slightly off from actual PS 5.1 — low risk; plausible is sufficient for TERM-02 |
| A2 | `exerciseId` should be added to `ps-logging` lesson, not `audit-policies` | Integration Points §2, Pitfall 6 | If `audit-policies` is intended, computeModuleProgress logic needs a "both quiz AND exercise required" branch |
| A3 | `handleCommand` regex wrapping in try/catch covers all bad patterns | Pattern 1 / Pattern 2 | Malformed patterns that pass the `new RegExp()` constructor but behave incorrectly (catastrophic backtracking) would still cause hangs — acceptable risk for a curated exercise JSON |

---

## Open Questions (RESOLVED)

1. **Which lesson gets `exerciseId: '01'`?**
   - RESOLVED: Assigned to `ps-logging` lesson (not `audit-policies`) per research recommendation. 05-01 Task 2 implements this.

2. **Step-level resume deferred — confirm 1 step is survivable at launch?**
   - RESOLVED: Accepted for Phase 5. Exercise completion (all 3 steps) is saved; partial completion is not. Acceptable for a training tool. Explicitly listed in CONTEXT.md Deferred.

---

## Environment Availability

Step 2.6: No external dependencies introduced. Phase 5 is code/config/JSON changes only. All runtimes (Node, npm, Vite, Vitest) are established from Phases 1–4.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (already installed) |
| Config file | `vitest.config.js` — `environment: 'happy-dom'`, `include: ['tests/**/*.test.js']` |
| Quick run command | `npx vitest run tests/terminal-engine.test.js tests/exercise-view.test.js` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TERM-01 | Correct command → step advances | unit | `npx vitest run tests/terminal-engine.test.js` | ❌ Wave 0 |
| TERM-01 | Wrong command → feedbackOnWrong shown in terminal | unit | `npx vitest run tests/terminal-engine.test.js` | ❌ Wave 0 |
| TERM-01 | No uncaught exception on arbitrary input | unit | `npx vitest run tests/terminal-engine.test.js` | ❌ Wave 0 |
| TERM-02 | successOutput non-empty and contains realistic text | schema validation | `npx vitest run tests/terminal-engine.test.js` | ❌ Wave 0 |
| TERM-03 | Near-miss input → hint displayed in step panel | unit | `npx vitest run tests/exercise-view.test.js` | ❌ Wave 0 |
| TERM-03 | Exact match → hint not shown | unit | `npx vitest run tests/exercise-view.test.js` | ❌ Wave 0 |
| TERM-04 | Simulator label DOM element is present and contains exact text | unit | `npx vitest run tests/exercise-view.test.js` | ❌ Wave 0 |

### What Can Be Unit Tested (Vitest / happy-dom)

**`tests/terminal-engine.test.js` — testable behaviors:**
- `createTerminal` returns an object with `appendOutput`, `disable`, `setPrompt`, `focus` methods
- `appendOutput(text)` creates a DOM element with `textContent === text` in the output list
- `appendOutput(text, color)` sets `style.color` on the output element
- `disable()` sets `readonly` attribute on input element
- `disable()` sets `pointer-events: none` on input element
- Submitting Enter key with trimmed empty string: `commandHandler` is NOT called
- Submitting Enter key with non-empty string: `commandHandler` IS called with trimmed value
- Submitting a command: input is cleared after commandHandler call
- ↑ key: input value becomes last submitted command
- ↑ key twice: input value becomes second-to-last submitted command
- ↓ key after ↑: input value advances forward through history
- ↓ key at end of history: input cleared (restores draft)
- RegExp test (pure unit, no DOM): `new RegExp(pattern, 'i').test(input)` returns correct boolean for pattern/input pairs

**`tests/exercise-view.test.js` — testable behaviors:**
- `renderExercise` with failed fetch: renders error state (text "Exercise content could not be loaded")
- `renderExercise` with valid exercise JSON: renders exercise title in DOM
- `renderExercise` with valid JSON: simulator label text "PS SIMULATOR — commands do not run on any real system" present in DOM (TERM-04)
- Step panel shows "Step 1 of 3" on load
- Correct command: `progressStore.saveExercise` called after last step
- Correct command: `progressStore.markLessonCompleted` called after last step
- Correct command on step 1 of 3: `progressStore.saveExercise` NOT called (not last step yet)
- Correct command on step 1: step panel advances to "Step 2 of 3"
- Near-miss command: hint area becomes visible with correct hint text (TERM-03)
- Wrong command (no hints matched): terminal output contains `feedbackOnWrong` text
- Re-visit (priorCompletion non-null): terminal is disabled (readonly attribute set on input)
- Re-visit: completion banner contains "Exercise previously completed"

**`tests/router.test.js` — add test:**
- `matchRoute('#/exercise/logging-auditing/01')` returns `{ view: 'exercise', params: { moduleId: 'logging-auditing', exerciseId: '01' } }`

**`tests/module-view.test.js` or new file — add test:**
- Lesson with `exerciseId` renders an `<a>` with `href` containing `#/exercise/`
- Lesson without `exerciseId` does not render an exercise link

**`tests/quiz-engine.test.js` — add tests for computeModuleProgress:**
- Exercise-backed lesson with completion returned non-null: counts as complete
- Exercise-backed lesson with null completion: does not count

### What Requires Browser/Manual Testing (cannot Vitest)

- Terminal input actually receives focus on exercise load (DOM focus APIs in happy-dom are limited)
- Terminal border color shifts from `var(--color-border)` to `#22c55e` on input focus
- Scroll-to-bottom behavior (`scrollTop = scrollHeight`) — happy-dom does not compute layout, scrollHeight always 0
- `activateIcons()` rendering Lucide SVGs — requires real browser (happy-dom renders `data-lucide` attrs but not SVG replacement)
- Command history ↑/↓ interaction feel (can be unit-tested for value but not UX feel)
- Sidebar progress bar width animation after exercise completion
- Module-view exercise link correctly shows "Exercise complete — revisit →" after completion (requires full browser render + progress store integration)

### Sampling Rate
- **Per task commit:** `npx vitest run tests/terminal-engine.test.js tests/exercise-view.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/terminal-engine.test.js` — covers TERM-01, TERM-03 (command matching, hint matching, disable state)
- [ ] `tests/exercise-view.test.js` — covers TERM-01, TERM-03, TERM-04, completion flow

*(No framework install needed — Vitest already in use.)*

---

## Wave Planning Recommendation

Phase 5 has a natural 4-wave breakdown based on dependency order:

**Wave 0: Test scaffolds + 01.json upgrade**
- Write RED test stubs for `terminal-engine.test.js` and `exercise-view.test.js`
- Upgrade `01.json`: add `hintPatterns`, remove `"status"`, add steps 2 and 3
- Add `exerciseId: '01'` to `ps-logging` in `modules-config.js`
- Add router test for exercise route

**Wave 1: terminal-engine.js**
- `src/terminal-engine.js` — createTerminal factory (~120 lines)
- Tests go GREEN for terminal-engine tests

**Wave 2: exercise-view.js + router wiring**
- `src/views/exercise-view.js` — renderExercise async view
- `src/router.js` — add exercise route
- Tests go GREEN for exercise-view tests
- Router test goes GREEN

**Wave 3: Integration wiring**
- `src/views/module-view.js` — add exercise link button rendering (C-07)
- `src/quiz-engine.js` — extend computeModuleProgress for exerciseId
- `src/style.css` — add terminal-cursor-blink keyframe
- Module-view tests + computeModuleProgress tests pass

This wave ordering ensures each wave produces a testable artifact before the next wave depends on it.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Static site; no auth |
| V3 Session Management | No | localStorage only |
| V4 Access Control | No | No user-specific content |
| V5 Input Validation | Yes | Terminal input → RegExp only, never innerHTML. `esc()` on all exercise JSON strings. |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Injecting HTML via terminal input | Tampering | `textContent` on input echo + output lines — never innerHTML |
| XSS via exercise JSON strings | Tampering | `esc()` on all fields inserted into innerHTML (title, description, context, instruction, hint, feedbackOnWrong) |
| XSS via moduleId/exerciseId from URL hash | Tampering | Only used in `href` attributes after `esc()` — never in text content |
| Catastrophic regex backtracking via malformed pattern | DoS | Exercise JSON is authored/curated; patterns are not user-supplied. Acceptable risk. |

---

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: src/router.js]` — extractParams pattern, routes[] structure, viewRenderers{} pattern, setActiveLesson guard
- `[VERIFIED: src/quiz-engine.js]` — computeModuleProgress formula, dynamic sidebar import pattern, null-guard on container, esc() usage, renderQuiz async pattern
- `[VERIFIED: src/progress-store.js]` — saveExercise(), getExerciseCompletion(), markLessonCompleted(), saveQuiz() APIs confirmed
- `[VERIFIED: src/views/lesson-view.js]` — async view pattern: loading skeleton → fetch → inject → activateIcons → progressStore calls
- `[VERIFIED: src/views/module-view.js]` — lessonRows map pattern, lessonStatusBadge, where to inject exercise link
- `[VERIFIED: src/sidebar.js]` — refreshSidebarProgress() API confirmed, circular dep pattern confirmed
- `[VERIFIED: src/modules-config.js]` — current MODULES shape; quizId on audit-policies confirmed; ps-logging has no exerciseId or quizId
- `[VERIFIED: public/data/modules/logging-auditing/exercises/01.json]` — current state: 1 step, status field present, successOutput format
- `[VERIFIED: vitest.config.js]` — happy-dom environment, tests/ directory
- `[VERIFIED: tests/quiz-engine.test.js]` — vi.hoisted pattern, mock structure, test fixture format
- `[VERIFIED: .planning/phases/05-*/05-CONTEXT.md]` — all D-01 through D-13 locked decisions
- `[VERIFIED: .planning/phases/05-*/05-UI-SPEC.md]` — all component specs C-01 through C-09, all interaction specs I-01 through I-09, all copywriting locks

### Secondary (MEDIUM confidence)
- `[CITED: CLAUDE.md]` — No real PS execution, PS target 5.1, no jQuery Terminal, all localStorage through progress-store.js

### Tertiary (LOW/ASSUMED)
- `[ASSUMED]` — PS 5.1 output format for Get-ItemProperty, New-Item, Set-ItemProperty. Based on training knowledge, not executed against live PS instance.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing
- Architecture: HIGH — derived from verified codebase inspection
- Integration points: HIGH — all line numbers and patterns confirmed against real files
- Realistic PS output: LOW-MEDIUM — ASSUMED from training knowledge; functional for TERM-02 ("realistic-looking"), not required to be exact

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable codebase — no fast-moving dependencies)
