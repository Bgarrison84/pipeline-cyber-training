---
phase: 02-content-loader-lesson-rendering-module-1
plan: "04"
id: 02-04
subsystem: module-1-content
tags: [wave-3, module-1, content-authoring, lesson-files, placeholder-json, compliance-controls]
dependency_graph:
  requires:
    - phase: 02-03
      provides: lesson-view.js full implementation ready to render lessons end-to-end
  provides:
    - public/data/modules/logging-auditing/module.json (module metadata, lesson IDs locked)
    - public/data/modules/logging-auditing/lessons/intro.md (Lesson 1: Introduction to Windows Event Logs)
    - public/data/modules/logging-auditing/lessons/ps-logging.md (Lesson 2: PowerShell Script Block Logging)
    - public/data/modules/logging-auditing/lessons/audit-policies.md (Lesson 3: Configuring Audit Policies)
    - public/data/modules/logging-auditing/quizzes/01.json (placeholder with one real question)
    - public/data/modules/logging-auditing/exercises/01.json (placeholder with one step)
    - public/data/modules/logging-auditing/scenarios/01.json (placeholder with one decision phase)
  affects:
    - Phase 3+ (lesson rendering pipeline fully exercisable end-to-end with real content)
    - Phase 4 (quiz engine can use quizzes/01.json as its first test case — Event ID 4104 question)
    - Phase 5 (terminal engine can use exercises/01.json as its first exercise scaffold)
    - Phase 6 (scenarios/01.json and complianceControls[] feed the compliance index)
    - Phases 7-8 (content authoring contract locked by these 7 files — all 5 modules follow same pattern)
tech-stack:
  added: []
  patterns:
    - "Lesson frontmatter: 6 fields (title, lessonId, moduleId, order, complianceTags, complianceControls) — D-02"
    - "OT callout authoring: > [!OT] blockquote syntax — D-03"
    - "Compliance control IDs: short-form human-readable strings (NIST-AU-2, TSA-Monitoring) — Phase 6 will normalize"
    - "Placeholder JSON: status=placeholder signals Phase 4/5/6 engines to skip interactive rendering"
    - "No SD-02F version literal in prose — directive name sourced from compliance-refs.json, lessons use TSA-Monitoring control ID"

key-files:
  created:
    - public/data/modules/logging-auditing/module.json
    - public/data/modules/logging-auditing/lessons/intro.md
    - public/data/modules/logging-auditing/lessons/ps-logging.md
    - public/data/modules/logging-auditing/lessons/audit-policies.md
    - public/data/modules/logging-auditing/quizzes/01.json
    - public/data/modules/logging-auditing/exercises/01.json
    - public/data/modules/logging-auditing/scenarios/01.json
  modified: []

key-decisions:
  - "Lesson filenames use lessonId without numeric prefix (intro.md, not 01-intro.md) — D-07 locks this; MODULES config IDs are authoritative"
  - "Word count target 400-600 words per D-08: intro 597, ps-logging 600, audit-policies 582 — all within range after trimming"
  - "NERC CIP scope callout included in intro.md per CLAUDE.md content rule — CIP-007 R5 referenced as maturity benchmark only"
  - "SD-02F never written as literal in lesson prose — only TSA-Monitoring control ID appears in complianceControls frontmatter array"
  - "placeholder status in JSON files signals Phase 4/5/6 engines to check status !== placeholder before rendering interactive content"

metrics:
  duration: "~15m"
  completed: "2026-05-12"
  tasks: 2
  files_created: 7
  files_modified: 0
---

# Phase 2 Plan 04: Module 1 Content Authoring — Summary

**All three Module 1 (Logging & Auditing) lessons authored with compliance controls, PS 5.1 code blocks, and OT callouts; module.json and three placeholder JSON files complete the content authoring contract for all five modules.**

## Performance

- **Duration:** ~15 minutes
- **Completed:** 2026-05-12
- **Tasks:** 2
- **Files created:** 7

## Accomplishments

### Task 1: Module.json and Lesson Files

- `module.json`: id=logging-auditing, lessons array contains `intro`, `ps-logging`, `audit-policies` (matching MODULES config IDs exactly — no numeric prefix per D-07)
- `intro.md` (597 words): Introduction to Windows Event Logs — 3 powershell code blocks (Get-WinEvent, Where-Object filter for 4625, Get-EventLog legacy), OT callout covering WELF-less collection, Event IDs table (4624/4625/4648/4672/4688), NERC CIP scope note
- `ps-logging.md` (600 words): PowerShell Script Block Logging — 4 powershell code blocks (Get-ItemProperty check, New-Item key creation, Set-ItemProperty enable, Get-WinEvent verification for Event ID 4104), OT callout for air-gapped environments, Module/Transcription logging mention
- `audit-policies.md` (582 words): Configuring Audit Policies — 4 code blocks including 2 auditpol commands and Get-GPO query, OT callout for workgroup/air-gapped domain with Backup-GPO/Restore-GPO, subcategory table

All lessons:
- Use `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp` identifiers only
- No `SD-02F` literal in prose — control IDs use `TSA-Monitoring` shorthand
- Frontmatter has all 6 D-02 fields: `complianceTags: [TSA, NIST]` drives badge display
- At least one `> [!OT]` callout per lesson (D-03 canonical pattern)
- 3-5 PS 5.1 code blocks per lesson (D-08)

### Task 2: Placeholder JSON Files

- `quizzes/01.json`: status=placeholder; one real question (q-01) about Event ID 4104 with 4 answer options and per-answer feedback; complianceControls NIST-AU-12
- `exercises/01.json`: status=placeholder; step-1 checks ScriptBlockLogging registry key existence using regex pattern; successOutput is realistic PS error message format; context is PIPELINE-DC01
- `scenarios/01.json`: status=placeholder; narrative of 47 failed logons + suspicious success on PIPELINE-DC01 at 03:42 UTC; phase-1 decision between disabling account (incorrect) vs. querying event log first (correct)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create module.json and lesson files | 6150a38 | public/data/modules/logging-auditing/module.json, lessons/{intro,ps-logging,audit-policies}.md |
| 1 (fix) | Trim lessons to 400-600 word target | 0c75d00 | lessons/{intro,ps-logging,audit-policies}.md |
| 2 | Create placeholder JSON files | 4e90146 | quizzes/01.json, exercises/01.json, scenarios/01.json |

## Files Created

| File | Lines | Key Content |
|------|-------|-------------|
| `public/data/modules/logging-auditing/module.json` | 13 | Module metadata, lesson ID array |
| `public/data/modules/logging-auditing/lessons/intro.md` | 73 | 3 PS code blocks, Event IDs table, OT callout, NERC CIP note |
| `public/data/modules/logging-auditing/lessons/ps-logging.md` | 87 | 4 PS code blocks, registry path, Event ID 4104, OT callout |
| `public/data/modules/logging-auditing/lessons/audit-policies.md` | 78 | 4 code blocks (2 auditpol), OT callout with Backup-GPO, subcategory table |
| `public/data/modules/logging-auditing/quizzes/01.json` | 29 | status=placeholder, Event ID 4104 question, 4 answers with feedback |
| `public/data/modules/logging-auditing/exercises/01.json` | 25 | status=placeholder, regex pattern, realistic PS error output |
| `public/data/modules/logging-auditing/scenarios/01.json` | 28 | status=placeholder, PIPELINE-DC01 incident narrative, 2-option decision |

## Decisions Made

- **Lesson filenames without numeric prefix** — `intro.md`, `ps-logging.md`, `audit-policies.md` match MODULES config IDs. The CLAUDE.md architecture diagram showing `01-intro.md` was superseded by the locked MODULES config (D-07). MODULES config is authoritative.
- **SD-02F not in prose** — The TSA directive version string lives in `public/data/compliance-refs.json`. Lesson prose references "the current TSA pipeline security directive" or uses the control ID `TSA-Monitoring`. This satisfies CLAUDE.md's "never hardcoded" rule and means no lesson file needs updating when the directive version changes.
- **complianceControls short-form strings** — `NIST-AU-2`, `NIST-AU-12`, `NIST-CM-6`, `TSA-Monitoring` are the human-readable control IDs stored in frontmatter. Phase 6 will define canonical format on read; the short-form is adequate per RESEARCH.md assumption A2.
- **placeholder status in JSON** — All three JSON files have `"status": "placeholder"` at the top level. Phase 4, 5, and 6 engines must check `status !== 'placeholder'` before rendering interactive content. The quiz has one real question to serve as the Phase 4 engine test case.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Lesson word counts exceeded 400-600 word D-08 target**
- **Found during:** Task 1 done-criteria verification (word count check)
- **Issue:** Initial lesson drafts were 683 (intro), 715 (ps-logging), and 824 (audit-policies) words — all exceeding the 600-word ceiling specified in D-08 and the done criteria
- **Fix:** Targeted trimming passes on each lesson: condensed list prose to inline format, shortened OT callouts to essential content, trimmed connector sentences. All three lessons reached 400-600 word range (597, 600, 582)
- **Files modified:** All three lesson .md files
- **Commit:** 0c75d00

## Known Stubs

The three placeholder JSON files (`quizzes/01.json`, `exercises/01.json`, `scenarios/01.json`) have `"status": "placeholder"` and are intentional stubs. They:
- Will NOT render interactive content until Phase 4/5/6 engines are built and the status is changed
- Exist to enable HEAD fetch availability checks to return 200 (sidebar activation works)
- Provide the schema contract that Phase 4/5/6 will implement

These stubs are intentional and documented. The quiz placeholder includes one real question that serves as the Phase 4 engine integration test case.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. All content files are static data served from `public/data/` — read-only by the browser fetch pipeline. Lesson markdown is repository-authored (not user input); XSS via marked.js is not a practical risk for this static content source.

## Self-Check

Files verified:
- [x] public/data/modules/logging-auditing/module.json — FOUND (JSON valid, id=logging-auditing, lessons=[intro, ps-logging, audit-policies])
- [x] public/data/modules/logging-auditing/lessons/intro.md — FOUND (complianceTags present, 1 OT callout, 3 powershell blocks)
- [x] public/data/modules/logging-auditing/lessons/ps-logging.md — FOUND (ScriptBlockLogging registry path present, 1 OT callout, 4 powershell blocks)
- [x] public/data/modules/logging-auditing/lessons/audit-policies.md — FOUND (auditpol command present, 1 OT callout, 4 code blocks)
- [x] public/data/modules/logging-auditing/quizzes/01.json — FOUND (JSON valid, status=placeholder, 1 question)
- [x] public/data/modules/logging-auditing/exercises/01.json — FOUND (JSON valid, status=placeholder, 1 step)
- [x] public/data/modules/logging-auditing/scenarios/01.json — FOUND (JSON valid, status=placeholder, 1 phase)

Commits verified:
- [x] 6150a38 — feat(02-04): create Module 1 module.json and all three lesson files
- [x] 4e90146 — feat(02-04): create quiz, exercise, and scenario placeholder JSON files for Module 1
- [x] 0c75d00 — fix(02-04): trim Module 1 lessons to 400-600 word target per D-08

Test results:
- [x] npm test: 26 tests GREEN, 1 todo, 5 test files all pass
- [x] No SD-02F hardcoded in lesson prose
- [x] All lesson word counts within 400-600 range
- [x] complianceTags present in all 3 lesson frontmatters
- [x] OT callouts present in all 3 lessons
- [x] module.json lesson IDs match MODULES config (intro, ps-logging, audit-policies)

## Self-Check: PASSED

---

*Phase: 02-content-loader-lesson-rendering-module-1*
*Completed: 2026-05-12*
