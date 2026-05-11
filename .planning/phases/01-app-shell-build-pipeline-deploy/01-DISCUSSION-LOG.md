# Phase 1: App Shell + Build Pipeline + Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 1 - App Shell + Build Pipeline + Deploy
**Areas discussed:** GitHub repo location, Navigation layout, Visual feel, Module placeholder depth

---

## GitHub Repo Location

| Option | Description | Selected |
|--------|-------------|----------|
| Repo exists already | User has a repo ready | |
| Needs to be created | No repo yet — planner creates it | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Personal account (psyco) | Site at psyco.github.io/[repo-name] | |
| Different org or username | User specified: Bgarrison84 | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| pipeline-cyber-training | Bgarrison84.github.io/pipeline-cyber-training | ✓ |
| pipeline-ps-training | Bgarrison84.github.io/pipeline-ps-training | |
| ot-security-training | Bgarrison84.github.io/ot-security-training | |

**User's choice:** Bgarrison84/pipeline-cyber-training — repo needs to be created
**Notes:** Vite base path must be `/pipeline-cyber-training/`; GitHub Pages URL will be `Bgarrison84.github.io/pipeline-cyber-training`

---

## Navigation Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Left sidebar | Module list always visible on left | ✓ |
| Top navigation bar | Tabs/links across the top | |
| Sidebar + top bar hybrid | Top bar for global, sidebar for tree | |

| Option | Description | Selected |
|--------|-------------|----------|
| Modules only (collapsed) | Shows 5 module names, lessons expand on click | |
| All lessons visible | Full tree always expanded | |
| Current module expanded | Active module shows lessons, others collapsed | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, collapsible | Toggle button to hide sidebar | ✓ |
| No, always visible | Simpler, sidebar always present | |

| Option | Description | Selected |
|--------|-------------|----------|
| App name + compliance index link | Minimal top bar | |
| App name only | Purely decorative | |
| App name + compliance index + progress summary | All three | ✓ |

**User's choice:** Left collapsible sidebar, active module expanded. Top bar: app name + compliance index link + overall progress summary.
**Notes:** Collapsible is important for Phase 5 terminal exercises that need horizontal space.

---

## Visual Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Professional / clean (light) | White bg, corporate docs feel | |
| Technical / dark | Dark bg, terminal-adjacent | |
| High-contrast industrial | Bold colors, strong borders, control-room readable | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Steel blue / navy | Government/utility feel | |
| Safety orange + dark gray | Pipeline industry colors | ✓ |
| Neutral gray + green | Security/terminal feel | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pipeline Cyber Training | Descriptive name | |
| PipelineSecure | Shorter, branded | |
| OT Security Lab | Lab/hands-on feel | ✓ |

**User's choice:** High-contrast industrial tone, safety orange + dark gray, display name "OT Security Lab"
**Notes:** Should feel like an internal tool or lab environment, not a marketing site.

---

## Module Placeholder Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Structural skeleton | Module header + labeled empty sections | ✓ |
| Simple coming-soon card | Minimal stub | |
| Module overview only | Title + goal + compliance IDs | |

| Option | Description | Selected |
|--------|-------------|----------|
| No — grayed out / locked | Lesson items visible but not clickable | ✓ |
| Yes — opens a stub page | Clicking shows a minimal stub | |

**User's choice:** Structural skeleton with grayed-out non-clickable lesson items
**Notes:** Sections visible: Lessons, Quizzes, Terminal Exercises, Scenarios. This communicates the interactive promise before content exists.

---

## Claude's Discretion

- GitHub Actions workflow file structure
- Tailwind v4 CSS custom property naming convention
- Sidebar toggle animation
- Favicon and `<title>` tag value

## Deferred Ideas

None.
