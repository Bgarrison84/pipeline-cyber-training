# Phase 2 — Discussion Log

**Date:** 2026-05-11
**Areas discussed:** Lesson frontmatter schema, Lesson view layout, Module 1 content scope, Sidebar activation

---

## Area 1: Lesson Frontmatter Schema

| Question | Options | Selection |
|----------|---------|-----------|
| How should compliance control IDs be referenced? | Directive keys only / Specific control IDs / Both layers | **Both layers** — complianceTags[] for badges + complianceControls[] for Phase 6 compliance index |
| What other fields in frontmatter? | Minimal / Full metadata / Minimal + OT flag | **Minimal** — title, lessonId, moduleId, order, complianceTags[], complianceControls[] |
| How should OT callout blocks be authored? | > [!OT] blockquote / ::: fenced div / HTML comment | **> [!OT] blockquote** — mirrors GitHub callout convention, readable as plain Markdown |

---

## Area 2: Lesson View Layout

| Question | Options | Selection |
|----------|---------|-----------|
| Reading width | Max-width prose column / Full viewport / Two-column + TOC | **Max-width responsive** — 720px centered, full-width on mobile |
| Lesson navigation | Sidebar + prev/next / Sidebar only / Breadcrumb + prev/next | **Sidebar activates + prev/next footer buttons** |
| Code block styling | Container with header + copy button / Minimal Shiki / Light background | **Container with header bar (language label) + copy button top-right** |

---

## Area 3: Module 1 Content Scope

| Question | Options | Selection |
|----------|---------|-----------|
| Lesson count | 3 lessons / 4-5 lessons / Consolidate to 2 | **3 lessons** — intro, ps-logging, audit-policies |
| Target depth | Admin-level task-focused / Introductory / Reference-style | **Admin-level** — 400–600 words, 3–5 PS code blocks per lesson |
| Environment identifiers | Generic CLAUDE.md names / Fictional company / Claude decides | **CLAUDE.md spec** — PIPELINE-DC01, 10.0.0.0/24, ExampleCorp |

---

## Area 4: Sidebar Activation

| Question | Options | Selection |
|----------|---------|-----------|
| Which lessons activate | Data-driven (by file existence) / All upfront / Manual flag | **Data-driven** — lesson becomes link when .md file exists at expected path |
| Active lesson indicator | Same accent-border as module / Bold + dot / Background only | **Same accent-border** — 3px var(--color-accent) border, consistent with active module |

---

## Deferred Ideas

None.

## Claude's Discretion Items

- Shiki integration approach (static bundle vs lazy-load)
- marked.js renderer structure
- Copy button implementation
- module.json schema
- Quiz/exercise/scenario placeholder shapes
- Loading and error states
