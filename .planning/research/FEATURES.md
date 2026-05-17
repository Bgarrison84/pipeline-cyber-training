# Features Research — v2.0

**Domain:** Static browser-based cybersecurity compliance training for OT/IT pipeline admins
**Researched:** 2026-05-17
**Milestone:** v2.0 — Content Depth & Platform Maturity
**Overall confidence:** HIGH (PWA/offline patterns, content depth), MEDIUM (sync options, SME process), LOW (TSA SD successor designation)

> This file covers NEW v2.0 features only. v1.0 features are documented in `.planning/milestones/v1.0-phases/`.
> The PWA offline anti-feature from v1.0 FEATURES.md is REVERSED here by explicit project decision for air-gapped fork use case.

---

## 1. Content Depth (CONT-05, CONT-06, CONT-07)

**Table stakes:** What must work for this to be useful
- Each new lesson maps explicitly to at least one TSA SD-02 series control and one NIST SP 800-82 chapter
- Lessons follow the same Markdown-plus-frontmatter authoring contract as v1.0 lessons — no new rendering infrastructure needed
- Advanced scenarios must include OT-specific branching paths (not just IT-path with an OT footnote); an OT outcome that differs meaningfully from the IT outcome is the minimum bar
- New quiz questions use the same per-answer-feedback JSON schema as v1.0 (ASSESS-01); adding questions must not require schema changes
- "After this module you can..." outcome statements updated to reflect new lessons
- OT callout blocks (`> [!OT]`) required in every dual-use lesson, per DATA-03 rule

**Differentiators:** What would make it stand out
- Advanced lessons tackle the edge cases v1.0 skipped: air-gapped WSUS alternatives for OT, PS Remoting disabled in segmented OT networks, detecting lateral movement between IT/OT DMZ, vendor-coordinated patch windows with evidence documentation
- Scenarios drop the learner into a partially active incident mid-state (not a clean starting scenario), forcing triage under ambiguity — this is the realistic OT incident condition
- Multi-path scenario outcomes that reflect the actual tradeoff: "shut down SCADA for safety vs. keep running while isolating" — both are legitimate responses depending on pipeline state, and the scenario should model both without a single "correct" answer
- Quiz banks large enough for question rotation on re-attempt (3+ new questions per module means modules with small banks get meaningful variety)
- At least one advanced lesson per module references a real post-incident report (Colonial Pipeline, Oldsmar water treatment) as an anonymized case study with control mapping

**Anti-features:** What would backfire for this audience
- Lessons that re-teach v1.0 content dressed up as advanced material — IT/OT admins will notice and trust declines
- Scenarios with obvious "correct" answers (clicking the obviously-right option in three steps is not a scenario, it is a quiz question)
- New lessons that introduce OT-specific tooling requiring anything beyond PS 5.1 and built-in Windows tools — the platform's stated environment is Windows built-in, this must hold
- Quiz questions that test memorization of control ID numbers rather than the behavior the control requires — compliance exams test that; this platform should test application

**Complexity:** Medium (authoring labor-intensive, no new technical infrastructure)
**Depends on:** CONT-01 (Markdown lesson pipeline), CONT-04 (compliance-refs.json), ASSESS-01 (quiz engine), ASSESS-02 (scenario engine), DATA-03 (OT callout pattern), all v1.0 module JSON schemas

---

## 2. Internal Org Fork Guide + Config System (FORK-01, FORK-02, FORK-03)

**Table stakes:** What must work for this to be useful
- A deploying org can change: display name, logo, active modules shown in sidebar, and compliance-refs overrides — without touching source lesson content
- `fork.config.json` read at app startup (not at build time) so a forked deployment can be reconfigured without rebuilding
- The fork deployment guide covers the exact steps for: cloning the repo, setting `fork.config.json`, configuring GitHub Pages for the org account (or self-hosting), and verifying the config is applied
- Config file must have safe defaults — a missing or malformed `fork.config.json` must fall back to the public defaults, not error out
- Module-level activation/deactivation: an org that only needs Logging & Auditing and Incident Response should be able to disable the other three modules from the sidebar without deleting files
- Logo path must accept a relative path to a file in the repo (static hosting; no remote CDN fetch that could fail)

**Differentiators:** What would make it stand out
- Compliance-refs overrides per org: a company whose internal policy references a specific directive version or an additional internal standard can inject that into the display without forking the compliance-refs.json itself
- A "fork health check" utility (simple JS or PS script) that validates the config file structure and reports missing fields, wrong paths, or inactive modules before deployment
- A section in the fork guide specifically addressing air-gapped internal hosting: how to serve the static dist/ directory from IIS or Apache on an internal server with no internet access
- A documented "custom module" stub: show the file structure an org would need to add a proprietary 6th module (internal SOPs, company-specific procedures) without breaking the router or progress store
- Config validation that surfaces misconfiguration in the UI itself during fork development (e.g., a red banner in dev mode if fork.config.json has errors)

**Anti-features:** What would backfire for this audience
- A build-time config approach (env vars baked in by Vite) — this forces orgs to install Node.js and rebuild, which is a hard barrier for IT admins who just want to deploy a static site
- A config system that requires touching the Vite config or source JS files — same barrier; the fork guide must be "edit one JSON file, push, done"
- Branding controls that extend to lesson content (swapping module titles, control IDs, or lesson text via config) — that creates unaudited content drift; content changes must be deliberate forks of lesson files, not config-layer overrides
- A config schema so flexible it has no validation — "anything goes" configs will produce silent failures at runtime (missing sidebar, broken compliance refs) that are hard to debug without good defaults and error messaging

**Complexity:** Medium (runtime config loading is straightforward; the authoring of the fork guide is the harder part)
**Depends on:** SHELL-01 (sidebar), SHELL-04 (compliance index), DATA-01 (compliance-refs.json), CONT-04 (control ID display), progress-store.js (schemaVersion key — must not break on fork reconfig)

---

## 3. Compliance SME Review Artifacts (SME-01, SME-02, SME-03)

**Table stakes:** What must work for this to be useful
- TSA directive version in `compliance-refs.json` updated to reflect the current active directive in the SD-02 series (SD-02F expired May 2, 2026; the successor version string must be researched and applied)
- The SME checklist covers every lesson in every module and asks: (a) is the control mapping accurate for the current directive version?, (b) is the PS command syntax correct for PS 5.1?, (c) does the OT callout reflect current OT practice?, (d) has the lesson been reviewed since the last directive revision?
- "Last reviewed" metadata is machine-readable (stored in lesson frontmatter, not just a comment) so a compliance officer can query which lessons are overdue for review
- The checklist is printable (clean print CSS or PDF-ready layout) so it can be handed to an external SME or attached to an audit file
- The checklist produces a dated, named sign-off artifact — who reviewed which lesson, when, and what they confirmed

**Differentiators:** What would make it stand out
- Review metadata in frontmatter (`reviewed_by`, `reviewed_date`, `directive_version_at_review`) displayed in the lesson UI as a subtle "content currency" indicator visible to learners and compliance officers
- A generated review status page (static, built from frontmatter) that shows at a glance which lessons are current vs. overdue vs. never reviewed — audit evidence in one URL
- Checklist structured to match the TSA SD-02 series pillar structure, not just a generic content accuracy list — makes it directly usable as an audit response artifact ("our training content was reviewed against SD-02[X] Pillar 2 Measure 3")
- Version-diff notes in the checklist for lessons that cover controls that changed between SD-02E and SD-02F (or successor) — tells the SME exactly what to look for

**Anti-features:** What would backfire for this audience
- A review system that requires logins, databases, or any server component — the SME process must work as a printable document workflow, not a SaaS tool
- "Last reviewed" dates that are set automatically by git commit timestamps — git history is not a SME sign-off; the dates must be set explicitly by a human reviewer
- A checklist that conflates content accuracy review with technical testing — SME review confirms regulatory accuracy; technical testing (PS commands, quiz logic) is a separate concern with separate tooling
- Presenting the SME checklist as a "compliance certification" of the platform — it is evidence of diligence, not regulatory certification; the language must be precise about what it is and is not

**Complexity:** Low (metadata and documentation), but with a HIGH-stakes research dependency (finding the correct TSA SD successor version string before anything else ships)
**Depends on:** DATA-01 (compliance-refs.json — the primary artifact to update), CONT-04 (control ID display), all lesson frontmatter schema (adding reviewed_by/reviewed_date fields)

**Critical pre-work:** TSA SD-02F expired May 2, 2026. The SD-02 series has historically been renewed with a letter increment. Evidence from TSA search results shows SD-01G issued January 16, 2026 (effective through January 2027). The SD-02 series successor may be SD-02G. This requires direct verification against TSA's current SD-and-EA page or the TSA press release page before SME-01 can be marked complete. This is the single highest-urgency requirement in v2.0. (LOW confidence on exact designation — do not assume SD-02G; verify first.)

---

## 4. PWA / Offline Support (PWA-01, PWA-02, PWA-03)

**Table stakes:** What must work for this to be useful
- After one load with network access, ALL content is available offline: lessons (Markdown files fetched and rendered), quizzes (JSON), exercises (JSON), scenarios (JSON), and all static assets
- The service worker must not interfere with lesson content updates — when a new lesson is deployed, the next online load must invalidate the stale cache for that file (stale-while-revalidate or network-first for content files; cache-first for static assets)
- The offline indicator is always visible and unambiguous — not a browser default icon but an explicit UI element ("Running cached version — connect to check for updates")
- Progress tracked in localStorage continues to work identically offline — no sync dependency for basic progress
- The implementation must be compatible with GitHub Pages hosting: no custom server headers beyond what GitHub Pages provides; service worker scope must match the Pages base path

**Differentiators:** What would make it stand out
- Cache strategy differentiated by file type: cache-first for fonts/images/CSS/JS bundles (never change without a new hash); network-first for lesson Markdown and JSON data (content evolves); stale-while-revalidate for compliance-refs.json (regulatory metadata)
- An explicit "update available" notification when a new version is detected — not just a silent update, but a user-dismissable banner saying "New content available — reload to update" (critical for orgs that need to know when training content changes)
- For air-gapped fork deployments: a documented workflow for pre-caching all content during a connected session on an internet-adjacent machine, then serving the app locally from that machine's browser cache or from a copied dist/ directory
- Workbox integration via `vite-plugin-pwa` using `generateSW` strategy with explicit `globPatterns` to include `data/**/*.json` and `data/**/*.md` files — these are not in the default precache manifest for Vite builds
- A PWA manifest with appropriate `name`, `short_name`, `icons`, and `display: standalone` so the app can be added to desktop (useful for admin workstations in OT environments that do not allow browser shortcuts but allow installed PWAs)

**Anti-features:** What would backfire for this audience
- A service worker that caches everything indefinitely with no invalidation — when TSA updates compliance-refs.json after a directive revision, admins running the cached version will see stale control IDs without knowing it
- Prompting users to "install the app" with a banner on every visit — PWA install prompts are appropriate for consumer apps; IT/OT admins will find this intrusive and it signals the wrong product category
- A service worker that intercepts and caches API calls that do not exist (this is a static site; the service worker should cache fetches to the /data/ directory, not attempt any dynamic API caching)
- Making offline support opt-in via a toggle — the value of offline support for this audience (air-gapped environments, VPN-restricted OT networks) is that it works without the user having to think about it; it must be automatic after first load
- HTTPS enforcement warnings that block the site on internal HTTP deployments — air-gapped org forks may serve over HTTP on an internal network; the service worker registration should degrade gracefully on HTTP rather than blocking the app

**Complexity:** Medium (vite-plugin-pwa simplifies most of the implementation, but cache strategy for dynamically fetched Markdown/JSON requires explicit Workbox config; GitHub Pages path handling requires careful scope configuration)
**Depends on:** Vite build pipeline (already established), content-loader.js (fetches Markdown/JSON — these fetches must be interceptable by the service worker), DATA-01 (compliance-refs.json — highest priority for cache invalidation strategy)

**Implementation note:** `vite-plugin-pwa` with `generateSW` strategy is the right tool. The key configuration challenge is adding `data/**/*.json` and the lesson `.md` files to the Workbox precache manifest, since Vite's default manifest only includes hashed JS/CSS/HTML assets. This is solvable with `globPatterns` in the Workbox config block.

---

## 5. Cross-Device Progress Sync (SYNC-01, SYNC-02)

**Table stakes:** What must work for this to be useful
- The ADR (SYNC-01) must be written before any implementation begins — this is a non-negotiable architectural decision with significant scope implications
- Whatever sync approach is chosen, the existing JSON export (DATA-05) remains the fallback — import/export must still work independently of the sync mechanism
- The sync mechanism must be compatible with the static-site constraint (no backend owned by this project) — but a free third-party backend (e.g., Supabase free tier, GitHub Gist API) is acceptable if the ADR justifies it
- Progress sync must handle conflict resolution for the common case: user completes lesson on workstation, then completes a different lesson on laptop — both completions should merge, not overwrite
- Any credentials required for sync (OAuth tokens, API keys) must not be hardcoded anywhere in the repo

**Differentiators:** What would make it stand out

The four viable sync options for a static site (ranked by implementation complexity and audience fit):

1. **Enhanced import/export with QR code** — Generate a QR code from the JSON progress export; scan on second device to import. Zero backend dependency. Audience (IT admins) comfortable with QR tools. LOW complexity. Limitation: requires deliberate manual action, not automatic sync.

2. **GitHub Gist sync** — Authenticate via GitHub OAuth (device flow or redirect flow), store progress JSON in a user-controlled private Gist, sync on load/completion. Users in this audience almost certainly have GitHub accounts. MEDIUM complexity. Limitation: GitHub OAuth exchange requires a relay service (the client secret cannot be in static JS); a free serverless function (Cloudflare Worker, Netlify Function) can handle the token exchange without a full backend.

3. **Supabase free tier** — Anonymous auth (no email/password required) + a single `progress` table. Supabase free tier provides 50,000 MAUs, which is adequate. Anonymous sessions persist via localStorage token, enabling cross-device sync when user provides a recovery key. MEDIUM complexity. Limitation: Supabase free projects pause after one week of inactivity — this is a real problem for a training tool used infrequently.

4. **URL-encoded progress share** — Encode progress state as a base64 URL parameter that the user can bookmark or copy to a second device. Zero backend. Limitation: URL length constraints kick in for users who have completed many modules; not truly automatic.

**Recommendation for ADR:** Option 1 (QR code export/import) as the primary SYNC-02 implementation, because it has zero external dependencies, requires no OAuth flow, works on air-gapped networks, and the target audience (IT admins) has low friction with QR codes. GitHub Gist sync is the differentiating option for SYNC-02 v2.1 if adoption data justifies the complexity.

**Anti-features:** What would backfire for this audience
- A sync system that requires the user to create an account on a third-party service (beyond GitHub, which most already have) — account creation friction at a compliance training tool signals data harvesting, which this audience is specifically trained to be suspicious of
- Automatic cloud sync without explicit user consent and visible disclosure — operational security concerns in the pipeline sector mean any data leaving the browser must be disclosed and opt-in
- A sync mechanism that syncs to a service controlled by this project (not the user) — this creates data custody questions that a public-interest training tool should not have to answer
- Sync that can overwrite completed state with incomplete state — "I completed Module 3 on my laptop but synced from my phone where I hadn't started it" must never result in losing the Module 3 completion
- Making sync required for progress to persist — localStorage-only progress is the baseline; sync is additive, not a replacement

**Complexity:** Low (QR export/import) to High (GitHub Gist with OAuth relay)
**Depends on:** DATA-05 (existing JSON export — QR approach wraps this), ASSESS-03 (localStorage progress — sync must read/write the same schema), DATA-04 (schemaVersion: 1 in localStorage — any sync must respect schema migration path)

---

## Feature Dependencies Map (v2.0)

```
compliance-refs.json update (SME-01)
  └── CRITICAL: must ship before any content release referencing TSA controls
  └── Blocks: CONT-05, CONT-06, SME-02, SME-03

fork.config.json (FORK-02)
  └── Runtime config read at app init
  └── Modifies: sidebar rendering (SHELL-01), compliance refs display (CONT-04), header/logo
  └── Blocks: FORK-03 (app can't apply config that doesn't exist yet)

vite-plugin-pwa (PWA-01)
  └── Wraps the Vite build — must be configured before content files are added to cache
  └── Affects: content-loader.js fetch paths (must be same-origin to be interceptable)
  └── Blocks: PWA-02 (offline indicator requires knowing when service worker is active)

SYNC-01 ADR
  └── Must be written before any SYNC-02 implementation starts
  └── Outcome determines scope: QR = 1 dev-day; GitHub Gist = 1 sprint
```

---

## MVP Recommendation for v2.0

**Phase first (highest urgency, unblocks everything):**
1. SME-01: Update compliance-refs.json to current TSA directive version — this is a data correctness issue, not a feature; ship it before any new content references it

**Phase second (content depth — core value of v2.0):**
2. CONT-05: New lessons per module (authoring work; no new infrastructure)
3. CONT-07: Expanded quiz banks (same schema, authoring only)
4. CONT-06: Advanced scenarios per module (uses existing scenario engine)

**Phase third (platform maturity):**
5. FORK-01: Fork deployment guide (documentation)
6. FORK-02 + FORK-03: Config system (new feature, medium complexity)
7. SME-02: SME review checklist (documentation artifact)
8. SME-03: Lesson metadata annotation (frontmatter additions)

**Phase fourth (offline/sync):**
9. PWA-01 + PWA-02 + PWA-03: Service worker + offline indicator
10. SYNC-01: ADR written
11. SYNC-02: Sync implementation per ADR recommendation

**Defer if scope pressure:**
- GitHub Gist sync (SYNC-02 complex path) — QR export/import is sufficient for v2.0; full sync is v2.1
- Fork "health check" utility — nice-to-have, not blocking
- Review status page generated from frontmatter — valuable but not critical path for audit evidence

---

## Sources

- TSA Security Directives page: https://www.tsa.gov/sd-and-ea (403 on direct fetch — verify manually)
- TSA SD-02F PDF (expired May 2, 2026): https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf
- TSA SD-01G (issued January 2026): https://www.tsa.gov/sites/default/files/signed_security-directive-pipeline-2021-01g-and-transmittal-memo_508c.pdf
- Dragos TSA directive revisions analysis: https://www.dragos.com/blog/us-transportation-security-administration-releases-updated-pipeline-security-directive-key-revisions-and-compliance-strategies/
- vite-plugin-pwa documentation: https://vite-pwa-org.netlify.app/guide/
- vite-plugin-pwa GitHub: https://github.com/vite-pwa/vite-plugin-pwa
- Offline-first PWA with Vite (Workbox patterns): https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/
- CSS-Tricks VitePWA guide: https://css-tricks.com/vitepwa-plugin-offline-service-worker/
- GitHub Gist REST API: https://docs.github.com/en/rest/gists/gists
- GitHub OAuth app flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- Supabase free tier limits (2026): https://cotera.co/articles/supabase-pricing-guide
- Compliance training content review practices: https://www.absorblms.com/resources/articles/compliance-courses-content-quality-checklist
- Advanced OT/ICS training design: https://theevolvedge.com/advanced-ot-ics-cybersecurity-training/
- OT/ICS oil and gas security scenarios: https://securityboulevard.com/2024/05/complete-guide-to-ot-ics-security-in-the-oil-and-gas-industry/
- Offline-first caching strategies: https://www.magicbell.com/blog/offline-first-pwas-service-worker-caching-strategies
