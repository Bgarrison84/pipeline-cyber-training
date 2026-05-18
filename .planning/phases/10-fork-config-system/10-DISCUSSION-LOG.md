# Phase 10: Fork Configuration System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 10-Fork Configuration System
**Areas discussed:** Config schema fields, Branding surfaces, Inactive module behavior, Fork guide scope

---

## Config Schema Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Just those three | orgName, logoPath, activeModules only — minimal surface | ✓ |
| Add a helpdesk/contact URL | Support URL in training log footer | |
| Add custom home page description | Replace hardcoded subtitle | |
| You decide | Claude picks | |

**User's choice:** Just the three fields — minimal config surface.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Array of module IDs | e.g. `["logging-auditing", "network-hardening"]` | ✓ |
| Omit key to mean all-active | Missing activeModules = show all 5 | |

**User's choice:** Array of module IDs (explicit inclusion list).

---

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 active, generic name | DEFAULT_FORK_CONFIG = OT Security Lab, logoPath: null, all 5 IDs | ✓ |
| All 5 active, orgName: null | null means use current hardcoded value | |
| You decide | Claude picks | |

**User's choice:** All 5 modules active, orgName: 'OT Security Lab' as the default fallback.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — logo optional, text-only when null | logoPath: null → text-only header | ✓ |
| Yes, but provide default placeholder logo | Ship a generic icon in public/ | |

**User's choice:** Logo is optional — null means text-only.

---

**Additional input:** User mentioned they placed `OkieOps.png` in the project root.

| Option | Description | Selected |
|--------|-------------|----------|
| Move to public/, set as logoPath in fork.config.json | Ship OkieOps as the working example | ✓ |
| Move to public/ only, leave logoPath null | File available but config stays generic | |
| Keep in project root as reference | Not moved, just visual reference | |

**User's choice:** Move OkieOps.png → public/; committed fork.config.json uses orgName: "OkieOps" and logoPath: "OkieOps.png".

---

## Branding Surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Top-bar title span | The "OT Security Lab" `<span>` in the header | ✓ |
| Browser `<title>` tag | Visible in tabs and bookmarks | ✓ |
| Home page subtitle | Replace the "Five modules covering..." line | |

**User's choice:** Top-bar span + browser `<title>`. Home page subtitle stays static.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Logo image + org name text side by side | `<img>` + text in same span, logo ~32px height | ✓ |
| Logo image only, no text | Replace span with image only | |
| Logo + text in two-line treatment | More prominent, may overflow | |

**User's choice:** Logo image + org name text side by side in top-bar.

---

## Inactive Module Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Completely hidden | No sidebar entry, no home page card | ✓ |
| Shown but greyed out / locked | Visible but marked unavailable | |

**User's choice:** Completely hidden.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 2/2 — denominator is active modules | 2-module fork can reach 100% | ✓ |
| 2/5 — denominator always all 5 | Raw progress against full platform | |

**User's choice:** Active modules denominator — 2-module fork reaches 100%.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show "not available in your training" message | Informative inline message | ✓ |
| Redirect to home | Bounce to #/ on inactive module URL | |

**User's choice:** "Not available in your training" message — informative, not a redirect.

---

## Fork Guide Scope

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Pages only, GitHub web UI workflow | Zero git CLI — widest IT admin coverage | ✓ |
| GitHub Pages + brief git CLI option | Primary web UI + advanced CLI section | |
| Generic static hosting | GitHub Pages + Azure + IIS/nginx | |

**User's choice:** GitHub Pages only, GitHub web UI workflow.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Step-by-step numbered list with exact UI paths | e.g. "Click Settings → Pages → Source: Deploy from branch" | ✓ |
| Concise checklist with key steps only | Shorter, assumes more IT admin experience | |
| You decide | Claude picks based on audience | |

**User's choice:** Step-by-step with exact UI paths.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — include config field reference table | Field / Type / Example / Effect table | ✓ |
| No — just show example JSON inline | Self-documenting JSON is enough | |

**User's choice:** Include the config field reference table.

---

## Claude's Discretion

- Singleton pattern for sharing forkConfig across views (`getForkConfig()` from `src/fork-config.js`)
- Exact logo `alt` attribute text (use orgName)
- Module IDs in DEFAULT_FORK_CONFIG (use all 5 exact IDs from modules-config.js)

## Deferred Ideas

- Additional fork.config.json fields (contact URL, custom description, compliance-refs override) — user chose minimal 3-field schema
- Non-GitHub-Pages deployment options — deferred; out of scope for this phase
- Git CLI workflow section in FORK-GUIDE.md — deferred; IT admin audience
