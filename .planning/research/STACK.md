# Stack Research — Pipeline Cyber Training

**Researched:** 2026-05-10
**Confidence:** MEDIUM-HIGH overall (see per-component ratings)

---

## Recommended Stack

### JavaScript Framework

**Choice:** Vanilla JS (ES2022+), no framework
**Version:** Native browser APIs — no version pinning needed
**Rationale:**
This app has five modules, a simulated terminal, quizzes, and a reference library. The component count is bounded and well-understood. Svelte/SvelteKit would reduce verbosity for reactive state, but it introduces a build step with more failure modes, adapter-static configuration for GitHub Pages base-path handling, and a framework dependency that future contributors must know. Vanilla JS with ES modules handles this scope cleanly: `localStorage` reads/writes are trivial, DOM updates for quiz scoring are straightforward, and the terminal simulator is inherently imperative code that fights declarative frameworks anyway.

The key comparison considered was Svelte (via SvelteKit + adapter-static) vs. Vanilla JS. Svelte's bundle is tiny (~3.6kb gzipped for a TodoMVC), reactivity is elegant, and GitHub Pages deployment is well-documented. However, the routing problem is real: SvelteKit with adapter-static on a project-scoped GitHub Pages URL (e.g., `username.github.io/pipeline-training/`) requires `kit.paths.base` to match the repo name exactly, and hash routing or the 404.html redirect hack must be chosen deliberately. For a content-heavy training app where navigation is primarily between named sections (not dynamic routes), a simple hash-based router in Vanilla JS avoids all of that friction with zero configuration.

React and Vue are excluded: both require larger build toolchains, produce bigger bundles, and provide no meaningful benefit over Vanilla JS for a bounded five-module content site.

**When to reconsider:** If the app grows to need a visual builder UI, user-created content, or complex shared reactive state across many components, Svelte becomes worth the tradeoff.
**Confidence:** HIGH

---

### Build Tool

**Choice:** Vite
**Version:** 8.0.x (latest stable as of May 2026; requires Node.js 20.19+ or 22.12+)
**Rationale:**
Vite is the industry standard for static site build pipelines in 2025-2026. It provides hot module replacement during development, handles Tailwind CSS v4 via the first-party `@tailwindcss/vite` plugin, bundles ES modules correctly for production, and has official GitHub Pages deployment documentation. Even for a Vanilla JS project, Vite's dev server eliminates the CORS friction of opening `file://` HTML directly in a browser. The GitHub Actions deploy workflow is a single YAML file (install → build → deploy to gh-pages branch).

Alternative considered: No build tool (plain HTML/CSS/JS). Viable for very simple sites but loses: Tailwind v4 compilation (required — CDN support was removed in v4), import aliasing, and minification. The added complexity of Vite is worth it for these gains.
**Confidence:** HIGH

---

### CSS Framework

**Choice:** Tailwind CSS v4
**Version:** 4.1.x (released January 2025; current minor as of May 2026)
**Rationale:**
Tailwind v4 is the clear choice for 2025-2026 new projects. Key facts:
- State of CSS 2025 survey: Tailwind at 62% satisfaction (up 15% YoY); Bootstrap at 41% (down 8%)
- v4's Oxide/Lightning CSS engine: full builds 3.5x faster than v3, incremental builds 8x faster
- CSS-first configuration via `@theme` directive — no `tailwind.config.js` needed
- First-party Vite plugin (`@tailwindcss/vite`) integrates in one line

For a desktop-primary training app with no design system requirement, Tailwind's utility-first approach produces maintainable styles without the "fighting Bootstrap defaults" problem. The cybersecurity/industrial aesthetic (dark backgrounds, monospace terminal sections, clear typographic hierarchy) is easier to achieve with Tailwind utilities than Bootstrap's opinionated component library.

**Important:** Tailwind v4 dropped CDN support. A build step (Vite) is mandatory. This is already required (see Build Tool above) so there is no added cost.

Bootstrap 5 was considered. It ships a full component library with no build step required (CDN), but that advantage disappears once Vite is in the stack. Bootstrap's bundle size (all unused components included) is larger, its default aesthetic is harder to escape, and its community momentum is declining relative to Tailwind.
**Confidence:** HIGH

---

### Simulated Terminal Component

**Choice:** jQuery Terminal (`jquery.terminal`)
**Version:** 2.46.0 (released May 5, 2026)
**Rationale:**
This is the most important and least obvious choice in the stack. Two candidates:

**xterm.js** (`@xterm/xterm`, v6.0.0) is what VS Code uses. It is a full VT100 terminal emulator — input capture, ANSI escape codes, scrollback buffer, WebGL renderer. It is designed to be connected to a real process (via WebSocket + node-pty). For a *simulated* terminal with no backend, you must implement every command handler yourself while fighting xterm's process-oriented API. The xterm.js maintainers explicitly acknowledge in GitHub discussions (issue #4414) that there is "no ready-to-go solution without flaws for pure in-browser handling" — the library is not designed for the fake-terminal use case.

**jQuery Terminal** is designed exactly for the fake-terminal use case. From its own documentation: "with this library you need to code all the commands yourself — you can call it a fake terminal emulator." It ships a `interpreter` callback where every command string is passed to a handler function that returns a response. This maps directly to the project's need: parse a PowerShell command string, validate it against expected patterns, return feedback. The jQuery Terminal maintainer explicitly recommends it over xterm.js for GitHub Pages and no-backend deployments.

The jQuery dependency is a legitimate concern for a modern Vanilla JS project. jQuery Terminal 2.x does require jQuery. This adds ~87KB minified (30KB gzipped) to the bundle. Acceptable for a training app where bundle size is not a primary constraint. If the jQuery dependency is unacceptable, the alternative is a custom-built terminal UI — a `<div>` with keyboard event handling, a command history array, and a display function. This is ~200 lines of vanilla JS and completely viable; it loses jQuery Terminal's built-in history, tab completion scaffolding, and ANSI color support but gains zero dependencies. Document this as a decision point at implementation time.
**Confidence:** MEDIUM (jQuery dependency is a code-smell in a modern stack; custom terminal is a valid alternative that should be prototyped)

---

### Syntax Highlighting (Lesson Code Blocks & Terminal Output)

**Choice:** Shiki
**Version:** 4.0.x (latest stable as of May 2026; ~2 months old at research date)
**Rationale:**
Shiki uses VS Code's TextMate grammar engine, meaning its PowerShell highlighting is identical to VS Code — the tool the target audience uses daily. It supports 200+ languages including PowerShell out of the box. Critically, Shiki is designed to run at build time: code blocks are highlighted to static HTML during the Vite build, shipping zero JavaScript to the client for syntax highlighting.

Prism.js was considered. It has a PowerShell community plugin (`prism-powershell`) and is more modular than highlight.js, but it runs client-side (adds JS weight) and its PowerShell grammar is less complete than VS Code's. Highlight.js is explicitly noted as having incomplete PowerShell support in multiple sources.

Shiki integrates with marked.js and markdown-it via plugins (e.g., `markdown-it-shiki`, `rehype-shiki`). If lesson content is authored in Markdown (see below), the Shiki integration slots in naturally.
**Confidence:** HIGH

---

### Markdown Rendering (Lesson Content)

**Choice:** marked.js
**Version:** 17.0.x (latest stable as of May 2026; 39M+ weekly npm downloads)
**Rationale:**
Lesson content authored in Markdown is the right workflow for this project: content contributors (subject matter experts) can edit `.md` files without touching JavaScript, compliance mappings can be added as frontmatter, and diffs are readable in GitHub PRs.

marked.js is the highest-download Markdown parser on npm (~39M/week vs. markdown-it at a lower figure). It is fast (1,587 ops/sec vs. markdown-it's 743 ops/sec on a README benchmark), actively maintained (v17.0.0 as of research date), and integrates directly with Shiki for syntax highlighting.

The unified/remark ecosystem is the more powerful alternative — it processes Markdown as an AST and has a rich plugin ecosystem (remark-gfm, rehype-sanitize, etc.). This is the right choice if content processing becomes complex (footnotes, custom directives, compliance tag rendering). For v1, marked.js is simpler and sufficient.

**Security note:** marked.js converts Markdown to HTML. XSS is a risk if lesson content ever includes user-supplied input. For static, curated content authored in the repository, this is not a practical risk. If the app later allows user-submitted content, switch to remark + rehype-sanitize.
**Confidence:** HIGH

---

### Quiz / Assessment

**Choice:** Custom-built (no library)
**Version:** N/A
**Rationale:**
SurveyJS Form Library (MIT licensed, v2.4.x) is capable and handles scoring, timing, and multiple question types. However, for this project's quiz requirements — multiple choice, command completion, compliance tag mapping — a custom quiz engine is ~150 lines of Vanilla JS and zero dependencies. The quiz state (current question index, selected answers, score) is a plain JS object, persistence to localStorage is `JSON.stringify`, and the render function is a template literal.

SurveyJS adds significant complexity: it has its own JSON schema for quiz definition, its own rendering model, and its own event system. That complexity is warranted when non-technical authors need a visual quiz builder. Here, quiz content will be authored by developers alongside lesson content in JSON or Markdown frontmatter.

The quiz format is bounded: multiple-choice knowledge checks plus command-entry exercises. Custom code is easier to extend (e.g., "type the correct PowerShell command to enable audit logging" validator) than bending SurveyJS to that pattern.
**Confidence:** HIGH

---

### Progress Tracking

**Choice:** `localStorage` with a structured JSON schema, no library
**Version:** Browser native API
**Rationale:**
localStorage is the correct and only viable approach for a no-auth static site. The storage limit is ~5MB per origin; a full progress record for five modules with quiz scores and exercise completion flags will be under 50KB. The schema is simple:

```json
{
  "version": 1,
  "modules": {
    "logging-auditing": {
      "lessonsCompleted": ["intro", "event-log-basics"],
      "quizScores": { "knowledge-check-1": 80 },
      "exercisesCompleted": ["ex-01"]
    }
  },
  "lastVisited": "2026-05-10T14:00:00Z"
}
```

Include a `version` field from day one. When the schema changes, write a migration function that reads the old shape and writes the new shape. Without versioning, a schema change silently corrupts every returning user's progress.

No library is needed. `idb` (IndexedDB wrapper) is overkill for this data size. A single `progressStore.js` module with `get()`, `set()`, `markComplete()`, and `reset()` functions wraps the localStorage calls and is the only interface the rest of the app uses.
**Confidence:** HIGH

---

### GitHub Pages Deployment

**Choice:** GitHub Actions + Vite build → `gh-pages` branch
**Version:** `actions/deploy-pages@v4` (current as of May 2026)
**Rationale:**
GitHub Pages now supports deploying from a GitHub Actions artifact directly (Settings → Pages → Source: GitHub Actions). This is cleaner than the legacy `gh-pages` branch approach. The workflow:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22)
3. `npm ci && npm run build`
4. `actions/upload-pages-artifact@v3` pointing at `dist/`
5. `actions/deploy-pages@v4`

**Critical configuration for project-scoped URLs:** If the site lives at `username.github.io/pipeline-training/`, set `base: '/pipeline-training/'` in `vite.config.js`. All asset URLs in the built output will be prefixed correctly. Miss this and every CSS/JS reference is a 404.

**Routing strategy:** Use hash-based routing (`#/module/logging-auditing/lesson/intro`). This is the simplest correct solution for a static site on GitHub Pages. The `#` prevents GitHub from trying to resolve the path as a file and returning a 404. The 404.html redirect hack (rafgraph/spa-github-pages) works but has SEO side effects and confuses some browser error banners — hash routing is cleaner for a training app with no SEO requirement.

**Jekyll:** Disable it. Add a `.nojekyll` file in the `public/` directory (Vite copies this to `dist/` at build time). Jekyll interferes with files and directories starting with `_` (which Vite may generate).
**Confidence:** HIGH

---

## What NOT to Use

| Thing | Why Not |
|-------|---------|
| **React / Next.js** | Adds 45KB+ bundle weight, complex build config, and provides no benefit over Vanilla JS for a content site with bounded interactivity. Next.js static export works but is architectural overkill. |
| **Vue / Nuxt** | Same reasoning as React. Neither ecosystem advantage applies here. |
| **xterm.js for the fake terminal** | Designed for real process connection; no native fake-terminal mode. Requires fighting the library to build what jQuery Terminal provides out of the box. See terminal section above. |
| **Bootstrap 5** | Declining community momentum, harder to escape the default aesthetic, larger bundle than Tailwind with Vite's purging. No advantage once a build step is accepted. |
| **Tailwind CSS v3 or CDN** | v4 CDN was removed. v3 is the previous major; new projects should start on v4. |
| **Tailwind v4 without Vite** | PostCSS setup is more configuration. Vite plugin is the recommended path for new projects. |
| **Jekyll (GitHub Pages default)** | Jekyll is Python-era static site tooling. Vite produces a better developer experience, faster builds, and modern JS module handling. Disable Jekyll with `.nojekyll`. |
| **SurveyJS for quizzes** | License is MIT but the library is heavy for this bounded use case. Custom quiz engine is ~150 lines and easier to extend for command-entry validation. |
| **remark/unified ecosystem for Markdown** | More powerful than needed for v1. Correct choice if content processing becomes complex; defer until that need is demonstrated. |
| **highlight.js** | Explicitly noted as having incomplete PowerShell support. Shiki is superior for this use case. |
| **Prism.js** | Client-side JS adds weight; PowerShell grammar less complete than Shiki's VS Code-derived grammar. |
| **CDN-only (no build step)** | Tailwind v4 requires a build step. Once Vite is in the stack, "no build step" is no longer a constraint to optimize for. |
| **iframe-embedded terminals (e.g., full shell-in-browser services)** | Adds external dependency, security surface, and doesn't allow the controlled command-validation behavior the project requires. |

---

## GitHub Pages Specifics

**Repository type matters:**
- User/org site (`username.github.io`): set `base: '/'` in Vite config
- Project site (`username.github.io/pipeline-training/`): set `base: '/pipeline-training/'`

**Deployment workflow location:** `.github/workflows/deploy.yml` — triggers on push to `main`.

**No server-side features available:** No rewrites, no redirects, no headers configuration, no server-side rendering. The entire app must be static HTML/CSS/JS. This is already the project constraint; confirming no exceptions exist.

**`.nojekyll` is mandatory:** Place in `public/` so Vite copies it to `dist/`. Without it, Jekyll strips `_` prefixed files/directories that Vite may generate.

**Hash routing is the path of least resistance:** URLs like `#/module/logging` require zero GitHub Pages configuration. Browser history API (`pushState`) URLs like `/module/logging` require the 404.html redirect hack, which has documented issues with browser error UI and some proxies. For a training app, clean URLs are a "nice to have," not a requirement.

**Fork-and-customize support:** The public-to-internal-fork use case is well-served by GitHub Pages. A fork gets its own Pages site at the forker's namespace. The only required change after forking is updating the Vite `base` path if the repo name differs. Document this explicitly in the project README.

---

## Open Source References

| Project | Tech Stack | Relevance |
|---------|-----------|-----------|
| **PagerDuty Security Training** ([github.com/PagerDuty/security-training](https://github.com/PagerDuty/security-training)) | MkDocs + custom theme, Markdown content | Reference for module/lesson organization and compliance tagging in Markdown. Uses Python toolchain (MkDocs), not JS — don't copy the build setup, but study the content structure. |
| **Open Security Training** ([emreugurlu.github.io/open-security-training](https://emreugurlu.github.io/open-security-training/)) | Static site, localStorage progress, no login | Closest analog: six interactive modules, progress saved locally, no authentication. SCORM-compatible output noted. Study the module completion UX. |
| **jquery.terminal examples** ([terminal.jcubic.pl/examples.php](https://terminal.jcubic.pl/examples.php)) | jQuery Terminal demos | Reference for PowerShell-style fake terminal implementation patterns, ANSI color usage, and command history behavior. |
| **spa-github-pages** ([github.com/rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages)) | 404.html redirect hack | Reference only — the hash routing approach is preferred. If hash routing is later rejected, this is the documented fallback. |
| **sveltekit-gh-pages** ([github.com/metonym/sveltekit-gh-pages](https://github.com/metonym/sveltekit-gh-pages)) | SvelteKit + adapter-static | Reference for GitHub Pages deployment workflow if the framework decision is revisited. |

---

## Installation

```bash
# Initialize project
npm create vite@latest pipeline-training -- --template vanilla

cd pipeline-training

# CSS
npm install tailwindcss @tailwindcss/vite

# Markdown rendering
npm install marked

# Syntax highlighting (build-time)
npm install shiki

# Simulated terminal
npm install jquery jquery.terminal

# Dev dependencies
npm install -D vite
```

**vite.config.js** (project-scoped GitHub Pages):
```js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/pipeline-training/',
  plugins: [tailwindcss()],
})
```

**src/style.css:**
```css
@import "tailwindcss";
```

---

## Version Summary Table

| Package | Version | Source |
|---------|---------|--------|
| Vite | 8.0.x | GitHub releases (verified May 2026) |
| Tailwind CSS | 4.1.x | Official blog + endoflife.date (verified) |
| @tailwindcss/vite | 4.1.x | Ships with Tailwind v4 |
| marked | 17.0.x | npm (verified; 39M+ weekly downloads) |
| Shiki | 4.0.x | npm (verified; released ~March 2026) |
| jquery.terminal | 2.46.0 | GitHub releases (verified May 5, 2026) |
| jQuery | 3.7.x | Required by jquery.terminal |
| @xterm/xterm | 6.0.0 | npm (noted for reference; NOT recommended for this project) |
| Node.js (dev) | 22.x LTS | Required by Vite 8.x |
| GitHub Actions deploy | actions/deploy-pages@v4 | GitHub marketplace (current) |

---

## Gaps and Open Questions

1. **jQuery Terminal vs custom terminal:** The jQuery dependency should be prototyped early (Phase 1 or 2). If the team finds the dependency unacceptable, a custom 200-line vanilla JS terminal is the alternative. This decision should be made before lesson content is written, since the terminal API shape affects exercise authoring.

2. **PowerShell command parser complexity:** The simulated terminal needs to recognize and validate PowerShell command patterns (e.g., `Get-WinEvent -LogName Security -MaxEvents 50`). The complexity of this parser determines whether a simple regex-match approach suffices or whether a lightweight PS command parser is needed. This is a feasibility question for the terminal implementation phase.

3. **Markdown frontmatter for compliance tagging:** Lesson files will need frontmatter (YAML or TOML) to carry TSA/NERC CIP/NIST control IDs. marked.js does not parse frontmatter natively. Add `gray-matter` (npm) to the build pipeline for frontmatter extraction. Version: 4.0.x (stable, widely used).

4. **Offline use:** GitHub Pages serves over HTTPS with standard cache headers. If learners need fully offline access (disconnected OT environments), a Service Worker + cache-first strategy is needed. This is out of scope for v1 but should be flagged as a fork/customization consideration for internal company deployments on air-gapped networks.
