---
phase: 02-content-loader-lesson-rendering-module-1
verified: 2026-05-14T13:05:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to #/lesson/logging-auditing/intro in a running dev server"
    expected: "Lesson renders with a visible 'TSA SD-02F' and 'NIST SP 800-82 Rev 3' badge row, syntax-highlighted PS code blocks (keywords/strings/cmdlets in distinct colors), and a working copy-to-clipboard button on each code block that copies raw code with no HTML entities"
    why_human: "Shiki rendering output and clipboard behavior require a live browser with DOM and the Clipboard API — cannot be asserted programmatically without a full E2E test runner"
  - test: "Inspect the OT callout rendered from "> [!OT]" syntax in any lesson"
    expected: "An amber-bordered aside element appears with the 'IN OT ENVIRONMENTS' label and the full callout body text visible (not empty, not truncated)"
    why_human: "Visual correctness and body-text presence of the OT callout requires DOM inspection in a browser; the CR-02 fix is code-verified but visual fidelity of the rendered aside needs eyes-on confirmation"
  - test: "Navigate away from a lesson and back to verify prev/next footer"
    expected: "First lesson (intro) has no prev link (spacer div only); middle lesson (ps-logging) shows both prev/next; last lesson (audit-policies) has no next link"
    why_human: "Multi-step navigation interaction can only be confirmed in a live browser session"
---

# Phase 2: Content Loader + Lesson Rendering + Module 1 Verification Report

**Phase Goal:** Real lesson content is fetched, rendered with syntax highlighting, and readable — the content authoring contract is locked for all five modules
**Verified:** 2026-05-14T13:05:00Z
**Status:** HUMAN_NEEDED — all 5/5 automated truths verified; 3 browser-level behaviors require human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Navigating to any Logging & Auditing lesson fetches and renders its Markdown body in-browser without a rebuild step | VERIFIED | `src/content-loader.js` exports `fetchLesson` (fetch + Map cache), `parseFrontmatter`, `renderMarkdown`; `src/views/lesson-view.js` async pipeline: skeleton → fetchLesson → parseFrontmatter → renderMarkdown → app.innerHTML; `src/router.js` routes `#/lesson/:moduleId/:lessonId` to `renderLesson`; all three lesson .md files exist at `public/data/modules/logging-auditing/lessons/` |
| 2 | PowerShell code blocks display with full PS 5.1 syntax highlighting (keywords, strings, cmdlets visually distinct) using Shiki | VERIFIED | `src/content-loader.js` lines 14–59: Shiki singleton via Promise-cached `getHighlighter()`; `marked.use({ async: true, walkTokens })` runs Shiki in the async walk phase; `token.shikiHtml` set per code block; synchronous `code()` renderer reads it; `github-dark` theme with `powershell` lang; spot-check confirms `parseFrontmatter` and `getLessonNav` work correctly (behavioral tests passing) |
| 3 | Every code block has a working one-click copy-to-clipboard button; copied text matches raw code exactly | VERIFIED | `code()` renderer (content-loader.js:62-73) emits `.code-copy-btn` with `data-code="${esc(token.text)}"`; `attachCopyHandlers()` (lesson-view.js:179-212) uses event delegation on `.lesson-wrapper`, reads `btn.dataset.code` (browser HTML-decodes entities → raw code), calls `navigator.clipboard.writeText(code)`; `npm test` lesson-view tests GREEN: code-copy-btn present in rendered HTML |
| 4 | Each lesson displays TSA SD-02F and/or NIST SP 800-82 Rev 3 control IDs sourced from compliance-refs.json, not hardcoded in Markdown prose | VERIFIED | `public/data/compliance-refs.json` is the single source (TSA shortName "TSA SD-02F", NIST shortName "NIST SP 800-82 Rev 3"); `badge.js` reads `_complianceRefs?.directives?.[key]?.shortName`; `main.js` loads compliance-refs.json and calls `setComplianceRefs()`; lesson frontmatter has `complianceTags: [TSA, NIST]` in all 3 lessons; `buildLessonHtml` calls `renderBadge(tag)` for each tag; no "SD-02F" literal found in any lesson .md prose body (grep returned 0 matches) |
| 5 | Module 1 (Logging & Auditing) is complete: all core lessons authored, at least one quiz placeholder, one terminal exercise placeholder, one scenario placeholder; all map to correct compliance control IDs | VERIFIED | All 7 files confirmed in `public/data/modules/logging-auditing/`: module.json (id=logging-auditing, lessons=[intro, ps-logging, audit-policies] matching MODULES config); intro.md (3 powershell blocks, OT callout, complianceTags [TSA,NIST]); ps-logging.md (4 powershell blocks, OT callout); audit-policies.md (4 code blocks, OT callout); quizzes/01.json (status=placeholder, 1 real q-01); exercises/01.json (status=placeholder, PIPELINE-DC01 context); scenarios/01.json (status=placeholder, PIPELINE-DC01 incident narrative) |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/content-loader.js` | fetch+parse+render pipeline | VERIFIED | 247 lines; exports parseFrontmatter, renderMarkdown, fetchLesson, checkLessonAvailability, getLessonNav, getHighlighter; WR-01 guard (typeof raw !== 'string'); WR-02 empty YAML array guard (inner === ''); WR-03 Promise-cached Shiki singleton |
| `src/views/lesson-view.js` | async lesson view renderer | VERIFIED | 249 lines; exports async renderLesson; helpers: renderLessonLoading, buildLessonHtml, buildLessonFooter, attachCopyHandlers, renderLessonNotFound, renderLessonError; CR-01 fix: returns null sentinel so router checks `if (viewHtml !== null)` before setting innerHTML |
| `src/router.js` | lesson route activated | VERIFIED | Contains `#/lesson/:moduleId/:lessonId` route; handleRoute is async; CR-01 fix: `if (viewHtml !== null)` guard prevents overwriting lesson view |
| `src/sidebar.js` | async initSidebar + setActiveLesson | VERIFIED | initSidebar is async; parallel HEAD-fetch availability via Promise.all; setActiveLesson exported; WR-04 fix: `if (!sidebarModules) return` null-guard at line 9; `if (toggleBtn && shell)` null-guard at line 54 |
| `src/main.js` | lucide npm import + activateIcons | VERIFIED | Named imports from 'lucide' (not CDN); exports activateIcons; no `typeof lucide` check remains anywhere in src/ |
| `public/data/modules/logging-auditing/module.json` | Module metadata JSON | VERIFIED | Valid JSON; id="logging-auditing"; lessons=[{id:"intro"},{id:"ps-logging"},{id:"audit-policies"}] matching MODULES config |
| `public/data/modules/logging-auditing/lessons/intro.md` | Lesson 1: Intro to Windows Event Logs | VERIFIED | Contains Get-WinEvent; complianceTags: [TSA, NIST]; 1 OT callout; 3 powershell code blocks; NERC CIP scope note; no SD-02F literal in prose |
| `public/data/modules/logging-auditing/lessons/ps-logging.md` | Lesson 2: PowerShell Script Block Logging | VERIFIED | Contains ScriptBlockLogging registry path; complianceTags: [TSA, NIST]; 1 OT callout; 4 powershell code blocks |
| `public/data/modules/logging-auditing/lessons/audit-policies.md` | Lesson 3: Configuring Audit Policies | VERIFIED | Contains auditpol; complianceTags: [TSA, NIST]; 1 OT callout; 4 code blocks |
| `public/data/modules/logging-auditing/quizzes/01.json` | Quiz placeholder with one real question | VERIFIED | status="placeholder"; 1 question (q-01) about Event ID 4104; 4 answer options with per-answer feedback; complianceControls: [NIST-AU-12] |
| `public/data/modules/logging-auditing/exercises/01.json` | Terminal exercise placeholder | VERIFIED | status="placeholder"; 1 step checking ScriptBlockLogging key; regex-based expectedCommands; realistic PS error successOutput; context=PIPELINE-DC01 |
| `public/data/modules/logging-auditing/scenarios/01.json` | Scenario placeholder with one decision branch | VERIFIED | status="placeholder"; PIPELINE-DC01 incident narrative (47 failed logons + 1 success); 1 decision phase with 2 options; complianceControls: [TSA-Monitoring, NIST-AU-2] |
| `src/style.css` | Phase 2 @theme tokens | VERIFIED | All 14 required tokens present: --text-prose-body, --text-prose-h2, --text-prose-small, --color-code-bg, --color-code-header-bg, --color-code-header-text, --color-code-border, --code-block-padding-x, --color-ot-border, --color-ot-bg, --color-ot-label, --color-ot-body, --lesson-reading-width, --color-lesson-active-bg; component CSS classes present (.lesson-wrapper, .code-block, .ot-callout, .sidebar-lesson-link, etc.) |
| `package.json` | shiki, marked, lucide in dependencies | VERIFIED | shiki@^4.0.2, marked@^18.0.3, lucide@^1.14.0 all in `dependencies` (runtime, not devDependencies) |
| `index.html` | Lucide CDN script tag removed | VERIFIED | No unpkg.com/lucide reference found; only a data-lucide inline icon attribute remains (correct — not a CDN script tag) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/router.js` | `src/views/lesson-view.js` | `viewRenderers.lesson = (params) => renderLesson(params)` | WIRED | Line 42: `lesson: (params) => renderLesson(params)` confirmed |
| `src/views/lesson-view.js` | `src/content-loader.js` | `fetchLesson + renderMarkdown` | WIRED | Lines 7, 45, 56: imports and uses fetchLesson, parseFrontmatter, renderMarkdown, getLessonNav |
| `src/sidebar.js` | `src/content-loader.js` | `checkLessonAvailability HEAD fetch` | WIRED | Line 4: import; line 14: called in parallel HEAD-fetch loop |
| `src/main.js` | `lucide` npm | `import { createIcons } from 'lucide'` | WIRED | Line 5: named imports from 'lucide'; activateIcons() exported and used in router/sidebar/lesson-view |
| `src/views/lesson-view.js` | `src/badge.js renderBadge()` | `meta.complianceTags.map(tag => renderBadge(tag))` | WIRED | Line 8: import; line 98: `complianceTags.map(tag => renderBadge(tag))` |
| `src/views/lesson-view.js` | `src/content-loader.js getLessonNav()` | `getLessonNav(moduleId, lessonId)` | WIRED | Line 59: `getLessonNav(moduleId, lessonId)` called after parse step |
| `src/views/lesson-view.js` | `src/sidebar.js setActiveLesson()` | `setActiveLesson(moduleId, lessonId)` called after DOM insertion | WIRED | Line 67: called in post-render step after app.innerHTML set |
| `lesson frontmatter complianceTags` | `badge.js renderBadge()` | `complianceTags: [TSA, NIST]` feeds renderBadge | WIRED | All 3 lessons have `complianceTags: [TSA, NIST]`; parseFrontmatter correctly parses to array (spot-check confirmed) |
| `public/data/compliance-refs.json` | `badge.js renderBadge()` | `loadComplianceRefs()` → `setComplianceRefs()` | WIRED | main.js loads compliance-refs.json at init, calls setComplianceRefs; badge.js reads `_complianceRefs?.directives?.[key]?.shortName` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `lesson-view.js` renderLesson | `html` (rendered body) | `renderMarkdown(body)` ← `fetchLesson()` ← `.md` files | Yes — fetches real .md files from public/data/ | FLOWING |
| `lesson-view.js` buildLessonHtml | `meta.complianceTags` | `parseFrontmatter(raw)` ← raw .md with frontmatter | Yes — parses array from YAML frontmatter; spot-check confirms `["TSA","NIST"]` | FLOWING |
| `badge.js` renderBadge | `shortName` | `_complianceRefs.directives[key].shortName` ← compliance-refs.json | Yes — "TSA SD-02F" / "NIST SP 800-82 Rev 3" from compliance-refs.json | FLOWING |
| `lesson-view.js` buildLessonFooter | `nav.prev/nav.next` | `getLessonNav(moduleId, lessonId)` ← MODULES config | Yes — prev/next derived from static MODULES config; getLessonNav returns correct objects (spot-check confirmed) | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| parseFrontmatter extracts all 6 fields | `node --input-type=module` inline test | title="Test", complianceTags=["TSA","NIST"], body="# Body" | PASS |
| parseFrontmatter handles empty YAML array | inline test | `[]` returned (not `['']`) | PASS |
| getLessonNav returns null prev for first lesson | inline test | nav.prev=null, nav.next.lessonId="ps-logging" | PASS |
| npm test suite | `npm test` | 26 passed, 1 todo, 5 test files | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONT-01 | 02-01, 02-02, 02-03, 02-04 | Lessons authored in Markdown, rendered in-browser without build step | SATISFIED | fetchLesson fetches .md files at runtime; renderMarkdown parses to HTML; no build step required |
| CONT-02 | 02-01, 02-02 | PS code blocks render with full Shiki syntax highlighting (PS 5.1 grammar) | SATISFIED (human visual check needed) | Shiki singleton with powershell lang; walkTokens pattern avoids [object Promise]; code() renderer emits shikiHtml; browser visual appearance requires human verification |
| CONT-03 | 02-02, 02-03 | Every code block has one-click copy-to-clipboard button | SATISFIED (clipboard behavior needs human check) | code-copy-btn present in rendered HTML (test PASS); attachCopyHandlers wired; clipboard.writeText called with btn.dataset.code |
| CONT-04 | 02-01, 02-02, 02-03, 02-04 | Each lesson displays TSA/NIST control IDs sourced from compliance-refs data file | SATISFIED | complianceTags in all 3 lesson frontmatters → renderBadge reads compliance-refs.json shortName; no SD-02F hardcoded in prose |
| MOD-01 | 02-04 | Logging & Auditing — core lessons, quiz, exercise, scenario; maps to TSA/NIST logging controls | SATISFIED | 3 lessons + quizzes/01.json + exercises/01.json + scenarios/01.json all exist and valid; complianceControls present in all files |

No orphaned requirements for Phase 2 found. REQUIREMENTS.md traceability table maps CONT-01 through CONT-04 and MOD-01 to Phase 2; all 5 are accounted for.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/views/lesson-view.js` | 28, 34, 51, 71 | `return null` | INFO | These are intentional null sentinel returns (CR-01 fix) — the null means "renderer took DOM control directly"; router checks `if (viewHtml !== null)` before assigning innerHTML. Not a stub pattern. |
| `public/data/modules/logging-auditing/quizzes/01.json` | 5 | `"status": "placeholder"` | INFO | Intentional — placeholder status signals Phase 4 quiz engine to skip rendering. One real question is present. |
| `public/data/modules/logging-auditing/exercises/01.json` | 5 | `"status": "placeholder"` | INFO | Intentional — Phase 5 engine will activate. Step and regex pattern are substantive. |
| `public/data/modules/logging-auditing/scenarios/01.json` | 5 | `"status": "placeholder"` | INFO | Intentional — Phase 6 engine will activate. Narrative and decision branch are substantive. |

No TBD, FIXME, or XXX markers found in any Phase 2 modified source files.

---

### Post-Review Fixes Verification

All 6 fixes from commits 48e64ac and 1764ef4 are confirmed in the codebase:

| Fix ID | Description | Evidence |
|--------|-------------|---------|
| CR-01 | Router no longer wipes lesson content (renderLesson returns null sentinel) | `lesson-view.js` returns `null`; `router.js` line 52: `if (viewHtml !== null)` guard |
| CR-02 | OT callout body no longer empty (raw text strip instead of whole token filter) | `content-loader.js` lines 84-91: maps tokens, strips only `[!OT]` marker line with regex, preserves body text |
| WR-01 | parseFrontmatter guards against undefined input | `content-loader.js` line 113: `if (typeof raw !== 'string') return { meta: {}, body: String(raw ?? '') }` |
| WR-02 | parseFrontmatter correctly returns [] for empty YAML arrays | `content-loader.js` lines 139-141: `inner === '' ? [] : inner.split(',')...`; spot-check confirmed |
| WR-03 | Shiki singleton uses Promise cache to prevent double-initialization race | `content-loader.js` lines 14-24: `_highlighterPromise` stores the Promise itself (not the resolved value) |
| WR-04 | sidebar.js null-guards shell element before classList access | `sidebar.js` line 9: `if (!sidebarModules) return`; line 54: `if (toggleBtn && shell)` |

---

### Human Verification Required

#### 1. Syntax Highlighting Visual Appearance

**Test:** Start the dev server (`npm run dev`), navigate to `#/lesson/logging-auditing/intro`
**Expected:** PowerShell code blocks display with visually distinct colors for keywords (e.g., `Get-WinEvent` in one color), string literals in another, parameters/flags in another — characteristic of the `github-dark` Shiki theme
**Why human:** Shiki's token-to-HTML pipeline and CSS rendering require a live browser; `npm test` confirms the HTML string contains the Shiki output structure but cannot verify the visual token coloring

#### 2. OT Callout Body Text Visible

**Test:** In the same lesson view, scroll to the amber-bordered callout block
**Expected:** The "IN OT ENVIRONMENTS" label appears in amber, followed by the full callout body text (the CR-02 fix stripped only the `[!OT]` marker, not the body)
**Why human:** The CR-02 fix is code-verified (raw text strip confirmed), but the actual rendered output in the DOM — that the body text renders completely and is readable — requires visual confirmation in a browser

#### 3. Copy-to-Clipboard Functional Test

**Test:** Click the copy button on any code block, then paste into a text editor
**Expected:** The pasted text matches the raw PowerShell code exactly — no HTML entities (`&amp;`, `&lt;`, `&#96;`) in the pasted text
**Why human:** The `esc(token.text)` → `data-code` → `btn.dataset.code` (browser HTML-decodes on read) → clipboard.writeText chain is code-verified, but the actual clipboard round-trip behavior requires manual testing with a real browser Clipboard API

---

### Gaps Summary

No gaps found. All 5 success criteria from ROADMAP.md are satisfied in the codebase:

1. **SC-1 (Markdown fetch/render):** fetchLesson + renderMarkdown pipeline is fully implemented and wired into the lesson route.
2. **SC-2 (Shiki syntax highlighting):** Shiki singleton with powershell lang + walkTokens async pattern implemented; code() renderer emits shikiHtml.
3. **SC-3 (Copy button):** code-copy-btn emitted by code() renderer; attachCopyHandlers wired; clipboard.writeText called.
4. **SC-4 (Compliance IDs from compliance-refs.json):** badge.js reads compliance-refs.json via setComplianceRefs; all lessons have complianceTags frontmatter; no version strings hardcoded in prose.
5. **SC-5 (Module 1 complete):** All 7 files exist and are substantive (lessons have content, placeholders have real first questions/steps/decisions).

The `human_needed` status reflects that visual rendering quality (Shiki token colors, OT callout body text, clipboard round-trip) cannot be asserted programmatically.

---

_Verified: 2026-05-14T13:05:00Z_
_Verifier: Claude (gsd-verifier)_
