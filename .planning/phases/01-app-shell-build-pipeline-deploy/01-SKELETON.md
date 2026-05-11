# Walking Skeleton — Pipeline Cyber Training

**Phase:** 1 — App Shell + Build Pipeline + Deploy
**Created:** 2026-05-11
**Proven by:** Live URL at https://Bgarrison84.github.io/pipeline-cyber-training/

---

## Capability Proven End-to-End

A user can:
1. Visit the live GitHub Pages URL and see the OT Security Lab app shell (top bar + sidebar + content area)
2. Click any of the 5 module entries in the left sidebar
3. The URL hash changes (e.g. `#/module/logging-auditing`) without a full page reload
4. The content area renders a module placeholder view with: module title, goal statement, TSA/NIST compliance badges (sourced from a JSON file), and 4 labeled section cards
5. Navigate back with the browser back button (native hash history)
6. Bookmark any module URL and return to the same view on reload
7. Type an arbitrary hash (e.g. `#/garbage`) and see the 404 view — no blank screen, no error

The entire delivery pipe is proven: local Vite build → GitHub Actions CI → GitHub Pages CDN → browser.

---

## Architectural Decisions

These decisions are locked for the lifetime of the project. Subsequent phases build on them without renegotiating.

| Concern | Decision | Rationale | Locked In |
|---------|----------|-----------|-----------|
| **Framework** | Vanilla JS (ES2022+) + Vite 8 | No framework needed for a bounded 5-module content site; zero runtime overhead | Plan 01 |
| **CSS** | Tailwind v4 via `@tailwindcss/vite` plugin | v4 removed CDN; Vite plugin is the one-line integration path; no PostCSS config needed | Plan 01 |
| **Design tokens** | `@theme` block in `src/style.css` | Single file is the rebranding/forking point (CONTEXT.md D-12); no tailwind.config.js | Plan 01 |
| **Routing** | Hash-based (`#/module/:id`) via `hashchange` event | Eliminates GitHub Pages SPA 404 problem; zero server config; native browser history | Plan 02 |
| **Compliance data** | `data/compliance-refs.json` — single source for all version strings | TSA directive versions change; one-line edit to update everywhere | Plan 01 |
| **Asset base path** | `base: '/pipeline-cyber-training/'` in `vite.config.js` | GitHub Pages project site (not user/org site) requires explicit base path | Plan 01 |
| **Deployment** | GitHub Actions → `actions/deploy-pages@v5` | Official Vite-documented pattern; idempotent; no `gh-pages` branch | Plan 04 |
| **Jekyll suppression** | `public/.nojekyll` (in `public/`, not root) | Vite copies `public/` to `dist/`; Jekyll strips `_`-prefixed chunk files without this | Plan 01 |
| **Icon system** | Lucide CDN (`unpkg.com/lucide@latest`) in Phase 1 | Zero setup; icon names stay the same when swapping to bundled import in Phase 2 | Plan 02 |
| **Testing** | Vitest + happy-dom | Shares Vite config and transform pipeline; no separate babel/jest config needed | Plan 01 |
| **Progress store** | localStorage (Phase 3+) | Only viable option for no-auth static site; wrapped in single `progress-store.js` | Deferred |
| **Directory layout** | See below | Established by Phase 1 scaffold | Plan 01 |

---

## Directory Layout (Phase 1 output — contract for all phases)

```
pipeline-cyber-training/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: Node 22, npm ci, vite build, deploy-pages@v5
├── public/
│   └── .nojekyll               # MUST be here (not project root) — Vite copies to dist/
├── data/
│   └── compliance-refs.json    # Single source for TSA/NIST version strings — never hardcode elsewhere
├── src/
│   ├── main.js                 # Entry: loadComplianceRefs(), init(), exports renderBadge()
│   ├── router.js               # matchRoute(), handleRoute(), hash event listeners
│   ├── sidebar.js              # initSidebar(), setActiveModule(), collapse toggle
│   ├── modules-config.js       # Static MODULES array (Phase 2 replaces with data/modules/ fetch)
│   ├── views/
│   │   ├── home-view.js        # renderHome() — module catalog cards
│   │   ├── module-view.js      # renderModule({ moduleId }) — placeholder skeleton
│   │   └── not-found-view.js   # renderNotFound() — static 404
│   └── style.css               # @import "tailwindcss" + @theme tokens (ONLY token file)
├── tests/
│   ├── router.test.js          # matchRoute unit tests (SHELL-02)
│   ├── sidebar.test.js         # sidebar render + toggle tests (SHELL-01)
│   └── compliance-refs.test.js # JSON schema tests (DATA-01)
├── index.html                  # #shell grid, #top-bar, #sidebar, #app, Lucide CDN
├── vite.config.js              # base: '/pipeline-cyber-training/', plugins: [tailwindcss()]
├── vitest.config.js            # environment: 'happy-dom', include: tests/**/*.test.js
└── package.json                # scripts: build, dev, test, test:ui
```

Files NOT in Phase 1 (added in later phases):
- `src/progress-store.js` — Phase 3
- `src/content-loader.js` — Phase 2
- `src/terminal-engine.js` — Phase 5
- `src/quiz-engine.js` — Phase 4
- `src/scenario-engine.js` — Phase 6
- `data/modules/` — Phase 2

---

## Stack Touched in Phase 1

| Package | Version | Role |
|---------|---------|------|
| vite | 8.0.12 | Build tool + dev server |
| @tailwindcss/vite | 4.3.0 | Tailwind v4 Vite plugin |
| tailwindcss | 4.3.0 | CSS framework (CDN-free, @theme tokens) |
| vitest | latest | Test runner |
| @vitest/ui | latest | Vitest browser UI |
| happy-dom | latest | Browser-like DOM for unit tests |
| Lucide (CDN) | latest via unpkg | Icons — swap to npm in Phase 2 |
| Inter | Google Fonts | UI font |
| JetBrains Mono | Google Fonts | Code/terminal/hash font |

Node version requirement: `>=20.19.0 || >=22.12.0` (Vite 8 minimum). Use Node 22 LTS.

---

## Out of Scope (not established in Phase 1)

- Markdown rendering (Phase 2)
- Syntax highlighting (Phase 2)
- Progress persistence (Phase 3)
- Quiz engine (Phase 4)
- Terminal simulation (Phase 5)
- Scenario engine (Phase 6)
- Real lesson content (Phases 2, 7, 8)
- Service worker / PWA (v2 deferred)
- User accounts / auth (out of scope for v1)

---

## Security Posture (Phase 1)

LOW RISK — no auth, no user input, no external API calls.

Primary controls established:
- `params.moduleId` from hash used only as MODULES lookup key — never injected into `innerHTML` directly
- `renderNotFound()` is completely static — no hash content reaches the DOM
- `public/.nojekyll` prevents Jekyll chunk-stripping attack surface
- `package-lock.json` committed; CI uses `npm ci` for deterministic supply chain
- No `eval()`, no `new Function()`, no `history.pushState` in router

ASVS L1 controls applied: V5 (input validation via matchRoute pattern matching), V7 (error handling — unknown hashes return not-found view, no uncaught errors).

---

## Subsequent Slice Plan

| Phase | Slice | Mounts Into |
|-------|-------|-------------|
| 2 | Markdown fetch + Shiki syntax highlighting + Module 1 content | `src/content-loader.js` → replaces module-view.js stub with real lesson rendering |
| 3 | localStorage progress store | `src/progress-store.js` → consumed by Phase 4 quiz and Phase 5 terminal |
| 4 | Quiz engine + lesson progress UI | `src/quiz-engine.js` → rendered inside module-view lesson area |
| 5 | Simulated PowerShell terminal | `src/terminal-engine.js` → rendered inside module-view terminal area |
| 6 | Scenario engine + compliance index | `src/scenario-engine.js` → hash route `#/compliance` (top bar link wired up) |
| 7 | MOD-02, MOD-03, MOD-04 content | `data/modules/` JSON + Markdown authored; no new src/ files |
| 8 | MOD-05 Patch Management | Same content authoring pattern as Phase 7 |

The router's `#/lesson/:moduleId/:lessonId` route is commented out in Phase 1 — Phase 2 activates it by uncommenting and creating the lesson view.

---

*Walking Skeleton established: Phase 1 — 2026-05-11*
