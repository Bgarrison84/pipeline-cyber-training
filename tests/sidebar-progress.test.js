// tests/sidebar-progress.test.js
// Phase 03 Plan 03 — RED tests for sidebar.js export/import footer (Task 1)
// and lesson-view.js markVisited + storage warning (Task 2)
// happy-dom environment (vitest.config.js)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ──────────────────────────────────────────────────────────────────────────────
// Mocks — must be declared before module imports that depend on them
// ──────────────────────────────────────────────────────────────────────────────

// Mock progressStore so tests control its behavior
vi.mock('../src/progress-store.js', () => ({
  progressStore: {
    init: vi.fn().mockResolvedValue(undefined),
    isStorageAvailable: vi.fn().mockReturnValue(true),
    getLastVisited: vi.fn().mockReturnValue(null),
    markVisited: vi.fn(),
    setLastVisited: vi.fn(),
    exportProgress: vi.fn(),
    importProgress: vi.fn().mockResolvedValue({ ok: true }),
    resetProgress: vi.fn(),
    getLessonProgress: vi.fn().mockReturnValue({ visited: false, completed: false }),
    getQuizScore: vi.fn().mockReturnValue(null),
    getExerciseCompletion: vi.fn().mockReturnValue(null),
    getScenarioCompletion: vi.fn().mockReturnValue(null),
    markLessonCompleted: vi.fn(),
    saveQuiz: vi.fn(),
    saveExercise: vi.fn(),
    saveScenario: vi.fn(),
  },
}))

// Mock router.js — handleRoute used by import success handler
vi.mock('../src/router.js', () => ({
  handleRoute: vi.fn().mockResolvedValue(undefined),
  matchRoute: vi.fn().mockReturnValue({ view: 'home', params: {} }),
}))

// Mock modules-config.js
vi.mock('../src/modules-config.js', () => ({
  MODULES: [
    {
      id: 'logging-auditing',
      title: 'Logging & Auditing',
      icon: 'file-text',
      lessons: [{ id: '01-intro', title: 'Introduction' }],
    },
  ],
}))

// Mock content-loader.js
vi.mock('../src/content-loader.js', () => ({
  checkLessonAvailability: vi.fn().mockResolvedValue(true),
  fetchLesson: vi.fn().mockResolvedValue('---\ntitle: Test Lesson\n---\n\nBody'),
  parseFrontmatter: vi.fn().mockReturnValue({ meta: { title: 'Test Lesson', complianceTags: [] }, body: 'Body' }),
  renderMarkdown: vi.fn().mockResolvedValue('<p>Body</p>'),
  getLessonNav: vi.fn().mockReturnValue({ prev: null, next: null }),
  loadComplianceRefs: vi.fn().mockResolvedValue(undefined),
}))

// Mock utils/icons.js — activateIcons is now imported from here by sidebar.js and lesson-view.js
vi.mock('../src/utils/icons.js', () => ({
  activateIcons: vi.fn(),
}))

// Mock badge.js
vi.mock('../src/badge.js', () => ({
  renderBadge: vi.fn().mockReturnValue(''),
}))

// ──────────────────────────────────────────────────────────────────────────────
// Task 1: sidebar.js export/import footer
// ──────────────────────────────────────────────────────────────────────────────

describe('sidebar.js — export/import footer (Task 1)', () => {
  let progressStoreMock
  let handleRouteMock
  let initSidebar

  beforeEach(async () => {
    // Reset DOM before each test
    document.body.innerHTML = `
      <div id="shell">
        <nav id="sidebar">
          <div id="sidebar-modules"></div>
          <button id="sidebar-toggle" aria-label="Collapse navigation"></button>
        </nav>
        <main id="app"></main>
      </div>
    `
    // Get mock references
    const psModule = await import('../src/progress-store.js')
    progressStoreMock = psModule.progressStore
    const routerModule = await import('../src/router.js')
    handleRouteMock = routerModule.handleRoute

    // Import the REAL sidebar module (not mocked)
    const sidebarModule = await import('../src/sidebar.js')
    initSidebar = sidebarModule.initSidebar
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initSidebar inserts a footer with id="sidebar-progress-footer"', async () => {
    await initSidebar()
    const footer = document.getElementById('sidebar-progress-footer')
    expect(footer).not.toBeNull()
  })

  it('footer is inserted before #sidebar-toggle (not appended after)', async () => {
    await initSidebar()
    const sidebar = document.getElementById('sidebar')
    const footer = document.getElementById('sidebar-progress-footer')
    const toggleBtn = document.getElementById('sidebar-toggle')
    const children = Array.from(sidebar.children)
    const footerIdx = children.indexOf(footer)
    const toggleIdx = children.indexOf(toggleBtn)
    expect(footer).not.toBeNull()
    expect(footerIdx).toBeGreaterThanOrEqual(0)
    expect(footerIdx).toBeLessThan(toggleIdx)
  })

  it('footer contains a button with id="btn-export-progress"', async () => {
    await initSidebar()
    const btn = document.getElementById('btn-export-progress')
    expect(btn).not.toBeNull()
    expect(btn.tagName.toLowerCase()).toBe('button')
    expect(btn.textContent.trim()).toBe('Export my progress')
  })

  it('footer contains a button with id="btn-import-progress"', async () => {
    await initSidebar()
    const btn = document.getElementById('btn-import-progress')
    expect(btn).not.toBeNull()
    expect(btn.tagName.toLowerCase()).toBe('button')
    expect(btn.textContent.trim()).toBe('Import progress')
  })

  it('footer contains a hidden file input with id="import-file-input"', async () => {
    await initSidebar()
    const input = document.getElementById('import-file-input')
    expect(input).not.toBeNull()
    expect(input.type).toBe('file')
    expect(input.accept).toBe('.json')
  })

  it('footer contains a span with id="import-error-msg" that is empty by default', async () => {
    await initSidebar()
    const errEl = document.getElementById('import-error-msg')
    expect(errEl).not.toBeNull()
    expect(errEl.textContent.trim()).toBe('')
  })

  it('clicking btn-export-progress calls progressStore.exportProgress()', async () => {
    await initSidebar()
    const btn = document.getElementById('btn-export-progress')
    expect(btn).not.toBeNull()
    btn.click()
    expect(progressStoreMock.exportProgress).toHaveBeenCalledTimes(1)
  })

  it('clicking btn-import-progress triggers file input click', async () => {
    await initSidebar()
    const fileInput = document.getElementById('import-file-input')
    expect(fileInput).not.toBeNull()
    const clickSpy = vi.spyOn(fileInput, 'click')
    const importBtn = document.getElementById('btn-import-progress')
    importBtn.click()
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('file input change event calls progressStore.importProgress with selected file', async () => {
    await initSidebar()
    const fileInput = document.getElementById('import-file-input')
    expect(fileInput).not.toBeNull()
    const fakeFile = new File(
      ['{"schemaVersion":1,"lessons":{},"quizzes":{},"exercises":{},"scenarios":{}}'],
      'test.json',
      { type: 'application/json' }
    )
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], configurable: true })
    fileInput.dispatchEvent(new Event('change'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(progressStoreMock.importProgress).toHaveBeenCalledWith(fakeFile)
  })

  it('on successful import, onImportSuccess callback is called', async () => {
    progressStoreMock.importProgress.mockResolvedValue({ ok: true })
    // Pass handleRouteMock as onImportSuccess so the sidebar can invoke it
    await initSidebar({ onImportSuccess: handleRouteMock })
    const fileInput = document.getElementById('import-file-input')
    expect(fileInput).not.toBeNull()
    const fakeFile = new File(
      ['{"schemaVersion":1,"lessons":{},"quizzes":{},"exercises":{},"scenarios":{}}'],
      'test.json',
      { type: 'application/json' }
    )
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], configurable: true })
    fileInput.dispatchEvent(new Event('change'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(handleRouteMock).toHaveBeenCalledTimes(1)
  })

  it('on failed import, import-error-msg shows the error text', async () => {
    progressStoreMock.importProgress.mockResolvedValue({
      ok: false,
      error: 'Not a valid progress file (missing schemaVersion).',
    })
    await initSidebar()
    const fileInput = document.getElementById('import-file-input')
    expect(fileInput).not.toBeNull()
    const fakeFile = new File(['not-json'], 'bad.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [fakeFile], configurable: true })
    fileInput.dispatchEvent(new Event('change'))
    await new Promise(resolve => setTimeout(resolve, 20))
    const errEl = document.getElementById('import-error-msg')
    expect(errEl?.textContent).toBe('Not a valid progress file (missing schemaVersion).')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Task 2: lesson-view.js markVisited + storage warning
// ──────────────────────────────────────────────────────────────────────────────

describe('lesson-view.js — markVisited + setLastVisited in post-render block (Task 2)', () => {
  let progressStoreMock
  let renderLesson

  beforeEach(async () => {
    document.body.innerHTML = `<div id="app"></div>`
    const psModule = await import('../src/progress-store.js')
    progressStoreMock = psModule.progressStore
    progressStoreMock.isStorageAvailable.mockReturnValue(true)

    // Import REAL lesson-view module
    const lvModule = await import('../src/views/lesson-view.js')
    renderLesson = lvModule.renderLesson
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renderLesson calls progressStore.markVisited(moduleId, lessonId) after render', async () => {
    await renderLesson({ moduleId: 'logging-auditing', lessonId: '01-intro' })
    expect(progressStoreMock.markVisited).toHaveBeenCalledWith('logging-auditing', '01-intro')
  })

  it('renderLesson calls progressStore.setLastVisited(moduleId, lessonId) after render', async () => {
    await renderLesson({ moduleId: 'logging-auditing', lessonId: '01-intro' })
    expect(progressStoreMock.setLastVisited).toHaveBeenCalledWith('logging-auditing', '01-intro')
  })

  it('no storage-warning div in DOM when isStorageAvailable() returns true', async () => {
    progressStoreMock.isStorageAvailable.mockReturnValue(true)
    await renderLesson({ moduleId: 'logging-auditing', lessonId: '01-intro' })
    const warning = document.querySelector('.storage-warning')
    expect(warning).toBeNull()
  })

  it('storage-warning div is prepended to .lesson-column when isStorageAvailable() returns false', async () => {
    progressStoreMock.isStorageAvailable.mockReturnValue(false)
    await renderLesson({ moduleId: 'logging-auditing', lessonId: '01-intro' })
    const warning = document.querySelector('.storage-warning')
    expect(warning).not.toBeNull()
  })

  it('storage-warning has role="alert"', async () => {
    progressStoreMock.isStorageAvailable.mockReturnValue(false)
    await renderLesson({ moduleId: 'logging-auditing', lessonId: '01-intro' })
    const warning = document.querySelector('.storage-warning')
    expect(warning?.getAttribute('role')).toBe('alert')
  })

  it('storage-warning is the first child of .lesson-column', async () => {
    progressStoreMock.isStorageAvailable.mockReturnValue(false)
    await renderLesson({ moduleId: 'logging-auditing', lessonId: '01-intro' })
    const lessonColumn = document.querySelector('.lesson-column')
    expect(lessonColumn).not.toBeNull()
    const firstChild = lessonColumn?.firstElementChild
    expect(firstChild?.classList.contains('storage-warning')).toBe(true)
  })
})
