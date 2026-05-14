# Phase 3: Progress Store — Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `src/progress-store.js` — a single module that owns ALL localStorage reads and writes. Every future phase (quiz engine, terminal, scenario engine) calls this store; nothing accesses localStorage directly. The store persists lesson visited/completed state, quiz scores, exercise/scenario completion, and the learner's last-visited position. It handles quota errors and private-browsing gracefully via an in-memory fallback, supports chained schema migration, and exposes export (download JSON) and import (load JSON) functions accessible from the sidebar footer.

</domain>

<decisions>
## Implementation Decisions

### Progress Schema

- **D-01:** localStorage key is `pipeline-cyber-training:progress` (namespaced to avoid collisions).
- **D-02:** Schema shape (schemaVersion: 1):
  ```json
  {
    "schemaVersion": 1,
    "lastVisited": { "moduleId": "logging-auditing", "lessonId": "intro" },
    "lessons": {
      "logging-auditing/intro": { "visited": true, "completed": false }
    },
    "quizzes": {
      "logging-auditing/01": { "score": 3, "total": 4, "attemptedAt": "ISO" }
    },
    "exercises": {
      "logging-auditing/01": { "completed": true, "completedAt": "ISO" }
    },
    "scenarios": {
      "logging-auditing/01": { "completed": true, "completedAt": "ISO" }
    }
  }
  ```
- **D-03:** Lesson-level tracking is two flags: `visited` (set on first open) + `completed` (set when learner finishes or passes quiz). Sidebar can show in-progress vs done.
- **D-04:** Quiz scores: last attempt only — `{score, total, attemptedAt}`. No history array.
- **D-05:** Exercise and scenario tracking: `completed` flag + `completedAt` timestamp only. No step-resume in Phase 3 (Phase 5 may add stepReached).
- **D-06:** `lastVisited: {moduleId, lessonId}` stored; on app load the router reads this and navigates there automatically (satisfies SC-1: learner returns to exact lesson without action).

### Schema Migration

- **D-07:** Version mismatch strategy: best-effort migration — keep what maps to the new schema, drop what doesn't. No hard reset, no user prompt.
- **D-08:** Migration functions live inline in `progress-store.js`. Chained upgrade pattern: if stored version is v1, run `migrateV1toV2()`; if v2, run `migrateV2toV3()`; etc. Each migration returns the upgraded object. Phase 3 ships with v1 only (no migration needed yet) but the runner is wired up and tested.

### Quota & Private-Browsing Handling

- **D-09:** `localStorage.setItem` failures (QuotaExceededError) and unavailability (private/incognito) are caught. The store falls back to an in-memory object — the app remains fully functional, progress just doesn't persist to disk.
- **D-10:** When the fallback is active, a warning is injected inline into the current lesson view (not a global banner or toast). The lesson-view rendering pipeline is responsible for calling `progressStore.isStorageAvailable()` and rendering the inline warning when `false`.
- **D-11:** The in-memory fallback is transparent to callers — all `get/set` APIs work identically whether storage is available or not.

### Export & Import

- **D-12:** "Export my progress" and "Import progress" controls live in the sidebar footer — always reachable without leaving the current lesson.
- **D-13:** Export format: raw progress object (exactly what's in localStorage, including schemaVersion). No enrichment with module/lesson labels. File name: `pipeline-cyber-training-progress-{ISO-date}.json`.
- **D-14:** Phase 3 includes both export AND import. Import: a hidden `<input type="file" accept=".json">` triggered by a sidebar button. Validation: must be valid JSON, must have a `schemaVersion` field, must pass migration if old version. On success: replaces localStorage + in-memory state and triggers a page re-render. On failure: shows inline error (don't overwrite existing progress).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `CLAUDE.md` — All localStorage access goes through `progress-store.js`; PS version target 5.1; no backend
- `.planning/REQUIREMENTS.md` — ASSESS-03 (resume), DATA-04 (schemaVersion + QuotaExceededError), DATA-05 (export JSON)
- `.planning/ROADMAP.md §Phase 3` — Success criteria and phase dependencies

### Existing Code (integration points)
- `src/router.js` — handleRoute reads hash; Phase 3 adds `lastVisited` restore on initial load
- `src/sidebar.js` — initSidebar will need export/import button wiring in footer
- `src/views/lesson-view.js` — renderLesson calls `progressStore.markVisited()` after successful render; shows inline storage warning if `!progressStore.isStorageAvailable()`
- `src/modules-config.js` — MODULES array defines all valid moduleId/lessonId combinations; progress-store can use this to validate imported data

### Phase Contracts (what later phases will call)
- Phase 4 (Quiz Engine) will call: `progressStore.saveQuiz(moduleId, quizId, {score, total})`
- Phase 5 (Terminal) will call: `progressStore.saveExercise(moduleId, exerciseId)`
- Phase 6 (Scenarios) will call: `progressStore.saveScenario(moduleId, scenarioId)`
- Phase 4 will also call: `progressStore.markLessonCompleted(moduleId, lessonId)`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/escape.js` — `esc()` function already exists for HTML-escaping; import it for any inline warning HTML built in progress-store or sidebar
- `.lesson-error` CSS class (src/style.css) — existing error/warning style; inline storage warning can reuse this or the new `.storage-warning` variant
- `src/sidebar.js` `initSidebar()` — already sets up sidebar DOM; Phase 3 adds footer buttons here

### Established Patterns
- **Single-module ownership:** Each feature has one owning module (content-loader.js owns fetch+parse, badge.js owns compliance badges). progress-store.js follows this pattern — it is the one place where localStorage is touched.
- **Null-guard pattern (WR-04):** `if (element && element.classList)` before DOM manipulation — apply same pattern in sidebar footer button wiring.
- **`import.meta.env.BASE_URL` prefix:** Not needed here (no fetches), but the pattern of explicit URL construction is established.
- **Error boundary at module level:** content-loader.js catches fetch errors and returns null; progress-store should catch storage errors internally and not throw to callers.

### Integration Points
- `src/main.js` `init()` — Phase 3 adds `progressStore.init()` call here (before `handleRoute`) so lastVisited restore fires on app load before the first route render
- `src/sidebar.js` — needs export/import button HTML in the sidebar footer; Phase 3 adds this
- `src/views/lesson-view.js` `renderLesson()` — calls `progressStore.markVisited(moduleId, lessonId)` after lesson HTML is inserted into DOM

</code_context>

<specifics>
## Specific Ideas

- The in-memory fallback should be invisible to callers — same API surface whether storage works or not. Tests can force the fallback by passing a mock storage object.
- The sidebar footer export/import controls should be subtle (small text link style), not prominent buttons — they're utility functions, not primary navigation.
- Import validation: check `schemaVersion` exists and is a number; run migration if version < current; reject if JSON structure is completely unrecognizable (no schemaVersion, no lessons/quizzes keys at all).

</specifics>

<deferred>
## Deferred Ideas

- **Step-level resume for terminal exercises** (e.g., `stepReached: 2` in exercises store) — Phase 5 may add this when the terminal engine is built; deferred to avoid over-designing the schema now.
- **Progress sync across devices** — requires authentication; noted as v2 in REQUIREMENTS.md.

</deferred>

---

*Phase: 3-progress-store*
*Context gathered: 2026-05-14*
