# Retrospective — Pipeline Cyber Training

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-17
**Phases:** 8 | **Plans:** 30 | **Timeline:** 7 days (2026-05-10 → 2026-05-17)
**Requirements:** 26/26 | **Tests:** 167 passing | **Commits:** ~220

---

### What Was Built

- Static GitHub Pages training platform for pipeline IT/OT admins — hash routing, Vite + Tailwind v4, zero-server
- Custom vanilla JS simulated PowerShell terminal with regex-match validation, contextual hints, always-visible simulator label
- Branching scenario engine (JSON decision-tree), compliance control index (14 controls), printable training log with statutory disclaimer
- Five complete modules: Logging & Auditing, Network Hardening, Account & Access Management, Incident Response, Patch Management
- OT/ICS patching explicitly distinguished from IT patching — air-gapped workflows, OEM qualification, risk-based deferral
- 167 automated Vitest tests across 16 test files; all content compliance-controlled via compliance-refs.json

### What Worked

- **Wave 0 RED scaffold pattern:** Creating stub files that `throw Error('not implemented')` before writing any implementation was the only reliable pattern under Vite's import-analysis static resolution. Established in Phase 5, reused through Phase 8 with zero issues.
- **Single-module progress store:** Funneling all localStorage access through `progressStore.js` made testing straightforward and prevented scattered direct `localStorage` calls throughout the codebase.
- **compliance-refs.json as single source:** Never having to hunt down a hardcoded TSA version string paid off immediately — zero compliance-string bugs found in 8 phases.
- **Strict `> [!OT]` callout convention:** Having a concrete, grep-able pattern for OT callouts made verification automated. All 15 lessons across 5 modules verified in seconds.
- **Dynamic import for circular dep breaking:** `import('./sidebar.js')` in quiz-engine and scenario-engine — resolved a class of circular-dependency bugs before they could accumulate.
- **Dual content-type lesson pattern:** Discovered in Phase 8 — a lesson config object can carry both `exerciseId` and `scenarioId` simultaneously; module-view.js renders all present content-type links without engine changes. Clean extensibility without modification.

### What Was Inefficient

- **Sidebar `<a>` tag bug (Phase 7):** An unclosed `<a>` tag caused all 5 modules not to render in the sidebar — this wasn't caught by automated tests because the tests didn't render the full sidebar DOM. A dedicated sidebar render test would have caught this in Phase 2.
- **Kebab-case icon naming (Phase 7/8):** Lucide icon names must be kebab-case (`book-open`, not `bookOpen`) — this wasn't documented in the project guide and was rediscovered per icon. Should be added to CLAUDE.md.
- **No pre-authoring content review:** Compliance SME review of lesson content was identified in Phase 7 as needed before Phase 7 began — it wasn't scheduled. Content shipped unreviewed. This should be a gate for v2.
- **`window.print` undefined in happy-dom (Phase 6):** Had to add `tests/setup.js` as a Vitest `setupFiles` entry to stub `window.print`. This is a known happy-dom gap that should be in the project's test setup from day one.

### Patterns Established

- **Wave 0 stub file pattern:** Create `src/views/foo-view.js` with `export function renderFoo() { throw new Error('not implemented'); }` before writing any tests. Vitest finds the real file; mocks work. Never use `vi.mock()` for files that don't exist yet.
- **`vi.hoisted()` for mock variable captures:** When the module under test has static imports of the mocked module, capture refs in `vi.hoisted()` — the variable is lifted into the hoisting zone alongside the mock factory.
- **Dynamic import for circular deps:** Any engine that needs to update the sidebar should `const { refreshSidebarProgress } = await import('./sidebar.js')` inside the handler, never as a static import.
- **`esc()` + `safePath()` layered defense:** `esc()` for all developer-controlled strings going into innerHTML; `safePath()` for all module/content IDs going into fetch URLs or href attributes. Consistent pattern across all 6 views.
- **Dual content-type lesson config:** A lesson config object in `modules-config.js` can have multiple content-type keys (`exerciseId`, `scenarioId`, `quizId`). Module-view renders all that are present. No engine changes needed for new combinations.

### Key Lessons

1. **Vite import-analysis runs before vi.mock() factories** — stub files are the only reliable pattern for TDD in this stack. Don't fight it; adopt Wave 0 as standard.
2. **Static site testing can't replace browser smoke tests** — the sidebar `<a>` bug and icon naming were invisible to Vitest but obvious in 30 seconds of browser testing. Human-verify checkpoints are load-bearing, not optional.
3. **OT content requires a different mental model than IT** — the Patch Management module took twice as long per lesson as earlier modules because OT patching constraints (vendor cycles, air-gaps, risk-based deferral) are genuinely complex domain knowledge. Budget more time for OT-heavy content in v2.
4. **NERC CIP framing is a recurring sharp edge** — the "NERC CIP is for electric utilities" disclaimer appeared in 6 lessons. This should be a template snippet or content authoring checklist item, not something authors are expected to recall from scratch.
5. **compliance-refs.json is worth defending** — TSA SD-02F expires May 2, 2026. Update it before that date. The discipline of never hardcoding version strings makes this a one-file, one-line change.

### Cost Observations

- Sessions: ~8 major sessions over 7 days
- Model: Claude Sonnet 4.6 (all phases)
- Notable: Each phase averaged ~1 day of wall-clock time; Phase 7 (3 modules) and Phase 8 (OT-heavy content) were the most content-intensive

---

## Cross-Milestone Trends

| Metric | v1.0 MVP |
|--------|----------|
| Phases | 8 |
| Plans | 30 |
| Timeline (days) | 7 |
| Requirements | 26/26 (100%) |
| Tests at completion | 167 |
| JS LOC | ~6,654 |
| Content LOC (MD+JSON) | ~5,663 |
| Bugs found in review | 5 (3 blockers, 2 warnings) |
| Human-verify checkpoints | 5 (Phases 4, 5, 6, 7, 8) |

---

*Retrospective initialized: 2026-05-17 after v1.0 milestone*
