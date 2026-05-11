# Phase 2: Content Loader + Lesson Rendering + Module 1 — Research

**Researched:** 2026-05-11
**Domain:** Markdown fetch pipeline, Shiki syntax highlighting, marked.js custom renderer, Module 1 content
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Compliance tagging uses both layers: `complianceTags: [TSA, NIST]` for badge display AND `complianceControls: [TSA-PC-1, NIST-CM-6]` for specific control IDs. Both fields are arrays.

**D-02:** Minimal core frontmatter fields: `title`, `lessonId`, `moduleId`, `order`, `complianceTags[]`, `complianceControls[]`. No estimatedMinutes, difficulty, or keywords.

**D-03:** `> [!OT]` blockquote syntax → custom marked.js renderer rule → styled OT callout component. Canonical authoring pattern for all 5 modules.

**D-04:** Responsive prose column: `max-width: 720px`, centered in `#app`, `padding: var(--spacing-xl)`. Full-width on mobile.

**D-05:** Both sidebar lesson links AND prev/next footer buttons active simultaneously.

**D-06:** Code blocks: dark container (`var(--color-bg-base)`), header bar with language label + copy-to-clipboard button. Shiki renders token colors.

**D-07:** Module 1 has exactly 3 lessons: `01-intro.md`, `02-ps-logging.md`, `03-audit-policies.md`.

**D-08:** Admin-level depth: 400-600 words, 3-5 PS 5.1 code blocks, inline compliance reason per command, at least one `> [!OT]` callout per applicable lesson.

**D-09:** Environment identifiers: `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp`. PS output is realistic-format, generic.

**D-10:** Data-driven sidebar activation: HEAD fetch per lesson at `initSidebar()`. Module 1 lessons activate; others stay grayed out.

**D-11:** Active lesson indicator: 3px left border `var(--color-accent)` + `background: rgba(249,115,22,0.08)` + accent text color.

### Claude's Discretion

- Exact Shiki integration pattern (static bundle vs. lazy-load grammar)
- marked.js renderer customization structure
- Copy button implementation details
- Exact module.json schema
- Quiz placeholder format
- Terminal exercise and scenario placeholder shapes
- Loading state UI
- Error state when lesson Markdown 404s

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Lessons authored in Markdown, rendered in-browser without a build step | fetch() + marked.js pipeline; content-loader.js fetches at runtime |
| CONT-02 | PowerShell code blocks render with Shiki syntax highlighting (PS 5.1 grammar) | Shiki `createHighlighter` with `powershell` lang + `github-dark` theme |
| CONT-03 | Every code block has a one-click copy-to-clipboard button | Custom marked.js `code` renderer injects button; `navigator.clipboard.writeText()` |
| CONT-04 | Each lesson displays TSA/NIST control IDs sourced from compliance-refs.json | Frontmatter `complianceTags[]` + existing `renderBadge()` from badge.js |
| MOD-01 | Module 1 complete: 3 lessons + quiz/exercise/scenario placeholders; TSA+NIST compliance IDs | All 3 `.md` lessons, module.json, and 3 placeholder JSON files authored |
</phase_requirements>

---

## Summary

Phase 2 builds the fetch-parse-render pipeline for Markdown lesson content and authors all three Module 1 (Logging & Auditing) lessons. The core technical challenge is integrating Shiki v4 (async) with marked.js v18 (synchronous by default) cleanly. The recommended solution is using `marked.use({ walkTokens, async: true })` which allows `await codeToHtml(...)` inside the token walk, before the final synchronous `marked.parse()` call. This is the only pattern that avoids pre-collecting code tokens as a separate step.

The Lucide migration from CDN to npm bundled import is required this phase because the copy button needs `Copy` and `Check` icons injected dynamically into code block HTML after Shiki runs. The CDN `window.lucide.createIcons()` approach cannot reliably re-process Shiki-injected DOM elements without timing coupling. Bundled import + explicit `createIcons({ icons: { Copy, Check, AlertCircle } })` call after lesson render is clean and tree-shakable.

Gray-matter is a CJS-only package with `js-yaml` v3 dependency. For the minimal frontmatter needs of this project (6 fields), a 15-line manual YAML split is preferable — no dependency, no Vite CJS interop warnings, zero bundle weight. The manual approach is fully adequate for the fixed schema.

**Primary recommendation:** Use `createHighlighter` (singleton, lazy-loaded on first lesson render), `marked.use({ walkTokens async, async: true })`, manual frontmatter YAML split, and `lucide` npm package replacing CDN tag.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Fetch lesson .md files | Browser/Client | — | Static GitHub Pages; fetch() at runtime from public/data/ |
| Parse frontmatter (YAML header) | Browser/Client | — | Pure string split; no server needed |
| Render Markdown to HTML | Browser/Client | — | marked.js runs in browser; no build step for content |
| Syntax highlight code blocks | Browser/Client | — | Shiki v4 ships WASM/JS engine; runs client-side at render time |
| Route to lesson view | Browser/Client | — | Hash router in router.js; no server routing |
| Sidebar lesson availability | Browser/Client | — | HEAD fetch per lesson; CDN serves 404 for missing files |
| Compliance badge display | Browser/Client | — | renderBadge() reads compliance-refs.json already cached in main.js |
| Prev/next navigation | Browser/Client | — | Computed from MODULES config array; pure data lookup |
| Lesson content files | CDN/Static | — | Served as static files from public/data/ via GitHub Pages |
| Copy to clipboard | Browser/Client | — | navigator.clipboard API; fully browser-side |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shiki | 4.0.2 | PS 5.1 syntax highlighting | VS Code-identical TextMate grammar; async `codeToHtml`; github-dark theme exactly matches design tokens [VERIFIED: npm registry] |
| marked | 18.0.3 | Markdown to HTML | Highest-download MD parser; `walkTokens async` pattern enables Shiki integration cleanly [VERIFIED: npm registry] |
| lucide | 1.14.0 | Copy/Check/AlertCircle icons | Tree-shakable named imports; replaces CDN tag; same icons already used in Phase 1 [VERIFIED: npm registry] |

**Note on marked version:** STACK.md states v17.0.x. The current latest is v18.0.3. The v18 breaking changes are: (1) trailing blank lines trimmed from block tokens, (2) TypeScript updated to v6. The renderer API (`code(token)`, `blockquote(token)`) is unchanged between v17 and v18. Use v18 — it is stable and the token shape is identical. [VERIFIED: GitHub releases, WebFetch]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.6 | Unit tests | Already installed in devDependencies; test pure functions in content-loader.js |
| happy-dom | 20.9.0 | DOM environment for tests | Already configured in vitest.config.js |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual YAML frontmatter split | gray-matter 4.0.3 | gray-matter is CJS-only, adds `js-yaml` v3 dependency. For 6 fixed fields, manual `---` split is 15 lines vs 50KB dep. Manual approach confirmed adequate. |
| Manual YAML frontmatter split | gray-matter-es 0.2.1 | ESM-only, browser-compatible, API-compatible with gray-matter. Viable if frontmatter complexity grows. Not needed for v1 fixed schema. |
| `createHighlighter` singleton | `codeToHtml` shorthand | Shorthand auto-loads on first call (lazy). Singleton gives explicit control over when WASM loads. For this project, singleton initialized once on first lesson render is cleaner. |
| lucide npm | Lucide CDN + `data-lucide` attrs | CDN approach cannot reliably re-process dynamically injected HTML. Copy button icons are injected into Shiki output string — bundled import required. |

**Installation (new packages only — add to existing package.json):**
```bash
npm install shiki marked lucide
```

**Version verification (confirmed against npm registry 2026-05-11):**
- shiki: 4.0.2
- marked: 18.0.3
- lucide: 1.14.0

---

## Architecture Patterns

### System Architecture Diagram

```
Hash change → #/lesson/{moduleId}/{lessonId}
       │
       ▼
handleRoute() [router.js]
       │ calls renderLesson({ moduleId, lessonId })
       ▼
renderLesson() [lesson-view.js]
       │
       ├─1─► Render loading skeleton immediately (synchronous DOM write)
       │
       ├─2─► fetch(BASE_URL + 'data/modules/{moduleId}/lessons/{lessonId}.md')
       │         │
       │         ├── 404 → render error state (lesson-view.js)
       │         └── 200 → Markdown text
       │
       ├─3─► parseFrontmatter(markdownText)
       │         └── returns { meta: {title, complianceTags[], complianceControls[]},
       │                        body: markdownBody }
       │
       ├─4─► marked.parse(markdownBody) [async mode + walkTokens]
       │         │  walkTokens intercepts 'code' tokens
       │         │  → await getHighlighter() [singleton, lazy-init]
       │         │  → highlighter.codeToHtml(token.text, { lang, theme: 'github-dark' })
       │         │  → stores highlighted HTML on token
       │         │  code renderer reads token.shikiHtml → wraps in .code-block structure
       │         │  blockquote renderer detects [!OT] → wraps in .ot-callout structure
       │         └── returns final HTML string
       │
       ├─5─► Inject HTML into .lesson-body
       │
       ├─6─► Render compliance badge row via renderBadge()
       │
       ├─7─► Render prev/next footer from MODULES config
       │
       ├─8─► setActiveLesson(moduleId, lessonId) [sidebar.js]
       │
       └─9─► createIcons({ icons: { Copy, Check, AlertCircle } }) [lucide]
                   Binds icons to data-lucide attrs inside .code-block headers

initSidebar() [sidebar.js — Phase 2 modification]
       │
       ├─ For each lesson in MODULES:
       │    HEAD fetch(BASE_URL + 'data/modules/{moduleId}/lessons/{lessonId}.md')
       │         ├── 200 → render <a href="#/lesson/{moduleId}/{lessonId}">
       │         └── non-200 → render <span aria-disabled="true">
       └─ After all HEAD fetches resolve → inject HTML, call createIcons()
```

### Recommended Project Structure (new files only)

```
src/
├── content-loader.js        ← NEW: fetch + in-memory cache + parseFrontmatter
├── views/
│   └── lesson-view.js       ← NEW: renderLesson({ moduleId, lessonId })
├── sidebar.js               ← MODIFY: add setActiveLesson(), modify initSidebar() for HEAD fetch
├── router.js                ← MODIFY: add lesson route + renderLesson import
├── main.js                  ← MODIFY: add initSidebar() HEAD fetch after loadComplianceRefs
└── style.css                ← MODIFY: add Phase 2 @theme tokens + lesson/code/OT CSS

public/data/
└── modules/
    └── logging-auditing/
        ├── module.json                    ← NEW: module metadata
        ├── lessons/
        │   ├── intro.md                   ← NEW: Lesson 1 content
        │   ├── ps-logging.md              ← NEW: Lesson 2 content
        │   └── audit-policies.md          ← NEW: Lesson 3 content
        ├── quizzes/
        │   └── 01.json                    ← NEW: quiz placeholder
        ├── exercises/
        │   └── 01.json                    ← NEW: exercise placeholder
        └── scenarios/
            └── 01.json                    ← NEW: scenario placeholder

tests/
└── content-loader.test.js   ← NEW: unit tests for parseFrontmatter, OT detection
```

---

### Pattern 1: Manual Frontmatter Parsing

**What:** Split Markdown on `---` delimiters, parse the minimal YAML header by hand.
**When to use:** All lesson `.md` files in this project. Gray-matter is unnecessary weight for a fixed 6-field schema.

```javascript
// Source: Verified pattern — manual YAML split
// src/content-loader.js

export function parseFrontmatter(raw) {
  const DELIMITER = '---';
  const lines = raw.split('\n');
  if (lines[0].trim() !== DELIMITER) {
    return { meta: {}, body: raw };
  }
  const closeIdx = lines.indexOf(DELIMITER, 1);
  if (closeIdx === -1) {
    return { meta: {}, body: raw };
  }
  const yamlLines = lines.slice(1, closeIdx);
  const body = lines.slice(closeIdx + 1).join('\n').trimStart();
  const meta = {};
  for (const line of yamlLines) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    // Arrays: `key: [a, b]` or inline YAML list
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      meta[key] = val.replace(/^['"]|['"]$/g, '');
    }
  }
  return { meta, body };
}
```

**Confidence:** HIGH — pure string manipulation, no dependencies.

---

### Pattern 2: Shiki Singleton + marked.js Async walkTokens

**What:** Initialize Shiki `createHighlighter` once (lazy, on first lesson render). Use `marked.use({ walkTokens, async: true })` to await Shiki per code token before the marked renderer runs.

**When to use:** All lesson render calls. The singleton avoids re-loading the WASM/grammar on every page navigation.

```javascript
// Source: Shiki docs [CITED: shiki.style/guide/install] +
//         marked.js docs [CITED: marked.js.org/using_pro]
// src/content-loader.js

import { createHighlighter } from 'shiki';
import { marked } from 'marked';
import { esc } from './utils/escape.js';

let _highlighter = null;

async function getHighlighter() {
  if (_highlighter) return _highlighter;
  _highlighter = await createHighlighter({
    themes: ['github-dark'],
    langs: ['powershell'],
  });
  return _highlighter;
}

// Configure marked ONCE at module load time.
// walkTokens intercepts each token; async: true tells marked to await the walk.
marked.use({
  async: true,
  async walkTokens(token) {
    if (token.type !== 'code') return;
    const hl = await getHighlighter();
    const lang = token.lang?.toLowerCase() || 'text';
    const shikiLang = (lang === 'powershell' || lang === 'ps1' || lang === 'ps') ? 'powershell' : lang;
    try {
      // Load the language if not yet loaded (Shiki auto-loads from bundle)
      if (shikiLang !== 'text') {
        try { await hl.loadLanguage(shikiLang); } catch { /* unsupported lang — fall through */ }
      }
      token.shikiHtml = hl.codeToHtml(token.text, {
        lang: shikiLang,
        theme: 'github-dark',
      });
    } catch {
      token.shikiHtml = null; // Fallback: renderer emits plain <pre><code>
    }
  },
  renderer: {
    code(token) {
      const lang = token.lang || '';
      const displayLang = lang === 'powershell' || lang === 'ps1' || lang === 'ps'
        ? 'PowerShell' : (lang || 'Code');
      const rawCode = esc(token.text);
      const tokenBody = token.shikiHtml
        ? token.shikiHtml
        : `<pre><code>${rawCode}</code></pre>`;
      return `
        <div class="code-block" style="...">
          <div class="code-block-header" style="...">
            <span class="code-lang-label" style="...">${esc(displayLang)}</span>
            <button class="code-copy-btn" aria-label="Copy code to clipboard"
                    data-code="${rawCode}">
              <i data-lucide="copy" style="width:14px;height:14px;"></i>
            </button>
          </div>
          <div class="code-block-body" style="...">${tokenBody}</div>
        </div>`;
    },
    blockquote(token) {
      const rawText = token.raw || '';
      if (rawText.trimStart().startsWith('> [!OT]')) {
        // Strip the [!OT] marker line from rendered content
        const bodyTokens = token.tokens?.filter(t => {
          if (t.type !== 'paragraph') return true;
          return !t.raw?.trim().startsWith('[!OT]');
        }) ?? [];
        const inner = marked.parser(bodyTokens);
        return `
          <aside class="ot-callout" aria-label="OT environment note" style="...">
            <div class="ot-callout-label" style="...">IN OT ENVIRONMENTS</div>
            <div class="ot-callout-body" style="...">${inner}</div>
          </aside>`;
      }
      // Standard blockquote
      const inner = marked.parser(token.tokens ?? []);
      return `<blockquote style="...">${inner}</blockquote>`;
    },
  },
});

export async function renderMarkdown(markdownBody) {
  // marked.parse returns a Promise when async: true is set
  return await marked.parse(markdownBody);
}
```

**Important caveat on blockquote detection:** The `token.raw` for a blockquote is the raw Markdown string. When marked parses `> [!OT]\n> body text`, the blockquote token's `raw` starts with `> [!OT]`. The check `rawText.trimStart().startsWith('> [!OT]')` is reliable. The first `paragraph` token inside `token.tokens` will have `raw === '[!OT]\n'` — filter it out to avoid rendering the marker text.

**Confidence:** HIGH — both patterns verified against official Context7 docs.

---

### Pattern 3: Shiki `createHighlighter` — Language Availability

**What:** Shiki v4 `createHighlighter` pre-loads specified languages/themes. Additional languages can be lazy-loaded via `hl.loadLanguage(lang)`. If a language is unknown, it throws — catch the error and fall back to plain `<pre><code>`.

**When to use:** Module 1 lessons use `powershell` only. Future modules may use `json`, `yaml`, `batch`. Load on demand.

```javascript
// For powershell specifically — pre-load at highlighter init:
_highlighter = await createHighlighter({
  themes: ['github-dark'],
  langs: ['powershell'],  // pre-loaded for immediate use
});

// For other languages — lazy-load in walkTokens:
try {
  await hl.loadLanguage(shikiLang);
} catch {
  // Language not found in Shiki bundle — fall back to plain
}
```

**Confidence:** HIGH [CITED: shiki.style/guide/install, shiki.style/guide/load-lang]

---

### Pattern 4: Lucide Migration CDN → npm Bundle

**What:** Remove the `<script>` CDN tag from `index.html`. Import named icons from the `lucide` npm package in JS files. Call `createIcons({ icons: {...} })` explicitly after each DOM update that injects `data-lucide` attributes.

**When to use:** This phase. The copy button injects `<i data-lucide="copy">` into Shiki output HTML. The CDN global `lucide.createIcons()` in `router.js` must be replaced with an explicit call that also covers dynamically-injected lesson content.

```javascript
// Source: Context7 /lucide-icons/lucide docs [VERIFIED]

// In main.js or a shared icons module:
import { createIcons, BookOpen, Shield, Users, AlertTriangle, Wrench,
         ChevronLeft, Copy, Check, AlertCircle } from 'lucide';

export function activateIcons() {
  createIcons({
    icons: {
      BookOpen, Shield, Users, AlertTriangle, Wrench,
      ChevronLeft, Copy, Check, AlertCircle,
    },
  });
}
```

**index.html change:** Remove the `<script src="https://unpkg.com/lucide@...">` tag entirely.

**router.js change:** Replace `if (typeof lucide !== 'undefined') lucide.createIcons()` with `activateIcons()` import call.

**sidebar.js change:** Same replacement.

**lesson-view.js:** Call `activateIcons()` after setting `innerHTML` on the lesson body, so Copy/Check/AlertCircle icons activate inside the rendered lesson.

**Confidence:** HIGH [CITED: Context7 /lucide-icons/lucide, lucide.dev/guide/packages/lucide]

---

### Pattern 5: Sidebar HEAD Fetch for Lesson Availability

**What:** For each lesson in `MODULES`, attempt `fetch(url, { method: 'HEAD' })`. On response.ok → render `<a>` link. On non-ok → render `<span aria-disabled>`. Run all HEAD fetches in parallel via `Promise.all`.

**When to use:** `initSidebar()` — called once at app init after `loadComplianceRefs()`.

```javascript
// Pattern: parallel HEAD fetches, rebuild sidebar after all resolve
async function checkLessonAvailability(moduleId, lessonId) {
  const url = import.meta.env.BASE_URL + `data/modules/${moduleId}/lessons/${lessonId}.md`;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false; // network error — treat as unavailable
  }
}

// In initSidebar():
const availabilityChecks = MODULES.flatMap(mod =>
  mod.lessons.map(lesson =>
    checkLessonAvailability(mod.id, lesson.id).then(ok => ({ moduleId: mod.id, lessonId: lesson.id, ok }))
  )
);
const results = await Promise.all(availabilityChecks);
// Build a Set of available lesson keys: `${moduleId}/${lessonId}`
const available = new Set(results.filter(r => r.ok).map(r => `${r.moduleId}/${r.lessonId}`));
// Then render sidebar with availability map
```

**GitHub Pages CDN HEAD fetch behavior:** GitHub Pages serves static files. A HEAD request to a non-existent `.md` file returns HTTP 404. A HEAD request to an existing file returns 200 with content headers but no body. This is confirmed behavior for static file hosts — no race conditions because all HEAD requests are independent. [ASSUMED — not formally verified against GitHub Pages CDN behavior, but standard static server behavior]

**Race condition note:** There is no race condition risk. Each HEAD fetch either succeeds or fails independently. `Promise.all` waits for all before rendering. The sidebar renders correctly once.

**Confidence:** MEDIUM (GitHub Pages HEAD fetch behavior is standard static server behavior; ASSUMED as correct for this host)

---

### Anti-Patterns to Avoid

- **Don't call `marked.parse()` synchronously and then try to replace `<pre><code>` with Shiki output post-hoc.** This requires two passes over the DOM and creates a flash of unstyled code blocks. Use `walkTokens + async: true` to run Shiki before the HTML is generated.
- **Don't initialize Shiki on every `renderLesson()` call.** `createHighlighter` loads WASM (~1MB) asynchronously. Initialize once, store the singleton.
- **Don't use `innerHTML` on user-supplied content.** Lesson files are authored in the repository — not user input — so XSS is not a practical risk, but use `esc()` for any data-derived values injected into templates (frontmatter fields, lesson IDs).
- **Don't import `lucide` in a way that prevents tree-shaking.** Use named imports `import { Copy, Check } from 'lucide'`, not `import * as lucide from 'lucide'`.
- **Don't fetch the lesson `.md` file to check availability in `initSidebar()`.** Use HEAD only — no body download needed at sidebar init.
- **Don't hardcode the lesson route in `router.js` as a string concatenation.** Use the established `extractParams()` pattern with the `#/lesson/:moduleId/:lessonId` pattern string.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown to HTML | Custom parser | marked.js v18 | 100+ edge cases in Markdown spec; marked is 15 years mature |
| PS syntax highlighting | CSS color classes | Shiki v4 | TextMate grammar covers 200+ PS tokens; hand-rolled CSS misses operators, types, special vars |
| Icon SVGs inline | Raw SVG strings | lucide npm named imports | Tree-shakable; consistent stroke widths; accessible SVG attributes included |
| Multi-language async coordination | Promise chaining | marked walkTokens + async: true | Built-in coordination of async operations within the parse pipeline |

**Key insight:** The marked.js + Shiki async walkTokens pattern solves the core "async rendering in a synchronous pipeline" problem cleanly. Any alternative requires either pre-scanning code blocks (two-pass over raw markdown string) or post-processing the DOM (requires the Shiki output to be injected after marked runs, causing a visible delay).

---

## Module 1 Content Specification

### Lesson File Frontmatter Template

```markdown
---
title: Introduction to Windows Event Logs
lessonId: intro
moduleId: logging-auditing
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-2, NIST-AU-3]
---
```

**Note on control ID strings:** `compliance-refs.json` currently stores only top-level directive keys (`TSA`, `NIST`). The `complianceControls[]` array in `complianceControls` is for the compliance index in Phase 6 — these are human-readable control shorthand strings (e.g., `NIST-AU-2`, `TSA-Monitoring`). Phase 6 will build the index that cross-references these; Phase 2 only needs to store them in frontmatter. Do not attempt to validate against compliance-refs.json keys in Phase 2. [ASSUMED: control ID string format — Phase 6 will define the canonical format]

### Module.json Schema

```json
{
  "id": "logging-auditing",
  "title": "Logging & Auditing",
  "description": "Configure Windows Event Logging and PowerShell script block logging to meet TSA SD-02F and NIST SP 800-82 Rev 3 requirements.",
  "order": 1,
  "estimatedMinutes": 45,
  "icon": "BookOpen",
  "complianceTags": ["TSA", "NIST"],
  "lessons": [
    { "id": "intro",          "title": "Introduction to Windows Event Logs" },
    { "id": "ps-logging",     "title": "Enabling PowerShell Script Block Logging" },
    { "id": "audit-policies", "title": "Configuring Audit Policies via Group Policy" }
  ]
}
```

**Note:** This mirrors the existing `MODULES` static config shape. Phase 2 keeps the `MODULES` static config in place — `content-loader.js` augments it with fetched metadata where needed, but does not replace it. The lesson IDs in module.json MUST match the lesson IDs in `MODULES` array and the `.md` filenames.

### Lesson 1: `intro.md` — Introduction to Windows Event Logs

**Compliance controls:** TSA SD-02F continuous monitoring mandate (logging infrastructure prerequisite), NIST SP 800-82 Rev 3 / NIST SP 800-53 Rev 5 AU-2 (Event Logging), AU-3 (Content of Audit Records)

**PowerShell commands (PS 5.1):**
- `Get-WinEvent -LogName Security -MaxEvents 10` — query Security event log
- `Get-WinEvent -LogName System -MaxEvents 5 | Select-Object TimeCreated, Id, Message` — filter with Select-Object
- `Get-EventLog -LogName Security -Newest 10` — legacy cmdlet (still works in PS 5.1; note: deprecated in PS 7+)

**Key Event IDs to cover:** 4624 (logon success), 4625 (logon failure), 4648 (explicit credential logon), 4672 (special privilege logon), 4688 (process creation — important for PowerShell execution auditing)

**OT callout required:** Yes — event log collection from HMI/SCADA differs; push-based vs pull-based collection; OT historian considerations

**NERC CIP note:** Include scope callout per CLAUDE.md content rule

### Lesson 2: `ps-logging.md` — Enabling PowerShell Script Block Logging

**Compliance controls:** TSA SD-02F unauthorized code execution detection requirement, NIST SP 800-82 Rev 3 / AU-12 (Audit Record Generation), NIST SP 800-53 Rev 5 CM-6 (Configuration Settings)

**PowerShell commands (PS 5.1):**
- `Get-ItemProperty HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging` — check current state
- `New-Item -Path HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging -Force` — create key
- `Set-ItemProperty -Path HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging -Name EnableScriptBlockLogging -Value 1` — enable logging
- `Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' -MaxEvents 5` — verify logging active (Event ID 4104)

**Key Event ID:** 4104 (PS Script Block Logging — captures full script content)

**OT callout required:** Yes — Group Policy application in air-gapped OT environments; standalone registry modification needed when no domain GPO

### Lesson 3: `audit-policies.md` — Configuring Audit Policies via Group Policy

**Compliance controls:** TSA SD-02F audit trail requirement, NIST SP 800-82 Rev 3 / NIST SP 800-53 Rev 5 AU-12, AU-2; also CM-6

**PowerShell commands (PS 5.1):**
- `auditpol /get /category:*` — display current audit policy (auditpol.exe, invoked from PS)
- `auditpol /set /subcategory:"Logon" /success:enable /failure:enable` — enable logon auditing
- `Get-GPO -All | Where-Object { $_.DisplayName -like "*Audit*" }` — find relevant GPOs (requires GroupPolicy module, note prerequisite)

**Key subcategories:** Account Logon, Logon/Logoff, Object Access, Process Creation, Policy Change

**OT callout required:** Yes — `auditpol` commands require admin privileges; in OT, standalone `auditpol` is used when AD GPO is unavailable (isolated OT domain or workgroup)

### Placeholder JSON Schemas

**Quiz placeholder (`quizzes/01.json`):**
```json
{
  "id": "logging-auditing-quiz-01",
  "moduleId": "logging-auditing",
  "title": "Logging & Auditing Knowledge Check",
  "status": "placeholder",
  "questions": [
    {
      "id": "q-01",
      "type": "multiple-choice",
      "stem": "Which PowerShell Event ID captures the full content of executed script blocks?",
      "complianceControls": ["NIST-AU-12"],
      "answers": [
        { "id": "a", "text": "4624", "correct": false, "feedback": "Event ID 4624 is a successful logon event, not script block logging." },
        { "id": "b", "text": "4104", "correct": true, "feedback": "Correct. Event ID 4104 in the PowerShell/Operational log captures script block content when Script Block Logging is enabled." },
        { "id": "c", "text": "4688", "correct": false, "feedback": "Event ID 4688 logs process creation, not PowerShell script block content." },
        { "id": "d", "text": "7045", "correct": false, "feedback": "Event ID 7045 logs new service installation, not PowerShell activity." }
      ],
      "explanation": "Script Block Logging (Event ID 4104) captures the full text of all PowerShell script blocks to the Microsoft-Windows-PowerShell/Operational log."
    }
  ]
}
```

**Terminal exercise placeholder (`exercises/01.json`):**
```json
{
  "id": "logging-auditing-ex-01",
  "moduleId": "logging-auditing",
  "title": "Enable Script Block Logging",
  "status": "placeholder",
  "description": "Use PowerShell to enable Script Block Logging via the registry on PIPELINE-DC01.",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-12"],
  "context": "You are logged into PIPELINE-DC01 as a domain administrator. Script Block Logging is currently disabled.",
  "steps": [
    {
      "id": "step-1",
      "instruction": "Check whether the ScriptBlockLogging registry key exists.",
      "hint": "Use Get-Item or Get-ItemProperty with the HKLM: path.",
      "expectedCommands": [
        {
          "pattern": "Get-Item.*ScriptBlockLogging|Get-ItemProperty.*ScriptBlockLogging",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "Get-Item : Cannot find path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging' because it does not exist.\nAt line:1 char:1\n+ Get-Item HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging",
      "feedbackOnWrong": "Navigate to HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell and check for ScriptBlockLogging."
    }
  ]
}
```

**Scenario placeholder (`scenarios/01.json`):**
```json
{
  "id": "logging-auditing-scenario-01",
  "moduleId": "logging-auditing",
  "title": "Investigating a Suspicious Login on PIPELINE-DC01",
  "status": "placeholder",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-2"],
  "narrative": "Your SIEM alerts you to 47 failed logon attempts on PIPELINE-DC01 over the past 10 minutes, followed by one successful logon from an unknown workstation at 03:42 UTC.",
  "phases": [
    {
      "id": "phase-1",
      "title": "Initial Triage",
      "type": "decision",
      "prompt": "What is your first action?",
      "options": [
        {
          "id": "opt-a",
          "text": "Immediately disable the account that successfully logged in.",
          "outcome": "Disabling the account stops the attacker but also alerts them and destroys evidence of ongoing activity. Triage first.",
          "correct": false
        },
        {
          "id": "opt-b",
          "text": "Query the Security event log on PIPELINE-DC01 for Event IDs 4624 and 4625 around the incident window.",
          "outcome": "Correct. Reviewing the event log first establishes the timeline and source IP before you take any containment action.",
          "correct": true
        }
      ]
    }
  ]
}
```

**Schema contract notes:**
- `"status": "placeholder"` field signals to Phase 4/5/6 engines that this content is a stub. Engines should check `status !== 'placeholder'` before rendering as a live exercise.
- All placeholder schemas are valid JSON and can be fetched without error; they simply won't render interactive content yet.
- The quiz has one real question to serve as the Phase 4 engine test case.

---

## Common Pitfalls

### Pitfall 1: Shiki `createHighlighter` called inside the marked renderer (not walkTokens)

**What goes wrong:** If `getHighlighter()` is called inside the `code(token)` renderer function (not in `walkTokens`), the renderer cannot be async — marked expects renderers to return strings synchronously. The Shiki call silently returns a Promise that gets coerced to `[object Promise]` in the HTML output.

**Why it happens:** marked.js v18 renderer methods are called synchronously during `parser.parse()`. Only `walkTokens` supports async.

**How to avoid:** Run Shiki in `walkTokens`, store the result on `token.shikiHtml`, then read `token.shikiHtml` synchronously in the `code(token)` renderer.

**Warning signs:** Code blocks in rendered lesson show `[object Promise]` text or raw unstyled code.

---

### Pitfall 2: OT callout detection using `token.text` instead of `token.raw`

**What goes wrong:** The `blockquote` renderer receives a token with `token.text` (the blockquote text after stripping `>` prefixes and inline formatting) and `token.raw` (the original Markdown source). Detecting `[!OT]` in `token.text` may fail if marked strips the `!` or normalizes the text. Use `token.raw` which contains the original `> [!OT]` string.

**Why it happens:** marked pre-processes blockquote text for inline tokens.

**How to avoid:** Check `token.raw.trimStart().startsWith('> [!OT]')` in the blockquote renderer.

**Warning signs:** OT callouts render as standard blockquotes with `[!OT]` text visible.

---

### Pitfall 3: Lucide `createIcons()` called before lesson HTML is in the DOM

**What goes wrong:** `createIcons()` called in `handleRoute()` (current pattern in router.js) processes only the DOM elements present at call time. Code block copy buttons injected by the marked renderer are added *after* `handleRoute()` sets `app.innerHTML`. The Copy/Check icons in code blocks never activate.

**Why it happens:** `app.innerHTML = renderer(params)` is synchronous for module-view but async for lesson-view (awaits fetch + Shiki). `handleRoute()` calls `createIcons()` before the async render completes.

**How to avoid:** Call `activateIcons()` at the end of `renderLesson()` after all DOM mutations are complete, not in the generic `handleRoute()` post-render hook.

**Warning signs:** Copy buttons show `data-lucide="copy"` attribute text or blank space instead of the icon.

---

### Pitfall 4: gray-matter CJS/ESM conflict with Vite

**What goes wrong:** gray-matter is CJS-only (no `"type": "module"` export). Vite handles CJS interop via `require()` emulation, but it can emit warnings during build and may increase bundle weight. The `js-yaml` v3 dependency it pulls in is also CJS.

**Why it happens:** gray-matter was written before ESM adoption.

**How to avoid:** Use manual frontmatter parsing (Pattern 1 above). If gray-matter is genuinely needed later (TOML support, complex YAML), use `gray-matter-es` (ESM-only, browser-compatible, API-compatible).

**Warning signs:** `require is not defined` errors in browser console; Vite build warnings about CJS dependencies.

---

### Pitfall 5: HEAD fetch CORS on localhost dev server

**What goes wrong:** During local development (`npm run dev`), `fetch(url, { method: 'HEAD' })` against `localhost` works fine. On GitHub Pages, HEAD requests to static files also work. However, if a HEAD request fails due to network/CORS during dev, the sidebar shows all lessons as unavailable.

**Why it happens:** Vite dev server correctly handles HEAD for files in `public/`. No CORS issue on same-origin requests.

**How to avoid:** The pattern is safe. However, during development with a proxied API or when testing with `file://` protocol (not recommended), HEAD may fail. Always test via `npm run dev` (Vite dev server), not by opening `index.html` directly.

**Warning signs:** All sidebar lesson links show as disabled spans on localhost but expected to be enabled.

---

### Pitfall 6: Lesson file path mismatch between MODULES config and public/data/

**What goes wrong:** `MODULES` array uses lesson IDs `intro`, `ps-logging`, `audit-policies`. If the `.md` files are named `01-intro.md`, `02-ps-logging.md`, etc. (with numeric prefix per CLAUDE.md architecture diagram), the HEAD fetch will 404 even though the file exists.

**Why it happens:** CLAUDE.md lists filenames with numeric prefixes (`01-intro.md`) but `modules-config.js` uses IDs without prefix (`intro`). Phase 2 must pick one convention and apply it consistently.

**Resolution (LOCKED by D-07 + CONTEXT.md):** The lesson IDs in `MODULES` are `intro`, `ps-logging`, `audit-policies`. The `.md` filenames MUST be `intro.md`, `ps-logging.md`, `audit-policies.md` (no numeric prefix). The CLAUDE.md architecture diagram showing `01-intro.md` was written before the MODULES config was locked. The MODULES config wins — use `{lessonId}.md` as the filename pattern.

**Warning signs:** All Module 1 lessons show as disabled in sidebar despite `.md` files existing.

---

## Code Examples

### Copy-to-Clipboard Button Handler

```javascript
// Source: MDN Clipboard API + UI-SPEC.md interaction contract
// Attach after lesson DOM is rendered; delegate from .lesson-wrapper

document.querySelector('.lesson-wrapper')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('.code-copy-btn');
  if (!btn) return;
  const code = btn.dataset.code ?? '';
  try {
    await navigator.clipboard.writeText(code);
    // Success: swap icon for 2 seconds
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', 'check');
      icon.style.color = '#4ade80';
      btn.setAttribute('aria-label', 'Copied!');
      // Re-run createIcons to render the new icon
      import('lucide').then(({ createIcons, Check }) => {
        createIcons({ icons: { Check }, attrs: { 'stroke-width': 2 }, rootNode: btn });
      });
    }
    setTimeout(() => {
      if (icon) {
        icon.setAttribute('data-lucide', 'copy');
        icon.style.color = '';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        import('lucide').then(({ createIcons, Copy }) => {
          createIcons({ icons: { Copy }, attrs: { 'stroke-width': 2 }, rootNode: btn });
        });
      }
    }, 2000);
  } catch {
    // Silent failure per CONTEXT.md — clipboard is optional convenience
    console.warn('Clipboard write failed');
  }
});
```

**Note:** Storing raw code text on `data-code` attribute requires HTML-escaping. Use `esc(token.text)` when writing the attribute, and the browser will decode it back to the raw string when reading `btn.dataset.code`. No double-encoding issue.

### Lesson Prev/Next Computation

```javascript
// Source: Pure logic from MODULES config + UI-SPEC.md
// src/views/lesson-view.js

function getLessonNav(moduleId, lessonId) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return { prev: null, next: null };
  const idx = mod.lessons.findIndex(l => l.id === lessonId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? { moduleId, lessonId: mod.lessons[idx - 1].id, title: mod.lessons[idx - 1].title } : null,
    next: idx < mod.lessons.length - 1 ? { moduleId, lessonId: mod.lessons[idx + 1].id, title: mod.lessons[idx + 1].title } : null,
  };
}
```

### Module 1 Lesson Frontmatter Examples

```markdown
---
title: Introduction to Windows Event Logs
lessonId: intro
moduleId: logging-auditing
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-2, NIST-AU-3]
---
```

```markdown
---
title: Enabling PowerShell Script Block Logging
lessonId: ps-logging
moduleId: logging-auditing
order: 2
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-CM-6]
---
```

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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getHighlighter()` (Shiki v1/v2) | `createHighlighter()` (Shiki v2+) | Shiki v2.0 | Direct rename; `getHighlighter` still aliased in Shiki v4 but deprecated [CITED: shiki/docs/blog/v2.md] |
| `code(code, infostring, escaped)` positional args (marked v4) | `code(token)` token object with `token.text`, `token.lang` (marked v5+) | marked v5.0 | Breaking change for custom renderers migrating from v4. v17/v18 use token object. |
| highlight.js for PowerShell | Shiki with TextMate grammar | 2022-2023 | highlight.js PowerShell support is incomplete; Shiki matches VS Code output exactly |
| CDN `<script>` for Lucide | npm package with tree-shakable named imports | lucide-icons added ESM exports ~2023 | Bundle size reduced; no global `window.lucide` dependency |

**Deprecated/outdated:**
- `getHighlighter()`: Renamed to `createHighlighter()` in Shiki v2. Still aliased in v4 for backward compat but should use `createHighlighter()`.
- `marked.setOptions()` global config: Still works in v18 but `marked.use()` is the recommended extension API.
- `new marked.Renderer()` + `renderer.code = function(code, infostring) {}` positional args: Removed in v5+. Use `marked.use({ renderer: { code(token) {} } })`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub Pages CDN correctly returns 404 for missing files on HEAD requests (not a redirect or other non-200) | Pattern 5: Sidebar HEAD fetch | Sidebar shows all lessons as unavailable. Mitigation: test against deployed site in Wave 1. |
| A2 | `complianceControls[]` string format (`NIST-AU-2`, `TSA-Monitoring`) is adequate for Phase 6 compliance index cross-referencing | Module 1 Content Spec | Phase 6 may require a different ID format (e.g., full OSCAL identifiers). Risk is low — frontmatter can be updated when Phase 6 defines the format. |
| A3 | `token.raw` on a blockquote token reliably starts with `> [!OT]` when the Markdown source is `> [!OT]\n> text` | Pattern 2: OT callout detection | OT callouts render as plain blockquotes with `[!OT]` text visible. Mitigation: test with `> [!OT]` in first lesson before committing all 3 lessons. |
| A4 | Shiki v4 `createHighlighter` with `langs: ['powershell']` covers PS 5.1 grammar without additional configuration | Standard Stack | PS 5.1-specific tokens (e.g., `#Requires` statements) may not highlight correctly. Mitigation: visually verify a PS 5.1 code block in the browser during Wave 0. |

---

## Open Questions

1. **`complianceControls[]` value format**
   - What we know: Phase 6 will build a compliance index. `complianceControls[]` frontmatter array feeds it.
   - What's unclear: The exact ID string format Phase 6 needs (short form like `NIST-AU-2`, long form like `NIST SP 800-53 Rev 5 AU-2`, or OSCAL-style).
   - Recommendation: Use short human-readable form (`NIST-AU-2`) in Phase 2 lessons. Phase 6 will define the canonical format and can normalize on read.

2. **`module.json` location: public/data/modules/{id}/module.json vs. public/data/modules/index.json**
   - What we know: ARCHITECTURE.md suggests `/content/modules/index.json` (one file for all modules). CLAUDE.md architecture shows `data/modules/{id}/module.json` (per-module file).
   - What's unclear: Which pattern Phase 2 should implement.
   - Recommendation: Use per-module `module.json` files (`public/data/modules/logging-auditing/module.json`). This is consistent with the per-module directory layout and avoids a single large index.json growing without bound across 5 modules.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite build, npm install | ✓ | 24.15.0 | — |
| npm | Package install | ✓ | (bundled with Node) | — |
| Vite | Build + dev server | ✓ | 8.0.12 (in package.json) | — |
| shiki | Syntax highlighting | ✗ (not yet installed) | 4.0.2 available on npm | — (required, no fallback for CONT-02) |
| marked | Markdown rendering | ✗ (not yet installed) | 18.0.3 available on npm | — (required, no fallback for CONT-01) |
| lucide (npm) | Copy/Check/AlertCircle icons | ✗ (CDN only in index.html) | 1.14.0 available on npm | — (required; CDN approach breaks for dynamically-injected icons) |
| vitest | Unit tests | ✓ | 4.1.6 (in devDependencies) | — |
| happy-dom | DOM test environment | ✓ | 20.9.0 (in devDependencies) | — |
| GitHub Pages | Static file hosting | ✓ | Active (Phase 1 deployed) | — |

**Missing dependencies with no fallback:**
- `shiki` — required for CONT-02; install via `npm install shiki`
- `marked` — required for CONT-01; install via `npm install marked`
- `lucide` (npm package) — required for icon migration; install via `npm install lucide`

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.js` (exists — `environment: 'happy-dom'`, `include: ['tests/**/*.test.js']`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (no separate watch mode needed) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | `parseFrontmatter()` extracts title, lessonId, moduleId, order, complianceTags, complianceControls | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| CONT-01 | `parseFrontmatter()` returns empty meta + full body when no frontmatter present | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| CONT-01 | `parseFrontmatter()` handles malformed YAML (missing close delimiter) gracefully | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| CONT-01 | `renderMarkdown()` returns an HTML string for valid Markdown | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| CONT-02 | Shiki renders a `<pre>` block with syntax tokens for a `powershell` code block | integration (manual/E2E) | visual browser check | n/a |
| CONT-03 | Copy button is present in rendered code block HTML | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| CONT-03 | `navigator.clipboard.writeText` is called with correct raw code text on button click | integration (happy-dom) | `npm test -- tests/lesson-view.test.js` | ❌ Wave 0 |
| CONT-04 | Compliance badge row renders when `complianceTags` is non-empty | unit | `npm test -- tests/lesson-view.test.js` | ❌ Wave 0 |
| CONT-04 | Compliance badge row is absent when `complianceTags` is empty | unit | `npm test -- tests/lesson-view.test.js` | ❌ Wave 0 |
| SHELL-02 | Router matches `#/lesson/:moduleId/:lessonId` and extracts both params | unit | `npm test -- tests/router.test.js` | ❌ Wave 0 add case to existing |
| SHELL-01 | `getLessonNav()` returns correct prev/next for first, middle, last lessons | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| MOD-01 | OT callout (`> [!OT]`) renders as `.ot-callout` element, not plain blockquote | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |
| MOD-01 | Standard blockquote (no `[!OT]`) renders as `<blockquote>` | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 |

**Items requiring E2E/manual verification (not automatable in Vitest):**
- CONT-02: Shiki token colors visible in browser (font colors, VS Code-like PS highlighting) — visual check
- CONT-03: Copy button icon swap (Copy → Check → Copy) — requires real clipboard API + timing
- Sidebar HEAD fetch activation (Module 1 lessons become clickable, other modules remain disabled)
- Lesson loading skeleton visible during fetch delay (simulate with Chrome DevTools slow network)
- Error state renders correctly on 404 fetch
- Prev/next navigation between all 3 Module 1 lessons

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/content-loader.test.js` — covers `parseFrontmatter()` (5 cases), `getLessonNav()` (3 cases), OT callout detection (2 cases), code block HTML structure (1 case)
- [ ] `tests/lesson-view.test.js` — covers compliance badge row presence/absence (2 cases), copy button presence (1 case), clipboard call (1 case with mocked navigator.clipboard)
- [ ] Add lesson route test case to existing `tests/router.test.js` — `matchRoute('#/lesson/logging-auditing/intro')` returns `{ view: 'lesson', params: { moduleId: 'logging-auditing', lessonId: 'intro' } }`

Note: Shiki rendering tests require the real Shiki package to be installed. Mark the `renderMarkdown()` integration test as requiring `shiki` to be present or mock `getHighlighter` in unit tests.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not applicable — no auth in this phase |
| V3 Session Management | no | Not applicable |
| V4 Access Control | no | Not applicable |
| V5 Input Validation | partial | Lesson `.md` files are repo-authored (not user input). `esc()` from utils/escape.js applied to all frontmatter values injected into HTML templates. |
| V6 Cryptography | no | Not applicable |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Frontmatter injection into innerHTML | Tampering | `esc()` all frontmatter values (`title`, `lessonId`, etc.) before inserting into template strings |
| `data-code` attribute XSS | Tampering | `esc(token.text)` when writing the copy button `data-code` attribute; browser decodes entity-escaped value as raw string for clipboard write |
| Malicious `.md` content | Tampering | Lesson files are authored in the repository — not user-uploaded content. marked.js does not sanitize HTML in Markdown by default. If the content pipeline ever accepts external/user Markdown, add DOMPurify. Not required for v1. |
| CDN integrity failure (Lucide CDN) | Denial of Service | Migrating to npm bundle this phase eliminates CDN dependency entirely. SRI hash on CDN tag (`integrity=sha384-...`) was present in Phase 1 as mitigation. |

---

## File Creation Checklist

### New files to create

| File | Type | Content |
|------|------|---------|
| `src/content-loader.js` | NEW | `parseFrontmatter()`, `renderMarkdown()`, `getHighlighter()` singleton, `fetchLesson()` with cache, `checkLessonAvailability()` |
| `src/views/lesson-view.js` | NEW | `renderLesson({ moduleId, lessonId })` — loading skeleton, fetch, render, compliance bar, footer nav |
| `public/data/modules/logging-auditing/module.json` | NEW | Module metadata (see schema above) |
| `public/data/modules/logging-auditing/lessons/intro.md` | NEW | Lesson 1 content |
| `public/data/modules/logging-auditing/lessons/ps-logging.md` | NEW | Lesson 2 content |
| `public/data/modules/logging-auditing/lessons/audit-policies.md` | NEW | Lesson 3 content |
| `public/data/modules/logging-auditing/quizzes/01.json` | NEW | Quiz placeholder (see schema above) |
| `public/data/modules/logging-auditing/exercises/01.json` | NEW | Exercise placeholder (see schema above) |
| `public/data/modules/logging-auditing/scenarios/01.json` | NEW | Scenario placeholder (see schema above) |
| `tests/content-loader.test.js` | NEW | Wave 0 unit tests for pure functions |
| `tests/lesson-view.test.js` | NEW | Wave 0 unit tests for lesson view render helpers |

### Existing files to modify

| File | Change |
|------|--------|
| `package.json` | Add `shiki`, `marked`, `lucide` to `dependencies` |
| `index.html` | Remove Lucide CDN `<script>` tag; add `<meta name="description">` if missing |
| `src/style.css` | Add Phase 2 `@theme` tokens (from UI-SPEC.md) + lesson layout CSS + code block CSS + OT callout CSS + sidebar lesson item CSS |
| `src/router.js` | Add `{ pattern: '#/lesson/:moduleId/:lessonId', view: 'lesson' }` to routes array; import `renderLesson` from lesson-view.js; add `lesson: (params) => renderLesson(params)` to `viewRenderers`; update `setActiveModule` call |
| `src/sidebar.js` | Make `initSidebar()` async; add `checkLessonAvailability()` HEAD fetch logic; render lesson items as `<a>` vs `<span>` based on availability; add `setActiveLesson(moduleId, lessonId)` export |
| `src/main.js` | Replace `lucide.createIcons()` global check with bundled import; import `activateIcons` helper; update `initSidebar()` call (now async — await it) |

### Dependency order within Phase 2

1. `package.json` changes + `npm install` — must be first
2. `index.html` CDN removal — coordinate with main.js lucide migration
3. `src/style.css` token additions — can be done in parallel with JS work
4. `src/content-loader.js` — depends on: `src/utils/escape.js` (exists), `shiki` (installed), `marked` (installed)
5. `src/views/lesson-view.js` — depends on: `content-loader.js`, `badge.js` (exists), `modules-config.js` (exists), `sidebar.js` (needs `setActiveLesson`)
6. `src/sidebar.js` modifications — depends on: `content-loader.js` (checkLessonAvailability), `lucide` (installed)
7. `src/router.js` modifications — depends on: `lesson-view.js`
8. `src/main.js` modifications — depends on: `lucide` (installed), `sidebar.js` modifications
9. `public/data/modules/logging-auditing/` files — content authoring, can be done in parallel
10. Test files — depend on all source files being created

---

## Sources

### Primary (HIGH confidence)

- Context7 `/shikijs/shiki` — `createHighlighter`, `codeToHtml`, fine-grained bundles, WASM engine options
- Context7 `/markedjs/marked` — `walkTokens async`, `renderer: { code(token) }`, `renderer: { blockquote(token) }`, async renderer pattern
- Context7 `/lucide-icons/lucide` — `createIcons({ icons: {...} })` named import pattern, tree-shaking
- npm registry (2026-05-11) — shiki@4.0.2, marked@18.0.3, lucide@1.14.0, vitest@4.1.6

### Secondary (MEDIUM confidence)

- [marked.js USING_PRO.md](https://marked.js.org/using_pro) — `Tokens.Code` and `Tokens.Blockquote` type signatures (token.text, token.lang, token.raw, token.tokens[])
- [GitHub markedjs/marked Tokens.ts](https://github.com/markedjs/marked/blob/master/src/Tokens.ts) — confirmed `Tokens.Code.text`, `Tokens.Code.lang`, `Tokens.Blockquote.raw`, `Tokens.Blockquote.tokens`
- [shiki.style/guide/install](https://shiki.style/guide/install) — codeToHtml shorthand, `createHighlighter` singleton pattern
- [mangan cybersecurity TSA SD-02F analysis](https://www.mangancyber.com/tsa-pipeline-directive-sd02f/) — TSA SD-02F logging/monitoring requirements (no section numbers available in public summaries)
- [csf.tools NIST SP 800-53 r5 AU controls](https://csf.tools/reference/nist-sp-800-53/r5/au/) — AU-2, AU-3, AU-12 control names verified

### Tertiary (LOW confidence)

- GitHub Pages HEAD fetch returning 404 for missing static files — standard static server behavior, not formally verified against GitHub Pages CDN specifically [ASSUMED]
- `complianceControls[]` short-form ID strings (`NIST-AU-2`) adequate for Phase 6 — Phase 6 format not yet defined [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry; APIs verified against Context7 official docs
- Architecture: HIGH — patterns verified against library docs; marked/Shiki async integration confirmed
- Module 1 content spec: MEDIUM — TSA SD-02F logging requirements confirmed at conceptual level; specific control IDs not formally validated against full directive text (PDF blocked, public summaries used)
- Pitfalls: HIGH — all verified against actual library behavior or official documentation
- Validation architecture: HIGH — based on existing project test infrastructure confirmed by file inspection

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (30-day validity; marked and Shiki are stable libraries; lucide icon names are stable)
