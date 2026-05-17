# Phase 2: Content Loader + Lesson Rendering + Module 1 - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 11 (4 new JS/test, 4 modified JS/CSS, 3 new content files in scope)
**Analogs found:** 10 / 11

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `src/content-loader.js` | service | request-response + transform | `src/main.js` (`loadComplianceRefs`) | role-match |
| `src/views/lesson-view.js` | view/component | request-response | `src/views/module-view.js` | exact |
| `tests/content-loader.test.js` | test | — | `tests/compliance-refs.test.js` | role-match |
| `tests/lesson-view.test.js` | test | — | `tests/sidebar.test.js` | role-match |
| `src/router.js` *(modify)* | router | request-response | self (existing) | exact |
| `src/sidebar.js` *(modify)* | component | request-response | self (existing) | exact |
| `src/main.js` *(modify)* | entry/init | — | self (existing) | exact |
| `src/style.css` *(modify)* | config/styles | — | self (existing) | exact |
| `public/data/modules/logging-auditing/module.json` | data/config | — | none (new shape) | no analog |
| `public/data/modules/logging-auditing/lessons/*.md` | content | — | none (new content) | no analog |
| `public/data/modules/logging-auditing/{quizzes,exercises,scenarios}/*.json` | data/config | — | none (new) | no analog |

---

## Pattern Assignments

### `src/content-loader.js` (service, request-response + transform)

**Analog:** `src/main.js` — `loadComplianceRefs()` function (lines 11–22)
**Secondary analog for fetch pattern:** `src/main.js` shows `import.meta.env.BASE_URL` prefix pattern, try/catch fetch, and singleton cache (`complianceRefs`).

**Imports pattern** — copy from `src/main.js` lines 1–5, extend for new deps:
```javascript
// Reuses same BASE_URL + fetch + try/catch skeleton as loadComplianceRefs()
// Add new imports on top:
import { createHighlighter } from 'shiki';
import { marked } from 'marked';
import { esc } from './utils/escape.js';
```

**Singleton cache pattern** — copy from `src/main.js` lines 9, 24–26:
```javascript
// main.js lines 9 + 24-26 — exact cache pattern to reuse
let complianceRefs = null;          // → rename to _highlighter / _lessonCache

export function getComplianceRefs() {
  return complianceRefs;            // → same getter pattern for getHighlighter()
}
```

**Fetch + error handling pattern** — copy from `src/main.js` lines 11–22:
```javascript
// main.js lines 11-22
export async function loadComplianceRefs() {
  const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    complianceRefs = await res.json();
    setComplianceRefs(complianceRefs);
    return complianceRefs;
  } catch {
    return null;
  }
}
// Phase 2 analog: fetchLesson(moduleId, lessonId) uses the identical
// BASE_URL + path construction, try/catch, and res.ok guard.
// HEAD fetch for checkLessonAvailability() uses same skeleton
// with { method: 'HEAD' } and returns res.ok boolean.
```

**esc() usage pattern** — copy from `src/views/module-view.js` lines 39–45 (any template string):
```javascript
// module-view.js lines 39, 45 — canonical esc() usage in template strings
<i data-lucide="${esc(mod.icon.toLowerCase())}" ...></i>
<h1 ...>${esc(mod.title)}</h1>
// In content-loader.js: esc(token.text) for data-code attribute,
// esc(displayLang) for language label in code block header
```

**What is new (no codebase analog):**
- `parseFrontmatter(raw)` — pure string split on `---` delimiters; no analog exists
- `marked.use({ async: true, walkTokens, renderer: { code, blockquote } })` — no marked usage exists yet
- Shiki `createHighlighter` singleton — no Shiki usage exists yet
- In-memory lesson cache (`Map` keyed by `moduleId/lessonId`) — new pattern

---

### `src/views/lesson-view.js` (view/component, request-response)

**Analog:** `src/views/module-view.js` — closest structural match (named export, same imports, param destructuring, error fallback, template string return).

**Imports pattern** — copy from `src/views/module-view.js` lines 1–3:
```javascript
// module-view.js lines 1-3
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../badge.js';
import { esc } from '../utils/escape.js';
// lesson-view.js adds:
import { fetchLesson, parseFrontmatter, renderMarkdown } from '../content-loader.js';
import { setActiveLesson } from '../sidebar.js';
import { activateIcons } from '../main.js';   // or a shared icons module
```

**View export + param destructuring pattern** — copy from `src/views/module-view.js` lines 25–27:
```javascript
// module-view.js lines 25-27
export function renderModule({ moduleId }) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return renderModuleNotFound();
// lesson-view.js analog:
export async function renderLesson({ moduleId, lessonId }) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return renderLessonNotFound();
```

**Not-found fallback pattern** — copy from `src/views/module-view.js` lines 62–69:
```javascript
// module-view.js lines 62-69
function renderModuleNotFound() {
  // Static text only — never inject moduleId (hash-derived) into innerHTML (T-03-01)
  return `
    <section style="padding: var(--spacing-xl);">
      <p style="font-size: var(--text-body); color: var(--color-text-muted);">Module not found.</p>
    </section>
  `;
}
// lesson-view.js: same shape for renderLessonNotFound() and renderLessonError()
// CRITICAL: never inject moduleId or lessonId (hash-derived) into innerHTML
```

**Compliance badge row pattern** — copy from `src/views/module-view.js` lines 48–53:
```javascript
// module-view.js lines 48-53
<div style="margin-bottom: var(--spacing-lg);">
  <p style="font-size: var(--text-body); font-weight: 600; text-transform: uppercase;
             letter-spacing: 0.08em; color: var(--color-text-muted);
             margin-bottom: var(--spacing-xs);">COMPLIANCE CONTROLS COVERED</p>
  <div style="display: flex; gap: var(--spacing-xs);">
    ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
  </div>
</div>
// lesson-view.js: replace mod.complianceTags with meta.complianceTags from frontmatter
```

**Layout container pattern** — copy from `src/views/home-view.js` lines 25–26:
```javascript
// home-view.js lines 25-26 — centered max-width layout with xl padding
<section style="padding: var(--spacing-xl); max-width: 800px; margin: 0 auto;">
// lesson-view.js: same but max-width: 720px per D-04
```

**Active state pattern** — copy from `src/sidebar.js` lines 70–74 (`setActiveModule` active branch):
```javascript
// sidebar.js lines 70-74
link.style.borderLeftColor = 'var(--color-accent)';
link.style.background = 'rgba(249, 115, 22, 0.08)';
link.style.color = 'var(--color-accent)';
// setActiveLesson() uses identical 3-property active style applied to
// sidebar lesson <a> elements (not module links)
```

**What is new (no codebase analog):**
- `async` view function (all existing views are synchronous)
- Loading skeleton render before fetch
- `getLessonNav(moduleId, lessonId)` prev/next computation from MODULES array
- Clipboard event delegation on `.lesson-wrapper`
- `setActiveLesson()` call after render

---

### `tests/content-loader.test.js` (test)

**Analog:** `tests/compliance-refs.test.js` — pure-data unit test structure.
**Secondary analog:** `tests/router.test.js` — pure-function import + describe/it/expect pattern.

**File header + imports pattern** — copy from `tests/compliance-refs.test.js` lines 1–12:
```javascript
// compliance-refs.test.js lines 1-4
import { describe, it, expect } from 'vitest'
// For content-loader.test.js, no fs/readFileSync needed — import functions directly:
import { parseFrontmatter } from '../src/content-loader.js'
// For renderMarkdown (async + Shiki), either:
//   a) mock getHighlighter, or
//   b) import { renderMarkdown } and mark test as requiring shiki installed
```

**Describe/it/expect structure** — copy from `tests/router.test.js` lines 7–23:
```javascript
// router.test.js lines 7-23
describe('matchRoute', () => {
  it('matches root hash to home view', () => {
    expect(matchRoute('#/')).toEqual({ view: 'home', params: {} })
  })
  it('returns not-found for unknown hash', () => {
    expect(matchRoute('#/unknown').view).toBe('not-found')
  })
})
// content-loader.test.js follows same describe('parseFrontmatter') + it() structure
// For async tests: it('renders markdown', async () => { ... })
```

**DOM assertion pattern** — copy from `tests/sidebar.test.js` lines 7–9 (array length assertions):
```javascript
// sidebar.test.js lines 7-9
it('MODULES array has exactly 5 entries', () => {
  expect(MODULES).toHaveLength(5)
})
// content-loader.test.js: rendered HTML string assertions use .toContain()
// e.g., expect(html).toContain('class="ot-callout"')
//       expect(html).toContain('class="code-copy-btn"')
```

**Test cases to cover (from RESEARCH.md Validation Architecture):**
1. `parseFrontmatter()` extracts all 6 frontmatter fields correctly
2. `parseFrontmatter()` returns `{ meta: {}, body: raw }` when no frontmatter
3. `parseFrontmatter()` handles missing close delimiter gracefully
4. `renderMarkdown()` returns an HTML string for valid Markdown (mock `getHighlighter`)
5. Copy button present in code block HTML output
6. `getLessonNav()` returns correct prev/next for first/middle/last lesson
7. OT callout `> [!OT]` renders as `.ot-callout`, not `<blockquote>`
8. Standard blockquote (no `[!OT]`) renders as `<blockquote>`

---

### `tests/lesson-view.test.js` (test)

**Analog:** `tests/sidebar.test.js` — happy-dom DOM test structure with `beforeEach`.

**DOM setup pattern** — copy from `tests/sidebar.test.js` lines 4–6:
```javascript
// sidebar.test.js lines 4-6
import { describe, it, expect, beforeEach } from 'vitest'
// lesson-view.test.js: add vi.mock for content-loader + navigator.clipboard mock
import { describe, it, expect, beforeEach, vi } from 'vitest'
```

**Navigator mock pattern** — no codebase analog exists; use Vitest vi.stubGlobal:
```javascript
// No existing analog — new pattern for this project:
beforeEach(() => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
  });
});
```

**Test cases to cover:**
1. Compliance badge row renders when `complianceTags` is non-empty
2. Compliance badge row absent when `complianceTags` is empty
3. Copy button present in rendered code block HTML
4. `navigator.clipboard.writeText` called with correct code on button click

---

### `src/router.js` (modify — add lesson route + renderLesson)

**Self-analog** — existing file is the complete pattern. Read lines 1–54.

**Route array pattern** — copy from `src/router.js` lines 7–11:
```javascript
// router.js lines 7-11
const routes = [
  { pattern: '#/',                 view: 'home' },
  { pattern: '#/module/:moduleId', view: 'module' },
  // Phase 2+ will add: { pattern: '#/lesson/:moduleId/:lessonId', view: 'lesson' }
];
// Phase 2: uncomment/add:
  { pattern: '#/lesson/:moduleId/:lessonId', view: 'lesson' },
```

**viewRenderers pattern** — copy from `src/router.js` lines 37–41:
```javascript
// router.js lines 37-41
const viewRenderers = {
  home:        (params) => renderHome(params),
  module:      (params) => renderModule(params),
  'not-found': (params) => renderNotFound(params),
};
// Add:
  lesson:      (params) => renderLesson(params),
// NOTE: renderLesson is async — handleRoute() must await it:
//   app.innerHTML = await renderer(params);
```

**handleRoute async upgrade** — currently line 48 is synchronous:
```javascript
// router.js line 48 — currently:
app.innerHTML = renderer(params);
// Phase 2: must become async (renderLesson awaits fetch + Shiki):
app.innerHTML = await renderer(params);
// AND export function handleRoute() becomes async function handleRoute()
```

**lucide replacement** — currently lines 51–53:
```javascript
// router.js lines 51-53 — replace:
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
// With bundled import call (see Shared Patterns: Lucide Migration below)
```

---

### `src/sidebar.js` (modify — async initSidebar + setActiveLesson)

**Self-analog** — existing file is the complete pattern. Read lines 1–88.

**Lesson item render target** — copy from `src/sidebar.js` lines 20–27:
```javascript
// sidebar.js lines 20-27 — current disabled span to replace:
${mod.lessons.map(lesson => `
  <span aria-disabled="true"
        aria-label="${esc(lesson.title)} — available in Phase 2"
        style="display: block; padding: var(--spacing-xs) var(--spacing-sm);
               font-size: var(--text-body); color: var(--color-text-muted);
               opacity: 0.4; pointer-events: none; cursor: default;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
    ${esc(lesson.title)}
  </span>
`).join('')}
// Phase 2 replaces with conditional: available → <a href="..."> / unavailable → <span>
// data-lesson-id attribute added for setActiveLesson() querySelector
```

**setActiveModule pattern to mirror in setActiveLesson** — copy from `src/sidebar.js` lines 57–88:
```javascript
// sidebar.js lines 57-88 — setActiveModule is the exact template for setActiveLesson:
export function setActiveModule(moduleId) {
  document.querySelectorAll('.sidebar-module').forEach(el => {
    const id       = el.dataset.moduleId;
    const isActive = id === moduleId;
    const link     = el.querySelector('a');
    el.classList.toggle('sidebar-module--active', isActive);
    if (isActive) {
      el.setAttribute('aria-current', 'page');
    } else {
      el.removeAttribute('aria-current');
    }
    if (link) {
      if (isActive) {
        link.style.borderLeftColor = 'var(--color-accent)';
        link.style.background = 'rgba(249, 115, 22, 0.08)';
        link.style.color = 'var(--color-accent)';
      } else {
        link.style.borderLeftColor = 'transparent';
        link.style.background = '';
        link.style.color = 'var(--color-text-primary)';
      }
    }
  });
}
// setActiveLesson(moduleId, lessonId): querySelectorAll('.sidebar-lesson-link')
// filter by data-module-id + data-lesson-id, apply same 3-property active style
```

**lucide replacement** — sidebar lines 31–34, same replacement as router.js:
```javascript
// sidebar.js lines 31-34 — replace:
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
// With: activateIcons() from shared icons module
```

---

### `src/main.js` (modify — lucide migration + await initSidebar)

**Self-analog** — existing file lines 1–34.

**init() async pattern** — copy from `src/main.js` lines 28–32:
```javascript
// main.js lines 28-32
async function init() {
  await loadComplianceRefs();
  handleRoute();
  initSidebar();        // Phase 2: becomes: await initSidebar();
}
// initSidebar is now async (HEAD fetches); must be awaited before first render
// or called in parallel: await Promise.all([handleRoute(), initSidebar()])
```

**Import addition pattern** — copy from `src/main.js` lines 1–4:
```javascript
// main.js lines 1-4 — extend with lucide named imports:
import { handleRoute } from './router.js';
import { initSidebar } from './sidebar.js';
import { setComplianceRefs, renderBadge } from './badge.js';
import './style.css';
// Add:
import { createIcons, BookOpen, Shield, Users, AlertTriangle, Wrench,
         ChevronLeft, Copy, Check, AlertCircle } from 'lucide';
export function activateIcons() {
  createIcons({ icons: { BookOpen, Shield, Users, AlertTriangle, Wrench,
                          ChevronLeft, Copy, Check, AlertCircle } });
}
```

---

### `src/style.css` (modify — add Phase 2 tokens + component CSS)

**Self-analog** — existing file lines 1–73.

**@theme token addition pattern** — copy from `src/style.css` lines 3–43:
```css
/* style.css lines 3-43 — all tokens live inside the single @theme block.
   Phase 2 additions go INSIDE this same @theme block, not outside it.
   New tokens needed for Phase 2: */
@theme {
  /* ... existing tokens ... */

  /* Phase 2: Lesson layout */
  --lesson-prose-max-width: 720px;

  /* Phase 2: OT callout */
  --color-ot-callout-border: #d97706;   /* amber-600 — distinct from accent orange */
  --color-ot-callout-bg: rgba(180, 120, 0, 0.06);
  --color-ot-callout-label: #d97706;

  /* Phase 2: Code block */
  --color-code-header-bg: #111111;      /* darker than bg-base */
  --color-code-lang-label: #a3a3a3;
}
```

**Component CSS pattern** — copy `src/style.css` lines 45–72 (existing component blocks):
```css
/* style.css lines 45-67 — component blocks follow same flat pattern:
   selector { property: value; } — no nested rules, no @layer */
.sidebar-lessons {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease;
}
/* Phase 2 adds analogous flat blocks:
   .lesson-wrapper { ... }
   .lesson-body { ... }
   .code-block { ... }
   .code-block-header { ... }
   .code-block-body { ... }
   .ot-callout { ... }
   .ot-callout-label { ... }
   .sidebar-lesson-link { ... }
   .sidebar-lesson-link--active { ... }    (mirrors sidebar-module--active)
*/
```

---

## Shared Patterns

### Lucide Migration (CDN → npm bundle)

**Source:** `src/router.js` lines 51–53 + `src/sidebar.js` lines 31–34 (both show the CDN pattern to replace)
**Apply to:** `src/router.js`, `src/sidebar.js`, `src/main.js`, `src/views/lesson-view.js`

Replace this pattern (in both router.js and sidebar.js):
```javascript
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
```
With a call to `activateIcons()` exported from `src/main.js` (or a shared `src/icons.js` module):
```javascript
// New shared export — add to src/main.js or extract to src/icons.js:
import { createIcons, BookOpen, Shield, Users, AlertTriangle, Wrench,
         ChevronLeft, Copy, Check, AlertCircle } from 'lucide';
export function activateIcons() {
  createIcons({
    icons: { BookOpen, Shield, Users, AlertTriangle, Wrench,
             ChevronLeft, Copy, Check, AlertCircle },
  });
}
```
Also remove `<script src="https://unpkg.com/lucide@...">` from `index.html`.

---

### BASE_URL Fetch Pattern

**Source:** `src/main.js` lines 12–22 (`loadComplianceRefs`)
**Apply to:** `src/content-loader.js` (`fetchLesson`, `checkLessonAvailability`), `src/sidebar.js` (`initSidebar` HEAD fetches)

```javascript
// main.js lines 12-22 — canonical fetch template for all public/data/ requests:
const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
try {
  const res = await fetch(url);
  if (!res.ok) return null;
  // process res...
} catch {
  return null;
}
// content-loader.js maps to:
//   BASE_URL + `data/modules/${moduleId}/lessons/${lessonId}.md`
// sidebar.js HEAD fetch maps to:
//   fetch(url, { method: 'HEAD' }) → return res.ok
```

---

### esc() Usage — Template Strings

**Source:** `src/views/module-view.js` lines 32, 39, 40, 45, 51; `src/sidebar.js` lines 10–11, 17, 22
**Apply to:** `src/views/lesson-view.js`, `src/content-loader.js` (code renderer template strings)

```javascript
// sidebar.js lines 10-11 — data attribute + aria-label pattern:
<div class="sidebar-module" data-module-id="${esc(mod.id)}">
<a href="#/module/${esc(mod.id)}" aria-label="${esc(mod.title)}"

// module-view.js lines 39, 45 — icon + heading:
<i data-lucide="${esc(mod.icon.toLowerCase())}"></i>
<h1>${esc(mod.title)}</h1>

// RULE: Every data-derived value in a template literal uses esc().
// Exception: Markdown body HTML from marked.parse() is trusted content
// (authored in repo, not user input) — no esc() on rendered HTML.
// Frontmatter values (title, lessonId, moduleId) MUST use esc().
```

---

### Active State Styling

**Source:** `src/sidebar.js` lines 70–79 (`setActiveModule` active branch)
**Apply to:** `src/sidebar.js` (`setActiveLesson`), lesson links in sidebar HTML

```javascript
// sidebar.js lines 70-79 — exact 3-property active style (copy verbatim):
link.style.borderLeftColor = 'var(--color-accent)';
link.style.background = 'rgba(249, 115, 22, 0.08)';
link.style.color = 'var(--color-accent)';

// Inactive reset (lines 75-79):
link.style.borderLeftColor = 'transparent';
link.style.background = '';
link.style.color = 'var(--color-text-primary)';

// D-11 locks this as the lesson-active style — same as module-active, no new visual language.
```

---

### View Not-Found Fallback

**Source:** `src/views/module-view.js` lines 62–69
**Apply to:** `src/views/lesson-view.js` (module-not-found + lesson-not-found + fetch-error states)

```javascript
// module-view.js lines 62-69
function renderModuleNotFound() {
  // Static text only — never inject moduleId (hash-derived) into innerHTML (T-03-01)
  return `
    <section style="padding: var(--spacing-xl);">
      <p style="font-size: var(--text-body); color: var(--color-text-muted);">Module not found.</p>
    </section>
  `;
}
// lesson-view.js: renderLessonNotFound() and renderLessonError() follow same shape.
// CRITICAL: never include moduleId or lessonId in the error message HTML.
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/data/modules/logging-auditing/module.json` | data/config | — | No existing JSON data files with this shape; use schema from RESEARCH.md lines 506–523 |
| `public/data/modules/logging-auditing/lessons/*.md` | content | — | No existing lesson Markdown in codebase; use frontmatter template from RESEARCH.md lines 492–499 |
| `public/data/modules/logging-auditing/{quizzes,exercises,scenarios}/*.json` | data/config | — | Placeholder JSON shapes defined only in RESEARCH.md lines 571–656; no codebase analog |

---

## Key Observations for Planner

1. **handleRoute() must become async.** Currently `app.innerHTML = renderer(params)` (line 48, router.js) is synchronous. Phase 2's `renderLesson()` is async (awaits fetch + Shiki). Upgrade `handleRoute` to `async function handleRoute()` and add `await` before `renderer(params)`.

2. **initSidebar() must become async.** Currently called without await in `main.js` line 31. Phase 2's HEAD fetch loop requires `await initSidebar()` or `Promise.all([handleRoute(), initSidebar()])` for parallel init.

3. **lucide CDN must be removed from index.html simultaneously with adding npm import.** Both sidebar.js and router.js reference `typeof lucide !== 'undefined'` — both must be updated in the same wave as `index.html` CDN tag removal to avoid a broken state.

4. **All existing views are synchronous template functions.** lesson-view.js is the first async view — its return type changes to `Promise<string>`. The viewRenderers dispatch in router.js must `await` the result.

5. **marked.use() must be called once at module load time** (module-level side effect in content-loader.js), not inside renderMarkdown(). Calling marked.use() on every render would add duplicate renderers.

6. **Lesson file path contract is locked:** `{lessonId}.md` (no numeric prefix). File names must be `intro.md`, `ps-logging.md`, `audit-policies.md` to match MODULES config IDs.

---

## Metadata

**Analog search scope:** `src/`, `src/views/`, `src/utils/`, `tests/`
**Files scanned:** 10 source files read in full
**Pattern extraction date:** 2026-05-11
