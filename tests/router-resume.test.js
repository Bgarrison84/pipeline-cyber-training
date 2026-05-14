// tests/router-resume.test.js
// RED tests for Plan 03-02, Task 2: isInitialLoad auto-resume redirect in router.js
// Verifies that handleRoute() redirects to lastVisited when hash is empty or '#/'.
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { progressStore } from '../src/progress-store.js'

// ──────────────────────────────────────────────────────────────────────────────
// Helper: set up a minimal DOM that handleRoute() expects
// ──────────────────────────────────────────────────────────────────────────────
function setupDom() {
  document.body.innerHTML = '<div id="app"></div><nav id="sidebar"></nav>'
}

// ──────────────────────────────────────────────────────────────────────────────
// isInitialLoad redirect — handleRoute() reads getLastVisited()
// ──────────────────────────────────────────────────────────────────────────────
describe('handleRoute() isInitialLoad redirect', () => {
  beforeEach(async () => {
    setupDom()
    progressStore.resetProgress()
    localStorage.clear()
    await progressStore.init()

    // Reset the module-level _handledInitialLoad guard between tests
    const { _resetInitialLoadForTesting } = await import('../src/router.js')
    _resetInitialLoadForTesting()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('redirects to lastVisited lesson when hash is empty and lastVisited is set', async () => {
    // Set a lastVisited value that the router should pick up
    progressStore.markVisited('logging-auditing', 'intro')

    // Import dynamically so we get the module after setup
    const { handleRoute } = await import('../src/router.js')

    // Simulate initial load with empty hash
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hash: '' }
    })

    await handleRoute()

    // After redirect, hash should point to the lesson
    expect(window.location.hash).toBe('#/lesson/logging-auditing/intro')
  })

  it('redirects to lastVisited lesson when hash is exactly #/ and lastVisited is set', async () => {
    progressStore.markVisited('logging-auditing', 'event-logs')

    const { handleRoute } = await import('../src/router.js')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hash: '#/' }
    })

    await handleRoute()

    expect(window.location.hash).toBe('#/lesson/logging-auditing/event-logs')
  })

  it('does not redirect when hash is a lesson route (non-initial load)', async () => {
    progressStore.markVisited('logging-auditing', 'intro')

    const { handleRoute } = await import('../src/router.js')

    // Simulate navigation to a specific lesson (not initial load)
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hash: '#/lesson/logging-auditing/event-logs' }
    })

    await handleRoute()

    // Hash should remain on the lesson route (no redirect back to lastVisited)
    expect(window.location.hash).toBe('#/lesson/logging-auditing/event-logs')
  })

  it('does not redirect when hash is empty but getLastVisited() returns null', async () => {
    // No lastVisited set — fresh learner, hash is empty
    const { handleRoute } = await import('../src/router.js')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hash: '' }
    })

    // Should fall through to home view without redirecting
    await handleRoute()

    // Hash should still be empty (home rendered without redirect)
    expect(window.location.hash).toBe('')
  })
})
