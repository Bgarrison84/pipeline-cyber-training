# Phase 5: Simulated PowerShell Terminal + Exercise View — Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `src/terminal-engine.js` (a vanilla JS terminal factory) and `src/views/exercise-view.js` (the exercise page). Together they deliver a simulated PS whitelist terminal that: renders in a dedicated `#/exercise/{moduleId}/{exerciseId}` route, validates typed commands against exercise step patterns via regex, shows realistic canned output on success and contextual hints on near-miss, and saves completion to `progressStore.saveExercise()` when all steps pass. The exercise JSON schema and terminal scope contract are finalized in this phase so all module authors (Phases 7–8) can author exercises without revisiting the engine.

This phase does NOT build real PS execution (static site constraint), multi-line continuation prompts (>> prompt on Enter after |), or additional modules beyond the one existing Logging & Auditing exercise.

</domain>

<decisions>
## Implementation Decisions

### Terminal Library

- **D-01:** **Custom vanilla JS terminal** — `src/terminal-engine.js` exports a `createTerminal(container, commandHandler)` factory that renders a styled terminal `<div>` into `container` and calls `commandHandler(rawInput)` on Enter. No jQuery Terminal dependency. ~120 lines of: prompt div, output list, input element, Enter keydown handler, command history array (↑/↓ keys), scroll-to-bottom on new output. Complete control over prompt format and simulator label positioning.
- **D-02:** Prompt format: `PS PIPELINE-DC01 >` (matches the `context` field in exercise JSON: "You are logged into PIPELINE-DC01"). Exact prompt text is static per exercise — pulled from exercise JSON `context` field or defaulted to `PS PIPELINE-DC01 >`.
- **D-03:** Simulator label (TERM-04): a persistent banner **above** the terminal element — `"PS SIMULATOR — commands do not run on any real system"`. Styled with `var(--color-destructive)` text on a muted background. Always visible, not dismissible.

### Exercise Route & Navigation

- **D-04:** New hash route `#/exercise/{moduleId}/{exerciseId}` — router dispatches to `src/views/exercise-view.js`. Consistent with `#/lesson/{moduleId}/{lessonId}` pattern. The `exercise-view.js` fetches exercise JSON from `import.meta.env.BASE_URL + 'data/modules/{moduleId}/exercises/{exerciseId}.json'`.
- **D-05:** Exercise links surface in the module-view lesson list. The `modules-config.js` lesson entries gain an optional `exerciseId` field (parallel to `quizId`). Module-view renders a link button below each lesson that has an exercise. No dedicated exercise list page needed for Phase 5.

### Exercise View Layout

- **D-06:** **Stacked layout** — single-column. Top: exercise header (title, description, compliance controls, step count). Middle: step instructions panel (current step instruction + hint text area). Bottom: simulator label banner + terminal element. No JS resize splitter needed; the lesson-view column-width pattern applies.
- **D-07:** Step progression: each step shows its instruction text. On correct command → output `successOutput` to terminal, mark step done (visual checkmark), advance to next step instruction. On wrong command → check `hintPatterns[]` first; if a pattern matches show its `hint`; else show `feedbackOnWrong`. No attempt counter.
- **D-08:** **Completion: banner + disabled terminal.** After the last step succeeds: `progressStore.saveExercise(moduleId, exerciseId)` is called, a completion banner appears (`"Exercise complete — well done."` + compliance controls covered), terminal input is disabled (`readonly` attribute), and sidebar progress updates. User navigates away manually.

### Command Matching

- **D-09:** **Exact match:** input string tested against each `expectedCommands[n].pattern` using `new RegExp(pattern, caseSensitive ? '' : 'i').test(input.trim())`. First matching pattern wins. Multiple `expectedCommands` entries per step allow alternative correct phrasings.
- **D-10:** **Near-miss hints:** each step in exercise JSON may declare a `hintPatterns[]` array — each entry has `{ pattern, hint }`. If input matches none of `expectedCommands` but matches a `hintPattern`, that `hint` is displayed. Falls back to `feedbackOnWrong` if no hintPattern matches. This keeps hint logic authored per-exercise, not hard-coded in the engine.
- **D-11:** **Single-line pipelines supported naturally** — the whole input string (including `|` chains) is passed to `RegExp.test()`. No special pipe parsing. Exercise authors write patterns that match piped commands as needed.
- **D-12:** **No attempt counter** — unlimited attempts per step. Training tool goal is compliance understanding, not PS syntax gatekeeping. Good `feedbackOnWrong` and `hintPatterns` are the guidance mechanism.

### Exercise JSON Schema Extension

- **D-13:** Extend the existing exercise JSON schema to support `hintPatterns` per step:
  ```json
  {
    "steps": [{
      "id": "step-1",
      "instruction": "...",
      "hint": "...",
      "hintPatterns": [
        { "pattern": "Get-Item.*registry|gci.*registry", "hint": "Close — try Get-ItemProperty instead of Get-Item for reading registry values." }
      ],
      "expectedCommands": [{ "pattern": "...", "matchType": "regex", "caseSensitive": false }],
      "successOutput": "...",
      "feedbackOnWrong": "..."
    }]
  }
  ```
  `hintPatterns` is optional (exercises without it fall back to `feedbackOnWrong`). Remove the stale `"status": "placeholder"` field from `01.json` during this phase.

### Claude's Discretion

- Exact CSS styling of the terminal element (background color, font-family, line-height, cursor blinking) — follow `var(--color-bg-secondary)` track and `var(--color-text-primary)` text; monospace font.
- Whether to show a step progress indicator (e.g., "Step 2 of 3") in the step panel — use best judgment; probably yes since it helps learners know how far they are.
- Whether `progressStore.markLessonCompleted()` should also be called when an exercise completes — yes, completing an exercise should mark the associated lesson completed (parallel to quiz behavior in Phase 4).
- Error handling if exercise JSON fetch fails — silent graceful failure: show "Exercise unavailable" message in the exercise view, no uncaught exception (mirrors quiz engine null-return pattern).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `CLAUDE.md` — No real PS execution; static GitHub Pages; all localStorage through `progress-store.js`; PS version target 5.1; terminal is a simulator
- `.planning/REQUIREMENTS.md` — TERM-01 (correct command → next step), TERM-02 (realistic output), TERM-03 (near-miss contextual hint), TERM-04 (persistent simulator label)
- `.planning/ROADMAP.md §Phase 5` — Success criteria and phase dependencies

### Existing Code (integration points)
- `src/router.js` — add `#/exercise/{moduleId}/{exerciseId}` route dispatch; study existing route parsing pattern
- `src/views/lesson-view.js` — model for async view that fetches JSON + renders DOM; exercise-view follows same pattern
- `src/views/module-view.js` — add exercise link button per lesson that has `exerciseId` in modules-config
- `src/progress-store.js` — `saveExercise(moduleId, exerciseId)`, `getExerciseCompletion(moduleId, exerciseId)` → `{completed, completedAt}|null` APIs (locked in Phase 3 D-05)
- `src/quiz-engine.js` — reference for: inline style pattern, `esc()` usage, `activateIcons()` post-inject call, null-guard on container before append
- `src/sidebar.js` `refreshSidebarProgress()` — call after `saveExercise()` to update sidebar bar in-session (same as quiz completion does)
- `src/modules-config.js` — add optional `exerciseId` field to lesson entries (parallel to `quizId`)

### Exercise Data
- `public/data/modules/logging-auditing/exercises/01.json` — existing exercise JSON; canonical schema reference; Phase 5 adds `hintPatterns` and removes stale `"status"` field

### Prior Phase Patterns
- `src/quiz-engine.js` Phase 4 — event delegation, esc() on all JSON strings, dynamic import for circular deps, silent null return on fetch failure
- `.planning/phases/04-quiz-engine-lesson-progress-ui/04-CONTEXT.md` D-07 — completion formula; exercise completion (`saveExercise`) contributes to module progress via `computeModuleProgress`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/escape.js` `esc()` — apply to exercise JSON strings (title, description, instruction, hint, successOutput, feedbackOnWrong) before innerHTML insertion
- `src/utils/icons.js` `activateIcons()` — call after injecting exercise HTML for any Lucide icons (check-circle for completed steps, etc.)
- `var(--color-accent)`, `var(--color-border)`, `var(--color-bg-secondary)`, `var(--color-text-muted)`, `var(--color-destructive)` — established design tokens; use for all exercise/terminal styling
- `src/badge.js` `renderBadge()` — compliance control badges; use in exercise header for `complianceControls[]`
- `progressStore.refreshSidebarProgress` pattern — call `refreshSidebarProgress(moduleId)` after `saveExercise()` (via dynamic import to avoid circular deps, same as quiz-engine)

### Established Patterns
- **Inline style pattern** — all layout via `style="..."` attributes; no new CSS classes for layout (lesson-view, quiz-engine, module-view all follow this)
- **Fetch with BASE_URL prefix** — `import.meta.env.BASE_URL + 'data/modules/' + moduleId + '/exercises/' + exerciseId + '.json'`
- **Silent null return on fetch failure** — try/catch wraps fetch + res.ok check; return null and show "unavailable" message; no error thrown
- **Dynamic import for circular deps** — if terminal-engine needs to call sidebar.js, use `import('./sidebar.js').then(m => m.refreshSidebarProgress(...))`
- **Single-module ownership** — `terminal-engine.js` owns all terminal rendering and command validation; `exercise-view.js` calls it as a black box
- **`progressStore.init()` already called by main.js** — exercise-view can call progressStore APIs directly

### Integration Points
- `router.js` route table: add `'/exercise/:moduleId/:exerciseId'` dispatch to `exercise-view.js`
- `modules-config.js` lesson shapes: add optional `exerciseId: '01'` to `audit-policies` lesson (the one with the existing exercise)
- `sidebar.js` `computeModuleProgress()` in quiz-engine.js: exercises completion must factor into module progress — `getExerciseCompletion(mod.id, lesson.exerciseId)` in the D-07 formula (same tier as quizzes)
- `module-view.js` lesson list: render exercise link button alongside lesson link for lessons that have `exerciseId`

</code_context>

<specifics>
## Specific Ideas

- Terminal background: dark — use `var(--color-bg-secondary)` darkened, or a near-black like `#1a1a1a` if design tokens don't include one; monospace font (`font-family: 'Courier New', monospace`)
- Prompt color: bright green (`#22c55e` — same as quiz correct answer) for the `PS PIPELINE-DC01 >` prefix to visually signal "this is a terminal"
- Simulator label color: `var(--color-destructive)` text so it stands out as a warning
- Step success output: display in the terminal as plain text (no color coding in Phase 5 — keep it simple)
- Command history: ↑/↓ arrows cycle through previous commands (standard terminal UX; implemented in the vanilla JS factory)

</specifics>

<deferred>
## Deferred Ideas

- **Multi-line PS continuation prompt** (`>>` prompt on Enter after `|`) — complex terminal state; not required by TERM-01–04; deferred indefinitely
- **Step-level resume** (`stepReached` in progressStore exercises schema) — Phase 3 noted this as deferred to Phase 5; revisit only if exercise length justifies it. For 1-step exercises it's not needed. D-05 in Phase 3 records completion flag + timestamp only.
- **PS alias expansion table** (global gci→Get-ChildItem etc.) — deferred in favor of per-step `hintPatterns`; easier for exercise authors to maintain
- **Color-coded terminal output** (green for success, red for error) — nice-to-have; deferred to avoid terminal styling complexity in Phase 5

</deferred>

---

*Phase: 5-simulated-powershell-terminal-exercise-view*
*Context gathered: 2026-05-15*
