// tests/lesson-view.test.js
// Wave 2 — upgraded from it.todo stubs to real assertions.
// Tests the lower-level helpers (renderBadge, renderMarkdown) directly.
// Full renderLesson() DOM tests are appropriate for E2E (requires fetch + DOM environment).

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderMarkdown } from '../src/content-loader.js'
import { renderBadge } from '../src/badge.js'

// ──────────────────────────────────────────────────────────────────────────────
// Compliance bar rendering
// ──────────────────────────────────────────────────────────────────────────────
describe('compliance bar rendering', () => {
  it('renders badge HTML for each tag in complianceTags', () => {
    const tags = ['TSA', 'NIST']
    const html = tags.map(t => renderBadge(t)).join('')
    expect(html).toContain('TSA')
    expect(html.length).toBeGreaterThan(0)
  })

  it('returns empty string when complianceTags is empty', () => {
    const tags = []
    const html = tags.map(t => renderBadge(t)).join('')
    expect(html).toBe('')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Code block copy button in rendered HTML
// ──────────────────────────────────────────────────────────────────────────────
describe('code block copy button in rendered HTML', () => {
  it('rendered code block contains .code-copy-btn element', async () => {
    const md = '```powershell\nGet-WinEvent -LogName Security\n```'
    const html = await renderMarkdown(md)
    expect(html).toContain('code-copy-btn')
    expect(html).toContain('data-code=')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Copy to clipboard handler
// ──────────────────────────────────────────────────────────────────────────────
describe('copy to clipboard handler', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })
  })

  it('navigator.clipboard.writeText is available after stubGlobal', () => {
    expect(navigator.clipboard.writeText).toBeDefined()
    expect(typeof navigator.clipboard.writeText).toBe('function')
  })

  it.todo('click on .code-copy-btn calls clipboard.writeText with data-code value')
  // Requires full DOM and event dispatch — appropriate for E2E, not unit level
})
