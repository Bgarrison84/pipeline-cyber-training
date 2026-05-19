# Phase 12: Progress Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 12-progress-sync
**Areas discussed:** Share button surface, QR code UX, Import landing & feedback, ADR scope & depth

---

## Share Button Surface

**Q1 — Where does the Share button live?**

| Option | Description | Selected |
|--------|-------------|----------|
| Completion Summary only | Share button in the existing print footer alongside Print Training Log | ✓ |
| Sidebar footer + Completion Summary | Share in both places: sidebar footer AND completion summary | |
| Sidebar footer only | Always accessible from any view, not just the summary page | |

**User's choice:** Completion Summary only

---

**Q2 — What does clicking the Share button do?**

| Option | Description | Selected |
|--------|-------------|----------|
| Copy URL to clipboard | One click copies; "Copied!" inline confirmation for ~2 seconds | ✓ |
| Show URL + QR in an inline section | Expands section with URL text and QR image | |
| Open a full /share page | Navigates to dedicated share/export page | |

**User's choice:** Copy URL to clipboard (Recommended)

---

**Q3 — Where does the QR code appear?**

| Option | Description | Selected |
|--------|-------------|----------|
| Separate 'Show QR' button next to Share | Two buttons: Copy link + Show QR; QR renders in inline section below | ✓ |
| QR auto-shows with copy | One Share button; clicking copies AND renders QR simultaneously | |
| QR only on demand via modal | Separate button opens modal/overlay | |

**User's choice:** Separate 'Show QR' button next to Share (Recommended)

---

## QR Code UX

**Q1 — QR code render size?**

| Option | Description | Selected |
|--------|-------------|----------|
| 256×256 px | Standard scannable size at normal screen distance | ✓ |
| 128×128 px | Smaller; may be hard to scan with high-density lz-string data | |
| Auto-size | Library decides; risk of very large QR for full progress data | |

**User's choice:** 256×256 px (Recommended)

---

**Q2 — Show URL text alongside QR?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — URL text + QR together | Copyable URL above QR; desktop users can manually copy | ✓ |
| QR only | URL already copied by the Share button; no redundant text | |

**User's choice:** Yes — URL text + QR together (Recommended)

---

**Q3 — QR section in print output?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — print-hide class | QR section hidden in printed training log; log stays clean | ✓ |
| No — print it too | QR prints for supervisor verification | |

**User's choice:** Yes — print-hide class (Recommended)

---

## Import Landing & Feedback

**Q1 — What does a learner see after opening a share URL?**

| Option | Description | Selected |
|--------|-------------|----------|
| Banner + redirect to Completion Summary | Dismissible banner + auto-navigate to summary showing imported state | ✓ |
| Silent — app opens normally | No notification; progress loads, learner lands on home | |
| Dedicated import success view | Router renders a special 'Import successful' view before redirecting | |

**User's choice:** Banner notification + redirect to Completion Summary (Recommended)

---

**Q2 — Importing into a device with existing progress?**

| Option | Description | Selected |
|--------|-------------|----------|
| Fully automatic merge, no confirmation | Union of completed + higher quiz score wins; banner after merge | ✓ |
| Confirm before merging | Prompt: 'Merge with imported progress?' Accept/Cancel | |
| Offer merge vs overwrite choice | Merge / Replace all / Cancel prompt | |

**User's choice:** Fully automatic merge, no confirmation (Recommended)

---

**Q3 — Corrupted/invalid URL data?**

| Option | Description | Selected |
|--------|-------------|----------|
| Show error banner, keep existing progress | Error banner; existing progress intact; never wipes on failure | ✓ |
| Silent fail — load app normally | No error shown; app ignores bad ?data= and proceeds | |

**User's choice:** Show error banner, keep existing progress (Recommended)

---

## ADR Scope & Depth

**Q1 — What must the ADR cover beyond ROADMAP bullet points?**

| Option | Description | Selected |
|--------|-------------|----------|
| Just what ROADMAP specifies | Chosen approach + rejected alternatives; minimal and sufficient | ✓ |
| Also document URL length limits | Estimated lz-string output size and browser URL limit confirmation | |
| Full RFC-style with security analysis | Security considerations, credentials, public URL implications | |

**User's choice:** Just what ROADMAP specifies (Recommended)

---

**Q2 — Merge algorithm in ADR or plan-level detail?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — merge rules in ADR | Merge algorithm is architectural; documents intentional choice for future devs | ✓ |
| No — implementation detail | ADR covers approach selection only; merge rules in code/plan | |

**User's choice:** Yes — merge rules in ADR (Recommended)

---

## Claude's Discretion

- Exact banner UI implementation (position, dismiss mechanism) — follow established inline pattern or simple `role="status"` div.
- Whether `sync.js` exposes a minimal `encodeProgress()` / `decodeProgress()` pair or a richer API.
- Whether "Copy link" and "Show QR" buttons are styled as primary (accent) or secondary (border-only) relative to the existing Print button.

## Deferred Ideas

- URL length analysis — not an ADR concern; planner can verify lz-string output size during implementation.
- RFC-style security analysis in ADR — user confirmed ROADMAP spec is sufficient.
