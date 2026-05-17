---
phase: 01-app-shell-build-pipeline-deploy
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - .github/workflows/deploy.yml
  - .gitignore
  - data/compliance-refs.json
  - index.html
  - package.json
  - public/.nojekyll
  - src/badge.js
  - src/main.js
  - src/modules-config.js
  - src/router.js
  - src/sidebar.js
  - src/style.css
  - src/views/home-view.js
  - src/views/module-view.js
  - src/views/not-found-view.js
  - tests/compliance-refs.test.js
  - tests/router.test.js
  - tests/sidebar.test.js
  - vite.config.js
  - vitest.config.js
findings:
  critical: 4
  warning: 5
  info: 4
  total: 13
status: fixed
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Phase 1 delivers the app shell, hash router, sidebar, badge renderer, and CI/CD pipeline. The overall architecture is sound and the XSS hotspot in `renderModule` was correctly caught and commented (`T-03-01`). However, four critical issues remain: an XSS vector via unescaped static-config data injected into `innerHTML`-driven HTML attributes, a double-render on page load that fires the router before compliance refs are loaded, an unpin CDN script tag that can serve arbitrary code, and no test step in the CI pipeline. Five warnings cover the `load`-event double-render, icon-case inconsistency, stale `.env` entries, and missing `.lock` file gitignore coverage.

---

## Critical Issues

### CR-01: XSS via unescaped module fields injected into innerHTML attributes

**File:** `src/sidebar.js:9-16`, `src/views/home-view.js:10-16`, `src/views/module-view.js:38-44`

**Issue:** `mod.id`, `mod.title`, `mod.description`, and `mod.icon` from `modules-config.js` are interpolated directly into HTML attribute values and element content via template literals that are later assigned to `innerHTML`. Currently these values are static, but this is not enforced by any runtime guard. If Phase 2 ever replaces `MODULES` with a `fetch()` from a JSON file (as the comment on line 3 of `modules-config.js` explicitly foreshadows), any `"` or `<` in a title or description field will break out of the attribute/element context, enabling stored XSS. The `aria-label="${mod.title}"` interpolation in sidebar.js is the sharpest edge: a title containing `" onmouseover="alert(1)` would inject an event handler today if the JSON were server-supplied.

Even with today's static source, `mod.description` is placed in `<p>` inner content without escaping; if a future description contains `<script>`, it renders as markup.

**Fix:** Add a minimal HTML-escape helper and apply it to every data-derived string before interpolation into innerHTML-bound templates:

```javascript
// src/utils/escape.js
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Then in sidebar.js:
```javascript
import { esc } from '../utils/escape.js';
// ...
data-module-id="${esc(mod.id)}"
aria-label="${esc(mod.title)}"
data-lucide="${esc(mod.icon.toLowerCase())}"
>${esc(mod.title)}</span>
```

Apply `esc()` consistently to every `mod.*` and `lesson.*` interpolation across `sidebar.js`, `home-view.js`, and `module-view.js`.

---

### CR-02: Double-render on page load — first render fires before compliance refs are loaded

**File:** `src/router.js:55-56`, `src/main.js:29-31`

**Issue:** `router.js` registers a top-level `window.addEventListener('load', handleRoute)` unconditionally (line 56). `main.js` also calls `handleRoute()` inside `init()`, which runs after `await loadComplianceRefs()` (lines 29-31). Because `router.js` is a module, its top-level statements execute at import time — before `init()` is called. The result is:

1. Module evaluation: `router.js` registers the `load` listener.
2. `init()` starts: `loadComplianceRefs()` begins.
3. `load` event fires: `handleRoute()` executes **before** `setComplianceRefs` has been called — all badges render with the raw key fallback (`"TSA"`, `"NIST"`) instead of the correct short names.
4. `init()` resolves: `handleRoute()` executes a second time with refs now populated.

This means the page renders twice on every cold load. On a slow network the first render (with degraded badge text) is visible before the second render corrects it.

**Fix:** Remove the `load` event listener from `router.js`; let `init()` in `main.js` own the initial render:

```javascript
// src/router.js — remove line 56
// window.addEventListener('load', handleRoute);  // DELETE

// Keep only:
window.addEventListener('hashchange', handleRoute);
```

`init()` already calls `handleRoute()` after awaiting refs, so the `load` listener is fully redundant.

---

### CR-03: Unpinned CDN script tag — supply-chain attack vector

**File:** `index.html:11`

**Issue:**
```html
<script src="https://unpkg.com/lucide@latest"></script>
```

`@latest` resolves to whatever unpkg currently serves. A compromised or hijacked Lucide release would execute arbitrary JavaScript in every user's browser with full DOM access. There is no Subresource Integrity (SRI) hash. This is a concrete supply-chain attack surface.

The inline comment acknowledges this is temporary ("Phase 1 only — swap to npm in Phase 2"), but the risk exists in production from first deploy.

**Fix (immediate):** Pin to a specific version and add an SRI hash:

```html
<script src="https://unpkg.com/lucide@0.511.0/dist/umd/lucide.min.js"
        integrity="sha384-<hash>"
        crossorigin="anonymous"></script>
```

Compute the hash with:
```bash
curl -s https://unpkg.com/lucide@0.511.0/dist/umd/lucide.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

**Preferred fix (Phase 2):** Bundle Lucide via npm (`import { createIcons } from 'lucide'`) and remove the CDN tag entirely. The comment already plans this; it should be done in Phase 2 without exception.

---

### CR-04: CI pipeline deploys without running tests

**File:** `.github/workflows/deploy.yml:34-49`

**Issue:** The workflow runs `npm ci` → `npm run build` → deploy. There is no `npm test` step. All three test files are present and the `test` script is defined in `package.json`. A failing test (regression in the router, malformed compliance-refs.json) would be silently deployed to production.

**Fix:** Add a test step before the build:

```yaml
      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

Place it after "Install dependencies" and before "Build" so a test failure blocks the deploy.

---

## Warnings

### WR-01: `handleRoute` called with uninitialized `#app` element on `load` race

**File:** `src/router.js:45-47`

**Issue:** `handleRoute` accesses `document.getElementById('app')` and immediately assigns `app.innerHTML`. If the DOM is not yet parsed when this fires (edge case: script loaded sync via a non-module polyfill, or test environment), `app` is `null` and `app.innerHTML = ...` throws a TypeError. The `load` listener (now proposed for removal by CR-02) has the same issue in its current form.

**Fix:** Add a null guard:

```javascript
export function handleRoute() {
  const app = document.getElementById('app');
  if (!app) return;
  // ...
}
```

---

### WR-02: `mod.icon` case inconsistency between sidebar and module-view

**File:** `src/sidebar.js:15`, `src/views/module-view.js:38`

**Issue:** `sidebar.js` calls `mod.icon.toLowerCase()` before passing to `data-lucide`, but `module-view.js` does not — it interpolates `mod.icon` directly. Lucide icon names are expected to be lowercase-kebab-case. The values in `modules-config.js` use PascalCase (`"BookOpen"`, `"Shield"`, `"Users"`, `"AlertTriangle"`, `"Wrench"`). For Lucide's UMD bundle, `data-lucide` attribute matching is case-insensitive in practice, but this silent inconsistency will cause icon rendering failures if the Lucide npm package is used in Phase 2 (where icon names must match exported identifiers exactly).

**Fix:** Either normalise icon names to lowercase-kebab in `modules-config.js`, or apply `.toLowerCase()` in both `sidebar.js` and `module-view.js` consistently:

```javascript
// module-view.js line 38
<i data-lucide="${mod.icon.toLowerCase()}" ...></i>
```

---

### WR-03: `badge.js` interpolates `shortName` without HTML-escaping into innerHTML

**File:** `src/badge.js:19`

**Issue:** `shortName` is sourced from `_complianceRefs?.directives?.[directiveKey]?.shortName ?? directiveKey`. When `_complianceRefs` is loaded from a fetch, this value comes from an external JSON file (`data/compliance-refs.json`). If that file is ever tampered with or replaced (e.g., a supply-chain attack on the deployed static assets, or a future CMS integration), a `shortName` like `<img src=x onerror=alert(1)>` would execute via `innerHTML` injection. The same issue applies to `directiveKey` itself when used as the fallback.

**Fix:** Apply `esc()` from the helper proposed in CR-01:

```javascript
return `<span class="...">${esc(shortName)}</span>`;
```

---

### WR-04: `aria-current="false"` is incorrect ARIA usage

**File:** `src/sidebar.js:9`, `src/sidebar.js:63`

**Issue:** The ARIA spec for `aria-current` defines valid token values as: `page`, `step`, `location`, `date`, `time`, and `true`. The value `"false"` is not a valid token — the correct way to indicate "not current" is to either omit the attribute or set `aria-current="false"` only when the element _could_ be current (navigation items). Setting `aria-current="false"` on every non-active module div creates noise for screen-reader users; some assistive technologies announce it as "false" rather than suppressing it.

**Fix:** Remove `aria-current` from the initial HTML template (omit rather than set to `"false"`), and in `setActiveModule`, only set the attribute on the active element:

```javascript
el.removeAttribute('aria-current');
if (isActive) el.setAttribute('aria-current', 'page');
```

---

### WR-05: `.gitignore` does not ignore `.env` files

**File:** `.gitignore:1-3`

**Issue:** The `.gitignore` only excludes `node_modules/`, `dist/`, and `.DS_Store`. There is no entry for `.env`, `.env.local`, `.env.*.local`, etc. While this project has no backend, Vite reads `.env` files and injects variables via `import.meta.env`. A developer adding a secret API key (e.g., for a future analytics integration) to a local `.env.local` file would accidentally commit it.

**Fix:** Add standard Vite `.env` ignore patterns:

```
.env.local
.env.*.local
*.env
```

---

## Info

### IN-01: Stale `*.lock` file exclusion — `yarn.lock` and `Gemfile.lock` have no gitignore entries

**File:** `.gitignore:1-3`

**Issue:** The project uses npm (has `package.json`, uses `npm ci` in CI). `package-lock.json` should be committed and is not gitignored (correct). However there are no ignore entries for accidentally-created `yarn.lock` or `pnpm-lock.yaml` files, which could cause confusion if a developer runs `yarn install` in the directory. Low risk but worth noting.

**Fix:** Add to `.gitignore`:
```
yarn.lock
pnpm-lock.yaml
```

---

### IN-02: Magic `'TSA'`/`'NIST'` strings not validated against `compliance-refs.json` at test time

**File:** `src/modules-config.js:21,32,43,54,65`, `tests/compliance-refs.test.js`

**Issue:** `complianceTags` arrays in `modules-config.js` hardcode the strings `'TSA'` and `'NIST'`. The compliance-refs test validates the JSON shape but does not verify that every key referenced in `modules-config.js` exists in `compliance-refs.json`. A renamed key (e.g., `'TSA'` → `'TSA-SD02F'`) in the JSON would silently degrade all badges to showing the raw key string rather than the formatted short name — with no test catching it.

**Fix:** Add a cross-reference test:

```javascript
// tests/compliance-refs.test.js
import { MODULES } from '../src/modules-config.js'

it('all complianceTags in MODULES exist as keys in compliance-refs.json', () => {
  const keys = Object.keys(refs.directives)
  MODULES.forEach(mod => {
    mod.complianceTags.forEach(tag => {
      expect(keys).toContain(tag)
    })
  })
})
```

---

### IN-03: `sidebar.test.js` third test is a tautology — it tests no real code

**File:** `tests/sidebar.test.js:25-32`

**Issue:** The third test verifies that the string `'Expand navigation'` equals `'Expand navigation'`. It was left as a stub but is currently a passing no-op that provides false test-coverage confidence. The comment says "DOM test will be implemented when sidebar.js is wired" — but sidebar.js is now wired.

**Fix:** Replace with a real DOM test that calls `initSidebar()`, clicks the toggle, and asserts the `aria-label` value on the toggle button:

```javascript
it('sidebar toggle sets aria-label to "Expand navigation" when collapsed', () => {
  document.body.innerHTML = `
    <div id="shell"><nav id="sidebar">
      <div id="sidebar-modules"></div>
      <button id="sidebar-toggle" aria-label="Collapse navigation"></button>
    </nav></div>`
  initSidebar()
  document.getElementById('sidebar-toggle').click()
  expect(document.getElementById('sidebar-toggle').getAttribute('aria-label'))
    .toBe('Expand navigation')
})
```

---

### IN-04: `index.html` references `/src/style.css` — broken in production build

**File:** `index.html:12`

**Issue:** The stylesheet link is `href="/src/style.css"`. Vite's dev server resolves this correctly from the source tree. After `vite build`, Vite rewrites this path to the hashed output file, so the production build is fine. However, if the `index.html` is ever served as a raw static file (e.g., GitHub Pages without the Vite build step, or as a preview of the raw source), this path will 404. This is a low-risk note given the Vite build pipeline is mandatory.

**Fix:** No action required for the current CI/CD pipeline. Note for awareness: this is the standard Vite `index.html` pattern and is intentional.

---

_Reviewed: 2026-05-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
