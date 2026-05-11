# Pitfalls Research — Pipeline Cyber Training

**Domain:** Static GitHub Pages cybersecurity training app — oil & gas pipeline compliance (TSA, NERC CIP, NIST)
**Researched:** 2026-05-10
**Research confidence:** HIGH for GitHub Pages constraints, localStorage, SPA routing; HIGH for compliance currency (directives confirmed via official TSA/NERC sources); MEDIUM for OT/ICS training content accuracy; MEDIUM for simulated terminal fidelity.

---

## 1. NERC CIP Scope Misrepresentation

**Risk:** NERC CIP is an electric-utility reliability standard enforced by FERC against Bulk Electric System (BES) operators — it does not legally mandate compliance for oil and gas pipeline operators. Pipeline operators are regulated by TSA directives and follow NIST SP 800-82 as guidance. Training content that presents NERC CIP as a binding requirement for pipeline operators is factually wrong and will be caught immediately by any compliance-aware learner, destroying credibility.

**Warning signs:**
- Lesson text says "pipeline operators must comply with NERC CIP" without qualification
- NERC CIP control IDs presented as enforcement obligations alongside TSA control requirements
- No distinction drawn between "electric utility" and "pipeline operator" learner populations

**Prevention:**
- Frame NERC CIP as a best-practice reference and comparison standard, not a binding requirement for pipeline operators
- Add a scope callout at the start of any module referencing NERC CIP: "NERC CIP governs electric utilities; pipeline operators follow TSA directives. NERC CIP practices are referenced here as a maturity benchmark."
- Map every compliance tag to the correct enforcement regime: TSA SD-02 series for pipeline operators, NERC CIP only for electric-sector context, NIST SP 800-82 as guidance/framework
- Have a compliance SME review all NERC CIP-tagged content before publishing

**Phase relevance:** Content architecture phase (before any lesson authoring begins); revisited in every module's content review.

---

## 2. TSA Directive Version Staleness

**Risk:** TSA Pipeline Security Directives iterate annually. The -02 series has already progressed through versions A, B, C, D, E, F (SD-02F effective May 3, 2025, expiring May 2, 2026) and SD-01G was issued January 2026. Content authored against SD-02C (as stated in PROJECT.md requirements) is already two versions behind as of the project start date. Hardcoded version references in lesson text become wrong the moment TSA issues the next letter revision, misleading learners about their actual compliance obligations.

**Warning signs:**
- Lesson text contains hardcoded version strings like "SD-02C" in prose rather than in a managed reference
- No changelog section or "last verified" date on compliance-tagged content
- No process defined for who checks TSA's SD & EA page after each directive expiry date

**Prevention:**
- Store the current directive version in a single data file (e.g., `data/compliance-refs.json`) that lessons pull from, so a version bump is a one-line edit
- Add a visible "Directive currency: verified [date]" badge to every lesson that cites TSA controls
- Each directive expires roughly annually; add a recurring calendar reminder tied to the expiry date of the current directive to trigger a content audit
- Scope PROJECT.md to "2024+ requirements (SD-02 series)" rather than a specific letter version to reduce churn in the project document itself

**Phase relevance:** Data model / content architecture phase; content maintenance runbook at project close.

---

## 3. NIST SP 800-82 Edition Conflation

**Risk:** NIST published SP 800-82 Revision 3 in September 2023, renaming it from "Guide to Industrial Control Systems Security" to "Guide to Operational Technology (OT) Security" and expanding scope significantly. Content written from Revision 2 sources will reference outdated section numbers, use "ICS" where "OT" is now standard, and miss new topics like cloud OT, supply chain, and risk management framework integration. Learners who consult the actual document will find the training misaligned.

**Warning signs:**
- References to "ICS security" as a synonym for OT security without acknowledging the scope change
- Section or appendix citations that match Rev 2 numbering
- No mention of the Rev 3 CSF integration or supply chain content

**Prevention:**
- Pin all NIST SP 800-82 references to Revision 3 explicitly (the final version from September 2023, available at csrc.nist.gov)
- Use NIST's own terminology: "OT security" as the primary term, "ICS" only when referring to a specific system type
- Do not cite section numbers in lesson content — link to the publication and describe concepts, so section renumbering in future revisions does not break content

**Phase relevance:** Content authoring across all five modules, especially Patch Management and Network Hardening.

---

## 4. OT / IT Conflation in Technical Content

**Risk:** Applying IT security practices to OT environments without qualification is the single most criticized failure in OT cybersecurity training. Specific failure modes relevant to this project: (a) presenting patch cadence advice ("patch within 30 days") without noting that OT vendor approval cycles routinely take 3-12 months; (b) recommending vulnerability scanning without warning that active scanners can crash PLCs; (c) presenting MFA as straightforward to deploy in environments where operators work at HMIs in a control room with no internet connectivity; (d) treating air-gapped networks as binary (either fully air-gapped or internet-connected) when most pipelines have hybrid architectures.

**Warning signs:**
- Patch management module uses the same patch SLAs for Windows servers and OT field devices
- Network hardening module recommends network scanners without OT-specific caveats
- Account management module presents MFA deployment as a single workflow regardless of environment
- No explicit "OT vs IT" differentiation callouts in lessons

**Prevention:**
- Every exercise and lesson that could apply to both environments must include an explicit "In OT environments:" callout section
- The Patch Management module must have a dedicated OT patching section covering: vendor approval gates, OEM qualification requirements, compensating controls when patching is not feasible, and documentation requirements for unpatched systems
- Establish a content rule: never give a recommendation that applies to OT systems without citing the specific constraint (availability > confidentiality in OT, no tolerance for unplanned downtime, vendor support contract implications)
- Source OT-specific content from NIST SP 800-82 Rev 3, ICS-CERT advisories, and ISA/IEC 62443, not generic IT security sources

**Phase relevance:** Patch Management module (highest risk); Network Hardening; Account & Access Management; all modules need OT callout review before publish.

---

## 5. Simulated Terminal Fidelity Gap

**Risk:** A browser-based PowerShell simulator necessarily omits features of real PowerShell: no pipeline objects (only text output), no tab completion, no real cmdlet parameter validation, no module loading, no actual registry or filesystem state. Learners who complete exercises in the simulator and then attempt the same commands in their real environment will encounter differences — wrong output format, missing properties, different error messages — and lose confidence in the training. Worse, if the simulator accepts invalid syntax that real PowerShell would reject, it actively teaches wrong habits.

**Warning signs:**
- Simulator accepts `Get-EventLog -LogName Security` without warning that this cmdlet is deprecated in PowerShell 7+
- Output formatting in simulator does not match real PowerShell table/list output
- Exercises use commands that require modules not installed by default (e.g., `ActiveDirectory` module) without flagging this
- No "what this would look like in real PS" note alongside simulator output

**Prevention:**
- Scope the simulator explicitly: it validates command syntax and teaches command patterns, not output fidelity — say this in the UI
- Add a persistent "Simulator note" banner: "Output is illustrative. Your actual environment output will vary."
- Every exercise must include a "Real-world note" section describing what the learner should verify or expect when running this in their actual environment
- Test every simulated command against actual PowerShell 5.1 (Windows default for most pipeline IT environments) and PowerShell 7.x, and flag version differences explicitly in content
- Do not simulate cmdlets that require elevated privileges without a visible "(requires admin)" label
- Define which PowerShell version the simulator models (recommend PS 5.1 as the baseline, given the learner population)

**Phase relevance:** Simulated terminal build phase; every module's exercise authoring; QA before each module publish.

---

## 6. Quiz-Only Knowledge Transfer Failure

**Risk:** If exercises reduce to reading a lesson then answering multiple-choice questions, learners can pass without developing operational skill. The PROJECT.md core value states: "An IT/OT admin who completes a module should be able to perform the covered compliance control in their real environment." Multiple-choice quizzes do not produce that outcome. This is the most commonly cited failure mode in technical e-learning, and it is especially acute for a compliance audience where "I passed the training" can create false confidence in an auditable environment.

**Warning signs:**
- Scenario exercises only require learners to select the correct option rather than type or construct a command
- Modules can be completed without the simulated terminal being used at all
- Quiz questions test recall ("Which of the following is...") rather than application ("Given this log output, what is the next step?")
- Progress tracking counts quiz completion as module completion without terminal exercise completion

**Prevention:**
- Require terminal exercise completion as a gate for module completion credit (not just lesson reads and quizzes)
- Design scenario exercises as: "Here is a simulated log / alert / audit output — type the PS command to investigate it" not "Which command would you use?"
- Include at least one scenario per module that requires multi-step command construction (pipe a Get- command into a filtering command)
- Write quiz questions at application/analysis level (Bloom's), not recall level

**Phase relevance:** Instructional design phase (before any lesson authoring); module QA for each of the five modules.

---

## 7. Learner Overload from Regulatory Complexity

**Risk:** TSA, NERC CIP, and NIST CSF/SP 800-82 each have distinct control numbering schemes, terminology, and applicability rules. Presenting all three simultaneously without a clear mental model will overwhelm basic PowerShell users who are not compliance specialists. Common failure mode: learners focus on memorizing control IDs rather than understanding what the controls require operationally, producing quiz-passers who cannot perform the underlying task.

**Warning signs:**
- Lesson introductions spend more content explaining compliance framework structure than on the technical skill being taught
- Compliance tags show three different framework IDs for every lesson
- Post-lesson surveys or informal feedback uses words like "overwhelming" or "I don't know which framework applies to me"
- Learners skip reference library sections

**Prevention:**
- Lead with the technical task, not the compliance framework: "Here is how to configure Windows audit policy. This satisfies TSA SD-02F requirement X and aligns with NIST SP 800-82 control Y."
- Use a single primary framework tag per lesson (TSA for pipeline operators); treat NIST as a secondary cross-reference, NERC CIP as an optional "if you also support electric infrastructure" sidebar
- Provide a one-page "Which frameworks apply to me?" guide at module entry, not buried in reference library
- Limit compliance tag display in the UI to the two most relevant controls per lesson; full cross-reference goes in the reference library

**Phase relevance:** Content architecture / tagging design phase; UX design phase for compliance tag display.

---

## 8. GitHub Pages SPA Routing 404s

**Risk:** GitHub Pages is a static file server. It has no knowledge of client-side routes. If the app uses HTML5 history-mode routing (e.g., `/module/logging/lesson/2`), any direct URL load or browser refresh will return a 404 because GitHub Pages looks for a physical file at that path and finds none. This affects: sharing deep links to specific lessons, bookmarking progress, browser back-button behavior after a page refresh.

**Warning signs:**
- Refreshing the browser on any page other than the root returns a 404
- Copying a lesson URL and pasting it in a new tab fails
- The app works perfectly in local development but breaks after GitHub Pages deployment

**Prevention:**
- Use hash-based routing (`/#/module/logging/lesson/2`) throughout — this is the simplest, most reliable solution for GitHub Pages and has no SEO downside for a training app
- Alternatively, if using a build tool (Vite, etc.), configure it to output a flat directory structure with one `index.html` per route, enabling direct path loads
- Add a `404.html` that redirects to `index.html` with the path encoded as a query parameter as a fallback (the spa-github-pages pattern)
- Test routing by deploying to a branch preview and directly navigating to a deep URL before shipping any module

**Phase relevance:** Initial project scaffolding / architecture phase; must be resolved before any routing-dependent feature is built.

---

## 9. GitHub Pages Build and Bandwidth Constraints

**Risk:** Published GitHub Pages sites are capped at 1 GB. The site has no binary media (PROJECT.md excludes video), but a large compliance reference library with many JSON data files plus JavaScript bundles could approach this limit over time. Additionally, there is a soft 100 GB/month bandwidth limit and a 10 builds/hour limit (unless using GitHub Actions). A cybersecurity training app used across a pipeline company could hit bandwidth limits if used at scale.

**Warning signs:**
- Repository size exceeds 500 MB (halfway to the 1 GB page limit)
- A single JavaScript bundle is over 1 MB uncompressed
- More than 10 content pushes are made in a single hour during active development

**Prevention:**
- Audit bundle size before each module launch using Vite's `--report` or Webpack Bundle Analyzer; keep total JS under 500 KB gzipped
- Inline compliance reference data as structured JSON in the repository, not as large flat text files; compress aggressively
- Use GitHub Actions for deployment (removes the 10 builds/hour restriction)
- For internal company deployments: host on internal web server or SharePoint, not GitHub Pages — the bandwidth limit is not suitable for mandatory training across hundreds of employees

**Phase relevance:** Initial scaffolding; also a consideration when planning for internal deployment fork.

---

## 10. localStorage Progress Loss Without Warning

**Risk:** localStorage is cleared silently by: (a) users manually clearing browser history/data; (b) browser storage eviction when disk space is low (Chrome evicts least-recently-used origins); (c) Safari's 7-day eviction of script-writable storage if the site is not visited; (d) private/incognito browsing (storage does not persist across sessions in private mode); (e) switching browsers or devices. A learner who completes two modules, clears their browser, or switches from Chrome to Edge loses all progress with no warning. In a compliance training context where completion may need to be documented, silent data loss is a serious credibility problem.

**Warning signs:**
- No warning shown when a user opens the app in a private window
- No export/backup mechanism for progress data
- No "progress was reset" detection or user notification
- Module completion has no durable artifact (certificate, export, email)

**Prevention:**
- Detect private browsing on load and display a banner: "You are in private browsing mode. Progress will not be saved after you close this window."
- Wrap all `localStorage.setItem()` calls in try/catch; handle `QuotaExceededError` gracefully with a user-visible alert and instructions to clear old data
- Provide a "Export my progress" button that downloads a JSON file (or generates a printable completion summary) — this gives learners a durable record without requiring backend infrastructure
- Add a "progress restored" confirmation when the app loads successfully from saved state, so users know their data persisted
- Store a version key in localStorage; if the data schema changes between versions, detect the mismatch and prompt the user rather than silently corrupting state

**Phase relevance:** Progress tracking implementation phase; UX design for all module completion flows.

---

## 11. localStorage Schema Drift Between Versions

**Risk:** The app ships with a progress data schema stored in localStorage. Later versions add new modules, change lesson IDs, or restructure exercise completion state. A returning learner opens the updated app; the code reads old schema data, finds unexpected keys or missing fields, and either crashes silently or shows incorrect progress (e.g., marking a new lesson as complete because a legacy key matched).

**Warning signs:**
- No schema version key in localStorage data
- Module or lesson IDs changed between versions without a migration path
- New module added and some users show it as 100% complete immediately (because their old data had a key collision)

**Prevention:**
- Store a `schemaVersion` key in localStorage from day one (even version `"1"`)
- On app load, compare `schemaVersion` against the current expected version; if mismatch, run a migration function or prompt user to reset
- Never reuse lesson or exercise IDs across content changes; treat IDs as permanent identifiers, not display names
- Document the localStorage schema in code comments as a contract, not an implementation detail

**Phase relevance:** Initial data model design; every content update that changes module/lesson structure.

---

## 12. Public Site Leaking Org-Specific Assumptions

**Risk:** PROJECT.md notes the site starts public and should be forkable for internal deployment. The risk is that content is authored with implicit assumptions about the reader's environment: specific SCADA vendor names, internal network naming conventions, IP ranges used in exercises, references to "your company's SOC," or exercises that only make sense for a particular organizational structure. These assumptions make the public site feel generic-but-broken, and make internal forks require significant content rework.

**Warning signs:**
- Exercise scenarios name specific vendors ("Configure the OSIsoft PI Historian...") without marking them as examples
- PS commands in exercises use hardcoded hostnames or IP ranges that imply a specific network topology
- Lesson text says "contact your SOC team" without noting this assumes a mature security org — many pipeline operators have no dedicated SOC

**Prevention:**
- Use clearly fictional/generic identifiers in all exercises: `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp`, `OT-HISTORIAN-01`
- Add a content authoring rule: any environment-specific reference must be marked with a `[CUSTOMIZE FOR YOUR ORG]` placeholder comment in the content data file
- Write a brief "Fork and customize" guide at the repo root explaining which content files to update for internal deployment (network ranges, org names, SCADA vendor specifics)
- Avoid recommendations that assume enterprise-scale security teams; always provide a "smaller org" variant ("If you do not have a dedicated SOC, send alerts to...")

**Phase relevance:** Content authoring across all five modules; repository documentation at project launch.

---

## 13. Compliance Content Ownership Vacuum

**Risk:** Regulatory content has a short half-life. TSA directives iterate annually. NERC CIP standards update on FERC approval cycles. NIST publishes new revisions. If no named person or process owns content currency after launch, the site will silently drift out of date. Learners will cite training content in compliance audits; auditors who know the current directive version will flag discrepancies. A training site that teaches compliance incorrectly is worse than no training site.

**Warning signs:**
- No "content last verified" date on any lesson
- No GitHub issue template or label for "regulatory update"
- No defined owner for monitoring TSA's SD & EA page
- Six months post-launch with no content updates despite a known directive renewal

**Prevention:**
- Create a `CONTENT-MAINTENANCE.md` at the repo root defining: who monitors each regulatory source, how often, and what the update SLA is
- Add a "Content currency" section to each module's README with: directive version it was authored against, expiry/review date, and link to official source
- Use GitHub Issues with a `regulatory-update` label as the intake mechanism for content changes; create issues proactively when a directive is known to expire
- Implement the single compliance-reference data file approach (see Pitfall 2) so version bumps are surgical, not scattered across lesson prose
- Consider adding a visible "Content verified against [version] as of [date]" notice in the app UI, prominently placed, so learners know currency status

**Phase relevance:** Project close / handoff documentation; relevant from first content authoring session onward.

---

## 14. Accessibility Neglect in Interactive Terminal

**Risk:** The simulated terminal is a custom UI element. Default implementations of fake terminals use `div`-based layouts that are not keyboard navigable and provide no screen reader context. IT/OT admins with visual impairments or motor limitations who use assistive technology will be entirely unable to use the core interactive feature of the training. In a federally regulated compliance context, accessibility is not optional posture — it is a baseline expectation.

**Warning signs:**
- Terminal input field is not focusable via Tab key
- Screen readers announce the terminal output area as a generic `div` with no role
- There is no way to complete terminal exercises without using a mouse
- Color alone is used to distinguish command success from error output

**Prevention:**
- Implement the terminal input as an actual `<input>` or `<textarea>` element with `aria-label="PowerShell command input"`
- Use `role="log"` and `aria-live="polite"` on the terminal output area so screen readers announce new output
- Ensure all terminal error/success states are communicated via text, not color alone (e.g., "[ERROR]" prefix, not just red text)
- Test keyboard-only navigation through a full exercise before shipping any module
- Ensure Tab order moves logically: lesson content → terminal input → submit → output → next step

**Phase relevance:** Simulated terminal build phase; accessibility audit before each module publish.

---

## 15. Overbuilt Simulator Scope Creep

**Risk:** The simulated terminal is scoped to validate command patterns and give feedback — not to be a real PowerShell runtime. The risk is that developers expand the simulator's scope over time to handle more edge cases, parameter variations, and output permutations, creating a maintenance burden that grows with every new module. A simulator that tries to handle all valid PowerShell syntax becomes an unmaintained partial PowerShell interpreter.

**Warning signs:**
- The simulator's command validation logic is growing into a large switch/case or regex library
- Contributors are debating which of 40+ parameter aliases to support
- Bugs are being filed because the simulator doesn't handle a specific command variant a learner tried
- The simulator's codebase exceeds the size of the learning content codebase

**Prevention:**
- Define the simulator's scope contract explicitly and publicly in the code: "This simulator validates exact command patterns specified in exercise definitions. It is not a PowerShell interpreter."
- Build exercises around specific command forms, not open-ended free input — learners type the command the exercise specifies, not whatever they feel like
- Use an exercise definition schema: each exercise specifies the accepted command(s), expected output template, and feedback messages; the simulator is a thin engine over this data
- Resist adding "helpful" fallbacks for common command mistakes — if the learner types the wrong command, give them the feedback message, not a guess at what they meant

**Phase relevance:** Simulated terminal architecture decision (phase 1); enforce the scope contract at every module's exercise authoring stage.

---

## Phase-Specific Warning Summary

| Phase Topic | Highest-Risk Pitfall | Mitigation Priority |
|-------------|---------------------|---------------------|
| Project scaffolding | SPA routing 404s (Pitfall 8) | Resolve before any routing is built |
| Data model design | localStorage schema drift (Pitfall 11) | Schema version key from day one |
| Content architecture | NERC CIP scope misrepresentation (Pitfall 1) | SME review before first lesson |
| Content architecture | TSA directive version staleness (Pitfall 2) | Single reference data file |
| Terminal build | Simulated terminal fidelity gap (Pitfall 5) | Scope contract defined before build |
| Terminal build | Accessibility neglect (Pitfall 14) | Keyboard + screen reader from day one |
| Terminal build | Scope creep (Pitfall 15) | Exercise definition schema enforced |
| Lesson authoring — all modules | OT/IT conflation (Pitfall 4) | OT callout template for every applicable lesson |
| Lesson authoring — all modules | Quiz-only transfer failure (Pitfall 6) | Terminal exercise gate for completion |
| Lesson authoring — all modules | Regulatory complexity overload (Pitfall 7) | Lead with task, not framework |
| Patch Management module | OT patching constraints (Pitfall 4, highest here) | Dedicated OT patching section required |
| Progress tracking | localStorage data loss (Pitfall 10) | Export + private-mode detection |
| All content | Public site org assumptions (Pitfall 12) | Generic identifiers + customize placeholders |
| Post-launch | Compliance content ownership vacuum (Pitfall 13) | Maintenance runbook at launch |
| Post-launch | NIST Rev 3 vs Rev 2 drift (Pitfall 3) | Pin to Rev 3, no section citations |

---

## Sources

- TSA Security Directives and Emergency Amendments: https://www.tsa.gov/sd-and-ea
- SD Pipeline-2021-02F (May 2025): https://www.tsa.gov/sites/default/files/tsa-security-directive-pipeline-2021-02f-and-memo-508c.pdf
- Dragos TSA directive analysis: https://www.dragos.com/blog/us-transportation-security-administration-releases-updated-pipeline-security-directive-key-revisions-and-compliance-strategies/
- NIST SP 800-82 Rev 3 (September 2023): https://csrc.nist.gov/pubs/sp/800/82/r3/final
- Certrec 2025 NERC CIP updates: https://www.certrec.com/resources/nerc-primer/2025-updates-to-nerc-cip-standards-cip-015-1-cip-003-12-and-cip-005/
- NERC CIP standards page: https://www.nerc.com/standards/reliability-standards/cip
- GitHub Pages limits (official docs): https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- GitHub Pages SPA routing discussion: https://github.com/orgs/community/discussions/64096
- MDN Storage quotas and eviction: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- localStorage error handling: https://mmazzarolo.com/blog/2022-06-25-local-storage-status/
- OT patch management constraints: https://www.action1.com/blog/patch-management/ot-patch-management/
- Industrial Cyber OT training rethink: https://industrialcyber.co/features/rethinking-ot-cybersecurity-training-as-operators-remain-unprepared-for-converged-escalating-threat-landscape/
- SANS 2026 OT skills crisis report: https://industrialcyber.co/reports/sans-2026-report-flags-cybersecurity-skills-crisis-putting-critical-infrastructure-and-ot-sectors-at-measurable-breach-risk/
- Simulation fidelity and learner expectations: https://mededu.jmir.org/2026/1/e84684
- LearnUpon e-learning pitfalls: https://www.learnupon.com/blog/elearning-pitfalls-to-avoid/
- 18F content debt guide: https://18f.gsa.gov/2016/05/19/content-debt-what-it-is-where-to-find-it-and-how-to-prevent-it-in-the-first-place/
