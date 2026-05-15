---
phase: 05-simulated-powershell-terminal-exercise-view
plan: "02"
subsystem: terminal-engine
tags: [tdd, green-phase, wave-1, terminal-engine, vanilla-js]
dependency_graph:
  requires: [05-01-wave-0-red-scaffolds]
  provides: [createTerminal-factory, terminal-engine-api]
  affects: [src/terminal-engine.js]
tech_stack:
  added: []
  patterns: [closure-over-mutable-state, dom-factory-function, textContent-xss-safe]
key_files:
  created: []
  modified:
    - src/terminal-engine.js
decisions:
  - "line.textContent = text enforced for all output lines — never innerHTML; successOutput strings from exercise JSON can contain angle brackets from PS error messages (T-05-W1-01)"
  - "history.unshift(trimmed) not push — history[0] is always most recent command, simplifying ArrowUp index logic"
  - "No imports in terminal-engine.js — pure self-contained DOM module; commandHandler callback pattern keeps exercise-view as the owner of step state"
metrics:
  duration: "6 minutes"
  completed: "2026-05-15"
  tasks: 1
  files: 1
---

# Phase 5 Plan 02: Terminal Engine Implementation (Wave 1) Summary

createTerminal vanilla JS factory: 140-line pure DOM module with 4-method API (appendOutput, disable, setPrompt, focus), closure-based command history, XSS-safe textContent output, and Enter/ArrowUp/ArrowDown key handling.

## What Was Built

### Task 1: src/terminal-engine.js — createTerminal factory (TDD GREEN)

Replaced the Wave 0 stub (threw Error) with a full implementation. The module is a single exported factory function with no imports — self-contained DOM manipulation only.

**DOM structure built inside `container`:**
```
termBody (div, dark #1a1a1a bg, Courier New 13px, 320-480px scrollable)
  outputList (div — output lines appended here)
  promptRow (div, display:flex, align-items:baseline)
    promptSpan (span, #22c55e, user-select:none, default "PS PIPELINE-DC01 >")
    input (type=text, transparent bg, flex:1, min-height:44px, caret-color:#22c55e)
```

**Closure state:** `history[]`, `historyIndex`, `disabled`

**Key behaviors implemented:**
- **Enter:** trim input; empty guard (return if `!trimmed`); echo `promptSpan.textContent + ' ' + raw` via `appendOutput`; `history.unshift(trimmed)`; `historyIndex = -1`; clear input; call `commandHandler(trimmed)`; `scrollToBottom()`
- **ArrowUp:** `historyIndex++` if within bounds; `input.value = history[historyIndex]`
- **ArrowDown:** `historyIndex--` if `>0`; clear input if `historyIndex === 0`
- **termBody click:** `if (!disabled) input.focus()`
- **input focus/blur:** border color toggle on `[data-terminal-wrapper]` or `container.parentElement`

**API methods:**
- `appendOutput(text, color?)` — creates div, sets `line.textContent = text` (never innerHTML), appends to outputList, calls scrollToBottom
- `disable()` — sets `disabled=true`, `readonly` attr, `pointerEvents:none`, `opacity:0.4` on input and promptSpan
- `setPrompt(text)` — sets `promptSpan.textContent = text`
- `focus()` — calls `input.focus()`

**Test results:**
```
Test Files  1 passed (1)
Tests  13 passed (13)
```

All 13 RED tests from Wave 0 turned GREEN. No regressions in pre-existing tests.

**Regression check (full suite):**
- exercise-view.test.js: 12 failing RED (Wave 2 not started — expected)
- router.test.js: 1 failing RED (exercise route not wired — expected)
- quiz-engine.test.js: 1 failing RED (computeModuleProgress exercise branch — expected)
- All other test files: GREEN (no regressions)

## Acceptance Criteria Verification

| Check | Result |
|-------|--------|
| `npx vitest run tests/terminal-engine.test.js` exits 0 | PASS (13/13) |
| `typeof createTerminal` === "function" | PASS |
| `grep -c "line.textContent = text" src/terminal-engine.js` equals 1 | PASS (count: 1) |
| `grep -c "history.unshift" src/terminal-engine.js` equals 1 | PASS (count: 1) |
| No `outputList.*innerHTML` or `line\.innerHTML` in non-comment lines | PASS |
| No regressions in pre-existing test files | PASS |

## Deviations from Plan

None — plan executed exactly as written. The factory implementation follows Pattern 1 from RESEARCH.md verbatim, with the DOM structure, event handler logic, and API surface matching the plan's `<action>` block exactly.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `renderExercise` throws | src/views/exercise-view.js | Wave 2 placeholder — real implementation in Plan 05-03 |

The terminal-engine.js stub from Wave 0 has been fully replaced. No stubs remain in this plan's deliverable.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced.

T-05-W1-01 (Tampering via innerHTML on appendOutput): mitigated — `line.textContent = text` enforced; acceptance criteria grep confirmed zero innerHTML assignments on output lines.

T-05-W1-02 (Tampering via PS prompt echo): mitigated — echo uses `appendOutput()` which uses `textContent` — user-typed commands cannot inject HTML.

T-05-W1-03 (DoS via unbounded history): accepted per threat register — training session is short-lived, no localStorage persistence of history, memory cost negligible.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/terminal-engine.js exists | FOUND |
| src/terminal-engine.js exports createTerminal | FOUND (typeof === "function") |
| Commit f7d897d (Task 1) | FOUND |
| All 13 terminal-engine.test.js tests GREEN | PASS |
| line.textContent = text count === 1 | PASS |
| history.unshift count === 1 | PASS |
| No outputList.innerHTML or line.innerHTML | PASS |
