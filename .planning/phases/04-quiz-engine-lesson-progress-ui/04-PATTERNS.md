# Phase 4: Quiz Engine + Lesson Progress UI - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 9 (1 new source, 3 modified source, 1 modified data, 2 new tests, 1 extended test, 1 modified config)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/quiz-engine.js` | service/renderer | request-response + event-driven | `src/views/lesson-view.js` | role-match (fetch + DOM inject + event delegation) |
| `src/views/lesson-view.js` | view | request-response | self (modify Step 5) | exact |
| `src/sidebar.js` | component | event-driven + CRUD read | self (modify post-init block) | exact |
| `src/views/module-view.js` | view | CRUD read | self (full content rewrite) | exact |
| `src/modules-config.js` | config | — | self (add `quizId` field) | exact |
| `src/utils/icons.js` | utility | — | self (add 2 icon names) | exact |
| `public/data/modules/logging-auditing/lessons/audit-policies.md` | data | — | other lessons in same dir | exact |
| `tests/quiz-engine.test.js` | test | — | `tests/sidebar-progress.test.js` | exact |
| `tests/sidebar.test.js` (extend) | test | — | self (extend) | exact |
| `tests/module-view.test.js` | test | — | `tests/lesson-view.test.js` | role-match |

---

## Pattern Assignments

### `src/quiz-engine.js` (service/renderer, request-response + event-driven)

**Primary analog:** `src/views/lesson-view.js`
**Secondary analog for event delegation:** `src/views/lesson-view.js` `attachCopyHandlers()` (lines 194-227)

**Imports pattern** — copy from `src/views/lesson-view.js` lines 6-12:
```javascript
import { esc } from './utils/escape.js';
import { activateIcons } from './utils/icons.js';
import { progressStore } from './progress-store.js';
// (no router import — quiz-engine has no routing awareness)
```

**Fetch pattern** — copy from `src/views/lesson-view.js` lines 46-53 (fetchLesson structure), adapted for quiz JSON:
```javascript
// lesson-view.js pattern: async fetch + null-on-failure
const raw = await fetchLesson(moduleId, lessonId);
if (raw === null) {
  if (app) { app.innerHTML = renderLessonError('not-found'); }
  return null;
}
// Quiz-engine adaptation: silent null return (quiz is supplementary)
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

**Null-guard pattern (WR-04)** — copy from `src/views/lesson-view.js` lines 26-29 and 39-43:
```javascript
// lesson-view.js: null-guard on app element before every DOM write
if (!moduleId || !lessonId) {
  const app = document.getElementById('app');
  if (app) app.innerHTML = renderLessonNotFound();
  return null;
}
// quiz-engine adaptation:
if (!lessonColumn) return null;
// and before all DOM manipulations: if (element && element.classList)
```

**Event delegation pattern** — copy from `src/views/lesson-view.js` `attachCopyHandlers()` lines 194-227:
```javascript
// Copy of the delegation pattern (copy button analog → answer button analog):
document.querySelector('.lesson-wrapper')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('.code-copy-btn');  // → .quiz-answer-btn
  if (!btn) return;
  // ... handle click
});
// Quiz-engine version: delegate on the quiz section container, not document-wide
section.addEventListener('click', (e) => {
  const btn = e.target.closest('.quiz-answer-btn');
  if (!btn) return;
  const questionCard = btn.closest('.quiz-question-card');
  if (!questionCard || questionCard.dataset.answered === 'true') return;
  // ... reveal feedback
});
```

**DOM-append-then-activate pattern** — copy from `src/views/lesson-view.js` lines 63-84 (Step 4 + Step 5):
```javascript
// lesson-view.js: set innerHTML first, THEN wire (lines 63-84)
if (app) {
  app.innerHTML = lessonHtml;
  app.removeAttribute('aria-busy');
}
// Step 5 — Post-render wiring (must happen AFTER innerHTML is set)
activateIcons();
attachCopyHandlers();
// quiz-engine adaptation:
const section = document.createElement('section');
section.innerHTML = buildQuizHtml(quiz);
lessonColumn.appendChild(section);
activateIcons();           // must run AFTER append (icons are in newly injected HTML)
if (!prior) attachQuizHandlers(section, ...);
```

**Inline style pattern** — copy from `src/views/lesson-view.js` lines 121-143 (buildLessonHtml):
```javascript
// All layout via inline style="..." — no new CSS classes for layout
return `<div class="lesson-column" style="max-width: var(--lesson-reading-width, 720px); margin: 0 auto; padding: var(--spacing-xl);">
  <h1 style="font-size: var(--text-display); font-weight: 600; ...">
    ${esc(meta.title || 'Lesson')}
  </h1>
  ...
</div>`;
// Quiz section follows same pattern — design tokens only:
// var(--color-accent), var(--color-border), var(--color-bg-secondary),
// var(--color-text-muted), var(--spacing-xl), var(--spacing-lg), var(--spacing-md)
// Correct answer: #22c55e (hardcoded per D-06)
// Wrong answer: var(--color-destructive) (per D-06)
```

**Error display pattern** — copy from `src/views/lesson-view.js` `renderLessonError()` lines 241-264:
```javascript
// .lesson-error class with role="alert", destructive border, lucide alert-circle icon
return `<div class="lesson-error" role="alert"
     style="background: var(--color-bg-secondary); border: 1px solid var(--color-destructive);
            border-radius: 6px; padding: var(--spacing-lg); ...">
  <div style="display: flex; align-items: center; gap: var(--spacing-sm); ...">
    <i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--color-destructive);..."></i>
    <p style="...">...</p>
  </div>
</div>`;
// Quiz uses silent null return (no error displayed) — this pattern is for reference only
```

**`esc()` on all user-visible strings** — copy from `src/views/lesson-view.js` lines 125, 155, 163:
```javascript
// Every string from external data must pass through esc() before innerHTML injection:
${esc(meta.title || 'Lesson')}
${esc(nav.prev.title)}
${esc(mod.id)}
// Quiz engine: esc() on quiz.title, question.stem, answer.text, answer.feedback, question.explanation
```

---

### `src/views/lesson-view.js` — Step 5 modification (view, request-response)

**Analog:** self — modify lines 82-86

**Injection point** — current lines 67-86 (Step 5 post-render block):
```javascript
// src/views/lesson-view.js lines 67-86 — exact injection point
progressStore.markVisited(moduleId, lessonId);
progressStore.setLastVisited(moduleId, lessonId);

if (!progressStore.isStorageAvailable()) {
  const warningDiv = document.createElement('div');
  warningDiv.className = 'storage-warning';
  // ...
  const lessonColumn = document.querySelector('.lesson-column');
  if (lessonColumn) lessonColumn.prepend(warningDiv);
}

setActiveLesson(moduleId, lessonId);
activateIcons();
attachCopyHandlers();
// ADD HERE (after attachCopyHandlers, before return null):
if (meta.quizId) {
  const lessonColumn = document.querySelector('.lesson-column');
  if (lessonColumn) {
    await renderQuiz(moduleId, meta.quizId, lessonColumn);
  }
}
return null;
```

**Import to add** at top of file (lines 1-12 currently):
```javascript
import { renderQuiz } from '../quiz-engine.js';
```

Note: `renderLesson` is already `async` (line 24) — no signature change needed.

---

### `src/sidebar.js` — progress bar + module-complete additions (component, event-driven)

**Analog:** self — modify after line 48 (`activateIcons()` call) and add new export

**Post-init injection point** — current lines 46-49:
```javascript
// src/sidebar.js lines 24-48 — innerHTML string build + activateIcons()
sidebarModules.innerHTML = MODULES.map(mod => `
  <div class="sidebar-module" data-module-id="${esc(mod.id)}">
    <a href="#/module/${esc(mod.id)}" ...>
      <i data-lucide="${esc(mod.icon.toLowerCase())}" ...></i>
      <span class="sidebar-label" ...>${esc(mod.title)}</span>
    </a>
    ...
  </div>
`).join('');

activateIcons();   // ← line 48 — ADD progress bar injection AFTER this line
```

**DOM-walking post-build pattern** — modeled on `setActiveModule()` lines 127-158:
```javascript
// setActiveModule() walks .sidebar-module elements and applies styles:
document.querySelectorAll('.sidebar-module').forEach(el => {
  const id = el.dataset.moduleId;
  const isActive = id === moduleId;
  const link = el.querySelector('a');
  if (link) {
    if (isActive) {
      link.style.borderLeftColor = 'var(--color-accent)';
      link.style.background = 'rgba(249, 115, 22, 0.08)';
      link.style.color = 'var(--color-accent)';
    } else {
      link.style.borderLeftColor = 'transparent';
    }
  }
});
// Progress bar injection follows same DOM-walking approach (from MODULES.forEach):
MODULES.forEach(mod => {
  const moduleEl = sidebarModules.querySelector(
    '.sidebar-module[data-module-id="' + CSS.escape(mod.id) + '"]'
  );
  if (!moduleEl) return;
  const { pct, complete } = computeModuleProgress(mod);
  const bar = document.createElement('div');
  bar.className = 'sidebar-progress-bar';
  bar.style.cssText = 'height:4px;background:var(--color-bg-secondary);margin:0 var(--spacing-md) var(--spacing-xs);border-radius:2px;overflow:hidden;';
  bar.innerHTML = '<div style="height:100%;width:' + pct + '%;background:var(--color-accent);transition:width 300ms ease;"></div>';
  const titleLink = moduleEl.querySelector('a');
  if (titleLink) titleLink.after(bar);
  if (complete) {
    // inject check-circle icon + apply accent color
  }
});
```

**Import additions** at top of `src/sidebar.js` (current lines 1-6):
```javascript
import { computeModuleProgress } from './quiz-engine.js';
// (MODULES already imported at line 2)
```

**New export to add** — `refreshSidebarProgress(moduleId)`:
```javascript
// Modeled on setActiveLesson() export pattern (lines 160-179):
export function setActiveLesson(moduleId, lessonId) {
  document.querySelectorAll('.sidebar-lesson-link').forEach(link => { ... });
}
// refreshSidebarProgress follows same: targeted DOM update, no full re-render
export function refreshSidebarProgress(moduleId) {
  const sidebarModules = document.getElementById('sidebar-modules');
  if (!sidebarModules) return;
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return;
  const moduleEl = sidebarModules.querySelector('.sidebar-module[data-module-id="' + CSS.escape(moduleId) + '"]');
  if (!moduleEl) return;
  const { pct, complete } = computeModuleProgress(mod);
  const barInner = moduleEl.querySelector('.sidebar-progress-bar div');
  if (barInner) barInner.style.width = pct + '%';
  // update complete icon/color as needed
}
```

---

### `src/views/module-view.js` — full content area rewrite (view, CRUD read)

**Analog:** self — replace `SECTION_CARDS` block; keep outer layout shell (lines 36-59)

**Outer layout to preserve** — lines 36-59 (module header, goal block, compliance bar):
```javascript
// src/views/module-view.js lines 36-59 — keep this outer shell
return `
  <section style="padding: var(--spacing-xl);">
    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);">
      <i data-lucide="${esc(mod.icon.toLowerCase())}" style="width:24px;height:24px;color:var(--color-accent)"></i>
      <h1 style="font-size: var(--text-heading); font-weight: 600;">${esc(mod.title)}</h1>
    </div>
    <div style="border-left: 3px solid var(--color-border); padding: var(--spacing-md); margin-bottom: var(--spacing-md); background: var(--color-bg-secondary);">
      <p style="...">Module goal</p>
      <p style="...">${esc(mod.description)}</p>
    </div>
    <div style="margin-bottom: var(--spacing-lg);">
      ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
    </div>
    <!-- REPLACE SECTION_CARDS GRID WITH: progress bar + lesson list -->
  </section>
`;
```

**Inline style pattern for status badges** — modeled on `renderBadge()` usage and lesson-view inline styles:
```javascript
// lesson-view.js line 116: badge inline flex pattern
<div role="list" aria-label="..." style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs); align-items: center;">
  ${badges}
</div>
// module-view lesson status badge pattern (new, inline styles only):
function lessonStatusBadge(status) {
  const styles = {
    'quiz-passed': 'background:#22c55e;color:#fff;padding:1px 6px;border-radius:3px;font-size:0.75rem;font-weight:600;',
    'visited':     'background:var(--color-bg-secondary);color:var(--color-text-muted);padding:1px 6px;border-radius:3px;font-size:0.75rem;border:1px solid var(--color-border);',
    'unvisited':   'background:transparent;color:var(--color-text-muted);padding:1px 6px;border-radius:3px;font-size:0.75rem;border:1px solid var(--color-border);opacity:0.5;',
  };
  return `<span style="${styles[status]}">${status}</span>`;
}
```

**Import additions** — lines 1-4 currently:
```javascript
import { computeModuleProgress } from '../quiz-engine.js';
import { progressStore } from '../progress-store.js';
// esc and MODULES and renderBadge already imported
```

**Note:** `renderModule()` must stay **synchronous** — the router calls it synchronously (verified: `src/router.js` pattern). `progressStore` APIs are already synchronous.

---

### `src/modules-config.js` — add `quizId` to lesson entries (config)

**Analog:** self — targeted field addition

**Current shape** (lines 16-18):
```javascript
lessons: [
  { id: 'intro',          title: 'Introduction to Windows Event Logs' },
  { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging' },
  { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy' },
],
```

**Modified shape** — only `audit-policies` gets `quizId` (only populated quiz file in Phase 4):
```javascript
lessons: [
  { id: 'intro',          title: 'Introduction to Windows Event Logs' },
  { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging' },
  { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
],
```

All other module lesson entries remain unchanged (no `quizId` field — they have no quiz JSON yet).

---

### `src/utils/icons.js` — add CheckCircle and XCircle (utility)

**Analog:** self — add 2 entries to existing import + createIcons call

**Current import + call** (lines 1-23, entire file):
```javascript
import {
  createIcons,
  BookOpen, Shield, Users, AlertTriangle, Wrench,
  ChevronLeft, Copy, Check, AlertCircle,
} from 'lucide';

export function activateIcons() {
  createIcons({
    icons: { BookOpen, Shield, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle },
  });
}
```

**Modified version** — add `CheckCircle` and `XCircle`:
```javascript
import {
  createIcons,
  BookOpen, Shield, Users, AlertTriangle, Wrench,
  ChevronLeft, Copy, Check, AlertCircle,
  CheckCircle, XCircle,                              // ADD
} from 'lucide';

export function activateIcons() {
  createIcons({
    icons: { BookOpen, Shield, Users, AlertTriangle, Wrench, ChevronLeft, Copy, Check, AlertCircle,
             CheckCircle, XCircle },                 // ADD
  });
}
```

**Critical:** This is a Wave 0 prerequisite. `quiz-engine.js` injects `data-lucide="check-circle"` and `data-lucide="x-circle"` attributes; without these additions `activateIcons()` will silently produce empty icon placeholders.

---

### `public/data/modules/logging-auditing/lessons/audit-policies.md` — add `quizId` frontmatter

**Analog:** existing frontmatter block (lines 1-8, verified)

**Current frontmatter** (lines 1-8):
```markdown
---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
---
```

**Modified frontmatter** — add `quizId: '01'` line:
```markdown
---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
quizId: '01'
---
```

`parseFrontmatter()` in `content-loader.js` passes all frontmatter fields through to `meta` — no parser changes needed.

---

### `tests/quiz-engine.test.js` (new test file)

**Primary analog:** `tests/sidebar-progress.test.js` (closest: DOM tests + vi.mock pattern + progressStore mock)
**Secondary analog:** `tests/progress-store.test.js` (describe/beforeEach/afterEach structure, progressStore API assertions)

**File header pattern** — copy from `tests/sidebar-progress.test.js` lines 1-7:
```javascript
// tests/quiz-engine.test.js
// Phase 04 — covers ASSESS-01 (quiz render, click-to-reveal, score save, revisit)
//           and SHELL-03 (computeModuleProgress calculation)
// happy-dom environment (vitest.config.js: environment: 'happy-dom')
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
```

**vi.mock block pattern** — copy from `tests/sidebar-progress.test.js` lines 12-68:
```javascript
// Declare ALL mocks before module imports that depend on them
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    markVisited: vi.fn(),
    setLastVisited: vi.fn(),
    markLessonCompleted: vi.fn(),
    saveQuiz: vi.fn(),
    getQuizScore: vi.fn().mockReturnValue(null),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    // ... other APIs not used by quiz-engine can be vi.fn() stubs
  },
}))

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'BookOpen',
      lessons: [
        { id: 'intro',          title: 'Introduction' },
        { id: 'audit-policies', title: 'Configuring Audit Policies', quizId: '01' },
      ],
    },
  ],
}))
```

**fetch mock pattern** — `tests/sidebar-progress.test.js` uses `checkLessonAvailability` mock; quiz-engine uses `fetch`. Mock pattern from Vitest:
```javascript
// In beforeEach block — stub global fetch to return quiz JSON:
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      id: 'logging-auditing-quiz-01',
      moduleId: 'logging-auditing',
      title: 'Logging & Auditing Knowledge Check',
      questions: [{
        id: 'q-01',
        type: 'multiple-choice',
        stem: 'Which Event ID captures script block content?',
        complianceControls: ['NIST-AU-12'],
        answers: [
          { id: 'a', text: '4624', correct: false, feedback: 'That is a logon event.' },
          { id: 'b', text: '4104', correct: true,  feedback: 'Correct. 4104 captures script blocks.' },
        ],
        explanation: 'Event ID 4104 captures PowerShell script block content.',
      }],
    }),
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
```

**DOM setup pattern** — copy from `tests/sidebar-progress.test.js` lines 80-94:
```javascript
beforeEach(async () => {
  document.body.innerHTML = `
    <div id="app">
      <div class="lesson-wrapper">
        <div class="lesson-column"></div>
      </div>
    </div>
  `
  // Get mock references after DOM is set up
  const psModule = await import('../src/progress-store.js')
  progressStoreMock = psModule.progressStore
  progressStoreMock.getQuizScore.mockReturnValue(null)  // first-visit mode

  const qeModule = await import('../src/quiz-engine.js')
  renderQuiz = qeModule.renderQuiz
  computeModuleProgress = qeModule.computeModuleProgress
})
```

**Async wait pattern** — copy from `tests/sidebar-progress.test.js` line 185:
```javascript
// For event handlers that are async internally:
fileInput.dispatchEvent(new Event('change'))
await new Promise(resolve => setTimeout(resolve, 20))
// Quiz click equivalent:
answerBtn.click()
await new Promise(resolve => setTimeout(resolve, 0))  // flush microtasks
```

**Test coverage targets** (from RESEARCH.md Validation Architecture):
- `renderQuiz` injects `.quiz-section` into `.lesson-column`
- Clicking an answer adds `data-answered="true"` to the question card
- Clicking an answer locks all answer buttons on that question
- Feedback text for the clicked answer appears in the DOM
- `explanation` appears below all answers after any click
- When last question answered: `progressStore.saveQuiz()` called with `{score, total}`
- When last question answered: `progressStore.markLessonCompleted()` called
- Revisit mode: when `getQuizScore` returns non-null, score banner appears
- Revisit mode: no click handlers attached (answer buttons do not respond to click)
- `computeModuleProgress` returns `pct: 0` for module with all unvisited quiz lessons
- `computeModuleProgress` returns `pct: 100` for module where quiz is passed
- `computeModuleProgress` correctly mixes quiz-passed + quiz-less visited for pct

---

### `tests/sidebar.test.js` — extend existing (test)

**Analog:** self — add new describe blocks at end of file

**Current file structure** (lines 1-32) — three describe blocks on MODULES shape + aria-label stub.

**New describe blocks to append** — copy test structure from `tests/sidebar-progress.test.js`:
```javascript
// Append after existing describe blocks in tests/sidebar.test.js

// Need vi.mock blocks at TOP of file (before imports) if not already present.
// If adding mocks to an existing file: move file to use vi.mock declarations at top.
// Safer: create a new describe block that uses the already-mocked sidebar from sidebar-progress.test.js.
// Recommendation: add separate vi.mock blocks at top and new describe blocks:

describe('sidebar progress bars — initSidebar() injection', () => {
  // DOM setup matching sidebar-progress.test.js pattern (lines 80-94)
  // Test: .sidebar-progress-bar element exists after initSidebar()
  // Test: progress bar width is "0%" for module with no progress
  // Test: progress bar uses var(--color-accent) fill color
})

describe('sidebar progress bars — refreshSidebarProgress()', () => {
  // Test: refreshSidebarProgress(moduleId) updates .sidebar-progress-bar div width
  // Test: does not throw when module not found
})
```

**Note:** The existing sidebar.test.js lacks vi.mock declarations (it only imports MODULES directly). Adding DOM tests requires the same mock setup as `sidebar-progress.test.js`. The safest approach is to add all new progress-bar tests to a separate file `tests/sidebar-progress-bars.test.js` rather than retrofitting the existing file — but RESEARCH.md specifies extending `tests/sidebar.test.js`. Add vi.mock declarations at the very top of the file before the existing imports.

---

### `tests/module-view.test.js` (new test file)

**Primary analog:** `tests/lesson-view.test.js` (synchronous view render test pattern)
**Secondary analog:** `tests/sidebar-progress.test.js` (mock setup pattern)

**File header pattern** — copy from `tests/lesson-view.test.js` lines 1-7:
```javascript
// tests/module-view.test.js
// Phase 04 — covers SHELL-03 (module-view progress bar + lesson status list)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
```

**Mock pattern** — `renderModule()` is synchronous, no fetch. Mocks needed: progressStore, MODULES, renderBadge, quiz-engine:
```javascript
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    getQuizScore: vi.fn().mockReturnValue(null),
    // other methods as vi.fn() stubs
  },
}))

vi.mock('../src/quiz-engine.js', () => ({
  computeModuleProgress: vi.fn().mockReturnValue({ pct: 0, complete: false, numerator: 0, denominator: 2 }),
}))

vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'BookOpen',
      description: 'Test module',
      complianceTags: ['TSA'],
      lessons: [
        { id: 'intro',          title: 'Introduction' },
        { id: 'audit-policies', title: 'Configuring Audit Policies', quizId: '01' },
      ],
    },
  ],
}))

vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue('<span>TSA</span>'),
}))
```

**Synchronous render test pattern** — copy from `tests/lesson-view.test.js` lines 13-26 (direct return value assertions):
```javascript
// lesson-view.test.js: test helper function return values directly (not DOM)
describe('compliance bar rendering', () => {
  it('renders badge HTML for each tag in complianceTags', () => {
    const tags = ['TSA', 'NIST']
    const html = tags.map(t => renderBadge(t)).join('')
    expect(html).toContain('TSA')
  })
})
// module-view.test.js: same pattern — renderModule() returns string, assert on string:
describe('module-view progress bar', () => {
  it('renderModule() HTML contains a progress bar element', () => {
    const html = renderModule({ moduleId: 'logging-auditing' })
    expect(html).toContain('sidebar-progress-bar')  // or equivalent class/style marker
  })
})
```

**Test coverage targets** (from RESEARCH.md Validation Architecture):
- `renderModule()` HTML contains progress bar markup when module has lessons
- Progress bar fill width reflects `computeModuleProgress()` pct value
- Lesson list contains each lesson title
- Lesson with `quizId` and passing score renders `quiz-passed` badge
- Lesson with `quizId` visited but no score renders `visited` badge
- Lesson with `quizId` neither visited nor scored renders `unvisited` badge
- Lesson without `quizId` visited renders `visited` badge
- Lesson without `quizId` not visited renders `unvisited` badge
- `renderModuleNotFound()` rendered for unknown moduleId

---

## Shared Patterns

### XSS Escaping (applies to all source files with innerHTML)
**Source:** `src/utils/escape.js` `esc()`
**Apply to:** `src/quiz-engine.js` (all quiz JSON fields), `src/views/module-view.js` (lesson titles in status list)
**Pattern from lesson-view.js lines 125, 155, 163:**
```javascript
// Every string from data files or config before innerHTML injection:
${esc(meta.title || 'Lesson')}
${esc(nav.prev.title)}
${esc(mod.id)}
// Rule: if the value originates from JSON, frontmatter, or URL params — escape it.
```

### CSS Design Tokens (applies to all inline-styled files)
**Source:** `src/style.css` (verified tokens used throughout lesson-view.js, sidebar.js, module-view.js)
**Apply to:** `src/quiz-engine.js`, `src/views/module-view.js` (new lesson list section)
```
var(--color-accent)          — orange, used for active/correct/progress fill
var(--color-destructive)     — red, used for errors AND wrong answers (D-06)
var(--color-border)          — border color for cards, dividers
var(--color-bg-secondary)    — secondary background for cards, track of progress bar
var(--color-text-primary)    — main readable text
var(--color-text-muted)      — secondary text, labels, captions
var(--spacing-xs/sm/md/lg/xl/2xl) — spacing scale
var(--text-body/text-display/text-heading) — font size scale
#22c55e                      — hardcoded green for CORRECT answer state (D-06, not --color-accent)
```

### progressStore API Access Pattern (applies to all files using progress data)
**Source:** `src/progress-store.js` lines 337-354 (exports object)
**Apply to:** `src/quiz-engine.js`, `src/sidebar.js`, `src/views/module-view.js`
```javascript
// Import and use the singleton — never call localStorage directly:
import { progressStore } from './progress-store.js';
// All calls are synchronous except init() — which is already awaited in main.js:
progressStore.saveQuiz(moduleId, quizId, { score, total })   // → void
progressStore.getQuizScore(moduleId, quizId)                  // → {score,total,attemptedAt}|null
progressStore.markLessonCompleted(moduleId, lessonId)         // → void
progressStore.getLessonProgress(moduleId, lessonId)           // → {visited,completed}
```

### Lucide Icon Activation Pattern (applies to quiz-engine, sidebar additions)
**Source:** `src/utils/icons.js` lines 19-23 + `src/views/lesson-view.js` line 83
**Apply to:** `src/quiz-engine.js` (after appending quiz HTML to DOM)
```javascript
// Always call activateIcons() AFTER the HTML containing data-lucide attributes
// is in the DOM — not before:
lessonColumn.appendChild(section);  // section contains data-lucide="check-circle" etc.
activateIcons();                     // scans full document — safe, consistent pattern
// data-lucide attribute values for Phase 4: "check-circle", "x-circle"
// These MUST be added to icons.js before quiz-engine.js uses them (Wave 0 prerequisite)
```

### Null-Guard on DOM Elements (applies to all DOM-manipulation code)
**Source:** `src/views/lesson-view.js` lines 26-29, 39-43, 78-80; `src/sidebar.js` lines 9, 97-124
**Apply to:** `src/quiz-engine.js`, all DOM mutation code in sidebar additions
```javascript
// Pattern WR-04: guard every DOM query result before use
const sidebarModules = document.getElementById('sidebar-modules');
if (!sidebarModules) return;                    // early exit

const lessonColumn = document.querySelector('.lesson-column');
if (lessonColumn) lessonColumn.prepend(warningDiv);  // conditional usage

// Extended form:
if (element && element.classList) { /* safe to manipulate */ }
```

### Test Mock Declaration Order (applies to all new test files)
**Source:** `tests/sidebar-progress.test.js` lines 12-68
**Apply to:** `tests/quiz-engine.test.js`, extended `tests/sidebar.test.js`, `tests/module-view.test.js`
```javascript
// vi.mock() hoisting: ALL vi.mock() calls MUST appear before any imports
// that transitively depend on the mocked modules.
// Vitest hoists vi.mock() calls to top of file regardless of declaration position —
// but declaring them before imports is the safe pattern used in this project.
vi.mock('../src/progress-store.js', () => ({ progressStore: { ... } }))
vi.mock('../src/utils/icons.js', () => ({ activateIcons: vi.fn() }))
vi.mock('../src/modules-config.js', () => ({ MODULES: [...] }))
// THEN: import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// THEN: import real module under test
```

---

## No Analog Found

All Phase 4 files have close analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

| File | Closest Available | Gap |
|---|---|---|
| `src/quiz-engine.js` fetch+render | `lesson-view.js` | Quiz-specific: event delegation for answer cards, dual first-visit/revisit modes — RESEARCH.md Pattern 1-2 fills the gap |
| `computeModuleProgress()` | `progressStore` APIs | New calculation logic — RESEARCH.md Pattern 3 fills the gap |
| Sidebar progress bar injection | `setActiveModule()` DOM walking | New DOM-append-after-titleLink pattern — RESEARCH.md Pattern 4 fills the gap |

---

## Metadata

**Analog search scope:** `src/`, `tests/`, `public/data/modules/logging-auditing/`
**Files read:** 12 source files + 2 data files + 1 config
**Pattern extraction date:** 2026-05-14
