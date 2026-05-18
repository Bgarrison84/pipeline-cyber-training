// tests/badge-expired.test.js
// Phase 09 Plan 01 Wave 0 — RED tests for badge.js expired state rendering
// All 6 tests FAIL (RED) until Wave 1 adds an expired branch to renderBadge().
// happy-dom environment (vitest.config.js: environment: 'happy-dom')

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setComplianceRefs, renderBadge } from '../src/badge.js'

// ──────────────────────────────────────────────────────────────────────────────
// Test fixture — TSA entry with status: 'expired', NIST entry without status
// ──────────────────────────────────────────────────────────────────────────────

const EXPIRED_REFS = {
  directives: {
    TSA:  { shortName: 'TSA SD-02F', status: 'expired' },
    NIST: { shortName: 'NIST SP 800-82 Rev 3' },
  },
}

beforeEach(() => {
  setComplianceRefs(EXPIRED_REFS)
})

afterEach(() => {
  setComplianceRefs(null)
})

// ──────────────────────────────────────────────────────────────────────────────
// Badge expired state — 6 RED tests
// ──────────────────────────────────────────────────────────────────────────────

describe('renderBadge — expired state', () => {
  it('renders text-decoration: line-through when TSA status is expired', () => {
    const html = renderBadge('TSA')
    expect(html).toContain('text-decoration: line-through')
  })

  it('renders [EXPIRED] label when TSA status is expired', () => {
    const html = renderBadge('TSA')
    expect(html).toContain('[EXPIRED]')
  })

  it('renders a title= attribute when TSA status is expired', () => {
    const html = renderBadge('TSA')
    expect(html).toContain('title=')
  })

  it('renders an aria-label= attribute when TSA status is expired', () => {
    const html = renderBadge('TSA')
    expect(html).toContain('aria-label=')
  })

  it('does NOT render [EXPIRED] when NIST has no status field', () => {
    const html = renderBadge('NIST')
    expect(html).not.toContain('[EXPIRED]')
  })

  it('renders NIST SP 800-82 Rev 3 shortName when NIST has no status field', () => {
    const html = renderBadge('NIST')
    expect(html).toContain('NIST SP 800-82 Rev 3')
  })
})
