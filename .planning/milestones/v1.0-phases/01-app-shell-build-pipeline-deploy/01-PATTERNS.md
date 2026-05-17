# Phase 1: App Shell + Build Pipeline + Deploy — Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 12 new files (greenfield — no existing source files)
**Analogs found:** 0 / 12 (greenfield project — Phase 1 establishes all patterns)

> This is a greenfield project. There are no existing source files to copy patterns from.
> Every pattern in this document is sourced from RESEARCH.md and UI-SPEC.md.
> Phase 1 output becomes the canonical pattern source for all subsequent phases.

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `vite.config.js` | config | — | none (greenfield) | no analog |
| `index.html` | config | request-response | none (greenfield) | no analog |
| `src/style.css` | config | — | none (greenfield) | no analog |
| `src/main.js` | controller (entry) | request-response | none (greenfield) | no analog |
| `src/router.js` | utility (router) | request-response | none (greenfield) | no analog |
| `src/modules-config.js` | model (static data) | — | none (greenfield) | no analog |
| `src/sidebar.js` | component | event-driven | none (greenfield) | no analog |
| `src/views/home-view.js` | component | request-response | none (greenfield) | no analog |
| `src/views/module-view.js` | component | request-response | none (greenfield) | no analog |
| `src/views/not-found-view.js` | component | request-response | none (greenfield) | no analog |
| `data/compliance-refs.json` | model (static data) | — | none (greenfield) | no analog |
| `.github/workflows/deploy.yml` | config (CI/CD) | — | none (greenfield) | no analog |
| `public/.nojekyll` | config | — | none (greenfield) | no analog |
| `tests/router.test.js` | test | — | none (greenfield) | no analog |
| `tests/sidebar.test.js` | test | — | none (greenfield) | no analog |
| `tests/compliance-refs.test.js` | test | — | none (greenfield) | no analog |
| `vitest.config.js` | config (test) | — | none (greenfield) | no analog |

---

## Pattern Assignments

### `vite.config.js` (config)

**Source:** RESEARCH.md — Pattern 1: Vite + Tailwind v4 Configuration
**External ref:** https://vite.dev/guide/static-deploy.html

**Complete file pattern:**
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pipeline-cyber-training/',   // REQUIRED — project-scoped GitHub Pages URL
  plugins: [tailwindcss()],
})
```

**Critical constraints:**
- `base` MUST be set before any build — missing it causes all assets to 404 on GitHub Pages
- Do NOT create `tailwind.config.js` — Tailwind v4 configuration lives in `@theme` block in CSS only
- Do NOT create `postcss.config.js` — `@tailwindcss/vite` plugin replaces PostCSS setup entirely

---

### `index.html` (config, request-response)

**Source:** RESEARCH.md — Pattern 2: CSS Grid App Shell Layout; UI-SPEC.md — Component Inventory
**External ref:** https://tailwindcss.com/docs/installation

**Complete structure pattern:**
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OT Security Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono&display=swap" rel="stylesheet" />
  <!-- Lucide CDN (Phase 1 only — swap to npm in Phase 2) -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body class="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] h-screen overflow-hidden">
  <div id="shell" class="grid h-screen"
       style="grid-template-columns: var(--sidebar-width-expanded) 1fr; grid-template-rows: var(--topbar-height) 1fr;">
    <header id="top-bar" class="col-span-2 ..."><!-- top bar content --></header>
    <nav id="sidebar" aria-label="Module navigation"><!-- sidebar content --></nav>
    <main id="app" role="main"><!-- router injects views here --></main>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Top bar structure (UI-SPEC Component 2):**
- Height: 48px, `background: var(--color-bg-secondary)`, `border-bottom: 1px solid var(--color-border)`
- Left: "OT Security Lab" at `--text-display` (28px), weight 600, color `--color-accent`
- Right: "Compliance Index" link (14px, semibold, `--color-text-muted`, hover → `--color-accent`) + "0 of 5 modules complete" (14px, semibold, uppercase, letter-spacing 0.08em)
- `position: sticky; top: 0; z-index: 50`

**Sidebar structure (UI-SPEC Component 3):**
- `background: var(--color-bg-secondary)`, `border-right: 1px solid var(--color-border)`
- Active module: `border-left: 3px solid var(--color-accent)`, `background: rgba(249, 115, 22, 0.08)`, text `--color-accent`, `aria-current="page"`
- Inactive module: text `--color-text-primary`
- Lesson subitems: `<span>` (not `<a>`), `pointer-events: none`, opacity 40%, `aria-disabled="true"`, `aria-label="{title} — available in Phase 2"`
- Toggle button at bottom: 44×44px hit target, `aria-label="Collapse navigation"` (dynamic)
- In collapsed mode: each module link gets `aria-label='{module name}'` for screen readers

**Sidebar collapse CSS:**
```css
/* Toggled on #shell via JS class */
#shell.sidebar-collapsed {
  grid-template-columns: var(--sidebar-width-collapsed) 1fr;
}

/* Transition on sidebar element itself — NOT on grid container */
#sidebar {
  transition: width 200ms ease;
  overflow: hidden;
}

/* Text labels fade with slight delay */
.sidebar-label {
  transition: opacity 150ms ease 50ms, width 150ms ease 50ms;
}
```

**Accessibility requirements (UI-SPEC Accessibility Contract):**
- Semantic elements: `<header>`, `<nav>`, `<main>`, `<section>` — no `<div>` wrappers where semantic elements apply
- All interactive elements: `outline: 3px solid #f97316; outline-offset: 2px` focus ring — never suppressed
- Tab order: top bar → sidebar modules → sidebar toggle → main content

---

### `src/style.css` (config)

**Source:** RESEARCH.md — Pattern 1; UI-SPEC.md — Tailwind v4 Token Declaration
**External ref:** https://tailwindcss.com/docs/installation

**Complete file pattern — this is the canonical token source for all phases:**
```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-bg-base: #1a1a1a;
  --color-bg-secondary: #2a2a2a;
  --color-bg-surface: #f5f5f4;
  --color-accent: #f97316;
  --color-accent-hover: #ea6c00;
  --color-text-primary: #f5f5f4;
  --color-text-muted: #737373;
  --color-text-on-light: #1a1a1a;
  --color-border: #3a3a3a;
  --color-destructive: #ef4444;

  /* Badge colors */
  --color-badge-tsa-bg: #1e3a5f;
  --color-badge-tsa-text: #93c5fd;
  --color-badge-nist-bg: #1a3a2a;
  --color-badge-nist-text: #86efac;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  --text-mono: 0.8125rem;    /* 13px */
  --text-body: 0.875rem;     /* 14px */
  --text-heading: 1.25rem;   /* 20px */
  --text-display: 1.75rem;   /* 28px */

  /* Spacing (4px base) */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */

  /* Fixed layout dimensions */
  --sidebar-width-expanded: 256px;
  --sidebar-width-collapsed: 48px;
  --topbar-height: 48px;
}
```

**Critical constraint:** No `tailwind.config.js` — all configuration lives here. This file is the single rebranding point (CONTEXT.md D-12).

---

### `src/main.js` (controller — entry point, request-response)

**Source:** RESEARCH.md — System Architecture Diagram; Code Examples — Compliance Badge Rendering
**External ref:** https://vite.dev/guide/env-and-mode.html (`import.meta.env.BASE_URL`)

**Responsibilities:** Initialize app — fetch compliance refs once, then start the router.

**Pattern:**
```javascript
// src/main.js
import { handleRoute } from './router.js';
import './style.css';

// Module-level cache — fetched once on init, shared across all views
let complianceRefs = null;

export async function loadComplianceRefs() {
  // import.meta.env.BASE_URL = '/pipeline-cyber-training/' in prod, '/' in dev
  const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
  const res = await fetch(url);
  if (!res.ok) return null;
  complianceRefs = await res.json();
  return complianceRefs;
}

export function getComplianceRefs() {
  return complianceRefs;
}

export function renderBadge(directiveKey) {
  // Fallback text only if fetch failed (network error)
  const fallbacks = { TSA: 'TSA SD-02F', NIST: 'NIST SP 800-82 Rev 3' };
  const shortName = complianceRefs?.directives?.[directiveKey]?.shortName
    ?? fallbacks[directiveKey];

  const colorClasses = {
    TSA:  'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${colorClasses[directiveKey] ?? ''}">${shortName}</span>`;
}

async function init() {
  await loadComplianceRefs();
  handleRoute();             // render the initial view from current hash
}

init();
```

**Critical constraint:** `import.meta.env.BASE_URL` must be used for all asset URL construction — never hardcode `/pipeline-cyber-training/` as a string in JS.

---

### `src/router.js` (utility — router, request-response)

**Source:** RESEARCH.md — Pattern 3: Hash Router Implementation
**External ref:** MDN — `hashchange` event, `window.location.hash`

**Complete pattern (~60 lines of vanilla JS):**
```javascript
// src/router.js
import { renderHome }    from './views/home-view.js';
import { renderModule }  from './views/module-view.js';
import { renderNotFound } from './views/not-found-view.js';

const routes = [
  { pattern: '#/',                           view: 'home' },
  { pattern: '#/module/:moduleId',           view: 'module' },
  // Phase 2+ will add: { pattern: '#/lesson/:moduleId/:lessonId', view: 'lesson' }
];

function extractParams(hash, pattern) {
  const hashParts   = hash.slice(1).split('/').filter(Boolean);
  const patternParts = pattern.slice(1).split('/').filter(Boolean);
  if (hashParts.length !== patternParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
    } else if (patternParts[i] !== hashParts[i]) {
      return null;
    }
  }
  return params;
}

function matchRoute(hash) {
  const cleanHash = hash || '#/';
  for (const route of routes) {
    const params = extractParams(cleanHash, route.pattern);
    if (params !== null) return { view: route.view, params };
  }
  return { view: 'not-found', params: {} };
}

const viewRenderers = {
  home:      (params) => renderHome(params),
  module:    (params) => renderModule(params),
  'not-found': (params) => renderNotFound(params),
};

export function handleRoute() {
  const { view, params } = matchRoute(window.location.hash);
  const app = document.getElementById('app');
  const renderer = viewRenderers[view] ?? viewRenderers['not-found'];
  app.innerHTML = renderer(params);
  updateSidebarActiveState(params.moduleId);
}

function updateSidebarActiveState(activeModuleId) {
  document.querySelectorAll('[data-module-id]').forEach(el => {
    const isActive = el.dataset.moduleId === activeModuleId;
    el.classList.toggle('sidebar-module--active', isActive);
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
```

**Security note (RESEARCH.md — Security Domain):** Never use `eval()` or `new Function()` on hash content. `decodeURIComponent()` is the only transformation applied to hash segments. Use `textContent` (not `innerHTML`) for any string derived from `location.hash` that reaches the DOM.

---

### `src/modules-config.js` (model — static data)

**Source:** RESEARCH.md — Pattern 6: Module Data Shape

**This file is replaced by Phase 2's `data/modules/index.json` fetch. The shape defined here is the contract Phase 2 must match.**

```javascript
// src/modules-config.js
// Static module metadata for Phase 1 placeholder views.
// Phase 2 replaces this with: fetch(import.meta.env.BASE_URL + 'data/modules/index.json')
// Shape contract: id, title, icon (Lucide name), description, order,
//                 estimatedMinutes, lessons[]{id, title}, complianceTags[]

export const MODULES = [
  {
    id: 'logging-auditing',
    title: 'Logging & Auditing',
    icon: 'BookOpen',
    description: 'Configure Windows Event Logging and PowerShell script block logging to meet compliance requirements.',
    order: 1,
    estimatedMinutes: 45,
    lessons: [
      { id: 'intro',         title: 'Introduction to Windows Event Logs' },
      { id: 'ps-logging',    title: 'Enabling PowerShell Script Block Logging' },
      { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'network-hardening',
    title: 'Network Hardening',
    icon: 'Shield',
    description: 'Firewall rules, network segmentation, and port scanning via PowerShell.',
    order: 2,
    estimatedMinutes: 50,
    lessons: [
      { id: 'firewall-basics',      title: 'Windows Firewall with Advanced Security' },
      { id: 'network-segmentation', title: 'OT Network Segmentation Principles' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'account-access',
    title: 'Account & Access Management',
    icon: 'Users',
    description: 'Active Directory, least privilege, service accounts, and password policies.',
    order: 3,
    estimatedMinutes: 45,
    lessons: [
      { id: 'least-privilege',  title: 'Least Privilege Principles' },
      { id: 'service-accounts', title: 'Securing Service Accounts' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    icon: 'AlertTriangle',
    description: 'Anomaly detection, system isolation, and evidence collection via PowerShell.',
    order: 4,
    estimatedMinutes: 40,
    lessons: [
      { id: 'anomaly-detection',  title: 'Detecting Anomalies with PowerShell' },
      { id: 'evidence-collection', title: 'Evidence Collection and Preservation' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'patch-management',
    title: 'Patch Management',
    icon: 'Wrench',
    description: 'Windows/IT patching, OT/ICS patching workflows, and compliance reporting.',
    order: 5,
    estimatedMinutes: 60,
    lessons: [
      { id: 'wsus-patching', title: 'Windows Update and WSUS' },
      { id: 'ot-patching',   title: 'OT/ICS Patching in Air-Gapped Environments' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
];
```

**Lucide icon names** (one per module — used in sidebar and module view header):
- `BookOpen` → Logging & Auditing
- `Shield` → Network Hardening
- `Users` → Account & Access Management
- `AlertTriangle` → Incident Response
- `Wrench` → Patch Management

---

### `src/sidebar.js` (component, event-driven)

**Source:** RESEARCH.md — Code Examples: Sidebar Collapse Toggle; UI-SPEC.md — Interaction Contracts

**Responsibilities:** sidebar collapse toggle, module expand/collapse accordion, active state sync.

**Collapse toggle pattern:**
```javascript
// src/sidebar.js
const shell     = document.getElementById('shell');
const toggleBtn = document.getElementById('sidebar-toggle');
let isCollapsed = false;

toggleBtn.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  shell.classList.toggle('sidebar-collapsed', isCollapsed);
  toggleBtn.setAttribute('aria-label',
    isCollapsed ? 'Expand navigation' : 'Collapse navigation'
  );
  // Hide labels — text disappears before sidebar finishes animating
  document.querySelectorAll('.sidebar-label').forEach(el => {
    el.style.opacity  = isCollapsed ? '0' : '1';
    el.style.width    = isCollapsed ? '0' : '';
    el.style.overflow = isCollapsed ? 'hidden' : '';
  });
});
```

**Module expand/collapse accordion pattern (only one open at a time):**
```javascript
// Called from router after each navigation — keeps sidebar in sync with URL
export function setActiveModule(moduleId) {
  document.querySelectorAll('.sidebar-module').forEach(el => {
    const id       = el.dataset.moduleId;
    const isActive = id === moduleId;
    el.classList.toggle('sidebar-module--active', isActive);
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
    // Show/hide lesson list with max-height transition
    const lessonList = el.querySelector('.sidebar-lessons');
    if (lessonList) {
      lessonList.style.maxHeight = isActive ? lessonList.scrollHeight + 'px' : '0';
    }
  });
}
```

**CSS for lesson list transition:**
```css
.sidebar-lessons {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease;
}
```

---

### `src/views/home-view.js` (component, request-response)

**Source:** UI-SPEC.md — Component 6: Home View; Copywriting Contract

**Returns an HTML string.** The router writes it to `#app` via `innerHTML`.

**Pattern:**
```javascript
// src/views/home-view.js
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../main.js';

export function renderHome() {
  const cards = MODULES.map(mod => `
    <article class="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-[var(--spacing-lg)] rounded hover:border-[var(--color-accent)] transition-colors duration-150 cursor-pointer"
             role="link"
             tabindex="0"
             onclick="location.hash='#/module/${mod.id}'"
             onkeydown="if(event.key==='Enter')location.hash='#/module/${mod.id}'">
      <div class="flex items-center justify-between">
        <h2 class="text-[var(--text-heading)] font-semibold">${mod.title}</h2>
        <i data-lucide="arrow-right" class="text-[var(--color-text-muted)]" style="width:16px;height:16px"></i>
      </div>
      <p class="text-[var(--text-body)] text-[var(--color-text-muted)] mt-[var(--spacing-sm)]">${mod.description}</p>
      <div class="flex gap-[var(--spacing-xs)] mt-[var(--spacing-sm)]">
        ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
      </div>
    </article>
  `).join('');

  return `
    <section class="p-[var(--spacing-xl)] max-w-[800px] mx-auto">
      <h1 class="text-[var(--text-heading)] font-semibold mb-[var(--spacing-sm)]">Select a module to begin</h1>
      <p class="text-[var(--text-body)] text-[var(--color-text-muted)] mb-[var(--spacing-xl)]">
        Five modules covering TSA SD&#8209;02F and NIST SP&nbsp;800&#8209;82 Rev&nbsp;3 compliance controls.
      </p>
      <div class="flex flex-col gap-[var(--spacing-md)]">${cards}</div>
    </section>
  `;
}
```

**Note on compliance string in subheading:** The home view subheading ("Five modules covering…") may include version string text. In Phase 1, this static string is acceptable in `home-view.js` only because it is descriptive prose — not a badge render. Badge renders always use `renderBadge()`. If the TSA directive version changes, the prose string in this view must also be updated, but the badge remains authoritative.

---

### `src/views/module-view.js` (component, request-response)

**Source:** UI-SPEC.md — Component 4: Module Placeholder View; Copywriting Contract

**Returns an HTML string. Reads from `MODULES` config and `renderBadge()` from `main.js`.**

**Pattern:**
```javascript
// src/views/module-view.js
import { MODULES } from '../modules-config.js';
import { renderBadge } from '../main.js';

const SECTION_CARDS = [
  {
    label: 'Lessons',
    body:  'Lessons coming in Phase 2. This module will contain guided lessons with PowerShell examples.',
  },
  {
    label: 'Quizzes',
    body:  'Quizzes coming in Phase 2. Knowledge checks with per-answer explanatory feedback.',
  },
  {
    label: 'Terminal Exercises',
    body:  'Terminal exercises coming in Phase 5. Practice PowerShell commands in a safe simulator.',
  },
  {
    label: 'Scenarios',
    body:  'Scenario exercises coming in Phase 6. Work through realistic compliance incident decisions.',
  },
];

export function renderModule({ moduleId }) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) return renderModuleNotFound(moduleId);

  const sectionCards = SECTION_CARDS.map(s => `
    <div class="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-[var(--spacing-lg)] rounded">
      <h3 class="text-[var(--text-body)] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-[var(--spacing-sm)]">${s.label}</h3>
      <p class="text-[var(--text-body)] text-[var(--color-text-muted)] italic">${s.body}</p>
    </div>
  `).join('');

  return `
    <section class="p-[var(--spacing-xl)]">
      <div class="flex items-center gap-[var(--spacing-sm)] mb-[var(--spacing-md)]">
        <i data-lucide="${mod.icon}" style="width:24px;height:24px;color:var(--color-accent)"></i>
        <h1 class="text-[var(--text-heading)] font-semibold">${mod.title}</h1>
      </div>

      <div class="border-l-[3px] border-[var(--color-border)] pl-[var(--spacing-md)] mb-[var(--spacing-md)] bg-[var(--color-bg-secondary)] p-[var(--spacing-md)]">
        <p class="text-[var(--text-body)] text-[var(--color-text-muted)] text-xs font-semibold uppercase tracking-[0.08em] mb-[var(--spacing-xs)]">Module goal</p>
        <p class="text-[var(--text-body)]">${mod.description}</p>
      </div>

      <div class="mb-[var(--spacing-lg)]">
        <p class="text-[var(--text-body)] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-[var(--spacing-xs)]">Compliance controls covered</p>
        <div class="flex gap-[var(--spacing-xs)]">
          ${mod.complianceTags.map(tag => renderBadge(tag)).join('')}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-[var(--spacing-md)]">
        ${sectionCards}
      </div>
    </section>
  `;
}

function renderModuleNotFound(moduleId) {
  return `
    <section class="p-[var(--spacing-xl)]">
      <p class="text-[var(--text-body)] text-[var(--color-text-muted)]">Module "${moduleId}" not found.</p>
    </section>
  `;
}
```

---

### `src/views/not-found-view.js` (component, request-response)

**Source:** UI-SPEC.md — Copywriting Contract; RESEARCH.md — Security Domain

**Pattern:**
```javascript
// src/views/not-found-view.js
export function renderNotFound() {
  return `
    <section class="p-[var(--spacing-xl)]">
      <h1 class="text-[var(--text-heading)] font-semibold mb-[var(--spacing-sm)]">Page not found</h1>
      <p class="text-[var(--text-body)] text-[var(--color-text-muted)]">
        Use the sidebar to navigate to a module.
      </p>
    </section>
  `;
}
```

**Security note:** This view must never render any content derived from `window.location.hash` via `innerHTML`. If the unmatched hash is displayed, use `el.textContent = ...`, not template literal injection.

---

### `data/compliance-refs.json` (model — static data)

**Source:** RESEARCH.md — Pattern 4: compliance-refs.json Shape; CONTEXT.md D-16

**This is the single source of truth for all compliance version strings in every phase.**

```json
{
  "schemaVersion": 1,
  "lastVerified": "2026-05-11",
  "directives": {
    "TSA": {
      "name": "TSA Security Directive Pipeline-2021-02F",
      "shortName": "TSA SD-02F",
      "effectiveDate": "2025-05-03",
      "expiryDate": "2026-05-02",
      "sourceUrl": "https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf"
    },
    "NIST": {
      "name": "NIST Special Publication 800-82 Revision 3",
      "shortName": "NIST SP 800-82 Rev 3",
      "publishedDate": "2023-09",
      "sourceUrl": "https://csrc.nist.gov/pubs/sp/800/82/r3/final"
    }
  }
}
```

**Critical constraint:** `shortName` is the only string that badge components render. Never write "SD-02F" or "SP 800-82 Rev 3" as a literal string in any JS or HTML file. Verify with: `grep -r "SD-02" src/` — must return no results.

---

### `.github/workflows/deploy.yml` (config — CI/CD)

**Source:** RESEARCH.md — Pattern 5: GitHub Actions Deployment Workflow
**External ref:** https://vite.dev/guide/static-deploy.html

**Complete file pattern:**
```yaml
name: Deploy static content to Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

**Critical constraints:**
- `node-version: 22` — GitHub Actions uses Node 22 regardless of local Node version
- `npm ci` (not `npm install`) — ensures deterministic installs from `package-lock.json`
- Do NOT use `gh-pages` npm package — replaced by this Actions pattern
- After first push: manually set GitHub Pages source to "GitHub Actions" in repo Settings → Pages

---

### `public/.nojekyll` (config)

**Source:** RESEARCH.md — Pitfall 3: .nojekyll in Wrong Directory

**Empty file. No content.**

**Critical constraint:** This file MUST be in `public/`, not the project root. Vite copies `public/` to `dist/` at build time. A `.nojekyll` in the project root does NOT end up in `dist/` and will not disable Jekyll on the deployed artifact. Jekyll strips files/directories starting with `_` — which Vite generates for JS chunks — causing silent missing-module failures in production.

---

### `vitest.config.js` (config — test)

**Source:** RESEARCH.md — Validation Architecture

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',   // browser-like DOM for component/DOM tests
    include: ['tests/**/*.test.js'],
  },
})
```

**Install command:** `npm install -D vitest @vitest/ui happy-dom`

---

### `tests/router.test.js` (test)

**Source:** RESEARCH.md — Validation Architecture; Phase Requirements SHELL-01, SHELL-02

**Test coverage contract:**
- `matchRoute('#/')` returns `{ view: 'home', params: {} }`
- `matchRoute('#/module/logging-auditing')` returns `{ view: 'module', params: { moduleId: 'logging-auditing' } }`
- `matchRoute('#/unknown-path')` returns `{ view: 'not-found', params: {} }`
- `matchRoute('')` (empty hash) returns `{ view: 'home', params: {} }`
- `matchRoute('#/module/logging-auditing/extra/segments')` returns `{ view: 'not-found', params: {} }` (no extra-segment match)

**Pattern:**
```javascript
// tests/router.test.js
import { describe, it, expect } from 'vitest'
// Note: matchRoute is not exported in the pattern above — export it for testing:
import { matchRoute } from '../src/router.js'

describe('matchRoute', () => {
  it('matches root hash to home view', () => {
    expect(matchRoute('#/')).toEqual({ view: 'home', params: {} })
  })
  it('extracts moduleId from module route', () => {
    expect(matchRoute('#/module/logging-auditing')).toEqual({
      view: 'module',
      params: { moduleId: 'logging-auditing' }
    })
  })
  it('returns not-found for unknown hash', () => {
    expect(matchRoute('#/unknown').view).toBe('not-found')
  })
  it('handles empty hash as home', () => {
    expect(matchRoute('').view).toBe('home')
  })
})
```

**Note:** `matchRoute` must be exported from `router.js` for this test to work. Add `export function matchRoute` to the router pattern above.

---

### `tests/sidebar.test.js` (test)

**Source:** RESEARCH.md — Validation Architecture; Phase Requirement SHELL-01

**Test coverage contract:**
- Sidebar renders exactly 5 module items (one per `MODULES` entry)
- Each module item has `data-module-id` attribute matching `mod.id`
- Collapse toggle changes `aria-label` from "Collapse navigation" to "Expand navigation"

---

### `tests/compliance-refs.test.js` (test)

**Source:** RESEARCH.md — Validation Architecture; Phase Requirement DATA-01

**Test coverage contract:**
- JSON file parses without error
- `directives.TSA.shortName` exists and is a non-empty string
- `directives.NIST.shortName` exists and is a non-empty string
- `schemaVersion` equals 1

---

## Shared Patterns

### Token Access Pattern (applies to ALL JS files that reference design tokens)

**Source:** RESEARCH.md — Pattern 1; UI-SPEC.md — Tailwind v4 Token Declaration
**Apply to:** `index.html`, all view files, `sidebar.js`

Use Tailwind v4 CSS variable syntax in class attributes:
```
bg-[var(--color-bg-secondary)]
text-[var(--color-text-primary)]
text-[var(--text-body)]
border-[var(--color-border)]
p-[var(--spacing-lg)]
```

Never hardcode hex values or pixel sizes in class attributes. Never use Tailwind v3 config-based color names like `bg-orange-500` — use the CSS custom property references.

---

### Compliance Badge Render Pattern (applies to ALL view files that display compliance controls)

**Source:** RESEARCH.md — Code Examples; `src/main.js` pattern above
**Apply to:** `home-view.js`, `module-view.js`

Always call `renderBadge(directiveKey)` from `main.js`. Never construct badge HTML inline in view files. Never write directive version strings as literal text in view files.

```javascript
import { renderBadge } from '../main.js';
// ...
mod.complianceTags.map(tag => renderBadge(tag)).join('')
```

---

### `import.meta.env.BASE_URL` Pattern (applies to ALL fetch calls for static assets)

**Source:** RESEARCH.md — Code Examples; https://vite.dev/guide/env-and-mode.html
**Apply to:** `main.js` (compliance-refs fetch); all future phases that fetch from `data/`

```javascript
const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
```

This resolves correctly in both `npm run dev` (`/`) and GitHub Pages (`/pipeline-cyber-training/`). Never hardcode the base path string.

---

### View Return Convention (applies to ALL view files)

**Source:** RESEARCH.md — System Architecture Diagram
**Apply to:** `home-view.js`, `module-view.js`, `not-found-view.js`

- Views are plain functions that return an HTML string
- They are called by `router.js`; the router writes the return value to `document.getElementById('app').innerHTML`
- No DOM manipulation inside view functions — views only produce markup
- Views import from `modules-config.js` and `main.js`; they do not import from each other

---

### Lucide Icon Activation Pattern (applies to ALL files that use Lucide icons)

**Source:** UI-SPEC.md — Component Inventory; RESEARCH.md — Standard Stack
**Apply to:** `index.html`, all view files, `sidebar.js`

Phase 1 uses Lucide via CDN. After injecting HTML containing `<i data-lucide="...">` elements into the DOM, call `lucide.createIcons()` to activate them:

```javascript
// After any innerHTML assignment that contains Lucide icon elements:
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
```

This call is safe to make after every `#app` render and after sidebar initialization. In Phase 2 when Lucide moves to `npm import`, this pattern changes to a named import — but the `data-lucide` attribute convention on elements stays the same.

---

### XSS Hygiene Pattern (applies to ALL files rendering dynamic content)

**Source:** RESEARCH.md — Security Domain
**Apply to:** `router.js`, all view files

When any content derived from `window.location.hash` must appear as visible text:
```javascript
// WRONG — do not do this:
element.innerHTML = `<p>Module: ${params.moduleId}</p>`;

// CORRECT — use textContent for hash-derived strings:
const p = document.createElement('p');
p.textContent = `Module: ${params.moduleId}`;
element.appendChild(p);
```

For static HTML strings from hardcoded JS objects (like `MODULES`), `innerHTML` is acceptable. The risk vector is hash content, not static config data.

---

## No Analog Found

All files have no analog — this is a greenfield project. The table below summarizes which external references provide the authoritative pattern for each file.

| File | Role | Data Flow | Pattern Source |
|------|------|-----------|----------------|
| `vite.config.js` | config | — | https://vite.dev/guide/static-deploy.html |
| `index.html` | config | request-response | UI-SPEC.md Component Inventory; RESEARCH.md Pattern 2 |
| `src/style.css` | config | — | https://tailwindcss.com/docs/installation; UI-SPEC.md Token Declaration |
| `src/main.js` | controller | request-response | RESEARCH.md Code Examples |
| `src/router.js` | utility | request-response | RESEARCH.md Pattern 3; MDN hashchange event |
| `src/modules-config.js` | model | — | RESEARCH.md Pattern 6 |
| `src/sidebar.js` | component | event-driven | RESEARCH.md Code Examples; UI-SPEC.md Interaction Contracts |
| `src/views/home-view.js` | component | request-response | UI-SPEC.md Component 6; Copywriting Contract |
| `src/views/module-view.js` | component | request-response | UI-SPEC.md Component 4; Copywriting Contract |
| `src/views/not-found-view.js` | component | request-response | UI-SPEC.md Copywriting Contract |
| `data/compliance-refs.json` | model | — | RESEARCH.md Pattern 4; CONTEXT.md D-16 |
| `.github/workflows/deploy.yml` | config | — | https://vite.dev/guide/static-deploy.html |
| `public/.nojekyll` | config | — | RESEARCH.md Pitfall 3 |
| `vitest.config.js` | config | — | RESEARCH.md Validation Architecture |
| `tests/router.test.js` | test | — | RESEARCH.md Phase Requirements → Test Map |
| `tests/sidebar.test.js` | test | — | RESEARCH.md Phase Requirements → Test Map |
| `tests/compliance-refs.test.js` | test | — | RESEARCH.md Phase Requirements → Test Map |

---

## Metadata

**Analog search scope:** Entire project (only `CLAUDE.md` exists — no source files)
**Files scanned:** 1 (CLAUDE.md — project instructions only)
**Pattern extraction sources:** 01-CONTEXT.md, 01-RESEARCH.md, 01-UI-SPEC.md
**Pattern extraction date:** 2026-05-11
