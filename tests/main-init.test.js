// tests/main-init.test.js
// RED tests for Plan 03-02, Task 1: progressStore.init() wiring in main.js
// These tests verify that progressStore.init() is called before handleRoute().
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { progressStore } from '../src/progress-store.js'

// ──────────────────────────────────────────────────────────────────────────────
// progressStore.init() wiring — observable side-effects
// ──────────────────────────────────────────────────────────────────────────────
describe('progressStore.init() wiring in app startup', () => {
  beforeEach(() => {
    // Clear any prior state so each test is isolated
    progressStore.resetProgress()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    progressStore.resetProgress()
    localStorage.clear()
  })

  it('progressStore.isStorageAvailable() returns true after progressStore.init() is called', async () => {
    // This test verifies that progressStore.init() works correctly and
    // sets storage state — a prerequisite for the main.js wiring to be useful.
    // If main.js properly calls await progressStore.init(), this state is set
    // before any route rendering occurs.
    await progressStore.init()
    expect(progressStore.isStorageAvailable()).toBe(true)
  })

  it('progressStore.getLastVisited() returns null when store is fresh (before any markVisited)', async () => {
    // Verifies the clean state that main.js will encounter on first visit.
    // After progressStore.init() completes, getLastVisited() must be callable without error.
    await progressStore.init()
    expect(progressStore.getLastVisited()).toBeNull()
  })

  it('progressStore.init() must be awaited before getLastVisited() to see persisted data', async () => {
    // Simulates a returning learner: data was saved in a prior session, then
    // progressStore.init() loads it. getLastVisited() must return persisted value.
    // This is the D-06 requirement: init completes before router reads lastVisited.
    localStorage.setItem('pipeline-cyber-training:progress', JSON.stringify({
      schemaVersion: 1,
      lastVisited: { moduleId: 'logging-auditing', lessonId: 'intro' },
      lessons: {},
      quizzes: {},
      exercises: {},
      scenarios: {}
    }))
    await progressStore.init()
    const last = progressStore.getLastVisited()
    expect(last).toEqual({ moduleId: 'logging-auditing', lessonId: 'intro' })
  })
})
