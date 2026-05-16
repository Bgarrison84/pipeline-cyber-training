// tests/compliance-index-view.test.js
// Phase 06 Plan 01 Wave 0 — RED test stubs for compliance-index-view.js
// All tests FAIL (RED) because src/views/compliance-index-view.js does not yet exist.
// Implementation arrives in Plan 06-02 (Wave 1).
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — all vi.mock() calls BEFORE imports (Vitest hoisting requirement)
// ──────────────────────────────────────────────────────────────────────────────

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue('<span>TSA</span>'),
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderComplianceIndex } from '../src/views/compliance-index-view.js'
import { renderBadge } from '../src/badge.js'

// ──────────────────────────────────────────────────────────────────────────────
// Test fixture — compliance index manifest
// ──────────────────────────────────────────────────────────────────────────────

const COMPLIANCE_INDEX_JSON = {
  schemaVersion: 1,
  _comment: 'UPDATE CONTRACT: Add an entry whenever a lesson, exercise, or scenario adds complianceControls.',
  controls: [
    {
      id: 'TSA-Monitoring',
      label: 'TSA SD-02F — Continuous Monitoring',
      items: [
        {
          type: 'lesson',
          moduleId: 'logging-auditing',
          contentId: 'intro',
          title: 'Introduction to Windows Event Logs',
        },
        {
          type: 'lesson',
          moduleId: 'logging-auditing',
          contentId: 'ps-logging',
          title: 'Enabling PowerShell Script Block Logging',
        },
        {
          type: 'exercise',
          moduleId: 'logging-auditing',
          contentId: '01',
          title: 'Enable Script Block Logging',
        },
        {
          type: 'scenario',
          moduleId: 'logging-auditing',
          contentId: '01',
          title: 'Investigating a Suspicious Login',
        },
      ],
    },
    {
      id: 'NIST-AU-2',
      label: 'NIST SP 800-82 Rev 3 — AU-2: Event Logging',
      items: [
        {
          type: 'lesson',
          moduleId: 'logging-auditing',
          contentId: 'intro',
          title: 'Introduction to Windows Event Logs',
        },
        {
          type: 'lesson',
          moduleId: 'logging-auditing',
          contentId: 'audit-policies',
          title: 'Configuring Audit Policies via Group Policy',
        },
      ],
    },
  ],
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue(COMPLIANCE_INDEX_JSON),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────────────────────
// Successful render
// ──────────────────────────────────────────────────────────────────────────────

describe('renderComplianceIndex — successful fetch', () => {
  it('renders "Compliance Control Coverage" heading in #app', async () => {
    // FAILS (RED): renderComplianceIndex does not exist yet
    await renderComplianceIndex()
    expect(document.getElementById('app').textContent).toContain('Compliance Control Coverage')
  })

  it('renders a link with href="#/lesson/logging-auditing/intro" in #app', async () => {
    await renderComplianceIndex()
    const link = document.querySelector('a[href="#/lesson/logging-auditing/intro"]')
    expect(link).not.toBeNull()
  })

  it('renderBadge is called with "TSA-Monitoring" for each TSA control', async () => {
    await renderComplianceIndex()
    expect(renderBadge).toHaveBeenCalledWith(expect.stringContaining('TSA-Monitoring'), expect.anything())
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Fetch error handling
// ──────────────────────────────────────────────────────────────────────────────

describe('renderComplianceIndex — fetch error handling', () => {
  it('failed fetch (ok: false): DOM contains text "Compliance index unavailable"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await renderComplianceIndex()
    expect(document.getElementById('app').textContent).toContain('Compliance index unavailable')
  })
})
