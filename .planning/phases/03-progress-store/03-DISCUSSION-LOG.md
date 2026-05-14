# Phase 3: Progress Store — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 3-progress-store
**Areas discussed:** Progress schema shape, Version mismatch strategy, Quota & private-browsing UX, Export trigger & scope

---

## Progress Schema Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Visited + completed (two flags) | visited=true on first open, completed=true when done. Enables in-progress state in sidebar. | ✓ |
| Completed only (one flag) | Simpler, no in-progress state | |

**User's choice:** Visited + completed (two flags)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Last attempt score only | {score, total, attemptedAt} | ✓ |
| Best score only | Overwrites only if higher | |
| All attempts (array) | Full history, grows unboundedly | |

**User's choice:** Last attempt score only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Completed flag only | {completed, completedAt} for exercises/scenarios | ✓ |
| Completed + last step reached | Adds stepReached for terminal resume | |

**User's choice:** Completed flag only (step-level resume deferred to Phase 5)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — store lastVisited: {moduleId, lessonId} | Router reads on app load and navigates there | ✓ |
| No — rely on browser hash history | Works only if user closes from the lesson URL | |
| Yes — store full hash URL string | Simpler restore but couples store to URL format | |

**User's choice:** store lastVisited: {moduleId, lessonId}

---

| Option | Description | Selected |
|--------|-------------|----------|
| pipeline-cyber-training:progress (namespaced) | Avoids collisions | ✓ |
| pct-progress (short) | Shorter | |

**User's choice:** pipeline-cyber-training:progress

---

## Version Mismatch Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hard reset — clear storage, start fresh | Simplest | |
| Best-effort migration — keep what maps, drop what doesn't | Preserves progress | ✓ |
| Prompt user to choose | Transfers decision to learner | |

**User's choice:** Best-effort migration

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in progress-store.js, chained v1→v2→v3 | Standard pattern, easy to test | ✓ |
| Always migrate from v1 to current — single path | Simpler now, refactor later | |

**User's choice:** Chained migration inline in progress-store.js

---

## Quota & Private-Browsing UX

| Option | Description | Selected |
|--------|-------------|----------|
| Persistent banner at top of app chrome | Hard to miss, stays until dismissed | |
| Toast notification (auto-dismiss) | Less intrusive but easy to miss | |
| Inline in current lesson view only | Visible in context | ✓ |

**User's choice:** Inline in lesson view only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fully functional — in-memory fallback | Progress lost on close, app still works | ✓ |
| Read-only mode — disable progress tracking UI | Simpler but disruptive | |

**User's choice:** Fully functional with in-memory fallback

---

## Export Trigger & Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Home page only | Dedicated section on landing view | |
| Sidebar footer | Always reachable without leaving lesson | ✓ |
| Module overview page | Only when module is complete | |

**User's choice:** Sidebar footer

---

| Option | Description | Selected |
|--------|-------------|----------|
| Raw progress data only | Compact, re-importable as-is | ✓ |
| Enriched export with labels | Human-readable but larger | |

**User's choice:** Raw progress data only

---

| Option | Description | Selected |
|--------|-------------|----------|
| Export only — re-import deferred | ROADMAP says "future version" | |
| Export + import in Phase 3 | File picker, validation, loads into storage | ✓ |

**User's choice:** Export + import in Phase 3

---

## Claude's Discretion

None — all questions received explicit user answers.

## Deferred Ideas

- Step-level resume for terminal exercises (`stepReached` field) — Phase 5 when terminal engine is built
- Progress sync across devices — v2 requirement (requires authentication)
