---
phase: 05-simulated-powershell-terminal-exercise-view
fixed_at: 2026-05-15T20:22:00Z
review_path: .planning/phases/05-simulated-powershell-terminal-exercise-view/05-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-05-15T20:22:00Z
**Source review:** `.planning/phases/05-simulated-powershell-terminal-exercise-view/05-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01, CR-02, WR-01, WR-02, WR-03, WR-04)
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Unsanitised `directiveKey` injected into HTML class attribute in `renderBadge`

**Files modified:** `src/badge.js`
**Commit:** 06142f6
**Applied fix:** Extracted `colorClasses[directiveKey] ?? ''` into a `safeClasses` local variable and wrapped it with `esc()` before interpolating into the `<span>` class attribute. This closes the XSS sink where a crafted `directiveKey` value such as `" onmouseover="alert(1)"` could break out of the class attribute.

---

### CR-02: Route parameters concatenated directly into fetch URLs — path-traversal risk

**Files modified:** `src/views/exercise-view.js`, `src/quiz-engine.js`
**Commit:** 06142f6
**Applied fix:** Added a `safePath(segment)` function (allowlist: `^[a-zA-Z0-9_-]+$`) to both files. The fetch URL construction in `exercise-view.js` wraps both `moduleId` and `exerciseId` in `safePath()`; in `quiz-engine.js` both `moduleId` and `quizId` are wrapped. If validation throws (invalid segment), the existing error state is rendered (`renderExerciseError` / `return null`) rather than propagating the exception.

---

### WR-01: Off-by-one when exercise has zero steps

**Files modified:** `src/views/exercise-view.js`
**Commit:** 06142f6
**Applied fix:** Added a guard immediately after `const steps = exercise.steps ?? []` (Step 10): if `steps.length === 0`, the terminal is disabled immediately and the function returns `null`. This prevents `handleCommand` from calling `completeExercise()` on the very first command with an empty steps array (the `0 >= 0` off-by-one).

---

### WR-02: `markLessonCompleted` doesn't set `visited: true`

**Files modified:** `src/progress-store.js`
**Commit:** 06142f6
**Applied fix:** Added `visited: true` to the object spread inside `markLessonCompleted()`. A lesson completed via exercise or quiz now also has `visited: true` set, so `lessonStatusBadge` in `module-view.js` will correctly show the visited badge even if `markVisited()` was never called first (e.g., direct navigation to the exercise URL).

---

### WR-03: `renderCompletionBanner` — same root as CR-01

**Files modified:** `src/badge.js` (via CR-01 fix — no additional change to `exercise-view.js`)
**Commit:** 06142f6
**Applied fix:** WR-03 is the same XSS sink as CR-01 (unescaped class string from `renderBadge` lands in `banner.innerHTML`). Fixing `badge.js` as part of CR-01 resolves both the initial `buildExerciseHtml` injection site and the `renderCompletionBanner` dynamic injection site simultaneously.

---

### WR-04: Test reliability — dynamic import mock timing

**Files modified:** `tests/exercise-view.test.js`
**Commit:** 06142f6
**Applied fix:** Added `import { refreshSidebarProgress } from '../src/sidebar.js'` to the test imports (Vitest's `vi.mock` hoisting intercepts the dynamic import). Added a new test in the last-step describe block that calls both step commands, then `await Promise.resolve()` to flush the microtask queue so the `import('../sidebar.js').then()` callback resolves, and asserts `expect(refreshSidebarProgress).toHaveBeenCalledWith('logging-auditing')`. All 13 tests pass (12 original + 1 new).

---

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-05-15T20:22:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
