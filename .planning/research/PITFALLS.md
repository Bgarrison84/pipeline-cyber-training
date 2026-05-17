# Pitfalls Research — v2.0

**Domain:** Adding PWA, fork config, progress sync, and additional content to an existing Vite 6 + Tailwind v4 static training platform  
**Researched:** 2026-05-17  
**Confidence:** HIGH for PWA/content pitfalls (verified against official vite-plugin-pwa docs and Workbox docs, and direct source inspection); MEDIUM for sync/Supabase (verified against Supabase docs + community reports); MEDIUM-LOW for TSA directive successor (no public SD-02G confirmed as of research date)

---

## PWA: Markdown and JSON data files silently excluded from offline cache

**Pitfall:** `vite-plugin-pwa` (Workbox `generateSW` strategy) defaults to only precaching `js`, `css`, and `html` artifacts from the build output. Lesson `.md` files and quiz/exercise/scenario `.json` files live in `public/data/` — they are copied verbatim into `dist/` but Workbox's default `globPatterns: ['**/*.{js,css,html}']` ignores them. The app shell loads fine offline but all lesson fetches return network errors with no user-visible error (content-loader's `fetchLesson` returns `null` on fetch failure and the view renders a blank lesson column).

**Warning sign:** Manual offline test (Chrome DevTools Network panel set to Offline) shows lesson content area blank while nav and sidebar render correctly. No console error appears because `fetchLesson()` has a silent catch.

**Prevention:** Explicitly extend `globPatterns` in the Vite config:
```js
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,md,json,ico,png,svg,webp}']
  }
})
```
This also precaches `compliance-refs.json` and `fork.config.json` — correct behavior; offline users need all data files.

**Phase to address:** PWA implementation phase (PWA-01). Add offline smoke test to acceptance criteria.

---

## PWA: Service worker scope mismatch at GitHub Pages non-root base path

**Pitfall:** This project deploys to `/pipeline-cyber-training/` (set in `vite.config.js` as `base: '/pipeline-cyber-training/'`). Browsers enforce that a service worker cannot control URLs outside the directory where `sw.js` is served. If the plugin or manual registration code places `sw.js` at the domain root (`/sw.js`), scope registration fails with `DOMException: The path of the provided scope (/pipeline-cyber-training/) is not under the max scope allowed`. This is documented as a known issue (vite-plugin-pwa issue #82). The plugin handles this automatically when Vite's `base` is set correctly — the failure occurs when `scope` or `outDir` are manually overridden.

**Warning sign:** Browser console shows `DOMException` during service worker registration. PWA install prompt never appears. DevTools Application tab shows "Registration failed."

**Prevention:** Do not override `scope`, `outDir`, or `base` options inside `VitePWA({})` — let the plugin inherit Vite's `base` config automatically. Verify the built `dist/pipeline-cyber-training/sw.js` path exists after `npm run build`. Never place `sw.js` manually in `public/` — let the plugin generate it.

**Phase to address:** PWA-01. Verify with `vite build && vite preview` before any GitHub Pages deploy; the preview server uses the base path correctly.

---

## PWA: Users stuck on stale cached version indefinitely after content updates

**Pitfall:** With `registerType: 'prompt'` (not `autoUpdate`), an updated service worker downloads but stays in "waiting" state until all app tabs are closed. Learners who keep the training app open as a background tab (common behavior for ongoing training) never receive the update. They see lesson nav links that don't include the new v2.0 lessons, quiz question banks that don't have CONT-07 additions, and possibly the old expired compliance badge text.

**Warning sign:** After deploying a new build, some users report not seeing new lessons that others see. Issue resolves when they close and reopen the tab. No error occurs.

**Prevention:** Use `registerType: 'autoUpdate'` with `skipWaiting: true` in Workbox options so the new service worker activates immediately on install. Implement the PWA-02 offline indicator as a combined "update available — reload" notification using the `workbox-window` `waiting` event. This makes the update visible without requiring the user to close all tabs.

**Phase to address:** PWA-01 and PWA-02 together — the update notification is part of the activation strategy.

---

## PWA: Cached compliance-refs.json goes stale after SME update if build is skipped

**Pitfall:** After SME-01 updates `compliance-refs.json`, existing users with a cached service worker receive the old JSON from precache. The Workbox precache manifest only updates when `npm run build` is run — a developer who edits `public/data/compliance-refs.json` directly in GitHub's web editor and commits to `main` without triggering a CI build will not regenerate the Workbox manifest. The new content hash for the file never appears in `sw.js`, so the cached old file is never invalidated.

**Warning sign:** `compliance-refs.json` shows expired TSA SD-02F dates in the compliance badge for users who visited before the update, even days after the file was changed on the server. The issue affects offline users only; online users get the fresh file via the network.

**Prevention:** Always run `npm run build` after any `public/` data file change. Document this constraint in the SME review checklist. Never patch `dist/` files directly. If GitHub Actions CI is set up for deployment, this is automatic — make CI the only deployment path.

**Phase to address:** SME compliance phase (SME-01) — add this rule to the SME review artifact.

---

## PWA + Progress Sync: sync API calls cached by service worker silently return stale data

**Pitfall:** If Supabase or GitHub Gist sync API calls pass through the service worker's `fetch` event handler and the Workbox runtime caching strategy for those URLs is missing or defaults to `StaleWhileRevalidate`, sync calls can return cached responses from a previous session. A `PUT` to update Gist content returns a cached `200` — the user believes sync succeeded but the Gist is never updated.

**Warning sign:** Sync "succeeds" (no errors in UI) but progress on the second device always shows the state from the first successful sync, never updated. The issue is only visible when testing cross-device sync manually.

**Prevention:** Add explicit `NetworkOnly` runtime caching entries that match the sync backend URLs in the same PR as PWA implementation:
```js
workbox: {
  runtimeCaching: [{
    urlPattern: /^https:\/\/api\.github\.com\//,
    handler: 'NetworkOnly',
  }, {
    urlPattern: /^https:\/\/.*\.supabase\.co\//,
    handler: 'NetworkOnly',
  }]
}
```

**Phase to address:** SYNC-02 implementation, coordinated with PWA-01. These two phases must share a PR or the sync networking configuration must be in scope during PWA implementation.

---

## Fork Config: fork.config.json fetch adds a second startup async call without test isolation

**Pitfall:** `main.js` already calls `loadComplianceRefs()` at startup (a `fetch()` call). Adding a second startup fetch for `fork.config.json` using the same pattern means two async fetches must resolve before the app renders. Tests that exercise modules which read fork config data need to mock `global.fetch` for BOTH files. The existing Vitest test pattern uses `vi.mock` at the module level for most modules — a raw `fetch` mock in test setup may not be in time for test files that import `main.js` or trigger fork config loading via module side-effects. The "Wave 0 stub file" pattern documented in `PROJECT.md` is the established solution.

**Warning sign:** Tests that previously passed start failing with `fetch is not defined` or fork config returning `null` when tests expect default values. Sidebar renders nothing in tests that render the full app shell.

**Prevention:**
- Implement fork config loading as a named export `loadForkConfig()` in `main.js`, following the exact pattern of `loadComplianceRefs()`.
- If `fork.config.json` returns 404, return a full default config object — never `null`. This keeps all code paths that read fork config safe without null guards everywhere.
- `fork.config.json` must be placed in `public/` (not `src/`) so it is served statically at `import.meta.env.BASE_URL + 'fork.config.json'`.
- Tests that mock fork config: use `vi.spyOn(window, 'fetch')` targeting the fork config URL, or mock the `loadForkConfig` export directly.

**Phase to address:** Fork config implementation phase (FORK-02/FORK-03).

---

## Fork Config: activeModules filtering applied to progress calculation layer breaks completion math

**Pitfall:** `fork.config.json` specifies `"activeModules": ["logging-auditing", "network-hardening"]` to hide unused modules. But `MODULES` in `modules-config.js` is a static array imported at module load time — before `fork.config.json` is fetched. `computeModuleProgress()` in `quiz-engine.js` iterates `MODULES`. If fork config filtering is applied to the sidebar render but not to `computeModuleProgress`, the completion summary and progress bars count deactivated modules as 0% complete, making "100% complete" impossible for a fork with only 2 active modules.

**Warning sign:** A fork with `activeModules: ["logging-auditing"]` shows "20% complete" even when all Logging & Auditing lessons are done, because 4 other modules remain at 0%.

**Prevention:** Apply fork config filtering only at render layer (sidebar, home view module cards). `computeModuleProgress()` should always receive the full module object and compute progress correctly. The completion summary and progress bars must be filtered by the same active module list before aggregating totals. Do not mutate `MODULES` — pass a filtered view as a parameter.

**Phase to address:** FORK-03 implementation. Write a test with a 2-module active list and verify completion summary shows correct denominator.

---

## Fork Config: root-relative logo path breaks at GitHub Pages sub-path deployment

**Pitfall:** `fork.config.json` will specify `logoPath` as an asset path. If fork operators write `"/assets/logo.png"` (root-relative), the browser resolves it to `https://org.github.io/assets/logo.png` instead of `https://org.github.io/pipeline-cyber-training/assets/logo.png`. The logo shows as a broken image. This fails silently in local dev if `vite dev` is run without the base path prefix.

**Warning sign:** Logo renders correctly in `localhost:5173` but is a broken image on GitHub Pages. No console error — just a 404 for the image resource.

**Prevention:** Document in `FORK-01` that logo paths must be relative (e.g., `"assets/logo.png"` not `"/assets/logo.png"`). The app must prepend `import.meta.env.BASE_URL` when constructing the `<img src>`:
```js
const logoSrc = import.meta.env.BASE_URL + forkConfig.logoPath;
```
Include this in the fork guide's configuration example.

**Phase to address:** FORK-01 documentation and FORK-03 implementation.

---

## SME: Quiz JSON hardcodes "SD-02F" — not sourced from compliance-refs.json

**Pitfall:** Quiz answer explanations in module JSON files reference "TSA SD-02F" directly in `feedback` and `explanation` strings (confirmed in `public/data/modules/logging-auditing/quizzes/01.json` — the question stem reads "Under TSA SD-02F, what is the minimum retention period..."). These strings are NOT sourced from `compliance-refs.json`. When SD-02F is superseded, the quiz questions themselves become factually incorrect without a content audit. The SME review checklist (SME-02) might scope only to lesson Markdown files and miss the quiz JSON.

**Warning sign:** `compliance-refs.json` is updated to the new directive version but quiz stems and explanations still reference "SD-02F" by name. The compliance badge shows the new directive but the quiz content contradicts it.

**Prevention:**
- SME review checklist (SME-02) MUST explicitly scope all `quizzes/*.json`, `exercises/*.json`, and `scenarios/*.json` files, not just lesson `.md` files.
- When updating `compliance-refs.json`, run a text search across all `public/data/` for `"SD-02F"`, `"Pipeline-2021-02F"`, and the old effective date string.
- Consider adding a `lastReviewed` field to quiz JSON files (parallel to the lesson frontmatter `lastReviewed` that SME-03 establishes), so content currency is auditable per artifact.

**Phase to address:** SME compliance phase (SME-01 through SME-03).

---

## SME: TSA SD-02F successor not yet public — expired badge state needed immediately

**Pitfall:** Research as of 2026-05-17 finds no publicly announced successor to SD-02F (expired May 2, 2026). The current `badge.js` reads `shortName` from `compliance-refs.json` and renders it directly. There is no conditional rendering for an expired directive. After the expiry date, the badge silently displays "TSA SD-02F" with no indication it is expired, signaling to compliance-aware learners that the training may be outdated.

**Warning sign:** The badge renders "TSA SD-02F" to all users after May 2, 2026, with no expiry indicator. A learner checking TSA.gov finds no active SD-02F.

**Prevention:**
- Add an `"expiryDate"` check to `badge.js`: if today's date exceeds `directives.TSA.expiryDate`, render a "TSA SD-02F (Pending renewal — check TSA.gov)" badge state with a warning color instead of the normal compliance tag.
- Add a `"status": "expired"` or `"status": "active"` field to `compliance-refs.json` that the badge reads, so the update is a one-field JSON change rather than a code change.
- Treat "update expired status" and "update to successor" as two separate tasks in SME-01.

**Phase to address:** SME-01. The expired status fix should be the first commit in that phase, before any successor research.

---

## Progress Sync: schemaVersion bump requires migration chain before CURRENT_VERSION changes

**Pitfall:** SYNC-02 may require new fields in the progress store (e.g., `syncState`, `deviceId`, `lastSyncedAt`). When `CURRENT_VERSION` in `progress-store.js` is bumped from 1 to 2, the `migrate()` function must include a `v1 → v2` chain step that fills in the new fields with safe defaults. The current `_blankStore()` returns the v1 shape — it must be updated to the v2 shape before `CURRENT_VERSION` is bumped. If bumped first, the `migrate()` function runs but does not know what to add, and users get a partially migrated store.

**Warning sign:** A user who exported progress under v1.0 and imports it into v2.0 gets `ok: true` from `importProgress()` but the new `syncState` field is `undefined`, causing TypeErrors when sync code reads `store.syncState.deviceId`.

**Prevention:** Follow the sequence:
1. Update `_blankStore()` with new v2 fields and safe defaults.
2. Add the migration step to `migrate()`: `if (d.schemaVersion === 1) { d = migrateV1toV2(d); }`.
3. Bump `CURRENT_VERSION` to 2.
4. Write migration tests for `v1 → v2` in `progress-store.test.js` BEFORE writing the migration code (Red-Green pattern).

Never bump `CURRENT_VERSION` in the same commit as adding new `_blankStore()` fields — keep them as two sequential commits so the test failure is visible.

**Phase to address:** SYNC-01 ADR (plan the migration) and SYNC-02 implementation.

---

## Progress Sync: GitHub Gist option requires PAT in client-side storage

**Pitfall:** GitHub Gist API requires a Personal Access Token with `gist` scope for write access. If SYNC-01 ADR selects GitHub Gist, the PAT must be stored somewhere on the client. Storing it in localStorage means any XSS attack can exfiltrate a real GitHub credential. PATs issued with `gist` scope also allow reading private gists — broader than intended. This is especially poor optics for a cybersecurity training platform aimed at pipeline operators.

**Warning sign:** The sync flow works in testing but a security review of the SYNC-01 ADR flags the PAT-in-localStorage pattern as a credential exposure anti-pattern.

**Prevention:** The SYNC-01 ADR must explicitly evaluate the credential exposure tradeoff for each option. Prefer Supabase anon + RLS or URL-based export over GitHub Gist. If Gist is selected, document the risk clearly in the UI and scope the PAT to only `gist` and only allow it via a user-initiated paste into a local-only settings field — never auto-populated, never transmitted except to the GitHub API.

**Phase to address:** SYNC-01 ADR. This decision must be resolved before SYNC-02 begins.

---

## Progress Sync: Supabase table without RLS enabled is world-readable

**Pitfall:** Supabase's `anon` key is intentionally public and safe to ship in frontend code — BUT only when Row Level Security (RLS) is enabled on every table. If a `progress` table is created with RLS disabled (the Supabase default for new tables), any visitor with the anon key can `SELECT * FROM progress` and see all users' data, or `DELETE FROM progress` to wipe everyone's records. This is not theoretical — multiple production Supabase deployments have had this exact exposure. Supabase shows a dashboard warning but it is easy to miss.

**Warning sign:** RLS is not shown as "enabled" in the Supabase dashboard Table Editor for the `progress` table. Any browser console command `await supabase.from('progress').select('*')` returns all rows.

**Prevention:**
- Enable RLS on the `progress` table immediately after creation, before any data is written.
- Policy: all operations require `device_id = current_setting('app.device_id', true)` or equivalent JWT claim scoping.
- Since the app has no auth, generate a `device_uuid` client-side (stored in localStorage), pass it as a custom Supabase header or via Supabase anonymous auth JWT.
- Include RLS policy verification in the SYNC-02 phase acceptance criteria — not just "sync works" but "user A cannot read user B's rows."

**Phase to address:** SYNC-02 implementation. RLS configuration must be in the same PR as the Supabase table creation.

---

## Content Additions: modules-config.js must be updated alongside every new lesson file

**Pitfall:** When adding new lessons, the content author adds a `.md` file to `public/data/modules/<id>/lessons/` and updates `public/data/modules/<id>/module.json`. But `src/modules-config.js` is the authoritative source for lesson lists at runtime — `getLessonNav()`, `computeModuleProgress()`, sidebar rendering, exercise-view's lessonId derivation, and the completion summary all read from `MODULES`. A new lesson file that is not in `MODULES` is unreachable: the sidebar doesn't link to it, `getLessonNav()` returns `next: null` for the previous lesson, and the module progress denominator doesn't count it.

**Warning sign:** New lesson file exists and can be fetched directly by URL, but is not visible in the sidebar. The preceding lesson's "Next lesson" link points to the wrong lesson (or shows nothing).

**Prevention:** Treat `modules-config.js` as a required change alongside every new lesson. The content authoring guide (`FORK-01`) must document this dual-update requirement. After each lesson addition, run `npm test` — `content-loader.test.js` tests for `getLessonNav()` will fail if the lesson ordering is wrong. Note: the 8 test files that mock `modules-config.js` use minimal fixture arrays and do not need to mirror production lesson counts.

**Phase to address:** Content additions phase (CONT-05). Verify the dual-update workflow with the first lesson addition before adding all remaining lessons.

---

## Content Additions: Expanded quiz questions are invisible to users who already completed the quiz

**Pitfall:** The quiz engine tracks completion by comparing `answeredCount === totalQuestions` (line 240 in `quiz-engine.js`). `totalQuestions` is `quiz.questions.length` at render time. Prior completion is stored as `{ score: N, total: M }`. If CONT-07 adds 3 new questions to `logging-auditing/quizzes/01.json` (3 → 6 questions), a returning user who previously completed the quiz sees the "revisit" view (score banner + locked cards) with only 3 locked questions. The 3 new questions are never rendered for that user — they appear to have "completed" a quiz containing content they've never seen.

**Warning sign:** A user who completed the logging-auditing quiz before CONT-07 deployed sees "3/3 correct — 2026-04-15" and 3 locked question cards. The 3 new questions do not appear.

**Prevention:** When expanding a quiz question bank, create a new quiz file (`02.json`) rather than adding questions to an existing file. Wire it as a second quiz entry in `modules-config.js` for the appropriate lesson. Do not delete or reorder existing question IDs in quiz files — the stored `score` and `total` refer to the old question set implicitly, and reordering makes the score misleading.

**Phase to address:** CONT-07. Treat expanding question banks as additive content (new quiz file), not as modifications to existing quiz files.

---

## Content Additions: New branching scenario nextPhaseId typos cause silent null routing

**Pitfall:** `scenario-view.js` includes `validateScenario()` which checks all `nextPhaseId` references resolve to real phase IDs. When CONT-06 new multi-path scenarios are authored, a typo in `nextPhaseId` causes `validateScenario()` to return `false` and the view renders "scenario data is invalid." This failure is only visible when a user clicks the specific choice that routes to the broken phase — other paths through the scenario work fine. CI never navigates to all scenario branches.

**Warning sign:** A scenario appears to work (first branch navigates correctly) but a specific choice selection triggers a "scenario data is invalid" render. Bug is only found in manual testing of all branches.

**Prevention:** Add a build-time (or Vitest) validation script that loads all `scenarios/*.json` files and runs `validateScenario()` against each. This converts a runtime content error into a CI failure. The SME review checklist (SME-02) should include "all scenario branch paths manually tested." A short Node script in `scripts/validate-scenarios.js` + `npm run validate` is sufficient.

**Phase to address:** Content additions phase (CONT-06). Add the validation script before authoring any new scenarios.

---

## Cross-Feature Pitfalls

### PWA + Fork Config: public fork.config.json precached before operator customizes it

**What goes wrong:** `vite-plugin-pwa` precaches all files matching `globPatterns` at build time, including `public/fork.config.json`. If the default (empty) `fork.config.json` is precached in the public build, a fork operator who edits `fork.config.json` in GitHub's web editor without triggering a CI rebuild does not regenerate the Workbox manifest. Offline users receive the uncustomized default fork config indefinitely.

**Prevention:** Document in `FORK-01` that after any change to `fork.config.json`, running `npm run build` and redeploying is mandatory. If GitHub Actions CI deploys automatically on push to main, this is automatic — make CI the only deployment path for all fork deployments.

**Phase to address:** FORK-01 documentation. Add a warning box to the fork guide.

---

### Content Additions + modules-config.js + Vitest: test count drift from real vs fixture data

**What goes wrong:** Eight test files mock `../src/modules-config.js` with minimal fixture arrays. Real `MODULES` has 3 lessons per module (15 total at v1.0). Adding lessons per CONT-05 makes real `MODULES` have 5+ lessons per module (25+). Tests use their own fixtures — correct and intentional. However, if any test asserts on exact counts using hardcoded numbers that matched the v1.0 production data (e.g., `expect(items.length).toBe(15)`), those assertions will now diverge from what real users see, without the test actually failing. The tests pass but they've stopped describing production behavior.

**Prevention:** Audit test files for hardcoded counts that assume v1.0 lesson structure (look for `toBe(15)`, `toBe(3)`, `toBe(5)`) before CONT-05 begins. Make count assertions use the fixture array's own length dynamically. The production code and the fixture data are intentionally decoupled — but that decoupling must not hide regressions.

**Phase to address:** CONT-05. Run full test suite after first lesson additions and fix any count-based assertions that have become misleading.

---

## Silent Failures

### Lesson content blank offline — no error shown

**What happens:** `fetchLesson()` in `content-loader.js` returns `null` on fetch failure and the lesson view renders a blank content area. Offline users see a styled shell (sidebar, nav, header) with an empty main column. No error message, no "you are offline" indicator. Users assume the content is loading or that there is a bug.

**Why it's silent:** The `catch` in `fetchLesson` returns `null`. The lesson view checks `if (!rawMarkdown)` and returns early without setting an error state.

**Mitigation:** Add explicit offline detection to the lesson view: if `fetchLesson` returns `null`, check `navigator.onLine` — if `false`, show "You are offline. Connect to load this lesson." If `true`, show "Could not load lesson content." This is separate from the PWA-02 offline indicator which is a global status badge.

---

### fork.config.json 404 causes TypeError if not null-guarded throughout

**What happens:** If `fork.config.json` is absent (public repo, no fork customization), `loadForkConfig()` returns `null`. Any code that reads `forkConfig.activeModules` without an optional chain guard throws `TypeError: Cannot read properties of null`. The error is caught by the view renderer's try/catch, which then sets `app.innerHTML = ''` — a blank white screen with no feedback.

**Why it's silent:** The TypeError is swallowed by the view renderer's catch block. The app renders nothing. No console error is shown in production builds.

**Mitigation:** `loadForkConfig()` must return a full default config object on 404, never `null`. Define `DEFAULT_FORK_CONFIG` as a module-level constant and return it on any fetch failure:
```js
const DEFAULT_FORK_CONFIG = {
  orgName: '',
  logoPath: null,
  activeModules: null,  // null = all modules active
  complianceRefsOverrides: {}
};
```

---

### Progress store migration silently zeroes user progress if _blankStore() keys are wrong

**What happens:** The `migrate()` function fills missing keys using `if (!(key in d)) d[key] = blank[key]`. This is correct. But if a v2.0 `_blankStore()` accidentally renames an existing key (e.g., `quizzes` becomes `quizResults`), all existing quiz progress disappears on the next `init()` call — `d.quizzes` is present, but the code now reads `d.quizResults` which is blank.

**Why it's silent:** The app continues to work. Quiz progress shows as not attempted. The user only notices when they return to a lesson they completed and find it unmarked.

**Mitigation:** Never rename existing keys in `_blankStore()` in a version bump — only add new keys. The existing `migrate()` guard `if (!(key in d))` protects against missing keys but not against key renames. Add a test that asserts all v1 keys are present in the v2 schema: `expect(v2BlankStore).toMatchObject(v1BlankStore)`.

---

### Service worker update never activates for multi-tab users

**What happens:** With `registerType: 'prompt'` and no `skipWaiting`, the updated service worker sits in "waiting" state indefinitely as long as at least one tab with the app is open. The learner using the training continuously (tabbed open all day) never receives content or config updates.

**Why it's silent:** No error. The app works normally on the old cached version. The service worker update status is visible only in DevTools Application tab.

**Mitigation:** Use `registerType: 'autoUpdate'` + `skipWaiting: true` in Workbox config. Combined with `clients.claim()`, this activates the new worker immediately without user action and without requiring tab closure.

---

## Phase-Specific Warning Summary

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Content additions (CONT-05) | New lessons not in modules-config.js — unreachable via nav | modules-config.js update is required alongside every new lesson file |
| Content additions (CONT-07) | Expanded quiz questions invisible to prior completers | Use new quiz file (02.json) not additions to existing file |
| Content additions (CONT-06) | Scenario nextPhaseId typo causes silent null-routing on specific branches | Add build-time validateScenario() CI check before authoring new scenarios |
| Fork config (FORK-02/FORK-03) | fork.config.json 404 causes TypeError if not null-guarded | Return DEFAULT_FORK_CONFIG object on 404 — never null |
| Fork config (FORK-03) | activeModules filtering applied to computeModuleProgress breaks completion totals | Filter only at render layer; progress calculation uses full MODULES |
| Fork config logo | Root-relative logoPath breaks at sub-path deployment | Prepend BASE_URL in app; document in FORK-01 |
| SME update (SME-01) | Quiz JSON hardcodes "SD-02F" — not sourced from compliance-refs.json | SME checklist must scope quiz/exercise/scenario JSON files; run full-text search |
| SME update (SME-01) | No confirmed successor directive yet — expired badge needed now | Add expiry status logic to badge.js; separate "mark expired" from "update to successor" |
| PWA (PWA-01) | Markdown and JSON files not in default precache glob | Add `md,json` to globPatterns explicitly |
| PWA (PWA-01) | sw.js scope mismatch at non-root GitHub Pages base path | Do not override scope/outDir in VitePWA; let plugin inherit Vite base |
| PWA (PWA-02) | Users stuck on stale cached version indefinitely | autoUpdate + skipWaiting + reload notification |
| Sync ADR (SYNC-01) | GitHub Gist sync exposes PAT in localStorage | Document credential exposure in ADR; prefer Supabase anon + RLS |
| Sync implementation (SYNC-02) | Supabase table without RLS is world-readable | RLS required in acceptance criteria, not just "sync works" |
| Sync implementation (SYNC-02) | schemaVersion bump without migration chain corrupts existing stores | Implement migrate() chain step and tests before bumping CURRENT_VERSION |
| PWA + Sync (cross-feature) | Sync API calls cached by service worker — silent stale writes | NetworkOnly runtime caching for sync backend URLs in same PR as PWA |
| PWA + SME (cross-feature) | Updated compliance-refs.json not reflected for offline users | Always rebuild after any public/ file change — document in SME checklist |
| PWA + Fork Config (cross-feature) | Fork operator edits fork.config.json without rebuild — cached version not updated | Document in FORK-01: rebuild is mandatory after any fork.config.json change |

---

## Sources

- [vite-plugin-pwa: Service Worker Precache — globPatterns](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — HIGH confidence
- [vite-plugin-pwa Issue #82: Problem with path in non-root hosting like GitHub Pages](https://github.com/vite-pwa/vite-plugin-pwa/issues/82) — MEDIUM confidence
- [Workbox: Handling service worker updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates) — HIGH confidence
- [Supabase: Securing your API — anon key and RLS](https://supabase.com/docs/guides/api/securing-your-api) — HIGH confidence
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Vitest: Mocking modules — vi.mock hoisting](https://vitest.dev/guide/mocking) — HIGH confidence
- [TSA SD-02F PDF — confirms expiry May 2, 2026](https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf) — HIGH confidence; no confirmed successor as of 2026-05-17
- Project source code direct inspection: `src/progress-store.js`, `src/quiz-engine.js`, `src/modules-config.js`, `src/content-loader.js`, `src/main.js`, `src/views/scenario-view.js`, `tests/progress-store.test.js`, `tests/quiz-engine.test.js`, `public/data/modules/logging-auditing/quizzes/01.json` — HIGH confidence
