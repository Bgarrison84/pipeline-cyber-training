# Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04) — Research

**Researched:** 2026-05-16
**Domain:** Content authoring — Markdown lessons, JSON schemas (quiz/exercise/scenario), compliance-index.json, modules-config.js
**Confidence:** HIGH (all schemas verified against existing MOD-01 files; all integration points read from source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** 3 lessons per module, pattern: Lesson 1 (intro) hosts scenario, Lesson 2 (PS hands-on) hosts exercise, Lesson 3 (policy/config) hosts quiz.

**D-02:** Lesson IDs and titles:
- MOD-02 (network-hardening): `intro` / `ps-firewall` / `firewall-policy`
- MOD-03 (account-access): `intro` / `ps-ad` / `access-policy`
- MOD-04 (incident-response): `intro` / `ps-ir` / `ir-procedures`

**D-03:** modules-config.js updated: add 3rd lesson per module, add scenarioId/exerciseId/quizId fields.

**D-04 through D-06:** Exact PS commands per exercise step (4 steps each) specified verbatim in CONTEXT.md.

**D-07 through D-09:** Exact scenario structure per module (2-phase decision trees, specific phase titles, correct/wrong decision logic) specified verbatim in CONTEXT.md.

**D-10 through D-11:** New compliance control IDs and their labels — 9 new entries in compliance-index.json only (not compliance-refs.json). compliance-refs.json NOT modified.

**D-12:** NERC CIP references appear per-lesson where alignment exists, each with verbatim disclaimer. Specific lessons: MOD-02 firewall-policy (CIP-007), MOD-03 access-policy (CIP-006) + intro (CIP-004), MOD-04 intro + ir-procedures (CIP-008).

### Claude's Discretion

- Exact lesson prose depth — use MOD-01 lesson length as benchmark
- Quiz question topics (3 questions per quiz)
- Specific hintPatterns per exercise step
- Exact successOutput text per exercise step
- OT callout placement within each lesson (required, placement is discretion)
- Narrative details within scenarios (IP addresses, timestamps, event counts)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 7 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOD-02 | Network Hardening — core lessons, quiz, terminal exercise, scenario; firewall rules, network segmentation, port scanning via PS | D-01–D-04, D-07, D-10 in CONTEXT.md; lesson format verified from MOD-01 templates |
| MOD-03 | Account & Access Management — core lessons, quiz, exercise, scenario; AD, least privilege, service accounts, password policies | D-01–D-03, D-05, D-08, D-10 in CONTEXT.md; schemas verified |
| MOD-04 | Incident Response — core lessons, quiz, exercise, scenario; anomaly detection, isolation, evidence collection via PS | D-01–D-03, D-06, D-09, D-10 in CONTEXT.md; schemas verified |
| DATA-02 | NERC CIP content explicitly framed as reference benchmark for pipeline operators — not binding | D-12 in CONTEXT.md; existing MOD-01 pattern confirmed |
| DATA-03 | OT/IT distinctions explicitly called out in every dual-use lesson | CLAUDE.md rule #1; confirmed present in all 3 MOD-01 lessons |
</phase_requirements>

---

## Summary

Phase 7 is a pure content authoring phase. All rendering engines, routes, progress tracking, and UI components were completed in Phases 4–6. This phase authors 21 files (9 lesson .md, 3 quiz .json, 3 exercise .json, 3 scenario .json, 1 modules-config.js update, 1 compliance-index.json update) and creates 3 new module directory trees under `public/data/modules/`.

No new module directories exist yet. The `public/data/modules/` directory contains only `logging-auditing/`. Everything for network-hardening, account-access, and incident-response must be created from scratch. The current `modules-config.js` has placeholder lesson entries for these modules that will be replaced entirely.

All schemas are locked from prior phases and fully verified by reading the MOD-01 canonical files. The compliance-index.json currently has only 2 control entries (TSA-Monitoring, NIST-AU-2). Nine new control entries will be added. The existing test suite (167 tests, all GREEN) is Vitest + happy-dom; no new test files are needed for content-only authoring, but compliance-index.json schema correctness is validated by the existing compliance-index-view tests which load the fixture inline.

**Primary recommendation:** Author all content files in a single wave. All integration is already wired; adding files + updating two config files is sufficient to make all three modules fully functional.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lesson prose + frontmatter | Static file (public/data/) | — | Fetched by content-loader.js, rendered via marked.js |
| Quiz questions and answers | Static file (public/data/) | quiz-engine.js | Engine already reads schema; content is data |
| Exercise steps + command patterns | Static file (public/data/) | terminal-engine.js | Engine already reads schema; content is data |
| Scenario decision tree | Static file (public/data/) | scenario-view.js | Engine already reads schema; content is data |
| Module lesson array + IDs | modules-config.js | router.js, module-view.js | Config drives routing and display |
| Compliance control index | public/data/compliance-index.json | compliance-index-view.js | View reads this file at runtime |

---

## Standard Stack

### No new libraries needed

Phase 7 is pure content authoring. All tooling was established in Phases 1–6:

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | ^8.0.12 | Build tool — no changes |
| Vitest | ^4.1.6 | Test runner — no new tests needed for content |
| marked.js | ^18.0.3 | Renders lesson Markdown — no changes |
| Shiki | ^4.0.2 | PS syntax highlighting — no changes |

**No npm installs required for this phase.**

---

## Architecture Patterns

### System Architecture Diagram

```
Content author writes files
         |
         v
public/data/modules/{moduleId}/
  lessons/{lessonId}.md       ─── fetch ──► content-loader.js ──► lesson-view.js ──► DOM
  quizzes/01.json             ─── fetch ──► quiz-engine.js ──► DOM
  exercises/01.json           ─── fetch ──► exercise-view.js ──► terminal-engine.js ──► DOM
  scenarios/01.json           ─── fetch ──► scenario-view.js ──► DOM

src/modules-config.js         ──────────► router.js (hash routing), module-view.js (lesson list)
public/data/compliance-index.json ────── ► compliance-index-view.js ──► DOM
```

### Recommended Project Structure (created by this phase)

```
public/data/modules/
  network-hardening/
    lessons/
      intro.md
      ps-firewall.md
      firewall-policy.md
    quizzes/
      01.json
    exercises/
      01.json
    scenarios/
      01.json
  account-access/
    lessons/
      intro.md
      ps-ad.md
      access-policy.md
    quizzes/
      01.json
    exercises/
      01.json
    scenarios/
      01.json
  incident-response/
    lessons/
      intro.md
      ps-ir.md
      ir-procedures.md
    quizzes/
      01.json
    exercises/
      01.json
    scenarios/
      01.json
```

---

## Exact File Inventory

### Files to CREATE (21 files)

| Path | Type | Notes |
|------|------|-------|
| `public/data/modules/network-hardening/lessons/intro.md` | Lesson MD | scenarioId host; CIP-004 reference |
| `public/data/modules/network-hardening/lessons/ps-firewall.md` | Lesson MD | exerciseId host |
| `public/data/modules/network-hardening/lessons/firewall-policy.md` | Lesson MD | quizId host; CIP-007 reference |
| `public/data/modules/network-hardening/quizzes/01.json` | Quiz JSON | 3 questions, firewall/segmentation topics |
| `public/data/modules/network-hardening/exercises/01.json` | Exercise JSON | 4 steps (D-04 commands) |
| `public/data/modules/network-hardening/scenarios/01.json` | Scenario JSON | id: network-hardening-scenario-01 (D-07) |
| `public/data/modules/account-access/lessons/intro.md` | Lesson MD | scenarioId host; CIP-004 reference |
| `public/data/modules/account-access/lessons/ps-ad.md` | Lesson MD | exerciseId host |
| `public/data/modules/account-access/lessons/access-policy.md` | Lesson MD | quizId host; CIP-006 reference |
| `public/data/modules/account-access/quizzes/01.json` | Quiz JSON | 3 questions, AD/least-privilege topics |
| `public/data/modules/account-access/exercises/01.json` | Exercise JSON | 4 steps (D-05 commands) |
| `public/data/modules/account-access/scenarios/01.json` | Scenario JSON | id: account-access-scenario-01 (D-08) |
| `public/data/modules/incident-response/lessons/intro.md` | Lesson MD | scenarioId host; CIP-008 reference |
| `public/data/modules/incident-response/lessons/ps-ir.md` | Lesson MD | exerciseId host |
| `public/data/modules/incident-response/lessons/ir-procedures.md` | Lesson MD | quizId host; CIP-008 reference |
| `public/data/modules/incident-response/quizzes/01.json` | Quiz JSON | 3 questions, IR/evidence topics |
| `public/data/modules/incident-response/exercises/01.json` | Exercise JSON | 4 steps (D-06 commands) |
| `public/data/modules/incident-response/scenarios/01.json` | Scenario JSON | id: incident-response-scenario-01 (D-09) |

### Files to MODIFY (2 files)

| Path | Change |
|------|--------|
| `src/modules-config.js` | Replace placeholder lesson arrays for network-hardening, account-access, incident-response with 3-lesson arrays including scenarioId/exerciseId/quizId fields (D-03) |
| `public/data/compliance-index.json` | Add 9 new control entries (D-10): TSA-NetworkSeg, NIST-SC-7, NIST-SI-3, TSA-AccessControl, NIST-AC-2, NIST-AC-6, TSA-IR, NIST-IR-4, NIST-AU-12 |

**Total: 21 creates + 2 modifies = 23 file operations**

---

## Verified Schemas (from MOD-01 canonical files)

### Lesson Markdown Frontmatter Schema

[VERIFIED: read public/data/modules/logging-auditing/lessons/intro.md]

```markdown
---
title: {string}
lessonId: {string}           # matches the lesson id in modules-config.js
moduleId: {string}           # matches the module id in modules-config.js
order: {number}              # 1, 2, or 3
complianceTags: [TSA, NIST]  # always both for these modules
complianceControls: [{id}, {id}, ...]  # specific control IDs from compliance-index.json
quizId: '01'                 # ONLY on the lesson that hosts the quiz (Lesson 3)
---
```

**Note:** `scenarioId` and `exerciseId` are NOT in the frontmatter — they are in `modules-config.js` only. The lesson Markdown file does not declare its own scenario/exercise IDs. The `quizId` frontmatter field IS used: `lesson-view.js` reads it to render the inline quiz. [VERIFIED: audit-policies.md has `quizId: '01'`; intro.md and ps-logging.md do not]

**Lesson body requirements (from CLAUDE.md + MOD-01 pattern):**
- Must contain at least one `> [!OT]` or `> **In OT environments:**` callout block [ASSUMED] (MOD-01 uses `> [!OT]` notation)
- NERC CIP references must use verbatim disclaimer per D-12
- All code blocks use powershell fence with inline comments
- Generic identifiers only: PIPELINE-DC01, 10.0.0.0/24, ExampleCorp, svc-historian
- No hardcoded TSA version strings in prose

**OT callout syntax** — MOD-01 uses `> [!OT]` block notation:

```markdown
> [!OT]
> In OT environments: {content}
```

### Quiz JSON Schema

[VERIFIED: read public/data/modules/logging-auditing/quizzes/01.json]

```json
{
  "id": "{moduleId}-quiz-01",
  "moduleId": "{moduleId}",
  "title": "{Module Title} Knowledge Check",
  "questions": [
    {
      "id": "q-01",
      "type": "multiple-choice",
      "stem": "{question text}",
      "complianceControls": ["{control-id}"],
      "answers": [
        {
          "id": "a",
          "text": "{answer text}",
          "correct": false,
          "feedback": "{per-answer explanation}"
        },
        {
          "id": "b",
          "text": "{answer text}",
          "correct": true,
          "feedback": "{per-answer explanation — confirms why correct}"
        },
        {
          "id": "c",
          "text": "{answer text}",
          "correct": false,
          "feedback": "{per-answer explanation}"
        },
        {
          "id": "d",
          "text": "{answer text}",
          "correct": false,
          "feedback": "{per-answer explanation}"
        }
      ],
      "explanation": "{full explanation shown after answering}"
    }
  ]
}
```

**Constraints:** Exactly 3 questions (`q-01`, `q-02`, `q-03`). Exactly 4 answers per question (`a`, `b`, `c`, `d`). Exactly 1 correct answer per question. `complianceControls` array per question — use the specific new control IDs (e.g., `NIST-SC-7`, not generic `NIST`).

### Exercise JSON Schema

[VERIFIED: read public/data/modules/logging-auditing/exercises/01.json]

```json
{
  "id": "{moduleId}-ex-01",
  "moduleId": "{moduleId}",
  "title": "{Exercise Title}",
  "description": "{one-sentence description}",
  "complianceControls": ["{id}", "{id}"],
  "context": "{scenario setup — who you are, what system, current state}",
  "steps": [
    {
      "id": "step-1",
      "instruction": "{what to do}",
      "hint": "{general hint shown on ? press}",
      "hintPatterns": [
        {
          "pattern": "{regex string}",
          "hint": "{specific hint for near-miss}"
        }
      ],
      "expectedCommands": [
        {
          "pattern": "{regex string}",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "{realistic PS output string — use \\n for newlines}",
      "feedbackOnWrong": "{message shown when command doesn't match}"
    }
  ]
}
```

**Constraints:**
- 4 steps per exercise (D-04, D-05, D-06) with ids `step-1` through `step-4`
- `hintPatterns[].pattern` is a regex string matched against user input
- `expectedCommands[].pattern` is a regex string — can be loose to accommodate parameter ordering variation
- `successOutput` uses `\n` for newlines within the JSON string — it must look like realistic PS 5.1 output
- PS 5.1 cmdlets only — no PS 7 aliases or Core-only cmdlets

### Scenario JSON Schema

[VERIFIED: read public/data/modules/logging-auditing/scenarios/01.json]

```json
{
  "id": "{scenario-id}",
  "moduleId": "{moduleId}",
  "title": "{Scenario Title}",
  "complianceControls": ["{id}", "{id}"],
  "narrative": "{multi-sentence setup including OT context paragraph}",
  "phases": [
    {
      "id": "phase-1",
      "type": "decision",
      "title": "{phase title}",
      "isFinal": false,
      "prompt": "{decision question}",
      "options": [
        {
          "id": "opt-a",
          "text": "{option text}",
          "outcome": "{consequence explanation}",
          "correct": false,
          "nextPhaseId": "phase-2"
        },
        {
          "id": "opt-b",
          "text": "{option text}",
          "outcome": "{consequence explanation}",
          "correct": true,
          "nextPhaseId": "phase-2"
        }
      ]
    },
    {
      "id": "phase-2",
      "type": "decision",
      "title": "{phase title}",
      "isFinal": true,
      "prompt": "{decision question}",
      "options": [
        {
          "id": "opt-a",
          "text": "{option text}",
          "outcome": "{consequence explanation}",
          "correct": true,
          "nextPhaseId": null
        },
        {
          "id": "opt-b",
          "text": "{option text}",
          "outcome": "{consequence explanation}",
          "correct": false,
          "nextPhaseId": null
        }
      ]
    }
  ]
}
```

**Constraints:**
- Exactly 2 phases per scenario (D-07, D-08, D-09)
- Phase 1: `isFinal: false`, both options have `nextPhaseId: "phase-2"`
- Phase 2: `isFinal: true`, all options have `nextPhaseId: null`
- Exactly 2 options per phase (`opt-a`, `opt-b`)
- Exactly 1 correct option per phase (`correct: true`)
- `narrative` field contains the OT context — the scenario-view renders this before phase-1

### compliance-index.json Schema

[VERIFIED: read public/data/compliance-index.json]

Current file has 2 control entries. 9 new entries required (D-10):

```json
{
  "id": "{control-id}",
  "label": "{human-readable label}",
  "items": [
    {
      "type": "lesson",
      "moduleId": "{module-id}",
      "contentId": "{lesson-id}",
      "title": "{lesson title}"
    },
    {
      "type": "exercise",
      "moduleId": "{module-id}",
      "contentId": "01",
      "title": "{exercise title}"
    },
    {
      "type": "scenario",
      "moduleId": "{module-id}",
      "contentId": "01",
      "title": "{scenario title}"
    }
  ]
}
```

**Each control's `items[]` should link every lesson/exercise/scenario that covers it.** Control coverage mapping per D-10 and lesson content:

| Control ID | Label | Items to Link |
|------------|-------|---------------|
| TSA-NetworkSeg | TSA SD-02F — Network Segmentation and Access Control | intro, ps-firewall, firewall-policy lessons + exercise 01 + scenario 01 from network-hardening |
| NIST-SC-7 | NIST SP 800-82 Rev 3 — SC-7: Boundary Protection | intro, firewall-policy lessons from network-hardening |
| NIST-SI-3 | NIST SP 800-82 Rev 3 — SI-3: Malicious Code Protection | ps-firewall lesson from network-hardening |
| TSA-AccessControl | TSA SD-02F — Access Control Management | intro, ps-ad, access-policy lessons + exercise 01 + scenario 01 from account-access |
| NIST-AC-2 | NIST SP 800-82 Rev 3 — AC-2: Account Management | intro, ps-ad lessons from account-access |
| NIST-AC-6 | NIST SP 800-82 Rev 3 — AC-6: Least Privilege | access-policy lesson from account-access |
| TSA-IR | TSA SD-02F — Cybersecurity Incident Response | intro, ps-ir, ir-procedures lessons + exercise 01 + scenario 01 from incident-response |
| NIST-IR-4 | NIST SP 800-82 Rev 3 — IR-4: Incident Handling | intro, ir-procedures lessons from incident-response |
| NIST-AU-12 | NIST SP 800-82 Rev 3 — AU-12: Audit Record Generation | ps-ir lesson from incident-response |

**Note:** NIST-AU-12 already exists as a control in the lesson frontmatter of MOD-01's ps-logging.md, but it does NOT yet have an entry in compliance-index.json (the current index only has TSA-Monitoring and NIST-AU-2). Adding it for incident-response's ps-ir lesson is correct per D-10.

### modules-config.js Update Schema

[VERIFIED: read src/modules-config.js]

Current placeholder entries for network-hardening, account-access, incident-response have 2 lessons each with no scenarioId/exerciseId/quizId. The update replaces each with:

```javascript
// network-hardening
lessons: [
  { id: 'intro',           title: 'Network Hardening Overview',                    scenarioId: '01' },
  { id: 'ps-firewall',     title: 'Managing Firewall Rules with PowerShell',        exerciseId: '01' },
  { id: 'firewall-policy', title: 'Windows Firewall Policy for OT Networks',        quizId: '01' },
],

// account-access
lessons: [
  { id: 'intro',         title: 'Account and Access Control Overview',              scenarioId: '01' },
  { id: 'ps-ad',         title: 'Active Directory Queries with PowerShell',         exerciseId: '01' },
  { id: 'access-policy', title: 'Least Privilege and Service Account Policy',       quizId: '01' },
],

// incident-response
lessons: [
  { id: 'intro',          title: 'Incident Response Overview',                      scenarioId: '01' },
  { id: 'ps-ir',          title: 'Evidence Collection with PowerShell',             exerciseId: '01' },
  { id: 'ir-procedures',  title: 'Containment and Recovery Procedures',             quizId: '01' },
],
```

The `estimatedMinutes` and `description` fields for each module may optionally be updated to reflect final content scope — not required for functionality.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Lesson rendering | Custom Markdown parser | marked.js (already wired in content-loader.js) |
| Quiz logic | New quiz handler | quiz-engine.js (reads quizId from frontmatter) |
| Terminal validation | New command matcher | terminal-engine.js (reads exercise JSON patterns) |
| Scenario branching | New decision engine | scenario-view.js (reads scenario phases) |
| Progress tracking | Direct localStorage calls | progressStore.js (all progress flows through it) |
| Compliance links | New URL builder | compliance-index-view.js (reads items[] from JSON) |

**Key insight:** All engines are already wired. Phase 7 delivers content files only — no JS changes except modules-config.js and the data JSON.

---

## Common Pitfalls

### Pitfall 1: Frontmatter quizId on wrong lesson
**What goes wrong:** If `quizId: '01'` appears in the frontmatter of Lesson 1 (intro) or Lesson 2 (ps-*), the quiz renders on the wrong lesson AND the exercise/scenario buttons still appear on that lesson — creating a cluttered view.
**Why it happens:** lesson-view.js reads `quizId` from frontmatter to decide whether to call `renderQuiz()`.
**How to avoid:** Only the Lesson 3 file (firewall-policy.md, access-policy.md, ir-procedures.md) gets `quizId: '01'` in frontmatter.
**Warning signs:** Quiz appearing twice, or appearing on the intro lesson.

### Pitfall 2: scenarioId/exerciseId in frontmatter instead of modules-config.js
**What goes wrong:** These IDs are wired from modules-config.js, NOT from lesson frontmatter. Putting them in the Markdown frontmatter has no effect — module-view.js reads from modules-config.js only.
**Why it happens:** Mistaking the quiz pattern (quizId in frontmatter) for a universal pattern. Only quizId lives in frontmatter.
**How to avoid:** scenarioId and exerciseId go ONLY in modules-config.js lesson objects. Never in .md frontmatter.

### Pitfall 3: Hardcoded TSA version string in lesson prose
**What goes wrong:** Writing "TSA SD-02F" literally in lesson Markdown violates DATA-01 and CLAUDE.md.
**Why it happens:** Natural prose tendency. The compliance-refs.json exists precisely to be the single source.
**How to avoid:** Lesson prose references the TSA directive generically ("the current TSA pipeline security directive" or "TSA SD-02F" is acceptable as a label — the rule is about version strings like "SD-02F" being sourced from the data file, not about never typing the letters). The compliance-refs.json has `shortName: "TSA SD-02F"` for display — lesson frontmatter uses tag IDs not version strings.

**Clarification:** The DATA-01 rule is about the version string ("02F") not being hardcoded in a way that requires editing multiple files when TSA updates the directive number. Using the control ID `TSA-NetworkSeg` in frontmatter is correct. Prose can say "the current TSA pipeline security directive" without hardcoding the version string. [ASSUMED — interpreting from CLAUDE.md and existing MOD-01 patterns]

### Pitfall 4: PS 7-only cmdlets in exercise steps
**What goes wrong:** Commands like `Get-NetAdapter -Physical` with PS 7 parameters, or using `?` as an alias for `Where-Object` in a way that fails on PS 5.1.
**Why it happens:** Training data includes PS 7 examples.
**How to avoid:** All 4 exercise commands per module are already locked in D-04/D-05/D-06. These are PS 5.1 verified. Only use cmdlets from those locked commands.

### Pitfall 5: exercise successOutput missing realistic formatting
**What goes wrong:** Terminal shows plain text instead of PS-formatted table output — violates TERM-02.
**Why it happens:** Mock output written as a single line rather than formatted PS table.
**How to avoid:** Model successOutput on MOD-01's exercise 01.json patterns — use `\n` to separate lines, include PS column headers and dashes separator, use realistic column widths.

### Pitfall 6: compliance-index.json items[] missing a content type
**What goes wrong:** Compliance index page shows a control with no linked content, or shows only lessons but not exercises/scenarios.
**Why it happens:** Authoring items[] with only lesson links and forgetting to add exercise/scenario entries.
**How to avoid:** For each TSA-* control (TSA-NetworkSeg, TSA-AccessControl, TSA-IR), items[] must include all 3 lessons + exercise + scenario = 5 items minimum. NIST-specific controls can have fewer items if they only align with specific lessons.

### Pitfall 7: scenario nextPhaseId mismatch
**What goes wrong:** Scenario fails to advance to phase-2 — both options have `nextPhaseId: null` or a typo.
**Why it happens:** Copy-paste from phase-2 (which correctly has null) to phase-1.
**How to avoid:** Phase-1 options always have `nextPhaseId: "phase-2"`. Phase-2 options always have `nextPhaseId: null`. `isFinal: true` only on phase-2.

---

## Code Examples

### Verified Lesson Frontmatter Pattern (from MOD-01)

```markdown
---
title: Introduction to Windows Event Logs
lessonId: intro
moduleId: logging-auditing
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-2, NIST-AU-3]
---
```

For a quiz-hosting lesson (Lesson 3 only):

```markdown
---
title: Configuring Audit Policies via Group Policy
lessonId: audit-policies
moduleId: logging-auditing
order: 3
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12, NIST-AU-2]
quizId: '01'
---
```

### Verified OT Callout Block Pattern (from MOD-01)

```markdown
> [!OT]
> In OT environments — HMI stations, SCADA servers, engineering workstations — {specific OT concern}. {Specific OT action or consideration}. NIST {control} still applies: {what it means in OT context}.
```

### Verified NERC CIP Disclaimer Pattern (from MOD-01 intro.md)

```markdown
> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-007 R5 event logging requirements are structurally similar to the TSA monitoring mandate and NIST AU-2.
```

### Verified modules-config.js Lesson Object Pattern (from MOD-01)

```javascript
{ id: 'intro',          title: 'Introduction to Windows Event Logs', scenarioId: '01' },
{ id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
{ id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
```

### Verified compliance-index.json Control Entry Pattern (from existing file)

```json
{
  "id": "TSA-Monitoring",
  "label": "TSA SD-02F — Continuous Monitoring",
  "items": [
    { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "intro",         "title": "Introduction to Windows Event Logs" },
    { "type": "lesson",   "moduleId": "logging-auditing", "contentId": "ps-logging",    "title": "Enabling PowerShell Script Block Logging" },
    { "type": "exercise", "moduleId": "logging-auditing", "contentId": "01",            "title": "Enable Script Block Logging" },
    { "type": "scenario", "moduleId": "logging-auditing", "contentId": "01",            "title": "Investigating a Suspicious Login" }
  ]
}
```

---

## Project Constraints (from CLAUDE.md)

- NERC CIP does NOT apply to pipeline operators — always framed as "reference benchmark only"
- TSA directive version string "SD-02F" sourced from compliance-refs.json — do not hardcode in prose
- No backend, no real PowerShell execution — this is a simulator
- PS version target: 5.1 (Windows built-in) — no PS 7 cmdlets
- Build: Vite required; CSS: Tailwind v4; Routing: hash-based
- All environment identifiers generic: PIPELINE-DC01, 10.0.0.0/24, ExampleCorp, svc-historian
- NERC CIP disclaimer verbatim: "NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark"
- "In OT environments:" callout required in every dual-use lesson

---

## Runtime State Inventory

Step 2.6 SKIPPED — this phase is code/content authoring with no external dependencies. No runtime state affected.

---

## Environment Availability

Step 2.6 SKIPPED — no external tools, services, runtimes, or CLIs beyond the project's own stack. All required tools (Node.js, Vite, Vitest) already confirmed working (167 tests GREEN). No new npm installs required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.6 |
| Config file | `vitest.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

Current baseline: 167 tests, 16 test files, all GREEN. [VERIFIED: ran `npm test`]

### What Needs Testing for Phase 7

Phase 7 is content-only. The existing test suite validates the engines that consume content. Content correctness is validated through:

1. **JSON schema validation** — JSON.parse() will fail on malformed JSON files at runtime; Vitest fixture tests validate schema shape via inline fixtures (not by reading actual files).
2. **Manual browser verification** — navigate to each new module and verify lessons render, exercises work, scenarios branch correctly.
3. **modules-config.js change** — existing `module-view.test.js` mocks MODULES, so no new unit tests required. The config change is functional and verified by browser testing.
4. **compliance-index.json change** — the `compliance-index-view.test.js` uses an inline fixture, not the actual file, so no existing test breaks from adding new entries.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| MOD-02 | Network Hardening module renders with 3 lessons, exercise, scenario, quiz | Smoke (browser) | `npm test` (schema only) | No dedicated test file needed — engines verified by existing tests |
| MOD-03 | Account & Access module renders fully | Smoke (browser) | `npm test` | Same as above |
| MOD-04 | Incident Response module renders fully | Smoke (browser) | `npm test` | Same as above |
| DATA-02 | NERC CIP framing in all lessons | Manual review | — | Grep search on authored files |
| DATA-03 | OT callout in every dual-use lesson | Manual review | — | Grep search on authored files |

### Sampling Rate

- **Per content file authored:** `npm test` — confirms no regressions in existing 167 tests
- **Per wave:** `npm test` — all 167 tests must stay GREEN
- **Phase gate:** `npm test` GREEN + manual browser verification of all 3 modules before `/gsd-verify-work`

### Recommended Wave 0 Data Validation Tests (optional but beneficial)

If the planner includes a Wave 0 for data validation, these test patterns from `compliance-refs.test.js` can be extended:

```javascript
// Pattern: read JSON file from disk, validate required fields
import { readFileSync } from 'fs'
const raw = readFileSync(resolve(__dirname, '../public/data/modules/network-hardening/quizzes/01.json'), 'utf-8')
const quiz = JSON.parse(raw)
expect(quiz.questions).toHaveLength(3)
expect(quiz.questions.every(q => q.answers.length === 4)).toBe(true)
expect(quiz.questions.every(q => q.answers.filter(a => a.correct).length === 1)).toBe(true)
```

This pattern validates schema correctness automatically without manual inspection. [ASSUMED — pattern not yet in codebase but directly mirrors compliance-refs.test.js approach]

### Wave 0 Gaps

If data-validation tests are added:
- [ ] `tests/content-schemas.test.js` — validates JSON schema shape for all 9 quiz/exercise/scenario files across the 3 new modules

If no data-validation tests are added (acceptable for this content-only phase):
- "None — existing engine tests cover runtime behavior; content correctness validated by browser verification"

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | No new user input paths (content files only) |
| V6 Cryptography | No | — |

**Security note:** Phase 7 creates static data files only. No new user input surfaces, no new fetch paths (all fetch patterns established in Phases 4–6 with safePath() validation already applied). No security controls need to change.

**One pre-existing security constraint that content must respect:** `esc()` is applied to all JSON string fields by the engines before innerHTML insertion. This means lesson prose, quiz text, and scenario narrative are all escaped at render time. Content authors do not need to pre-escape HTML — but they should not rely on raw HTML tags in JSON fields rendering as HTML (they won't).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lesson prose uses `> [!OT]` block syntax for OT callouts (inferred from MOD-01 pattern) | Code Examples | If lesson-view.js renders `[!OT]` differently from standard blockquote, callouts may not display as intended — low risk, visual only |
| A2 | DATA-01 (no hardcoded TSA version strings) permits using "TSA SD-02F" as a label in prose but prohibits it in frontmatter complianceTags | Common Pitfalls | If the rule is stricter, all lesson prose must avoid the version string entirely — medium risk |
| A3 | Data validation tests (tests/content-schemas.test.js) are optional for this phase | Validation Architecture | If planner treats nyquist_validation as requiring automated tests for content files, a Wave 0 test file would need to be added — low risk, easily added |
| A4 | NIST-AU-12 entry does not need to be backfilled with MOD-01's ps-logging.md items (per D-10 which scopes to incident-response only) | compliance-index.json | If reviewer expects NIST-AU-12 to also list MOD-01 content, the items[] array would be incomplete — low risk, clarified by D-11 |

---

## Open Questions (RESOLVED)

1. **Module-level module.json files**
   - What we know: MOD-01 has `public/data/modules/logging-auditing/module.json` with module metadata (title, description, lessons array)
   - What's unclear: Whether MOD-02/03/04 need their own module.json files, or whether modules-config.js is the only source of truth
   - Recommendation: Check if any code fetches module.json at runtime. Content-loader.js and lesson-view.js were not observed fetching module.json in the code review. Creating module.json files for completeness is safe but may not be required. The planner can omit them unless confirmed needed.
   - **RESOLVED: module.json files omitted from all plans — code reading confirmed no runtime fetch of module.json by content-loader.js, lesson-view.js, or any other engine. modules-config.js is the sole source of truth for module metadata.**

2. **NIST-AU-12 backfill for MOD-01**
   - What we know: MOD-01's ps-logging.md has `NIST-AU-12` in its complianceControls frontmatter, but compliance-index.json has no NIST-AU-12 entry yet
   - What's unclear: D-10 scopes NIST-AU-12 to incident-response. D-11 says compliance-refs.json is not modified. Neither D clarifies whether NIST-AU-12's items[] should include ps-logging from MOD-01.
   - Recommendation: When creating the NIST-AU-12 control entry, include both the incident-response ps-ir lesson AND the logging-auditing ps-logging lesson/exercise for completeness. This matches compliance-index.json's purpose (linking all content that covers a control).
   - **RESOLVED: NIST-AU-12 items[] will include both the incident-response ps-ir lesson AND the logging-auditing ps-logging lesson and exercise — MOD-01 ps-logging.md already carries NIST-AU-12 in complianceControls; the compliance index should reflect it. Plan 07-04 Task 2 updated accordingly.**

---

## Sources

### Primary (HIGH confidence)
- `public/data/modules/logging-auditing/lessons/intro.md` — canonical lesson Markdown + frontmatter format, OT callout syntax, NERC CIP disclaimer pattern
- `public/data/modules/logging-auditing/lessons/ps-logging.md` — exercise-hosting lesson format (no quizId in frontmatter)
- `public/data/modules/logging-auditing/lessons/audit-policies.md` — quiz-hosting lesson format (quizId: '01' in frontmatter)
- `public/data/modules/logging-auditing/quizzes/01.json` — complete quiz schema with all fields
- `public/data/modules/logging-auditing/exercises/01.json` — complete exercise schema including hintPatterns, successOutput
- `public/data/modules/logging-auditing/scenarios/01.json` — complete scenario schema including phases, options, nextPhaseId, isFinal
- `public/data/compliance-index.json` — current control entries (2 controls), confirmed items[] structure
- `public/data/compliance-refs.json` — confirmed structure; verified DO NOT MODIFY
- `src/modules-config.js` — current placeholder lesson arrays for MOD-02/03/04 (confirmed: 2 lessons each, no IDs)
- `src/views/module-view.js` — confirmed reads scenarioId/exerciseId from MODULES config, not from frontmatter
- `src/quiz-engine.js` — confirmed computeModuleProgress handles scenarioId branch correctly; no engine changes needed
- `.planning/phases/07-core-module-content-mod-02-mod-03-mod-04/07-CONTEXT.md` — locked decisions D-01 through D-12
- `npm test` output — confirmed 167 tests, 16 files, all GREEN

### Secondary (MEDIUM confidence)
- `tests/compliance-refs.test.js` — validated the pattern for data file schema tests (readFileSync approach)
- `vitest.config.js` — confirmed test runner configuration (happy-dom environment)
- `package.json` — confirmed `npm test` runs `vitest run`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing stack confirmed operational
- Architecture: HIGH — all schemas read directly from canonical files; no assumptions on data shapes
- Pitfalls: HIGH — verified from actual source code (frontmatter parsing in lesson-view.js, module config reading in module-view.js)
- Content topics: MEDIUM — PS 5.1 command accuracy for exercise steps relies on locked decisions in CONTEXT.md; not independently verified against live PS

**Research date:** 2026-05-16
**Valid until:** Phase 8 begins (content schemas are stable; no expiry concern for data file formats)
