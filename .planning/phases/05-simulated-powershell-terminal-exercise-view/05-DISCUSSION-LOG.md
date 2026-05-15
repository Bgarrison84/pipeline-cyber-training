# Phase 5: Simulated PowerShell Terminal + Exercise View — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 5-simulated-powershell-terminal-exercise-view
**Areas discussed:** Terminal library, Exercise route & UI, Command matching, Multi-line pipeline support

---

## Terminal library

| Option | Description | Selected |
|--------|-------------|----------|
| jQuery Terminal | Built-in history, scroll, line-wrap; ~220KB; fake-terminal pattern fits exactly | |
| Custom vanilla JS | Zero dependencies; ~120 lines of boilerplate; full styling control | ✓ (Claude's discretion) |
| You decide | Claude picks based on project dependency philosophy | ✓ |

**User's choice:** You decide
**Notes:** Claude selected custom vanilla JS — no new npm dependencies, consistent with the project's no-framework stance, boilerplate is manageable at ~120 lines. Full control over prompt format and simulator label (required by TERM-04).

---

## Exercise route & UI

### How learners reach an exercise

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated hash route | #/exercise/logging-auditing/01 → exercise-view.js; bookmarkable; consistent with #/lesson pattern | ✓ |
| Embedded in lesson view | Exercise inline below lesson article; no new route; exerciseId in lesson frontmatter | |
| You decide | Claude picks based on router pattern | |

**User's choice:** Dedicated hash route
**Notes:** Clean separation, bookmarkable, consistent with existing routing.

### Exercise view layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked (top instructions, bottom terminal) | Single-column; no resize logic; matches lesson-view flow | ✓ |
| Side-by-side split pane | 40/60 split; more IDE-like; adds layout complexity | |
| You decide | Claude picks for simplicity | |

**User's choice:** Stacked
**Notes:** Consistent with lesson-view single-column pattern; no resize JavaScript needed.

### Completion UX

| Option | Description | Selected |
|--------|-------------|----------|
| Completion banner + progress saved | Banner appears, saveExercise() called, terminal disabled, user navigates away manually | ✓ |
| Auto-redirect after completion | Brief message then auto-navigate to #/module/moduleId after 3 seconds | |
| You decide | Claude picks based on non-disruptive flow | |

**User's choice:** Completion banner + progress saved
**Notes:** Learner controls when to leave; less disruptive than auto-redirect.

---

## Command matching

### Near-miss detection for TERM-03

| Option | Description | Selected |
|--------|-------------|----------|
| Per-step hintPatterns in exercise JSON | Authors declare regex patterns + hint text per step; contextual and maintainable | ✓ |
| Global PS alias/abbreviation table | Static table of gci→Get-ChildItem etc.; automatic but not tunable per exercise | |
| You decide | Claude picks for maintainability | |

**User's choice:** Per-step hintPatterns in exercise JSON
**Notes:** Keeps hint logic co-located with exercise content; authors can tune precisely for each step.

### Attempt limit before answer reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Unlimited attempts, feedbackOnWrong always shown | No attempt counter; immediate hint on every wrong attempt | ✓ (Claude's discretion) |
| Progressive: 3 wrong → reveal expected command | Attempt counter per step; reveal answer after 3 fails | |
| You decide | Claude picks based on training tool goals | ✓ |

**User's choice:** You decide
**Notes:** Claude selected unlimited attempts — this is a compliance training tool, not a syntax test. Learners benefit from trying without gates.

---

## Multi-line pipeline support

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — regex handles single-line pipes naturally | No special parser; whole input string matched against RegExp; pipe chains just work | ✓ (Claude's discretion) |
| No — limit to single cmdlets for Phase 5 | Simpler test surface; restrict exercises to simple commands | |
| You decide | Claude picks based on existing schema | ✓ |

**User's choice:** You decide
**Notes:** Claude selected natural single-line pipeline support — zero extra implementation cost since the whole input string is passed to RegExp.test(). Multi-line continuation prompt (>>) deferred as out of scope.

---

## Claude's Discretion

- **Terminal library:** Custom vanilla JS (no jQuery Terminal dependency)
- **Attempt limit:** Unlimited; feedbackOnWrong shown on every wrong attempt
- **Pipeline support:** Single-line pipes supported naturally via regex; multi-line continuation prompt deferred
- **Step progress indicator:** Include "Step N of M" in the step panel (helps learners gauge progress)
- **Exercise completion calls markLessonCompleted:** Yes — parallel to quiz behavior

## Deferred Ideas

- Multi-line PS continuation prompt (>> on Enter after |) — not required by TERM-01–04
- Step-level resume (stepReached in progressStore) — only worth adding if exercises get long; 1-step exercises don't need it
- Global PS alias expansion table — superseded by per-step hintPatterns approach
- Color-coded terminal output (green success, red error) — deferred to avoid terminal styling complexity
