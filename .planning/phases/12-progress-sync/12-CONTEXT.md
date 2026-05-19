# Phase 12: Progress Sync - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 12 enables learners to carry their completion state across devices by sharing a single URL or scanning a QR code — no account, no server, no credentials. The mechanism is:

1. Compress the full `progressStore` JSON with lz-string
2. Base64-URL-encode the result
3. Embed in a `#/import?data=` hash URL
4. Provide a "Copy link" button and a "Show QR" button in the Completion Summary view
5. On page load, detect the `#/import?data=` pattern, decompress, merge into localStorage, and redirect to Completion Summary with an import banner

Three concrete deliverables:
1. `docs/ADR-001-sync-approach.md` — architectural gate; written and committed before any sync code
2. `src/sync.js` — lz-string encode/decode, merge logic, URL detection
3. Share UI additions to `src/views/completion-summary-view.js` — "Copy link" + "Show QR" buttons with inline QR section

The existing JSON export/import (DATA-05) remains unchanged as the always-available fallback.

</domain>

<decisions>
## Implementation Decisions

### Share Button Surface
- **D-01:** Share button lives in the **Completion Summary view only** — in the existing `print-hide` footer div alongside the "Print Training Log" button.
- **D-02:** Clicking "Copy link" copies the share URL to clipboard; a brief inline **"Copied!"** confirmation replaces the button text for ~2 seconds, then reverts to "Copy link".
- **D-03:** A separate **"Show QR"** button sits next to "Copy link". Clicking it renders the QR section inline below the button row; it stays visible until dismissed (toggle).

### QR Code UX
- **D-04:** QR code renders at **256×256 px** using the `qrcode` library (renders to `<canvas>` or `<img>`).
- **D-05:** When the QR section is open, **show the full share URL as copyable text** above the QR image, so desktop users can also manually copy it.
- **D-06:** QR section gets the **`print-hide` class** — does not appear in the printed training log.

### Import Landing & Feedback
- **D-07:** Successful import: show a **brief dismissible banner** ("Progress imported from share link") and **redirect to Completion Summary** so the learner immediately sees their imported state.
- **D-08:** Importing into a device with existing progress: **fully automatic merge** (no confirmation) — union of completed lessons, higher quiz score wins, never overwrites completed with incomplete. Banner shown after merge.
- **D-09:** Corrupted/invalid URL data (decompression or validation fails): show **error banner** ("Could not import — link may be corrupted"), keep existing progress intact. Never wipes current state on failure.

### ADR Scope
- **D-10:** `docs/ADR-001-sync-approach.md` must document: (1) chosen approach — URL share + lz-string compression; (2) rejected alternatives — GitHub Gist (PAT-in-localStorage is credential exposure), Supabase (free-tier pause incompatible with episodic training); (3) **merge algorithm** — union of completed lessons + higher quiz score wins — explicitly documented as an intentional architectural decision, not an implementation detail.
- **D-11:** ADR stays minimal — no URL length analysis section, no RFC-style security analysis. The merge rules and rejection rationale are sufficient.

### Implementation Constraints (LOCKED from ROADMAP)
- **D-12:** ADR (`docs/ADR-001-sync-approach.md`) must be **written and committed before any sync implementation code** is written — this is a hard architectural gate.
- **D-13:** `#/import?data=` detection added to `router.js` / `main.js` **initial load check** — import must be processed before the first view renders, not after.
- **D-14:** `npm install lz-string qrcode` (runtime, not dev) — add to `package.json` before authoring sync module code.
- **D-15:** No `schemaVersion` bump required — URL share encodes existing schema v1 JSON without new store fields.
- **D-16:** No credentials stored in localStorage or hardcoded in the repo at any point.

### Claude's Discretion
- Exact banner UI implementation (position, dismiss mechanism, animation) — follow the established inline notification pattern if one exists, otherwise a simple `role="status"` div in the Completion Summary view.
- Whether `sync.js` exports a single `encodeProgress()` / `decodeProgress()` function pair or a richer module-level API.
- Whether the "Copy link" and "Show QR" buttons are styled identically to the existing "Print Training Log" button (accent background) or as secondary buttons (border only).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Progress Store API (primary integration point)
- `src/progress-store.js` — Full API: `init()`, `exportProgress()`, `importProgress(file)`, `resetProgress()`, `migrate(data)`. The `_store` object shape (schemaVersion, lessons, quizzes, exercises, scenarios, lastVisited) is the data encoded into the share URL. `_blankStore()` defines the canonical empty schema. `migrate()` handles structural normalization — reuse in the merge path.

### Router & App Init Chain
- `src/router.js` — Current hash router with `handleRoute()` and `_handledInitialLoad` flag + initial load auto-resume logic. `#/import?data=` detection must be added to this initial load block (or in `main.js` before `handleRoute()` is called).
- `src/main.js` — `init()` chain: `loadForkConfig()` → `applyForkBranding()` → `initOfflineIndicator()` → `loadComplianceRefs()` → `progressStore.init()` → `handleRoute()` + `initSidebar()`. URL import check must run **after** `progressStore.init()` and **before** `handleRoute()`.

### Completion Summary View (share UI lives here)
- `src/views/completion-summary-view.js` — `renderCompletionSummary()` — synchronous renderer, writes directly to `#app`, returns `null`. The `print-hide` footer div (contains `#print-summary-btn`) is where the "Copy link" and "Show QR" buttons are added. The `print-hide` class pattern is already established in this view.

### Design System
- `src/style.css` — CSS variables: `--color-accent: #f97316` (orange), `--color-text-muted`, `--color-border`, `--color-bg-secondary`. All new UI elements must use CSS variables, not hardcoded hex.
- `src/utils/escape.js` — `esc()` for XSS-safe innerHTML rendering. Any URL text rendered into innerHTML must go through `esc()`.
- `src/utils/icons.js` — `activateIcons()` — must be called after injecting any `data-lucide="..."` icons into DOM.

### Requirements
- `.planning/REQUIREMENTS.md` §SYNC — SYNC-01 and SYNC-02 are the two requirements for this phase.
- `.planning/ROADMAP.md` §Phase 12 — Plan notes contain locked implementation constraints (read before planning).

### ADR (must be created before any sync code)
- `docs/ADR-001-sync-approach.md` — Does not exist yet; must be the first artifact created in Phase 12. Plan 12-01 writes this file.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `progressStore.exportProgress()` — Downloads full `_store` JSON. The `_store` object is the payload we compress into the share URL. No new internal API needed to read the store for encoding.
- `progressStore.migrate(data)` — Already handles structural normalization (fills in missing top-level keys from `_blankStore()`). The merge function in `sync.js` should call `migrate()` on both the local store and the imported data before merging.
- `progressStore.importProgress(file)` — Existing file-based import with validation and migration. The URL import path follows the same validation/migration pattern but reads from decoded string instead of a File object.
- `initOfflineIndicator()` in `src/offline-indicator.js` — Pattern: module-level init, programmatically appends to existing DOM, called once from `main.js init()`. `sync.js` init (if it needs DOM injection) follows the same pattern.

### Established Patterns
- Module-level singletons: `getForkConfig()` / `getComplianceRefs()` — getter returns module-level state set during `init()`. `sync.js` follows the same pattern if it needs to expose state.
- `esc()` from `utils/escape.js` — All user-visible strings rendered into `innerHTML` must go through this. The share URL rendered as text is user-visible content.
- `print-hide` CSS class — already established in `completion-summary-view.js` and `style.css`. All interactive sync UI (Copy link, Show QR, QR section, import banner) uses this class.

### Integration Points
- `main.js init()` — Add import detection AFTER `await progressStore.init()`, BEFORE `await Promise.all([handleRoute(), initSidebar(...)])`. This is the exact insertion point.
- `completion-summary-view.js` — Extend the existing `print-hide` footer div to add "Copy link" and "Show QR" buttons + event listeners alongside the existing Print button.
- `router.js` routes array — If `#/import` becomes a recognized route pattern, add it here. Alternatively, the detection can live entirely in `main.js init()` as a pre-route check.

</code_context>

<specifics>
## Specific Ideas

- **Copy link feedback:** The "Copy link" button temporarily shows "Copied!" by mutating `textContent` on the button element — same approach used in Phase 2/3 copy-to-clipboard on code blocks. No separate DOM element needed.
- **QR section toggle:** The QR section `<div>` is hidden by default (`display: none`). Clicking "Show QR" toggles visibility and changes button label to "Hide QR". This keeps the DOM simple without requiring any modal infrastructure.
- **URL text for copy:** The share URL displayed in the QR section is rendered in a `<input readonly>` or `<textarea readonly>` so learners can click-to-select and manually copy. Use `esc()` if rendered via innerHTML.
- **Import banner position:** A `<div role="status">` banner injected at the top of the `#app` container (above the lesson-wrapper div), styled with `--color-accent` border-left like the existing Note callouts in the completion summary view.

</specifics>

<deferred>
## Deferred Ideas

- URL length analysis (estimating lz-string output size for 5-module progress data) — downstream planner can verify in implementation; not an ADR concern.
- Security analysis section in ADR (credentials, public URL sharing) — user confirmed ROADMAP spec is sufficient.
- "Online (cached)" vs "Online (syncing)" SW state distinction — deferred from Phase 11; not in scope here.
- Non-GitHub-Pages deployment notes — deferred from Phase 10; not re-raised.

</deferred>

---

*Phase: 12-Progress-Sync*
*Context gathered: 2026-05-19*
