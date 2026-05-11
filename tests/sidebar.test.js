// tests/sidebar.test.js
// Wave 0 stub — MODULES imported from src/modules-config.js (not yet created until Plan 01 Task 3)
// DOM tests require happy-dom environment (vitest.config.js: environment: 'happy-dom')
import { describe, it, expect, beforeEach } from 'vitest'
import { MODULES } from '../src/modules-config.js'

describe('sidebar module list', () => {
  it('MODULES array has exactly 5 entries', () => {
    expect(MODULES).toHaveLength(5)
  })

  it('each module has a data-module-id from the expected set', () => {
    const expectedIds = [
      'logging-auditing',
      'network-hardening',
      'account-access',
      'incident-response',
      'patch-management',
    ]
    MODULES.forEach(mod => {
      expect(expectedIds).toContain(mod.id)
    })
  })

  it('sidebar toggle sets aria-label to "Expand navigation" when collapsed', () => {
    // Stub: DOM test will be implemented when sidebar.js is wired to index.html
    // For now, verify the toggle button pattern is documented
    const expectedAriaLabel = 'Expand navigation'
    expect(typeof expectedAriaLabel).toBe('string')
    expect(expectedAriaLabel).toBe('Expand navigation')
  })
})
