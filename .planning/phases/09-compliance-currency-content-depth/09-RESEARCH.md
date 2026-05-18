# Phase 9: Compliance Currency + Content Depth — Research

**Researched:** 2026-05-17
**Domain:** Static SPA content authoring, compliance data model, quiz/scenario JSON schemas, JS view wiring
**Confidence:** HIGH (all findings verified against live codebase)

---

## Summary

Phase 9 is primarily a content authoring phase with one targeted UI change (the compliance badge expired state). The platform's architecture is well-understood from v1.0 — the work is adding JSON and Markdown files that follow strict existing schemas, updating two JavaScript files (badge.js, modules-config.js), and creating a Markdown SME artifact (docs/SME-REVIEW-CHECKLIST.md).

The single highest-risk area is the compliance badge on Day 1: compliance-refs.json currently has no `"status"` field on the TSA directive entry, and badge.js has no expired-state branch. Both must be authored together atomically before any other phase work proceeds. The SD-02F version string has been confirmed hardcoded in two public/data JSON files that bypass compliance-refs.json — these must be audited and remediated as part of SME-01.

The quiz engine loads files by explicit ID passed from modules-config.js — it does NOT scan for all numbered files. Adding a 02.json quiz file is invisible to the engine until a lesson entry in modules-config.js references `quizId: '02'`, and the lesson's `.md` frontmatter also carries `quizId: '02'`. The same registry constraint applies to new scenarios (scenarioId) and new lessons (lesson entries in the MODULES array).

**Primary recommendation:** Author all new content files following the exact schemas documented below, and update modules-config.js in the same commit as each new lesson/quiz/scenario file to guarantee reachability.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Compliance badge expired state | Browser / Client | — | badge.js is a JS module executed in the browser; reads from in-memory `_complianceRefs` already fetched by main.js |
| Compliance refs data | Static file (CDN) | Browser / Client | compliance-refs.json is a static JSON file fetched once at startup into browser memory |
| New lesson content | Static file (CDN) | Browser / Client | .md files served as static assets; fetched by content-loader.js on navigation |
| New quiz questions | Static file (CDN) | Browser / Client | .json files fetched by quiz-engine.js on lesson load |
| New scenarios | Static file (CDN) | Browser / Client | .json files fetched by scenario-view.js on navigation |
| Lesson registration | Browser / Client | — | modules-config.js is a static JS module imported at bundle time; controls sidebar, nav, and progress |
| SME review checklist | Documentation (no runtime) | — | Markdown doc in docs/ — not served by the app; human-facing artifact |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SME-01 | TSA SD-02F successor researched; compliance-refs.json updated with current version strings (SD-02F expired May 2, 2026) | compliance-refs.json data model documented; badge.js implementation contract from UI-SPEC; hardcoded SD-02F audit completed |
| SME-02 | Structured SME review checklist document (docs/SME-REVIEW-CHECKLIST.md) covering every lesson, quiz, exercise, and scenario with human-fillable "last reviewed" and "reviewer" fields | Full content inventory compiled — all 15 lesson files, 5 quiz files, 5 exercise files, 8 scenario files enumerated |
| SME-03 | Each module's lesson-to-control mapping verified and annotated with "last reviewed" metadata | Lesson frontmatter structure documented; "last reviewed" field pattern designed |
| CONT-05 | Each of the 5 modules gets ≥2 new lessons covering advanced controls and OT-specific edge cases | modules-config.js MODULES array structure documented; lesson registration pattern documented; lesson .md frontmatter schema documented |
| CONT-06 | Each module gets one additional advanced branching scenario with multi-path OT-specific decision outcomes | scenario JSON schema verified from live files; scenario-view.js rendering contract documented |
| CONT-07 | Quiz question banks expanded: ≥3 new questions added per module in new 02.json files | Quiz JSON schema verified; quiz-engine.js ID resolution mechanism documented; completion-count integrity constraint documented |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- NERC CIP does NOT apply to pipeline operators — must be framed as reference benchmark only with explicit disclaimer
- TSA directive version strings must always come from `public/data/compliance-refs.json` — never hardcoded in lesson/quiz/scenario content
- No backend, no real PowerShell execution — static GitHub Pages only
- PS version target: 5.1
- Every OT-relevant lesson requires an explicit `> [!OT]` callout block
- All environment identifiers must be generic: `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp`
- NERC CIP references require the standard disclaimer: "NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark"
- Build: Vite; CSS: Tailwind v4; Markdown: marked.js (installed: v18.0.3, not v17 as CLAUDE.md states — update CLAUDE.md in this phase) [VERIFIED: package.json `"marked": "^18.0.3"`]
- Routing: hash-based — lessons at `#/lesson/:moduleId/:lessonId`, scenarios at `#/scenario/:moduleId/:scenarioId`

---

## Standard Stack

### Core (no new dependencies required)
| Library | Installed Version | Purpose | Notes |
|---------|------------------|---------|-------|
| Vite | 8.0.12 | Build tool | No change |
| marked.js | 18.0.3 | Markdown rendering | CLAUDE.md says v17 — update CLAUDE.md |
| Shiki | 4.0.2 | PowerShell syntax highlighting | No change |
| Tailwind v4 | 4.3.0 | CSS | No change |
| Vitest | 4.1.6 | Test runner | happy-dom environment |

[VERIFIED: package.json]

**No new npm dependencies required for Phase 9.** All work is content files, minor JS edits, and one Markdown doc.

---

## Hardcoded SD-02F Audit

**Confirmed SD-02F hardcoded strings that bypass compliance-refs.json:**

| File | Type | Location | Action Required |
|------|------|----------|-----------------|
| `public/data/compliance-refs.json` | Data | Line 7 — the canonical source; `"shortName": "TSA SD-02F"` | Update with `"status": "expired"` and `"expiryDate"` fields |
| `public/data/modules/logging-auditing/quizzes/01.json` | Quiz | q-03 stem, answer feedback (×4), and explanation — all read "TSA SD-02F" | Replace with neutral "current TSA pipeline security directive" phrasing; do NOT use a specific version number in content files |
| `public/data/modules/logging-auditing/scenarios/01.json` | Scenario | phase-2, opt-a outcome and opt-b outcome — both read "TSA SD-02F" | Replace with "current TSA pipeline security directive" |
| `src/views/compliance-index-view.js` | Source JS | Line 123 — static string "Every TSA SD-02F and NIST SP 800-82 Rev 3 control..." | Replace with generic "TSA pipeline security directive" or fetch from compliance-refs.json shortName |

[VERIFIED: grep across all public/data/ JSON files and src/ JS files]

**No hardcoded SD-02F found in:**
- Any lesson .md files (confirmed: lesson content references "TSA pipeline security directive" generically)
- Any exercise .json files
- Any scenario .json files beyond the two already listed
- Any other quiz .json files

---

## Content Inventory (Current State)

### Existing lessons per module (3 each = 15 total)
[VERIFIED: filesystem ls]

| Module | Lesson Files | quizId assigned | exerciseId assigned | scenarioId assigned |
|--------|-------------|-----------------|--------------------|--------------------|
| logging-auditing | intro.md, ps-logging.md, audit-policies.md | audit-policies: '01' | ps-logging: '01' | intro: '01' |
| network-hardening | intro.md, ps-firewall.md, firewall-policy.md | firewall-policy: '01' | ps-firewall: '01' | intro: '01' |
| account-access | intro.md, ps-ad.md, access-policy.md | access-policy: '01' | ps-ad: '01' | intro: '01' |
| incident-response | intro.md, ps-ir.md, ir-procedures.md | ir-procedures: '01' | ps-ir: '01' | intro: '01' |
| patch-management | wsus-patching.md, ot-patching.md, patch-policy.md | patch-policy: '01' | ot-patching: '01' | wsus-patching: '01', ot-patching: '02', patch-policy: '03' |

### Existing quiz files (1 per module = 5 total)
All modules: `quizzes/01.json` [VERIFIED: filesystem ls]

### Existing exercise files (1 per module = 5 total)
All modules: `exercises/01.json` [VERIFIED: filesystem ls]

### Existing scenario files
| Module | Scenarios |
|--------|-----------|
| logging-auditing | 01.json |
| network-hardening | 01.json |
| account-access | 01.json |
| incident-response | 01.json |
| patch-management | 01.json, 02.json, 03.json |

[VERIFIED: filesystem ls]

### What Phase 9 adds
- 10 new lesson .md files (2 per module)
- 5 new quiz files: `quizzes/02.json` per module (≥3 questions each)
- 5 new scenario files: next available scenarioId per module (see table below)
- New scenario IDs to use:
  - logging-auditing: `02`
  - network-hardening: `02`
  - account-access: `02`
  - incident-response: `02`
  - patch-management: `04`

---

## Architecture Patterns

### System Architecture Diagram

```
User navigates to lesson URL (#/lesson/:moduleId/:lessonId)
  │
  ▼
router.js extracts moduleId + lessonId from hash
  │
  ▼
renderLesson() in lesson-view.js
  │ reads lesson entry from MODULES (modules-config.js)
  │ → if lesson not in MODULES: renders "not found" immediately
  │
  ├── fetchLesson(moduleId, lessonId) → GET /data/modules/{mod}/lessons/{id}.md
  │     → 404 if file missing: renders error
  │
  ├── parseFrontmatter() extracts meta (title, complianceTags, quizId, etc.)
  │
  ├── renderMarkdown() → Shiki highlight + marked.js parse
  │     → [!OT] blockquote → <aside class="ot-callout">
  │
  ├── getLessonNav(moduleId, lessonId) → reads MODULES for prev/next
  │
  └── if meta.quizId → renderQuiz(moduleId, meta.quizId, lessonColumn, lessonId)
        │
        └── GET /data/modules/{mod}/quizzes/{quizId}.json
              → loads quiz questions
              → getQuizScore(moduleId, quizId) → revisit vs. first-visit mode
              → saveQuiz() on completion → saves to progress-store.js

User navigates to scenario URL (#/scenario/:moduleId/:scenarioId)
  │
  ▼
renderScenario() in scenario-view.js
  │
  └── GET /data/modules/{mod}/scenarios/{scenarioId}.json
        → validateScenario() checks all nextPhaseId refs resolve
        → runScenarioFlow() wires click handlers
        → saveScenario() on completeScenario()
```

### Recommended Content Structure (new files for Phase 9)

```
public/data/modules/
  {module}/
    lessons/
      {new-lesson-a}.md      ← new (+ simultaneous modules-config.js update)
      {new-lesson-b}.md      ← new (+ simultaneous modules-config.js update)
    quizzes/
      02.json                ← new (+ lesson entry with quizId: '02' in modules-config.js)
    scenarios/
      02.json (or 04.json)   ← new (+ lesson entry with scenarioId in modules-config.js)

src/
  modules-config.js          ← modified: 2 new lesson entries per module (10 total)
  badge.js                   ← modified: expired state branch
  style.css                  ← modified: 2 new CSS custom properties

public/data/
  compliance-refs.json       ← modified: add "status": "expired", "expiryDate" to TSA entry

docs/
  SME-REVIEW-CHECKLIST.md    ← new (not served by the app; human-facing)
```

### Pattern 1: Lesson .md Frontmatter Schema

Every lesson file begins with YAML frontmatter. New lessons must follow this exact schema:

```markdown
---
title: {Human-readable lesson title}
lessonId: {matches the id field in MODULES lessons array}
moduleId: {matches the module id in MODULES}
order: {integer, sequential within module}
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12]
lastReviewed: ''
reviewer: ''
---
```

[VERIFIED: live lesson files — intro.md, audit-policies.md, ps-logging.md]

Notes:
- `quizId` is only in frontmatter if this lesson has a quiz (e.g., `quizId: '02'` for a lesson backed by quizzes/02.json)
- The `lastReviewed` and `reviewer` fields are new for Phase 9 (SME-03) — added to all new AND existing lesson files as human-fillable empty strings
- `parseFrontmatter()` in content-loader.js reads these via simple key:value YAML parsing; quoted string values must use single quotes around the value

### Pattern 2: modules-config.js Lesson Registration

**Critical: A lesson .md file that is not registered in MODULES is completely unreachable** — no sidebar link, no prev/next nav, no progress tracking. Every new lesson file requires a simultaneous addition to MODULES.

```javascript
// src/modules-config.js — example entry shapes
// Lesson backed by a scenario (renders scenario via renderScenario):
{ id: 'new-ot-lesson', title: 'OT Security Deep Dive', scenarioId: '02' }

// Lesson backed by an exercise (renders terminal exercise):
{ id: 'new-ps-lesson', title: 'PowerShell OT Hardening', exerciseId: '02' }

// Lesson backed by a quiz (renderQuiz() is called by lesson-view.js after markdown):
{ id: 'new-policy-lesson', title: 'Advanced Policy Review', quizId: '02' }

// Pure reading lesson (no quiz/exercise/scenario — counts complete when visited):
{ id: 'new-concepts-lesson', title: 'Advanced Concepts', }
```

[VERIFIED: modules-config.js and quiz-engine.js computeModuleProgress()]

**How quiz IDs resolve:** `renderLesson()` reads `meta.quizId` from the parsed frontmatter (NOT from modules-config). `computeModuleProgress()` reads `lesson.quizId` from the MODULES array. Both must be set to '02' (or whatever new ID) for the quiz to render AND for progress to track correctly.

### Pattern 3: Quiz JSON Schema (02.json)

New quiz files use the same schema as existing 01.json files:

```json
{
  "id": "{moduleId}-quiz-02",
  "moduleId": "{moduleId}",
  "title": "{Module Name} — Advanced Knowledge Check",
  "questions": [
    {
      "id": "q-01",
      "type": "multiple-choice",
      "stem": "Question text here.",
      "complianceControls": ["TSA-Monitoring", "NIST-AU-12"],
      "answers": [
        { "id": "a", "text": "Answer text", "correct": false, "feedback": "Per-answer feedback." },
        { "id": "b", "text": "Answer text", "correct": true,  "feedback": "Correct. Explanation." },
        { "id": "c", "text": "Answer text", "correct": false, "feedback": "Per-answer feedback." },
        { "id": "d", "text": "Answer text", "correct": false, "feedback": "Per-answer feedback." }
      ],
      "explanation": "Full explanation shown after answering."
    }
  ]
}
```

[VERIFIED: logging-auditing/quizzes/01.json]

**Completion count integrity:** The quiz engine stores `{ score, total: totalQuestions }` keyed by `moduleId/quizId`. `02.json` gets its own key (`logging-auditing/02`). It has no relationship to prior completers' `logging-auditing/01` records. The count-integrity concern only applies if questions were appended to an existing 01.json — that is prohibited.

### Pattern 4: Scenario JSON Schema

New scenario files add one advanced OT decision path. The engine supports linear chains and branching (multiple `nextPhaseId` values pointing to different phases). The minimum for Phase 9 is a 2-phase scenario where the OT path leads to a meaningfully different phase-2 than the IT path.

```json
{
  "id": "{moduleId}-scenario-02",
  "moduleId": "{moduleId}",
  "title": "Scenario Title",
  "complianceControls": ["TSA-Monitoring", "NIST-AU-2"],
  "narrative": "Context paragraph.\n\nIn OT environments: OT-specific context callout.",
  "phases": [
    {
      "id": "phase-1",
      "type": "decision",
      "title": "Phase Title",
      "isFinal": false,
      "prompt": "Decision prompt text.",
      "options": [
        {
          "id": "opt-a",
          "text": "Option A text",
          "outcome": "Outcome explanation.",
          "correct": false,
          "nextPhaseId": "phase-2-it"
        },
        {
          "id": "opt-b",
          "text": "Option B text (OT-aware choice)",
          "outcome": "Outcome explanation.",
          "correct": true,
          "nextPhaseId": "phase-2-ot"
        }
      ]
    },
    {
      "id": "phase-2-ot",
      "type": "decision",
      "title": "OT Path",
      "isFinal": true,
      "prompt": "OT-specific follow-up prompt.",
      "options": [...]
    },
    {
      "id": "phase-2-it",
      "type": "decision",
      "title": "IT Path",
      "isFinal": true,
      "prompt": "IT-specific follow-up prompt.",
      "options": [...]
    }
  ]
}
```

[VERIFIED: scenario-view.js validateScenario(), scenario-view.js runScenarioFlow(), patch-management/scenarios/02.json]

**Validation rule:** `validateScenario()` in scenario-view.js checks every `nextPhaseId` that is non-null resolves to an actual phase `id` in the phases array. A typo in `nextPhaseId` fails silently (renders error state). Every `nextPhaseId` must be verified before committing.

**`isFinal` rule:** Phases with `isFinal: true` trigger `completeScenario()` when the user clicks Continue. The final phase's `nextPhaseId` values are ignored by the engine (it checks `isFinal` first). Set `nextPhaseId: null` on terminal options.

### Pattern 5: compliance-refs.json Expired State Addition

The TSA entry must gain `"status": "expired"` before any badge.js changes take effect. The field name is `"status"` and the trigger value is the string `"expired"`. [VERIFIED: badge.js line 12 and UI-SPEC data model section]

```json
{
  "schemaVersion": 1,
  "lastVerified": "2026-05-17",
  "directives": {
    "TSA": {
      "name": "TSA Security Directive Pipeline-2021-02F",
      "shortName": "TSA SD-02F",
      "effectiveDate": "2025-05-03",
      "expiryDate": "2026-05-02",
      "status": "expired",
      "sourceUrl": "https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf"
    },
    "NIST": { ... }
  }
}
```

### Pattern 6: badge.js Expired State Branch

badge.js currently has no `status` check and no expired-state CSS classes. [VERIFIED: badge.js — 23 lines, no status field, no expiredClasses]

The UI-SPEC provides the complete implementation contract:
- Read `_complianceRefs?.directives?.[directiveKey]?.status`, default to `'active'` if absent
- Add `expiredClasses` constant: `bg-[var(--color-badge-expired-bg)] text-[var(--color-badge-expired-text)]`
- Expired HTML: `<span style="text-decoration: line-through;">{shortName}</span> [EXPIRED]` with `title` and `aria-label` attributes
- Active HTML: existing rendering unchanged (no breakage for NIST badge)

New CSS custom properties (add to `src/style.css` `@theme` block):
- `--color-badge-expired-bg: #2a2a2a`
- `--color-badge-expired-text: #737373`

### Anti-Patterns to Avoid

- **Appending to 01.json quiz files:** Prior completers' stored `total` count (e.g., 3) no longer matches the file's question count (e.g., 6), causing their quiz card to appear incomplete. New questions MUST be in 02.json. [VERIFIED: quiz-engine.js attachQuizHandlers() — `totalQuestions = quiz.questions.length`]
- **Lesson file without modules-config entry:** fetchLesson() will serve the file, but MODULES.find() in lesson-view.js returns undefined for computeModuleProgress and getLessonNav — no sidebar link, no prev/next, no progress tracking. [VERIFIED: content-loader.js getLessonNav()]
- **Hardcoding version strings in content:** TSA version strings must not appear in lesson .md, quiz .json, exercise .json, or scenario .json content. Use "current TSA pipeline security directive" in prose.
- **Assuming SD-02G:** The successor designation is unknown. Do not write SD-02G anywhere. After manual verification at TSA.gov, add a new directive key to compliance-refs.json with `"status": "active"` — keep the expired SD-02F entry for historical reference.
- **Scenario nextPhaseId typo:** validateScenario() silently rejects the entire scenario on a single invalid reference. Verify all nextPhaseId values exist as phase ids before committing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown parsing | Custom parser | existing marked.js pipeline in content-loader.js | Shiki integration, OT callout renderer, copy-button renderer all built in |
| Quiz rendering | New quiz component | existing renderQuiz() in quiz-engine.js | Already handles first-visit/revisit modes, progress save, sidebar refresh |
| Scenario flow | New scenario component | existing renderScenario() in scenario-view.js | Already handles validation, state machine, completion banner, revisit mode |
| SME checklist formatting | Custom template engine | Plain Markdown file | docs/ is not served by the app — a .md file is the intended format |

---

## Common Pitfalls

### Pitfall 1: Lesson Registered Without Matching File (or Vice Versa)
**What goes wrong:** A new lesson appears in the sidebar but clicking it shows "lesson could not be loaded" error state. Or a .md file is created but is never reachable.
**Why it happens:** modules-config.js update and lesson .md file creation done in separate commits without cross-checking.
**How to avoid:** In every commit that adds a lesson .md file, verify the MODULES array entry for that module contains the matching `{ id: '{lessonId}', ... }` entry.
**Warning signs:** Navigating to `#/lesson/{moduleId}/{lessonId}` shows the lesson-error view; or the lesson is missing from the sidebar.

### Pitfall 2: Quiz 02.json Added Without Frontmatter quizId in Lesson File
**What goes wrong:** The quiz file exists at quizzes/02.json but the lesson never shows a quiz section.
**Why it happens:** `renderLesson()` checks `meta.quizId` from the parsed frontmatter — not from modules-config. If the lesson .md has no `quizId: '02'` in frontmatter, no quiz is mounted.
**How to avoid:** The lesson that owns the quiz must have `quizId: '02'` in both its .md frontmatter AND its MODULES entry.
**Warning signs:** Navigate to the quiz lesson — no quiz section appears below the lesson body.

### Pitfall 3: Scenario nextPhaseId Doesn't Match a Real Phase id
**What goes wrong:** The scenario view shows the error state ("Scenario content could not be loaded") even though the JSON file exists.
**Why it happens:** `validateScenario()` returns false if any `nextPhaseId` (non-null) does not exist in the phases array. This is a structural validation, not a network error.
**How to avoid:** Before committing any scenario JSON, trace every non-null `nextPhaseId` value in every option and confirm a matching phase `id` exists.
**Warning signs:** Scenario URL loads but shows the error card rather than the scenario header.

### Pitfall 4: SD-02F Left Hardcoded in Quiz/Scenario Content
**What goes wrong:** After SME-01 marks the directive expired, quiz question q-03 in logging-auditing still reads "Under TSA SD-02F..." — the content contradicts the badge.
**Why it happens:** The hardcoded strings in 01.json content were authored before the no-hardcoding rule was established.
**How to avoid:** Run the SD-02F text search across all public/data/ before marking SME-01 complete. Replace with "current TSA pipeline security directive" phrasing.
**Warning signs:** grep finds "SD-02F" in any file other than compliance-refs.json and the compliance-index-view.js static string.

### Pitfall 5: TSA Successor Applied Without Manual TSA.gov Verification
**What goes wrong:** A new version string (e.g., "SD-02G") is committed to compliance-refs.json and appears site-wide before it is verified. If the actual successor has a different designation, this is a factual compliance error.
**Why it happens:** Assumption based on naming convention.
**How to avoid:** Do not commit any successor version string. Leave compliance-refs.json in expired state until a human manually confirms the designation at TSA.gov. The expired badge is the correct interim state.
**Warning signs:** Any string like "SD-02G" or "SD-03" appearing in compliance-refs.json without a dated TSA.gov verification note.

### Pitfall 6: New Lessons Miss OT Callout Block
**What goes wrong:** The lesson passes content review but fails SME-02 checklist review because it has no `> [!OT]` section.
**Why it happens:** Author forgets the CLAUDE.md mandate.
**How to avoid:** Every new lesson that is OT-relevant (all lessons in this platform qualify) must include at least one `> [!OT]\n> body` blockquote. The content-loader.js renderer converts this to `<aside class="ot-callout">`.
**Warning signs:** Lesson renders without the orange "IN OT ENVIRONMENTS" callout block.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 + happy-dom 20.9.0 |
| Config file | `vitest.config.js` |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |

[VERIFIED: vitest.config.js, package.json]

Baseline: 167 tests passing, 1 todo. [VERIFIED: test run output]

### Validation Dimensions for Phase 9

| Dimension | What to Validate | Test Type | Notes |
|-----------|-----------------|-----------|-------|
| compliance-refs.json data model | TSA entry has `"status": "expired"` and `"expiryDate"` fields | Unit (JSON parse) | New test: parse file, assert fields present |
| badge.js expired state rendering | `renderBadge('TSA')` returns strikethrough + [EXPIRED] when status=expired | Unit | New test: setComplianceRefs with expired status, assert HTML contains `text-decoration: line-through` and `[EXPIRED]` |
| badge.js active state unchanged | `renderBadge('NIST')` unchanged when no status field | Unit | New test: regression guard |
| Quiz engine loads 02.json | renderQuiz('logging-auditing', '02', ...) fetches correct URL | Unit | Extend quiz-engine.test.js with `quizId: '02'` fetch mock |
| Lesson reachability | All 10 new lesson ids exist in MODULES array | Unit | Check MODULES for each new id after modules-config.js update |
| Scenario validation | All new scenario JSON passes validateScenario() | Unit | Import each new scenario JSON, call validateScenario(), assert true |
| SD-02F hardcode elimination | No SD-02F string in any content JSON file post-remediation | Integration (grep) | Manual verification step or test that reads files |
| New lesson frontmatter | lastReviewed and reviewer fields present in new lesson .md files | Unit (frontmatter parse) | parseFrontmatter() call on each new .md |
| computeModuleProgress counts new lessons | New lessons in MODULES contribute to denominator | Unit | Extend existing computeModuleProgress tests |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Wave 0 Gap? |
|--------|----------|-----------|-------------------|-------------|
| SME-01 | compliance-refs.json has `"status": "expired"` on TSA | unit | `npm test` (new test in compliance-refs.test.js) | New test needed |
| SME-01 | badge.js renders expired state | unit | `npm test` (new test in badge.js test file) | New test + new test file |
| SME-01 | No SD-02F hardcoded in content JSON | manual | grep public/data/ | Manual verification |
| SME-02 | docs/SME-REVIEW-CHECKLIST.md exists and covers all content | manual | File existence check | Manual |
| SME-03 | Lesson frontmatter has lastReviewed/reviewer fields | unit | `npm test` (extend content-loader.test.js) | New test |
| CONT-05 | 10 new lesson entries in MODULES (2 per module) | unit | `npm test` (new test in modules-config test) | New test |
| CONT-05 | 10 new .md files fetchable | integration | browser smoke test | Manual |
| CONT-06 | 5 new scenario JSON files pass validateScenario() | unit | `npm test` (extend scenario-view.test.js) | New test |
| CONT-07 | 5 new quiz 02.json files loadable by quiz engine | unit | `npm test` (extend quiz-engine.test.js) | New test |
| CONT-07 | New quiz lessons have quizId: '02' in MODULES + frontmatter | unit | `npm test` | New test |

### Sampling Rate
- Per task commit: `npm test` — full suite runs in ~3s; no reason to run a subset
- Per wave merge: `npm test`
- Phase gate: full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/badge-expired.test.js` — covers SME-01 expired badge rendering (badge.js currently has no test file)
- [ ] New tests in `tests/compliance-refs.test.js` — assert `"status": "expired"` field present on TSA entry
- [ ] New tests in `tests/scenario-view.test.js` — validateScenario() called on new scenario fixtures
- [ ] New tests in `tests/quiz-engine.test.js` — quizId '02' URL resolution

Note: `tests/compliance-refs.test.js` already exists. All other test files listed exist. Only `tests/badge-expired.test.js` is a truly new file.

---

## SME Review Checklist Structure (SME-02)

The `docs/SME-REVIEW-CHECKLIST.md` file is a human-facing Markdown document, not served by the app. It must be printable and enumerate every reviewable content artifact.

**Required structure per ROADMAP success criteria:**
- Section per module (5 sections)
- Within each section: table or list of every lesson file, quiz file, exercise file, and scenario file
- Each entry has human-fillable fields: "Last reviewed:" and "Reviewer:"
- Header: "SME Review Checklist — Pipeline Cyber Training"

**Full artifact count for checklist (existing + new Phase 9 content):**
| Module | Lessons | Quizzes | Exercises | Scenarios | Total |
|--------|---------|---------|-----------|-----------|-------|
| logging-auditing | 5 (3 existing + 2 new) | 2 (01 + 02 new) | 1 | 2 (01 + 02 new) | 10 |
| network-hardening | 5 | 2 | 1 | 2 | 10 |
| account-access | 5 | 2 | 1 | 2 | 10 |
| incident-response | 5 | 2 | 1 | 2 | 10 |
| patch-management | 5 | 2 | 1 | 4 (01-04) | 12 |
| **Total** | **25** | **10** | **5** | **12** | **52** |

---

## Runtime State Inventory

No rename, refactor, or migration. Phase 9 adds new content; existing progress store records are unaffected. No runtime state categories apply.

- Stored data: None affected — new quizzes use new keys (`moduleId/02`); existing quiz keys (`moduleId/01`) are untouched.
- Live service config: None. Static GitHub Pages.
- OS-registered state: None.
- Secrets/env vars: None.
- Build artifacts: None — Vite builds from source on each deploy.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | `npm test`, `npm run build` | Implied (project already building) | — | — |
| Vitest | Testing | Installed | 4.1.6 | — |
| happy-dom | Test environment | Installed | 20.9.0 | — |

No new external dependencies. All content work is file authoring.

**Step 2.6: Environment audit SKIPPED for new content files** — lesson .md, quiz .json, scenario .json, and the SME checklist .md are authored as static files with no build step dependency beyond Vite already in use.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLAUDE.md documents marked.js v17 | Installed version is v18.0.3 | v1.0 development | Update CLAUDE.md as housekeeping in this phase |
| No expired badge state | New expired state branch in badge.js | Phase 9 | Six view files inherit automatically via renderBadge() |
| SD-02F directive active | SD-02F expired 2026-05-02 | 2026-05-02 | Day 1 action required |

**Deprecated/outdated:**
- CLAUDE.md `marked.js v17` reference: actual installed version is 18.0.3 per package.json; update CLAUDE.md.
- CLAUDE.md `Open Decisions` section still lists v1.0 Phase 5 decisions (jQuery Terminal vs vanilla, PS parser approach) — these were resolved in v1.0; may be cleaned up.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | docs/ directory does not exist and must be created | SME-02 / Content Structure | Risk LOW: directory creation is trivial |
| A2 | TSA SD-02F successor is not yet publicly designated | SME-01 | Risk HIGH if actually published: executor must verify at TSA.gov before any action |
| A3 | module.json files in public/data/modules/ are not read by any runtime code (only logging-auditing has one; other modules don't) | Content Structure | Risk LOW: grep of src/ shows no fetch of module.json; modules-config.js is the authoritative source |

If this table contains claims tagged [ASSUMED]: the planner should flag A2 for user confirmation — TSA.gov must be checked before the succession status can be determined.

---

## Open Questions (RESOLVED)

1. **TSA SD-02F Successor Designation** — RESOLVED: Executor verifies TSA.gov on Day 1; plans implement expired-only state with no successor assumption. Successor string is purely additive once confirmed and can be applied post-Phase 9.
   - What we know: SD-02F expired May 2, 2026. The successor is required for Phase 9 SME-01 completion.
   - What's unclear: Whether the successor has been published and what its designation is.
   - Recommendation: The executor must manually visit TSA.gov on Day 1 before any succession string is committed. Phase 9 can reach full completion with expired state only — successor string is additive.

2. **compliance-index-view.js Hardcoded String** — RESOLVED: Plan 09-03 Task 2 replaces the static string on compliance-index-view.js line 123 with a generic string as part of SME-01.
   - What we know: Line 123 contains `"Every TSA SD-02F and NIST SP 800-82 Rev 3 control..."` hardcoded in JS source.
   - What's unclear: Whether the planner treats this as part of SME-01 (compliance currency) or a separate housekeeping item.
   - Recommendation: Include as a SME-01 sub-task — replace with the renderBadge() output or a generic string like "Every TSA pipeline security directive and NIST SP 800-82 Rev 3 control..."

---

## Sources

### Primary (HIGH confidence — verified from live codebase)
- `src/modules-config.js` — complete MODULES array structure and lesson registration contract
- `src/quiz-engine.js` — quiz ID resolution (explicit ID from MODULES/frontmatter), completion count storage pattern
- `src/views/scenario-view.js` — validateScenario(), runScenarioFlow(), isFinal handling
- `src/views/lesson-view.js` — quizId frontmatter reading, renderQuiz() invocation
- `src/badge.js` — current implementation (no expired state), renderBadge() signature
- `src/content-loader.js` — parseFrontmatter() YAML parsing, fetchLesson() URL pattern, [!OT] callout renderer
- `src/progress-store.js` — quiz storage key pattern (moduleId/quizId)
- `public/data/compliance-refs.json` — current schema (no status field on TSA entry)
- `public/data/modules/logging-auditing/quizzes/01.json` — quiz JSON schema
- `public/data/modules/logging-auditing/scenarios/01.json` — scenario JSON schema
- `public/data/modules/logging-auditing/exercises/01.json` — exercise JSON schema
- `public/data/modules/logging-auditing/lessons/intro.md` — lesson frontmatter schema
- `vitest.config.js`, `package.json` — test infrastructure (Vitest 4.1.6, happy-dom, 167 passing tests)
- `.planning/phases/09-compliance-currency-content-depth/09-UI-SPEC.md` — expired badge HTML contract, CSS custom properties

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` — Phase 9 constraints and plan notes
- `.planning/REQUIREMENTS.md` — SME/CONT requirement definitions
- `CLAUDE.md` — project conventions and content rules

---

## Metadata

**Confidence breakdown:**
- Data model and JS wiring (badge.js, quiz-engine, scenario-view): HIGH — verified from source
- Content schemas (quiz/scenario/lesson): HIGH — verified from live files
- Hardcoded SD-02F audit: HIGH — grep across all public/data/ files
- Test infrastructure: HIGH — test suite run to confirm 167 passing
- TSA successor status: LOW — cannot verify without live TSA.gov lookup

**Research date:** 2026-05-17
**Valid until:** Content schemas and JS patterns are stable for the life of v2.0 (no library upgrades planned). TSA succession status may change daily — verify at time of execution.
