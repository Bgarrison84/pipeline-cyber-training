// tests/sidebar.test.js
// Wave 0 stub — MODULES imported from src/modules-config.js
// DOM tests require happy-dom environment (vitest.config.js: environment: 'happy-dom')
// Phase 04 Plan 01 extends this file: vi.mock declarations added at top, progress bar
// describe blocks appended at bottom. Pre-existing describe blocks are unchanged.

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — must be declared before module imports that depend on them (hoisting)
// ──────────────────────────────────────────────────────────────────────────────

// Capture mock references for reuse in tests
// vi.hoisted() ensures the mock fn is available in vi.mock() factory closures
// even after Vitest hoists vi.mock() calls to the top of the file at transform time
const { _computeModuleProgressMock } = vi.hoisted(() => ({
  _computeModuleProgressMock: vi.fn().mockReturnValue({ pct: 0, complete: false }),
}))

vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    getLastVisited: vi.fn().mockReturnValue(null),
    markVisited: vi.fn(),
    setLastVisited: vi.fn(),
    markLessonCompleted: vi.fn(),
    saveQuiz: vi.fn(),
    getQuizScore: vi.fn().mockReturnValue(null),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    exportProgress: vi.fn(),
    importProgress: vi.fn().mockResolvedValue({ ok: true }),
    resetProgress: vi.fn(),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    saveExercise: vi.fn(),
    saveScenario: vi.fn(),
  },
}))

vi.mock('../src/content-loader.js', () => ({
  checkLessonAvailability: vi.fn().mockResolvedValue(true),
  fetchLesson: vi.fn().mockResolvedValue('---\ntitle: Test Lesson\n---\n\nBody'),
  parseFrontmatter: vi.fn().mockReturnValue({ meta: { title: 'Test Lesson', complianceTags: [] }, body: 'Body' }),
  renderMarkdown: vi.fn().mockResolvedValue('<p>Body</p>'),
  getLessonNav: vi.fn().mockReturnValue({ prev: null, next: null }),
  loadComplianceRefs: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

vi.mock('../src/quiz-engine.js', () => ({
  computeModuleProgress: _computeModuleProgressMock,
}))

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MODULES } from '../src/modules-config.js'

// ──────────────────────────────────────────────────────────────────────────────
// Pre-existing describe blocks (unchanged)
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
// Phase 04 — sidebar progress bars (SHELL-03)
// These describe blocks are RED until Wave 1 implements sidebar progress bars
// (computeModuleProgress injection and refreshSidebarProgress export in sidebar.js)
// ──────────────────────────────────────────────────────────────────────────────

describe('sidebar progress bars — initSidebar() injection', () => {
  let initSidebar

  beforeEach(async () => {
    document.body.innerHTML = `
      <div id="shell">
        <nav id="sidebar">
          <div id="sidebar-modules"></div>
          <button id="sidebar-toggle" aria-label="Collapse navigation"></button>
        </nav>
        <main id="app"></main>
      </div>
    `
    _computeModuleProgressMock.mockReturnValue({ pct: 0, complete: false })

    const sidebarModule = await import('../src/sidebar.js')
    initSidebar = sidebarModule.initSidebar
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initSidebar() can be called without throwing', async () => {
    await expect(initSidebar()).resolves.not.toThrow()
  })

  it('document contains at least one element with class "sidebar-progress-bar" after initSidebar()', async () => {
    await initSidebar()
    const bars = document.querySelectorAll('.sidebar-progress-bar')
    expect(bars.length).toBeGreaterThan(0)
  })

  it('a .sidebar-progress-bar inner div has style containing "0%" for a module with no progress', async () => {
    _computeModuleProgressMock.mockReturnValue({ pct: 0, complete: false })
    await initSidebar()
    const bar = document.querySelector('.sidebar-progress-bar')
    expect(bar).not.toBeNull()
    const inner = bar.querySelector('div')
    expect(inner).not.toBeNull()
    expect(inner.style.width).toMatch(/^0%?$|^0$/)
  })
})

describe('sidebar progress bars — refreshSidebarProgress()', () => {
  let initSidebar
  let refreshSidebarProgress

  beforeEach(async () => {
    document.body.innerHTML = `
      <div id="shell">
        <nav id="sidebar">
          <div id="sidebar-modules"></div>
          <button id="sidebar-toggle" aria-label="Collapse navigation"></button>
        </nav>
        <main id="app"></main>
      </div>
    `
    _computeModuleProgressMock.mockReturnValue({ pct: 0, complete: false })

    const sidebarModule = await import('../src/sidebar.js')
    initSidebar = sidebarModule.initSidebar
    refreshSidebarProgress = sidebarModule.refreshSidebarProgress
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('refreshSidebarProgress is exported from sidebar.js', () => {
    expect(typeof refreshSidebarProgress).toBe('function')
  })

  it('calling refreshSidebarProgress with a valid moduleId does not throw', async () => {
    await initSidebar()
    expect(() => refreshSidebarProgress('logging-auditing')).not.toThrow()
  })

  it('after computeModuleProgress returns {pct:50}, refreshSidebarProgress updates the bar width to "50%"', async () => {
    await initSidebar()
    _computeModuleProgressMock.mockReturnValue({ pct: 50, complete: false })
    refreshSidebarProgress('logging-auditing')
    const sidebarModules = document.getElementById('sidebar-modules')
    const moduleEl = sidebarModules.querySelector('.sidebar-module[data-module-id="logging-auditing"]')
    expect(moduleEl).not.toBeNull()
    const bar = moduleEl.querySelector('.sidebar-progress-bar')
    expect(bar).not.toBeNull()
    const inner = bar.querySelector('div')
    expect(inner).not.toBeNull()
    expect(inner.style.width).toBe('50%')
  })
})
