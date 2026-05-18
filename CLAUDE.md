# Pipeline Cyber Training — Project Guide

## What This Project Is

A static GitHub Pages web application that teaches IT/OT admins at oil and gas pipeline companies the PowerShell skills and cybersecurity concepts they need to meet regulatory compliance requirements (TSA Pipeline Security Directives, NIST SP 800-82 Rev 3). Five learning modules with guided lessons, quizzes, a simulated PowerShell terminal, and scenario-based exercises.

## Critical Facts

- **NERC CIP does NOT apply to pipeline operators** — it is an electric utility standard. Any NERC CIP content must be framed as a reference benchmark only.
- **TSA directive is currently SD-02F** (not SD-02C). All version strings live in `data/compliance-refs.json` — never hardcoded.
- **No backend, no real PowerShell execution.** This is a static GitHub Pages site. The terminal is a simulator.
- **PS version target: 5.1** (Windows built-in, common in pipeline IT/OT environments).

## Stack

- **Build:** Vite (required — Tailwind v4 dropped CDN)
- **CSS:** Tailwind v4 via `@tailwindcss/vite`
- **Terminal:** jQuery Terminal (fake-terminal pattern, not xterm.js)
- **Markdown:** marked.js v18 (installed: v18.0.3)
- **Syntax highlighting:** Shiki v4 (PS 5.1 grammar)
- **Routing:** Hash-based (`#/module/:id/lesson/:n`) — no 404.html trick
- **Progress:** localStorage with `schemaVersion` key
- **Hosting:** GitHub Pages with `.nojekyll`

## Architecture

```
data/
  compliance-refs.json    ← single source for all TSA/NIST version strings
  modules/
    logging-auditing/
      module.json         ← module metadata
      lessons/
        01-intro.md       ← lesson prose (Markdown + frontmatter)
      quizzes/
        01.json           ← quiz questions and per-answer feedback
      exercises/
        01.json           ← terminal exercise steps (regex patterns + canned output)
      scenarios/
        01.json           ← branching scenario decision tree
src/
  router.js               ← hash router
  progress-store.js       ← ALL localStorage access goes through here
  terminal-engine.js      ← command registry and exercise validator
  quiz-engine.js
  scenario-engine.js
  content-loader.js       ← fetch + marked.js + Shiki pipeline
```

## GSD Workflow

This project uses the GSD (Get Shit Done) planning system.

**8 phases defined. Start with Phase 1.**

```
/gsd-discuss-phase 1   ← discuss approach before planning
/gsd-plan-phase 1      ← create executable plans
/gsd-execute-phase 1   ← run the plans
```

After each phase: `/gsd-verify-work` confirms deliverables match success criteria.

## Phase Dependency Chain

```
Phase 1 (Shell + Router + Deploy)
  → Phase 2 (Content Loader + Module 1)
    → Phase 3 (Progress Store)
      → Phase 4 (Quiz Engine)     ← parallel with Phase 5
      → Phase 5 (Terminal Engine)
        → Phase 6 (Scenarios + Index + Summary)
          → Phase 7 (MOD-02, 03, 04 content)
            → Phase 8 (Patch Management MOD-05)
```

## Content Rules

1. Every OT-relevant lesson must have an explicit "In OT environments:" callout block
2. NERC CIP references include: *"NERC CIP governs electric utilities; pipeline operators follow TSA directives — referenced here as a maturity benchmark"*
3. All environment identifiers are generic: `PIPELINE-DC01`, `10.0.0.0/24`, `ExampleCorp`
4. Compliance control IDs always sourced from `data/compliance-refs.json`

## Resolved Decisions (v1.0)

- Custom vanilla JS terminal (no jQuery Terminal)
- Regex-based PS command parser; multi-line pipelines supported via continuation

## Planning Artifacts

| Artifact | Location |
|----------|----------|
| Project context | `.planning/PROJECT.md` |
| Requirements | `.planning/REQUIREMENTS.md` |
| Roadmap | `.planning/ROADMAP.md` |
| Research | `.planning/research/` |
| Config | `.planning/config.json` |
