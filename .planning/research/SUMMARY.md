# Research Summary -- Pipeline Cyber Training

**Project:** Pipeline Cyber Training
**Domain:** Static GitHub Pages cybersecurity compliance training for oil and gas pipeline OT/IT administrators
**Researched:** 2026-05-10
**Confidence:** HIGH (stack, architecture, pitfalls); MEDIUM (market gap claims, retention statistics)

---

## CRITICAL CORRECTIONS -- Read Before Anything Else

These errors are likely to appear in first-draft content or tooling choices. Surface them now.

1. **NERC CIP does NOT apply to oil and gas pipeline operators.** It is an electric utility reliability standard enforced by FERC against Bulk Electric System operators. Presenting it as a binding pipeline requirement will destroy credibility with any compliance-aware learner. Frame it as a best-practice benchmark only, with an explicit scope callout at every reference point.

2. **TSA pipeline directives are currently SD-02F** (effective May 3, 2025, expiring May 2, 2026), not SD-02C. All version strings must be stored in a single managed data file (data/compliance-refs.json) -- not hardcoded in lesson prose -- so a version bump is a one-line edit when the next letter revision is issued.

3. **Tailwind CSS v4 dropped CDN support.** A Vite build step is mandatory. There is no option to drop in a CDN link with v4.

4. **jQuery Terminal, not xterm.js, is the correct terminal library.** xterm.js is a VT100 emulator designed to connect to a real process; its maintainers acknowledge it has no clean path for fake/whitelist-only terminals. jQuery Terminal is built precisely for the fake terminal use case.

---

## Executive Summary

Pipeline Cyber Training is a static, no-auth, no-backend web application that teaches PowerShell and networking security skills to IT/OT administrators at oil and gas pipeline companies, mapped directly to TSA security directives, NIST SP 800-82 Rev 3, and NERC CIP as a reference benchmark only. The architecture is deliberately minimal: Vanilla JS with hash-based routing, Markdown lesson content fetched at runtime, localStorage for progress, and a whitelist-only simulated PowerShell terminal as the primary differentiator. Everything runs in the browser; GitHub Pages is the host. No server, no auth, no database.

The recommended build approach is a seven-phase sequence driven by hard dependencies. Routing must exist before views, content loading before rendering, the Progress Store before quizzes or exercises record results. The simulated terminal -- the most complex feature -- is Phase 5, built after routing, content, and data patterns are fully established so the terminal state machine has no infrastructure concerns. Content population for the remaining four modules is Phase 7, a pure authoring phase once the engineering is complete.

The top risks are compliance accuracy (presenting NERC CIP as a binding pipeline requirement, or citing SD-02C when SD-02F is current) and OT/IT conflation in technical content (applying IT-centric patch cadences, vulnerability scanning practices, or MFA assumptions to OT environments without qualification). Both are content authoring failures that no amount of engineering can fix after the fact. A compliance subject matter expert must review content before any module publishes. The terminal carries a second major risk: scope creep. It must be defined as a pattern-matching exercise engine, not a PowerShell interpreter, and that scope contract must be written and enforced at every module exercise authoring stage.

---

## Key Findings

### Stack

The stack is well-determined with high confidence across all components. No framework debates remain open.

**Core technologies:**

| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| Vanilla JS | ES2022+ | Application logic and views | Five bounded modules; no complex shared reactive state; framework overhead exceeds benefit; terminal is inherently imperative code that fights declarative frameworks |
| Vite | 8.0.x | Build tool and dev server | Required for Tailwind v4; official GitHub Actions deploy workflow documented; hot reload eliminates file:// CORS friction during development |
| Tailwind CSS | 4.1.x | Styling | CDN removed in v4 so build step is unavoidable; utility-first fits the dark/monospace cybersecurity aesthetic better than Bootstrap defaults |
| jQuery Terminal | 2.46.0 | Simulated PS terminal | Built for the fake-terminal use case; ships an interpreter callback pattern; xterm.js has no supported path for whitelist-only in-browser simulation |
| Shiki | 4.0.x | Syntax highlighting | VS Code TextMate grammar for PowerShell; runs at build time; zero client-side JS shipped for highlighting |
| marked | 17.0.x | Markdown rendering | Fastest npm Markdown parser (39M+ weekly downloads); integrates with Shiki; right size for v1 |
| localStorage | Native browser API | Progress tracking | Only viable option for a no-auth static site; 5 MB limit far exceeds needs; wrap in single progressStore.js module |
| GitHub Actions + deploy-pages@v4 | Current | CI/CD | Cleaner than legacy gh-pages branch; single YAML workflow file |

**Critical configuration items:**
- Set base: '/pipeline-training/' in vite.config.js if hosted at a project-scoped URL. Missing this makes every CSS and JS reference a 404.
- Place a .nojekyll file in public/ to disable Jekyll interference with underscore-prefixed files Vite may generate.
- Use hash-based routing (#/module/:id) throughout -- eliminates the GitHub Pages SPA 404 problem with zero configuration.

**jQuery dependency note:** jQuery Terminal requires jQuery (~87 KB minified, ~30 KB gzipped). Acceptable for a training app where bundle size is not a primary constraint. If the dependency is vetoed, a custom ~200-line vanilla JS terminal is the documented fallback. This decision must be made before exercise authoring begins, as the terminal API shape affects content structure.

**What NOT to use:** React/Vue/Next (bundle weight exceeds benefit for bounded content site); xterm.js (wrong use case for whitelist-only fake terminal); Bootstrap 5 (declining momentum, harder to escape defaults); Tailwind CDN (removed in v4); highlight.js (incomplete PowerShell grammar); Prism.js (client-side JS weight, less complete PS grammar than Shiki).

### Features

**Table stakes -- must have or users leave:**

| Feature | Why Non-Negotiable |
|---|---|
| Visible lesson progress and resume-on-return | Adult learners open and close tabs constantly; losing progress is unforgivable |
| Knowledge-check quizzes with explanatory feedback per answer | Testing effect is the strongest evidence-backed retention tool; right/wrong alone is insufficient |
| Syntax-highlighted, copyable PowerShell code blocks | Code-heavy content with poor rendering signals low quality; copy button is high-value for admins transferring commands to real environments |
| Accurate, current regulatory references | Compliance audience catches wrong control IDs instantly; a single error destroys trust |
| Outcome framing at module entry ("After this module you can...") | Adult learners need job-relevance visible before investing time |
| Keyboard navigability (WCAG 2.1.1 Level A) | IT/OT admins frequently work keyboard-only; a tab-trapping terminal widget kills usability |
| Searchable reference library | Admins return to look up commands; they need lookup, not re-read |

**Differentiators -- reasons to use this over SANS, CISA VLP, or a PDF checklist:**

1. **Simulated PowerShell terminal** -- No free compliance training resource combines hands-on PS command practice with regulatory control mapping. CISA free training is conceptual. SANS ICS410 is $7,000+/seat. The terminal must accept correct commands and near-misses, return plausible fake output (fake hostnames, real-looking timestamps, real error message formats), show inline "why" annotations, and use a whitelist-only execution model.

2. **Compliance control ID tags on every content unit** -- Each lesson section, quiz question, and exercise displays the control IDs it covers. A compliance manager needs to answer "did my team cover TSA SD-02F Measure 3?" without reading every lesson. The compliance index page (inverted control-to-content map) makes the platform auditable by compliance officers, not just learners.

3. **OT-specific content that treats OT constraints as real** -- Every generic cybersecurity course teaches IT-centric practices with an OT sidebar. This platform models OT realities directly: air-gapped networks, vendor patch approval cycles, legacy Windows on PLCs, PS Remoting disabled in OT segments. The Patch Management module OT section is particularly underserved across all existing free resources.

4. **Printable completion summary as a compliance artifact** -- TSA directives require training record evidence. A print-to-PDF completion summary with self-entered name, module, date, quiz scores, and control IDs covered is a legitimate supporting artifact. The UI must position it explicitly as a "training artifact" not a "compliance record" -- the distinction matters to auditors.

5. **"Copy to your environment" reference cards** -- The core value proposition is transferability. The reference card alongside each exercise (real command with full parameter options, not the training-simplified version) is the bridge from training to execution. This is what makes the platform a durable reference resource rather than a one-time course.

**Hard anti-features -- do not build:**
- Gamification/badges/leaderboards -- professionals motivated by compliance, not points; documented to backfire in compliance training contexts
- User accounts and authentication -- breaks static-site constraint; introduces GDPR obligations and server infrastructure
- Video content -- expensive to produce, inaccessible without captions, cannot Ctrl+F
- Offline PWA/Service Worker -- correct answer for air-gapped deployments is a self-hosted fork, not PWA caching complexity
- Social sharing -- operational security risk; broadcasting SCADA security training completion is social engineering surface
- Adaptive learning paths -- requires backend; compliance curriculum is not optional, so personalization that skips content creates gaps

**Deferred to v2+:**
- Compliance index page (inverted control-to-content map)
- Full searchable reference library with Fuse.js client-side text search
- Cross-module aggregate completion summary
- Complex branching scenario exercises (validate simpler terminal exercises first)

### Architecture

A single-page application with hash-based routing. Seven major components with explicit ownership boundaries -- no component crosses into another domain.

**Component responsibilities:**

| Component | Owns | Does NOT Touch |
|---|---|---|
| Router | URL hash parsing, view lifecycle, back/forward | DOM content inside #app |
| View Layer | Rendering to #app, event binding within view | Routing, data fetching, storage |
| Content Loader | fetch() calls, in-memory cache, JSON/MD parsing | DOM, routing, progress state |
| Progress Store | localStorage read/write, schema versioning, migrations | Rendering, routing, network |
| Markdown Renderer | Converting MD strings to sanitized HTML (marked + DOMPurify) | Fetching, storage, routing |
| Terminal Engine | Command registry, input-output loop, exercise state machine | DOM layout, routing, storage |

**Content format split (hybrid JSON + Markdown):**
- Module metadata, lesson metadata, quiz questions, exercises, scenarios: JSON files (machine-readable, loaded on demand)
- Lesson bodies: Markdown files (non-developers can edit directly in GitHub browser editor; diffs are readable in PRs)
- Version strings and compliance references: a single data/compliance-refs.json file -- never hardcoded in lesson prose

**Terminal architecture:** Command Registry Pattern with three layers: input normalization, regex-based pattern matching against exercise JSON, canned output rendering. State machine: IDLE -> LOADING -> STEP_N -> VALIDATING -> COMPLETE. Does not execute real commands, parse complex PS syntax beyond tokenization for matching, or maintain a virtual filesystem. The scope contract must be documented before implementation begins.

**Progress Store schema versioning:** Store schemaVersion integer from day one. On load, compare against expected version, run migration functions in sequence, write migrated data back. Never reuse lesson or exercise IDs across content changes -- treat IDs as permanent identifiers.

### Top Pitfalls

**P1 -- NERC CIP scope misrepresentation (CRITICAL)**
NERC CIP legally applies to electric utilities, not pipeline operators. Presenting it as binding destroys credibility on first encounter with any compliance-aware learner. Mitigation: explicit scope callout at every NERC CIP reference ("NERC CIP governs electric utilities; pipeline operators follow TSA directives. Referenced here as a maturity benchmark."); compliance SME review of all NERC CIP-tagged content before publish.

**P2 -- TSA directive version staleness (CRITICAL)**
SD-02F is current (SD-02C is two versions behind as of project start). Hardcoded version strings in lesson prose will be wrong at next annual revision. Mitigation: all version strings in data/compliance-refs.json; "Directive currency: verified [date]" badge on each lesson citing TSA controls; calendar reminder tied to each directive annual expiry date.

**P3 -- OT/IT conflation in technical content (HIGH)**
Active scanners can crash PLCs; OT vendor patch approval takes 3-12 months; MFA in a control room HMI context differs from corporate laptops; air-gapped networks in practice are hybrid architectures. Applying IT assumptions to OT without qualification is the most-criticized failure in OT cybersecurity training. Mitigation: every lesson applicable to both environments includes an explicit "In OT environments:" callout block; Patch Management module must have a dedicated OT patching sub-section.

**P4 -- Simulated terminal fidelity gap and scope creep (HIGH)**
Learners who attempt commands in real environments encounter differences (missing object pipeline, different error messages, deprecated cmdlets) and lose confidence in the training. Expanding the simulator to handle edge cases creates an unmaintainable partial PS interpreter. Mitigation: display scope contract in UI ("Output is illustrative; your environment will vary"); define which PS version the simulator models (recommend PS 5.1 as baseline, the Windows default for most pipeline IT environments); never exceed the command-registry/whitelist model.

**P5 -- localStorage progress loss without warning (MEDIUM)**
localStorage is silently cleared by browser history wipes, Safari 7-day eviction, private browsing, and device switches. In a compliance context, silent data loss is a serious credibility problem. Mitigation: detect private browsing on load and display a warning banner; wrap all localStorage.setItem() calls in try/catch; provide "Export my progress" button that downloads JSON or opens a printable completion summary.

---

## Implications for Roadmap

The phase structure is dictated by hard component dependencies. Do not reorder phases.

### Phase 1: Shell + Routing + Navigation
**Rationale:** The router is the backbone everything else mounts into. Design tokens established here prevent visual debt in later phases. No content dependency, no feature dependency.
**Delivers:** Navigable site with hash routing, empty view placeholders, semantic HTML shell, Tailwind design tokens.
**Pitfall to avoid:** GitHub Pages SPA 404s -- use hash routing from day one; configure Vite base path before first deploy; add .nojekyll to public/.
**Research flag:** Standard patterns -- no deeper research needed.

### Phase 2: Content Loader + Data Models + Module/Lesson Views
**Rationale:** Views cannot render real data until the content loading contract exists. The content file format must be established here to prevent later migration costs. One complete module (Logging & Auditing) is authored in this phase to validate the schema.
**Delivers:** Real Markdown lesson content rendered with syntax-highlighted PowerShell code blocks; fetch()-based Content Loader with in-memory cache; one complete module worth of authored content.
**Key decision locked here:** Lesson metadata in JSON files, lesson bodies in Markdown files. No frontmatter in Markdown.
**Research flag:** Standard patterns -- no deeper research needed.

### Phase 3: Progress Store
**Rationale:** The Progress Store is the shared dependency that quizzes, exercises, and scenarios all write to. Define it before any of those components exist or progress tracking becomes ad hoc inside each one.
**Delivers:** progressStore.js with schema versioning, migration runner, and clean get/set/markComplete API. Lesson completion persists across browser refresh. Private-browsing detection. Export progress button.
**Critical:** Define schemaVersion: 1 in localStorage schema immediately. This key must never be absent.
**Research flag:** Standard patterns -- no deeper research needed.

### Phase 4: Quiz Engine
**Rationale:** Quizzes are pure JSON data + render logic with no terminal dependency. Building this simpler exercise type first establishes the pattern for structured exercise completion and validates the Progress Store API before the more complex terminal work.
**Delivers:** Knowledge-check quizzes with per-answer explanatory feedback, scoring, persistence, and prior-score display on re-visit. Quiz content for one module.
**Pitfall to avoid:** Quiz-only knowledge transfer failure -- write the question design rule before content authoring begins: questions at application/analysis level (Bloom taxonomy), not recall level.
**Research flag:** Standard patterns -- no deeper research needed.

### Phase 5: Terminal Engine + Exercise View
**Rationale:** Most complex feature. Building after routing, content, and data patterns are established means the terminal state machine has no infrastructure concerns. Exercise JSON schema finalized here -- this is a contract all subsequent content authoring depends on.
**Delivers:** Whitelist-only simulated PS terminal; multi-step exercise validation; per-step feedback and hint system; exercise completion recorded to Progress Store. Exercise content for one module (3-5 exercises).
**Prerequisite decision:** jQuery Terminal vs custom vanilla JS terminal must be prototyped and decided before full Phase 5 build. This is the one unresolved stack decision.
**Pitfall to avoid:** Scope creep -- write the scope contract in code comments and contributing guide before building. "This is a pattern-matching exercise engine, not a PowerShell interpreter."
**Research flag:** NEEDS PROTOTYPING. PS command parser complexity (regex matching vs tokenized parameter matching) is unresolved at scale. Run a spike against 5-10 real exercise commands before committing to the exercise JSON schema.

### Phase 6: Scenario Engine + Reference Library
**Rationale:** Read-heavy with minimal state complexity. Builds on established content-loading and rendering patterns. Deferring keeps the core learning loop (lesson -> quiz -> terminal exercise) shippable before supplementary content types are added.
**Delivers:** Decision-tree scenario exercises (multi-phase, branching consequence); compliance-tagged reference library with tag-based filtering.
**Note:** Full Fuse.js full-text search is v2. Phase 6 ships with tag-based filtering only.
**Research flag:** Standard patterns -- no deeper research needed.

### Phase 7: Remaining Module Content
**Rationale:** Engineering complete by Phase 6. Pure content authoring phase.
**Delivers:** All five modules fully populated -- Network Hardening, Account & Access Management, Incident Response, Patch Management.
**Critical for Patch Management:** Split into two sub-sections with separate lesson IDs and compliance tags: (a) Windows/IT patching and (b) OT/ICS patching (offline media staging, vendor approval gates, OEM qualification requirements, compensating controls documentation, risk-based deferral). Do not merge into a single lesson.
**Content authoring rules enforced before this phase begins:**
- Every lesson applicable to OT environments includes an "In OT environments:" callout block
- All regulatory references use managed version strings from data/compliance-refs.json, never hardcoded in prose
- All environment identifiers are generic: PIPELINE-DC01, 10.0.0.0/24, ExampleCorp, OT-HISTORIAN-01
- Compliance SME review required before any module publishes
- NERC CIP scope callout present on every lesson that references NERC CIP controls

**Research flag:** OT content accuracy needs SME review, not just secondary sources. Identify the SME before this phase begins.

### Phase Dependency Graph

```
Phase 1 (Shell + Router)
    +-- Phase 2 (Content + Markdown)
            +-- Phase 3 (Progress Store)
                    +-- Phase 4 (Quiz)
                    +-- Phase 5 (Terminal)
                            +-- Phase 6 (Scenarios + Reference)
                                    +-- Phase 7 (Content population)
```

No phase can be safely skipped. Every arrow is a blocking dependency.

### Research Flags Summary

| Phase | Research Needed? | Reason |
|---|---|---|
| Phase 1 | No | Hash routing + Vite + GitHub Pages is fully documented |
| Phase 2 | No | marked + DOMPurify + Shiki pipeline is well-understood |
| Phase 3 | No | localStorage with schema versioning is a solved pattern |
| Phase 4 | No | Custom quiz engine is ~150 lines; standard patterns |
| Phase 5 | YES -- spike required | PS command parser complexity unresolved; jQuery Terminal vs custom JS unresolved |
| Phase 6 | No | Data-display problem with established patterns |
| Phase 7 | YES -- SME required | OT patching workflow accuracy needs expert review, not secondary sources |

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | Every technology verified with official sources and version numbers confirmed as of May 2026. jQuery Terminal vs custom terminal is the one open decision; both paths are documented. |
| Features | HIGH (architecture/compliance), MEDIUM (market gaps) | Table stakes and anti-features are well-grounded. Market gap claims are plausible but not formally audited. |
| Architecture | HIGH | Component boundaries, data models, routing strategy, and build order grounded in established SPA patterns and GitHub Pages constraints. |
| Pitfalls | HIGH | Compliance pitfalls confirmed against official TSA and NERC sources. GitHub Pages and localStorage pitfalls confirmed against official documentation. |

**Overall confidence:** HIGH for engineering decisions. MEDIUM for content accuracy claims -- SME validation required before any module publishes.

### Gaps to Address

1. **jQuery Terminal vs custom vanilla JS terminal:** Must be prototyped and decided before Phase 5 build begins. Affects exercise JSON schema design and content authoring workflow. Recommendation: default to jQuery Terminal; prototype one exercise; if the jQuery dependency is rejected, build the ~200-line custom alternative.

2. **PS command parser complexity:** Regex matching against exercise-defined patterns is the plan, but complexity at scale is unvalidated. Run a spike against 5-10 real exercise commands in Phase 5 kickoff before locking the exercise schema.

3. **Compliance SME assignment:** No engineering decision, but a project prerequisite. NERC CIP scope errors and TSA version staleness are the two highest-impact content risks. The SME must be identified before Phase 7 content authoring begins.

4. **Offline/air-gap deployment:** Out of scope for v1 public deployment. The correct answer for air-gapped pipeline operator internal use is a self-hosted fork. Document this in the README and contributing guide. Do not add PWA/Service Worker complexity to the public deployment.

5. **gray-matter for frontmatter:** Only needed if compliance tags move from JSON metadata files into Markdown frontmatter. Current architecture keeps metadata in JSON -- this gap only opens if that decision is reversed.

---

## Sources

### Primary (HIGH confidence -- official sources)
- TSA Security Directives and Emergency Amendments: https://www.tsa.gov/sd-and-ea
- SD Pipeline-2021-02F (May 2025 effective): https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf
- NIST SP 800-82 Rev 3 (September 2023): https://csrc.nist.gov/pubs/sp/800/82/r3/final
- NERC CIP standards: https://www.nerc.com/standards/reliability-standards/cip
- GitHub Pages limits (official): https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- jQuery Terminal maintainer docs and rationale: https://terminal.jcubic.pl/
- Tailwind CSS v4 official blog + endoflife.date (verified May 2026)
- Vite GitHub releases (8.0.x verified May 2026)

### Secondary (MEDIUM confidence -- community and vendor sources)
- Dragos TSA directive analysis: https://www.dragos.com/blog/us-transportation-security-administration-releases-updated-pipeline-security-directive-key-revisions-and-compliance-strategies/
- TSA SD-02F overview: https://www.mangancyber.com/tsa-pipeline-directive-sd02f/
- CISA free ICS training catalog: https://www.cisa.gov/resources-tools/programs/ics-training-available-through-cisa
- SANS oil and gas resources: https://www.sans.org/oil-and-gas
- OT patch management constraints: https://www.action1.com/blog/patch-management/ot-patch-management/
- PagerDuty Security Training (content structure reference): https://github.com/PagerDuty/security-training
- marked vs alternatives benchmark: https://npm-compare.com/markdown-it,marked,remark
- GitHub Pages SPA routing: https://github.com/rafgraph/spa-github-pages

### Tertiary (LOW confidence -- single source or inference; validate before citing)
- Retention improvement claims from simulation-based training (vendor source): https://www.avatire.com/blog/security-simulation-practice-defense/
- SANS 2026 OT skills crisis report (secondary summary): https://industrialcyber.co/reports/sans-2026-report-flags-cybersecurity-skills-crisis
- xterm.js fake-terminal limitation (GitHub issue #4414 -- confirm issue number before citing publicly)

---

*Research completed: 2026-05-10*
*Synthesized: 2026-05-10*
*Ready for roadmap: yes*