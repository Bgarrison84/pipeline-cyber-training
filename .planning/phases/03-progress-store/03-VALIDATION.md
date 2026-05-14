---
phase: "3"
phase-slug: "progress-store"
date: "2026-05-14"
---

# Phase 3: Progress Store — Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 |
| Config file | `vitest.config.js` (environment: happy-dom) |
| Quick run command | `npx vitest run tests/progress-store.test.js` |
| Full suite command | `npx vitest run` |

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSESS-03 | `getLastVisited()` returns stored moduleId/lessonId after `init()` | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| ASSESS-03 | `markVisited()` persists to localStorage and returns correct value via getter | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-04 | `init()` with `setItem` throwing falls back to in-memory (`isStorageAvailable = false`) | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-04 | Schema with old `schemaVersion` is migrated on `init()` | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-04 | Corrupt localStorage data (invalid JSON) is recovered gracefully | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-05 | `exportProgress()` triggers download (Blob created, anchor clicked) | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-05 | `importProgress(file)` with valid JSON replaces store and writes localStorage | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |
| DATA-05 | `importProgress(file)` with missing `schemaVersion` returns `{ ok: false }` | unit | `npx vitest run tests/progress-store.test.js` | ❌ Wave 0 |

## Sampling Rate

- **Per task commit:** `npx vitest run tests/progress-store.test.js`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Wave 0 Gaps

- [ ] `tests/progress-store.test.js` — covers all items above (ASSESS-03, DATA-04, DATA-05)
- No new framework config needed — existing `vitest.config.js` with `happy-dom` environment covers all storage and DOM tests

## Notes

All test coverage is addressed in plan 03-01 (Wave 1, TDD pattern): Task 1 creates the test file (RED), Task 2 implements to green. The ❌ Wave 0 markers above indicate files not yet written at planning time — they are created as the first action in Wave 1.
