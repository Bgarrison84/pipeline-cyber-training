---
phase: 2
slug: content-loader-lesson-rendering-module-1
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 |
| **Config file** | `vitest.config.js` (exists — `environment: 'happy-dom'`, `include: ['tests/**/*.test.js']`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| parseFrontmatter — valid | 01 | 0 | CONT-01 | esc() applied to all frontmatter values | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| parseFrontmatter — no frontmatter | 01 | 0 | CONT-01 | returns empty meta + full body | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| parseFrontmatter — malformed YAML | 01 | 0 | CONT-01 | returns gracefully, no throw | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| renderMarkdown — returns HTML string | 01 | 0 | CONT-01 | no raw Markdown in output | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| OT callout — `> [!OT]` renders `.ot-callout` | 01 | 0 | MOD-01 | no plain blockquote passthrough | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| OT callout — standard blockquote unchanged | 01 | 0 | MOD-01 | non-OT blockquotes render as `<blockquote>` | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| Code block — copy button present in HTML | 01 | 0 | CONT-03 | data-code attr is esc()-escaped | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| getLessonNav — first lesson (no prev) | 01 | 0 | SHELL-01 | returns null prev, valid next | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| getLessonNav — middle lesson | 01 | 0 | SHELL-01 | returns valid prev and next | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| getLessonNav — last lesson (no next) | 01 | 0 | SHELL-01 | returns valid prev, null next | unit | `npm test -- tests/content-loader.test.js` | ❌ Wave 0 | ⬜ pending |
| Router — lesson route match | 02 | 0 | SHELL-02 | extracts moduleId + lessonId params | unit | `npm test -- tests/router.test.js` | ❌ Wave 0 (add case) | ⬜ pending |
| Compliance badge row — tags present | 03 | 2 | CONT-04 | badges render from complianceTags[] | unit | `npm test -- tests/lesson-view.test.js` | ❌ Wave 0 | ⬜ pending |
| Compliance badge row — no tags | 03 | 2 | CONT-04 | badge row absent (hidden silently) | unit | `npm test -- tests/lesson-view.test.js` | ❌ Wave 0 | ⬜ pending |
| Copy button — clipboard write called | 03 | 2 | CONT-03 | clipboard.writeText gets raw code text | integration | `npm test -- tests/lesson-view.test.js` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/content-loader.test.js` — stubs for parseFrontmatter (3 cases), renderMarkdown (1 case), OT callout (2 cases), code block HTML (1 case), getLessonNav (3 cases)
- [ ] `tests/lesson-view.test.js` — stubs for compliance badge row presence/absence (2 cases), copy button presence (1 case), clipboard call with mocked `navigator.clipboard` (1 case)
- [ ] `tests/router.test.js` — add lesson route test case: `matchRoute('#/lesson/logging-auditing/intro')` returns `{ view: 'lesson', params: { moduleId: 'logging-auditing', lessonId: 'intro' } }`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shiki syntax highlighting renders token colors | CONT-02 | Requires visual browser inspection; Shiki WASM not available in happy-dom | Navigate to any Lesson 1 lesson; verify PowerShell keywords (Get-WinEvent, Where-Object), strings, and cmdlet names are visually distinct colors matching GitHub Dark theme |
| Copy button icon swap (Copy → Check → revert) | CONT-03 | Requires real clipboard API + 2-second timer; happy-dom clipboard is mocked | Click copy button; verify icon changes to checkmark for ~2 seconds then reverts; verify copied text matches raw code |
| Sidebar HEAD fetch activation | CONT-01 | Requires running server with real static files | Navigate to localhost dev server; verify Module 1 lessons are clickable links; verify Modules 2–5 lesson items remain disabled spans |
| Loading skeleton visible on slow connection | CONT-01 | Requires browser network throttling | Use Chrome DevTools → Network → Slow 3G; navigate to a lesson; verify skeleton pulses before content renders |
| Error state renders on 404 | CONT-01 | Requires a missing file fetch | Navigate to `#/lesson/logging-auditing/nonexistent`; verify error state shows with correct copy and reload link |
| Prev/next navigation between all 3 lessons | CONT-01 | Full integration — requires all lesson files and router | Navigate to Lesson 1; verify "Next" goes to Lesson 2; from Lesson 2 verify both prev/next work; from Lesson 3 verify "Next" is absent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
