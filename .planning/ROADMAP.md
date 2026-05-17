# Roadmap — Pipeline Cyber Training

## Project

**Mode:** mvp
**Granularity:** fine
**Coverage:** 26/26 requirements mapped

---

## Phases

- [x] **Phase 1: App Shell + Build Pipeline + Deploy** - Navigable static site with hash routing, Vite build, and live GitHub Pages deployment
- [x] **Phase 2: Content Loader + Lesson Rendering + Module 1** - Markdown fetch pipeline, syntax-highlighted code blocks, and first complete module authored
- [x] **Phase 3: Progress Store** - localStorage persistence with schema versioning, quota handling, and data export
- [x] **Phase 4: Quiz Engine + Lesson Progress UI** - Multiple-choice quizzes with per-answer feedback, scoring, and module-level progress bars (completed 2026-05-15)
- [x] **Phase 5: Simulated PowerShell Terminal + Exercise View** - Whitelist-only PS terminal engine with multi-step exercise validation and hint system (completed 2026-05-15)
- [x] **Phase 6: Scenario Engine + Compliance Index + Completion Summary** - Branching scenario exercises, compliance control index page, and printable training log (completed 2026-05-16)
- [x] **Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04)** - Network Hardening, Account & Access Management, and Incident Response modules fully populated with OT/IT distinctions (completed 2026-05-16)
- [ ] **Phase 8: Patch Management Module (MOD-05)** - Full Patch Management module with separate IT and OT/ICS sub-sections, compliance reporting exercises

---

## Phase Details

### Phase 1: App Shell + Build Pipeline + Deploy
**Goal:** A navigable, deployed static site skeleton exists that all subsequent work mounts into
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** SHELL-01, SHELL-02, DATA-01
**Success Criteria** (what must be TRUE):
  1. Visiting the GitHub Pages URL renders the app — no 404, no blank screen, no Jekyll interference
  2. Navigating between all five module placeholders via sidebar or top nav changes the URL hash and renders the corresponding empty view without a full page reload
  3. Each module and lesson placeholder has a unique hash URL (e.g. `#/module/logging-auditing`) that is bookmarkable and returns the same view on reload
  4. `data/compliance-refs.json` exists in the repo with the current TSA directive version string (SD-02F) as the canonical reference — no version string is hardcoded anywhere else
  5. Running `vite build` locally produces a deployable `dist/` that GitHub Actions deploys automatically on push to main; `.nojekyll` is present
**Plans:** 4 plans
Plans:
- [x] 01-01-PLAN.md — Node upgrade + Vite scaffold + design tokens + compliance data + Vitest test stubs (Wave 0)
- [x] 01-02-PLAN.md — Hash router + app entry point + index.html shell + sidebar JS (Wave 1)
- [x] 01-03-PLAN.md — Home view + module placeholder view + not-found view (Wave 2)
- [x] 01-04-PLAN.md — GitHub Actions deploy workflow + live URL verification (Wave 3)
**UI hint:** yes

### Phase 2: Content Loader + Lesson Rendering + Module 1
**Goal:** Real lesson content is fetched, rendered with syntax highlighting, and readable — the content authoring contract is locked for all five modules
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** CONT-01, CONT-02, CONT-03, CONT-04, MOD-01
**Success Criteria** (what must be TRUE):
  1. Navigating to any Logging & Auditing lesson fetches and renders its Markdown body in-browser without a rebuild step
  2. PowerShell code blocks in lessons display with full PS 5.1 syntax highlighting (keywords, strings, cmdlets visually distinct) using Shiki
  3. Every code block has a working one-click copy-to-clipboard button; copied text matches the raw code exactly
  4. Each lesson displays its TSA SD-02F and/or NIST SP 800-82 Rev 3 control IDs sourced from `compliance-refs.json`, not hardcoded in Markdown prose
  5. Module 1 (Logging & Auditing) is complete: all core lessons authored, at least one quiz placeholder, one terminal exercise placeholder, one scenario placeholder; all map to correct compliance control IDs
**Plans:** 4 plans
Plans:
**Wave 0**
- [x] 02-01-PLAN.md — npm packages + Lucide CDN removal + Phase 2 CSS tokens + Wave 0 test stubs (Wave 0)
**Wave 1** *(blocked on Wave 0 completion)*
- [x] 02-02-PLAN.md — content-loader.js + lesson-view.js stub + router/sidebar/main.js wiring (Wave 1)
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 02-03-PLAN.md — full lesson view: compliance bar + loading skeleton + prev/next footer + clipboard handler (Wave 2)
**Wave 3** *(blocked on Wave 2 completion)*
- [x] 02-04-PLAN.md — Module 1 content: 3 lesson .md files + quiz/exercise/scenario placeholders (Wave 3)

Cross-cutting constraints:
- `esc()` from `src/utils/escape.js` applied to all frontmatter values inserted into innerHTML (T1 — all plans)
- `import.meta.env.BASE_URL` prefix on all `public/data/` fetches (all plans with fetch calls)
- No hardcoded TSA version strings in lesson prose — all sourced from `compliance-refs.json` (02-04)
**UI hint:** yes

### Phase 3: Progress Store
**Goal:** Learner progress persists reliably across sessions; data loss scenarios are handled gracefully and the learner has a data escape hatch
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** ASSESS-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. Closing and reopening the browser tab returns a learner to the exact lesson and step they were on, without any action on their part
  2. The localStorage schema contains a `schemaVersion` key from the first write; the app reads this on load and handles version mismatches without corrupting data
  3. Attempting to write progress when localStorage is full (or in a private browsing context) shows a visible warning rather than silently failing or throwing an uncaught exception
  4. Clicking "Export my progress" downloads a valid JSON file containing all stored progress data that could be re-imported in a future version
**Plans:** 3 plans
Plans:
**Wave 1**
- [x] 03-01-PLAN.md — progress-store.js core module + full Vitest test suite (Wave 1)
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 03-02-PLAN.md — main.js + router.js wiring: progressStore.init() sequential + lastVisited auto-resume (Wave 2)
- [x] 03-03-PLAN.md — sidebar.js footer: export/import controls + lesson-view.js: markVisited + storage warning (Wave 2, parallel with 03-02)

### Phase 4: Quiz Engine + Lesson Progress UI
**Goal:** Learners can test their knowledge after each lesson, receive explanatory feedback, and see their overall progress at a glance
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** ASSESS-01, SHELL-03
**Success Criteria** (what must be TRUE):
  1. Submitting a quiz answer immediately shows that answer's specific explanatory text — not just correct/incorrect — regardless of whether the answer was right or wrong
  2. A completed quiz score is saved to the Progress Store and displayed the next time the learner visits that lesson ("You scored 3/4 on your last attempt")
  3. The sidebar and module overview page show visual progress bars reflecting the percentage of lessons and quizzes completed for each module
  4. A learner who has completed all content in a module sees that module marked as complete in the navigation
**Plans:** 3/3 plans complete
Plans:
**Wave 0**
- [x] 04-01-PLAN.md — icons.js + modules-config.js + audit-policies.md + quiz JSON cleanup + RED test scaffolds (Wave 0)
**Wave 1** *(blocked on Wave 0 completion)*
- [x] 04-02-PLAN.md — quiz-engine.js full implementation + lesson-view.js wiring (Wave 1)
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04-03-PLAN.md — sidebar.js progress bars + refreshSidebarProgress + module-view.js lesson status list (Wave 2)

Cross-cutting constraints:
- `esc()` from `src/utils/escape.js` applied to all quiz text (stem, answers, feedback, explanation) before innerHTML insertion (all plans)
- `import.meta.env.BASE_URL` prefix on quiz JSON fetch (04-02)
- All localStorage access exclusively through `progressStore` — no direct localStorage calls (all plans)
**UI hint:** yes

### Phase 5: Simulated PowerShell Terminal + Exercise View
**Goal:** Learners can practice PowerShell commands against realistic exercise prompts with meaningful feedback — the terminal scope contract and exercise JSON schema are finalized for all module authors
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** TERM-01, TERM-02, TERM-03, TERM-04
**Success Criteria** (what must be TRUE):
  1. Typing the correct command for an exercise step advances the learner to the next step with realistic-looking PS output (real-format timestamps, plausible hostnames, real error message structure) — not placeholder text
  2. Typing a plausible near-miss command (wrong parameter name, abbreviated cmdlet, common alias) returns a contextual hint that names what was wrong rather than a generic failure message
  3. Typing an unrecognized command returns a helpful error; the terminal never throws an uncaught JS exception regardless of input
  4. The terminal UI displays a persistent visible label identifying it as a simulator (e.g. "PS SIMULATOR — commands do not run on any real system") at all times during an exercise
  5. Completing all steps of a terminal exercise records completion to the Progress Store; re-opening the exercise shows the learner's prior completion state
**Plans:** 4 plans
Plans:
**Wave 0**
- [x] 05-01-PLAN.md — RED test stubs (terminal-engine + exercise-view) + 01.json upgrade to 3-step schema + modules-config exerciseId field + router/quiz-engine test additions (Wave 0) ✓ 2026-05-15
**Wave 1** *(blocked on Wave 0 completion)*
- [x] 05-02-PLAN.md — src/terminal-engine.js createTerminal factory: DOM construction, Enter/history key handler, appendOutput, disable, setPrompt, focus API (Wave 1) ✓ 2026-05-15
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 05-03-PLAN.md — src/views/exercise-view.js renderExercise + src/router.js exercise route: full step progression, hint display, completion flow, re-visit state (Wave 2) ✓ 2026-05-15
**Wave 3** *(blocked on Wave 2 completion)*
- [x] 05-04-PLAN.md — module-view exercise link buttons + computeModuleProgress exerciseId branch + style.css cursor blink keyframe + human verify checkpoint (Wave 3) ✓ 2026-05-15

Cross-cutting constraints:
- `esc()` applied to all exercise JSON strings (title, description, context, instruction, hint, feedbackOnWrong) before innerHTML insertion (all plans)
- `textContent` used for terminal output lines — never innerHTML (RESEARCH.md Pitfall 1)
- `import.meta.env.BASE_URL` prefix on exercise JSON fetch (05-03)
- All localStorage access through `progressStore` — no direct localStorage calls (all plans)
- Dynamic import of sidebar.js in completeExercise() — no static import (circular dep prevention)
**UI hint:** yes

### Phase 6: Scenario Engine + Compliance Index + Completion Summary
**Goal:** Learners can work through decision-based compliance scenarios, look up which content covers a given control ID, and generate a printable training artifact
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** ASSESS-02, SHELL-04, ASSESS-04
**Success Criteria** (what must be TRUE):
  1. A scenario exercise presents a realistic compliance incident with at least two decision branches; choosing a path shows the consequence and explanation for that decision before advancing
  2. Completing all branches of a scenario records completion and outcome data to the Progress Store
  3. The compliance index page lists every TSA SD-02F and NIST SP 800-82 Rev 3 control ID covered by the platform, with links to every lesson and exercise tagged to each control
  4. A learner who has completed at least one module can open a printable completion summary that displays their name (self-entered), module name, date, quiz scores, and control IDs covered; the UI explicitly labels it a "training log artifact" not a compliance certification
**Plans:** 4 plans
Plans:
**Wave 0**
- [x] 06-01-PLAN.md — RED test stubs (scenario-view, compliance-index-view, completion-summary-view) + 01.json full scenario + compliance-index.json manifest (Wave 0)
**Wave 1** *(blocked on Wave 0 completion)*
- [x] 06-02-PLAN.md — src/views/scenario-view.js: renderScenario async renderer, decision-tree flow, completion saving (Wave 1)
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 06-03-PLAN.md — src/views/compliance-index-view.js + router.js 3 new routes + modules-config.js scenarioId + module-view.js scenario links + quiz-engine.js scenarioId branch (Wave 2)
**Wave 3** *(blocked on Wave 2 completion)*
- [x] 06-04-PLAN.md — src/views/completion-summary-view.js + style.css @media print + human verify checkpoint (Wave 3)

Cross-cutting constraints:
- `esc()` applied to all scenario JSON strings (title, narrative, phase.title, phase.prompt, option.text, option.outcome) before innerHTML insertion (all plans)
- `safePath()` applied to moduleId and scenarioId URL segments before fetch URL construction (06-02)
- `safePath()` applied to item.moduleId and item.contentId before compliance index href construction (06-03)
- `import.meta.env.BASE_URL` prefix on all fetch calls (06-02, 06-03)
- All localStorage access through `progressStore` — no direct localStorage calls (all plans)
- Dynamic import of sidebar.js in completeScenario() — no static import (circular dep prevention) (06-02)
- Learner name in completion summary stored in JS variable only — not persisted to localStorage (06-04)
**UI hint:** yes

### Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04)
**Goal:** Network Hardening, Account & Access Management, and Incident Response modules are fully populated with lessons, quizzes, terminal exercises, and scenarios — OT/IT distinctions are explicit throughout
**Mode:** mvp
**Depends on:** Phase 6
**Requirements:** MOD-02, MOD-03, MOD-04, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Each of the three modules (Network Hardening, Account & Access Management, Incident Response) contains at least the required content: core lessons, one quiz, one terminal exercise, one scenario; all map to correct TSA and NIST control IDs sourced from `compliance-refs.json`
  2. Every lesson or exercise applicable to both IT and OT environments contains an explicit "In OT environments:" callout block — no lesson silently applies IT assumptions to OT contexts
  3. Every NERC CIP reference in all three modules includes an explicit scope callout ("NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark")
  4. All environment identifiers in commands and scenarios are generic (e.g. PIPELINE-DC01, 10.0.0.0/24, ExampleCorp) — no company-specific values hardcoded
  5. NERC CIP content in all modules is framed explicitly as a reference benchmark, not a binding pipeline requirement, consistent with DATA-02
**Plans:** 4 plans
Plans:
**Wave 1**
- [x] 07-01-PLAN.md — MOD-02 Network Hardening: 3 lessons + quiz + exercise + scenario (Wave 1)
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 07-02-PLAN.md — MOD-03 Account & Access Management: 3 lessons + quiz + exercise + scenario (Wave 2)
**Wave 3** *(blocked on Wave 2 completion)*
- [x] 07-03-PLAN.md — MOD-04 Incident Response: 3 lessons + quiz + exercise + scenario (Wave 3)
**Wave 4** *(blocked on Wave 3 completion)*
- [x] 07-04-PLAN.md — Integration: modules-config.js 3-lesson arrays + compliance-index.json 9 new control entries (Wave 4)

Cross-cutting constraints:
- All lessons contain `> [!OT]` callout block (DATA-03)
- NERC CIP references use verbatim disclaimer (DATA-02)
- scenarioId and exerciseId in modules-config.js only — never in .md frontmatter
- quizId: '01' only in Lesson 3 frontmatter of each module
- All identifiers generic: PIPELINE-DC01, 10.0.0.0/24, ExampleCorp, svc-historian

### Phase 8: Patch Management Module (MOD-05)
**Goal:** The Patch Management module is complete with separate, clearly distinguished IT and OT/ICS patching sub-sections — the platform's most OT-specific content is accurate and auditable
**Mode:** mvp
**Depends on:** Phase 7
**Requirements:** MOD-05
**Success Criteria** (what must be TRUE):
  1. The module contains two clearly separated sub-sections with distinct lesson IDs: Windows/IT patching (WSUS, PSWindowsUpdate) and OT/ICS patching (air-gapped workflows, vendor coordination, risk-based deferral)
  2. The OT/ICS patching sub-section explicitly addresses: offline media staging, OEM patch qualification requirements, 3–12 month vendor approval cycles, and compensating controls documentation — not IT cadences applied to OT
  3. A terminal exercise covering compliance reporting (generating patch status evidence for audits) is present and functional — the output is plausible-format patch compliance report text
  4. All three Patch Management sub-areas (Windows/IT patching, OT/ICS patching, compliance reporting) have at least one quiz question with per-answer explanatory feedback and one compliance control ID tag each
**Plans:** 4 plans
Plans:
**Wave 1**
- [x] 08-01-PLAN.md — 3 lesson Markdown files (wsus-patching, ot-patching, patch-policy) (Wave 1) ✓ 2026-05-17
**Wave 2** *(blocked on Wave 1 completion)*
- [x] 08-02-PLAN.md — Quiz (3 questions across all sub-areas) + Exercise (4-step compliance reporting) (Wave 2) ✓ 2026-05-17
- [x] 08-03-PLAN.md — 3 scenario JSON files (01: Critical CVE, 02: Maintenance Window, 03: TSA Audit) (Wave 2, parallel with 08-02) ✓ 2026-05-17
**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 08-04-PLAN.md — Config integration: modules-config.js 3-lesson update + 3 new compliance controls (Wave 3)

Cross-cutting constraints:
- OT callout `> [!OT]` required in every lesson (DATA-03)
- NERC CIP verbatim disclaimer when CIP mentioned (DATA-02)
- scenarioId/exerciseId/quizId in modules-config.js only — never in .md frontmatter
- No TSA version strings hardcoded in lesson prose — reference compliance-refs.json (DATA-01)
- All identifiers generic: PIPELINE-HIST01, PIPELINE-DC01, 10.0.0.0/24, ExampleCorp

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell + Build Pipeline + Deploy | 4/4 | ✓ Complete | 2026-05-11 |
| 2. Content Loader + Lesson Rendering + Module 1 | 4/4 | ✓ Complete | 2026-05-14 |
| 3. Progress Store | 3/3 | ✓ Complete | 2026-05-14 |
| 4. Quiz Engine + Lesson Progress UI | 3/3 | ✓ Complete | 2026-05-15 |
| 5. Simulated PowerShell Terminal + Exercise View | 4/4 | ✓ Complete | 2026-05-15 |
| 6. Scenario Engine + Compliance Index + Completion Summary | 4/4 | ✓ Complete | 2026-05-16 |
| 7. Core Module Content (MOD-02, MOD-03, MOD-04) | 4/4 | ✓ Complete | 2026-05-16 |
| 8. Patch Management Module (MOD-05) | 0/4 | In progress | - |

---

*Roadmap created: 2026-05-10*
*Mode: mvp | Granularity: fine | Coverage: 26/26*
*Phase 1 planned: 2026-05-11 — 4 plans, 4 waves*
*Phase 2 planned: 2026-05-11 — 4 plans, 4 waves*
*Phase 3 planned: 2026-05-14 — 3 plans, 2 waves*
*Phase 4 planned: 2026-05-14 — 3 plans, 3 waves*
*Phase 5 planned: 2026-05-15 — 4 plans, 4 waves*
*Phase 6 planned: 2026-05-15 — 4 plans, 4 waves*
*Phase 7 planned: 2026-05-16 — 4 plans, 4 waves*
*Phase 8 planned: 2026-05-17 — 4 plans, 3 waves*
