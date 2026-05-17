# Research Summary --- v2.0

**Project:** Pipeline Cyber Training
**Domain:** Static browser-based cybersecurity compliance training for pipeline IT/OT admins
**Researched:** 2026-05-17
**Confidence:** HIGH (stack, architecture, PWA pitfalls); MEDIUM (sync approach); LOW (TSA SD successor designation)

---

## Executive Summary

Pipeline Cyber Training v2.0 extends a fully-shipped v1.0 static site across four dimensions: deeper training content, org fork capability, offline-first PWA, and cross-device progress sync. The existing Vite 8 + Tailwind v4 + Shiki + vanilla JS stack is sound and unchanged; v2.0 adds exactly three new packages (vite-plugin-pwa, lz-string, qrcode) and zero architectural rewrites. The content engine, quiz engine, scenario engine, and progress store all accept v2.0 additions without schema or code changes --- new lessons, scenarios, and quiz questions are data additions that slot into the existing pipeline.

The single highest-urgency item is not a feature: TSA SD-02F expired May 2, 2026, and the successor directive designation has not been publicly confirmed as of the research date. Every lesson, quiz, and scenario references this version string. The first commit of v2.0 must mark the badge as expired and initiate verification of the successor. No new content should ship until compliance-refs.json is current --- it is the single source of truth for all compliance references.

The recommended phase order (9 to 10 to 11, with 12 parallel to 11) is driven by one hard constraint: vite-plugin-pwa builds the Workbox precache manifest from the dist/ directory at build time. Any content files or config files added after PWA is installed are invisible to the service worker until the next rebuild cycle. Content must be complete and stable before PWA is configured; fork config must exist before PWA runs, so it is captured in the precache. Progress sync has no upstream dependencies and can run concurrently with Phase 11.

---

## Stack Additions

### Add (new v2.0 dependencies only)

| Package | Version | Purpose | Install as |
|---------|---------|---------|----------|
| vite-plugin-pwa | 1.3.0 | Service worker generation (wraps Workbox); Vite 8 compatible | dev |
| lz-string | 1.5.0 | Compress progress JSON for URL/QR share (SYNC-02) | runtime |
| qrcode | 1.5.4 | Generate QR codes for progress share export (SYNC-02) | runtime |

Install command:

```bash
npm install -D vite-plugin-pwa
npm install lz-string qrcode
```

### Do NOT Add

| Candidate | Reason |
|-----------|--------|
| Supabase | Free tier pauses after 7 days inactivity --- fatal for episodic training use. Each fork needs its own project. Zero-ops constraint violated. |
| Firebase / Firestore | Same class of problem --- external service dependency, per-fork config. |
| Auth0 / Clerk | Auth explicitly out of scope for v2.0; URL share avoids auth entirely. |
| idb (IndexedDB) | localStorage stays well within 5 MB at 5 modules. No binary blobs in scope. |
| gray-matter | Content uses JSON sidecars; parseFrontmatter() in content-loader.js already handles arbitrary key-value pairs. |
| Workbox CLI standalone | vite-plugin-pwa wraps Workbox cleanly. Separate build step adds no benefit. |
| React Query / SWR | Lesson content is a single fetch() per navigation. Reactive library is overkill. |
| Full text search (Lunr, FlexSearch) | Not a v2.0 requirement. Pre-adding it is premature. |

### Confirmed Existing Stack (Do Not Change)

Vite 8.0.12, @tailwindcss/vite 4.3.0, marked 18.0.3 (note: CLAUDE.md says v17 --- actual installed version is 18.0.3), shiki 4.0.2, lucide 1.14.0, vitest 4.1.6, happy-dom 20.9.0.

---

## Feature Table Stakes

### CONT --- Content Depth (CONT-05, CONT-06, CONT-07)

**Must work for content to be useful:**
- Every new lesson maps explicitly to at least one TSA SD-02 series control and one NIST SP 800-82 chapter
- Advanced scenarios include OT-specific branching paths where the OT outcome differs meaningfully from the IT outcome --- not an OT footnote on an IT scenario
- New quiz questions use the existing per-answer-feedback JSON schema with no schema changes
- OT callout blocks (> [!OT]) required in every dual-use lesson (DATA-03 rule)
- New lessons require a parallel update to src/modules-config.js --- sidebar and progress engine read from that file, not from the filesystem

**What to defer:**
- Quiz questions added to existing quiz files --- instead, create new quiz files (02.json) to avoid making prior completions appear to have answered questions they never saw
- Any lesson requiring OT tooling beyond PS 5.1 and built-in Windows tools

### FORK --- Internal Org Fork Guide (FORK-01, FORK-02, FORK-03)

**Must work for the fork system to be useful:**
- Deploying org can change org name, logo, active modules, and compliance-refs overrides without touching source code or rebuilding
- fork.config.json read at runtime startup (not baked by Vite at build time) --- build-time env var approach requires orgs to install Node.js
- Missing or malformed fork.config.json falls back to full default config object, never null --- a null return causes silent white-screen failures throughout the app
- activeModules filter applied only at the render layer (sidebar, home cards), never to computeModuleProgress() --- otherwise a 2-module fork can never reach 100% completion

**What to defer:**
- Fork health check validator script --- useful, not blocking
- Custom module stub (6th proprietary module) --- valuable for power users, not v2.0 critical path

### SME --- Compliance Currency (SME-01, SME-02, SME-03)

**Must work for SME artifacts to be useful:**
- compliance-refs.json updated to current active directive before any new content ships
- SME checklist explicitly scopes quizzes/*.json, exercises/*.json, and scenarios/*.json --- quiz stems in logging-auditing/quizzes/01.json hardcode SD-02F directly, bypassing compliance-refs.json
- Last reviewed dates set explicitly by human reviewer, not by git commit timestamps
- The checklist is printable and produces a named, dated sign-off artifact suitable for audit response

**Critical pre-work:** TSA SD-02F expired May 2, 2026. Two tasks must be separated: (1) mark the badge as expired with an appropriate UI state immediately, and (2) research and apply the successor version string once confirmed. Do not assume SD-02G --- verify against TSA.gov before applying.

### PWA --- Offline Support (PWA-01, PWA-02, PWA-03)

**Must work for offline support to be useful:**
- After one load, ALL content is available offline: lesson Markdown, quiz JSON, exercise JSON, scenario JSON, compliance-refs.json, fork.config.json
- globPatterns in Workbox config must explicitly include md and json --- the default covers only js, css, html; without this, lesson content renders blank offline with no error
- scope and start_url must be explicitly set to /pipeline-cyber-training/ in the PWA manifest --- plugin defaults resolve incorrectly for a subpath GitHub Pages deployment
- registerType: autoUpdate with skipWaiting: true --- users who keep the app open as a background tab must receive content updates without closing all tabs

**What to defer:**
- PWA install prompt/banner --- intrusive for the IT/OT admin audience; display: standalone in manifest is sufficient

### SYNC --- Progress Sync (SYNC-01, SYNC-02)

**Must work for sync to be useful:**
- SYNC-01 ADR written before any SYNC-02 implementation --- this is a non-negotiable architectural gate
- Existing JSON export (DATA-05) remains as the always-available fallback regardless of sync choice
- Conflict resolution: two completions on different devices must merge (union of completed lessons; higher quiz score wins) --- never overwrite completed state with incomplete state
- No credentials hardcoded in the repo; any credential storage disclosed explicitly in the UI

**Recommended SYNC-02 approach:** URL-share link (base64+lz-string encoded progress JSON as URL fragment). Zero external dependencies, works offline and on air-gapped networks, no auth. QR code export wraps the same encoded blob. GitHub Gist deferred to v2.1.

---

## Architecture: Recommended Phase Order

### Phase 9 --- Compliance Currency + Content Depth

**Rationale:** TSA SD-02F expired May 2, 2026 --- data correctness issue that must precede all other work. Content additions must land before Phase 11 (PWA) builds its Workbox precache manifest from dist/; any lessons added after PWA installs miss the precache until the next service worker activation cycle.

**Delivers:** SME-01, SME-02, SME-03, CONT-05, CONT-06, CONT-07

**Key technical work:**
- Edit public/data/compliance-refs.json --- add status and expiryDate fields; update badge.js to render expired state; apply successor version once verified
- Run text search across all public/data/ for hardcoded SD-02F strings in quiz/exercise/scenario JSON
- Author 10+ new lesson .md files (2+ per module), 5 new advanced scenario .json files, create new quiz files (02.json) rather than appending to existing files
- Add new lesson entries to src/modules-config.js alongside every new lesson file --- dual-update is mandatory
- Write docs/SME-REVIEW-CHECKLIST.md

**Files that do NOT change:** progress-store.js, all engine files, content-loader.js. Content is purely additive.

### Phase 10 --- Fork Configuration System

**Rationale:** Fork config touches main.js, modules-config.js, sidebar.js, and index.html --- the same four files Phase 11 also touches. Fork config first means Phase 11 sees the final file structure. public/fork.config.json must exist before PWA builds its precache manifest.

**Delivers:** FORK-01, FORK-02, FORK-03

**Key technical work:**
- Create src/fork-config.js --- loadForkConfig() returns DEFAULT_FORK_CONFIG on 404 (never null); uses import.meta.env.BASE_URL + fork.config.json
- Modify src/main.js --- loadForkConfig() must be the FIRST async call in init(), before loadComplianceRefs() (fork config may override compliance refs)
- Convert src/modules-config.js to getModules() function with activeModules filter; apply filter only at render layer --- never in computeModuleProgress()
- Logo path must be prepended with import.meta.env.BASE_URL --- root-relative paths break at GitHub Pages subpath
- Create public/fork.config.json with safe defaults; write docs/FORK-GUIDE.md

### Phase 11 --- PWA / Offline Support

**Rationale:** Requires Phase 9 (final content set) and Phase 10 (fork.config.json exists) to be complete so the Workbox precache manifest captures all final static files. Hard dependency: the manifest is a snapshot of dist/ at build time.

**Delivers:** PWA-01, PWA-02, PWA-03

**Key technical work:**
- npm install -D vite-plugin-pwa
- Configure vite.config.js: explicit scope and start_url = /pipeline-cyber-training/; globPatterns includes js,css,html,md,json,ico,png,svg,woff2; registerType: autoUpdate; skipWaiting: true; clientsClaim: true; navigateFallback: /pipeline-cyber-training/index.html
- Create PWA icon assets in public/ (pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png)
- Create src/pwa-ui.js using window online/offline events and SW controllerchange (do not rely on navigator.onLine alone)
- Add offline-banner div to index.html; wire in src/main.js
- Add offline smoke test (Chrome DevTools Network to Offline) to acceptance criteria

### Phase 12 --- Progress Sync (parallel with Phase 11)

**Rationale:** No upstream dependencies beyond the existing progress store API. Can run concurrently with Phase 11 --- the two share no files. DATA-05 already partially covers the use case, so this is the lowest-urgency v2.0 feature.

**Delivers:** SYNC-01 (ADR), SYNC-02 (URL share + QR implementation)

**Key technical work:**
- Write docs/ADR-001-sync-approach.md --- document URL-share as chosen approach; explicitly reject GitHub Gist (PAT-in-localStorage is credential exposure anti-pattern) and Supabase (free tier pause incompatible with episodic training)
- npm install lz-string qrcode
- Create src/sync-share.js with generateShareUrl() and decodeShareUrl() --- wraps existing progressStore.exportProgress() / importProgress() API
- Add share button to progress footer in src/sidebar.js
- Add hash /import?data= detection to src/router.js initial load check
- If PWA is in same release: add NetworkOnly Workbox runtime caching for any external API URLs in same PR

**No schemaVersion bump needed** --- URL-share encodes existing schema v1 JSON without new store fields.

**Dependency graph:**

    Phase 9 (Content + Compliance)
      -> Phase 10 (Fork Config)
        -> Phase 11 (PWA)

    Phase 12 (Sync) -- parallel with Phase 11; no shared files

---

## Watch Out For

1. **Markdown and JSON files silently excluded from offline cache** --- Workbox defaults to js,css,html only. Lesson content renders blank offline with no error (silent catch in fetchLesson()). Prevention: always include md and json in globPatterns; add offline smoke test to Phase 11 acceptance criteria.

2. **TSA SD-02F expired --- no confirmed successor yet** --- Badge currently shows an expired directive. Two tasks: (a) mark expired via a status field in compliance-refs.json immediately; (b) apply successor only after manual verification at TSA.gov. Do not assume SD-02G.

3. **Quiz JSON hardcodes SD-02F bypassing compliance-refs.json** --- Confirmed in public/data/modules/logging-auditing/quizzes/01.json. SME checklist must scope all quiz/exercise/scenario JSON files. Run text search across public/data/ for SD-02F before marking SME-01 complete.

4. **New lessons unreachable if modules-config.js is not updated** --- Sidebar, getLessonNav(), and computeModuleProgress() all read from MODULES in src/modules-config.js. Every new .md file requires a simultaneous modules-config.js update.

5. **PWA scope mismatch at GitHub Pages subpath** --- Without explicit scope and start_url = /pipeline-cyber-training/ in the VitePWA manifest config, service worker registration fails with a DOMException. Set manifest fields explicitly; do not rely on the plugin to infer them from base.

6. **activeModules filter applied to progress calculation breaks completion math** --- A fork with 2 active modules can never reach 100% if computeModuleProgress() operates on a filtered list. Filter only at the render layer; pass the full module object to progress calculations.

7. **fork.config.json 404 returns null causes silent white screen** --- loadForkConfig() must return DEFAULT_FORK_CONFIG on any fetch failure --- never null. A null return causes TypeErrors that the view renderer catch block swallows, producing a blank white screen.

8. **Stale compliance-refs.json for offline users after SME update** --- Workbox precache manifest only updates on npm run build. Editing compliance-refs.json in GitHub web editor without triggering CI leaves offline users on the expired version. Always trigger a build after any public/ data file change.

---

## Key Decisions Already Made

The roadmapper should treat these as settled.

| Decision | Rationale |
|----------|----------|
| No Supabase | Free tier pauses after 7 days inactivity; breaks fork deployments; incompatible with zero-ops philosophy |
| URL-share link as SYNC-02 | Zero external dependencies; works offline and on air-gapped networks; no auth; size fits within URL limits for 5 completed modules |
| vite-plugin-pwa with generateSW strategy | Canonical Vite PWA solution; Workbox 7 wrapped behind one plugin; no hand-maintained service worker file; Vite 8 compatible |
| fork.config.json fetched at runtime, not baked at build time | Orgs must be able to reconfigure a deployed fork without rebuilding |
| No schemaVersion bump in v2.0 | All v2.0 additions are backward compatible with schema v1 JSON; no new top-level store fields added |
| New quiz questions as new files (02.json), not additions to existing files | Prior completers see locked cards for questions they never answered; quiz engine tracks completion by stored total count |
| Phase 9 to 10 to 11 ordering is fixed | Workbox precache manifest is built from dist/ at build time; content and fork config must be finalized before PWA installs |
| marked is at v18 in the installed codebase | CLAUDE.md references v17 but package.json shows 18.0.3; update CLAUDE.md in Phase 9 as housekeeping |

---

## Open Questions (Must Resolve Before Phase Executes)

| Question | Phase Blocked | How to Resolve |
|----------|--------------|----------------|
| What is the TSA SD-02F successor directive designation? | Phase 9 (SME-01) | Navigate to https://www.tsa.gov/sd-and-ea manually (TSA blocks automated fetches with 403). SD-02G is pattern-predicted but must be verified --- do not assume. |
| Does GitHub Actions CI auto-deploy on push to main? | Phase 11 (PWA) | Check .github/workflows/ directory. If yes, Workbox manifest regeneration is automatic. If no, document manual build-and-deploy requirement prominently. |
| Are PWA icons already in the repo? | Phase 11 (PWA-01) | Check public/ directory for pwa-192x192.png and pwa-512x512.png. If absent, create from the existing color scheme (#111827 background). |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack additions | HIGH | vite-plugin-pwa releases confirmed; lz-string and qrcode are stable; Supabase free tier pause behavior confirmed via official docs |
| Feature requirements | HIGH | Table stakes derived from live codebase inspection of quiz-engine.js, scenario-engine.js, content-loader.js, modules-config.js |
| Architecture + phase order | HIGH | Dependency chain verified against live source files; Workbox precache timing confirmed against official vite-plugin-pwa docs |
| Pitfalls | HIGH | Most pitfalls confirmed by direct inspection of production source files (hardcoded SD-02F in quiz JSON, silent null in fetchLesson, missing globPatterns default) |
| TSA SD successor designation | LOW | SD-02F confirmed expired May 2, 2026. Successor unconfirmed. TSA.gov blocks automated fetches. Manual verification required. |

**Overall confidence: HIGH** --- with one LOW-confidence gap on the TSA directive successor, which has a clear manual verification path.

### Gaps to Address

- **TSA SD-02F successor:** Verify manually at TSA.gov before any new content ships. Single blocking open question for Phase 9.
- **GitHub Actions CI configuration:** Verify before Phase 11 to determine whether rebuild-after-data-change constraint is automatic or requires documented manual step.
- **CLAUDE.md version string:** References marked.js v17 but installed version is 18.0.3. Update CLAUDE.md in Phase 9 as housekeeping.

---

## Sources

### Primary (HIGH confidence)
- vite-plugin-pwa GitHub releases --- version 1.3.0, Vite 8 compatibility, Workbox 7 bundled
- vite-pwa-org.netlify.app/guide --- generateSW strategy, globPatterns, scope/start_url requirements
- Supabase official docs --- anonymous auth, free tier pause behavior, RLS requirements
- GitHub REST API docs --- CORS support for Gist API, PAT scope requirements
- MDN --- PWA offline operation, navigator.onLine limitations, service worker scope enforcement
- Project source code (direct inspection) --- progress-store.js, main.js, modules-config.js, sidebar.js, router.js, content-loader.js, vite.config.js, package.json, index.html, public/data/modules/logging-auditing/quizzes/01.json

### Secondary (MEDIUM confidence)
- vite-pwa/vite-plugin-pwa GitHub issue #82 --- scope mismatch at non-root GitHub Pages deployments
- TSA SD-01G PDF (January 2026) --- confirms letter-increment pattern for SD series renewals; basis for SD-02G prediction

### Tertiary (LOW confidence)
- TSA.gov SD-and-EA page --- automated fetch returns 403; successor designation unconfirmed; manual verification required

---

*Research completed: 2026-05-17*
*Ready for roadmap: yes --- 4 phases identified (Phases 9-12); Phase 9 blocked pending TSA directive manual verification*