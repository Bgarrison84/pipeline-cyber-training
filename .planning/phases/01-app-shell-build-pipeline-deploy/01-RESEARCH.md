# Phase 1: App Shell + Build Pipeline + Deploy - Research

**Researched:** 2026-05-11
**Domain:** Vite + Tailwind v4 static site scaffold, hash-based SPA routing (vanilla JS), GitHub Pages deployment via GitHub Actions
**Confidence:** HIGH overall — all core claims verified against npm registry and official docs

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** GitHub account: `Bgarrison84`, repo: `pipeline-cyber-training` — must be created as part of this phase
- **D-02:** GitHub Pages URL: `Bgarrison84.github.io/pipeline-cyber-training`
- **D-03:** Vite `base` config: `/pipeline-cyber-training/` — must be set in `vite.config.js` before first build or all asset paths will be wrong
- **D-04:** Deploy strategy: GitHub Actions on push to `main` → build `dist/` → deploy to GitHub Pages; `.nojekyll` must be present in `dist/`
- **D-05:** Primary navigation: left sidebar (not top nav)
- **D-06:** Sidebar is collapsible — toggle button to hide/show
- **D-07:** Sidebar tree depth: active module expanded (shows lessons), all others collapsed
- **D-08:** Top bar: app display name left, compliance index link + overall progress summary right
- **D-09:** App display name in UI: **"OT Security Lab"** (repo stays `pipeline-cyber-training`)
- **D-10:** Tone: high-contrast industrial — bold colors, strong borders, readable in ambient-light environments
- **D-11:** Color palette: safety orange + dark gray — pipeline industry context
- **D-12:** Tailwind v4 color tokens defined as CSS custom properties in `@theme` for easy forking/rebranding
- **D-13:** Module placeholders show structural skeleton: title, goal, labeled empty sections
- **D-14:** Individual lesson items grayed out and not clickable in Phase 1
- **D-15:** Each module placeholder shows compliance control IDs sourced from `data/compliance-refs.json`
- **D-16:** `data/compliance-refs.json` created in this phase with TSA SD-02F and NIST SP 800-82 Rev 3 as canonical references

### Claude's Discretion

- Exact Tailwind v4 utility class structure and CSS custom property naming convention — follow Tailwind v4 best practices
- GitHub Actions workflow file structure — use the official `actions/deploy-pages` + `actions/upload-pages-artifact` pattern
- Exact sidebar toggle animation (CSS transition) — keep simple
- Favicon and page `<title>` — use "OT Security Lab" as title

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | User can navigate between all 5 modules and their lessons via a persistent sidebar or top navigation menu | Hash router implementation, sidebar component pattern, module data shape |
| SHELL-02 | Every module and lesson has a unique, linkable URL using hash-based routing (e.g. `#/module/logging-auditing/lesson/1`) | Hash routing pattern verified; `hashchange` event API + `matchRoute` function pattern |
| DATA-01 | TSA directive version strings stored in a single `data/compliance-refs.json` file — never hardcoded in lesson content | compliance-refs.json shape defined; badge rendering pattern sourced from it |

</phase_requirements>

---

## Summary

Phase 1 is a greenfield Walking Skeleton: scaffold the repo, wire up Vite 8 + Tailwind v4, implement a 60-line hash router, render five module placeholder views inside a collapsible sidebar layout, deploy to GitHub Pages via GitHub Actions, and create `data/compliance-refs.json`. No real content; no backend; no real PowerShell execution.

The stack is fully locked from prior research. The only new finding with planning impact is a **Node.js version conflict on the local machine**: the installed Node 20.13.1 falls below the minimum required by Vite 8 (`^20.19.0 || >=22.12.0`). GitHub Actions will use Node 22 LTS via `actions/setup-node@v4`, so CI/CD is unaffected — but the executor must upgrade Node locally before running `npm create vite@latest` or `npm run dev`. The Wave 0 task list must include this step.

The deployment pipeline is the official Vite-documented five-step GitHub Actions pattern using `actions/deploy-pages@v5` + `actions/upload-pages-artifact@v5` (both at v5 as of May 2026). The `.nojekyll` file goes in `public/` so Vite copies it to `dist/` automatically. Setting `base: '/pipeline-cyber-training/'` in `vite.config.js` before the first build is mandatory — miss it and every CSS/JS reference 404s in production.

The hash router is ~60 lines of vanilla JS: listen on `hashchange` + `load`, tokenize the hash, match against a route table with named parameters. The sidebar uses a CSS Grid layout with two column widths toggled via a class (`--sidebar-width-expanded: 256px` / `--sidebar-width-collapsed: 48px`). The `@theme` block in `src/style.css` declares all design tokens. No framework, no component library — all components hand-built per the UI-SPEC.

**Primary recommendation:** Scaffold with `npm create vite@latest` (vanilla template), add `@tailwindcss/vite`, configure `vite.config.js` with `base` and `tailwindcss()` plugin, declare `@theme` tokens in CSS, build the router and layout shell, add the GitHub Actions workflow, push to the new repo, and enable GitHub Pages (source: GitHub Actions) in repository settings.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hash routing | Browser / Client | — | Pure `window.location.hash` + `hashchange` event; no server involvement |
| Sidebar navigation | Browser / Client | — | DOM manipulation, CSS class toggling; static HTML |
| Module placeholder views | Browser / Client | — | JS renders HTML into `#app` container; all client-side |
| Compliance badge display | Browser / Client | Static file (JSON) | `data/compliance-refs.json` fetched at runtime; rendered in browser |
| Build / bundle | CDN / Static (build time) | — | Vite compiles everything to `dist/`; no runtime server |
| GitHub Pages deployment | CDN / Static | — | GitHub Actions pushes `dist/` artifact; GitHub serves it |
| CSS token system | Browser / Client | — | `@theme` block compiled into CSS custom properties by `@tailwindcss/vite` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.0.12 | Build tool + dev server | Industry standard; required for Tailwind v4; official GitHub Pages docs |
| `@tailwindcss/vite` | 4.3.0 | Tailwind v4 Vite plugin | First-party plugin; one-line vite.config.js integration; replaces PostCSS setup |
| tailwindcss | 4.3.0 | CSS framework | CDN removed in v4; utility-first for industrial aesthetic; `@theme` directive |
| Vanilla JS (ES2022+) | Browser native | App logic, router, views | Zero dependencies for bounded five-module site; terminal is imperative code |

[VERIFIED: npm registry — npm view vite version → 8.0.12; npm view @tailwindcss/vite version → 4.3.0; npm view tailwindcss version → 4.3.0]

### Supporting (Phase 1 only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide (CDN) | latest (unpkg) | Icons (sidebar, chevrons, module icons) | CDN in Phase 1; swap to bundled import in Phase 2 |
| Inter (Google Fonts) | — | UI font | Preloaded via `<link rel="preload">` in `index.html` |
| JetBrains Mono (Google Fonts) | — | Code/terminal/hash strings font | Same preload pattern |

[ASSUMED] Lucide CDN via unpkg is acceptable for Phase 1; Phase 2 bundles it via npm. Confirm if bundled-from-start is preferred.

### Alternatives Considered (already decided in prior research)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite 8.x | Vite 7.x | Both require Node 20.19+; v8 is latest stable; use v8 |
| `@tailwindcss/vite` | PostCSS + tailwindcss | More config files; no advantage once Vite is already in stack |
| Hash routing | History API + 404.html trick | 404 trick has documented browser error UI issues; hash routing is zero-config on GitHub Pages |

**Installation:**

```bash
# Requires Node >=20.19.0 (local machine has 20.13.1 — must upgrade first)
npm create vite@latest pipeline-cyber-training -- --template vanilla
cd pipeline-cyber-training
npm install tailwindcss @tailwindcss/vite
```

**Version verification (confirmed 2026-05-11):**
- vite: `8.0.12` (npm view vite version)
- tailwindcss: `4.3.0` (npm view tailwindcss version)
- @tailwindcss/vite: `4.3.0` (npm view @tailwindcss/vite version)
- create-vite: `9.0.7` (npm view create-vite version)

---

## Architecture Patterns

### System Architecture Diagram

```
index.html loaded
      │
      ▼
main.js
      │ imports
      ├──► router.js  ◄── window.hashchange + window.load events
      │         │
      │         │ matches route, extracts params
      │         ▼
      │    view functions (HomeView, ModuleView, NotFoundView)
      │         │
      │         │ returns HTML string or DOM fragment
      │         ▼
      │    document.getElementById('app').innerHTML = ...
      │
      ├──► style.css  (Tailwind v4 @import + @theme tokens)
      │         │
      │         └─ compiled by @tailwindcss/vite at build time
      │
      └──► data/compliance-refs.json  (fetched on app init)
                │
                └─ compliance badge text for module placeholder views
```

Data flow for a module navigation event:
1. User clicks sidebar module link (`href="#/module/logging-auditing"`)
2. Browser updates `location.hash`, fires `hashchange`
3. `router.js` tokenizes hash → matches `#/module/:moduleId` → calls `ModuleView.render(params)`
4. `ModuleView` reads module config (static JS object in Phase 1) → injects compliance badge IDs from cached `compliance-refs.json` data → writes HTML to `#app`
5. Sidebar updates active state by adding/removing CSS class

### Recommended Project Structure

```
pipeline-cyber-training/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── .nojekyll               # Disables Jekyll on GitHub Pages
├── data/
│   └── compliance-refs.json    # Single source for all version strings
├── src/
│   ├── main.js                 # Entry point: init router, fetch compliance-refs
│   ├── router.js               # Hash router: matchRoute, handleRoute
│   ├── views/
│   │   ├── home-view.js        # Module catalog (5 cards)
│   │   ├── module-view.js      # Module placeholder (skeleton + compliance badges)
│   │   └── not-found-view.js   # 404 view
│   ├── sidebar.js              # Sidebar state: active module, collapse toggle
│   └── style.css               # @import "tailwindcss" + @theme tokens
├── index.html                  # App shell: #top-bar, #sidebar, #app
├── vite.config.js              # base + tailwindcss() plugin
└── package.json
```

Phase 1 does NOT include: `src/progress-store.js`, `src/content-loader.js`, `src/terminal-engine.js`, `src/quiz-engine.js` — those are Phase 3+.

### Pattern 1: Vite + Tailwind v4 Configuration

```javascript
// vite.config.js
// Source: https://vite.dev/guide/static-deploy.html + https://tailwindcss.com/docs/installation
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pipeline-cyber-training/',   // REQUIRED — project-scoped GitHub Pages URL
  plugins: [tailwindcss()],
})
```

```css
/* src/style.css */
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
  --color-badge-tsa-bg: #1e3a5f;
  --color-badge-tsa-text: #93c5fd;
  --color-badge-nist-bg: #1a3a2a;
  --color-badge-nist-text: #86efac;

  /* Typography */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
  --text-mono: 0.8125rem;   /* 13px */
  --text-body: 0.875rem;    /* 14px */
  --text-heading: 1.25rem;  /* 20px */
  --text-display: 1.75rem;  /* 28px */

  /* Spacing (4px base) */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* Fixed layout dimensions */
  --sidebar-width-expanded: 256px;
  --sidebar-width-collapsed: 48px;
  --topbar-height: 48px;
}
```

[CITED: https://tailwindcss.com/docs/installation — exact `@import "tailwindcss"` and `@theme` directive syntax]

### Pattern 2: CSS Grid App Shell Layout

```html
<!-- index.html core structure -->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OT Security Lab</title>
  <!-- Preload fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body class="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] h-screen overflow-hidden">
  <div id="shell" class="grid h-screen" style="grid-template-columns: var(--sidebar-width-expanded) 1fr; grid-template-rows: var(--topbar-height) 1fr;">
    <header id="top-bar" class="col-span-2 ...">...</header>
    <nav id="sidebar" aria-label="Module navigation">...</nav>
    <main id="app"><!-- router injects views here --></main>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

Sidebar collapse is achieved by toggling a class on `#shell`:
```css
/* Applied via JS when toggle button is clicked */
#shell.sidebar-collapsed {
  grid-template-columns: var(--sidebar-width-collapsed) 1fr;
}
```

Transition on the sidebar element itself:
```css
#sidebar {
  transition: width 200ms ease;
  overflow: hidden;
}
```

### Pattern 3: Hash Router Implementation

```javascript
// src/router.js
// Source: ARCHITECTURE.md — hash routing strategy section

const routes = [
  { pattern: '#/',                           view: 'home' },
  { pattern: '#/module/:moduleId',           view: 'module' },
  { pattern: '#/lesson/:moduleId/:lessonId', view: 'lesson' },  // Phase 2+
];

function matchRoute(hash) {
  const cleanHash = hash || '#/';
  for (const route of routes) {
    const params = extractParams(cleanHash, route.pattern);
    if (params !== null) return { view: route.view, params };
  }
  return { view: 'not-found', params: {} };
}

function extractParams(hash, pattern) {
  const hashParts = cleanHash.slice(1).split('/').filter(Boolean);
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

export function handleRoute() {
  const { view, params } = matchRoute(window.location.hash);
  renderView(view, params);
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
```

### Pattern 4: compliance-refs.json Shape

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

Important: `shortName` values in this file are what compliance badges render. Never render version strings from any other source.

[CITED: https://www.tsa.gov/sd-and-ea — SD-02F effective May 3, 2025; PITFALLS.md — single reference file pattern]

### Pattern 5: GitHub Actions Deployment Workflow

```yaml
# .github/workflows/deploy.yml
# Source: https://vite.dev/guide/static-deploy.html (official Vite GitHub Pages docs)
# Action versions verified: deploy-pages@v5, upload-pages-artifact@v5 (May 2026)

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

Note: GitHub Actions uses Node 22 (`node-version: 22`) regardless of local Node version. This is why CI works even though local Node 20.13.1 is below the Vite 8 minimum.

[CITED: https://vite.dev/guide/static-deploy.html]
[VERIFIED: actions/deploy-pages v5.0.0 released March 25, 2025; actions/upload-pages-artifact v5.0.0 released April 2025]

### Pattern 6: Module Data Shape (Static in Phase 1)

Phase 1 uses a static JS object for module metadata — no JSON fetch needed since there is no lesson content yet. The shape must match what Phase 2's `content-loader.js` will expect:

```javascript
// src/modules-config.js — static data for Phase 1 placeholder views
// Phase 2 will replace this with fetch() from data/modules/index.json

export const MODULES = [
  {
    id: 'logging-auditing',
    title: 'Logging & Auditing',
    icon: 'BookOpen',                     // Lucide icon name
    description: 'Configure Windows Event Logging and PowerShell script block logging to meet compliance requirements.',
    order: 1,
    estimatedMinutes: 45,
    lessons: [
      { id: 'intro', title: 'Introduction to Windows Event Logs' },
      { id: 'ps-logging', title: 'Enabling PowerShell Script Block Logging' },
      { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy' },
    ],
    complianceTags: ['TSA', 'NIST'],      // keys into compliance-refs.json
  },
  {
    id: 'network-hardening',
    title: 'Network Hardening',
    icon: 'Shield',
    description: 'Firewall rules, network segmentation, and port scanning via PowerShell.',
    order: 2,
    estimatedMinutes: 50,
    lessons: [
      { id: 'firewall-basics', title: 'Windows Firewall with Advanced Security' },
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
      { id: 'least-privilege', title: 'Least Privilege Principles' },
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
      { id: 'anomaly-detection', title: 'Detecting Anomalies with PowerShell' },
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
      { id: 'ot-patching', title: 'OT/ICS Patching in Air-Gapped Environments' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
];
```

### Anti-Patterns to Avoid

- **Hardcoding version strings:** Never write "SD-02F" or "NIST SP 800-82 Rev 3" as literal strings in JS or HTML. Always read from `compliance-refs.json`. Even in Phase 1.
- **Using `history.pushState`:** Do not add push-state routing. Hash routing is the explicit locked decision (D-03 context). Push-state URLs require the 404.html redirect hack on GitHub Pages.
- **Missing `base` config:** Do not run `vite build` without `base: '/pipeline-cyber-training/'`. The build will appear to work locally (`base: '/'`) but all assets 404 on GitHub Pages.
- **Jekyll file in `src/` instead of `public/`:** The `.nojekyll` file must be in `public/` so Vite copies it to `dist/`. A `.nojekyll` in the project root does NOT end up in `dist/` and will not disable Jekyll on the deployed artifact.
- **`npm run dev` on local Node 20.13.1:** Will fail with engine error. Upgrade Node first.
- **`grid-template-columns` without CSS variable:** Setting the sidebar width as a hardcoded pixel value in the grid template breaks the collapse animation. Use `var(--sidebar-width-expanded)` so the CSS variable change propagates.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS tokenization / custom properties | Manual CSS variable files | Tailwind v4 `@theme` block | Single source of truth; Vite plugin compiles it; forking is one file edit |
| Build tool with HMR | Custom Rollup/esbuild config | Vite 8 (`npm create vite@latest`) | Official scaffold; handles ES modules, HMR, Tailwind plugin wiring |
| GitHub Pages deployment | Shell scripts, manual `git subtree push` | GitHub Actions + `actions/deploy-pages@v5` | Idempotent, auditable, re-runnable; official pattern |
| Font loading | Self-hosted font files | Google Fonts with `<link rel="preconnect">` | Zero setup; preconnect hints eliminate latency; no GDPR concern for training app |
| Icon system | Custom SVG sprites | Lucide (CDN in Phase 1) | Named icons match design spec; swap to bundled import in Phase 2 without changing icon names |

**Key insight:** Phase 1 is scaffolding — resist the urge to over-engineer. The value is the deployed skeleton, not sophisticated code. Every hand-rolled tool adds scope that doesn't advance the walking skeleton goal.

---

## Common Pitfalls

### Pitfall 1: Node Version Mismatch (BLOCKING for local dev)
**What goes wrong:** `npm create vite@latest` or `npm run dev` fails with: `error: The engine "node" is incompatible with this module. Expected version "^20.19.0 || >=22.12.0". Got "20.13.1"`
**Why it happens:** Both Vite 7 and Vite 8 raised the minimum Node.js to `^20.19.0 || >=22.12.0`. Local machine has Node 20.13.1 which is 6 patch versions below the minimum.
**How to avoid:** Upgrade Node.js locally to 20.19.x LTS or 22.x LTS before scaffolding. GitHub Actions uses `node-version: 22` so CI is unaffected.
**Warning signs:** Any `npm run dev` error referencing engine incompatibility.
[VERIFIED: npm view vite engines → `{ node: '^20.19.0 || >=22.12.0' }` — confirmed for all Vite 7.x and 8.x versions]

### Pitfall 2: Vite base Not Set Before First Build
**What goes wrong:** Site renders a blank page on GitHub Pages; browser DevTools shows 404s for every CSS and JS import.
**Why it happens:** Default Vite `base` is `'/'`, correct for user/org sites (`username.github.io`). Project sites (`username.github.io/repo-name/`) need `base: '/repo-name/'`. The built `index.html` emits `<script src="/assets/main-xxx.js">` which resolves to `username.github.io/assets/...` — a path that does not exist.
**How to avoid:** Set `base: '/pipeline-cyber-training/'` in `vite.config.js` as the first thing, before any build. Verify with `npm run build && cat dist/index.html | grep src=` — all asset paths should start with `/pipeline-cyber-training/`.
**Warning signs:** Build succeeds locally (where `base` doesn't matter for `file://`), 404s appear only after deployment.
[CITED: https://vite.dev/guide/static-deploy.html — project-scoped URL configuration]

### Pitfall 3: .nojekyll in Wrong Directory
**What goes wrong:** Files or directories starting with `_` (which Vite generates for chunks) are stripped by Jekyll; the deployed site loads with missing JS.
**Why it happens:** `.nojekyll` in the project root prevents Jekyll from building the _source_ repo but not the deployed artifact. Vite copies everything from `public/` to `dist/` at build time. Only a `.nojekyll` in `public/` ends up in `dist/`.
**How to avoid:** Create `.nojekyll` as an empty file in `public/`. Verify with `ls dist/.nojekyll` after a local build.
**Warning signs:** Works in development, fails after deployment with missing chunk files.
[CITED: STACK.md — GitHub Pages Specifics section]

### Pitfall 4: GitHub Pages Source Setting Not Changed
**What goes wrong:** Pushes to `main` trigger the Actions workflow successfully, but the site URL shows the default "Your Pages site is currently being built..." page.
**Why it happens:** GitHub Pages defaults to branch-based deployment. Even with a working `deploy.yml`, the repository Settings → Pages source must be changed to "GitHub Actions" for the Actions artifact deployment to take effect.
**How to avoid:** Immediately after creating the repo, go to Settings → Pages → Build and deployment → Source → GitHub Actions. This is a one-time manual step that cannot be automated via workflow YAML.
**Warning signs:** `actions/deploy-pages` step completes with a green check but the URL shows the placeholder page.

### Pitfall 5: Sidebar Width Transition Broken by Grid Column Change
**What goes wrong:** Clicking the sidebar toggle causes an instant snap rather than a smooth 200ms transition.
**Why it happens:** CSS `transition` on `grid-template-columns` requires the values to be animatable. CSS custom properties inside `grid-template-columns` do animate as of Chrome 86+, Safari 16+, Firefox 111+. However, using `calc()` or complex expressions can break the animation. Changing the class on the grid container rather than the sidebar element itself can also prevent the transition.
**How to avoid:** Apply the CSS transition on the `#sidebar` element (`transition: width 200ms ease`), not on the grid container. The sidebar has `width: var(--sidebar-width-expanded)` set as its own property. When the class toggles, the sidebar width changes and transitions. The grid column adjusts to match via `1fr` behavior.
**Warning signs:** Console shows no errors but toggle is instant.

### Pitfall 6: Compliance Version String Hardcoded During Initial Development
**What goes wrong:** During rapid prototyping, "SD-02F" is typed directly into HTML or JS strings. It propagates across the codebase before the `compliance-refs.json` fetch is wired up.
**Why it happens:** It's faster to hardcode in the moment; the fetch pattern adds indirection.
**How to avoid:** Create `data/compliance-refs.json` and the fetch in `main.js` in the same commit as the module placeholder view that renders badges. Never write "SD-02F" or "SP 800-82 Rev 3" as a literal string outside that JSON file.
**Warning signs:** `grep -r "SD-02" src/` returns any hits.

---

## Code Examples

### Sidebar Collapse Toggle (JavaScript + CSS interaction)

```javascript
// src/sidebar.js
const shell = document.getElementById('shell');
const toggleBtn = document.getElementById('sidebar-toggle');
let isCollapsed = false;

toggleBtn.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  shell.classList.toggle('sidebar-collapsed', isCollapsed);
  toggleBtn.setAttribute('aria-label',
    isCollapsed ? 'Expand navigation' : 'Collapse navigation'
  );
  // Hide/show label text in sidebar
  document.querySelectorAll('.sidebar-label').forEach(el => {
    el.style.opacity = isCollapsed ? '0' : '1';
    el.style.width = isCollapsed ? '0' : '';
    el.style.overflow = isCollapsed ? 'hidden' : '';
  });
});
```

### Compliance Badge Rendering

```javascript
// Fetched once on init; stored in module-level variable
let complianceRefs = null;

export async function loadComplianceRefs() {
  // In Phase 1, compliance-refs.json is in data/ at repo root,
  // served at base + 'data/compliance-refs.json' in production
  const url = import.meta.env.BASE_URL + 'data/compliance-refs.json';
  const res = await fetch(url);
  if (!res.ok) return null;
  complianceRefs = await res.json();
  return complianceRefs;
}

export function renderBadge(directiveKey) {
  // Falls back to hardcoded text only if fetch failed (network error)
  const fallbacks = { TSA: 'TSA SD-02F', NIST: 'NIST SP 800-82 Rev 3' };
  const shortName = complianceRefs?.directives?.[directiveKey]?.shortName
    ?? fallbacks[directiveKey];

  const colors = {
    TSA: 'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${colors[directiveKey] ?? ''}">${shortName}</span>`;
}
```

Note: `import.meta.env.BASE_URL` is injected by Vite and equals `/pipeline-cyber-training/` in production and `/` in dev. This correctly resolves `data/compliance-refs.json` on both local and GitHub Pages without hardcoding the base path.
[CITED: https://vite.dev/guide/env-and-mode.html — `import.meta.env.BASE_URL`]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 build + dev server | Partial | 20.13.1 (needs 20.19+) | Upgrade required — no fallback |
| npm | Package management | Yes | 10.5.2 | — |
| git | Version control, GitHub Actions | Yes | 2.45.1 | — |
| GitHub CLI (`gh`) | Repo creation, Pages config | Yes | 2.50.0 | Manual via GitHub UI |
| GitHub Actions (CI) | Deploy to Pages | Yes (SaaS) | ubuntu-latest + Node 22 | — |

**Missing dependencies with no fallback:**
- **Node.js upgrade required:** Local Node 20.13.1 is below Vite 8's minimum `^20.19.0 || >=22.12.0`. Must upgrade to Node 20.19.x LTS or 22.x LTS before `npm create vite@latest` will succeed. No version manager (nvm/fnm/volta) detected on this machine — must use the Node.js installer from nodejs.org.

**Missing dependencies with fallback:**
- **GitHub repo does not exist yet:** `Bgarrison84/pipeline-cyber-training` confirmed not found. The executor must create it via `gh repo create` or GitHub UI as Wave 0 step 1.
- **GitHub Pages source not configured:** Must be set to "GitHub Actions" in repo Settings after repo creation (cannot be done via YAML).

---

## Validation Architecture

nyquist_validation is enabled (config.json `workflow.nyquist_validation: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (to be installed in Wave 0) |
| Config file | `vitest.config.js` — does not exist yet (Wave 0 gap) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

Vitest is the correct choice for a Vite project — it shares the same config and transform pipeline. No separate babel/jest config needed.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHELL-01 | Sidebar renders all 5 modules | unit (DOM) | `npx vitest run tests/sidebar.test.js` | Wave 0 gap |
| SHELL-01 | Clicking module link changes `location.hash` | unit | `npx vitest run tests/router.test.js` | Wave 0 gap |
| SHELL-02 | `matchRoute('#/module/logging-auditing')` extracts `moduleId: 'logging-auditing'` | unit | `npx vitest run tests/router.test.js` | Wave 0 gap |
| SHELL-02 | Unknown hash returns `not-found` view | unit | `npx vitest run tests/router.test.js` | Wave 0 gap |
| DATA-01 | `compliance-refs.json` contains `TSA.shortName` and `NIST.shortName` | smoke | `npx vitest run tests/compliance-refs.test.js` | Wave 0 gap |
| DATA-01 | No literal "SD-02F" or "SP 800-82" strings in `src/**` | lint/grep | `grep -r "SD-02" src/` exits with code 1 | Static check — no test file needed |
| Phase SC-1 | GitHub Pages URL returns HTTP 200 (post-deploy) | e2e/smoke | Manual — check `curl -s -o /dev/null -w "%{http_code}" https://Bgarrison84.github.io/pipeline-cyber-training/` | Manual verification |
| Phase SC-5 | `dist/.nojekyll` exists after `npm run build` | smoke | `test -f dist/.nojekyll` | Static check |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/router.test.js` (router tests only, ~2 seconds)
- **Per wave merge:** `npx vitest run` (all tests)
- **Phase gate:** Full suite green + manual deploy smoke test before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/router.test.js` — covers SHELL-01, SHELL-02 (matchRoute, handleRoute, param extraction)
- [ ] `tests/sidebar.test.js` — covers SHELL-01 (5 modules rendered, active state, collapse toggle)
- [ ] `tests/compliance-refs.test.js` — covers DATA-01 (schema shape validation)
- [ ] `vitest.config.js` — shared config
- [ ] Framework install: `npm install -D vitest @vitest/ui happy-dom`

Note: Vitest with `happy-dom` provides browser-like DOM API for testing DOM rendering without a real browser.

---

## Security Domain

ASVS categories relevant to Phase 1 (static site shell with no auth, no user input, no server):

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 1 |
| V3 Session Management | No | No sessions in Phase 1 |
| V4 Access Control | No | No access control in Phase 1 |
| V5 Input Validation | Minimal | No user input in Phase 1; only hash URL parsing |
| V6 Cryptography | No | No crypto in Phase 1 |
| V7 Error Handling | Yes | Router must handle unknown hashes gracefully (not-found view, not uncaught error) |

### Known Threat Patterns for Static Single-Page Apps

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Hash-based open redirect | Spoofing | `matchRoute` returns not-found for unmatched hashes; never `eval()` hash content |
| XSS via `innerHTML` | Tampering | Phase 1 has no user input; all strings are from hardcoded JS objects or static JSON — low risk; still use `textContent` for user-visible strings |
| Dependency supply chain | Tampering | Lock deps with `package-lock.json`; `npm ci` in CI (already in workflow) |
| CORS on JSON fetch | Information Disclosure | GitHub Pages serves same-origin; `data/compliance-refs.json` fetch is same-origin |

Phase 1 security posture is LOW RISK — no auth, no user input, no external API calls. The primary concern is XSS hygiene (use `textContent` not `innerHTML` for any string derived from `location.hash`).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 CDN | No CDN in v4 — Vite plugin required | Jan 2025 (v4.0) | Must use build tool; no "drop in CDN link" |
| `tailwind.config.js` | `@theme` block in CSS | Tailwind v4.0 | Config is now CSS-first; no separate JS config file |
| `gh-pages` npm package | `actions/deploy-pages@v5` | ~2023 | Official Actions pattern is cleaner; no `gh-pages` branch needed |
| `actions/deploy-pages@v3/v4` | `actions/deploy-pages@v5` | March 2025 | v5 uses Node 24 in the action runner; use v5 |
| PostCSS setup for Tailwind | `@tailwindcss/vite` plugin | Tailwind v4.0 | One-line integration; no `postcss.config.js` needed |

**Deprecated / outdated:**
- `tailwind.config.js`: Not needed for Tailwind v4. All configuration lives in `@theme` block in CSS. Do not create this file.
- `postcss.config.js`: Not needed when using `@tailwindcss/vite`. Do not create this file.
- `gh-pages` npm package: Replaced by GitHub Actions official pattern. Do not use.
- `actions/checkout@v6` / `actions/setup-node@v6`: The Vite docs show `@v6` but those versions don't exist yet on the GitHub Marketplace. Use `@v4` for both (current stable as of May 2026).

---

## Walking Skeleton: Minimal End-to-End Slice

The Walking Skeleton for Phase 1 is the thinnest vertical slice that proves the entire delivery pipe works:

1. **Repo created** on GitHub as `Bgarrison84/pipeline-cyber-training`
2. **Vite scaffold** (`npm create vite@latest`, vanilla template) committed
3. **`vite.config.js`** sets `base: '/pipeline-cyber-training/'` and `tailwindcss()` plugin
4. **`public/.nojekyll`** exists
5. **`data/compliance-refs.json`** created with SD-02F and NIST SP 800-82 Rev 3
6. **`src/style.css`** has `@import "tailwindcss"` and full `@theme` token block
7. **`index.html`** has `#shell` grid, `#top-bar`, `#sidebar`, `#app`
8. **`src/router.js`** handles `#/` and `#/module/:moduleId`
9. **At least one module placeholder view** renders from a router match
10. **`.github/workflows/deploy.yml`** triggers on push to `main`
11. **GitHub Pages source** set to "GitHub Actions" in repo settings
12. **Push to `main`** → Actions passes → `https://Bgarrison84.github.io/pipeline-cyber-training/` returns HTTP 200

Steps 1-9 can be developed and tested locally (`npm run dev`). Steps 10-12 require the repo to exist on GitHub.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lucide CDN via unpkg is acceptable for Phase 1 icons (swap to bundled in Phase 2) | Standard Stack — Supporting | Bundling Lucide from the start adds ~5 minutes of setup but is lower risk than CDN dependency |
| A2 | `actions/checkout@v4` and `actions/setup-node@v4` are current stable (Vite docs show `@v6` which appears ahead of current marketplace) | Pattern 5: GitHub Actions Workflow | If v5/v6 are now available, use the latest stable — check marketplace before implementing |
| A3 | Vitest is the correct test runner (no existing test infrastructure confirmed) | Validation Architecture | Alternative: Playwright for e2e only; but Vitest covers unit + DOM tests sufficiently for Phase 1 |

---

## Open Questions (RESOLVED)

1. **Node.js upgrade path for local dev** — RESOLVED: Wave 0 Task 1 (01-01-PLAN.md) handles this as a human-action checkpoint: run `winget install OpenJS.NodeJS.LTS` or download from nodejs.org; use Node 22 LTS.

2. **GitHub Pages repository visibility** — RESOLVED: 01-04-PLAN.md Task 1 uses `gh repo create Bgarrison84/pipeline-cyber-training --public` — public required for GitHub Pages on a free account.

3. **Lucide bundling timing** — RESOLVED: Proceed with CDN per UI-SPEC (01-02-PLAN.md Task 2); FOUT risk noted in plan; bundled import deferred to Phase 2.

---

## Sources

### Primary (HIGH confidence)
- npm registry (verified 2026-05-11): vite@8.0.12, @tailwindcss/vite@4.3.0, tailwindcss@4.3.0, create-vite@9.0.7
- [https://vite.dev/guide/static-deploy.html](https://vite.dev/guide/static-deploy.html) — GitHub Actions workflow pattern, `base` config
- [https://tailwindcss.com/docs/installation](https://tailwindcss.com/docs/installation) — Vite plugin installation, `@import "tailwindcss"`, `@theme` directive
- [https://github.com/actions/deploy-pages/releases](https://github.com/actions/deploy-pages/releases) — v5.0.0 confirmed March 25, 2025
- [https://github.com/actions/upload-pages-artifact/releases](https://github.com/actions/upload-pages-artifact/releases) — v5.0.0 confirmed April 2025
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `SUMMARY.md`, `PITFALLS.md` — prior research for this project (verified against official sources on 2026-05-10)
- `.planning/phases/01-app-shell-build-pipeline-deploy/01-CONTEXT.md` — locked decisions
- `.planning/phases/01-app-shell-build-pipeline-deploy/01-UI-SPEC.md` — visual and interaction contract

### Secondary (MEDIUM confidence)
- [https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) — Pages source must be set to GitHub Actions manually

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry on 2026-05-11
- Architecture patterns: HIGH — hash routing + CSS Grid layout are established; code examples match official docs
- GitHub Actions workflow: HIGH — official Vite docs + confirmed action versions from GitHub releases
- Environment availability: HIGH — confirmed via direct tool invocation (node --version, npm --version, gh --version)
- Pitfalls: HIGH — Node version conflict verified empirically; other pitfalls from official docs and prior project research

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (Tailwind v4 and Vite 8 are in active development; re-verify minor versions before install)
