# Features Research — Pipeline Cyber Training

**Domain:** Static browser-based cybersecurity compliance training for OT/IT pipeline admins
**Researched:** 2026-05-10
**Overall confidence:** HIGH (architecture and compliance dimensions), MEDIUM (market gap claims), LOW (retention stat specifics from vendor sources)

---

## Table Stakes

Features whose absence causes users to abandon or distrust the platform. These are non-negotiable for v1.

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Clear lesson structure with visible progress | Learners need to know where they are and how much remains; absence creates anxiety and abandonment | Low | Module index + lesson breadcrumbs; localStorage tracks position |
| Resume where you left off | Desktop-primary users open and close tabs constantly; losing progress is unforgivable | Low | localStorage read on page load; write on each lesson/quiz completion |
| Knowledge-check quizzes after each lesson | Testing effect is the single most evidence-backed retention tool; learners expect it | Medium | Immediate feedback with explanation; not just right/wrong |
| Readable, well-formatted code blocks | Content is code-heavy (PowerShell); bad code rendering (no monospace, no syntax color) signals low quality | Low | `<pre><code>` with syntax highlighting (Prism.js or highlight.js); copy-to-clipboard button |
| Accurate regulatory references | Audience is compliance-driven; citing wrong control IDs or stale directives destroys trust instantly | Low-build, High-research | Must reference TSA SD-02C series, NERC CIP-004/005/007/010, NIST SP 800-82 Rev 3 by correct ID |
| Clear "what you will be able to do" framing | Adult learners need to see the job-relevance immediately; this is not academic coursework | Low | Outcome statement at top of each module: "After this module you can..." |
| Keyboard navigability | IT/OT admins frequently use keyboard-only workflows; tab-trapping in a terminal widget will kill usability | Medium | WCAG 2.1.1 Level A; must ensure the simulated terminal has a keyboard escape path (Escape or Tab-out) |
| Legible color contrast | WCAG 2.2 AA minimum; industrial environments often have bright ambient light or older monitors | Low | Use a tested color theme; avoid dark-grey-on-black terminal aesthetics for lesson text |
| Mobile-graceful degradation | Even though desktop-primary, the site will be accessed on tablets; it should not break visually | Low | Responsive layout with fluid type; terminal widget can be desktop-only with a visible warning |
| Working copy-to-clipboard on code blocks | Admins will use this to transfer commands to their actual environment; friction here is high cost | Low | Single JS function; falls back gracefully if clipboard API is blocked |
| Searchable reference library | Admin use case: "I know I saw the Get-WinEvent flag somewhere" — they need lookup, not re-read | Medium | Client-side search (Fuse.js or similar); tag-indexed by command, control ID, concept |

---

## Differentiators

Features this platform can offer that competitors don't, or do poorly. These are the reasons someone recommends this over SANS, CISA VLP, or a PDF checklist.

### Simulated PowerShell Terminal

**What:** A browser-rendered terminal widget that accepts PS commands, validates them against an expected answer set, and returns realistic-looking output including errors.

**Why differentiating:** No free, publicly available compliance training combines actual command-level PS practice with regulatory control mapping. CISA's free ICS training is conceptual. SANS ICS410/ICS456 is $7,000+/seat. Vendor resources (Dragos, Claroty) are sales-gated. Codecademy teaches generic PS, not compliance workflows.

**What makes it actually effective (not just cosmetic):**
- The terminal must accept the *correct* command and plausible near-misses, not only one exact string. A learner who types `Get-EventLog -LogName Security -Newest 100` instead of the expected `Get-WinEvent` variant should get a hint, not a silent failure.
- Realistic output is essential. Return fake but plausible data: fake hostnames, fake SIDs, plausible timestamps. "Sanitized" output that returns `[OUTPUT]` is useless.
- Show the "why" inline: after a correct command, explain what each parameter does in a collapsible annotation below the terminal, not in a separate lesson pane.
- Include common error responses. A learner who miscapitalizes a parameter name should see the real PS error format, not a generic "wrong answer" message.
- Whitelist-only execution model: only pre-defined commands work; this is both a security posture and an instructional constraint (prevents wild experimentation that derails the lesson).

**Complexity:** High — this is the most complex feature on the platform. Requires a command parser, output renderer, state machine per exercise, and careful UX to avoid keyboard trapping in the widget.

**Dependency:** Requires lesson exercises to be authored with expected command sets before the terminal can be wired up.

---

### Compliance Control ID Tags on Every Content Unit

**What:** Each lesson section, quiz question, and terminal exercise visibly displays the control IDs it addresses (e.g., "NERC CIP-007 R4", "TSA SD-02C Measure 3", "NIST SP 800-82 §6.2").

**Why differentiating:** Compliance officers, not just learners, consume this tool. A compliance manager needs to answer "did my team cover CIP-010 R2?" — they need to see that answer without reading every lesson. Control tagging makes the platform auditable.

**How compliance mapping typically works in training tools:**
- Tags are hierarchical: Standard → Requirement → Sub-requirement (e.g., NERC CIP-007 → R4 → R4.1)
- A "compliance map" index page lists every control addressed and links to the content covering it — this lets a manager walk in with a control gap list and find the relevant training immediately
- Tags must be versioned: TSA directives have revision letters (SD-02C, not just SD-02); the UI must surface which version of a standard each tag references

**Complexity:** Low-to-medium for the display layer; high for the authoring discipline needed to tag correctly and keep tags current as standards evolve.

---

### OT/ICS-Specific Content That Treats OT Constraints as Real, Not Theoretical

**What:** Lessons explicitly model OT realities: air-gapped networks, vendor patch windows, Windows XP/2003 systems still in service on PLCs, PS Remoting disabled by default in OT segments, network segmentation that makes PS commands unreachable.

**Why differentiating:** Every generic cybersecurity training course teaches IT-centric PS skills and then notes "OT is different" in a sidebar. The gap is enormous: the DOE has commissioned gap analysis work on exactly this workforce shortfall. A pipeline admin doing the Patch Management module needs to see the constrained workflow (offline patch staging, manual transfer to air-gapped segment, vendor coordination) not the standard WSUS/SCCM workflow.

**Complexity:** Medium — requires subject matter accuracy, not technical complexity. The lesson authoring is the hard part.

---

### Printable/Exportable Completion Summary

**What:** A browser-rendered summary page (and print-to-PDF path) showing: learner name (self-entered), module completed, date, quiz scores, and control IDs covered. Functions as a training record for compliance file.

**Why differentiating:** NERC CIP-004 requires organizations to document personnel training and maintain records auditors can inspect. TSA directives similarly require evidence of training. A static site cannot generate server-side certificates, but a well-designed print view with a timestamp and control list is a legitimate compliance artifact. No free online resource provides this.

**Implementation note:** Name is self-entered (no auth); timestamp comes from `new Date()` at completion time, written to localStorage and rendered on the summary page. The burden of record-keeping is on the organization, not the platform — the platform just makes it easy to produce the artifact.

**Complexity:** Low — this is a styled print view with localStorage-driven data population.

---

### Scenario-Based "Incident in Progress" Exercises

**What:** Multi-step exercises where the learner is dropped into a partially active incident (e.g., "You've received an alert that a SCADA workstation is beaconing outbound. You have 20 minutes before your shift lead asks for a status report. What do you do first?") and must select or type actions in sequence, with each action producing a consequence.

**Why differentiating:** These go beyond quiz questions (which test recall) and beyond terminal exercises (which test command syntax). They test judgment and procedure adherence — the actual skill gap NERC CIP-004 and TSA directives are trying to address. Immersive Labs charges enterprise pricing for this exact capability.

**Complexity:** High — requires a state machine per scenario, branching consequence trees, and careful authoring to avoid trivial or gotcha-style branching.

**Dependency:** Should be built after the lesson content for the relevant module is stable, so scenarios reflect accurate procedures.

---

### "Copy This to Your Environment" Reference Format

**What:** Each terminal exercise includes a companion reference card showing the real command with real parameter options (not the simplified training version), formatted for direct use at a production workstation.

**Why differentiating:** The project's stated core value is "an admin who completes a module should be able to perform the covered compliance control in their real environment." The reference card is the bridge between training and execution. This is the feature that makes the tool a reference resource (high retention value) rather than a one-time course (completed and forgotten).

**Complexity:** Low — this is a content authoring convention, not a new technical component.

---

## Anti-Features (Don't Build)

Things that sound good but actively harm this specific use case.

### Points, Badges, and Leaderboards

**Why not:** OT/IT admins are professionals motivated by job performance and regulatory compliance, not gamification. Adding leaderboards to compliance training is widely documented to backfire: it signals that the organization doesn't trust employees to care about real outcomes, and it converts intrinsic motivation (doing your job right) into extrinsic motivation (gaming a score). Ian Bogost's critique of "gamification as bullshit" applies precisely here. Adobe and Google both abandoned gamification overlays on professional tools for this reason.

**Exception:** A simple visual progress indicator (module X of 5, lesson Y of Z) is not gamification — it is wayfinding. Keep that.

---

### User Accounts and Authentication

**Why not:** Explicitly out of scope (PROJECT.md). Beyond scope, accounts introduce: GDPR/privacy obligations, credential management overhead, session expiry edge cases, password reset flows, and the need for server infrastructure that breaks the static-site constraint. The target organization manages its own personnel records; this platform should produce artifacts those records can incorporate, not become a record system itself.

---

### Video Content

**Why not:** Explicitly out of scope for v1. Beyond scope, video is expensive to produce, inaccessible without captions, hard to update when standards change, and poor for reference use (you can't `Ctrl+F` a video). The text-plus-code-plus-interactive format is actually superior for the learning objectives here: command syntax is better learned by typing it than watching it typed.

---

### Forum or Community Features

**Why not:** A discussion forum requires moderation, accounts, and server infrastructure. More importantly, the content here has a correct answer (regulatory requirements are not matters of opinion). A forum that allows peer-to-peer advice risks spreading misapplied compliance guidance. For genuine community needs, the target audience already has ISACs (E-ISAC for NERC members, Oil and Natural Gas ISAC).

---

### Adaptive Learning Paths / AI Personalization

**Why not:** These features require backend analytics, persistent user profiles, and a model of learner behavior over time. On a static site with no auth, they are not implementable without a third-party analytics service (which introduces privacy concerns in an industrial security context). More importantly, the compliance curriculum is not optional — every admin needs every module, so personalization that skips content creates compliance gaps.

---

### Social Sharing / "Share Your Completion"

**Why not:** Sharing compliance training completions on social media is inappropriate in an operational security context. Pipeline companies operate under TSA directives that include operational security requirements; broadcasting "I just completed SCADA security training" is exactly the kind of signal threat actors use for social engineering targeting.

---

### Offline PWA / Service Worker Caching

**Why not:** The instinct to make this work offline is understandable (OT environments may have internet restrictions), but a PWA adds meaningful complexity, requires HTTPS enforcement with specific headers, and creates cache invalidation problems when compliance content is updated. The better answer for truly air-gapped deployments is a self-hosted fork (the public-first design explicitly supports this). Don't solve the air-gap problem in the public deployment.

---

## Compliance Training Specifics

How compliance mapping works in mature training tools, and what this platform needs to do.

### Control ID Tagging Structure

Mature compliance training tools (e.g., those used for NERC CIP-004 audit evidence) use hierarchical tagging:

```
Standard → Requirement → Sub-requirement → Measure
NERC CIP-007 → R4 → R4.1 → "Log security events..."
TSA SD-02C → Pillar 2 → Measure 3 → "Detect and report..."
NIST SP 800-82 → Chapter 6 → §6.2.1 → "Access control..."
```

The platform needs:
1. A tag per content unit (lesson section, quiz question, exercise)
2. A compliance index page that inverts the mapping: given a control ID, list all content that covers it
3. Version markers on each tag (standards change; CIP-007 R4 in 2023 differs from earlier versions)

### Evidence of Completion — What Auditors Actually Want

NERC CIP-004 (the personnel training standard) requires evidence that:
- Each individual with access to BES Cyber Systems completed required training
- Training records include the individual's identity, the training topic, and the completion date
- Records are retained for at least 3 years post-role (varies by requirement)

What a static site can produce:
- A completion summary with self-entered name, module title, control IDs covered, date/time (from browser clock), and quiz scores
- This is a legitimate supporting artifact when combined with the organization's own training log — it is not a substitute for a proper LMS record in an audited NERC environment
- The platform should be explicit about this: "Print or save this completion record. Your compliance program should incorporate it into your training log system."

What this platform cannot produce without a backend:
- Tamper-evident records (no server-side signing)
- Multi-user aggregate reporting ("how many of my 12 admins completed this?")
- Automatic record retention

Design implication: position the completion summary as a "training artifact" not a "compliance record." The language matters for auditors.

### TSA SD-02C Training Requirements (2024-2025)

The TSA 2024 Notice of Proposed Rulemaking formalizes:
- Mandatory cybersecurity training for OT personnel at covered pipeline operators
- Performance-based approach: operators must demonstrate outcomes, not just seat hours
- Training must cover: access control, network segmentation, incident detection and reporting, patch management for OT environments

The SD-02F (current as of 2024-2025) extends SD-02C series requirements. Content must reflect this, not just the 2021 original directives.

Design implication: each module's compliance tag set must include the current directive revision letter, not just "TSA SD-02."

---

## Existing Gaps in OT/Pipeline Training Resources

What the market currently provides, and where this platform can fill genuine white space.

### What Exists (and Its Limitations)

| Provider | What They Offer | Limitation |
|---|---|---|
| CISA ICS Training (free) | Web-based conceptual courses (101, 201, 301) via VLP | Requires .gov/.edu/.mil email; no hands-on PS exercises; no pipeline-specific compliance mapping |
| SANS ICS410/ICS456 | Deep technical OT security training with GCIP cert | $6,500-$8,000/seat; not PS-skill focused; no PowerShell hands-on |
| Dragos/Claroty training | Architecture reviews, tabletop exercises | Sales-gated; requires vendor relationship; not self-service |
| NICCS catalog (Tonex, Infosec) | CIP-focused courses | Paid; classroom-format; no interactive exercises |
| Idaho National Laboratory | ICS evaluation course (401L/401V) | Requires in-person attendance; invitation-based |
| EC-Council ICS/SCADA | Certification-track course | Paid certification prep; not compliance-workflow focused |
| Microsoft Learn PS courses | Excellent PS fundamentals | No OT context; no compliance framing; no pipeline-specific scenarios |
| Exercism PS track | 135 PS exercises | Pure language learning; no security or compliance content |

### Genuine Gaps This Platform Fills

**1. Free, self-service, hands-on PS training mapped to pipeline compliance**
No free resource combines: (a) interactive PS command practice, (b) TSA/NERC CIP/NIST control mapping, (c) OT-specific constraints (air gaps, vendor windows, legacy systems), and (d) no registration wall. This is the primary gap.

**2. OT patching workflow training**
The Patch Management module is particularly underserved. Generic patching training (WSUS, SCCM, Windows Update) is abundant. Training that models the OT-constrained workflow — offline media, vendor coordination, extended patch windows, risk-based deferral documentation — is almost nonexistent in free resources. This is a critical gap because TSA directives specifically require patch management programs for pipeline OT.

**3. Compliance-to-command mapping for working admins**
The typical admin knows they need to "implement logging per CIP-007 R4" but doesn't know which PS commands produce compliant audit log configurations. No free resource maps directly from control ID to executable command with validation. This is the missing link.

**4. Content accessible to IT admins transitioning to OT roles**
Many pipeline companies are assigning IT security staff to OT compliance responsibilities. These admins know PS but don't know ICS. Most OT security training assumes either deep ICS background (SANS) or zero security background (CISA 101). This platform's stated audience — basic PS users — is exactly the underserved middle.

**5. Forkable/customizable base for internal deployment**
No existing free resource is designed to be forked and customized for a specific operator's environment (custom hostnames, custom network diagrams, company-specific procedures). This platform's public-first, no-auth architecture makes it the natural base for internal adaptation.

### What This Platform Should Not Try to Be

- A substitute for SANS ICS456 for deep OT security practitioners (that's a different audience)
- A compliance management system (no audit trail, no multi-user reporting)
- A current-events threat intelligence resource (content will age; focus on durable compliance skills, not threat actor TTPs)
- A vendor-neutral ICS product training resource (PLC-specific content goes out of scope fast)

---

## Feature Dependencies

```
localStorage schema
  └── Progress tracking (module/lesson/quiz state)
  └── Completion summary (name, date, scores, control IDs)

Compliance tag system
  └── Control ID tagging on all content units
  └── Compliance index page
  └── Completion summary (pulls tags from completed content)

Simulated terminal
  └── Command whitelist + expected output definitions (per exercise)
  └── Exercise state machine
  └── Lesson content (exercises authored after lessons stable)

Scenario exercises
  └── Lesson content (scenarios reference procedures taught in lessons)
  └── Branching state machine (separate from terminal; text-choice based)

Reference library
  └── Content authoring (commands, glossary terms, control references)
  └── Client-side search index (built from reference content)
```

---

## MVP Feature Priority

**Build in v1 skeleton (all 5 modules):**
1. Module index with progress indicators (localStorage)
2. Lesson pages with control ID tags visible
3. Knowledge-check quizzes with immediate explanatory feedback
4. Code blocks with syntax highlighting and copy-to-clipboard
5. Compliance tag display (visible on each lesson section)
6. Printable completion summary per module

**Build in v1 for at least one module (demonstrate the pattern):**
7. Simulated PS terminal (one complete exercise per module minimum)
8. OT-specific scenario exercise (one per module)
9. "Copy to your environment" reference card alongside each terminal exercise

**Defer to v2:**
10. Compliance index page (inverted control-to-content map)
11. Full searchable reference library (client-side search)
12. Cross-module completion summary (aggregate all 5 modules)
13. Scenario branching exercises (complex state machine; validate the simpler terminal exercises first)

---

## Sources

- NERC CIP-004 training requirements: https://www.huntress.com/blog/nerc-cip-training-requirements
- NERC CIP audit evidence guidance: https://frenos.io/nerc-cip/nerc-cip-audit
- TSA pipeline directives and NPRM (2024): https://industrialcyber.co/regulation-standards-and-compliance/strengthening-pipeline-security-a-guide-for-ot-professionals-on-tsa-pipeline-security-directives-and-the-2024-notice-of-proposed-rules/
- TSA SD-02F overview: https://www.mangancyber.com/tsa-pipeline-directive-sd02f/
- CISA free ICS training catalog: https://www.cisa.gov/resources-tools/programs/ics-training-available-through-cisa
- SANS oil and gas cybersecurity resources: https://www.sans.org/oil-and-gas
- OT/ICS security oil and gas gap analysis: https://securityboulevard.com/2024/05/complete-guide-to-ot-ics-security-in-the-oil-and-gas-industry/
- DOE ICS/OT cybersecurity training gap analysis: https://www.techwerx.org/opportunities/CESER-SICSCT
- Hands-on simulation retention improvement: https://www.avatier.com/blog/security-simulation-practice-defense/
- Spaced repetition and retrieval practice: https://truelearn.com/resource-library/combine-practice-retrieval-and-spaced-repetition-into-a-powerful-teaching-learning-tool/
- Gamification backlash in compliance training: https://www.eleken.co/blog-posts/gamification-in-elearning
- CLI accessibility challenges (WCAG): https://dl.acm.org/doi/fullHtml/10.1145/3411764.3445544
- xterm.js browser terminal: https://xtermjs.org/
- PowerShell browser-based REPL (whitelisted command approach): https://www.powershell.news/p/powershell-770-preview1-released
- Quick reference card design: https://theelearningcoach.com/media/graphics/design-a-quick-reference-card/
- Completion certificate verifiability: https://sertifier.com/blog/verifiable-certificate-of-completion/
