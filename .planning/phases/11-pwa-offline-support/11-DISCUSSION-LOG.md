# Phase 11: PWA / Offline Support - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 11-PWA-Offline-Support
**Areas discussed:** Offline indicator, Install prompt, Update notification

---

## Offline Indicator

### Placement

| Option | Description | Selected |
|--------|-------------|----------|
| In the top-bar (right side) | Compact, alongside Compliance Index and Training Log links. Header is sticky so always visible. | ✓ |
| Fixed bottom-right corner | Floating badge. No practical advantage since header is already sticky. | |
| Below-header status strip | Full-width bar under the header. Only shows when offline — conflicts with PWA-03 "always visible." | |

**User's choice:** In the top-bar (right side)
**Notes:** Clean, consistent with existing nav links.

### Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Dot + text label | Colored circle + "Online"/"Offline" text. Green online, amber offline. | ✓ |
| Dot only (no text) | Just the color dot. Very compact, aria-label for screen readers. | |
| Icon + text | Lucide wifi/wifi-off icon + text. Larger but more explicit for non-technical admins. | |

**User's choice:** Dot + text label
**Notes:** Readable without being oversized.

### Offline Color

| Option | Description | Selected |
|--------|-------------|----------|
| Amber (orange-toned) | Consistent with app accent. Offline is a neutral state on air-gapped OT networks. | ✓ |
| Red | High-contrast warning color. Could alarm users who are intentionally offline. | |

**User's choice:** Amber
**Notes:** Aligns with the rationale that OT/air-gapped users are always offline — it's not an error.

---

## Install Prompt

### Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Suppress entirely | Intercept and discard beforeinstallprompt. Clean, no UI to explain. | |
| Opt-in "Install app" link in header | Small link in top-bar triggers deferred prompt. Opt-in, not a pop-up. | ✓ |
| Native browser prompt | Let browser decide when to show install banner. Least control. | |

**User's choice:** Opt-in "Install app" link in header
**Notes:** Useful for OT admins who want the app pinned to their taskbar/desktop on air-gapped machines.

### Visibility Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible (while installable) | From first visit, disappears after install. | ✓ |
| Only after completing any lesson | Wait for engagement before showing. Reduces first-impression clutter. | |

**User's choice:** Always visible (while installable)
**Notes:** Simple and discoverable.

---

## Update Notification

| Option | Description | Selected |
|--------|-------------|----------|
| Fully silent | autoUpdate + skipWaiting + clientsClaim. No notification. Takes effect on next load. | ✓ |
| 'Content updated' toast | Dismissible toast informs user content was updated. No forced reload. | |

**User's choice:** Fully silent
**Notes:** Compliance training sessions should not be interrupted by update UI.

---

## Claude's Discretion

- Exact PWA icon design (shield vs. "OT" lettermark) — keep simple, dark background with orange element.
- Whether `offline-indicator.js` uses a service worker message channel or just `window` online/offline events for real-time detection.
- Ordering of indicator vs. Install link in the header right group (indicator first as always-present, Install link second as conditional).

## Deferred Ideas

- "Online (cached)" vs. "Online (syncing)" distinction — PWA-03 only requires online/offline, not cache state.
- Cache quota / storage warning via `navigator.storage.estimate()`.
- Non-GitHub-Pages deployment service worker scope notes.
