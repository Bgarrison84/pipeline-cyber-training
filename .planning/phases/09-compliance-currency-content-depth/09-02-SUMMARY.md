---
phase: 09-compliance-currency-content-depth
plan: 02
subsystem: badge-compliance
tags: [wave-1, badge, compliance-refs, expired-state, tdd-green]
dependency_graph:
  requires: [09-01-test-gates]
  provides: [expired-badge-rendering]
  affects: [badge.js, compliance-refs.json, style.css]
tech_stack:
  added: []
  patterns: [tdd-wave-1-green, css-custom-properties, html-aria]
key_files:
  created: []
  modified:
    - public/data/compliance-refs.json
    - src/badge.js
    - src/style.css
decisions:
  - "badge.js reads directive?.status ?? 'active' to default non-expired entries safely"
  - "expiredClasses defined as constant before colorClasses to keep code readable"
  - "esc() applied to shortName in both title and aria-label attributes for XSS safety"
  - "No successor string (SD-02G) added — policy is to verify at TSA.gov before any version string update"
metrics:
  duration: "10 minutes"
  completed: "2026-05-18"
---

# Phase 9 Plan 02: Expired Badge Rendering Summary

## Objective Achieved

Wave 1 implementation complete. TSA SD-02F expired state is now rendered in the badge with gray strikethrough, [EXPIRED] label, tooltip, and aria-label. NIST badge is unchanged. All 177 tests GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add status field to compliance-refs.json and CSS expired tokens | f81dac7 | public/data/compliance-refs.json, src/style.css |
| 2 | Implement expired-state branch in badge.js | f81dac7 | src/badge.js |

## Test Results

| Test File | Tests | RED before | GREEN after | Notes |
|-----------|-------|-----------|-------------|-------|
| tests/badge-expired.test.js | 6 | 4 | 6 | All badge-expired tests now GREEN |
| tests/compliance-refs.test.js | 6 | 1 | 6 | status=expired test now GREEN |
| All other test files | 165 | 0 | 165 | No regressions |

**Final npm test result:**
- 177 passed | 1 todo (178 total)
- 17 test files passed
- npm test exits 0

## Key Decisions

**1. Default status to 'active'**
`directive?.status ?? 'active'` ensures that any directive without a status field (NIST, future entries) renders the standard active badge. This prevents regressions when new directives are added to compliance-refs.json without a status field.

**2. esc() on aria-label and title attributes**
Both `esc(shortName)` calls in the expired branch sanitize the shortName string before injecting into HTML attribute values. This satisfies threat T-09-04 (Information Disclosure via XSS).

**3. No successor version string**
Per STATE.md policy: do not assume SD-02G. The TSA entry has only `"status": "expired"` with no successor designation. The badge tooltip directs users to verify at TSA.gov.

## Verification Results

All plan verification checks passed:
- `grep "status.*expired" public/data/compliance-refs.json` — MATCH
- `grep "color-badge-expired-bg" src/style.css` — MATCH
- `grep "if (status === 'expired')" src/badge.js` — MATCH
- No SD-02G or successor string in compliance-refs.json — CLEAN
- npm test exits 0 — CONFIRMED

## Deviations from Plan

None — plan executed exactly as written. Both tasks were implemented in a single commit since they form one logical unit (data + CSS tokens + renderer).

## Known Stubs

None — all three files are fully implemented. The expired badge renders in the live app immediately upon deploy.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. The `esc()` function is applied to all dynamic values in HTML output (shortName in text content, aria-label, and title attributes), satisfying T-09-04. The null-refs fallback (`_complianceRefs?.directives?.[directiveKey]`) satisfies T-09-05.

## Self-Check

Files modified:
- [x] public/data/compliance-refs.json — has "status": "expired" and "lastVerified": "2026-05-17"
- [x] src/style.css — has --color-badge-expired-bg: #2a2a2a and --color-badge-expired-text: #737373
- [x] src/badge.js — has expired branch with line-through, [EXPIRED], title, aria-label

Commit f81dac7 exists and contains all 3 files.

## Self-Check: PASSED
