# Phase 9: Compliance Currency + Content Depth — Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 22 (10 lesson .md, 5 quiz .json, 5 scenario .json, badge.js, style.css, modules-config.js, compliance-refs.json, tests/badge-expired.test.js, tests/compliance-refs.test.js extensions, docs/SME-REVIEW-CHECKLIST.md, CLAUDE.md)
**Analogs found:** 22 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/badge.js` | utility / renderer | request-response | `src/badge.js` (self — add branch) | self-modification |
| `src/style.css` | config / theme | — | `src/style.css` lines 16–20 (badge block) | self-modification |
| `src/modules-config.js` | config / registry | — | `src/modules-config.js` lines 15–19 (lessons array) | self-modification |
| `public/data/compliance-refs.json` | data / config | — | `public/data/compliance-refs.json` lines 5–11 (TSA block) | self-modification |
| `public/data/modules/*/lessons/0N-*.md` (×10) | content / lesson | request-response | `public/data/modules/logging-auditing/lessons/audit-policies.md` | exact |
| `public/data/modules/*/quizzes/02.json` (×5) | content / quiz | request-response | `public/data/modules/logging-auditing/quizzes/01.json` | exact |
| `public/data/modules/*/scenarios/02.json` (×4) + `04.json` (patch) | content / scenario | event-driven | `public/data/modules/patch-management/scenarios/02.json` | exact |
| `tests/badge-expired.test.js` | test | — | `tests/compliance-refs.test.js` + `tests/scenario-view.test.js` | role-match |
| `docs/SME-REVIEW-CHECKLIST.md` | documentation | — | no analog (no existing docs/) | none |
| `CLAUDE.md` | documentation | — | `CLAUDE.md` lines 19 (marked.js version string) | self-modification |

---

## Pattern Assignments

### `src/badge.js` — add expired-state branch

**Analog:** `src/badge.js` (self, full file, 23 lines)

**Current implementation** (lines 1–22):
```javascript
// src/badge.js — standalone badge renderer, no circular deps
import { esc } from './utils/escape.js';

let _complianceRefs = null;

export function setComplianceRefs(refs) {
  _complianceRefs = refs;
}

export function renderBadge(directiveKey) {
  const shortName = _complianceRefs?.directives?.[directiveKey]?.shortName
    ?? directiveKey;

  const colorClasses = {
    TSA:  'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  const safeClasses = colorClasses[directiveKey] ?? '';
  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${esc(safeClasses)}">${esc(shortName)}</span>`;
}
```

**What to add — expired-state branch** (insert after `shortName` read, before `colorClasses`):
```javascript
export function renderBadge(directiveKey) {
  const directive = _complianceRefs?.directives?.[directiveKey];
  const shortName = directive?.shortName ?? directiveKey;
  const status    = directive?.status ?? 'active';

  const expiredClasses = 'bg-[var(--color-badge-expired-bg)] text-[var(--color-badge-expired-text)]';

  const colorClasses = {
    TSA:  'bg-[var(--color-badge-tsa-bg)] text-[var(--color-badge-tsa-text)]',
    NIST: 'bg-[var(--color-badge-nist-bg)] text-[var(--color-badge-nist-text)]',
  };

  if (status === 'expired') {
    const safeClasses = esc(expiredClasses);
    const safeName    = esc(shortName);
    return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${safeClasses}" title="${safeName} — expired" aria-label="${safeName} expired"><span style="text-decoration: line-through;">${safeName}</span> [EXPIRED]</span>`;
  }

  const safeClasses = colorClasses[directiveKey] ?? '';
  return `<span class="inline-block rounded px-2 py-0.5 font-mono text-[var(--text-mono)] ${esc(safeClasses)}">${esc(shortName)}</span>`;
}
```

**Key rules:**
- Read `directive` in one go, derive both `shortName` and `status` from it (single optional-chain)
- Default `status` to `'active'` if field absent — NIST badge has no `status` field and must be unaffected
- Expired HTML uses `<span style="text-decoration: line-through;">` (inline style — not a Tailwind class) inside the outer span
- `title` and `aria-label` attributes are required by UI-SPEC
- Active branch is **unchanged** — the return statement at the bottom of the function is identical to the current line 21

---

### `src/style.css` — add 2 expired badge CSS custom properties

**Analog:** `src/style.css` lines 16–20 (badge block)

**Existing badge block** (lines 16–20):
```css
/* Badge colors */
--color-badge-tsa-bg: #1e3a5f;
--color-badge-tsa-text: #93c5fd;
--color-badge-nist-bg: #1a3a2a;
--color-badge-nist-text: #86efac;
```

**What to add** — append two lines after `--color-badge-nist-text`:
```css
--color-badge-expired-bg: #2a2a2a;
--color-badge-expired-text: #737373;
```

**Note:** `#2a2a2a` is `--color-bg-secondary` and `#737373` is `--color-text-muted`. The expired badge intentionally reuses the muted palette to appear visually de-emphasized. These are new named variables rather than referencing the existing ones to avoid Tailwind `@theme` circular dependency.

---

### `src/modules-config.js` — add 10 new lesson registrations

**Analog:** `src/modules-config.js` lines 15–19 (logging-auditing lessons array, full module block lines 8–21)

**Existing lessons array shape** (lines 15–19):
```javascript
lessons: [
  { id: 'intro',          title: 'Introduction to Windows Event Logs', scenarioId: '01' },
  { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
  { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
],
```

**Four lesson entry shapes — use the appropriate one per new lesson:**
```javascript
// Lesson backed by a quiz (lesson-view.js calls renderQuiz after markdown):
{ id: 'new-policy-lesson', title: 'Advanced Policy Review', quizId: '02' }

// Lesson backed by a scenario (route #/scenario/:moduleId/:scenarioId):
{ id: 'new-ot-lesson', title: 'OT Security Deep Dive', scenarioId: '02' }

// Lesson backed by an exercise:
{ id: 'new-ps-lesson', title: 'PowerShell OT Hardening', exerciseId: '02' }

// Pure reading lesson (completes on visit):
{ id: 'new-concepts-lesson', title: 'Advanced Concepts' }
```

**Critical wiring rule:**
- The quiz lesson MUST have `quizId: '02'` in both the MODULES array entry AND the lesson .md frontmatter
- The scenario lesson MUST have `scenarioId` matching the scenario file's id (e.g., `'02'`)
- Every new `{ id: ... }` must exactly match the `lessonId:` field in the corresponding .md file

**New scenario IDs per module:**
- logging-auditing: `'02'`
- network-hardening: `'02'`
- account-access: `'02'`
- incident-response: `'02'`
- patch-management: `'04'`

---

### `public/data/compliance-refs.json` — add expired state fields to TSA entry

**Analog:** `public/data/compliance-refs.json` lines 5–11 (TSA block, full file 19 lines)

**Current TSA block** (lines 5–11):
```json
"TSA": {
  "name": "TSA Security Directive Pipeline-2021-02F",
  "shortName": "TSA SD-02F",
  "effectiveDate": "2025-05-03",
  "expiryDate": "2026-05-02",
  "sourceUrl": "https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf"
}
```

**Updated TSA block** — add `"status": "expired"` field. Also update `"lastVerified"` at top level:
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
    "NIST": {
      "name": "NIST Special Publication 800-82 Revision 3",
      "shortName": "NIST SP 800-82 Rev 3",
      "publishedDate": "2023-09",
      "sourceUrl": "https://csrc.nist.gov/pubs/sp/800/82/r3/final"
    }
  }
}
```

**Rules:**
- `"status": "expired"` — exact field name and value badge.js reads (`directive?.status`)
- `"expiryDate"` already present (line 9) — no change needed there
- NIST block is unchanged — has no `status` field; badge.js defaults to `'active'` when absent
- Do NOT add a successor version string until TSA.gov is manually checked — leave NIST block as-is

---

### `public/data/modules/*/lessons/0N-*.md` (×10) — new lesson files

**Analog:** `public/data/modules/logging-auditing/lessons/audit-policies.md` (full file, 85 lines)

**Frontmatter schema** (lines 1–9 of audit-policies.md — the quiz-bearing lesson):
```yaml
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

**Frontmatter schema for intro-type lesson without quiz** (lines 1–8 of intro.md):
```yaml
---
title: Introduction to Windows Event Logs
lessonId: intro
moduleId: logging-auditing
order: 1
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-2, NIST-AU-3]
---
```

**New Phase 9 frontmatter** — add `lastReviewed` and `reviewer` fields to ALL new lessons:
```yaml
---
title: {Human-readable lesson title}
lessonId: {matches id in MODULES lessons array}
moduleId: {matches module id in MODULES}
order: {integer — 4 for first new lesson, 5 for second, per module}
complianceTags: [TSA, NIST]
complianceControls: [TSA-Monitoring, NIST-AU-12]
quizId: '02'          # ONLY if this lesson owns quizzes/02.json
lastReviewed: ''
reviewer: ''
---
```

**OT callout block pattern** (audit-policies.md lines 68–70):
```markdown
> [!OT]
> In isolated OT environments without domain connectivity — workgroup machines or OT systems on an air-gapped network — Group Policy does not apply. Configure audit policies directly with `auditpol` on each OT workstation.
```

**NERC CIP disclaimer pattern** (intro.md line 68):
```markdown
> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark. CIP-007 R5 event logging requirements are structurally similar to the TSA monitoring mandate and NIST AU-2.
```

**Content rules for every new lesson:**
- Must contain at least one `> [!OT]` callout block (content-loader.js renders it as `<aside class="ot-callout">`)
- PowerShell code blocks use ` ```powershell ` fencing
- Compliance references use generic "current TSA pipeline security directive" — never hardcode "SD-02F" or any specific version string
- Generic environment identifiers: `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp`
- NERC CIP references include the standard disclaimer (copy exact wording from intro.md line 68)
- `order` field: existing lessons are 1–3; new lessons are 4 and 5 per module

---

### `public/data/modules/*/quizzes/02.json` (×5) — new quiz files

**Analog:** `public/data/modules/logging-auditing/quizzes/01.json` (full file, 112 lines)

**Top-level structure** (lines 1–5):
```json
{
  "id": "logging-auditing-quiz-01",
  "moduleId": "logging-auditing",
  "title": "Logging & Auditing Knowledge Check",
  "questions": [
```

**New file id pattern:** `"{moduleId}-quiz-02"`, title: `"{Module Name} — Advanced Knowledge Check"`

**Single question structure** (lines 7–40):
```json
{
  "id": "q-01",
  "type": "multiple-choice",
  "stem": "Which PowerShell Event ID captures the full content of executed script blocks?",
  "complianceControls": [
    "NIST-AU-12"
  ],
  "answers": [
    {
      "id": "a",
      "text": "4624",
      "correct": false,
      "feedback": "Event ID 4624 is a successful logon event, not script block logging."
    },
    {
      "id": "b",
      "text": "4104",
      "correct": true,
      "feedback": "Correct. Event ID 4104 in the PowerShell/Operational log captures script block content when Script Block Logging is enabled."
    },
    {
      "id": "c",
      "text": "4688",
      "correct": false,
      "feedback": "Event ID 4688 logs process creation, not PowerShell script block content."
    },
    {
      "id": "d",
      "text": "7045",
      "correct": false,
      "feedback": "Event ID 7045 logs new service installation, not PowerShell activity."
    }
  ],
  "explanation": "Script Block Logging (Event ID 4104) captures the full text of all PowerShell script blocks to the Microsoft-Windows-PowerShell/Operational log."
}
```

**Rules:**
- Each 02.json needs ≥3 questions (`q-01`, `q-02`, `q-03` minimum)
- Every answer object has exactly 4 keys: `"id"`, `"text"`, `"correct"`, `"feedback"`
- Exactly one answer per question has `"correct": true`
- `"explanation"` is a required top-level field on the question (shown after answering regardless of correct/incorrect)
- `"complianceControls"` is an array; use TSA and/or NIST control IDs
- Do NOT append to 01.json — prior completers' stored `total` count would mismatch
- Do NOT use "TSA SD-02F" in stem, answers, or explanation — use "current TSA pipeline security directive"

---

### `public/data/modules/*/scenarios/02.json` (×4) + `04.json` (patch-management) — new scenario files

**Analog:** `public/data/modules/patch-management/scenarios/02.json` (full file, 55 lines) — 2-phase linear scenario with OT-specific context

**Also relevant:** `public/data/modules/logging-auditing/scenarios/01.json` — 2-phase linear scenario pattern (all options in phase-1 point to same phase-2)

**Full top-level structure** (patch-management/scenarios/02.json lines 1–6):
```json
{
  "id": "patch-management-scenario-02",
  "moduleId": "patch-management",
  "title": "Maintenance Window vs. Ops Manager Pressure",
  "complianceControls": ["TSA-PatchMgmt", "NIST-MA-2"],
  "narrative": "Context paragraph.\n\nIn OT environments: OT-specific context callout.",
```

**Phase-1 decision structure** (lines 7–31):
```json
{
  "id": "phase-1",
  "type": "decision",
  "title": "Scheduling",
  "isFinal": false,
  "prompt": "Decision prompt text.",
  "options": [
    {
      "id": "opt-a",
      "text": "Option A text",
      "outcome": "Outcome explanation.",
      "correct": false,
      "nextPhaseId": "phase-2"
    },
    {
      "id": "opt-b",
      "text": "Option B text",
      "outcome": "Outcome explanation.",
      "correct": true,
      "nextPhaseId": "phase-2"
    }
  ]
}
```

**Final phase structure** (lines 32–54 — `isFinal: true`, `nextPhaseId: null`):
```json
{
  "id": "phase-2",
  "type": "decision",
  "title": "Maintenance Window",
  "isFinal": true,
  "prompt": "Follow-up decision prompt.",
  "options": [
    {
      "id": "opt-a",
      "text": "Option A",
      "outcome": "Outcome explanation.",
      "correct": false,
      "nextPhaseId": null
    },
    {
      "id": "opt-b",
      "text": "Option B",
      "outcome": "Outcome explanation.",
      "correct": true,
      "nextPhaseId": null
    }
  ]
}
```

**OT/IT branching variant** — for Phase 9 advanced scenarios where opt-a and opt-b lead to different outcomes, use two separate final phases:
```json
{ "id": "opt-a", "nextPhaseId": "phase-2-it" },
{ "id": "opt-b", "nextPhaseId": "phase-2-ot" }
```
Then add both `phase-2-it` (isFinal: true) and `phase-2-ot` (isFinal: true) to the phases array.

**Validation rules:**
- Every non-null `nextPhaseId` must match an `id` field on some phase in the `phases` array — validateScenario() rejects silently on typo
- Final phases set `nextPhaseId: null` on all options
- `isFinal: true` triggers `completeScenario()` — set only on terminal phases
- Narrative must include OT context: `"In OT environments: ..."` as second paragraph (or embedded)
- Do NOT use "TSA SD-02F" in narrative, prompt, or outcome — use "current TSA pipeline security directive"

---

### `tests/badge-expired.test.js` — new test file (no existing analog — closest: compliance-refs.test.js + scenario-view.test.js)

**Analog 1 — import/describe pattern** (`tests/compliance-refs.test.js` lines 1–14):
```javascript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
// ...
describe('compliance-refs.json', () => {
  it('has schemaVersion equal to 1', () => {
    expect(refs.schemaVersion).toBe(1)
  })
```

**Analog 2 — mock pattern for badge.js** (`tests/scenario-view.test.js` lines 11–28 show the vi.mock structure; for badge-expired.test.js we import badge.js directly and call setComplianceRefs):
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setComplianceRefs, renderBadge } from '../src/badge.js'

describe('badge.js renderBadge()', () => {
  beforeEach(() => {
    setComplianceRefs({
      directives: {
        TSA: { shortName: 'TSA SD-02F', status: 'expired' },
        NIST: { shortName: 'NIST SP 800-82 Rev 3' },
      }
    })
  })

  it('renders expired TSA badge with strikethrough and [EXPIRED]', () => {
    const html = renderBadge('TSA')
    expect(html).toContain('text-decoration: line-through')
    expect(html).toContain('[EXPIRED]')
  })

  it('renders active NIST badge without [EXPIRED] when no status field', () => {
    const html = renderBadge('NIST')
    expect(html).not.toContain('[EXPIRED]')
    expect(html).toContain('NIST SP 800-82 Rev 3')
  })
})
```

---

### `CLAUDE.md` — housekeeping update

**Location of change:** Line 19 — `**Markdown:** marked.js v17`

**Current text (line 19):**
```
**Markdown:** marked.js v17
```

**New text:**
```
**Markdown:** marked.js v18 (installed: v18.0.3)
```

---

### `docs/SME-REVIEW-CHECKLIST.md` — new file, no analog

See "No Analog Found" section below. Structure is defined in RESEARCH.md Section "SME Review Checklist Structure."

---

## Shared Patterns

### Content Version String — apply to ALL new lesson, quiz, and scenario files
**Rule:** Never write "TSA SD-02F" (or any specific version designator) in content files. Use the generic phrase:
- In prose: `"current TSA pipeline security directive"`
- In quiz stems/answers/feedback: `"current TSA pipeline security directive"`
- In scenario narrative/outcome: `"current TSA pipeline security directive"`

**Source of truth:** `public/data/compliance-refs.json` — version strings only live here and are injected by `renderBadge()` at render time.

---

### OT Callout Block — apply to ALL new lesson .md files
**Source:** `public/data/modules/logging-auditing/lessons/intro.md` lines 51–52; `audit-policies.md` lines 68–70

```markdown
> [!OT]
> In OT environments — HMI stations, SCADA servers, engineering workstations — [OT-specific content here]. NIST [control] still applies: [requirement statement].
```

content-loader.js renders `> [!OT]` blockquotes as `<aside class="ot-callout">`. Every new lesson must have at least one.

---

### NERC CIP Disclaimer — apply to ALL new lesson .md files that mention NERC CIP
**Source:** `public/data/modules/logging-auditing/lessons/intro.md` line 68

```markdown
> **NERC CIP scope note:** NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark.
```

Copy this exact phrasing — do not paraphrase.

---

### modules-config.js Atomic Update — apply whenever a lesson .md is created
**Rule:** Every commit that creates a lesson .md file must also update the MODULES array in `src/modules-config.js` with the matching `{ id: '...', ... }` entry.

**Source:** `src/modules-config.js` lines 15–19 (lessons array pattern).

The `id` value in MODULES must exactly match the `lessonId:` in the .md frontmatter.

---

### Quiz/Scenario Wiring Integrity
- Quiz: `quizId: '02'` must appear in BOTH the lesson's .md frontmatter AND the MODULES array entry
- Scenario: `scenarioId: 'N'` in MODULES must match the scenario JSON's top-level `"id"` field (`"{moduleId}-scenario-N"`)
- Scenario: Every non-null `nextPhaseId` must resolve to a real phase `id` before committing

---

### Test Pattern — Vitest + happy-dom
**Source:** `tests/compliance-refs.test.js` lines 1–5 (import pattern); `tests/quiz-engine.test.js` lines 9–55 (vi.mock + beforeEach pattern)

```javascript
// Standard import header for all test files
import { describe, it, expect, beforeEach, vi } from 'vitest'
// vi.mock() calls BEFORE any imports that depend on them (Vitest hoisting)
// afterEach: vi.unstubAllGlobals(); vi.clearAllMocks()
```

---

## Remediation Patterns (SME-01 hardcode fixes)

### logging-auditing/quizzes/01.json — q-03 SD-02F fix
**Location:** Lines 79–110 — `stem`, 4 answer `feedback` strings, and `explanation` all contain "TSA SD-02F"

**Pattern:** Replace all literal "TSA SD-02F" in q-03 with "current TSA pipeline security directive"

Example stem replacement:
```
"stem": "Under TSA SD-02F, what is the minimum retention period..."
→
"stem": "Under the current TSA pipeline security directive, what is the minimum retention period..."
```

Apply same replacement to all 4 answer feedback strings and the explanation on that question.

### logging-auditing/scenarios/01.json — phase-2 SD-02F fix
**Location:** Lines 41–42 and 47–48 — both option outcomes contain "TSA SD-02F"

```
"outcome": "...TSA SD-02F incident notification requirements..."
→
"outcome": "...current TSA pipeline security directive incident notification requirements..."
```

### src/views/compliance-index-view.js — line 123 SD-02F fix
**Location:** Line 123 — static string contains "Every TSA SD-02F and NIST SP 800-82 Rev 3 control..."

**Replacement:** `"Every TSA pipeline security directive and NIST SP 800-82 Rev 3 control..."`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `docs/SME-REVIEW-CHECKLIST.md` | documentation | — | No existing `docs/` directory; no prior human-facing checklists in the project. Structure defined in RESEARCH.md Section "SME Review Checklist Structure" — use that spec directly. Required structure: H1 title, 5 module sections (H2), each with a Markdown table per artifact type (Lessons, Quizzes, Exercises, Scenarios) with columns: File, Last Reviewed, Reviewer. |

---

## Metadata

**Analog search scope:** `src/`, `public/data/`, `tests/`
**Files scanned:** 8 source/data files read directly; 17 test files discovered via glob
**Pattern extraction date:** 2026-05-17

**Analog file list (read during this session):**
- `src/badge.js` — full file (23 lines)
- `src/modules-config.js` — full file (79 lines)
- `src/style.css` — lines 1–30 (badge block at lines 16–20)
- `public/data/compliance-refs.json` — full file (19 lines)
- `public/data/modules/logging-auditing/lessons/intro.md` — full file (71 lines)
- `public/data/modules/logging-auditing/lessons/audit-policies.md` — full file (85 lines)
- `public/data/modules/logging-auditing/quizzes/01.json` — full file (112 lines)
- `public/data/modules/logging-auditing/scenarios/01.json` — full file (55 lines)
- `public/data/modules/patch-management/scenarios/02.json` — full file (55 lines)
- `tests/compliance-refs.test.js` — full file (35 lines)
- `tests/quiz-engine.test.js` — lines 1–119 (mock + beforeEach structure)
- `tests/scenario-view.test.js` — lines 1–60 (mock + fixture structure)
