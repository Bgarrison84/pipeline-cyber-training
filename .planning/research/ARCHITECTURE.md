# Architecture Research — Pipeline Cyber Training

**Researched:** 2026-05-10
**Confidence:** HIGH (routing, localStorage, terminal pattern), MEDIUM (content architecture tradeoffs)

---

## Component Map

### Top-Level Boundary: Everything Runs in the Browser

There is no server, no API, no build step required at runtime. The browser fetches static files from GitHub Pages, and all computation happens client-side. This constraint is a design input, not a limitation to work around.

### Major Components

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│              (shell: nav, main container, footer)           │
└───────────┬─────────────────────────────────────────────────┘
            │ owns DOM, loads JS modules
            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Router                                │
│  Reads location.hash → resolves route → calls View loader  │
│  Handles: #/ #/module/:id #/lesson/:moduleId/:lessonId      │
│           #/quiz/:id #/reference #/terminal/:exerciseId     │
└───────────┬─────────────────────────────────────────────────┘
            │ calls
            ▼
┌───────────────────────────────────┐
│          View Layer               │
│  Each "page" is a render()        │
│  function that returns HTML/DOM   │
│  fragments injected into #app     │
│                                   │
│  Views:                           │
│  - HomeView (module catalog)      │
│  - ModuleView (lesson list)       │
│  - LessonView (lesson + content)  │
│  - QuizView (question sequence)   │
│  - TerminalView (PS simulator)    │
│  - ReferenceView (searchable lib) │
│  - ExerciseView (scenario steps)  │
└──────┬───────────────┬────────────┘
       │               │
       ▼               ▼
┌────────────┐  ┌─────────────────────────┐
│  Content   │  │    Progress Store       │
│  Loader    │  │                         │
│            │  │  Single source of truth │
│  fetch()   │  │  for all user state.    │
│  JSON/MD   │  │  Reads/writes only to   │
│  files     │  │  localStorage. Exposes  │
│  from      │  │  get/set/subscribe API. │
│  /content/ │  │                         │
└──────┬─────┘  └─────────┬───────────────┘
       │                  │
       ▼                  ▼
┌──────────────┐  ┌───────────────────────┐
│  Markdown    │  │  localStorage         │
│  Renderer    │  │  (browser storage)    │
│  (marked.js  │  │                       │
│  + DOMPurify)│  └───────────────────────┘
└──────────────┘

┌──────────────────────────────────────────┐
│           Terminal Engine                │
│                                          │
│  Owns: input parsing, command registry,  │
│  output rendering, history buffer,       │
│  exercise state machine, hint system     │
│                                          │
│  Does NOT: execute real commands,        │
│  make network calls, touch localStorage  │
│  (TerminalView passes results up)        │
└──────────────────────────────────────────┘
```

### Component Responsibilities (Explicit Boundaries)

| Component | Owns | Does NOT Touch |
|-----------|------|----------------|
| Router | URL parsing, view lifecycle, back/forward | DOM content inside #app |
| View Layer | Rendering to #app, event binding within view | Routing, data fetching, storage |
| Content Loader | fetch() calls, caching fetched data, parsing | DOM, routing, progress |
| Progress Store | localStorage read/write, schema versioning | Rendering, routing, network |
| Markdown Renderer | Converting MD strings to sanitized HTML | Fetching, storage, routing |
| Terminal Engine | Command registry, input→output loop, exercise grading | DOM layout, routing, storage |

**Communication rule:** Views are the only component allowed to call both Content Loader and Progress Store. Terminal Engine is stateless across exercises — TerminalView initializes it fresh per exercise and reports completion up to the Progress Store.

---

## Data Models

### Module

```json
{
  "id": "logging-auditing",
  "title": "Logging & Auditing",
  "slug": "logging-auditing",
  "description": "Configure Windows Event Logging and PowerShell script block logging to meet TSA SD-02C and NIST SP 800-92 requirements.",
  "complianceTags": ["TSA-SD02C-3.1", "NERC-CIP-007-6-R4", "NIST-SP800-92"],
  "order": 1,
  "lessons": ["lesson-id-1", "lesson-id-2"],
  "quizzes": ["quiz-id-1"],
  "exercises": ["exercise-id-1"],
  "estimatedMinutes": 45,
  "status": "available"
}
```

### Lesson

```json
{
  "id": "logging-pslogging-basics",
  "moduleId": "logging-auditing",
  "title": "Enabling PowerShell Script Block Logging",
  "order": 2,
  "type": "lesson",
  "complianceTags": ["TSA-SD02C-3.1", "NIST-SP800-92-4.2"],
  "estimatedMinutes": 10,
  "contentPath": "/content/modules/logging-auditing/lesson-pslogging-basics.md",
  "prerequisites": ["logging-what-to-log"],
  "terminalExerciseId": "ex-pslogging-enable"
}
```

- `contentPath` points to the Markdown file. The lesson metadata lives in JSON; the lesson body lives in Markdown.
- `prerequisites` lists lesson IDs that should be completed first. The UI enforces soft ordering (warns, does not block).
- `terminalExerciseId` is optional — links to an embedded terminal exercise.

### Quiz Question

```json
{
  "id": "q-pslogging-001",
  "moduleId": "logging-auditing",
  "type": "multiple-choice",
  "stem": "Which registry key enables PowerShell Script Block Logging?",
  "complianceTags": ["NIST-SP800-92"],
  "answers": [
    {
      "id": "a",
      "text": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ScriptBlockLogging",
      "correct": true,
      "feedback": "Correct. Set EnableScriptBlockLogging to 1 at this key."
    },
    {
      "id": "b",
      "text": "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\EventLog",
      "correct": false,
      "feedback": "This key controls the Event Log service configuration, not script block logging."
    },
    {
      "id": "c",
      "text": "HKCU:\\SOFTWARE\\Microsoft\\PowerShell",
      "correct": false,
      "feedback": "Per-user keys do not control Script Block Logging; it requires a machine-level policy."
    }
  ],
  "explanation": "Script Block Logging captures the full content of all executed script blocks to the Security event log (Event ID 4104)."
}
```

- `type` allows future expansion: `multiple-choice`, `multi-select`, `ordering`, `fill-in`.
- `feedback` per answer enables immediate targeted feedback, not just correct/wrong.

### Terminal Exercise

```json
{
  "id": "ex-pslogging-enable",
  "moduleId": "logging-auditing",
  "title": "Enable Script Block Logging",
  "description": "Use PowerShell to enable Script Block Logging via the registry.",
  "difficulty": "beginner",
  "complianceTags": ["TSA-SD02C-3.1"],
  "context": "You are on a Windows Server 2022 host. Script Block Logging is currently disabled. Enable it using the registry.",
  "environment": {
    "cwd": "C:\\Windows\\System32",
    "simulatedUser": "DOMAIN\\Admin",
    "availableCommands": ["Set-ItemProperty", "Get-ItemProperty", "New-Item", "Get-Item"]
  },
  "steps": [
    {
      "id": "step-1",
      "instruction": "Navigate to the Script Block Logging policy path.",
      "hint": "Use Set-Location or cd to navigate.",
      "expectedCommands": [
        {
          "pattern": "^(Set-Location|cd|sl)\\s+['\"]?HKLM:\\\\SOFTWARE\\\\Policies\\\\Microsoft\\\\Windows\\\\PowerShell['\"]?",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "PS HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell>",
      "feedbackOnWrong": "Try using Set-Location with the full HKLM: path."
    },
    {
      "id": "step-2",
      "instruction": "Create the ScriptBlockLogging subkey if it does not exist.",
      "hint": "New-Item creates a registry key. Use -Force to avoid errors if it already exists.",
      "expectedCommands": [
        {
          "pattern": "New-Item.*ScriptBlockLogging.*-Force|-Force.*New-Item.*ScriptBlockLogging",
          "matchType": "regex",
          "caseSensitive": false
        }
      ],
      "successOutput": "    Hive: HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\n\nName              Property\n----              --------\nScriptBlockLogging",
      "feedbackOnWrong": "Use New-Item with -Path and -Force to create the key."
    }
  ]
}
```

### Scenario Exercise

```json
{
  "id": "scenario-incident-lateral",
  "moduleId": "incident-response",
  "title": "Detecting Lateral Movement on the OT Network",
  "type": "scenario",
  "complianceTags": ["TSA-SD02C-4.2", "NIST-CSF-DE.CM"],
  "narrative": "At 02:14 UTC, your SIEM alerted on unusual SMB traffic from an HMI workstation to your historian server. You have 30 minutes before the morning operations shift. Walk through your initial triage steps.",
  "phases": [
    {
      "id": "phase-1",
      "title": "Identify the scope",
      "type": "decision",
      "prompt": "What is your first action?",
      "options": [
        {
          "id": "opt-a",
          "text": "Immediately isolate the HMI workstation from the network",
          "outcome": "Premature isolation can disrupt active OT processes. In pipeline environments, abrupt disconnection can cause control loop failures. Triage first.",
          "correct": false
        },
        {
          "id": "opt-b",
          "text": "Pull the event logs from the HMI workstation to establish a timeline",
          "outcome": "Good first step. Understanding what happened before containment prevents destroying forensic evidence.",
          "correct": true
        }
      ]
    }
  ]
}
```

### Progress Store Schema

```json
{
  "schemaVersion": 2,
  "lastUpdated": "2026-05-10T14:23:00Z",
  "modules": {
    "logging-auditing": {
      "lessonsCompleted": ["logging-what-to-log", "logging-pslogging-basics"],
      "lessonsVisited": ["logging-audit-policies"],
      "quizzesCompleted": {
        "quiz-logging-001": {
          "score": 85,
          "completedAt": "2026-05-10T14:20:00Z",
          "attempts": 1
        }
      },
      "exercisesCompleted": ["ex-pslogging-enable"],
      "scenariosCompleted": []
    }
  },
  "globalStats": {
    "totalLessonsCompleted": 2,
    "totalExercisesCompleted": 1,
    "lastActiveModule": "logging-auditing",
    "firstVisit": "2026-05-09T09:00:00Z"
  }
}
```

**Schema versioning rationale:** Store a `schemaVersion` integer in localStorage. On app load, the Progress Store reads the version, runs any pending migration functions in sequence (v1→v2, v2→v3), then writes the migrated data back. This prevents stale data from old deployments from breaking new code silently.

---

## Simulated Terminal Design

### Core Architecture: Command Registry Pattern

The terminal is a state machine with three layers. None of these layers execute real PowerShell.

```
INPUT LAYER         REGISTRY LAYER          OUTPUT LAYER
─────────────       ────────────────────    ─────────────
<textarea/div>  →   CommandParser           TerminalDisplay
                    tokenizes input         buffers history
                    normalizes casing       renders ANSI-
                    strips extras           style output
                         │
                         ▼
                    ExerciseEngine
                    per-step validator:
                      1. Tokenize command
                      2. Match against
                         step.expectedCommands
                         patterns (regex)
                      3. Return: success |
                         partial | fail |
                         hint
                         │
                         ▼
                    CommandSimulator
                    returns canned
                    successOutput or
                    feedbackOnWrong string
```

### Command Parsing

```javascript
// CommandParser normalizes input before matching
function parseCommand(rawInput) {
  const trimmed = rawInput.trim();
  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  return {
    raw: trimmed,
    verb: tokens[0] || '',
    args: tokens.slice(1),
    flags: extractFlags(tokens),
  };
}
```

### Pattern Matching Strategy

Use **regex patterns stored in exercise JSON** — not hardcoded in JS. This lets content authors add new exercises without touching engine code.

Each step defines one or more `expectedCommands` objects. The engine iterates them in order and returns success on the first match. Multiple patterns per step allow for alias commands (`Set-Location` vs `cd` vs `sl`) or multiple valid phrasings.

**Match type options:**
- `"regex"` — full regex match against raw input (most flexible, handles parameter ordering variations)
- `"exact"` — normalized string equality (useful for simple one-liner commands)
- `"contains"` — substring check (most lenient, for free-form steps)

**Casing:** PowerShell cmdlet names are case-insensitive by convention. Always apply `.toLowerCase()` to both input and pattern before matching unless `caseSensitive: true` is set.

### Exercise State Machine

```
IDLE
  │ TerminalView.init(exerciseId) called
  ▼
LOADING — fetches exercise JSON
  │
  ▼
STEP_N (n = 0..steps.length-1)
  │ user submits input
  ▼
VALIDATING
  ├─ match found ──► render successOutput, advance to STEP_N+1
  ├─ no match ─────► render feedbackOnWrong, stay in STEP_N
  └─ hint requested ► render step.hint, stay in STEP_N (no penalty)
  │
  ▼ (after last step)
COMPLETE — TerminalView emits 'exerciseComplete' event
           ProgressStore.markExerciseComplete(exerciseId) called
```

### What the Terminal Does NOT Do

- Does not execute any system commands (no eval, no exec, no shell access)
- Does not make network calls
- Does not parse complex PowerShell syntax beyond tokenization for matching
- Does not simulate a real filesystem state (it can show canned "directory listing" strings, but there is no actual mutable virtual FS object in v1)

### UI Behavior

- Input: a styled `<div contenteditable="true">` or `<input>` at the bottom of the terminal pane, styled like a PS prompt (`PS C:\> `).
- Up-arrow cycles through command history (stored in an in-memory array, not localStorage).
- Output rendered as preformatted text in a scrollable upper pane.
- Tab key triggers the hint if the current step has one defined.
- Terminal pane is embedded within LessonView or ExerciseView — it is not a separate route.

---

## Content Architecture

### Recommendation: Hybrid JSON + Markdown

Do not hardcode lesson bodies as HTML strings. Do not use a full static site generator (no Jekyll, no Eleventy build step). Use the following split:

| Content Type | Format | Location | Why |
|---|---|---|---|
| Module metadata | JSON | `/content/modules/index.json` | Machine-readable, loaded on app init |
| Lesson metadata | JSON | `/content/modules/{id}/lessons.json` | One file per module, not one per lesson |
| Lesson body | Markdown | `/content/modules/{id}/{lessonSlug}.md` | Non-developers can edit; renders to HTML |
| Quiz questions | JSON | `/content/modules/{id}/quiz.json` | Structured data, not prose |
| Terminal exercises | JSON | `/content/modules/{id}/exercises.json` | Structured, machine-validated |
| Scenario exercises | JSON | `/content/modules/{id}/scenarios.json` | Decision tree structure |
| Reference entries | JSON | `/content/reference/entries.json` | Filterable/searchable on client |

### Why Not Pure HTML

Hardcoded HTML in JS strings is uneditable by non-developers, diffs poorly in git, and mixes content and code.

### Why Not a Full SSG Build Step

Jekyll/Eleventy adds CI/CD complexity, requires a build environment, and makes forking harder for non-developers. The target audience (IT/OT admins at pipeline companies) who fork this will not have a Node.js toolchain. Fetch-based Markdown rendering requires zero build step.

### Why Not Pure JSON for Lesson Bodies

JSON strings require escaping, cannot contain code blocks naturally, and are unpleasant to author. Markdown is the established convention for technical writing and is familiar to anyone who has used GitHub.

### Rendering Pipeline

```
1. LessonView.render(lessonId) called
2. Content Loader checks in-memory cache
   ├─ hit: return cached Markdown string
   └─ miss: fetch('/content/modules/{id}/{slug}.md')
3. marked.parse(markdownString) → raw HTML
4. DOMPurify.sanitize(rawHTML) → safe HTML
5. contentEl.innerHTML = safeHTML
6. Syntax highlighting pass (highlight.js) over all <code> blocks
7. Compliance tag badges injected from lesson metadata
```

**Libraries:** `marked` (fast, widely used) + `DOMPurify` (sanitization, required when using innerHTML) + `highlight.js` (PowerShell syntax highlighting). All three load from CDN or are bundled. No build step needed.

### Content Authoring for Non-Developers

Non-developers edit Markdown files directly on GitHub (pencil icon in the GitHub file browser). The front-matter pattern (YAML metadata block at top of `.md` file) is NOT used here — lesson metadata lives in the JSON file to keep the Markdown renderer simple and to allow metadata to be loaded without fetching all lesson bodies upfront.

A content author's workflow:
1. Navigate to `/content/modules/logging-auditing/` in the GitHub repo.
2. Click the `.md` file for the lesson to edit.
3. Click the pencil icon, edit in GitHub's Markdown editor, commit.
4. Changes are live within seconds (GitHub Pages propagation).

For new lessons: author edits `lessons.json` to add the metadata entry and creates a new `.md` file in the same folder. No code change required.

---

## Routing Strategy

### Recommendation: Hash-Based Routing (No 404 Trick Needed)

For this project, use `location.hash` routing (`#/` prefix). Do not implement the 404 redirect trick.

**Rationale:**

| Factor | Hash Routing | 404 Trick |
|---|---|---|
| Complexity | Low — just `hashchange` listener | Medium — two files, URL transformation script |
| GitHub Pages compatibility | Native, always works | Works but fragile; Google stopped following in 2019 |
| Direct URL sharing | Works (hash included in URL when shared) | Works but SEO broken |
| Forkability | Zero config required | Requires `pathSegmentsToKeep` config for repo-name prefix |
| SEO | Irrelevant (training app, not SEO target) | — |
| Deep links | Work correctly | Work correctly |

The 404 trick's main benefit is clean URLs (`/module/logging` vs `#/module/logging`). For a training app used by IT admins — not indexed by search engines, not shared as marketing links — hash routing is simpler and more reliable.

### Route Table

```javascript
const routes = {
  '#/':                              HomeView,
  '#/module/:moduleId':              ModuleView,
  '#/lesson/:moduleId/:lessonId':    LessonView,
  '#/quiz/:moduleId':                QuizView,
  '#/exercise/:exerciseId':          ExerciseView,
  '#/scenario/:scenarioId':          ScenarioView,
  '#/reference':                     ReferenceView,
  '#/reference/:entryId':            ReferenceDetailView,
};
```

### Router Implementation

```javascript
// In router.js
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

function handleRoute() {
  const hash = window.location.hash || '#/';
  const { view, params } = matchRoute(hash, routes);
  if (view) {
    view.render(document.getElementById('app'), params);
  } else {
    NotFoundView.render(document.getElementById('app'), {});
  }
}
```

`matchRoute` tokenizes the hash and extracts named params (`:moduleId`, `:lessonId`) from the matched pattern.

### Navigation

All `<a>` elements use `href="#/lesson/logging-auditing/lesson-id"` format. No `history.pushState` needed. The browser Back button works correctly because hash changes are native history entries.

---

## Build Order

The components have hard dependencies. Build in this sequence. Each phase must be runnable end-to-end before starting the next.

### Phase 1: Shell + Routing + Navigation

**Deliver:** A navigable site with working hash routing and empty page placeholders.

Components:
- `index.html` — semantic shell with `#app` container, site nav skeleton
- `router.js` — hash-based router, route table, param extraction
- `home-view.js` — renders module catalog (static placeholders OK)
- Basic CSS — layout grid, nav, typography (design tokens established here)

**Why first:** Everything else mounts into `#app`. The router is the backbone all views depend on. Establishing design tokens early prevents visual debt.

**Done when:** Clicking nav links changes the URL hash and renders different placeholder content without a page reload.

### Phase 2: Content Loader + Data Models + Module/Lesson Views

**Deliver:** Real lesson content renders from Markdown files.

Components:
- `/content/` directory structure established
- `content-loader.js` — fetch(), in-memory cache, error handling
- `markdown-renderer.js` — marked + DOMPurify + highlight.js pipeline
- `lesson-view.js` — fetches and renders a lesson
- `module-view.js` — renders module overview from lessons.json
- One complete module worth of Markdown content (Logging & Auditing)

**Why second:** Views need a content loading contract before they can render real data. Establishing the content file format here prevents later migrations.

**Done when:** Navigating to `#/lesson/logging-auditing/first-lesson` renders real Markdown lesson content with syntax-highlighted PowerShell code blocks.

### Phase 3: Progress Store

**Deliver:** Lesson completion tracked and persisted across page reloads.

Components:
- `progress-store.js` — localStorage read/write, schema versioning, migration runner
- Progress indicators in `lesson-view.js` (mark complete button)
- Progress badges in `module-view.js` (X of Y lessons complete)
- Schema v1 defined (never changes without a migration)

**Why third:** Progress store has no dependencies on terminal or quiz — it's pure data. Establishing it before quizzes and exercises means those components have a clean API to call. Do not add progress tracking ad-hoc inside quiz or terminal code.

**Done when:** Completing a lesson persists after a full browser refresh and page reload.

### Phase 4: Quiz Engine

**Deliver:** Knowledge-check quizzes with scoring and progress recording.

Components:
- `quiz-view.js` — question sequence, answer selection, feedback display
- `quiz.json` content files for one module
- Progress Store integration (record quiz score)
- Score summary screen

**Why fourth:** Quizzes are pure JSON data + render logic with no terminal dependency. Simpler to build and validate than the terminal. Establishes the pattern for structured exercise completion before the more complex terminal work.

**Done when:** Completing a quiz records the score, shows feedback per question, and shows cumulative result. Re-visiting shows prior score.

### Phase 5: Terminal Engine + Exercise View

**Deliver:** The simulated PS terminal with step-by-step exercise validation.

Components:
- `terminal-engine.js` — command parser, registry, step state machine
- `terminal-view.js` — UI shell (input, output buffer, prompt)
- `exercise-view.js` — loads exercise JSON, initializes terminal, handles completion event
- `exercises.json` for one module (3-5 exercises)
- Progress Store integration (record exercise completion)

**Why fifth:** Terminal has the most complex internal logic. Building it after the routing, content, and data patterns are established means its internal state machine does not need to worry about any infrastructure concerns. The exercise JSON schema must be finalized by this phase.

**Done when:** A user can work through a multi-step PS exercise, receive per-step feedback, and have completion recorded in progress tracking.

### Phase 6: Scenario Engine + Reference Library

**Deliver:** Decision-tree scenarios and searchable reference content.

Components:
- `scenario-view.js` — multi-phase decision tree renderer
- `scenarios.json` content files
- `reference-view.js` — renders filterable/searchable reference entries
- `reference/entries.json` — compliance-tagged command reference

**Why sixth:** Scenarios and the reference library are read-heavy with minimal state complexity. They build on the established content-loading and rendering patterns. Deferring them allows the core learning loop (lesson → quiz → exercise) to be solid before adding supplementary content types.

**Done when:** A user can step through a scenario making decisions and see outcomes, and can search the reference library by keyword or compliance tag.

### Phase 7: Remaining Module Content

**Deliver:** All five modules populated with content.

This is a content phase, not an engineering phase. The architecture is complete by Phase 6. Phases 7+ are content authoring work: writing Markdown lessons, JSON quiz questions, exercises, and scenarios for Network Hardening, Account & Access Management, Incident Response, and Patch Management.

**OT patching note:** The Patch Management module requires special treatment. It should be split into two sub-sections: Windows/IT patching (standard patterns) and OT/ICS patching (air-gap constraints, vendor windows, longer cycles, different risk calculus). This distinction must be reflected in the content structure — separate lesson IDs, separate compliance tags (NERC CIP-007 vs NIST SP 800-82 ICS guidance).

### Dependency Graph Summary

```
Phase 1 (Shell + Router)
    └── Phase 2 (Content + Markdown)
            └── Phase 3 (Progress Store)
                    ├── Phase 4 (Quiz)
                    └── Phase 5 (Terminal)
                            └── Phase 6 (Scenarios + Reference)
                                    └── Phase 7 (Content population)
```

No phase can be safely skipped. Progress Store (Phase 3) is the shared dependency that everything writes to — it must be defined before quizzes, terminal exercises, or scenarios record results.

---

## Cross-Cutting Concerns

### Forkability

For internal company deployment:
- All content paths are relative — no hardcoded GitHub username or repo name.
- Site title, org name, and logo are in a single `config.json` loaded on init.
- No analytics or external service calls in v1.
- Hash routing works on any static host with zero configuration.

### Accessibility

- Use semantic HTML (`<main>`, `<nav>`, `<article>`, `<section>`).
- Terminal input must be keyboard-navigable.
- Quiz answer options as `<input type="radio">` or `<button>` — not `<div>` click targets.
- Compliance badge colors must pass WCAG AA contrast.

### Error States

Each content fetch must handle: network failure (unlikely on GitHub Pages but possible), missing file (404), and malformed JSON. Show a graceful "content unavailable" message rather than a blank screen. Do not throw unhandled promise rejections.

---

## Sources

- GitHub Pages SPA routing: [rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages), [Smashing Magazine SPA hack](https://www.smashingmagazine.com/2016/08/sghpa-single-page-app-hack-github-pages/)
- Terminal simulation pattern: [TerminalFaker](https://github.com/syntaxseed/terminalfaker), [jQuery Terminal](https://terminal.jcubic.pl/), [SimulaCLI](https://github.com/thomasloupe/SimulaCLI)
- Course content data model: [edX Research Guide — Course Structure](https://edx.readthedocs.io/projects/devdata/en/latest/internal_data_formats/course_structure.html)
- localStorage schema migration: [localstorage-migrator](https://github.com/ragnarstolsmark/localstorage-migrator), [Simple frontend data migration](https://janmonschke.com/simple-frontend-data-migration/)
- Vanilla JS SPA routing: [Jeremy Likness — Build a SPA with VanillaJS](https://blog.jeremylikness.com/blog/build-a-spa-site-with-vanillajs/)
- Markdown rendering: [marked vs alternatives comparison](https://npm-compare.com/markdown-it,marked,remark,remarkable,showdown,turndown), [zero-md](https://cmhh.github.io/posts/rendering_markdown_on_the_web/index.html)
- Front matter / content authoring: [Jekyll Front Matter docs](https://jekyllrb.com/docs/front-matter/), [Markdoc frontmatter](https://markdoc.dev/docs/frontmatter)
