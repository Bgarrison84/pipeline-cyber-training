# Roadmap — Pipeline Cyber Training

## Milestones

- [x] **v1.0 MVP** — Phases 1–8 (shipped 2026-05-17)
- [ ] **v2.0 Content Depth & Platform Maturity** — Phases 9–12 (in progress)

---

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–8) — SHIPPED 2026-05-17</summary>

- [x] Phase 1: App Shell + Build Pipeline + Deploy (4/4 plans) — completed 2026-05-11
- [x] Phase 2: Content Loader + Lesson Rendering + Module 1 (4/4 plans) — completed 2026-05-14
- [x] Phase 3: Progress Store (3/3 plans) — completed 2026-05-14
- [x] Phase 4: Quiz Engine + Lesson Progress UI (3/3 plans) — completed 2026-05-15
- [x] Phase 5: Simulated PowerShell Terminal + Exercise View (4/4 plans) — completed 2026-05-15
- [x] Phase 6: Scenario Engine + Compliance Index + Completion Summary (4/4 plans) — completed 2026-05-16
- [x] Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04) (4/4 plans) — completed 2026-05-16
- [x] Phase 8: Patch Management Module (MOD-05) (4/4 plans) — completed 2026-05-17

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v2.0 — Content Depth & Platform Maturity

- [ ] **Phase 9: Compliance Currency + Content Depth** — Fix expired TSA badge, author SME review artifacts, add 2+ lessons per module, one advanced OT scenario per module, new quiz files (02.json) with 3+ questions per module
- [ ] **Phase 10: Fork Configuration System** — Deploy fork.config.json runtime config and fork deployment guide so orgs can customize org name, logo, and active modules without touching source code
- [ ] **Phase 11: PWA / Offline Support** — Service worker caching via vite-plugin-pwa so all content plays without a network connection after first load
- [ ] **Phase 12: Progress Sync** — URL/QR share export so learners can carry progress across devices with no account or server

---

## Phase Details

### Phase 9: Compliance Currency + Content Depth

**Goal**: The platform's compliance references are current and accurate, all modules have SME sign-off artifacts, and every module has at least two additional lessons, one advanced OT scenario, and an expanded quiz bank in a new quiz file

**Depends on**: Phase 8 (v1.0 complete)

**Requirements**: SME-01, SME-02, SME-03, CONT-05, CONT-06, CONT-07

**Success Criteria** (what must be TRUE):
  1. The compliance badge on the live site renders an expired/pending state for SD-02F immediately; once the successor directive is manually confirmed at TSA.gov, the correct successor designation appears site-wide by editing only compliance-refs.json — no lesson files touched
  2. A printable SME review checklist (docs/SME-REVIEW-CHECKLIST.md) covers every lesson, quiz, exercise, and scenario file across all five modules; each entry includes a human-fillable "last reviewed" and "reviewer" field
  3. Every module's lesson-to-control mapping carries a "last reviewed" date set by a human reviewer, not inferred from git commit timestamps
  4. Each of the five modules has at least two new lesson files visible in the sidebar and reachable via direct URL; every dual-use lesson includes an explicit "In OT environments:" callout block, and every lesson cites at least one TSA SD-02 series control and one NIST SP 800-82 chapter
  5. Each module has one new advanced branching scenario where the OT decision path leads to a meaningfully different outcome than the IT path; each module also has a new quiz file (02.json) containing at least three new questions with per-answer explanatory feedback

**Plan notes (constraints for plan author):**
- Day 1 task: add `"status": "expired"` and `"expiryDate": "2026-05-02"` to compliance-refs.json; update badge.js to render expired state — this must happen before any other work in this phase
- TSA successor version must be manually verified at TSA.gov before any successor string is applied — do not assume SD-02G
- New quiz questions must be in new files (02.json per module), never appended to existing 01.json files — the quiz engine tracks completion by stored total count; prior completers would see incomplete quiz cards for questions they never saw
- Every new lesson .md file requires a simultaneous update to src/modules-config.js — sidebar, getLessonNav(), and computeModuleProgress() all read from that file; a lesson file without a config entry is unreachable
- Run a text search across all public/data/ for hardcoded "SD-02F" strings in quiz/exercise/scenario JSON before marking SME-01 complete — logging-auditing/quizzes/01.json is confirmed to contain a hardcoded version string that bypasses compliance-refs.json
- CLAUDE.md references marked.js v17 but the installed version is 18.0.3 — update CLAUDE.md as housekeeping in this phase

**Plans**: 9 plans, 5 waves

Plans:

**Wave 0** (test scaffolding — RED before implementation)
- [ ] 09-01-PLAN.md — Wave 0: Author failing tests (badge-expired.test.js + extend compliance-refs/scenario-view/quiz-engine tests)

**Wave 1** *(blocked on Wave 0 completion)*
- [ ] 09-02-PLAN.md — Wave 1: Day 1 badge fix — compliance-refs.json expired status + badge.js expired branch + style.css tokens

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 09-03-PLAN.md — Wave 2: SME-01 hardcode audit — remediate SD-02F in quiz/scenario JSON + compliance-index-view.js + CLAUDE.md
- [ ] 09-04-PLAN.md — Wave 2: SME-02/03 — docs/SME-REVIEW-CHECKLIST.md + lastReviewed frontmatter on all 15 existing lessons

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 09-05-PLAN.md — Wave 3: logging-auditing content (2 lessons + quiz 02 + scenario 02 + modules-config)
- [ ] 09-06-PLAN.md — Wave 3: network-hardening content (2 lessons + quiz 02 + scenario 02 + modules-config)

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 09-07-PLAN.md — Wave 4: account-access content (2 lessons + quiz 02 + scenario 02 + modules-config)
- [ ] 09-08-PLAN.md — Wave 4: incident-response content (2 lessons + quiz 02 + scenario 02 + modules-config)

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 09-09-PLAN.md — Wave 5: patch-management content (2 lessons + quiz 02 + scenario 04 + modules-config final)

Cross-cutting constraints:
- No TSA successor string committed — expired state only until manual TSA.gov verification
- New quiz questions ONLY in 02.json files (never append to 01.json)
- Every new lesson .md requires simultaneous modules-config.js update in the same task

**UI hint**: yes

---

### Phase 10: Fork Configuration System

**Goal**: An IT admin at another pipeline company can deploy their own branded copy of the training platform by editing a single JSON config file, with no source code changes and no rebuild required

**Depends on**: Phase 9

**Requirements**: FORK-01, FORK-02, FORK-03

**Success Criteria** (what must be TRUE):
  1. A fork deployment guide (docs/FORK-GUIDE.md) exists with step-by-step instructions for forking the repo, editing fork.config.json, and deploying to GitHub Pages — written for IT admins, not developers
  2. Editing org name, logo path, and active modules in public/fork.config.json changes the sidebar header, home page branding, and visible module list on the next page load — no source file edits required
  3. The app starts and renders all five modules correctly when fork.config.json is missing or contains invalid JSON — no white screen, no uncaught JavaScript error
  4. An org that sets activeModules to a subset of five modules sees only those modules in the sidebar and home page; their completion percentage reaches 100% based on the active modules, not all five

**Plan notes (constraints for plan author):**
- fork.config.json must be fetched at runtime (fetch() on startup in main.js), not baked by Vite at build time — build-time env var approach requires orgs to install Node.js
- loadForkConfig() must return DEFAULT_FORK_CONFIG on any fetch failure (404, parse error, network error) — never null; a null return causes TypeErrors that the view renderer catch block silently swallows, producing a white screen
- loadForkConfig() must be the FIRST async call in main.js init(), before loadComplianceRefs() — fork config may override compliance refs
- activeModules filter applies at the render layer (sidebar, home cards) ONLY — computeModuleProgress() must always operate on the full module list; filtering there prevents a 2-module fork from ever reaching 100%
- Logo path must be prepended with import.meta.env.BASE_URL — root-relative paths break at the GitHub Pages subpath
- public/fork.config.json must exist in the repo before Phase 11 runs — Workbox precache manifest snapshots dist/ at build time; a missing file means offline users never receive it

**Plans**: 5 plans, 3 waves

Plans:

**Wave 1** (parallel — no dependencies)
- [ ] 10-01-PLAN.md — Wave 1: fork-config.js module + public/fork.config.json + public/OkieOps.png (FORK-02, FORK-03)
- [ ] 10-02-PLAN.md — Wave 1: docs/FORK-GUIDE.md IT admin deployment guide (FORK-01)

**Wave 2** *(blocked on Wave 1 / Plan 10-01)*
- [ ] 10-03-PLAN.md — Wave 2: main.js startup wiring + router.js inactive-module guard (FORK-03)
- [ ] 10-04-PLAN.md — Wave 2: sidebar.js + home-view.js + completion-summary-view.js render filter (FORK-03)

**Wave 3** *(blocked on Wave 2)*
- [ ] 10-05-PLAN.md — Wave 3: tests/fork-config.test.js — full test coverage (FORK-02, FORK-03)

---

### Phase 11: PWA / Offline Support

**Goal**: A learner who has visited the site once can complete any lesson, quiz, exercise, or scenario without a network connection — including forks deployed on air-gapped OT networks

**Depends on**: Phase 10 (fork.config.json must exist); Phase 9 (all content files must be finalized before Workbox precache manifest is built)

**Requirements**: PWA-01, PWA-02, PWA-03

**Success Criteria** (what must be TRUE):
  1. After one online visit, setting Chrome DevTools Network to Offline and navigating to any lesson, quiz, exercise, or scenario produces readable content — no blank screen, no fetch error visible to the user
  2. compliance-refs.json and fork.config.json are available offline after first load — the compliance badge and fork branding render correctly without a network connection
  3. A persistent online/offline status indicator is always visible in the UI; it transitions in real time when the network state changes and does not rely solely on navigator.onLine

**Plan notes (constraints for plan author):**
- Workbox globPatterns must explicitly include md and json — the default covers only js, css, html; without this, lesson content renders blank offline with no visible error (fetchLesson() has a silent catch block)
- scope and start_url in the VitePWA manifest config must be explicitly set to /pipeline-cyber-training/ — plugin defaults resolve incorrectly for a GitHub Pages subpath deployment and cause a DOMException on service worker registration
- Use registerType: autoUpdate with skipWaiting: true and clientsClaim: true — required for users who keep the site open in a background tab to receive content updates without closing all tabs
- Phase 9 and Phase 10 must be fully merged before the PWA build runs — content or config files added after Workbox generates its manifest are invisible to the service worker until the next build
- Check .github/workflows/ to confirm whether GitHub Actions auto-deploys on push to main; if not, document the manual build requirement — editing compliance-refs.json in the GitHub web editor without triggering CI leaves offline users on the expired version
- PWA icon assets (pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png) must exist in public/ before build; create from the existing color scheme (#111827 background) if absent

**Plans**: TBD

**UI hint**: yes

---

### Phase 12: Progress Sync

**Goal**: A learner can carry their completion state from one device to another by sharing a single URL or scanning a QR code — no account, no server, no credentials required

**Depends on**: Phase 9 (progress store API stable; no dependency on Phase 10 or Phase 11 — can run in parallel with Phase 11)

**Requirements**: SYNC-01, SYNC-02

**Success Criteria** (what must be TRUE):
  1. An ADR (docs/ADR-001-sync-approach.md) documents URL share with lz-string compression as the chosen approach, explicitly rejects GitHub Gist (PAT-in-localStorage is credential exposure) and Supabase (free-tier pause incompatible with episodic training), and is committed before any sync implementation code is written
  2. A learner can click a share button in the progress footer to copy a URL that encodes their full progress state; opening that URL on a second device imports their progress automatically on page load
  3. A QR code version of the share URL is available so a learner can transfer progress across devices by scanning, without copy-paste
  4. Importing progress on a device that already has completion data merges the two states — union of completed lessons, higher quiz score wins — and never overwrites a completed lesson with an incomplete state

**Plan notes (constraints for plan author):**
- SYNC-01 ADR must be written and merged before any SYNC-02 code is written — this is an architectural gate
- Existing JSON export (DATA-05) remains as the always-available fallback; the share URL is additive
- No schemaVersion bump required — URL share encodes existing schema v1 JSON without new store fields
- npm install lz-string qrcode (runtime, not dev); add to package.json before authoring sync module code
- Hash /import?data= detection added to router.js initial load check — import must be processed before the first view renders, not after
- No credentials stored in localStorage or hardcoded in the repo at any point

**Plans**: TBD

---

## Progress Table

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. App Shell + Build Pipeline + Deploy | v1.0 | 4/4 | Complete | 2026-05-11 |
| 2. Content Loader + Lesson Rendering + Module 1 | v1.0 | 4/4 | Complete | 2026-05-14 |
| 3. Progress Store | v1.0 | 3/3 | Complete | 2026-05-14 |
| 4. Quiz Engine + Lesson Progress UI | v1.0 | 3/3 | Complete | 2026-05-15 |
| 5. Simulated PowerShell Terminal + Exercise View | v1.0 | 4/4 | Complete | 2026-05-15 |
| 6. Scenario Engine + Compliance Index + Completion Summary | v1.0 | 4/4 | Complete | 2026-05-16 |
| 7. Core Module Content (MOD-02, MOD-03, MOD-04) | v1.0 | 4/4 | Complete | 2026-05-16 |
| 8. Patch Management Module (MOD-05) | v1.0 | 4/4 | Complete | 2026-05-17 |
| 9. Compliance Currency + Content Depth | v2.0 | 9/9 | Complete | 2026-05-18 |
| 10. Fork Configuration System | v2.0 | 0/5 | Planned | - |
| 11. PWA / Offline Support | v2.0 | 0/TBD | Not started | - |
| 12. Progress Sync | v2.0 | 0/TBD | Not started | - |

---

*Roadmap created: 2026-05-10*
*v1.0 milestone archived: 2026-05-17 — 26/26 requirements shipped*
*Phase 9 complete: 2026-05-18 — 9/9 plans, 177 tests GREEN*
*Phase 10 planned: 2026-05-18 — 5 plans across 3 waves*
*v2.0 roadmap added: 2026-05-17 — 14/14 requirements mapped across Phases 9–12*
*Phase 9 planned: 2026-05-17 — 9 plans across 5 waves*
*Phase 10 planned: 2026-05-18 — 5 plans across 3 waves*
