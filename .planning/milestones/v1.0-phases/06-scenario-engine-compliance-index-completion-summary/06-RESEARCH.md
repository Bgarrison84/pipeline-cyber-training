# Phase 6: Scenario Engine + Compliance Index + Completion Summary — Research

**Researched:** 2026-05-15
**Domain:** Branching decision-tree UI, runtime compliance index aggregation, CSS print layout
**Confidence:** HIGH

---

## Summary

Phase 6 introduces three new surfaces to the app: a branching scenario engine, a compliance
control index page, and a printable completion summary. All three are pure client-side,
consistent with the static GitHub Pages deployment constraint.

The scenario engine is architecturally closest to `exercise-view.js` (async fetch, direct
`#app` write, completion saved to `progressStore`), but replaces linear step progression
with a decision tree where each node presents a prompt, two-plus options, and outcome
feedback before unlocking the next node. The data schema in `scenarios/01.json` already
exists as a placeholder and defines the shape; Phase 6 populates it fully and builds the
renderer.

The compliance index requires aggregating `complianceControls` arrays that already exist in
every lesson `.md` frontmatter, quiz JSON, exercise JSON, and scenario JSON. Because this is
a static site with no build-time introspection pipeline, the most workable approach is a
runtime fetch of all known content files (using the same `import.meta.env.BASE_URL` fetch
pattern) to build an in-memory control-to-content map, then render an index page. A
dedicated `compliance-index.json` manifest avoids needing to parse Markdown frontmatter at
runtime and gives Phase 7/8 authors a clear file to update when adding new content.

The completion summary uses `window.print()` with `@media print` CSS to produce a
browser-native printable page. No third-party PDF library is needed — the browser handles
page breaks and margins. The summary reads all relevant progress data from `progressStore`
and must clearly label itself a "training log artifact, not a compliance certification" per
ASSESS-04.

**Primary recommendation:** Build scenario engine mirroring exercise-view.js; use a
build-time-friendly `compliance-index.json` manifest for the index page; use
`window.print()` with `@media print` CSS for the summary.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ASSESS-02 | Scenario exercises with branching decision points and outcome explanations | Scenario JSON schema (already partially defined in `scenarios/01.json`); decision-tree rendering pattern maps to exercise-view.js |
| SHELL-04 | Compliance index page mapping control IDs to every lesson/exercise/scenario | `complianceControls` arrays already in all content files; `compliance-index.json` manifest approach enables runtime aggregation without Markdown parsing |
| ASSESS-04 | Printable completion summary labeled as training log artifact | `window.print()` + `@media print` CSS works on static hosts; `progressStore` already stores quiz scores, exercise completions, scenario completions, and `lastVisited` |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scenario decision rendering | Browser / Client | — | Static site; all rendering is client-side DOM manipulation |
| Scenario progress persistence | Browser / Client (localStorage) | — | `progressStore.saveScenario` already implemented |
| Compliance index aggregation | Browser / Client | — | Runtime fetch of `compliance-index.json`; no backend |
| Print layout | Browser / Client (`@media print`) | — | `window.print()` is the only viable mechanism on a static host |
| New hash routes | Browser / Client (router.js) | — | Three new routes: `#/scenario/:moduleId/:scenarioId`, `#/compliance-index`, `#/completion-summary` |

---

## Standard Stack

### Core (already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | ^8.0.12 | Build tool | Already in project; no change |
| Tailwind v4 | ^4.3.0 | CSS | Already in project |
| Vitest | ^4.1.6 | Test runner | Already in project; 13/13 tests green |
| happy-dom | ^20.9.0 | Test DOM | Already in project |

**No new npm packages are required for Phase 6.** `window.print()` and `@media print` are
native browser APIs. The compliance index is built from runtime-fetched JSON. No PDF
library, no markdown-at-runtime parsing, no tree-walking library.

[VERIFIED: package.json in repo]

### Supporting Utilities (already in project)

| Utility | File | Purpose |
|---------|------|---------|
| `esc()` | `src/utils/escape.js` | XSS-safe innerHTML injection |
| `progressStore` | `src/progress-store.js` | All localStorage access; `saveScenario` and `getScenarioCompletion` already exist |
| `renderBadge()` | `src/badge.js` | Compliance badge rendering — reused in scenario header and compliance index |
| `activateIcons()` | `src/utils/icons.js` | Lucide icon hydration after innerHTML injection |
| `safePath()` | (copy from exercise-view) | Path-traversal guard for URL segments in fetch calls |
| `MODULES` | `src/modules-config.js` | Module metadata — needs `scenarioId` field added to lesson objects |

[VERIFIED: codebase grep]

---

## Architecture Patterns

### System Architecture Diagram

```
Hash route change
      |
      v
router.js
  |── #/scenario/:moduleId/:scenarioId  ──>  scenario-view.js
  |                                             │ fetch scenarios/{id}.json
  |                                             │ render decision node
  |                                             │ user picks option
  |                                             │ show outcome
  |                                             │ advance to next node
  |                                             │ all nodes done → progressStore.saveScenario()
  |                                             │ → dynamic import sidebar.refreshSidebarProgress()
  |
  |── #/compliance-index  ──>  compliance-index-view.js
  |                               │ fetch compliance-index.json
  |                               │ group by control ID
  |                               │ render control → content links
  |
  └── #/completion-summary  ──>  completion-summary-view.js
                                    │ read progressStore (all sections)
                                    │ render learner name input + artifact
                                    │ window.print() button
```

### Recommended Project Structure

```
src/
  views/
    scenario-view.js        ← new (mirrors exercise-view.js)
    compliance-index-view.js ← new (fetch + render control map)
    completion-summary-view.js ← new (progressStore read + print)
  router.js                 ← add 3 new routes + 3 new viewRenderers entries
  modules-config.js         ← add scenarioId field to lesson objects
  quiz-engine.js            ← add scenarioId branch to computeModuleProgress
public/
  data/
    compliance-index.json   ← new manifest: control IDs → content references
    modules/
      logging-auditing/
        scenarios/
          01.json           ← upgrade from placeholder to full decision tree
tests/
  scenario-view.test.js     ← new RED stubs → GREEN after implementation
  compliance-index-view.test.js ← new
  completion-summary-view.test.js ← new
  router.test.js            ← extend for 3 new routes (already exists, 13 tests)
  quiz-engine.test.js       ← extend computeModuleProgress for scenarioId branch
```

### Pattern 1: Scenario Decision Tree — JSON Schema

The existing `scenarios/01.json` placeholder establishes the outer shape. The full schema
for Phase 6 adds multi-phase trees and "final node" markers:

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
      "prompt": "What is your first action?",
      "options": [
        {
          "id": "opt-a",
          "text": "...",
          "outcome": "...",
          "correct": false,
          "nextPhaseId": "phase-2"
        },
        {
          "id": "opt-b",
          "text": "...",
          "outcome": "...",
          "correct": true,
          "nextPhaseId": "phase-2"
        }
      ]
    },
    {
      "id": "phase-2",
      "title": "Containment",
      "type": "decision",
      "prompt": "...",
      "options": [ ... ],
      "isFinal": true
    }
  ]
}
```

Key schema decisions:
- `phases` is an ordered array; `nextPhaseId` on each option points to the next phase (or
  `null` if `isFinal: true`). Both correct and incorrect options advance to the next phase
  after showing the outcome — the learner sees the consequence and explanation before moving
  on. This matches the ASSESS-02 success criterion.
- `isFinal: true` on the last phase signals completion — triggers `progressStore.saveScenario()`.
- All string fields go through `esc()` before innerHTML injection.
- `complianceControls` at the scenario level (not per-option) for simplicity; the
  compliance index uses the top-level field.

[VERIFIED: existing 01.json placeholder; ASSUMED: multi-phase `nextPhaseId` extension — no
prior implementation to verify against]

### Pattern 2: Scenario View — Rendering Strategy

The scenario is rendered as a "single active phase at a time" UI. Only the current decision
node is interactive; completed nodes are shown as locked cards (same visual pattern as
step cards in exercise-view.js).

State machine:
1. Initial render: show `narrative` + first phase prompt + options as buttons
2. User clicks option: lock all option buttons, show `outcome` text below the clicked
   option, after 0ms delay show "Continue" button to advance
3. "Continue" advances to `nextPhaseId` or, if `isFinal`, triggers completion
4. Completion: `progressStore.saveScenario()`, disable all buttons, show completion banner,
   dynamic-import sidebar refresh

Re-visit mode: if `progressStore.getScenarioCompletion(moduleId, scenarioId) !== null`,
render all phases as locked cards immediately and show the completion banner — no
interaction possible (mirrors exercise-view.js re-visit mode).

```javascript
// Source: codebase pattern from exercise-view.js
export async function renderScenario({ moduleId, scenarioId }) {
  const app = document.getElementById('app');
  if (!app) return null;

  app.innerHTML = renderScenarioLoading();

  // safePath guard — same as exercise-view.js
  let url;
  try {
    url = import.meta.env.BASE_URL + 'data/modules/' + safePath(moduleId)
      + '/scenarios/' + safePath(scenarioId) + '.json';
  } catch { app.innerHTML = renderScenarioError(moduleId); return null; }

  let scenario;
  try {
    const res = await fetch(url);
    if (!res.ok) { app.innerHTML = renderScenarioError(moduleId); return null; }
    scenario = await res.json();
  } catch { app.innerHTML = renderScenarioError(moduleId); return null; }

  const priorCompletion = progressStore.getScenarioCompletion(moduleId, scenarioId);
  app.innerHTML = buildScenarioHtml(scenario, priorCompletion);
  activateIcons();

  if (priorCompletion) return null; // re-visit: locked, no event wiring needed

  // Wire phase-by-phase progression
  runScenarioFlow(app, scenario, moduleId, scenarioId);
  return null;
}
```

[VERIFIED: pattern derived from exercise-view.js in codebase]

### Pattern 3: Compliance Index — `compliance-index.json` Manifest

Runtime approach: Phase 6 authors a static `public/data/compliance-index.json` file that
maps every control ID to the content items that cover it. This avoids needing to parse
Markdown frontmatter in the browser at runtime and is trivially updated by content authors.

```json
{
  "schemaVersion": 1,
  "controls": [
    {
      "id": "TSA-Monitoring",
      "label": "TSA SD-02F — Continuous Monitoring",
      "items": [
        { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "intro",     "title": "Introduction to Windows Event Logs" },
        { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "ps-logging", "title": "Enabling PowerShell Script Block Logging" },
        { "type": "exercise", "moduleId": "logging-auditing", "contentId": "01",         "title": "Enable Script Block Logging" },
        { "type": "scenario", "moduleId": "logging-auditing", "contentId": "01",         "title": "Investigating a Suspicious Login" }
      ]
    },
    {
      "id": "NIST-AU-2",
      "label": "NIST SP 800-82 Rev 3 — AU-2: Event Logging",
      "items": [
        { "type": "lesson", "moduleId": "logging-auditing", "contentId": "intro", "title": "Introduction to Windows Event Logs" }
      ]
    }
  ]
}
```

The `compliance-index-view.js` fetches this file once, renders a grouped list with links.
Links use hash URLs:
- Lessons: `#/lesson/:moduleId/:contentId`
- Exercises: `#/exercise/:moduleId/:contentId`
- Scenarios: `#/scenario/:moduleId/:contentId`

The `label` field for TSA and NIST controls should display the human-readable name sourced
from `compliance-refs.json` (which is already loaded into `badge.js` via `setComplianceRefs`).
The compliance index view can call the same `setComplianceRefs` / `renderBadge` mechanism
or fetch `compliance-refs.json` independently.

[ASSUMED: exact `compliance-index.json` structure — content of this file is being designed
in this phase, not derived from an existing standard]

### Pattern 4: Completion Summary — Print Layout

```javascript
// completion-summary-view.js
export function renderCompletionSummary() {
  const app = document.getElementById('app');
  if (!app) return null;

  // Gather all progress data
  const store = progressStore; // read-only calls only

  // ... build HTML with @media print overrides inline or via style tag
  app.innerHTML = buildSummaryHtml();
  // Wire "Print" button
  app.querySelector('#print-btn')?.addEventListener('click', () => window.print());
  return null;
}
```

Print layout strategy (see Pitfalls section for CSS details):
- Insert a `<style>` block into the summary HTML that contains `@media print` rules
- Hide sidebar, nav, print button itself when printing
- Show learner name, module list, quiz scores, control IDs covered
- Explicit disclaimer: "This is a training log artifact. It does not constitute a
  compliance certification."

[VERIFIED: `window.print()` is standard browser API; `@media print` CSS is universally
supported — ASSUMED: no browser quirks specific to this layout; verified via MDN]

### Pattern 5: Router Extension

Three new routes added to `router.js`:

```javascript
// Add to routes array
{ pattern: '#/scenario/:moduleId/:scenarioId', view: 'scenario' },
{ pattern: '#/compliance-index',               view: 'compliance-index' },
{ pattern: '#/completion-summary',             view: 'completion-summary' },
```

Add corresponding renderers to `viewRenderers`:

```javascript
'scenario':          (params) => renderScenario(params),
'compliance-index':  (params) => renderComplianceIndex(params),
'completion-summary': (params) => renderCompletionSummary(params),
```

Add imports at the top of `router.js`:

```javascript
import { renderScenario }         from './views/scenario-view.js';
import { renderComplianceIndex }  from './views/compliance-index-view.js';
import { renderCompletionSummary } from './views/completion-summary-view.js';
```

[VERIFIED: existing router pattern in codebase]

### Pattern 6: `computeModuleProgress` — scenarioId branch

`quiz-engine.js`'s `computeModuleProgress` already handles `quizId` and `exerciseId` lesson
branches. Phase 6 adds a `scenarioId` branch for scenario-backed lessons:

```javascript
// In the loop over mod.lessons — add after exerciseId branch:
} else if (lesson.scenarioId) {
  const sc = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId);
  if (sc !== null) numerator++;
}
```

`modules-config.js` needs `scenarioId: '01'` added to the ps-logging or intro lesson of
`logging-auditing` (the lesson that links to the scenario). Decision for planner: which
lesson hosts the scenario link. Recommendation: add a dedicated `scenarios` lesson entry or
attach `scenarioId` to an existing lesson that lacks both `quizId` and `exerciseId`.

[VERIFIED: computeModuleProgress source; ASSUMED: which lesson to attach scenarioId to —
planner decides]

### Pattern 7: `modules-config.js` — scenarioId field

The lesson object shape needs a new optional field `scenarioId`:

```javascript
// logging-auditing lessons — add scenarioId to the intro lesson (no quiz/exercise)
{ id: 'intro', title: 'Introduction to Windows Event Logs', scenarioId: '01' }
```

The module-view.js must also show a "Start Scenario" link alongside the existing
"Start Exercise" link pattern, linking to `#/scenario/:moduleId/:scenarioId`.

[VERIFIED: modules-config.js does not yet have scenarioId; ASSUMED: intro lesson as host]

### Anti-Patterns to Avoid

- **XSS via scenario JSON fields:** Every field from scenario JSON (title, narrative, prompt,
  option text, outcome) must pass through `esc()` before insertion into innerHTML. No
  exceptions.
- **Circular import with sidebar.js:** Use `import('./sidebar.js').then(m => m.refreshSidebarProgress(moduleId))` — dynamic import only, never static. This is the
  established pattern in exercise-view.js and quiz-engine.js.
- **localStorage direct access:** All read/write through `progressStore` — never call
  `localStorage` directly in scenario-view.js, compliance-index-view.js, or
  completion-summary-view.js.
- **Hardcoded TSA version string:** Compliance index labels must reference `compliance-refs.json`
  values (via `badge.js` or the same data), not hardcode "SD-02F".
- **NERC CIP as binding:** Any NERC CIP mention in scenario content must include the scope
  disclaimer: "NERC CIP governs electric utilities; pipeline operators follow TSA directives
  — referenced here as a maturity benchmark."
- **Static import of sidebar in scenario-view:** The same circular-dep trap applies.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom canvas/jsPDF | `window.print()` + `@media print` CSS | Static site; browser does layout; no dependency |
| Markdown frontmatter parsing for index | Runtime YAML/TOML parser | `compliance-index.json` manifest | Avoids runtime parsing complexity; authors maintain manifest |
| Tree navigation state machine | Generic FSM library | Closure over `currentPhaseId` variable | The tree is shallow (2–4 phases); a simple variable suffices |
| Icon rendering | Direct SVG inline | `activateIcons()` (existing) | Already wired; consistent with all other views |
| Compliance badge rendering | Custom badge HTML | `renderBadge(directiveKey)` (existing) | DRY; already handles `compliance-refs.json` lookup |

**Key insight:** This phase is UI assembly, not algorithm engineering. Reuse existing
patterns from exercise-view.js rather than inventing new abstractions.

---

## Common Pitfalls

### Pitfall 1: Print CSS — Sidebar visible when printing

**What goes wrong:** `window.print()` captures the entire page including the sidebar. The
learner's printed output looks like a web screenshot, not a clean document.

**Why it happens:** `@media print` rules are not added for sidebar, nav, or non-summary
elements.

**How to avoid:** In `completion-summary-view.js`, inject a `<style>` tag scoped to the
summary that hides `#sidebar`, `#nav`, `.print-hide`, and any `position:fixed` elements
during print. The summary column should be `width: 100%` in `@media print`.

```css
@media print {
  #sidebar, .print-hide { display: none !important; }
  .lesson-wrapper { max-width: 100% !important; }
  body { background: white; color: black; }
}
```

[ASSUMED: exact sidebar element IDs — verify against DOM at implementation time]

**Warning signs:** Learner screenshot shows sidebar in the printed output.

### Pitfall 2: `window.print()` opens system dialog — no cancel hook

**What goes wrong:** Developer attempts to listen for "print cancelled" event to reset UI
state. No such event exists in a cross-browser way.

**Why it happens:** `window.print()` is synchronous on some browsers, async on others.
`afterprint` event exists but is not universally reliable.

**How to avoid:** Design the summary so no UI state change is needed around the print
action. The print button stays enabled before and after. Do not attempt to detect
cancellation.

[VERIFIED: `window.print()` / `afterprint` MDN documentation — ASSUMED for specific
browser behavior in Windows 11 context]

### Pitfall 3: Compliance index staleness — manifest out of sync with content

**What goes wrong:** A new lesson is added in Phase 7/8 with `complianceControls` in its
frontmatter, but `compliance-index.json` is not updated. The index silently omits the new
content.

**Why it happens:** The manifest is hand-maintained.

**How to avoid:** Include a comment in `compliance-index.json` explaining the update
contract, and add a note in `CLAUDE.md` (or a dedicated `CONTRIBUTING.md`) that any new
content with `complianceControls` must also update `compliance-index.json`. This is a
process fix, not a code fix — for v1 with a small content set, it is acceptable.

**Warning signs:** Compliance index links to only Module 1 content after Phase 7/8 ships.

### Pitfall 4: Scenario phase navigation — `nextPhaseId` lookup fails silently

**What goes wrong:** `nextPhaseId` in an option points to a phase ID that doesn't exist in
the `phases` array (typo in JSON). The scenario silently gets stuck after the user picks an
option.

**Why it happens:** No schema validation at fetch time.

**How to avoid:** After fetching scenario JSON, validate that every `nextPhaseId` referenced
in options resolves to a real phase in the `phases` array. If not, log an error and render
the scenario in an error state. This is a data authoring guard, not a runtime guarantee.

```javascript
function validateScenario(scenario) {
  const phaseIds = new Set((scenario.phases ?? []).map(p => p.id));
  for (const phase of scenario.phases ?? []) {
    for (const option of phase.options ?? []) {
      if (option.nextPhaseId && !phaseIds.has(option.nextPhaseId)) {
        return false; // broken reference
      }
    }
  }
  return true;
}
```

[ASSUMED: validation approach — no prior validator exists in the codebase to verify against]

### Pitfall 5: `esc()` on option `outcome` text — HTML entities double-escaped

**What goes wrong:** The `outcome` field in scenario JSON contains apostrophes or angle
brackets. Passing through `esc()` before innerHTML produces `&amp;lt;` double-escaping
if the outcome text is already HTML.

**Why it happens:** Scenario authors might attempt to write HTML in outcome text.

**How to avoid:** Enforce plain-text in scenario JSON (document in schema comments). All
scenario string fields are plain text, not HTML. `esc()` is always correct for plain text
values.

### Pitfall 6: `computeModuleProgress` — scenarioId branch ordering

**What goes wrong:** A lesson has both `scenarioId` and `exerciseId` set (data authoring
error). The `else if` chain only counts one.

**Why it happens:** The branch is an `else if` fallthrough — first match wins.

**How to avoid:** Document the lesson shape contract: a lesson may have at most one of
`quizId`, `exerciseId`, `scenarioId`. Validate in `computeModuleProgress` or enforce by
convention.

### Pitfall 7: Completion summary — learner name stored in localStorage vs. ephemeral

**What goes wrong:** The learner types their name for the summary. If the page reloads, the
name is gone. If stored in localStorage via `progressStore`, it persists but `progressStore`
has no `learnerName` field currently.

**Why it happens:** No decision made on name persistence.

**How to avoid:** For Phase 6 v1, the name is ephemeral (stored in a JS variable only, not
persisted). The summary is intended to be printed immediately. Document this in the UI: "Enter
your name for this session's training log." No `progressStore` API change needed for v1.

[ASSUMED: ephemeral name is sufficient — ASSESS-04 does not require name persistence]

---

## Code Examples

### Scenario fetch + validation guard

```javascript
// Source: pattern derived from exercise-view.js (codebase)
async function fetchScenario(moduleId, scenarioId) {
  try {
    const url = import.meta.env.BASE_URL
      + 'data/modules/' + safePath(moduleId)
      + '/scenarios/' + safePath(scenarioId) + '.json';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return validateScenario(data) ? data : null;
  } catch {
    return null;
  }
}
```

### Compliance index fetch

```javascript
// Source: pattern derived from content-loader.js (codebase)
async function fetchComplianceIndex() {
  try {
    const url = import.meta.env.BASE_URL + 'data/compliance-index.json';
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
```

### Print button wiring

```javascript
// Source: window.print() — native browser API [ASSUMED: no special config needed]
function wirePrintButton(appEl) {
  const btn = appEl.querySelector('#print-summary-btn');
  if (!btn) return;
  btn.addEventListener('click', () => window.print());
}
```

### Sidebar refresh (dynamic import — avoids circular dep)

```javascript
// Source: exercise-view.js completeExercise() — codebase
function completeScenario(moduleId) {
  progressStore.saveScenario(moduleId, scenarioId);
  import('../sidebar.js').then(m => m.refreshSidebarProgress(moduleId));
}
```

### `computeModuleProgress` — scenarioId extension

```javascript
// Source: quiz-engine.js computeModuleProgress() — codebase
} else if (lesson.scenarioId) {
  const sc = progressStore.getScenarioCompletion(mod.id, lesson.scenarioId);
  if (sc !== null) numerator++;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-rendered branching scenarios | Client-side JSON decision tree | Static hosting era | No backend required |
| jsPDF for printable certificates | `window.print()` + CSS | Browser print matured ~2018 | Zero dependency, native fidelity |
| Global YAML parser for frontmatter | Pre-authored JSON manifests | Static site pattern | No runtime parser needed |

**Not applicable / out of scope:**
- xterm.js: not used here (scenario has no terminal interaction)
- Gamification: explicitly out of scope per REQUIREMENTS.md

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Multi-phase scenario with `nextPhaseId` linking is the right extension of the existing placeholder schema | Architecture Patterns — Pattern 1 | If wrong, the schema needs redesign; existing placeholder is compatible with this extension |
| A2 | `intro` lesson in logging-auditing is the right host for `scenarioId: '01'` | Pattern 7 | Planner may decide to use a different lesson or add a dedicated scenario lesson entry |
| A3 | Learner name for completion summary is ephemeral (not persisted) | Pitfall 7 | If ASSESS-04 is interpreted as requiring name persistence, `progressStore` needs a new field |
| A4 | The `outcome` for incorrect scenario options still advances to `nextPhaseId` (show consequence, then continue) | Pattern 1 | If wrong options should dead-end or loop, the schema needs a `nextPhaseId: null` dead-end handler |
| A5 | `@media print` CSS injected via `<style>` in the summary view is sufficient for clean output | Pitfall 1 | If the global CSS from Tailwind/Vite overrides it, a `!important` cascade or `<style>` tag injection at head level may be needed |
| A6 | `compliance-index.json` is hand-maintained for v1 | Pattern 3 | If content volume grows quickly (Phase 7/8 adds 3 modules), manual maintenance becomes error-prone; acceptable for v1 |

---

## Open Questions (RESOLVED)

1. **Which lesson owns the scenarioId field?**
   - What we know: `logging-auditing` has `intro` (no quiz/exercise), `ps-logging` (exerciseId: '01'), `audit-policies` (quizId: '01')
   - What's unclear: Should the scenario attach to `intro` (keeping it simple) or should a new scenario-specific lesson entry be added?
   - Recommendation: Attach `scenarioId: '01'` to the `intro` lesson for v1. The `computeModuleProgress` branch order (quizId > exerciseId > scenarioId > visited) means `intro` currently counts as visited-based; adding `scenarioId` upgrades its completion signal.
   - RESOLVED: `scenarioId: '01'` attached to the `intro` lesson in `modules-config.js` (Plan 06-03).

2. **How many phases should the Phase 6 scenario have?**
   - What we know: ASSESS-02 requires "at least two decision branches" — the existing placeholder has one phase
   - What's unclear: Optimal depth for a learning scenario (more phases = more learning, more authoring work)
   - Recommendation: 2–3 phases for the Module 1 scenario. Each phase adds one decision. This satisfies ASSESS-02 without over-engineering the authoring.
   - RESOLVED: 2-phase scenario implemented in `scenarios/01.json` (Plan 06-01), satisfying ASSESS-02 minimum.

3. **Should the compliance index link to lesson-level anchors (e.g., `#/lesson/logging-auditing/intro#nist-au-2`)?**
   - What we know: Current router is hash-based; hash-within-hash (`#/lesson/...#anchor`) would conflict with the routing scheme
   - What's unclear: Whether per-control anchor links inside lessons are expected
   - Recommendation: Link to the lesson/exercise/scenario page, not to anchors within. The compliance index says "this lesson covers NIST-AU-2" — the learner navigates to the lesson to find the content. This avoids the hash-within-hash problem entirely.
   - RESOLVED: Page-level links only (no anchors) implemented in `compliance-index-view.js` (Plan 06-03).

4. **What does "completing all branches" mean for ASSESS-02?**
   - What we know: ASSESS-02 says "Completing all branches of a scenario records completion and outcome data"
   - What's unclear: Does "all branches" mean the learner must explore every option path, or just reach the final node?
   - Recommendation: Mark complete when the learner reaches `isFinal: true`, regardless of which option they chose at each node. The learner reads all outcomes (correct and incorrect) before advancing, so all content is exposed. Requiring exhaustive branch traversal would require multi-session state tracking — disproportionate complexity for v1.
   - RESOLVED: Completion triggered on `isFinal: true` node reached — implemented in `scenario-view.js` (Plan 06-02).

---

## Environment Availability

Step 2.6: All dependencies are already installed in the project. No new external tools
required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, Vitest | Yes | v24.15.0 | — |
| npm | Package manager | Yes | 11.12.1 | — |
| Vitest | Test runner | Yes | ^4.1.6 (in devDeps) | — |
| Browser `window.print()` | Completion summary | Yes (native API) | All modern browsers | — |
| `@media print` CSS | Print layout | Yes (native CSS) | All modern browsers | — |

No missing dependencies. No blocking items.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.6 + happy-dom ^20.9.0 |
| Config file | `vitest.config.js` (root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (single pass — no separate watch mode configured) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSESS-02 | Scenario fetches JSON and renders narrative + first phase | unit | `npm test -- --reporter=verbose` (scenario-view.test.js) | No — Wave 0 |
| ASSESS-02 | Picking an option locks buttons and shows outcome text | unit | scenario-view.test.js | No — Wave 0 |
| ASSESS-02 | Reaching isFinal phase calls `progressStore.saveScenario` | unit | scenario-view.test.js | No — Wave 0 |
| ASSESS-02 | Re-visit mode shows locked state when `getScenarioCompletion !== null` | unit | scenario-view.test.js | No — Wave 0 |
| SHELL-04 | `compliance-index-view.js` renders a link for each control item | unit | compliance-index-view.test.js | No — Wave 0 |
| SHELL-04 | Compliance index fetches `compliance-index.json` with BASE_URL prefix | unit | compliance-index-view.test.js | No — Wave 0 |
| ASSESS-04 | Completion summary reads `progressStore` and renders quiz scores | unit | completion-summary-view.test.js | No — Wave 0 |
| ASSESS-04 | Print button calls `window.print()` | unit | completion-summary-view.test.js | No — Wave 0 |
| ASSESS-04 | Summary HTML contains "training log artifact" label | unit | completion-summary-view.test.js | No — Wave 0 |
| Router | `#/scenario/:moduleId/:scenarioId` matches scenario view | unit | router.test.js (extend existing) | Yes — extend |
| Router | `#/compliance-index` matches compliance-index view | unit | router.test.js | Yes — extend |
| Router | `#/completion-summary` matches completion-summary view | unit | router.test.js | Yes — extend |
| computeModuleProgress | scenarioId branch counts completion correctly | unit | quiz-engine.test.js (extend existing) | Yes — extend |

### Sampling Rate

- **Per task commit:** `npm test` (148 tests currently pass in ~2.5s; should stay under 5s)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/scenario-view.test.js` — covers ASSESS-02 scenario rendering and completion
- [ ] `tests/compliance-index-view.test.js` — covers SHELL-04 index rendering
- [ ] `tests/completion-summary-view.test.js` — covers ASSESS-04 summary + print button
- [ ] `public/data/compliance-index.json` — manifest file (Wave 0 data artifact)
- [ ] `public/data/modules/logging-auditing/scenarios/01.json` — upgrade from placeholder to full 2-phase tree (Wave 0 data artifact)

---

## Security Domain

`security_enforcement` is not explicitly set to `false` in `.planning/config.json` — treated
as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Static site; no auth |
| V3 Session Management | No | No server sessions |
| V4 Access Control | No | No access-gated content |
| V5 Input Validation | Yes | `safePath()` on all URL path segments; `esc()` on all JSON string fields before innerHTML |
| V6 Cryptography | No | No crypto operations |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via `moduleId`/`scenarioId` URL params | Tampering | `safePath()` allowlist — `/^[a-zA-Z0-9_-]+$/` — already used in exercise-view.js |
| XSS via scenario JSON string fields (title, narrative, option text, outcome) | Tampering | `esc()` from `src/utils/escape.js` on all fields before innerHTML |
| XSS via learner-entered name in completion summary | Tampering | `esc()` on name before innerHTML; or use `textContent` assignment |
| XSS via compliance-index.json string fields | Tampering | `esc()` on all `label`, `title` fields before innerHTML |
| Hash injection via compliance-index item `contentId` | Tampering | `safePath()` validation on `contentId` before building hash links |

**Critical rule for scenario-view.js:** The `outcome` field in option JSON may contain
apostrophes, quotes, or other special characters from realistic compliance scenario prose.
Always `esc()` before innerHTML. If `textContent` is used instead, `esc()` is unnecessary
but `textContent` cannot render bold/italic — plain text only.

---

## Project Constraints (from CLAUDE.md)

- NERC CIP does NOT apply to pipeline operators — never frame it as binding in scenario
  content. Include scope disclaimer if referenced.
- TSA directive version string is currently "SD-02F". Never hardcode this in scenario JSON
  or compliance index labels — reference `compliance-refs.json` values.
- No backend, no real PowerShell execution. Scenario engine is entirely client-side.
- PS version target 5.1 — relevant for any PowerShell command examples in scenario content.
- All environment identifiers in scenario content must be generic: `PIPELINE-DC01`,
  `10.0.0.0/24`, `ExampleCorp`.
- Every OT-relevant scenario must have an explicit "In OT environments:" callout within the
  scenario content.
- All localStorage access exclusively through `progressStore`.
- `esc()` applied to all JSON-derived strings before innerHTML injection.
- `import.meta.env.BASE_URL` prefix on all `public/data/` fetches.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `src/views/exercise-view.js` — scenario-view.js mirrors this exact pattern
- Codebase: `src/quiz-engine.js` — computeModuleProgress extension pattern
- Codebase: `src/progress-store.js` — saveScenario, getScenarioCompletion already
  implemented with correct signatures
- Codebase: `src/router.js` — route registration and viewRenderers pattern
- Codebase: `public/data/modules/logging-auditing/scenarios/01.json` — existing placeholder
  schema
- Codebase: `public/data/compliance-refs.json` — TSA/NIST canonical data structure
- Codebase: `package.json`, `vitest.config.js` — test framework confirmed (Vitest 4.1.6,
  happy-dom, 13 test files, 148 tests passing)

### Secondary (MEDIUM confidence)

- MDN Web Docs (implied): `window.print()` and `@media print` — standard browser APIs,
  universally supported
- MDN Web Docs (implied): `afterprint` event unreliability — documented browser
  inconsistency

### Tertiary (LOW confidence)

- None — all critical claims verified against codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in project; no new installs
- Architecture (scenario engine): HIGH — directly mirrors exercise-view.js pattern verified in codebase
- Architecture (compliance index): HIGH — fetch pattern verified; manifest content design is ASSUMED
- Architecture (completion summary): HIGH — `window.print()` is native; layout details are ASSUMED
- Pitfalls: HIGH — XSS and circular-dep pitfalls derived from existing codebase patterns; print pitfalls are MEDIUM (ASSUMED browser behavior)

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable stack; no fast-moving dependencies)
