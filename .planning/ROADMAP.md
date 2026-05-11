# Roadmap — Pipeline Cyber Training

## Project

**Mode:** mvp
**Granularity:** fine
**Coverage:** 26/26 requirements mapped

---

## Phases

- [x] **Phase 1: App Shell + Build Pipeline + Deploy** - Navigable static site with hash routing, Vite build, and live GitHub Pages deployment
- [ ] **Phase 2: Content Loader + Lesson Rendering + Module 1** - Markdown fetch pipeline, syntax-highlighted code blocks, and first complete module authored
- [ ] **Phase 3: Progress Store** - localStorage persistence with schema versioning, quota handling, and data export
- [ ] **Phase 4: Quiz Engine + Lesson Progress UI** - Multiple-choice quizzes with per-answer feedback, scoring, and module-level progress bars
- [ ] **Phase 5: Simulated PowerShell Terminal + Exercise View** - Whitelist-only PS terminal engine with multi-step exercise validation and hint system
- [ ] **Phase 6: Scenario Engine + Compliance Index + Completion Summary** - Branching scenario exercises, compliance control index page, and printable training log
- [ ] **Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04)** - Network Hardening, Account & Access Management, and Incident Response modules fully populated with OT/IT distinctions
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
**Plans:** TBD
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
**Plans:** TBD

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
**Plans:** TBD
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
**Plans:** TBD
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
**Plans:** TBD
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
**Plans:** TBD

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
**Plans:** TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell + Build Pipeline + Deploy | 4/4 | ✓ Complete | 2026-05-11 |
| 2. Content Loader + Lesson Rendering + Module 1 | 0/? | Not started | - |
| 3. Progress Store | 0/? | Not started | - |
| 4. Quiz Engine + Lesson Progress UI | 0/? | Not started | - |
| 5. Simulated PowerShell Terminal + Exercise View | 0/? | Not started | - |
| 6. Scenario Engine + Compliance Index + Completion Summary | 0/? | Not started | - |
| 7. Core Module Content (MOD-02, MOD-03, MOD-04) | 0/? | Not started | - |
| 8. Patch Management Module (MOD-05) | 0/? | Not started | - |

---

*Roadmap created: 2026-05-10*
*Mode: mvp | Granularity: fine | Coverage: 26/26*
*Phase 1 planned: 2026-05-11 — 4 plans, 4 waves*
