---
phase: 02-content-loader-lesson-rendering-module-1
plan: "01"
id: 02-01
subsystem: content-pipeline
tags: [wave-0, tdd, css-tokens, npm-packages, lucide-migration, test-stubs]
dependency_graph:
  requires: []
  provides:
    - shiki@4.0.2 installed in dependencies
    - marked@18.0.3 installed in dependencies
    - lucide@1.14.0 installed in dependencies (CDN removed)
    - Phase 2 CSS @theme tokens in src/style.css
    - Component CSS classes (.lesson-wrapper, .code-block, .ot-callout, etc.)
    - Wave 0 test stubs in all 3 test files
    - src/content-loader.js stub (Wave 1 implementation target)
    - src/views/lesson-view.js stub (Wave 2 implementation target)
  affects:
    - index.html (CDN script removed)
    - src/style.css (tokens + component classes added)
    - package.json (3 new runtime deps)
    - tests/router.test.js (lesson route test case added)
tech_stack:
  added:
    - shiki@4.0.2 (PS 5.1 syntax highlighting)
    - marked@18.0.3 (Markdown to HTML)
    - lucide@1.14.0 (npm bundle — replaces CDN)
  patterns:
    - Wave 0 TDD stubs: create test files that fail RED before implementation
    - Stub source files to prevent import errors in test runner
    - CSS @theme token block: all design tokens in one block, component classes as flat selectors
key_files:
  created:
    - src/content-loader.js (stub — Wave 1 target)
    - src/views/lesson-view.js (stub — Wave 2 target)
    - tests/content-loader.test.js (10 RED stubs: parseFrontmatter, getLessonNav, renderMarkdown)
    - tests/lesson-view.test.js (4 it.todo stubs: compliance bar, copy button)
  modified:
    - package.json (shiki, marked, lucide added to dependencies)
    - package-lock.json (125 packages added)
    - index.html (Lucide CDN script tag removed)
    - src/style.css (14 new @theme tokens, 9 component CSS blocks)
    - tests/router.test.js (lesson route test case added — 1 RED test)
decisions:
  - Stub src/content-loader.js and src/views/lesson-view.js so test files load without import errors in Wave 0
  - lesson-view.test.js uses it.todo pattern — 4 stubs exit 0 cleanly
  - content-loader.test.js + router.test.js have RED failures — intentional per Wave 0 TDD contract
metrics:
  duration: "5m 35s"
  completed: "2026-05-12T22:06:55Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 5
---

# Phase 2 Plan 01: Package Install + CSS Tokens + Wave 0 Test Stubs — Summary

**One-liner:** Installed shiki@4.0.2/marked@18.0.3/lucide@1.14.0 as runtime deps, migrated Lucide from CDN to npm bundle, added 14 Phase 2 @theme tokens plus component CSS classes to style.css, and authored Wave 0 TDD stubs in 3 test files establishing the RED test baseline for all downstream waves.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install packages, remove Lucide CDN, add Phase 2 CSS tokens | 1a6b791 | package.json, index.html, src/style.css |
| 2 | Author Wave 0 test stubs (content-loader, lesson-view, router) | 34da30a | tests/content-loader.test.js, tests/lesson-view.test.js, tests/router.test.js, src/content-loader.js, src/views/lesson-view.js |

## Verification Results

All plan success criteria met:

- shiki@4.0.2, marked@18.0.3, lucide@1.14.0 present in node_modules and package.json dependencies
- index.html contains NO lucide CDN script tag (0 occurrences of unpkg.com/lucide)
- src/style.css @theme block contains all 14 new Phase 2 tokens including --lesson-reading-width, --color-code-bg, --color-ot-border, etc.
- Component CSS classes added: .lesson-wrapper, .code-block, .code-block-header, .code-lang-label, .code-copy-btn, .code-block-body, .ot-callout, .ot-callout-label, .ot-callout-body, .sidebar-lesson-link, .lesson-skeleton-line, .lesson-footer, .lesson-nav-btn, .lesson-error, .lesson-body code, .compliance-bar
- tests/content-loader.test.js exists with parseFrontmatter (3 cases), getLessonNav (3 cases), renderMarkdown (4 cases) — all RED
- tests/lesson-view.test.js exists with it.todo stubs for compliance bar (2) and copy button (2)
- tests/router.test.js has lesson route matchRoute test case added (1 RED test)
- npm test loads all test files without import errors; 11 tests fail RED (expected), 4 are todos, 11 pass

## Test Status After Plan

```
Test Files  2 failed | 2 passed | 1 skipped (5)
     Tests  11 failed | 11 passed | 4 todo (26)
```

RED failures are intentional Wave 0 TDD baselines. They will turn GREEN as Waves 1-2 ship:
- Wave 1 (Plan 02-02): implements parseFrontmatter, getLessonNav, renderMarkdown, activates lesson route
- Wave 2 (Plan 02-03): implements renderLesson, compliance bar, copy button

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Created stub source files to prevent import errors**

- **Found during:** Task 2 — initial npm test run crashed with "Failed to resolve import" for src/content-loader.js
- **Issue:** Vitest's Vite transform plugin fails hard when an imported module doesn't exist, causing the entire test file to not load — violating the plan's must_have "npm test runs without import errors"
- **Fix:** Created src/content-loader.js and src/views/lesson-view.js as minimal stub files with the required function signatures (functions throw "not yet implemented"). The stubs allow test files to import the modules successfully, so tests run RED rather than crash.
- **Files created:** src/content-loader.js, src/views/lesson-view.js
- **Commit:** 34da30a (included in Task 2 commit)

## Known Stubs

The following stub files were intentionally created as part of Wave 0 TDD:

| File | Stub Type | Reason | Future Plan |
|------|-----------|--------|-------------|
| src/content-loader.js | All exports throw "not yet implemented" | Wave 0 baseline — imported by test stubs | Plan 02-02 (Wave 1) |
| src/views/lesson-view.js | renderLesson throws "not yet implemented" | Wave 0 baseline — mocked in lesson-view.test.js | Plan 02-03 (Wave 2) |

These stubs do not prevent the plan's goal (establishing the RED test baseline) — they enable it.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced in this plan. The Lucide CDN elimination (T-02-03 from plan threat model) was completed as intended — CDN trust boundary fully eliminated.

## Self-Check: PASSED

### Files Verified

- [x] src/content-loader.js — FOUND
- [x] src/views/lesson-view.js — FOUND
- [x] tests/content-loader.test.js — FOUND
- [x] tests/lesson-view.test.js — FOUND
- [x] tests/router.test.js contains logging-auditing/intro — FOUND (1 match)
- [x] src/style.css contains --lesson-reading-width — FOUND
- [x] index.html has 0 occurrences of unpkg.com/lucide — VERIFIED

### Commits Verified

- [x] 1a6b791 — present in git log
- [x] 34da30a — present in git log
